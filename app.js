const http = require('http');
const config = require('./config.json');
const JWT = require('./utils/jwt.js');
const story = require('./utils/story.js');
const BodyParser = require("body-parser");
const Express = require("express");
const cors = require("cors");
const fs = require('fs');
const hostname = '127.0.0.1';
const port = 3000;

const adminapp = require('firebase-admin');
admin = adminapp.initializeApp(config.initFB);
const firebase = require('firebase');
//const fire_app = firebase.initializeApp(config.initFB);
const auth = admin.auth();

/*const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
    
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});*/
var app = Express();
global.__basedir = __dirname;
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.use(cors());

app.listen(process.env.PORT || 5000, () => {
    if(process.env.PORT){
        console.log('port:'+ process.env.PORT );
    }
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

app.get("/up", async (request, response) => {
        response.status(200).json("story:0.0.1");
  
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

app.post("/videos", async (request, response) => {
    try {
        isValidTk$ = await JWT.validateToken(request.headers.authorization, auth );
        await story.upload(request, response );
       
    } catch (error) {
        response.status(500).send(error);
    }
}); 


app.get("/videos", (req, res) => {
    try {
       // story.streamVideo(request, response );
       const filename = req.query.scene;
    const f = __basedir + config.streaming.path + '/' + filename;
    const stat = fs.statSync(f)
    console.log(stat.size);
    const fileSize = stat.size
    const range = req.headers.range
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] 
        ? parseInt(parts[1], 10)
        : fileSize-1
      const chunksize = (end-start)+1
      const file = fs.createReadStream(f, {start, end})
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      }
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      }
      res.writeHead(200, head)
      fs.createReadStream(f).pipe(res)
    }
    } catch (error) {
        res.status(500).send(error);
    }
});


