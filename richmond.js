/**
 * richmond.js
 */

var core = module.exports = {}; // For export

core.mongoose = require( 'mongoose' ), 
	Schema = core.mongoose.Schema, 
	ObjectId = Schema.ObjectId,
	fs = require('fs'),
	Log = require('log'),
	_model = require('./lib/model'),
	_dbConn = null;

core.log = log = new Log('info');
core.name    = require("./package").name;
core.version = require("./package").version;

core.logFile = function( file ) {
	core.log = log = new Log('debug', fs.createWriteStream( file ));
	return this;
}

core.model = function( name ) {
	log.info("core.model(%s)",name);
	return _model.model( name.toLowerCase() );
}

core.normalizeModelName = _model.normalizeModelName;

core.addModel = function( modelName, model ) {
	log.info("core.addModel('%s',...)",modelName);
	if( ! _dbConn ) throw new Error("Must connect to database first.");
	return _model.addModel( 
			modelName, 
			model, 
			_dbConn  
	);
};

core.closeConnection = function() {
	log.info("core.closeConnection()");
	if( _dbConn ) {
		core.mongoose.disconnect( 
			function() {
				if( log ) log.debug( "closeConnection: mongoose.disconnect()" );
			} 
		);
		_dbConn = null;
	}
}

core.close = function() {
	log.info("core.close()");
	core.closeConnection();
}

core.connection = function() {
	log.info("code.connection()");
	return _dbConn;
}

core.connect = function( connection, options ) {
	if( log ) log.info("core.connect('%s',...)",connection );
	core.closeConnection();
	if( ! connection ) {
		var eMsg = "connection string not defined.";
		log.error( eMsg );
		throw new Error( eMsg );
	}
	var cb = function( err ) {
		if( err ) {
			log.error( err );
			throw err;
		}
		// NOTE: must use callback or may get errors reconnecting.
	};
	if( ! options.user ) {
		_dbConn = core.mongoose.createConnection( connection, cb );
	} else {
		if( ! options.pass ) {
			var eMsg = "database password not defined.";
			if( log ) log.error( eMsg );
			throw new Error( eMsg );
		}
		_dbConn = core.mongoose.createConnection( connection, options, cb );
	}   
    return this;
};


