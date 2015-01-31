/**
 * File: post-after-res-test.js
 */

var request = require('supertest'),
	should = require('should'),
	bcrypt = require("bcrypt"),
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
	modelName = "PostTest";	// Will translate to lowercase

var MochaTestDoc = null;

describe('post after error', function () {
	before(function () {
	
		var testExtraMessage = 'Testing 123';
		
		var beforePost = function( err, prop, next ) {
			if( ! prop.req ) 
				return err( new Error("(before) prop.req not found") );
			if( ! prop.req.body ) 
				return err( new Error("(before) prop.req.body not found") );
			// Will cause fail in missing field test (which deliberately removes password)
			// if( ! prop.req.body.password ) 
				// return err( new Error("(before) prop.req.body.password not found") );
			var extras = { message: testExtraMessage };
			var body = prop.req.body;
			if( body.password != undefined ) {
				bcrypt.hash( body.password, 10, function( err, hash ) {
					if( err ) console.err( err );
					body.password = hash;
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
			var req = prop.req;
			var res = prop.res;
			var result = prop.result;
			// Testing Response
			res.status(402).json( { error: "Payment required." } );
			// next( doc );	// Don't call when intercepting
		};
		
		micro
			.logFile("post-after-res-test.log")
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
				user: dbConfig.user,
				pass: dbConfig.pass
			};
		micro.connect( dbConfig.uri, options );
		MochaTestDoc = micro.addModel( modelName, {
			email: 	{ type: String, required: true },
			password: { type: String, required: true, select: false },
			status: { type: String, required: true },   
		} );
					
		micro.listen( port );
	});


	it( 'should return the injected error', function( done ) {
			var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
			var testObject = { 
				email: "test" + getRandomInt( 1000, 1000000 ) + "@afterpost.com", 
				password: "foo",
				status: "Testing beforePost and afterPost" };
			request( testHost )
			  	.post( testUrl )
			  	.send( testObject )
			  	.set( 'Content-Type', 'application/json' )
			  	.expect( 402 )
			  	.end(function(err, res) {
			  		should.not.exist(err);
					// PURGE all records 
					MochaTestDoc.remove( {"email": /@/ }, function( err )  {
						if( err ) { 
							console.error( err );
						}
						done();
					});	
			  	});
	  })

	after(function () {
		micro.closeService();
	});
});
