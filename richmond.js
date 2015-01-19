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

core.log = log = null;
core.name    = require("./package").name;
core.version = require("./package").version;

core.logFile = function( file ) {
	var dir = './log';
	if (!fs.existsSync(dir)){
	    fs.mkdirSync(dir);
	}
	core.log = log = new Log('debug', fs.createWriteStream( file ));
	return this;
}

core.model = function( name ) {
	return _model.model( name.toLowerCase() );
}

core.normalizeModelName = _model.normalizeModelName;

core.addModel = function( modelName, model ) {
	if( ! _dbConn ) throw new Error("Must connect to database first.");
	return _model.addModel( 
			modelName, 
			model, 
			_dbConn  
	);
};

core.closeConnection = function() {
	if( _dbConn ) {
		core.mongoose.disconnect( 
			function() {} 
		);
		_dbConn = null;
	}
}

core.close = function() {
	core.closeConnection();
	core.log = log = null;
}

core.connection = function() {
	return _dbConn;
}

core.connect = function( connection, options ) {
	core.closeConnection();
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


