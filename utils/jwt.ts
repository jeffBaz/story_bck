import jwt_decode from 'jwt-decode';

export default class JWT {
    private token;
    JWT(t: string){
        this.token = t;
    }
    public async validateToken(token, auth) {
        token =token ? token.replace("Bearer ", "").replace("bearer ", ""): this.token;
        this.token = token;
        // idToken comes from the client app
        return auth.verifyIdToken(token);
    }
    public getUserDataByKeyFromJWTPayload(key: string, tok?: string): any {
        tok = tok ? tok.replace("Bearer ", "").replace("bearer ", ""): this.token;
        this.token = tok;
        const token = this.getCurrentUser() as any;
        if (token && token[key]) {
            return token[key];
        }
        return false;
    }

    public getCurrentUser(token?) {
        token = token ? token.replace("Bearer ", "").replace("bearer ", ""): this.token;
        this.token = token;
        return jwt_decode(token);
    }

}
