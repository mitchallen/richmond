/**
 * multi-test.js
 */

var request = require('supertest'),
	should = require('should'),
	controller = require('@minja/richmond-web-controller'),
	micro = require('../richmond'),
	config = require('./test-config'),
	getRandomInt = require('./test-lib').getRandomInt,
	service = config.service,
	port 	= process.env.MOCHA_TEST_PORT || 3021,
	prefix 	= service.prefix,
	connection = service.dbConn,
	dbUser = service.dbUser,
	dbPass = service.dbPass,
	testHost = process.env.MOCHA_TEST_HOST || "http://localhost:" + port,
	modelName = ["AlphaTest","BetaTest"];

describe('Multiple Model Tests', function () {
	before(function () {
		 micro
		 	.logFile("./log/multi-test.log")
		    .controller( 
		    	controller.setup({ 
		  			del:  		[ { model: modelName[0], rights: "PUBLIC" },
		  			      		  { model: modelName[1], rights: "PUBLIC" } ],
		  			getOne:  	[ { model: modelName[0], rights: "PUBLIC" },
		  			      		  { model: modelName[1], rights: "PUBLIC" } ], 
		  			getMany:  	[ { model: modelName[0], rights: "PUBLIC" },
		  			      		  { model: modelName[1], rights: "PUBLIC" } ],
		  			post: 		[ { model: modelName[0], rights: "PUBLIC" },
		  			      		  { model: modelName[1], rights: "PUBLIC" } ],
		  			put: 		[ { model: modelName[0], rights: "PUBLIC" },
		  			      		  { model: modelName[1], rights: "PUBLIC" } ]
		  		}))
			.prefix( prefix );	// API prefix, i.e. http://localhost/v1/testdoc
		 
		var options = {
				user: dbUser,
				pass: dbPass
		};
		micro.connect( connection, options );
		
		// Model[0]
		
		var AlphaTestDoc = micro.addModel( modelName[0], {
			email: 	{ type: String, required: true },
			status: { type: String, required: true },   
		} );
			
		// Model[1]
		
		var BetaTestDoc = micro.addModel( modelName[1], {
			user: { type: String, required: true },
			level: { type: String, required: true },   
		} );
				
		micro.listen( port );
		
		// PURGE all records 
		
		AlphaTestDoc.remove( {"email": /@/ }, function( err )  {
			if( err ) { 
				console.error( err );
			}
		});	
		
		BetaTestDoc.remove( {"user": /@/ }, function( err )  {
			if( err ) { 
				console.error( err );
			}
		});
 
	});
		
	it( 'POST ALPHA', function( done ) {
		var testUrl = prefix.toLowerCase() + "/" + modelName[0].toLowerCase();
		var testObject = { 
			email: "test" + getRandomInt( 1000, 1000000 ) + "@alpha.com", 
			status: "TEST POST ALPHA" };
		request( testHost )
			.post( testUrl )
			.send( testObject )
			.set( 'Content-Type', 'application/json' )
			.expect( 201 )
			.end(function(err, res){
				should.not.exist(err);
				should.exist( res.body.email );
				should.exist( res.body.status );
				res.body.email.should.eql( testObject.email );
				res.body.status.should.eql( testObject.status );
				done();
			 });
	});
	
	it( 'POST BETA', function( done ) {
		var testUrl = prefix.toLowerCase() + "/" + modelName[1].toLowerCase();
		var testObject = { 
			user: "test" + getRandomInt( 1000, 1000000 ) + "@beta.com", 
			level: "TEST POST BETA" };
		request( testHost )
			.post( testUrl )
			.send( testObject )
			.set( 'Content-Type', 'application/json' )
			.expect( 201 )
			.end(function(err, res){
				should.not.exist(err);
				should.exist( res.body.user );
				should.exist( res.body.level );
				res.body.user.should.eql( testObject.user );
				res.body.level.should.eql( testObject.level );
				done();
			 });
	});
	
	
	it( 'GET COLLECTION ALPHA JSON', function( done ) {
		var testUrl = prefix.toLowerCase() + "/" + modelName[0].toLowerCase();	
		var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@alpha.com", 
				status: "TEST GET COLLECTION ALPHA" };
		// SETUP - need to post at least one record
		request( testHost )
			.post( testUrl )
			.send( testObject )
			.set( 'Content-Type', 'application/json' )
			.expect( 201 )
			.end( function(err, res) {
				should.not.exist(err);
				// GET
				request( testHost )
					.get( testUrl )
					.expect( 'Content-Type', /json/ )
					.expect( 200 )
					.end( function(err, res) {
						should.not.exist(err);
						should.exist( res.body[0].email );
						should.exist( res.body[0].status );
						done();
					})
			  });
	 });
	
	it( 'GET COLLECTION BETA JSON', function( done ) {
		var testUrl = prefix.toLowerCase() + "/" + modelName[1].toLowerCase();	
		var testObject = { 
			user: "test" + getRandomInt( 1000, 1000000 ) + "@beta.com", 
			level: "TEST GET COLLECTION BETA" };
		// SETUP - need to post at least one record
		request( testHost )
			.post( testUrl )
			.send( testObject )
			.set( 'Content-Type', 'application/json' )
			.expect( 201 )
			.end( function(err, res) {
				should.not.exist(err);
				// GET
				request( testHost )
					.get( testUrl )
					.expect( 'Content-Type', /json/ )
					.expect( 200 )
					.end( function(err, res) {
						should.not.exist(err);
						should.exist( res.body[0].user );
						should.exist( res.body[0].level );
						done();
					})
			  });
	 });
	
	 it( 'GET DOCUMENT ALPHA', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName[0].toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@alpha.com", 
				status: "TEST GET DOCUMENT ALPHA" };
			// SETUP - need to post at least one record
			request( testHost )
				.post( testUrl )
				.send( testObject )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end(function(err, res){
				  	should.not.exist(err);
				  	var testId = res.body._id;
					// GET by ID
					request( testHost )
						.get( testUrl + "/" + res.body._id )
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
	
	 
	it( 'GET DOCUMENT BETA', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName[1].toLowerCase();	
			var testObject = { 
				user: "test" + getRandomInt( 1000, 1000000 ) + "@beta.com", 
				level: "TEST GET DOCUMENT BETA" };
			// SETUP - need to post at least one record
			request( testHost )
				.post( testUrl )
				.send( testObject )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end(function(err, res){
				  	should.not.exist(err);
				  	var testId = res.body._id;
					// GET by ID
					request( testHost )
						.get( testUrl + "/" + res.body._id )
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res) {
						  	should.not.exist(err);
						  	should.exist( res.body._id );
						  	should.exist( res.body.user );
						  	should.exist( res.body.level );
						  	res.body._id.should.eql( testId );
						  	res.body.user.should.eql( testObject.user );
						  	res.body.level.should.eql( testObject.level );
						  	done();
					  })
			  });
	});
	
	it( 'DELETE ALPHA', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName[0].toLowerCase();	
			var testObject = { 
					email: "test" + getRandomInt( 1000, 1000000 ) + "@alpha.com", 
					status: "TEST DELETE ALPHA" };
			// SETUP - need to post at least one record		
			var testId = "";
			request( testHost )
				.post( testUrl )
				.send( testObject )
				.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end( function(err, res) {
				  	should.not.exist(err);
				  	// DELETE
					var zapUrl = testUrl + "/" + res.body._id;
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
	
	it( 'DELETE BETA', function( done ) {
		var testUrl = prefix.toLowerCase() + "/" + modelName[1].toLowerCase();	
		var testObject = { 
				user: "test" + getRandomInt( 1000, 1000000 ) + "@beta.com", 
				level: "TEST DELETE BETA" };
		// SETUP - need to post at least one record		
		var testId = "";
		request( testHost )
			.post( testUrl )
			.send( testObject )
			.set( 'Content-Type', 'application/json' )
		  	.expect( 201 )
		  	.end( function(err, res) {
			  	should.not.exist(err);
			  	// DELETE
				var zapUrl = testUrl + "/" + res.body._id;
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
	
	it( 'PUT ALPHA', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName[0].toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@alpha.com", 
				status: "TEST PUT ALPHA" };
			// SETUP - need to post at least one record
			var testId = "";
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
	
	it( 'PUT BETA', function( done ) {
		var testUrl = prefix.toLowerCase() + "/" + modelName[1].toLowerCase();	
		var testObject = { 
			user: "test" + getRandomInt( 1000, 1000000 ) + "@beta.com", 
			level: "TEST PUT BETA" };
		// SETUP - need to post at least one record
		var testId = "";
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

