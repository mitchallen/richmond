/**
 * File: db-test.js
 */

var request = require('supertest'),
	should = require('should'),
	// async = require('async'),
	micro = require('../richmond'),
	config = require('./test-config'),
	getRandomInt = require('./test-lib').getRandomInt,
	service   	= config.service,
	port 	= process.env.MOCHA_TEST_PORT || 3021,
	prefix 	= service.prefix,
	connection = service.dbConn,
	dbUser = service.dbUser,
	dbPass = service.dbPass,
	modelName = "RichmondDbTest";	// Will translate to lowercase

describe('DB Tests', function () {
	before(function () {
		micro.logFile("./log/db-test.log");
	 });
	
	it( 'DB valid connection', function( done ) {
		var options = {
				user: dbUser,
				pass: dbPass
		};
		
		micro.connect( connection, options );
		var dbConn = micro.connection();
		should.exist( dbConn );
		micro.closeConnection();
		done();
	});
	
	it( 'DB connection is undefined', function( done ) {
		var options = {
				user: dbUser,
				pass: dbPass
		};
		
		var tempConn = undefined;
		try {
			micro.connect( tempConn, options );
			throw new Error( "connect() should have thrown an exception");
		} catch( ex ) {
			// Expected
		}
		
		var dbConn = micro.connection();
		should.not.exist( dbConn );
		done();
	});
	
	it( 'DB connection is null', function( done ) {
		var options = {
				user: dbUser,
				pass: dbPass
		};
		
		var tempConn = null;
		try {
			micro.connect( tempConn, options );
			throw new Error( "connect() should have thrown an exception");
		} catch( ex ) {
			// Expected
		}
		
		var dbConn = micro.connection();
		should.not.exist( dbConn );
		done();
	});
	
	it( 'DB password is undefined', function( done ) {
		var options = {
				user: dbUser,
				pass: undefined
		};
		
		try {
			micro.connect( connection, options );
			throw new Error( "connect() should have thrown an exception");
		} catch( ex ) {
			// Expected
		}
		
		var dbConn = micro.connection();
		should.not.exist( dbConn );
		done();
	});
	
	it( 'DB password is null', function( done ) {
		var options = {
				user: dbUser,
				pass: null
		};
		
		try {
			micro.connect( connection, options );
			throw new Error( "connect() should have thrown an exception");
		} catch( ex ) {
			// Expected
		}
		
		var dbConn = micro.connection();
		should.not.exist( dbConn );
		done();
	});
	
	after(function () {
		micro.close();
	});
});