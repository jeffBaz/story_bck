const config = require('../config.json');
const firebase = require('firebase');
const request = require('request');
const fetch = require('node-fetch');
const fire_app = firebase.initializeApp(config.initFB);
var db = fire_app.firestore();
module.exports = {
    async getScenarios(){
        const userQuerySnapshot = await db.collection('scenarios').get();
        const sc = [];
        userQuerySnapshot.forEach(
            (doc)=>{
                sc.push({
                    id: doc.id,
                    data:doc.data()
            });
            }
        );
        return sc;
    },

   async getScenario(id){
        const userQuerySnapshot = await db.collection('scenarios').doc(id).get();
        const data =  userQuerySnapshot.data();
        return data;
    },
    async encodeBase64(url){
      resUrl = '';
     await (async () => {
        try {
         
          const response = await fetch(url)
          const buf = await response.buffer();
          const base64prefix = 'data:image/png;base64,'
          , image =decodeURIComponentbuf.toString('base64');
          resUrl =  base64prefix + image;
        } catch (error) {
          console.log(error);
        }
      })();
      return resUrl;
      // Make request to our image url
     /* request({url: url, encoding: null}, function (err, res, body) {
          if (!err && res.statusCode == 200) {
              // So as encoding set to null then request body became Buffer object
              var base64prefix = 'data:' + res.headers['content-type'] + ';base64,'
                  , image = body.toString('base64');
              if (typeof callback == 'function') {
                  callback(image, base64prefix);
              }
          } else {
              throw new Error('Can not download image');
          }
      });*/
    }

   /* getScenarios() {
        return this.scenarios;
      }
      getActor(actorId: String) {
        if (!actorId || !this.actors) return null;
        return this.actors.find(_ => _.id === actorId);
      }
      getActors() {
        return this.actors;
      }
      getScene(scenarioId, sceneId) {
        if (!scenarioId || !sceneId) return false;
        return this.scenarios.find(_ => _.id === scenarioId).scenes.find(_ => sceneId === _.id)
      }
      getScenario(scenarioId) {
        if (!scenarioId) return false;
        return this.scenarios.find(_ => _.id === scenarioId);
      }
      getImg(scenario) {
        if (!scenario) return '';
        return scenario.scenes && scenario.scenes[0] ? scenario.scenes[0].imgSrc : '';
      }
      updateScenario(scenario: Scenario) {
        if (this.db.collection('scenarios').doc(scenario.id)) {
          this.db.collection('scenarios').doc(scenario.id).update(scenario).then(function () {
            console.log(scenario.id + ":Document successfully updated!");
          })
            .catch(function (error) {
              // The document probably doesn't exist.
              console.error(scenario.id + ":Error updating document: ", error);
            });
        }
      }
      updateScene(scene: Scene) {
        if (this.db.collection('scenarios').doc(scene.id)) {
          this.db.collection('scenarios').doc(scene.id).update(scene).then(function () {
            console.log(scene.id + ":Document successfully updated!");
          })
            .catch(function (error) {
              // The document probably doesn't exist.
              console.error(scene.id + ":Error updating document: ", error);
            });
        }
      }
      createScenario(scenario: Scenario) {
        this.db.collection('scenarios').add(scenario).then(_ => {
          console.log(_);
        });
      }
      deleteScenario(id: string) {
        this.db.collection('scenarios').doc(id).delete().then(_ => console.log()).catch(_ => console.error(_));
      }
      deleteActor(id: string) {
        this.db.collection('actors').doc(id).delete().then(_ => console.log()).catch(_ => console.error(_));
      }
      deleteScene(id: string) {
        this.db.collection('scenes').doc(id).delete().then(_ => console.log(_)).catch(_ => console.error(_));
      }
      $creditScore() {
        if (this.auth.currentUser) {
          return this.db.collection('credits').doc(this.auth.currentUser.id).valueChanges()
        }
      }
      getCredit() {
        return this.db.doc('credits/' + this.auth.currentUser.id).get();
      }
      getGallery() {
        return this.db.doc('gallery/' + this.auth.currentUser.id).get();
      }
      getActions() {
        return this.db.doc('params/actions').get();
      }
      async getRecord() {
        return await this.db.doc('history/' + this.auth.currentUser.id).get().toPromise();
      }
      async record({ choice, from, to, scenario }) {
        const recordRef = this.db.collection('history').doc(this.auth.currentUser.id);
        let history = null;
        const payload = this.createPayload(choice, from, to, scenario);
        await this.db.doc('history/' + this.auth.currentUser.id).get().toPromise().then(_ => {
          history = _.data() as any[];
          if (history) {
            let scHistory = history[scenario.id] as Record[];
            if (scHistory) {
              scHistory.push(payload);
              if (scHistory.length > 5) {
                scHistory.shift();
              }
            } else {
              scHistory = [payload];
            }
            history[scenario.id] = scHistory;
          } else {
            history = {};
            history[scenario.id] = [payload];
          }
          recordRef.set(history, { merge: false });
        });
      }*/
}