/**
 * get-wrapper-test.js
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
	testSecret = 'supersecret',
	testHost = process.env.MOCHA_TEST_HOST || "http://pageblizzard.ngrok.com",		
	sslHost  = process.env.MOCHA_TEST_SSL || "https://pageblizzard.ngrok.com",
	modelName = "GetBeforeAfterTest",	// Will translate to lowercase
	ownerEmail = "test@owner.com", 
    afterTestEmail = "test" + getRandomInt( 1000, 1000000 ) + "@after.com",
	testAfterDocStatus = "UPDATED by afterGet";

var MochaTestDoc = null;

describe('GET BEFORE / AFTER Tests', function () {
	before(function () {
		
		var testExtraMessage = 'Testing 123';
		
		// getMany wrappers
		
		var beforeMany = function( err, prop, next ) {
			// console.log("#### DEBUG - BEFORE COLLECTION")
			if( ! prop.req ) return err( new Error("prop.req not found") );
			var req = prop.req;
			var filter = req.query.filter;
			var fields = req.query.fields;
			var options = req.query.options;
			var token = req.token;
			// console.log( "TOKEN: " + JSON.stringify( token ) );
			if( filter ) {
				// console.log( "FILTER: " + JSON.stringify( filter ) );
				var f2 = JSON.parse( filter );	// parse object 
				if( f2.email != token.email ) {
					// console.log( "[" + f2.email + "] vs. [" + token.email + "]" );
					err( new Error("filter.email != auth.email"));
					return;
				}
			}
			if( fields ) {
				// console.log( "FIELDS: " + fields );
			}
			if( options ) {
				// console.log( "OPTIONS: " + options );
			}
			
			var extras = { message: testExtraMessage };
			
			next( filter, fields, extras, options );
		};
		
		var afterMany = function( err, prop, next ) {
			if( ! prop.req ) return err( new Error("prop.req not found") );
			if( ! prop.docs ) return err( new Error("prop.docs not found") );
			var req = prop.req;
			var docs = prop.docs;
			var extras = prop.extras;
			// console.log( "EXTRAS: " + extras.message );
			if( extras.message != testExtraMessage ) {
				throw new Error( "Test extra message not what expected.");
			}
			// console.log( "Number of docs: " + docs.length );
			// console.log( JSON.stringify( docs ) );
			docs.push( { 
					// email: "after@test.com", 
				    email:  afterTestEmail, 
					status: testAfterDocStatus } );
			next( docs );
		};
		
		// getOne wrappers
		
		var beforeOne = function( err, prop, next ) {
			if( ! prop.req ) return err( new Error("prop.req not found") );
			var req = prop.req;
			var fields = req.query.fields;	// Optional
			// Token may not always exist, but for these tests it should.
			if( ! req.token ) return err( new Error("req.token not found") );
			// console.log( "TOKEN: " + JSON.stringify( req.token ) );
			if( fields ) console.log( "FIELDS: " + fields );
			var extras = { message: testExtraMessage };
			next( fields, extras );
		};
		
		var afterOne = function( err, prop, next ) {
			if( ! prop.req ) return err( new Error("prop.req not found") );
			if( ! prop.doc ) return err( new Error("prop.req not found") );
			var doc = prop.doc;
			var extras = prop.extras;
			// console.log( "EXTRAS: " + extras.message );
			if( extras.message != testExtraMessage ) {
				throw new Error( "Test extra message not what expected.");
			}
			doc.status = testAfterDocStatus;
			// console.log( JSON.stringify( doc ) );
			next( doc );
		};
		
		micro
			.logFile("get-wrapper-test.log")
			.controller( 
		  		controller.setup({ 
		  			getOne:  	[{ model: modelName, rights: "PUBLIC", 	before: beforeOne, after: afterOne  }], 
		  			getMany:  	[{ model: modelName, rights: "USER", 	ssl: 302, before: beforeMany, after: afterMany }],
		  			post: 		[{ model: modelName, rights: "PUBLIC" }]
		  		}))
			.secret( testSecret )
			.prefix( prefix );	// API prefix, i.e. http://localhost/v1/testdoc
		
		var options = {
				user: dbUser,
				pass: dbPass
		};
		micro.connect( connection, options );
		MochaTestDoc = micro.addModel( modelName, {
			email: 	{ type: String, required: true },
			status: { type: String, required: true },
			password: { type: String, select: false }, 
		} );
		
		micro.listen( port );
			
	  });
	  	  
	  it( 'GET filter responds with proper JSON', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();	
			// var testEmail = ownerEmail;
			var testEmail = afterTestEmail;
			var testObject = { 
				email: testEmail, 
				status: "TEST GET filter" };
			// SETUP - need to post at least one record
			// sslHost
			request( /* sslHost */ testHost )
				.post( testUrl )
				.send( testObject )
				//.set( 'Content-Type', 'application/json' ) // If move, returns HTML
			  	// .expect( 201 ) // Post to NON-SSL
				// .expect( 302 )	// Post to SSL
			  	.end(function(err, res){
				  	should.not.exist(err);
					// GET
					request(  sslHost )
						.get( testUrl )
						.set( 'x-auth', jwt.encode( { email: testEmail, role: "user" }, testSecret ) )
						.query('filter={"email":"' + testEmail + '"}')
						// MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
						// .expect( 'Content-Type', /json/ )	// Sometimes returns 302 / HTML (nginx)
						.expect( 200 )
						.end(function(err, res){
						  	should.not.exist(err);
						  	should.exist( res.body );
						  	should.exist( res.body.length );
						  	// Should be 2 because afterGet added something
						  	res.body.length.should.eql(2); 
						  	// console.log( JSON.stringify( res.body ));
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
						.set( 'x-auth', jwt.encode( { email: ownerEmail, role: "user" }, testSecret ) )
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res) {
						  	should.not.exist(err);
						  	should.exist( res.body._id );
						  	should.exist( res.body.email );
						  	should.exist( res.body.status );
						  	res.body._id.should.eql( testId );
						  	res.body.email.should.eql( testObject.email );
						  	res.body.status.should.eql( testAfterDocStatus );
						  	done();
						})
			  });
	  });
	  
	  after(function () {
		    micro.closeService();
	 });
});

