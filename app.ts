import * as  BodyParser from "body-parser";
import cors from "cors";
import Express from "express";
import * as  firebase from "firebase";
import * as  adminapp from "firebase-admin";
import * as  fs from "fs";
import Stripe from "stripe";
import * as  config from "./config.json";
import { PaymentStatus, Product } from "./models/model";
import JWT from "./utils/jwt";
import Pay from "./utils/payment";
import StoryManager from "./utils/story";

declare var __dirname;
declare var __basedir;
declare var baseUrl;
declare var path;
const hostname = "127.0.0.1";
const port = 3000;
const stripe = new Stripe("sk_test_5CTtiz5OLcQsixmLxKRxJsBN", { apiVersion: "2020-08-27" });

const admin = adminapp.initializeApp(config.initFB);
const payment = new Pay();
const endpointSecret = "whsec_utcQpzRFZPWgTxsIxLPfuLrzdkYyP2cA";
// const fire_app = firebase.initializeApp(config.initFB);
const auth = admin.auth();
const jwt = new JWT();
const story = new StoryManager();

/*const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Hello World");
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});*/
const app = Express();
// global.__basedir = __dirname;
app.use(cors());
app.use(BodyParser.json({
    // Because Stripe needs the raw body, we compute it but only when hitting the Stripe callback URL.
    verify: (req: any, res, buf) => {
        const url = req.originalUrl;
        if (url.startsWith("/payments")) {
            req.rawBody = buf.toString();
        }
    }
}));
app.use(BodyParser.urlencoded({ extended: true }));

app.listen(process.env.PORT || 5000, () => {
    if (process.env.PORT) {
        console.log("port:" + process.env.PORT);
    }
    if (!firebase.apps.length) {
        firebase.initializeApp({});
    }
    firebase.auth().signInWithEmailAndPassword(config.fb_email, config.fb_pwd).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorMessage);
        // ...
    });
});

app.get("/up", async (request, response) => {
    response.status(200).json("story:0.0.1");

});
app.get("/scenarios", async (request, response) => {
    try {
        const isValidTk$ = await jwt.validateToken(request.headers.authorization, auth);
        const resp = await story.getScenarios();
        response.status(200).json(resp);
    } catch (error) {
        response.status(500).send(error);
    }
});
app.get("/scenarios/:scenarioId", async (request, response) => {
    try {
        const isValidTk$ = await jwt.validateToken(request.headers.authorization, auth);
        if (request.params.scenarioId) {
            const resp = await story.getScenario(request.params.scenarioId);
            response.status(200).json(resp);
        } else {
            throw new Error("404: Resources unavailable")
        }
    } catch (error) {
        response.status(500).send(error);
    }
});

app.get("/scenarios/:scenarioId/scenes/:sceneId", async (request, response) => {
    try {
        const isValidTk$ = await jwt.validateToken(request.headers.authorization, auth);
        if (request.params.scenarioId) {
            const scenario = await story.getScenario(request.params.scenarioId);
            const scene = scenario.scenes.filter(_ => _.id === request.params.sceneId);
            scene[0].imgSrc = await story.encodeBase64(scene[0].imgSrc);
            response.status(200).json((scene[0]));
        } else {
            throw new Error("404: Resources unavailable");
        }
    } catch (error) {
        response.status(500).send(error);
    }
});

app.get("/base64/:url", async (request, response) => {
    try {
        const isValidTk$ = await jwt.validateToken(request.headers.authorization, auth);
        if (request.params.url) {
            response.status(200).json(await story.encodeBase64(Buffer.from(request.params.url, "base64").toString()));
        } else {
            throw new Error("404: Resources unavailable");
        }
    } catch (error) {
        response.status(500).send(error);
    }
});

app.post("/videos", async (request, response) => {
    try {
        const isValidTk$ = await jwt.validateToken(request.headers.authorization, auth);
        await story.upload(request, response);

    } catch (error) {
        response.status(500).send(error);
    }
});

app.post("/create-payment-intent", async (req, res) => {
    const { items } = req.body;
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        amount: payment.calculateOrderAmount(items),
        currency: "eur",
    });
    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

app.post("/create-checkout-session", async (req, res) => {
    const isValidTk$ = await jwt.validateToken(req.headers.authorization, auth);
    const product = await (await payment.getProductById(req.body.productId)).data() as Product;
    const p = {
        client_reference_id: jwt.getUserDataByKeyFromJWTPayload('user_id', req.headers.authorization),
        payment_method_types: ["card"],
        // tslint:disable-next-line:object-literal-sort-keys
        line_items: [
            {
                price_data: {
                    currency: "eur",
                    product_data: {
                        images: [product.imgSrc],
                        name: product.name,
                    },
                    unit_amount: product.price * 100,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
        success_url: product.specificUrlSuccess,
        cancel_url: product.specificUrlFailure,
    } as Stripe.Checkout.SessionCreateParams;
    const session = await stripe.checkout.sessions.create(p);
    const payload = payment.setPayload(session, product);
    payload.status = payment.getInitStatus();
    payment.recordPayment(payload, p.client_reference_id);
    res.json({ id: session.id });
});

app.post("/payments/webhooks", BodyParser.raw({ type: "application/json" }), (request: any, response) => {
    let event;
    try {
        const sig = request.headers["stripe-signature"];
        console.info("webhooks debut");
        console.info(sig);
        event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret) as Stripe.Event;
        console.info(event);
        // Handle the event
        switch (event.type) {
            case "payment_intent.succeeded":
                const paymentIntent = event.data.object;
                console.log("PaymentIntent was successful!");
                break;
            case "payment_method.attached":
                const paymentMethod = event.data.object;
                console.log("PaymentMethod was attached to a Customer!");
                break;
            case "checkout.session.completed":
                console.log("PaymentIntent was completed!");
                payment.updatePayment(event, PaymentStatus.COMPLETED);
                break;
            // ... handle other event types
            case "payment_intent.canceled":
                console.log("PaymentIntent was canceled!");
                payment.updatePayment(event, PaymentStatus.CANCELED);
                break;
            case "payment_intent.payment_failed":
                console.log("PaymentIntent was failed!");
                payment.updatePayment(event, PaymentStatus.FAILED);
                //implement warning system
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        if (event) {
            payment.updatePayment(event, PaymentStatus.ERROR);
        }
    }
    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
});

app.get("/videos", (req, res) => {
    try {
        // story.streamVideo(request, response );
        const filename = req.query.scene;
        const f = __dirname + config.streaming.path + "/" + filename;
        const stat = fs.statSync(f);
        console.log(stat.size);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(f, { start, end });
            const head = {
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Content-Type": "video/mp4",
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                "Content-Length": fileSize,
                "Content-Type": "video/mp4",
            };
            res.writeHead(200, head);
            fs.createReadStream(f).pipe(res);
        }
    } catch (error) {
        res.status(500).send(error);
    }
});
