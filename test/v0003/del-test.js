/**
 * del-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    sleep = require('sleep'),
    jwt = require('jwt-simple'),
    TestConfig = require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
    controller = config.controller,
    getRandomInt = require('./test-lib').getRandomInt,
    service = config.service,
    prefix = service.prefix,
    testHost = config.host.url,
    modelName = "DelTest",
    testSecret = 'supersecret',
    ownerEmail = "test@zap.com";

var MochaTestDoc = null;

describe('delete' + config.versionLabel, function () {
    before(function () {
        var testExtraMessage = 'Testing 123',
            beforeDelete = null,
            afterDelete = null;
        beforeDelete = function (prop, next) {
            var req = prop.req,
                extras = { message: testExtraMessage };
            should.exist(prop.req);
            should.exist(req.token);
            next(extras);
        };
        afterDelete = function (prop, next) {
            var req = prop.req,
                extras = prop.extras;
            should.exist(prop.req);
            should.exist(req.token);
            extras.message.should.eql(testExtraMessage);
            next();
        };
        micro
            .logFile("del-test-" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    del:  [{ model: modelName, rights: "PUBLIC", before: beforeDelete, after: afterDelete }],
                    post: [{ model: modelName, rights: "PUBLIC" }]
                })
            )
            .secret(testSecret) // Override 
            .connect();
        MochaTestDoc = micro.addModel(modelName, {
            email: { type: String, required: true },
            status: { type: String, required: true },
        });
        micro.listen();
    });

    it('by the owner should succeed', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = "",
            zapUrl = "",
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@zap.com",
            status: "TEST DELETE"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                /*jslint nomen: true*/
                testId = res.body._id;
                /*jslint nomen: false*/
                // DELETE
                zapUrl = testUrl + "/" + testId;
                request(testHost)
                    .del(zapUrl)
                    .set('x-auth', jwt.encode({email: ownerEmail, role: "user"}, testSecret))
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body.status);
                        res.body.status.should.eql("OK");
                        // PURGE all records 
                        MochaTestDoc.remove({"email": /@/}, function (err) {
                            if (err) {
                                console.error(err);
                            }
                            done();
                        });
                    });
            });
    });

    after(function () {
        micro.closeService();
    });
});