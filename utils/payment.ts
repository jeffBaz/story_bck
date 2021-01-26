import * as  firebase from "firebase";
import Stripe from "stripe";
import { CreditModel, PaymentPayload, PaymentStatus, Product } from "../models/model";

export default class Pay {
  public db = firebase.firestore();
  public calculateOrderAmount(items) {
    // Replace this constant with a calculation of the order"s amount
    // Calculate the order total on the server to prevent
    // people from directly manipulating the amount on the client
    return 1400;
  }
  public getInitStatus() {
    return PaymentStatus.INIT;
  }
  public setPayload(s: Stripe.Checkout.Session, product: Product) {
    console.info("Creation du payload");
    try {
      const pl: PaymentPayload = {
        amount: s.amount_total,
        creditsAmount: product.creditsAmount,
        mode: "Stripe",
        product: product.id,
        session: s,
        timestamp: new Date(),
      };
      console.info(pl);
      return pl;
    } catch (e) {
      console.error(s);
      throw Error("Error: Aucun lineItem présent dans la session" + s.id);
    }

  }
  public getProductById(pId: string) {
    console.info("Récupération du produit:" + pId);
    try {
      return this.db.doc("products/" + pId).get();
    } catch (e) {
      console.error(e);
      throw Error("Error: Aucun produit associé à l'id " + pId);
    }
  }
  public treatPayment(payload: PaymentPayload, auth: string) {
    this.recordPayment(payload, auth);
    this.updateCreditUser(payload, auth);
  }
  public async updatePayment(e: Stripe.Event, status: PaymentStatus) {
    console.info("Début update du record:" + e.id);
    let payRefs: { history: PaymentPayload[] }, userId: string;
    let payRef: PaymentPayload;
    try {
      userId = e.data.object["client_reference_id"];
      payRefs = await (await this.db.collection("payments").doc(userId).get()).data() as { history: PaymentPayload[] };
    } catch (e) {
      console.error(e);
      throw Error("ERROR: Reference client non trouvé");
    }
    try {
      console.info("changement du status:" + status);
      let tmp = payRefs.history.filter(_ =>_.session && _.session.payment_intent === e.data.object["payment_intent"]).sort((a, b) => {
        const d1 = new Date(a.timestamp);
        const d2 = new Date(b.timestamp);
        if (a && b && a.timestamp && b.timestamp) {
          return d1.getTime() - d2.getTime();
        } else {
          return 0;
        }
      });
      if (tmp && tmp.length > 0) {
        payRef = tmp[tmp.length - 1];
      }
      payRef.status = status;
      payRef.timestamp = new Date();
      this.recordPayment(payRef, userId);
      if (status === PaymentStatus.COMPLETED) {
        await this.updateCreditUser(payRef, userId);
      }
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la mise a jour du status:" + status);
      console.error(payRef);
      throw err;
    } finally {
      console.info("Fin update du record:" + e.id);
    }
  }
  public async recordPayment(payload: PaymentPayload, auth: string) {
    console.info("Début de l'enregistrement:");
    console.info(payload);
    const payRef = this.db.collection("payments").doc(auth);
    let records = await (await this.db.doc("payments/" + auth).get()).data() as { history?: PaymentPayload[] };
    if (records && records.history) {
      records.history.push(payload);
    } else {
      records = {};
      records.history = [payload];
    }
    const setWithMerge = payRef.set(records, { merge: true });
    console.info("Fin de l'enregistrement");

    /* this.db.collection("payments").add(payload).then( _ => {
       console.log(_);
   });*/
  }
  public updateCreditUser(payload: PaymentPayload, auth) {
    console.info('ajout du credit');

    try {

      const creditRef = this.db.collection("credits").doc(auth);
      let creditPayload: CreditModel = null;
      this.db.doc("credits/" + auth).get().then(_ => {
        creditPayload = _.data() as CreditModel;
        if (creditPayload) {
          creditPayload.currentScore += payload.creditsAmount;
          creditPayload.history ? creditPayload.history.push(payload) : creditPayload.history = [payload];
        } else {
          creditPayload = {};
          creditPayload.currentScore = payload.creditsAmount;
          creditPayload.history = [payload];
        }
        const setWithMerge = creditRef.set(creditPayload, { merge: false });
      });
    } catch (e) {
      console.log(e);
      throw ("Les crédits n'ont pas pu etre ajoutés:" + e);

    }
  }
}
