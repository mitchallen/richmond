/**
 * richmond.js
 */

var pkg = module.exports = {}; // For export

pkg.mongoose = require( 'mongoose' ), 
	Schema = pkg.mongoose.Schema, 
	ObjectId = Schema.ObjectId,
	fs = require('fs'),
	Log = require('log'),
	_model = require('./lib/model'),
	_dbConn = null,
	app = require('express')(),
	bodyParser = require('body-parser'),
	multer = require('multer'),
	router = require('express').Router(),
	secret = 'secret',
	server = null,
	ctrl = null;

pkg.name    = require("./package").name;
pkg.version = require("./package").version;
pkg.prefix  = require('./lib/prefix');

pkg.log = log = null;
pkg.name    = require("./package").name;
pkg.version = require("./package").version;

pkg.logFile = function( file ) {
	var dir = './log';
	if (!fs.existsSync(dir)){
	    fs.mkdirSync(dir);
	}
	pkg.log = log = new Log('debug', fs.createWriteStream( file ));
	return this;
}

pkg.model = function( name ) {
	return _model.model( name.toLowerCase() );
}

pkg.normalizeModelName = _model.normalizeModelName;

pkg.addModel = function( modelName, model ) {
	if( ! _dbConn ) throw new Error("Must connect to database first.");
	return _model.addModel( 
			modelName, 
			model, 
			_dbConn  
	);
};

pkg.closeConnection = function() {
	if( _dbConn ) {
		pkg.mongoose.disconnect( 
			function() {} 
		);
		_dbConn = null;
	}
}

pkg.close = function() {
	pkg.closeConnection();
	pkg.log = log = null;
}

pkg.connection = function() {
	return _dbConn;
}

pkg.connect = function( connection, options ) {
	pkg.closeConnection();
	if( ! connection ) {
		var eMsg = "connection string not defined.";
		if( log ) log.error( eMsg );
		throw new Error( eMsg );
	}
	var cb = function( err ) {
		if( err ) {
			if( log ) log.error( err );
			throw err;
		}
		// NOTE: must use callback or may get errors reconnecting.
	};
	if( ! options.user ) {
		_dbConn = pkg.mongoose.createConnection( connection, cb );
	} else {
		if( ! options.pass ) {
			var eMsg = "database password not defined.";
			if( log ) log.error( eMsg );
			throw new Error( eMsg );
		}
		_dbConn = pkg.mongoose.createConnection( connection, options, cb );
	}   
    return this;
};

pkg.secret = function (s) {
    secret = s;
    return this;
};

pkg.controller = function (mod) {
    ctrl = mod;
    return this;
};

pkg.listen = function (port) {
    app.use(bodyParser.json()); // for parsing application/json
    app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
    app.use(multer()); // for parsing multipart/form-data
    app.use(require('./lib/token')(secret, log));
    router.stack = [];
    if( ctrl ) {
        ctrl
            .parent( pkg )
            .router( router )
            .prefix( pkg.prefix() )
            .install( app );
    }
    // ERROR handler - put last.
    app.use(function(err, req, res, next) {
        var errObject = {
            message: err.message,
            error: err };
        if( log ) {
        	log.error("ERROR HANDLER: " + JSON.stringify( errObject ) );
        }
        try {
            res.status(err.status || 500); // Uses return to stop propagation.
            res.send( errObject );	// TODO - investigate "Can't set header after they are sent." (bad test?)
        } catch( ex ) {
            if( log ) {
            	log.error("### DEBUG - resend error" );
            	log.error( ex );
            }
        }
		return;
    });
    log.info("Listening on port:", port );
    server = app.listen(port); 
    return this;
};

pkg.closeService = function() {
	pkg.close();	
	if( ctrl ) {
		ctrl.clear();
	}
	ctrl = null;
	_logErrors = false;
	if( server ) {
		server.close();
		server = null;
	}
};




