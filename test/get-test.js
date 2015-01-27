/**
 * get-test.js
 */

var request = require('supertest'),
	should = require('should'),
	sleep = require('sleep'),
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
	modelName = "GetTest";	// Will translate to lowercase


describe('GET Tests', function () {
	before(function () {
		micro
			.logFile("get-test.log")
			.controller( 
		  		controller.setup({ 
		  			del:  		[ { model: modelName, rights: "PUBLIC" } ],
		  			getOne:  	[ { model: modelName, rights: "PUBLIC" } ], 
		  			getMany:  	[ { model: modelName, rights: "PUBLIC" } ],
		  			post: 		[ { model: modelName, rights: "PUBLIC" } ],
		  			put: 		[ { model: modelName, rights: "PUBLIC" } ],
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
			password: { type: String, select: false }, 
		} );
		
		micro.listen( port );
		
		// PURGE all records 
		
		MochaTestDoc.remove( {"email": /@/ }, function( err )  {
			if( err ) { 
				console.error( err );
			}
		});	
		
	  });
	  	  
	  it( '#PROBLEM @GET01 GET filter responds with proper JSON', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testEmail = "test" + getRandomInt( 1000, 1000000 ) + "@filter.com"
			var testObject = { 
				email: testEmail, 
				status: "TEST GET filter" };
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
						// MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
						.query('filter={"email":"' + testEmail + '"}')
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res){
						  	should.not.exist(err);
							should.exist( res.body );
							// TODO: This fails now and then on cloud server.
							should.exist( res.body[0] );
						  	should.exist( res.body[0].email );
						  	should.exist( res.body[0].status );
						  	res.body[0].email.should.eql( testEmail )
						  	done();
					  })
			  });
	  });
	  	  	  
	  it( 'GET filter and FIELDS MULTI responds with proper JSON', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testEmail = "test" + getRandomInt( 1000, 1000000 ) + "@filter.com"
			var testObject = { 
				email: testEmail, 
				status: "TEST GET filter" };
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
						// MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
						.query('filter={"email":"' + testEmail + '"}')
						.query('fields=email status')
						// TODO options (findOne, etc)
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res){
						  	should.not.exist(err);
						  	should.exist( res.body[0].email );
						  	should.exist( res.body[0].status );
						  	res.body[0].email.should.eql( testEmail )
						  	done();
					  })
			  });
	  });
	  
	  it( 'GET filter and FIELDS FEWER responds with proper JSON', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testEmail = "test" + getRandomInt( 1000, 1000000 ) + "@filter.com"
			var testObject = { 
				email: testEmail, 
				status: "TEST GET filter" };
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
						// MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
						.query('filter={"email": "' + testEmail + '"}')
						.query('fields=email')
						// TODO options (findOne, etc)
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res){
						  	should.not.exist(err);
						  	should.exist( res.body[0].email );
						  	should.not.exist( res.body[0].status );
						  	res.body[0].email.should.eql( testEmail )
						  	done();
					  })
			  });
	  });
	  
	  it( 'GET DOCUMENT and NON-SELECTED default not selected', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@get.com", 
				status: "TEST GET NON-SELECTED",
				password: "FOO" };
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
						  	should.not.exist( res.body.password );
						  	res.body._id.should.eql( testId );
						  	res.body.email.should.eql( testObject.email );
						  	res.body.status.should.eql( testObject.status );
						  	done();
						})
			  });
	  });
	  
	  it( 'GET DOCUMENT and NON-SELECTED but FIELD SELECTED', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@get.com", 
				status: "TEST GET NON-SELECTED",
				password: "FOO" };
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
						.query('fields=email status password')
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res) {
						  	should.not.exist(err);
						  	should.exist( res.body._id );
						  	should.exist( res.body.email );
						  	should.exist( res.body.status );
						  	should.exist( res.body.password );
						  	res.body._id.should.eql( testId );
						  	res.body.email.should.eql( testObject.email );
						  	res.body.status.should.eql( testObject.status );
						  	res.body.password.should.eql( testObject.password );
						  	done();
						})
			  });
	  });
	  
	  it( 'GET DOCUMENT and FIELDS MULTI responds with proper JSON', function( done ) {
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
						.query('fields=email status')
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
	  
	  
	  it( 'GET DOCUMENT and FIELDS FEWER responds with proper JSON', function( done ) {
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
						.query('fields=email')
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res) {
						  	should.not.exist(err);
						  	should.exist( res.body._id );
						  	should.exist( res.body.email );
						  	should.not.exist( res.body.status );
						  	res.body._id.should.eql( testId );
						  	res.body.email.should.eql( testObject.email );
						  	// res.body.status.should.eql( testObject.status );
						  	done();
						})
			  });
	  });
	  
	  it( 'GET BAD filter FORMAT responds with proper JSON ERROR', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testEmail = "test" + getRandomInt( 1000, 1000000 ) + "@filter.com"
			var testObject = { 
				email: testEmail, 
				status: "TEST GET filter" };
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
						// USE SINGLE QUOTES LEADS TO ERROR
						.query("filter={'email':'" + testEmail + "'}")
						// .expect( 'Content-Type', /json/ )
						.expect( 403 )
						.end(function(err, res){
						  	should.not.exist(err);
						  	should.exist( res.body.error );
						  	// console.log( res.body.error );
						  	done();
					  })
			  });
	  });
	  
	  it( 'GET OPTIONS LIMIT responds with proper JSON', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testEmail = "test" + getRandomInt( 1000, 1000000 ) + "@limit.com"
			var testObject = { 
				email: testEmail, 
				status: "TEST GET filter" };
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
						// MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
						// .query('filter={"email":"' + testEmail + '"}')
						.query('options={"limit":1}')
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res){
						  	should.not.exist(err);
						  	should.exist( res.body[0].email );
						  	should.exist( res.body[0].status );
						  	should.not.exist( res.body[1] );
						  	done();
					  })
			  });
	  });
	  
	  it( 'GET OPTIONS SKIP responds with proper JSON', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testEmail = "test" + getRandomInt( 1000, 1000000 ) + "@limit.com"
			var testObject = { 
				email: testEmail, 
				status: "TEST GET filter" };
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
						.query('options={"sort": {"email":1},"limit":1 }')
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res){
						  	should.not.exist(err);
						  	var firstRecord = res.body[0];
						  	should.exist( res.body[0].email );
						  	should.exist( res.body[0].status );
						  	should.not.exist( res.body[1] );
							// GET
							request( testHost )
								.get( testUrl )
								.query('options={"sort": {"email":1},"limit":1,"skip":1}')
								.expect( 'Content-Type', /json/ )
								.expect( 200 )
								.end(function(err, res){
								  	should.not.exist(err);
								  	var secondRecord = res.body[0];
								  	should.exist( res.body[0].email );
								  	should.exist( res.body[0].status );
								  	should.not.exist( res.body[1] );
								  	// console.log( "COMPARE: " + firstRecord.email + " vs. " + secondRecord.email );
								  	firstRecord.email.should.not.eql( secondRecord.email );
								  	done();
							  })
					  })
			  });
	  });
	  
	  it( 'GET OPTIONS SORT responds with proper JSON', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			var testEmail = "test" + getRandomInt( 1000, 1000000 ) + "@sort.com"
			var testObject = { 
				email: testEmail, 
				status: "TEST GET filter" };
			// SETUP - ideally would ensure there are at least three records
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
						// MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
						.query('options={"sort":{"email":1} }')
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res){
						  	should.not.exist(err);
						  	if( res.body.length < 3 ) {
						  		console.log( 
						  			"WARNING: ideally would like at least 3 records to test sort");
							}
						  	var prev = null;
						  	for (var i in res.body) {
						  	  // console.log("EMAIL: " + res.body[i].email);
						  	  if( prev ) {
						  		  var compare = ( prev < res.body[i].email );
						  		  compare.should.be.Boolean;
						  		  compare.should.be.true;	// NOTE: JS parsers hate this.
						  	  }
						  	  prev = res.body[i].email;
						  	}
						  	done();
					  })
			  });
	  });
	  	  	  
	  after(function () {
	    micro.closeService();
	  });
});

