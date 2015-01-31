/**
 * richmond.js
 */

var Log = require('log'),
	bodyParser = require('body-parser'),
	multer = require('multer'),
    fs = require('fs');

function Richmond() {
  this._secret = 'secret';
  this.app = require('express')(),
  this.mongoose = require('mongoose'),
  this.Schema = this.mongoose.Schema,
  this.ObjectId = this.Schema.ObjectId,

  this.router = require('express').Router(),
  
  this._model = require('./lib/model'),
  this._dbConn = null,

  this.server = null,
  this.ctrl = null;
  this.name    = require("./package").name;
  this.version = require("./package").version;
  this.prefix  = require('./lib/prefix');
  this.dir = './logs';
  this.log = log = null;
  this.name    = require("./package").name;
  this.version = require("./package").version;
}

module.exports = Richmond; // For export

Richmond.prototype.logFile = function( file ) {
	if (!fs.existsSync(this.dir)){
	    fs.mkdirSync(this.dir);
	}
	this.log = new Log('debug', fs.createWriteStream( this.dir + '/' + file ));
	return this;
}

Richmond.prototype.model = function( name ) {
	return this._model.model( name.toLowerCase() );
}

Richmond.prototype.normalizeModelName = function( name ) {
	return this._model.normalizeModelName( name );
}

Richmond.prototype.addModel = function( modelName, model ) {
	if( ! this._dbConn ) throw new Error("Must connect to database first.");
	return this._model.addModel( 
			modelName, 
			model, 
			this._dbConn  
	);
};

Richmond.prototype.closeConnection = function() {
	if( this._dbConn ) {
		this.mongoose.disconnect( 
			function() {} 
		);
		this._dbConn = null;
	}
}

Richmond.prototype.close = function() {
	this.closeConnection();
	this.log = null;
}

Richmond.prototype.connection = function() {
	return this._dbConn;
}

Richmond.prototype.connect = function( uri, options ) {
	this.closeConnection();
	if( ! uri ) {
		var eMsg = "connection string (uri) not defined.";
		if( this.log ) this.log.error( eMsg );
		throw new Error( eMsg );
	}
	var cb = function( err ) {
		if( err ) {
			if( this.log ) this.log.error( err );
			throw err;
		}
		// NOTE: must use callback or may get errors reconnecting.
	};
	if( ! options.user ) {
		this._dbConn = this.mongoose.createConnection( uri, cb );
	} else {
		if( ! options.pass ) {
			var eMsg = "database password not defined.";
			if( this.log ) this.log.error( eMsg );
			throw new Error( eMsg );
		}
		this._dbConn = this.mongoose.createConnection( uri, options, cb );
	}   
    return this;
};

Richmond.prototype.secret = function (s) {
    this._secret = s;
    return this;
};

Richmond.prototype.controller = function (mod) {
    this.ctrl = mod;
    return this;
};

Richmond.prototype.use = function(fn) {
	this.app.use( fn );
	return this;
} 

Richmond.prototype.listen = function (port) {
	
	this.app.use(bodyParser.json()); // for parsing application/json
	this.app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
	this.app.use(multer()); // for parsing multipart/form-data
	this.app.use(require('./lib/token')(this._secret, this.log));

    this.router.stack = [];
    if( this.ctrl ) {
        this.ctrl
            .parent( this )
            .router( this.router )
            .prefix( this.prefix() )
            .install( this.app );
    }
    // ERROR handler - put last.
   this.app.use(function(err, req, res, next) {
        var errObject = {
            message: err.message,
            error: err };
        if( this.log ) {
        	this.log.error("ERROR HANDLER: " + JSON.stringify( errObject ) );
        }
        try {
            res.status(err.status || 500); // Uses return to stop propagation.
            res.send( errObject );	// TODO - investigate "Can't set header after they are sent." (bad test?)
        } catch( ex ) {
            if( this.log ) {
            	this.log.error("### DEBUG - resend error" );
            	this.log.error( ex );
            }
        }
		return;
    });
    if( this.log ) {
    	this.log.info("Listening on port:", port );
    }
    this.server = this.app.listen(port); 
    return this;
};

Richmond.prototype.closeService = function() {
	this.close();	
	if( this.ctrl ) {
		this.ctrl.clear();
		this.ctrl = null;
	}
	this.ctrl = null;
	this._logErrors = false;
	if( this.server ) {
		this.server.close();
		this.server = null;
	}
	return this;
};




