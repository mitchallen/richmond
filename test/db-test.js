/**
 * File: db-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    Richmond = require('../richmond'),
    micro = new Richmond(),
    config = require('./test-config'),
    getRandomInt = require('./test-lib').getRandomInt,
    service = config.service,
    port = service.port,
    prefix = service.prefix,
    dbConfig = config.mongoose,
    dbUser = dbConfig.user,
    dbPass = dbConfig.pass,
    modelName = "RichmondDbTest";    // Will translate to lowercase

describe('database', function () {
    before(function () {
        micro.logFile("db-test.log");
    });

    it('should accept a valid connection', function (done) {
        var options = {},
            dbConn = null;
        options = {
            user: dbUser,
            pass: dbPass
        };
        micro.connect(dbConfig.uri, options);
        dbConn = micro.connection();
        should.exist(dbConn);
        micro.closeConnection();
        done();
    });

    it('should not allow an undefined connection', function (done) {
        var options = {},
            exceptionCaught = false,
            dbConn = null;
        options = {
            user: dbUser,
            pass: dbPass
        };
        try {
            micro.connect(null, options);
        } catch (ex) {
            exceptionCaught = true;
            ex.message.should.containEql("connection string (uri) not defined");
        }
        exceptionCaught.should.eql(true);
        dbConn = micro.connection();
        should.not.exist(dbConn);
        done();
    });

    it('should not allow a null connection', function (done) {
        var options = {},
            exceptionCaught = false,
            dbConn = null;
        options = {
            user: dbUser,
            pass: dbPass
        };
        exceptionCaught = false;
        try {
            micro.connect(null, options);
        } catch (ex) {
            exceptionCaught = true;
            ex.message.should.containEql("connection string (uri) not defined");
        }
        exceptionCaught.should.eql(true);
        dbConn = micro.connection();
        should.not.exist(dbConn);
        done();
    });

    it('should not allow a user to connect with an undefined password', function (done) {
        var options = {},
            exceptionCaught = false,
            dbConn = null;
        options = {
            user: dbUser,
            pass: undefined
        };
        exceptionCaught = false;
        try {
            micro.connect(dbConfig.uri, options);
        } catch (ex) {
            exceptionCaught = true;
            ex.message.should.containEql("database password not defined");
        }
        exceptionCaught.should.eql(true);
        dbConn = micro.connection();
        should.not.exist(dbConn);
        done();
    });

    it('should not allow a user to connect with a null password', function (done) {
        var options = {},
            exceptionCaught = false,
            dbConn = null;
        options = {
            user: dbUser,
            pass: null
        };
        exceptionCaught = false;
        try {
            micro.connect(dbConfig.uri, options);
        } catch (ex) {
            exceptionCaught = true;
            ex.message.should.containEql("database password not defined");
        }
        exceptionCaught.should.eql(true);
        dbConn = micro.connection();
        should.not.exist(dbConn);
        done();
    });

    after(function () {
        micro.close();
    });
});