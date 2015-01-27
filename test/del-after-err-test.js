/**
 * del-after-res-test.js
 */

var request = require('supertest'),
	should = require('should'),
	sleep = require('sleep'),
	jwt = require('jwt-simple'),
	controller = require('@minja/richmond-web-controller'),
	micro = require('../richmond'),
	config = require('./test-config'),
	getRandomInt = require('./test-lib').getRandomInt,
	service   	= config.service,
	port 	= process.env.MOCHA_TEST_PORT || 3021,
	prefix 	= service.prefix,
	connection = service.dbConn,
	dbUser = service.dbUser,
	dbPass = service.dbPass,
	testHost = process.env.MOCHA_TEST_HOST || "http://localhost:" + port,
	modelName = "DelTest",	// Will translate to lowercase
	testSecret = 'supersecret',
	ownerEmail = "test@zap.com";

describe('Delete After Error Tests', function () {
	
	  before(function () {
			
			var testExtraMessage = 'Testing 123';
			
			var beforeDelete =  
					function( err, prop, next ) {
						if( ! prop.req ) return err( new Error("prop.req not found") );
						var req = prop.req;
						if( ! req.token ) return err( new Error("token.req not found") );
						// console.log( "TOKEN: " + JSON.stringify( req.token ) );
						// console.log( "BEFORE DELETE: ID: " + req.params.id );
						var extras = { message: testExtraMessage };
						next( extras );
					};
					
			var afterDelete =
				function( err, prop, next ) {
					if( ! prop.req ) return err( new Error("prop.req not found") );
					var req = prop.req;
					if( ! prop.res ) return err( new Error("prop.res not found") );
					var res = prop.res;
					if( ! req.token ) return err( new Error("token.req not found") );
					// console.log( "TOKEN: " + JSON.stringify( req.token ) );
					// console.log( "AFTER DELETE: ID: " + req.params.id );
					var extras = prop.extras;
					// console.log( "EXTRAS: " + extras.message );
					if( extras.message != testExtraMessage ) {
						throw new Error( "Test extra message not what expected.");
					}
					// Testing Response
					res.status(402).json( { error: "Payment required." } );
					// next();	// Don't call next() after intercepting response
				};
		  
		  micro
		  	.logFile("./log/del-after-err-test.log")
		  	.controller( 
		  		controller.setup({ 
		  			del:  [{ model: modelName, rights: "PUBLIC", before: beforeDelete, after: afterDelete }], 
		  			post: [{ model: modelName, rights: "PUBLIC" }]
		  		}))
		  	.secret( testSecret )
			.prefix( prefix );	// API prefix, i.e. http://localhost/v1/testdoc
		var options = {
					user: dbUser,
					pass: dbPass
			};
		micro.connect( connection, options );
		var MochaTestDoc = micro.addModel( modelName, {
			email: 	{ type: String, required: true },
			status: { type: String, required: true },   
		} );
				
		micro.listen( port );
		
		// PURGE all records 
		
		MochaTestDoc.remove( {"email": /@/ }, function( err )  {
			if( err ) { 
				console.error( err );
			}
		}); 
		
	  });
	  
	  it( 'DELETE After Error Response', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@zap.com", 
				status: "TEST DELETE" };
			// SETUP - need to post at least one record
			var testId = "";
			request( testHost )
				.post( testUrl )
				.send( testObject )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end( function(err, res) {
				  	should.not.exist(err);
				  	testId = res.body._id;
				  	// console.log( "ID: " + testId );
				  	// DELETE
					var zapUrl = testUrl + "/" + testId;
					// console.log( zapUrl );
					request( testHost )
						.del( zapUrl )
						.set( 'x-auth', jwt.encode( { email: ownerEmail, role: "user" }, testSecret ) )
						.expect( 402 )
						.end( function(err, res) {
						  	should.not.exist(err);
						  	done();
					  })
			  });
	  });
	  
	  
	  after(function () {
		 micro.closeService();
	  });
});