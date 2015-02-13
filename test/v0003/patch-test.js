/**
 * patch-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    bcrypt = require("bcrypt"),
    jsonpatch = require("fast-json-patch"),
    TestConfig = require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
    controller = config.controller,
    getRandomInt = require('./test-lib').getRandomInt,
    service       = config.service,
    prefix     = service.prefix,
    testHost = config.host.url,
    modelName = "PatchTest",
    MochaTestDoc = null;

describe('patch' + config.versionLabel, function () {
    before(function () {
        micro
            .logFile(config.logFolder + "patch-test-" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC" }],
                    getOne:     [{ model: modelName, rights: "PUBLIC" }],
                    getMany:    [{ model: modelName, rights: "PUBLIC" }],
                    post:       [{ model: modelName, rights: "PUBLIC" }],
                    put:        [{ model: modelName, rights: "PUBLIC" }],
                    patch:      [{ model: modelName, rights: "PUBLIC" }],
                })
            );
        micro.connect();
        MochaTestDoc = micro.addModel(modelName, {
            email:     { type: String, required: true },
            password: { type: String, required: true, select: false },
            status: { type: String, required: true }
        });
        micro.listen();
    });

    it('patch a record', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = null,
            testObject = {},
            patchStatus = "UPDATED PATCH STATUS",
            testPatch = [
                // { "op": "remove", "path": "/password" }
                {"op": "replace", "path": "/status", "value": patchStatus}
            ];
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@afterpost.com",
            password: "foo",
            status: "Testing beforePost and afterPost"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                res.body.email.should.eql(testObject.email);
                // Should not return password
                // should.not.exist(res.body.password);
                res.body.status.should.eql(testObject.status);
                testId = res.body._id;
                // PATCH
                request(testHost)
                    .patch(testUrl + "/" + testId)
                    .send(testPatch)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
                        // GET by ID
                        request(testHost)
                            .get(testUrl + "/" + testId)
                            // Have to request password since it's defined as select: false
                            .query('fields=email status password')
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .end(function (err, res) {
                                should.not.exist(err);
                                should.exist(res.body);
                                should.exist(res.body._id);
                                should.exist(res.body.email);
                                should.exist(res.body.password);
                                should.exist(res.body.status);
                                res.body._id.should.eql(testId);
                                res.body.email.should.eql(testObject.email);
                                res.body.password.should.not.equal(testObject.foo);
                                res.body.status.should.eql(patchStatus);
                                // PURGE all records
                                MochaTestDoc.remove({"email": /@/ }, function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    done();
                                });
                            });
                    });
            });
        /*jslint nomen: false*/
    });

    after(function () {
        micro.closeService();
    });
});