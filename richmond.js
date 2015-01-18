/**
 * richmond.js
 */

var core = module.exports = {}; // For export

core.mongoose = require( 'mongoose' ), 
	Schema = core.mongoose.Schema, 
	ObjectId = Schema.ObjectId,
	_model = require('./lib/model'),
	_dbConn = null;

core.name    = require("./package").name;
core.version = require("./package").version;

core.model = function( name ) {
	return _model.model( name.toLowerCase() );
}

core.addModel = function( modelName, model ) {
	return _model.addModel( 
			modelName, 
			model, 
			_dbConn  
	);
};

core.closeConnection = function() {
	
	if( _dbConn ) {
		core.mongoose.disconnect( 
			function() {
				// console.log( "DEBUG: closeConnection: mongoose.disconnect()" );
			} 
		);
		_dbConn = null;
	}
}

core.close = function() {

	core.closeConnection();
}

core.connection = function() {
	return _dbConn;
}

core.connect = function( connection, options ) {
	
	// TO BE SURE - issues?
	core.closeConnection();
	
	if( ! connection ) {
		throw new Error( ".connect() connection string not defined.")
	}
		
	var cb = function( err ) {
		if( err ) throw err;
		// TODO - pooled connections
		// NOTE: must use callback or may get errors reconnecting.
	};
		
	if( ! options.user ) {
		_dbConn = core.mongoose.createConnection( connection, cb );
	} else {
		if( ! options.pass ) {
			throw new Error( "DB password not defined.");
		}
		_dbConn = core.mongoose.createConnection( connection, options, cb );
	}
	    
    return this;
};


