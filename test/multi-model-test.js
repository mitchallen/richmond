/**
 * File: multi-model-test.js
 */

var request = require('supertest'),
	should = require('should'),
	micro = require('../richmond'),
	config = require('./test-config'),
	getRandomInt = require('./test-lib').getRandomInt,
	service   	= config.service,
	port 	= process.env.MOCHA_TEST_PORT || 3021,
	prefix 	= service.prefix,
	connection = service.dbConn,
	dbUser = service.dbUser,
	dbPass = service.dbPass,
	modelName = ["AlphaRichmondTest","BetaRichmondTest"];

describe('mulitple models', function () {
	before(function () {
		var options = {
				user: dbUser,
				pass: dbPass
		};
		micro.logFile("./log/db-model-test.log");
		micro.connect( connection, options );
		var alphaModel = micro.addModel( modelName[0], {
			email: 	{ type: String, required: true },
			status: { type: String, required: true },
			password: { type: String, select: false }, 
		});
		should.exist(alphaModel);
		var betaModel = micro.addModel( modelName[1], {
			email: 	{ type: String, required: true },
			level: { type: String, required: true }, 
		});
		should.exist(alphaModel);
		var dbConn = micro.connection();
		should.exist( dbConn );
		// Purge all previous test records 
		alphaModel.remove( {"email": /@/ }, function( err )  {
			if( err ) { 
				console.error( err );
			}
		});
		betaModel.remove( {"email": /@/ }, function( err )  {
			if( err ) { 
				console.error( err );
			}
		});
	 });
		
	it( 'should be able to find any model by name', function( done ) {
		var alphaCollection = micro.model( modelName[0] );
		should.exist(alphaCollection);
		var betaCollection = micro.model( modelName[1] );
		should.exist(betaCollection);
		done();
	});
	
	it( 'should be able to save using any model', function( done ) {
		function alpha() {
			var collection = micro.model( modelName[0] );
			should.exist(collection);
			var body = {
				email: "test-save" + getRandomInt(10,10000) + "@alpha.com",
				status: "This is a test of alpha"
			};	
			var record = new collection( body );
			record.save( function( err, doc ) {
				if( err ) { throw err; } 
				should.exist(doc.status);
				beta();	// Call next test method.
			});
		}
		function beta() {
			var collection = micro.model( modelName[1] );
			should.exist(collection);
			var body = {
				email: "test-save" + getRandomInt(10,10000) + "@beta.com",
				level: "This is a test of beta"
			};	
			var record = new collection( body );
			record.save( function( err, doc ) {
				if( err ) { throw err; } 
				should.exist(doc.level);
				done();
			});
		}
		alpha();
		
	});
	
	after(function () {
		micro.closeConnection()
		micro.close();
	});
});
	

