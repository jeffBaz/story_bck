module.exports = {
    async validateToken(token, auth){
        token = token.replace('Bearer ','').replace('bearer ', '');
         // idToken comes from the client app
        return auth.verifyIdToken(token);
        /*.then(function(decodedToken) {
        let uid = decodedToken.uid;
        // ...
        }).catch(function(error) {
        // Handle error
        });*/

    }
}