const http = require('http');
const config = require('./config.json');
const JWT = require('./utils/jwt.js');
const story = require('./utils/story.js');
const BodyParser = require("body-parser");
const Express = require("express");
const cors = require("cors");
const hostname = '127.0.0.1';
const port = 3000;
const adminapp = require('firebase-admin');
admin = adminapp.initializeApp(config.initFB);
const firebase = require('firebase');
//const fire_app = firebase.initializeApp(config.initFB);

const auth = admin.auth();

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
 
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
var app = Express();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.use(cors());

app.listen(process.env.PORT || 5000, () => {
    if (!firebase.apps.length) {
        firebase.initializeApp({});
     }
    firebase.auth().signInWithEmailAndPassword(config.fb_email, config.fb_pwd).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error(errorMessage);
        // ...
      }); ;
});

app.get("/scenarios", async (request, response) => {
    try {
        isValidTk$ = await JWT.validateToken(request.headers.authorization, auth );
        resp = await story.getScenarios();
        response.status(200).json(resp);
    } catch (error) {
        response.status(500).send(error);
    }
});
app.get("/scenarios/:scenarioId", async (request, response) => {
    try {
        isValidTk$ = await JWT.validateToken(request.headers.authorization, auth );
        if(request.params.scenarioId){
            resp = await story.getScenario(request.params.scenarioId);
            response.status(200).json(resp);
        }else{
            throw new Error('404: Resources unavailable')
        }
    } catch (error) {
        response.status(500).send(error);
    }
});

app.get("/scenarios/:scenarioId/scenes/:sceneId", async (request, response) => {
    try {
        isValidTk$ = await JWT.validateToken(request.headers.authorization, auth );
        if(request.params.scenarioId){
            scenario = await story.getScenario(request.params.scenarioId);
            scene = scenario.scenes.filter(_=>_.id === request.params.sceneId );
            scene[0].imgSrc = await story.encodeBase64(scene[0].imgSrc)
            response.status(200).json((scene[0]));
        }else{
            throw new Error('404: Resources unavailable')
        }
    } catch (error) {
        response.status(500).send(error);
    }
});

app.get("/base64/:url", async (request, response) => {
    try {
        isValidTk$ = await JWT.validateToken(request.headers.authorization, auth );
        if(request.params.url){
            response.status(200).json(await story.encodeBase64(Buffer.from(request.params.url, 'base64').toString()));
        }else{
            throw new Error('404: Resources unavailable')
        }
    } catch (error) {
        response.status(500).send(error);
    }
});