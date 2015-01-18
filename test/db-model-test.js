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
		micro.logFile("db-model-test.log");
		micro.connect( connection, options );
		micro.addModel( modelName, {
			email: 	{ type: String, required: true },
			status: { type: String, required: true },
			password: { type: String, select: false }, 
		});
		var dbConn = micro.connection();
		should.exist( dbConn );
	 });
	
	it( 'Normalize model name to lowercase', function( done ) {
		var name = micro.normalizeModelName("FooTest");
		should.exist(name);
		name.should.match(/footest/);
		done();
	});
	
	it( 'Validate model name can not be null', function( done ) {
		
		var exceptionCaught = false;
		var eMsg = "";
		
		try {
			var name = micro.normalizeModelName( null );
		} catch( ex ) {
			exceptionCaught = true;
			eMsg = ex.message;
		}
		exceptionCaught.should.eql(true);
		eMsg.should.containEql("can't be null");
		done();
	});
	
	it( 'Validate model name can not contain whitepace', function( done ) {
		
		var exceptionCaught = false;
		var eMsg = "";
		
		try {
			var name = micro.normalizeModelName( "space name");
		} catch( ex ) {
			exceptionCaught = true;
			eMsg = ex.message;
		}
		exceptionCaught.should.eql(true);
		eMsg.should.containEql("whitespace");
		done();
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
			if( err ) { throw err; } 
			done();
		});
	});
	

	after(function () {
		micro.closeConnection()
		micro.close();
	});
});
	
