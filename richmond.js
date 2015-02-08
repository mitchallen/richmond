/**
 * richmond.js
 */

"use strict";

var Log = require('log'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    fs = require('fs');

function Richmond(options) {
    this.m_secret = 'secret';
    this.app = require('express')();
    this.mongoose = require('mongoose');
    this.Schema = this.mongoose.Schema;
    this.ObjectId = this.Schema.ObjectId;
    this.router = require('express').Router();
    this.m_model = require('./lib/model');
    this.m_conn = null;
    this.server = null;
    this.ctrl = null;
    this.prefix  = require('./lib/prefix');
    this.log = null;
    this.database = {};
    this.port = null;
    this.name    = require("./package").name;
    this.version = require("./package").version;
    if (options) {
        this.setup(options);
    }
}

module.exports = Richmond; // For export

Richmond.prototype.setup = function (options) {
    if (options) {
        if (options.logFile) {
            this.logFile(options.logFile);
        }
        if (options.prefix) {
            this.prefix(options.prefix);
        }
        this.database = options.database || this.database;
        this.port = options.port;
        this.m_secret = options.secret || this.m_secret;
    }
    return this;
};

Richmond.prototype.logFile = function (file) {
    if (!file) {
        throw new Error(".logFile parameter can not be undefined");
    }
    this.log = new Log('debug', fs.createWriteStream(file));
    return this;
};

Richmond.prototype.model = function (name) {
    return this.m_model.model(name.toLowerCase());
};

Richmond.prototype.normalizeModelName = function (name) {
    return this.m_model.normalizeModelName(name);
};

Richmond.prototype.addModel = function (modelName, model) {
    if (!this.m_conn) {
        throw new Error("Must connect to database first.");
    }
    return this.m_model.addModel(
        modelName,
        model,
        this.m_conn
    );
};

Richmond.prototype.closeConnection = function () {
    if (this.m_conn) {
        this.mongoose.disconnect();
        this.m_conn = null;
    }
};

Richmond.prototype.close = function () {
    this.closeConnection();
    this.log = null;
};

Richmond.prototype.connection = function () {
    return this.m_conn;
};

Richmond.prototype.connect = function (uri, options) {
    var eMsg = "",
        cb = null;
    this.closeConnection();
    // If uri is defined override with that, 
    // otherwise use current database.uri
    this.database.uri = uri || this.database.uri;
    // If options is defined override with that, 
    // otherwise use current database.options
    this.database.options = options || this.database.options;
    if (!this.database.uri) {
        eMsg = "connection string (uri) not defined.";
        if (this.log) {
            this.log.error(eMsg);
        }
        throw new Error(eMsg);
    }
    cb = function (err) {
        if (err) {
            if (this.log) {
                this.log.error(err);
            }
            throw err;
        }
    };
    if (!this.database.options) {
        this.m_conn = this.mongoose.createConnection(this.database.uri, cb);
    } else {
        this.m_conn = this.mongoose.createConnection(this.database.uri, this.database.options, cb);
    }
    return this;
};

Richmond.prototype.secret = function (s) {
    this.m_secret = s;
    return this;
};

Richmond.prototype.controller = function (mod) {
    this.ctrl = mod;
    return this;
};

Richmond.prototype.use = function (fn) {
    this.app.use(fn);
    return this;
};

Richmond.prototype.listen = function (port) {
    var log = this.log, // Need to convert to local var to pass to error handler, else "this" refers to wrong object
        emsg = "";
    // If port parameter passed in, override this.port with that, else use existing this.port value.
    this.port = port || this.port;
    this.app.use(bodyParser.json()); // for parsing application/json
    this.app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
    this.app.use(multer()); // for parsing multipart/form-data
    this.app.use(require('./lib/token')(this.m_secret, this.log));
    this.router.stack = [];
    if (this.ctrl) {
        this.ctrl
            .parent(this)
            .router(this.router)
            .prefix(this.prefix())
            .install(this.app);
    }
    // ERROR handler - put last.
    /*jslint unparam: true*/
    this.app.use(function (err, req, res, next) {
        var errObject = {},
            errJson = null;
        errObject = {
            message: err.message,
            error: err
        };
        errJson = "ERROR HANDLER: " + JSON.stringify(errObject);
        if (log) {
            log.error(errJson);
        } else {
            console.error(errJson);
        }
        try {
            res.status(err.status || 500);
            res.send(errObject);
        } catch (ex) {
            if (log) {
                log.error("### DEBUG - resend error");
                log.error(ex);
            }
        }
        return; // Stop propagation
    });
    /*jslint unparam: false*/
    if (this.log) {
        this.log.info("Listening on port:", this.port);
    }
    if (!this.port) {
        emsg = ".listen port not defined (define via .setup or .listen)";
        this.log.error(emsg);
        throw new Error(emsg);
    }
    this.server = this.app.listen(this.port);
    return this;
};

Richmond.prototype.closeService = function () {
    this.close();
    if (this.ctrl) {
        this.ctrl.clear();
        this.ctrl = null;
    }
    this.ctrl = null;
    if (this.server) {
        this.server.close();
        this.server = null;
    }
    return this;
};
