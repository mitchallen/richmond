/**
 * put-after-res-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    jwt = require('jwt-simple'),
    TestConfig = require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
    controller = config.controller,
    getRandomInt = require('./test-lib').getRandomInt,
    service = config.service,
    prefix = service.prefix,
    testHost = config.host.url,
    modelName = "PutTest",
    testSecret = 'supersecret',
    ownerEmail = "test@zap.com",
    MochaTestDoc = null;

describe('put after error', function () {
    before(function () {
        var testExtraMessage = 'Testing 123',
            beforePut = null,
            afterPut = null;
        beforePut = function (prop, next) {
            should.exist(prop.req);
            should.exist(prop.req.token);
            var options = {},
                extras = { message: testExtraMessage };
            next(prop.req.body, options, extras);
        };
        afterPut = function (prop, next) {
            should.exist(next);
            should.exist(prop.req);
            should.exist(prop.res);
            var res = prop.res;
            // Testing Response
            res.status(402).json({ error: "Payment required." });
            // next();// Don't call next when returning a response
        };
        micro
            .setup(service)
            .logFile("put-after-err-test-" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC" }],
                    getOne:     [{ model: modelName, rights: "PUBLIC" }],
                    getMany:    [{ model: modelName, rights: "PUBLIC" }],
                    post:       [{ model: modelName, rights: "PUBLIC" }],
                    put:        [{ model: modelName, rights: "PUBLIC", before: beforePut, after: afterPut }]
                })
            )
            .secret(testSecret) // Override
            .connect();
        MochaTestDoc = micro.addModel(modelName, {
            email:  { type: String, required: true },
            status: { type: String, required: true }
        });
        micro.listen();
    });

    it('should return the injected error', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@put.com",
            status: "TEST PUT"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                // PUT 
                var putUrl = testUrl + "/" + res.body._id;
                request(testHost)
                    .put(putUrl)
                    .send({ status: "UPDATED" })
                    .set('x-auth', jwt.encode({ email: ownerEmail, role: "user" }, testSecret))
                    .set('Content-Type', 'application/json')
                    .expect(402)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
                        // PURGE all records 
                        MochaTestDoc.remove({"email": /@/ }, function (err) {
                            if (err) {
                                console.error(err);
                            }
                            done();
                        });
                    });
            });
        /*jslint nomen: false*/
    });

    after(function () {
        micro.closeService();
    });
});