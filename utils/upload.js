const util = require("util");
const multer = require("multer");
const config = require('../config.json');

const maxSize = 2 * 1024 * 1024;

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(__basedir +config.streaming.path+'/'+file.originalname);
    cb(null, __basedir +config.streaming.path);
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, file.originalname);
  },
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: config.streaming.maxSize },
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;