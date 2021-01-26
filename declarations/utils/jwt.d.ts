export default class JWT {
    private token;
    JWT(t: string): void;
    validateToken(token: any, auth: any): Promise<any>;
    getUserDataByKeyFromJWTPayload(key: string, tok?: string): any;
    getCurrentUser(token?: any): unknown;
}
