/**
 * patch-test.js
 */

var request = require('supertest'),
	should = require('should'),
	jwt = require('jwt-simple'),
	controller = require('@minja/richmond-web-controller'),
	micro = require('../richmond'),
	config = require('./test-config'),
	getRandomInt = require('./test-lib').getRandomInt,
	service   	= config.service,
	port 	= process.env.MOCHA_TEST_PORT || 3021,
	prefix 	= service.prefix,
	connection = service.dbConn,x
	dbUser = service.dbUser,
	dbPass = service.dbPass,
	testHost = process.env.MOCHA_TEST_HOST || "http://localhost:" + port,
	modelName = "PatchTest",	// Will translate to lowercase
	testSecret = 'supersecret',
	ownerEmail = "test@patch.com";

describe('PATCH Tests', function () {
	  before(function () {
		micro
			.logFile("./log/patch-test.log")
			.controller( 
		  		controller.setup({ 
		  			post: 		[{ model: modelName, rights: "PUBLIC" }],
		  			patch: 		[{ model: modelName, rights: "PUBLIC" }],
		  		}))
			.useCors() 			// Cross-Origin Resource Sharing
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
		
		var _routeName = "patch";
		
		var testExtraMessage = 'Testing 123';
		
		micro.wrapper.before( 
				_routeName,
				function( err, prop, next ) {
					if( ! prop.req ) return err( new Error("(before) prop.req not found") );
					if( ! prop.doc ) return err( new Error("(before) prop.doc not found") );
					// Not always an error if token is missing (just not logged in)
					if( ! prop.req.token ) return err( new Error("(before) prop.req.token not found") );
					var req = prop.req;
					var doc = prop.doc;
					// console.log( "TOKEN: " + JSON.stringify( req.token ) );
					// console.log( "BEFORE PATCH: ID: " + req.params.id );
					// console.log( "ORIGINAL DOC (doc): " + JSON.stringify( doc ) );
					// console.log( "REQ.BODY (the patch): " + JSON.stringify( req.body ) );
					var extras = { message: testExtraMessage };
					next( req.body, doc, extras );
				});
	
		micro.wrapper.after(
				_routeName,
				function( err, prop, next ) {;
					if( ! prop.req ) return err( new Error("(after) prop.req not found") );
					if( ! prop.res ) return err( new Error("(after) prop.res not found") );
					if( ! prop.result ) return err( new Error("(after) prop.result not found") );
					if( ! prop.patches ) return err( new Error("(after) prop.patches not found") );
					// Not always an error if token is missing (just not logged in)
					if( ! prop.req.token ) return err( new Error("(before) prop.req.token not found") );
					var req = prop.req;
					var res = prop.res;
					var result = prop.result;
					var patches = prop.patches;
					var extras = prop.extras;
					// console.log( "EXTRAS: " + extras.message );
					// console.log( "TOKEN: " + JSON.stringify( req.token ) );
					// console.log( "AFTER PATCH: ID: " + req.params.id );
					// console.log( "PATCH(ES): " + JSON.stringify( patches ) );
					// console.log( "RESULT (PATCHED) DOC: " + JSON.stringify( result ) );
					if( extras.message != testExtraMessage ) {
						throw new Error( "Test extra message not what expected.");
					}
					next( result );
				});
		
		micro.listen( port );
		
		// PURGE all records 
		
		MochaTestDoc.remove( {"email": /@/ }, function( err )  {
			if( err ) { 
				console.error( err );
			}
		}); 
		
	  });
	  
	  // TODO - test REMOVE - may not work unless object cloned first.
		
	  /**
	  it( 'PATCH test 101', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@patch.com", 
				status: "TEST PATCH" };
			// POST a new doc
			request( testHost )				
				.post( testUrl )
				.send( testObject )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end( function(err, res) {
				  	should.not.exist(err);
				  	// PATCH
					var newStatus = "UPDATED PATCH";
					request( testHost )		
						.patch( testUrl + "/" + res.body._id )
						.set( 'x-auth', jwt.encode( { email: ownerEmail, role: "user" }, testSecret ) )
						.send( 
							[
							 { "op": "replace", "path": "/status", "value": newStatus }
							] )
						// Uncaught TypeError: Argument must be a string 
						// .set( 'Content-Type', 'application/json-patch' )
						.set( 'Content-Type', 'application/json' )
						.expect( 200 )	
						.end( function(err, res ) {
							if( err ) {
								console.error( "UNEXPECTED TEST ERROR:")
								console.error( res.body );
							}
						  	should.not.exist(err);
						  	res.body.email.should.eql( testObject.email );
						  	res.body.status.should.eql( newStatus );
						  	done();
					  })
			  });
	  });
	  */
	  
	  after(function () {
	    micro.closeService();
	  });
});