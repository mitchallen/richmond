/**
 * File: db-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    TestConfig = require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
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

    after(function () {
        micro.close();
    });
});