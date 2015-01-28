/**
 * post-test.js
 */

var request = require('supertest'),
	should = require('should'),
	bcrypt = require("bcrypt"),
	jsonpatch = require("fast-json-patch")
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
	modelName = "PostTest";	// Will translate to lowercase

MochaTestDoc = null;

describe('POST Test Suite', function () {
	before(function () {
		
		var testExtraMessage = 'Testing 123';
		
		var beforePost = 
		    function( err, prop, next ) {
				// console.log( "BEFORE POST")
				if( ! prop.req ) 
					return err( new Error("(before) prop.req not found") );
				if( ! prop.req.body ) 
					return err( new Error("(before) prop.req.body not found") );
				// Will cause fail in missing field test (which deliberatey removes password)
				// if( ! prop.req.body.password ) 
					// return err( new Error("(before) prop.req.body.password not found") );
				var extras = { message: testExtraMessage };
				var body = prop.req.body;
				if( body.password != undefined ) {
					bcrypt.hash( body.password, 10, function( err, hash ) {
						if( err ) console.err( err );
						body.password = hash;
						// console.log( "PASSWORD HASH: " + hash )
						next( body, extras );
					} );
				} else {
					next( body, extras );
				}
			};
		
		var afterPost = 
			function( err, prop, next ) {
				if( ! prop.req ) return err( new Error("(after) prop.req not found") );
				if( ! prop.res ) return err( new Error("(after) prop.res not found") );
				if( ! prop.result ) return err( new Error("(after) prop.result not found") );
				// See: http://perfectionkills.com/understanding-delete/
				// Need to clone and convert doc or delete / remove may fail
				// TODO - use non-blocking clone module ?
				var doc = JSON.parse(JSON.stringify( prop.result ));
				thepatch = [ 
			            { "op": "remove", "path": "/password" } 
			            ];
				// TODO - check on whether or not this blocks.
				jsonpatch.apply( doc, thepatch );
				var extras = prop.extras;
				// console.log( "EXTRAS: " + extras.message );
				if( extras.message != testExtraMessage ) {
					throw new Error( "Test extra message not what expected.");
				}
				next( doc );
			};
		
		micro
			.logFile("post-test.log")
			.controller( 
		  		controller.setup({ 
		  			del:  		[{ model: modelName, rights: "PUBLIC" }],
		  			getOne:  	[{ model: modelName, rights: "PUBLIC" }], 
		  			getMany:  	[{ model: modelName, rights: "PUBLIC" }],
		  			post: 		[{ model: modelName, rights: "PUBLIC", before: beforePost, after: afterPost }],
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
			password: { type: String, required: true, select: false },
			status: { type: String, required: true },   
		} );
						
		micro.listen( port );
		
	  });
	  
	  it( 'POST before and after test', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@afterpost.com", 
				password: "foo",
				status: "Testing beforePost and afterPost" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 201 )
			  	.end(function(err, res) {
			  		should.not.exist(err);
			  		// console.log( res.body );
				  	res.body.email.should.eql( testObject.email );
				  	// Should not return password
				  	should.not.exist( res.body.password );
				  	res.body.status.should.eql( testObject.status );
				  	testId = res.body._id;
					// GET by ID
					request( testHost )
						.get( testUrl + "/" + testId )
						// Have to request password since it's defined as select: false
						.query('fields=email status password')
						.expect( 'Content-Type', /json/ )
						.expect( 200 )
						.end(function(err, res) {
						  	should.not.exist(err);
						  	should.exist( res.body );
						  	should.exist( res.body._id );
						  	should.exist( res.body.email );
						  	should.exist( res.body.password );
						  	should.exist( res.body.status );
						  	res.body._id.should.eql( testId );
						  	res.body.email.should.eql( testObject.email );
						  	// password should now be encrypted
						  	// TODO - verify encrypted
						  	// console.log( "ENCRYPTED PASSWORD: " + res.body.password );
						  	bcrypt.compareSync( 
						  		testObject.password, res.body.password
						  	).should.eql(true);
						  	res.body.password.should.not.equal( testObject.foo );
						  	res.body.status.should.eql( testObject.status );
						  	
							// PURGE all records 

							MochaTestDoc.remove( {"email": /@/ }, function( err )  {
								if( err ) { 
									console.error( err );
								}
								done();
							});	
						})
			  	});
	  })
	
	  it( 'POST MISSING REQUIRED FIELD', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@post.com"  };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 403 )
			  	.end(function(err, res){
			  		should.not.exist(err);
				  	done();
			  	});
	  });
	  
	  after(function () {
		  micro.closeService();
	  });
});


