/**
 * del-test.js
 */

var request = require('supertest'),
	should = require('should'),
	sleep = require('sleep'),
	jwt = require('jwt-simple'),
	Richmond = require('../richmond'),
	micro = new Richmond(),
	config = require('./test-config'),
	controller = config.controller,
	getRandomInt = require('./test-lib').getRandomInt,
	service   	= config.service,
	port 	= service.port,
	prefix 	= service.prefix,
	dbConfig = config.mongoose,
	testHost = service.host,	
	modelName = "DelTest",	// Will translate to lowercase
	testSecret = 'supersecret',
	ownerEmail = "test@zap.com";

var MochaTestDoc = null;

describe('delete', function () {
	  before(function () {
		  
		var testExtraMessage = 'Testing 123';
		
		var beforeDelete = function( err, prop, next ) {
				if( ! prop.req ) return err( new Error("prop.req not found") );
				var req = prop.req;
				if( ! req.token ) return err( new Error("token.req not found") );
				// console.log( "TOKEN: " + JSON.stringify( req.token ) );
				// console.log( "BEFORE DELETE: ID: " + req.params.id );
				var extras = { message: testExtraMessage };
				next( extras );
			};
			
		var afterDelete = function( err, prop, next ) {
			if( ! prop.req ) return err( new Error("prop.req not found") );
			var req = prop.req;
			if( ! req.token ) return err( new Error("token.req not found") );
			// console.log( "TOKEN: " + JSON.stringify( req.token ) );
			// console.log( "AFTER DELETE: ID: " + req.params.id );
			var extras = prop.extras;
			// console.log( "EXTRAS: " + extras.message );
			if( extras.message != testExtraMessage ) {
				throw new Error( "Test extra message not what expected.");
			}
			next();
		};
		  
		micro
		  	.logFile("del-test.log")
		  	.controller( 
		  		controller.setup({ 
		  			del:  [{ model: modelName, rights: "PUBLIC", before: beforeDelete, after: afterDelete }],
		  			post: [{ model: modelName, rights: "PUBLIC" }]
		  		}))
		  	.secret( testSecret )
			.prefix( prefix );	// API prefix, i.e. http://localhost/v1/testdoc
		var options = {
				user: dbConfig.user,
				pass: dbConfig.pass
			};
		micro.connect( dbConfig.uri, options );
		MochaTestDoc = micro.addModel( modelName, {
			email: 	{ type: String, required: true },
			status: { type: String, required: true },   
		} );
		
		micro.listen( port );
		
	  });
	  
	  it( 'by the owner should succeed', function( done ) {
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
						.expect( 200 )
						.end( function(err, res) {
						  	should.not.exist(err);
						  	should.exist( res.body.status );
						  	res.body.status.should.eql("OK");
						  	
							// PURGE all records 
							
							MochaTestDoc.remove( {"email": /@/ }, function( err )  {
								if( err ) { 
									console.error( err );
								}
								done();
							}); 
						  	
					  })
			  });
	  });
	  
	  
	  after(function () {
		 micro.closeService();
	  });
});