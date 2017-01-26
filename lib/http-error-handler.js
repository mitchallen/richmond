module.exports = function (spec) {

    spec = spec || {};

    var log = spec.log;

    return function (err, req, res, next) {

        var errObject = {},
            errJson = null;

        errObject = {
            message: err ? err.message : "",
            error: err
        };

        errJson = "ERROR HANDLER: " + JSON.stringify(errObject);

        if (log) {
            log.error(errJson);
        } else {
            console.error(errJson);
        }
        try {
            res.status( err ? err.status : 0 || 500);
            res.send(errObject);
        } catch (ex) {
            if (log) {
                log.error("### DEBUG - resend error");
                log.error(ex);
            }
        }
        return; // Stop propagation
    };
};