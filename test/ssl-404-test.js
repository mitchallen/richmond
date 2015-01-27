/**
 * ssl-404-test.js
 */

var request = require('supertest'),
	should = require('should'),
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
	testHost = process.env.MOCHA_TEST_HOST ||"http://pageblizzard.ngrok.com",		
	sslHost  = process.env.MOCHA_TEST_SSL || "https://pageblizzard.ngrok.com",	
	modelName = "SslNotFoundTest";	// Will translate to lowercase

describe('SSL Not Found Tests', function () {
	before(function () {
		micro
			.logFile("ssl-404-test.log")
			.controller( 
		  		controller.setup({ 
		  			del:  		[{ model: modelName, rights: "PUBLIC", ssl: 404 }],
		  			getOne:  	[{ model: modelName, rights: "PUBLIC", ssl: 404 }], 
		  			getMany:  	[{ model: modelName, rights: "PUBLIC", ssl: 404 }],
		  			patch: 		[{ model: modelName, rights: "PUBLIC", ssl: 404 }],
		  			post: 		[{ model: modelName, rights: "PUBLIC", ssl: 404 }],
		  			put: 		[{ model: modelName, rights: "PUBLIC", ssl: 404 }],
		  		}))
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
	
	  it( '@JENKINS POST NON-SSL NOT FOUND', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@post.com", 
				status: "TEST POST" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 404 )	// Not found
			  	.end(function(err, res){
			  		should.not.exist(err);
				  	done();
			  	});
	  });
	  
	  it( 'GET COLLECTION NON-SSL NOT FOUND', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@get.com", 
				status: "TEST GET COLLECTION" };
				// GET
				request( testHost )
					.get( testUrl )
					// .expect( 'Content-Type', /json/ )
					.expect( 404 )
					.end(function(err, res){
						should.not.exist(err);
						done();
					 })
	  });
	  
	  // TODO - write test where ID not valid
	  
	  it( 'GET DOCUMENT NON-SSL NOT FOUND', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@get.com", 
				status: "TEST GET DOCUMENT" };
			// SETUP - need to post at least one record
			// Need to use SSL for post
			request( sslHost )
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
						// .expect( 'Content-Type', /json/ )
						.expect( 404 )
						.end(function(err, res) {
							should.not.exist(err);
						  	done();
						})
			  });
	  });
	  
	  it( 'DELETE NON-SSL NOT FOUND', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@zap.com", 
				status: "TEST DELETE" };
			// SETUP - need to post at least one record
			// For POST need to use SSL or will fail.
			var testId = "";
			request( sslHost )
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
						.expect( 404 )
						.end( function(err, res) {
						  	should.not.exist(err);
						  	done();
					  })
			  });
	  });
	  
	  it( 'PUT NON-SSL NOT FOUND', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@put.com", 
				status: "TEST PUT" };
			// SETUP - need to post at least one record
			// For POST need to use SSL or test will fail
			request( sslHost )
				.post( testUrl )
				.send( testObject )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end( function(err, res) {
				  	should.not.exist(err);
				  	// PUT
					var testId = res.body._id;
					var putUrl = testUrl + "/" + testId;
					request( testHost )
						.put( putUrl )
						.send( { status: "UPDATED" } )
						// .set( 'Content-Type', 'application/json' )
						.expect( 404 )	
						.end( function(err, res ) {
						  	should.not.exist(err);
						  	done();
					  })
			  });
	  });
	  
	  it( 'PATCH NON-SSL NOT FOUND', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@patch.com", 
				status: "TEST PATCH" };
			// POST a new doc
			request( sslHost )				
				.post( testUrl )
				.send( testObject )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end( function(err, res) {
				  	should.not.exist(err);
				  	// PATCH
					var newStatus = "UPDATED PATCH";
					var testId = res.body._id;
					request( testHost )	
						.patch( testUrl + "/" + testId )
						.send( 
							[
							 { "op": "replace", "path": "/status", "value": newStatus }
							] )
						// Uncaught TypeError: Argument must be a string 
						// .set( 'Content-Type', 'application/json-patch' )
						.set( 'Content-Type', 'application/json' )
						.expect( 404 )	
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
