import * as firebase from "firebase";
import Uploader from "../utils/upload";
export default class StoryManager {
    uploader: Uploader;
    getScenarios(): Promise<any[]>;
    getScenario(id: any): Promise<firebase.firestore.DocumentData>;
    encodeBase64(url: any): Promise<string>;
    upload(req: any, res: any): Promise<any>;
    streamVideo(req: any, res: any, __basedir: any, path: any): void;
}
