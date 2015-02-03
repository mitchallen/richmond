/**
 * ssl-move-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    TestConfig = new require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
    controller = config.controller,
    getRandomInt = require('./test-lib').getRandomInt,
    service       = config.service,
    port     = service.port,
    prefix     = service.prefix,
    dbConfig = config.mongoose,
    testHost = service.host,
    sslHost  = service.hostSsl,
    modelName = "SslMoveTest",
    testSecret = service.secret,
    MochaTestDoc = null;

describe('ssl moved', function () {
    before(function () {
        controller.clear();
        micro
            .logFile("ssl-moved-test.log")
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC", ssl: 302 }],
                    getOne:     [{ model: modelName, rights: "PUBLIC", ssl: 302 }],
                    getMany:    [{ model: modelName, rights: "PUBLIC", ssl: 302 }],
                    patch:      [{ model: modelName, rights: "PUBLIC", ssl: 302 }],
                    post:       [{ model: modelName, rights: "PUBLIC", ssl: 302 }],
                    put:        [{ model: modelName, rights: "PUBLIC", ssl: 302 }],
                })
            )
            .prefix(prefix);// API prefix, i.e. http://localhost/v1/testdoc
        var options = {
                user: dbConfig.user,
                pass: dbConfig.pass
            };
        micro.connect(dbConfig.uri, options);
        MochaTestDoc = micro.addModel(modelName, {
            email:  { type: String, required: true },
            status: { type: String, required: true },
        });
        micro.listen(port);
    });

    it('should return moved when posting to non-ssl', function (done) {
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
            .expect(302)    // Moved temporarily - due to redirect
            .end(function (err, res) {
                should.not.exist(err);
                res.header.location.should.eql(
                    sslHost + prefix.toLowerCase() + "/" + modelName.toLowerCase()
                );
                // PURGE all records 
                MochaTestDoc.remove({"email": /@/ }, function (err) {
                    if (err) {
                        console.error(err);
                    }
                    done();
                });
            });
    });

    it('should return moved when getting a collection via non-ssl', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
        // GET
        request(testHost)
            .get(testUrl)
             // .expect('Content-Type', /json/)
            .expect(302)
            .end(function (err, res) {
                should.not.exist(err);
                res.header.location.should.eql(
                    sslHost + prefix.toLowerCase() + "/" + modelName.toLowerCase()
                );
                done();
            });
    });

    it('should return moved when getting a document via non-ssl', function (done) {
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
                    .expect(302)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.header.location.should.eql(
                            sslHost
                                + prefix.toLowerCase()
                                + "/" + modelName.toLowerCase()
                                + "/" + testId
                        );
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should return moved when deleting via non-ssl', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = "",
            zapUrl = "",
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
                request(testHost)
                    .del(zapUrl)
                    // .expect(200)
                    .expect(302)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.header.location.should.eql(
                            sslHost
                                + prefix.toLowerCase()
                                + "/" + modelName.toLowerCase()
                                + "/" + testId
                        );
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should return moved when putting via non-ssl', function (done) {
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
                    .expect(302)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.header.location.should.eql(
                            sslHost
                                + prefix.toLowerCase()
                                + "/" + modelName.toLowerCase()
                                + "/" + testId
                        );
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should return moved when patching via non-ssl', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            newStatus = null,
            testId = null,
            testObject = {};
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
                newStatus = "UPDATED PATCH";
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
                    .expect(302)
                    .end(function (err, res) {
                        should.not.exist(err);
                        res.header.location.should.eql(
                            sslHost
                                + prefix.toLowerCase()
                                + "/" + modelName.toLowerCase()
                                + "/" + testId
                        );
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    after(function () {
        micro.closeService();
    });
});
