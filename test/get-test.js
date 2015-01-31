/**
 * get-test.js
 */

var request = require('supertest'),
	should = require('should'),
	sleep = require('sleep'),
	controller = require('@minja/richmond-web-controller'),
	Richmond = require('../richmond'),
	micro = new Richmond(),
	config = require('./test-config'),
	getRandomInt = require('./test-lib').getRandomInt,
	service   	= config.service,
	port 	= service.port,
	prefix 	= service.prefix,
	dbConfig = config.mongoose,
	testHost = service.host,
	MochaTestDoc = null,
	modelName = "GetTest";	// Will translate to lowercase

describe('get', function () {
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
			user: dbConfig.user,
			pass: dbConfig.pass
		};
		micro.connect( dbConfig.uri, options );
		MochaTestDoc = micro.addModel( modelName, {
			email: 	{ type: String, required: true },
			status: { type: String, required: true },
			password: { type: String, select: false }, 
		} );
		micro.listen( port );		
	  });
	  	  
	  it( 'should get a filtered document', function( done ) {
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
							should.exist( res.body[0] );
						  	should.exist( res.body[0].email );
						  	should.exist( res.body[0].status );
						  	res.body[0].email.should.eql( testEmail )
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
	  	  	  
	  it( 'should get fields from a list', function( done ) {
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
	  
	  it( 'should get a single field', function( done ) {
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
	  
	  it( 'should not get field where select equals false', function( done ) {
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
	  
	  it( 'should get field even though selected equals false', function( done ) {
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
	  
	  it( 'should get multiple selected fields', function( done ) {
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
	  
	  
	  it( 'should only get a single field and an id', function( done ) {
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
	  
	  it( 'should get an error for a bad filter format', function( done ) {
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
						.expect( 403 )
						.end(function(err, res){
						  	should.not.exist(err);
						  	should.exist( res.body.error );
						  	done();
					  })
			  });
	  });
	  
	  it( 'should get a limited number of documents', function( done ) {
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
	  
	  it( 'should get a skipped document', function( done ) {
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
								  	firstRecord.email.should.not.eql( secondRecord.email );
								  	done();
							  })
					  })
			  });
	  });
	  
	  it( 'should get a sorted list of documents', function( done ) {
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

