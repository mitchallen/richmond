/**
 * smoke-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    Richmond = require('../../richmond'),
    TestConfig = require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
    controller = config.controller,
    getRandomInt = require('./test-lib').getRandomInt,
    service = config.service,
    prefix = service.prefix,
    testHost = config.host.url,
    modelName = "SmokeTest",    // Will translate to lowercase
    MochaTestDoc = null;

describe('negative tests' + config.versionLabel, function () {
    before(function () {
        micro
            .logFile(config.logFolder + "smoke-test-" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC" }],
                    getOne:     [{ model: modelName, rights: "PUBLIC" }],
                    getMany:    [{ model: modelName, rights: "PUBLIC" }],
                    post:       [{ model: modelName, rights: "PUBLIC" }],
                    put:        [{ model: modelName, rights: "PUBLIC" }],
                })
            );
        MochaTestDoc = micro.addModel(modelName, {
            email:  { type: String, required: true },
            status: { type: String, required: true },
        });
        micro.listen();
    });

    after(function () {
        micro.closeService();
    });

    it('constructor with no arguments should return object', function (done) {
        var richmond = new Richmond();
        should.exist(richmond);
        done();
    });

    it('.setup with no arguments should return object', function (done) {
        var richmond = new Richmond(),
            result = richmond.setup();
        should.exist(result);
        done();
    });

    it('.logFile with no arguments should throw error', function (done) {
        var richmond = new Richmond();
        (function(){
            result = richmond.logFile();
        }).should.throw();
        done();
    });

    it('.connect with no arguments should throw error', function (done) {
        var richmond = new Richmond();
        richmond.logFile('test/output/test.log');
        (function(){
            result = richmond.connect();
        }).should.throw();
        done();
    });

    it('.connect with no database options should succeed', function (done) {
        var richmond = new Richmond();
        richmond.logFile('test/output/test.log');
        var result = richmond.connect( process.env.TEST_MONGO_URI, {} );
        richmond.closeConnection();
        richmond.closeService();
        should.exist(result);
        done();
    });

    it('.connect with bad database uri should log error', function (done) {
        var richmond = new Richmond();
        richmond.logFile('test/output/test.log');
        var result = richmond.connect( "furi" );
        richmond.closeConnection();
        richmond.closeService();
        should.exist(result);
        done();
    });

    it('.connect with no database credentials should log error', function (done) {
        var richmond = new Richmond();
        richmond.logFile('test/output/test.log');
        var result = richmond.connect( process.env.TEST_MONGO_DB, { user: 'bogus', pass: 'bogus' } );
        richmond.closeConnection();
        richmond.closeService();
        should.exist(result);
        done();
    });

    it('.listen with no arguments should throw error', function (done) {
        var richmond = new Richmond();
        richmond.logFile('test/output/test.log');
        (function(){
            result = richmond.listen();
        }).should.throw();
        done();
    });

});