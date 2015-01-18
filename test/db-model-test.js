/**
 * db-model-test.js
 */

var request = require('supertest'),
	should = require('should'),
	// async = require('async'),
	micro = require('../richmond'),
	config = require('./test-config'),
	getRandomInt = require('./test-lib').getRandomInt,
	service   	= config.service,
	port 	= process.env.MOCHA_TEST_PORT || 3021,
	prefix 	= service.prefix,
	connection = service.dbConn,
	dbUser = service.dbUser,
	dbPass = service.dbPass,
	modelName = "RichmondDbTest";	// Will translate to lowercase

describe('Model Tests', function () {
	before(function () {
		
		var options = {
				user: dbUser,
				pass: dbPass
		};
		
		micro.connect( connection, options );
		
		var MochaTestDoc = micro.addModel( modelName, {
			email: 	{ type: String, required: true },
			status: { type: String, required: true },
			password: { type: String, select: false }, 
		});
		
		var dbConn = micro.connection();
		
		should.exist( dbConn );
		
	 });
	
	it( 'Lookup model', function( done ) {
		
		var collection = micro.model( modelName );
		
		should.exist(collection);
		
		done();
	});
	
	it( 'Save model', function( done ) {
		
		var collection = micro.model( modelName );
		
		should.exist(collection);
		
		var body = {
			email: "test-save" + getRandomInt(10,10000) + "@foo.com",
			status: "This is a test"
		};
				
		var record = new collection( body );
		
		record.save( function( err, doc ) {
			if( err ) { 
				throw err;
			} 
			done();
		});
		
		done();
	});
	

	after(function () {
		micro.closeConnection()
		micro.close();
	});
});
	
