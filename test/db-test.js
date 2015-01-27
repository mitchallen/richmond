/**
 * File: db-test.js
 */

var request = require('supertest'),
	should = require('should'),
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

describe('richmond', function () {
	before(function () {
		micro.logFile("db-test.log");
	 });
	
	it( 'should accept a valid connection', function( done ) {
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
	
	it( 'should not allow an undefined connection', function( done ) {
		var options = {
				user: dbUser,
				pass: dbPass
		};
		var exceptionCaught = false;
		try {
			micro.connect( null, options );
		} catch( ex ) {
			exceptionCaught = true;
			ex.message.should.containEql("connection string not defined")
		}
		exceptionCaught.should.eql(true);
		var dbConn = micro.connection();
		should.not.exist( dbConn );
		done();
	});
	
	it( 'should not allow a null connection', function( done ) {
		var options = {
				user: dbUser,
				pass: dbPass
		};
		var exceptionCaught = false;
		try {
			micro.connect( null, options );
		} catch( ex ) {
			exceptionCaught = true;
			ex.message.should.containEql("connection string not defined")
		}
		exceptionCaught.should.eql(true);
		var dbConn = micro.connection();
		should.not.exist( dbConn );
		done();
	});
	
	it( 'should not allow a user to connect with an undefined password', function( done ) {
		var options = {
				user: dbUser,
				pass: undefined
		};
		try {
			micro.connect( connection, options );
		} catch( ex ) {
			exceptionCaught = true;
			ex.message.should.containEql("database password not defined")
		}
		exceptionCaught.should.eql(true);
		var dbConn = micro.connection();
		should.not.exist( dbConn );
		done();
	});
	
	it( 'should not allow a user to connect with a null password', function( done ) {
		var options = {
				user: dbUser,
				pass: null
		};
		try {
			micro.connect( connection, options );
		} catch( ex ) {
			exceptionCaught = true;
			ex.message.should.containEql("database password not defined")
		}
		exceptionCaught.should.eql(true);
		var dbConn = micro.connection();
		should.not.exist( dbConn );
		done();
	});
	
	after(function () {
		micro.close();
	});
});