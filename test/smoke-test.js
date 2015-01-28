/**
 * smoke-test.js
 */

var request = require('supertest'),
	should = require('should'),
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
	modelName = "SmokeTest",	// Will translate to lowercase
	MochaTestDoc = null;

describe('@SMOKE Smoke Test the Service', function () {
	before(function () {
		micro
			.logFile("smoke-test.log")
			.controller( 
		  		controller.setup({ 
		  			del:  		[{ model: modelName, rights: "PUBLIC" }],
		  			getOne:  	[{ model: modelName, rights: "PUBLIC" }], 
		  			getMany:  	[{ model: modelName, rights: "PUBLIC" }],
		  			post: 		[{ model: modelName, rights: "PUBLIC" }],
		  			put: 		[{ model: modelName, rights: "PUBLIC" }],
		  		}))
			.prefix( prefix );	// API prefix, i.e. http://localhost/v1/testdoc
		var options = {
				user: dbUser,
				pass: dbPass
		};
		micro.connect( connection, options );
		MochaTestDoc = micro.addModel( modelName, {
			email: 	{ type: String, required: true },
			status: { type: String, required: true },   
		} );
		
		micro.listen( port );		
	  });
	  
	  it( '@SMOKE POST test', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@post.com", 
				status: "TEST POST" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end(function(err, res){
			  		should.not.exist(err);
				  	res.body.email.should.eql( testObject.email );
				  	res.body.status.should.eql( testObject.status );
					// PURGE all records 
					MochaTestDoc.remove( {"email": /@/ }, function( err )  {
						if( err ) { 
							console.error( err );
						}
						done();
					});	
			  	});
	  });
	  	  	  
	  it( 'GET COLLECTION responds with proper JSON', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@get.com", 
				status: "TEST GET COLLECTION" };
			// SETUP - need to post at least one record
			request( testHost )
				.post( testUrl )
				.send( testObject )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end(function(err, res){
				  	should.not.exist(err);
					// GET
					request( testHost )
						.get( testUrl )
						// .expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res){
						  	should.not.exist(err);
						  	should.exist( res.body[0].email );
						  	should.exist( res.body[0].status );
						  	done();
					  })
			  });
	  });
	  	  
	  it( 'GET DOCUMENT responds with proper JSON', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@get.com", 
				status: "TEST GET DOCUMENT" };
			// SETUP - need to post at least one record
			request( testHost )
				.post( testUrl )
				.send( testObject )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end(function(err, res){
				  	should.not.exist(err);
				  	testId = res.body._id;
					// GET by ID
					request( testHost )
						.get( testUrl + "/" + testId )
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
	  	  
	  it( 'DELETE test', function( done ) {
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
						.expect( 200 )
						.end( function(err, res) {
						  	should.not.exist(err);
						  	done();
					  })
			  });
	  });
	  
	  it( 'PUT test', function( done ) {
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
						.set( 'Content-Type', 'application/json' )
						.expect( 204 )	// No content
						.end( function(err, res ) {
						  	should.not.exist(err);
						  	done();
					  })
			  });
	  });
	  
	  after(function () {
	    micro.closeService();
	  });
});

