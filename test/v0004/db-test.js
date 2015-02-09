/**
 * File: db-test.js
 */

"use strict";

/*global describe, it, before, after*/

var Richmond = require('../../richmond'),
    request = require('supertest'),
    should = require('should'),
    TestConfig = require('./test-config'),
    config = new TestConfig(),
    getRandomInt = require('./test-lib').getRandomInt,
    service = config.service,
    port = service.port,
    prefix = service.prefix,
    dbConfig = service.database,
    dbUser = dbConfig.options.user,
    dbPass = dbConfig.options.pass,
    modelName = "RichmondDbTest";    // Will translate to lowercase

describe('database' + config.versionLabel, function () {

    it('should accept a valid connection parameters via connect', function (done) {
        var micro = new Richmond(),
            options = {},
            dbConn = null;
        micro.logFile("db-test-" + config.logVersion + "-A.log");
        options = {
            user: dbUser,
            pass: dbPass
        };
        micro.connect(dbConfig.uri, options);
        dbConn = micro.connection();
        should.exist(dbConn);
        micro.closeConnection();
        micro.close();
        done();
    });

    it('should accept a valid connection parameters via setup', function (done) {
        var micro = new Richmond(),
            dbConn = null;
        micro
            .setup(service)
            .logFile("db-test-" + config.logVersion + "-B.log")
            .connect();
        dbConn = micro.connection();
        should.exist(dbConn);
        micro.closeConnection();
        micro.close();
        done();
    });

    it('should accept a valid connection parameters via constructor', function (done) {
        var micro = new Richmond(service),
            dbConn = null;
        micro
            .logFile("db-test-" + config.logVersion + "-B.log")
            .connect();
        dbConn = micro.connection();
        should.exist(dbConn);
        micro.closeConnection();
        micro.close();
        done();
    });

});