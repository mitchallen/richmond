/**
 *negative-test.js
 */

"use strict";


/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    Richmond = require('../../richmond'),
    model = require('../../lib/model'),
    httpErrorHandler = require('../../lib/http-error-handler'),
    libPrefix = require('../../lib/prefix'),
    libToken = require('../../lib/token'),
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
            .logFile(config.logFolder + "negative-test-" + config.logVersion + ".log")
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

    it('model.addModel with no arguments should throw error', function (done) {
        (function(){
            model.addModel();
        }).should.throw();
        done();
    });

    it('model.addModel with no schema should throw error', function (done) {
        (function(){
            model.addModel( "foo", null, {} );
        }).should.throw();
        done();
    });

    it('prefix module with null argument should log error to console', function (done) {
        libPrefix(null);
        done();
    });

    it('prefix module with no starting slash should log error to console', function (done) {
        libPrefix("v1");
        done();
    });

    it('prefix module with ending slash should log error to console', function (done) {
        libPrefix("/v1/");
        done();
    });

    it('prefix module with white space should log error to console', function (done) {
        libPrefix("/v 1");
        done();
    });

    it('token function with no arguments should return function', function (done) {
        var f = libToken();
        should.exist(f);
        (typeof f).should.eql('function');
        done();
    });

    it('token function with secret and no log should return function', function (done) {
        var f = libToken("fubar");
        should.exist(f);
        (typeof f).should.eql('function');
        done();
    });

    it('token child function with no secret and no arguments should throw error', function (done) {
        var f = libToken();
        should.exist(f);
        (function(){
            f();
        }).should.throw();
        done();
    });

    it('token child function with no secret and no arguments should throw error', function (done) {
        var f = libToken( null, "test/output/test.log");
        should.exist(f);
        (function(){
            f();
        }).should.throw();
        done();
    });

    it('token child function with no secret should throw error', function (done) {
        var f = libToken();
        should.exist(f);
        var req = { headers: { "x-auth": "foo" } },
            res = {},
            next = {};
        (function(){
            f( req, res, next );
        }).should.throw();
        done();
    });

    it('token child function with no secret should log errr', function (done) {
        var f = libToken( null, "test/output.log" );
        should.exist(f);
        var req = { headers: { "x-auth": "foo" } },
            res = {},
            next = {};
        (function(){
            f( req, res, next );
        }).should.throw();
        done();
    });

    it('token child function with no arguments should throw error', function (done) {
        var f = libToken("fubar");
        should.exist(f);
        (function(){
            f();
        }).should.throw();
        done();
    });

    it('httpErrorHandler child function should log exception', function (done) {
        var spyError = null;
        var mockLog = {
            error: function( err ) {
                spyError = err;
                // console.error( eMsg );
            }
        }
        var f = httpErrorHandler( { log: mockLog } );
        should.exist(f);
        var exTitle = "TEST MOCK EXCEPTION";
        var mockRes = {
            status: function() {
                // throw new Error(exTitle);
            }
        };
        f( new Error(exTitle), {}, mockRes, {} );
        spyError.should.match( new Error( exTitle ) );
        done();
    });

    it('httpErrorHandler child function with no log should echo exception', function (done) {
        var f = httpErrorHandler( {} );
        should.exist(f);
        var mockRes = {
            status: function() {
                // ... throw new Error("TEST MOCK EXCEPTION");
            }
        };
        f( new Error("TEST MOCK EXCEPTION"), {}, mockRes, {} );
        done();
    });

    it('httpErrorHandler child function with no setup arguments should echo exception', function (done) {
        var f = httpErrorHandler();
        should.exist(f);
        var mockRes = {
            status: function() {
                // throw new Error("TEST MOCK EXCEPTION");
            }
        };
        f( new Error("TEST MOCK EXCEPTION"), {}, mockRes, {} );
        done();
    });

});