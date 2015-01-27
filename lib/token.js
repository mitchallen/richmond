/**
 * token.js
 */

var jwt = require('jwt-simple');

/* Usage: 
 * 
 * app.use( require( './lib/token' )( _secret, log ) );
 * 
 */

module.exports = function (secret, log) {

    return function (req, res, next) {
        var emsg = "";
        if (!req) {
            emsg = "INTERNAL ERROR (getToken): req not defined.";
            if (log) {
                log.error(emsg);
            }
            return next({ status: 500, message: emsg, type: 'internal' });
        }
        if (req.headers['x-auth']) {
            try {
                if (secret) {
                    req.token = jwt.decode(req.headers['x-auth'], secret);
                } else {
                    emsg = "ERROR: secret is null, can't decode token. See: .secret()";
                    if (log) {
                        log.error(emsg);
                    }
                    return next({ status: 500, message: emsg, type: 'internal' });
                }
            } catch (ex) {
                // If secret doesn't match, will get error:
                //   [Error: Signature verification failed]
                // If a bad token string may return:
                //   [Error: Not enough or too many segments]
                // If slightly hacked token:
                //   [SyntaxError: Unexpected token]
                emsg = "ERROR: jwt.decode: " + ex;
                if (log) {
                    log.error(emsg);
                }
                return next({ status: 500, message: emsg, type: 'internal' });
            }
        }
        next();
    };
};