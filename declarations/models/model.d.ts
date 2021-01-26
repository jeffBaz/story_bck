import Stripe from "stripe";
export interface PaymentPayload {
    amount?: number;
    mode?: string;
    token?: any;
    timestamp?: Date;
    status?: string;
    session?: Stripe.Checkout.Session;
    product?: string;
    creditsAmount?: number;
}
export interface CreditModel {
    currentScore?: number;
    transaction?: Date;
    history?: Object[];
}
export interface Product {
    id?: string;
    desc?: string;
    imgSrc?: string;
    lang?: string;
    name?: string;
    price?: number;
    creditsAmount?: number;
    specificUrlFailure?: string;
    specificUrlSuccess?: string;
}
export declare enum PaymentStatus {
    INIT = "INIT",
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    AFFECTED = "AFFECTED",
    CANCELED = "CANCELED",
    ERROR = "ERROR",
    FAILED = "FAILED"
}
