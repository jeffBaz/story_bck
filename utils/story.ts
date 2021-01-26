import * as firebase from "firebase";
import * as fs from "fs";
import Fetch from "node-fetch";
import * as p from "path";
import Request from "request";
import * as  config from "../config.json";
import Uploader from "../utils/upload";
const fireapp = firebase.initializeApp(config.initFB);
const db = fireapp.firestore();

export default class StoryManager {
  public uploader = new Uploader();
  public async getScenarios() {
    const userQuerySnapshot = await db.collection("scenarios").get();
    const sc = [];
    userQuerySnapshot.forEach(
      (doc: any ) => sc.push({
                                data: doc.data(),
                                id: doc.id,
                              }),
    );
    return sc;
  }

  public async getScenario(id) {
    const userQuerySnapshot = await db.collection("scenarios").doc(id).get();
    const data = userQuerySnapshot.data();
    return data;
  }
  public async encodeBase64(url) {
    let resUrl = "";
    await (async () => {
      try {

        const response = await fetch(url) as any;
        const buf = await response.buffer();
        // tslint:disable-next-line:one-variable-per-declaration
        const base64prefix = "data:image/png;base64,"
          , image = decodeURIComponent(buf.toString("base64"));
        resUrl = base64prefix + image;
      } catch (error) {
        console.log(error);
      }
    })();
    return resUrl;

    // Make request to our image url
    /* request({url: url, encoding: null}, function (err, res, body) {
         if (!err && res.statusCode == 200) {
             // So as encoding set to null then request body became Buffer object
             var base64prefix = "data:" + res.headers["content-type"] + ";base64,"
                 , image = body.toString("base64");
             if (typeof callback == "function") {
                 callback(image, base64prefix);
             }
         } else {
             throw new Error("Can not download image");
         }
     });*/
  }
  public async upload(req, res) {
    try {
      await this.uploader.uploadFile(req, res);

      if (req.file === undefined) {
        return res.status(400).send({ message: "Please upload a file!" });
      }

      res.status(200).send({
        message: "Uploaded the file successfully: ",
      });
    } catch (err) {
      res.status(500).send({
        message: `Could not upload the file: ${req.file.originalname}. ${err}`,
      });
    }
  }

 /* public getListFiles(req, res) {
    const directoryPath = __basedir + config.streaming.path;

    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        res.status(500).send({
          message: "Unable to scan files!",
        });
      }

      const fileInfos: any[] = [];

      files.forEach((file) => {
        fileInfos.push({
          name: file,
          url: baseUrl + file,
        });
      });

      res.status(200).send(fileInfos);
    });
  }*/

  /*public download(req, res) {
    const fileName = req.params.name;
    const directoryPath = __basedir + config.streaming.path;

    res.download(directoryPath + fileName, fileName, (err) => {
      if (err) {
        res.status(500).send({
          message: "Could not download the file. " + err,
        });
      }
    });
  }*/

  public streamVideo(req, res, __basedir, path) {
    const filename = req.query.scene;
    const f = __basedir + config.streaming.path + "/" + filename;
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
      const file = fs.createReadStream( path , {start, end});
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
     // res.writeHead(200, head)
      fs.createReadStream(f).pipe(res);
    }
  }
}
