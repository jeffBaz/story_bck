export default class JWT {
    private token;
    JWT(t: string): void;
    validateToken(token: any, auth: any): Promise<any>;
    getUserDataByKeyFromJWTPayload(key: string, tok?: string): any;
    getCurrentUser(token?: any): unknown;
    parseHeader(header: any, scheme: any): {
        timestamp: number;
        signatures: any[];
    };
}
