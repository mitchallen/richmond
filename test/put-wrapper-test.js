/**
 * put-test.js
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
	connection = service.dbConn,
	dbUser = service.dbUser,
	dbPass = service.dbPass,
	testHost = process.env.MOCHA_TEST_HOST || "http://localhost:" + port,
	modelName = "PutTest",	// Will translate to lowercase
	testSecret = 'supersecret',
	ownerEmail = "test@zap.com"

describe('PUT Wrapper Test Suite', function () {
	before(function () {
	
		var testExtraMessage = 'Testing 123';
		
		var beforePut = 
				function( err, prop, next ) {
					if( ! prop.req ) return err( new Error("prop.req not found") );
					var req = prop.req;
					if( ! req.token ) return err( new Error("token.req not found") );
					// console.log( "TOKEN: " + JSON.stringify( req.token ) );
					// console.log( "BEFORE PUT: ID: " + req.params.id );
					// console.log( "REQ.BODY: " + JSON.stringify( req.body ) );
					var options = {};
					var extras = { message: testExtraMessage };
					next( req.body, options, extras );
				};
					
		var afterPut =
				function( err, prop, next ) {
					if( ! prop.req ) return err( new Error("prop.req not found") );
					var req = prop.req;
					if( ! prop.numAffected ) return err( new Error("prop.numAffected not found") );
					var numAffected = prop.numAffected;
					// console.log( "AFTER PUT: ID: " + req.params.id );
					// console.log( "NUMBER AFFECTED: " + numAffected )
					if( prop.numAffected != 1 ) 
						return err( new Error("numAffected should be 1, but it was:", numAffected ) );
					var extras = prop.extras;
					// console.log( "EXTRAS: " + extras.message );
					if( extras.message != testExtraMessage ) {
						throw new Error( "Test extra message not what expected.");
					}
					next();
				};

		micro
			.logFile("./log/put-wrapper-test.log")
			.controller( 
		  		controller.setup({ 
		  			del:  		[{ model: modelName, rights: "PUBLIC" }],
		  			getOne:  	[{ model: modelName, rights: "PUBLIC" }], 
		  			getMany:  	[{ model: modelName, rights: "PUBLIC" }],
		  			post: 		[{ model: modelName, rights: "PUBLIC" }],
		  			put: 		[{ model: modelName, rights: "PUBLIC", before: beforePut, after: afterPut }]
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
	
	 it( 'PUT wrapper test', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@put.com", 
				status: "TEST PUT" };
			// SETUP - need to post at least one record
			request( testHost )
				.post( testUrl )
				.send( testObject )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end( function(err, res) {
				  	should.not.exist(err);
				  	// PUT 
					var putUrl = testUrl + "/" + res.body._id;
					request( testHost )
						.put( putUrl )
						.send( { status: "UPDATED" } )
						.set( 'x-auth', jwt.encode( { email: ownerEmail, role: "user" }, testSecret ) )
						.set( 'Content-Type', 'application/json' )
						.expect( 204 )	// No content
						.end( function(err, res ) {
							// console.log( err );
						  	should.not.exist(err);
						  	done();
					  })
			  });
	  });
	  
	  after(function () {
	    micro.closeService();
	  });
});

