/**
 * rights-admin-test.js
 */

var request = require('supertest'),
	should = require('should'),
	jwt = require('jwt-simple'),
	controller = require('@minja/richmond-web-controller'),
	Richmond = require('../richmond'),
	micro = new Richmond(),
	config = require('./test-config'),
	getRandomInt = require('./test-lib').getRandomInt,
	service   	= config.service,
	port 	= process.env.MOCHA_TEST_PORT || 3021,
	prefix 	= service.prefix,
	connection = service.dbConn,
	dbUser = service.dbUser,
	dbPass = service.dbPass,
	testHost = process.env.MOCHA_TEST_HOST || "http://localhost:" + port,
	modelName = "RightsAdminTest",
	testSecret = 'supersecret';

describe('Rights Admin', function () {
	before(function () {
		micro
			.logFile("rights-admin-test.log")
			.controller( 
		  		controller.setup({ 
		  			del:  		[{ model: modelName, rights: "PUBLIC" }],
		  			getOne:  	[{ model: modelName, rights: "PUBLIC" }], 
		  			getMany:  	[{ model: modelName, rights: "USER"   }],
		  			post: 		[{ model: modelName, rights: "ADMIN"  }],
		  			put: 		[{ model: modelName, rights: "PUBLIC" }]
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
	
	  it( 'ADMIN POST test', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@admin.com", 
				status: "TEST ADMIN POST" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'x-auth', jwt.encode( { username: "Mitch", role: "admin" }, testSecret ) )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end(function(err, res){
			  		should.not.exist(err);
				  	res.body.email.should.eql( testObject.email );
				  	res.body.status.should.eql( testObject.status );
				  	done();
			  	});
	  });
	  
	  it( 'ADMIN NO TOKEN test', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@admin.com", 
				status: "TEST ADMIN POST" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 401 )
			  	.end(function(err, res){
			  		should.not.exist(err);
			  		should.exist( res.body.error );
			  		// Should return: Request Error: Missing token
			  		// console.error( "NO TOKEN: " + res.body.error );
				  	done();
			  	});
	  });
	  
	  it( 'ADMIN BAD TOKEN SEGMENTS test', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@admin.com", 
				status: "TEST ADMIN POST" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'x-auth','BAD_TOKEN' )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 500 )
			  	.end(function(err, res){
			  		should.not.exist(err);
			  		should.exist( res.body.error );
			  		// Should return: Error: Not enough or too many segments
			  		// console.error( "BAD TOKEN SEGMENTS: " + res.body.error );
				  	done();
			  	});
	  });
	
	  it( 'ADMIN INVALID TOKEN test', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@admin.com", 
				status: "TEST ADMIN POST" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'x-auth',
			  	  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NABC.eyJ1c2VybmFtZSI6Ik1pdGNoIn0.XdF4h3e-5eR5LOjwTdph9a_yBvMLwnY6Ll5eEdQ_ZHk' )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 500 )
			  	.end(function(err, res){
			  		should.not.exist(err);
			  		should.exist( res.body.error );
			  		// SyntaxError: Unexpected token
			  		// console.error( "INVALID TOKEN: " + res.body.error );
				  	done();
			  	});
	  });
	  
	  it( 'UNAUTHORIZED ADMIN POST test', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@admin.com", 
				status: "TEST ADMIN POST" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'x-auth', jwt.encode( { username: "Mitch", role: "reader" }, testSecret ) )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 401 )
			  	.end(function(err, res){
			  		should.not.exist(err);
			  		should.exist( res.body.error );
				  	done();
			  	});
	  });
	  
	  it( 'ADMIN POST ROLE MISSING', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@admin.com", 
				status: "TEST ADMIN POST" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'x-auth', jwt.encode( { username: "Mitch" }, testSecret ) )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 401 )
			  	.end(function(err, res){
			  		should.not.exist(err);
			  		should.exist( res.body.error );
				  	done();
			  	});
	  });
	  
	  it( 'ADMIN POST BAD SECRET KEY', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@admin.com", 
				status: "TEST ADMIN POST" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'x-auth', jwt.encode( { username: "Mitch", role: "reader" }, 'BadSecretKey' ) )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 500 )
			  	.end(function(err, res){
			  		should.not.exist(err);
			  		// Error: Signature verification failed
			  		// console.log( JSON.stringify( res.body ) );
			  		should.exist( res.body.error );
				  	done();
			  	});
	  });
	  
	  it( 'ADMIN ACCESS USER VERB - GET COLLECTION', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@get.com", 
				status: "TEST GET COLLECTION" };
			// SETUP - need to post at least one record
			request( testHost )
				.post( testUrl )
				.send( testObject )
				.set( 'x-auth', jwt.encode( { username: "Mitch", role: "admin" }, testSecret ) )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end(function(err, res){
				  	should.not.exist(err);
					// GET
					request( testHost )
						.get( testUrl )
						.set( 'x-auth', jwt.encode( { username: "Mitch", role: "admin" }, testSecret ) )
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res){
						  	should.not.exist(err);
						  	should.exist( res.body[0].email );
						  	should.exist( res.body[0].status );
						  	done();
					  })
			  });
	  });
	  
	  it( 'ADMIN ACCESS PUBLIC VERB - GET DOCUMENT', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@get.com", 
				status: "TEST GET DOCUMENT" };
			// SETUP - need to post at least one record
			request( testHost )
				.post( testUrl )
				.send( testObject )
				.set( 'x-auth', jwt.encode( { username: "Mitch", role: "admin" }, testSecret ) )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end(function(err, res){
				  	should.not.exist(err);
				  	testId = res.body._id;
					// GET by ID
					request( testHost )
						.get( testUrl + "/" + testId )
						.set( 'x-auth', jwt.encode( { username: "Mitch", role: "admin" }, testSecret ) )
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res) {
						  	should.not.exist(err);
						  	should.exist( res.body._id );
						  	should.exist( res.body.email );
						  	should.exist( res.body.status );
						  	res.body._id.should.eql( testId );
						  	res.body.email.should.eql( testObject.email );
						  	res.body.status.should.eql( testObject.status );
						  	done();
						})
			  });
	  });
	  
	  after(function () {
		  micro.closeService();
	  });
});