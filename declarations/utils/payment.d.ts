import * as firebase from "firebase";
import Stripe from "stripe";
import { PaymentPayload, PaymentStatus, Product } from "../models/model";
export default class Pay {
    db: firebase.firestore.Firestore;
    calculateOrderAmount(items: any): number;
    getInitStatus(): PaymentStatus;
    setPayload(s: Stripe.Checkout.Session, product: Product): PaymentPayload;
    getProductById(pId: string): Promise<firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>>;
    treatPayment(payload: PaymentPayload, auth: string): void;
    updatePayment(e: Stripe.Event, status: PaymentStatus): Promise<void>;
    recordPayment(payload: PaymentPayload, auth: string): Promise<void>;
    updateCreditUser(payload: PaymentPayload, auth: any): void;
}
