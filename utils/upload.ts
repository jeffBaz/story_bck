import multer from "multer";
import * as util from "util";
import * as config from "../config.json";
const __basedir = __dirname;
export default class Uploader {
  public maxSize = 2 * 1024 * 1024;
  public storage = multer.diskStorage({
    destination: (req, file, cb) => {
      console.log(__basedir + config.streaming.path + "/" + file.originalname);
      cb(null, __basedir + config.streaming.path);
    },
    filename: (req, file, cb) => {
      console.log(file.originalname);
      cb(null, file.originalname);
    },
  });

  public uploadFile = multer({
    limits: { fileSize: config.streaming.maxSize },
    storage: this.storage,
  }).single("file");

  public uploadFileMiddleware = util.promisify(this.uploadFile);
}
