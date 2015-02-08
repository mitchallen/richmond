/**
 * ssl-404-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    TestConfig = require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
    controller = config.controller,
    getRandomInt = require('./test-lib').getRandomInt,
    service = config.service,
    prefix = service.prefix,
    testHost = config.host.url,
    sslHost = config.host.ssl,
    modelName = "SslNotFoundTest",
    MochaTestDoc = null;

describe('ssl not found' + config.versionLabel, function () {
    before(function () {
        micro
            .logFile("ssl-404-test-" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC", ssl: 404 }],
                    getOne:     [{ model: modelName, rights: "PUBLIC", ssl: 404 }],
                    getMany:    [{ model: modelName, rights: "PUBLIC", ssl: 404 }],
                    patch:      [{ model: modelName, rights: "PUBLIC", ssl: 404 }],
                    post:       [{ model: modelName, rights: "PUBLIC", ssl: 404 }],
                    put:        [{ model: modelName, rights: "PUBLIC", ssl: 404 }],
                })
            );
        micro.connect();
        MochaTestDoc = micro.addModel(modelName, {
            email:  { type: String, required: true },
            status: { type: String, required: true },
        });
        micro.listen();
    });

    it('should return not found when posting to non-ssl', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@post.com",
            status: "TEST POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(404)    // Not found
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

    it('should return not found when getting a collection via non-ssl', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
        // GET
        request(testHost)
            .get(testUrl)
            // .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                done();
            });
    });

    it('should return not found when getting a document via non-ssl', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = null,
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@get.com",
            status: "TEST GET DOCUMENT"
        };
        // SETUP - need to post at least one record
        // Need to use SSL for post
        request(sslHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                testId = res.body._id;
                // GET by ID
                request(testHost)
                    .get(testUrl + "/" + testId)
                     // .expect('Content-Type', /json/)
                    .expect(404)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should return not found when deleting via non-ssl', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = "",
            zapUrl = null,
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@zap.com",
            status: "TEST DELETE"
        };
        // SETUP - need to post at least one record
        // For POST need to use SSL or will fail.
        request(sslHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                testId = res.body._id;
                // DELETE
                zapUrl = testUrl + "/" + testId;
                // console.log(zapUrl);
                request(testHost)
                    .del(zapUrl)
                    .expect(404)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should return not found when putting via non-ssl', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = null,
            putUrl = null,
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@put.com",
            status: "TEST PUT"
        };
        // SETUP - need to post at least one record
        // For POST need to use SSL or test will fail
        request(sslHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                // PUT
                testId = res.body._id;
                putUrl = testUrl + "/" + testId;
                request(testHost)
                    .put(putUrl)
                    .send({ status: "UPDATED" })
                    // .set('Content-Type', 'application/json')
                    .expect(404)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should return not found when patching via non-ssl', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            newStatus = "UPDATED PATCH",
            testId = null,
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@patch.com",
            status: "TEST PATCH"
        };
        // POST a new doc
        request(sslHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                // PATCH
                testId = res.body._id;
                request(testHost)
                    .patch(testUrl + "/" + testId)
                    .send(
                        [
                            { "op": "replace", "path": "/status", "value": newStatus }
                        ]
                    )
                    // Uncaught TypeError: Argument must be a string 
                    // .set('Content-Type', 'application/json-patch')
                    .set('Content-Type', 'application/json')
                    .expect(404)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    after(function () {
        micro.closeService();
    });
});
