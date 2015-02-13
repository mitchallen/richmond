/**
 * two-models-test.js
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
    prefix     = service.prefix,
    testHost = config.host.url,
    AlphaTestDoc = null,
    BetaTestDoc = null,
    modelName = ["AlphaTest", "BetaTest"];

describe('two models' + config.versionLabel, function () {
    before(function () {
        micro
            .logFile(config.logFolder + "two-models-test" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    del:        [ { model: modelName[0], rights: "PUBLIC" },
                                  { model: modelName[1], rights: "PUBLIC" } ],
                    getOne:     [ { model: modelName[0], rights: "PUBLIC" },
                                  { model: modelName[1], rights: "PUBLIC" } ],
                    getMany:    [ { model: modelName[0], rights: "PUBLIC" },
                                  { model: modelName[1], rights: "PUBLIC" } ],
                    post:       [ { model: modelName[0], rights: "PUBLIC" },
                                  { model: modelName[1], rights: "PUBLIC" } ],
                    put:        [ { model: modelName[0], rights: "PUBLIC" },
                                  { model: modelName[1], rights: "PUBLIC" } ]
                })
            );
        // Model[0]
        AlphaTestDoc = micro.addModel(modelName[0], {
            email:  { type: String, required: true },
            status: { type: String, required: true },
        });
        // Model[1]
        BetaTestDoc = micro.addModel(modelName[1], {
            user:   { type: String, required: true },
            level: { type: String, required: true },
        });
        micro.listen();
    });

    it('should be able to post to the first model', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName[0].toLowerCase(),
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@alpha.com",
            status: "TEST POST ALPHA"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res.body.email);
                should.exist(res.body.status);
                res.body.email.should.eql(testObject.email);
                res.body.status.should.eql(testObject.status);
                // PURGE all records 
                AlphaTestDoc.remove({"email": /@/ }, function (err) {
                    if (err) {
                        console.error(err);
                    }
                    BetaTestDoc.remove({"user": /@/ }, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        done();
                    });
                });
            });
    });

    it('should be able to post to the second model', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName[1].toLowerCase(),
            testObject = {};
        testObject = {
            user: "test" + getRandomInt(1000, 1000000) + "@beta.com",
            level: "TEST POST BETA"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res.body.user);
                should.exist(res.body.level);
                res.body.user.should.eql(testObject.user);
                res.body.level.should.eql(testObject.level);
                done();
            });
    });

    it('should be able to get a collection for the first model', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName[0].toLowerCase(),
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@alpha.com",
            status: "TEST GET COLLECTION ALPHA"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                // GET
                request(testHost)
                    .get(testUrl)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body[0].email);
                        should.exist(res.body[0].status);
                        done();
                    });
            });
    });

    it('should be able to get a collection for the second model', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName[1].toLowerCase(),
            testObject = {};
        testObject = {
            user: "test" + getRandomInt(1000, 1000000) + "@beta.com",
            level: "TEST GET COLLECTION BETA"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                // GET
                request(testHost)
                    .get(testUrl)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body[0].user);
                        should.exist(res.body[0].level);
                        done();
                    });
            });
    });

    it('should be able to get a document for the first model', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName[0].toLowerCase(),
            testId = null,
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@alpha.com",
            status: "TEST GET DOCUMENT ALPHA"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                testId = res.body._id;
                // GET by ID
                request(testHost)
                    .get(testUrl + "/" + res.body._id)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body._id);
                        should.exist(res.body.email);
                        should.exist(res.body.status);
                        res.body._id.should.eql(testId);
                        res.body.email.should.eql(testObject.email);
                        res.body.status.should.eql(testObject.status);
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should be able to get a document for the second model', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName[1].toLowerCase(),
            testId = null,
            testObject = {};
        testObject = {
            user: "test" + getRandomInt(1000, 1000000) + "@beta.com",
            level: "TEST GET DOCUMENT BETA"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                testId = res.body._id;
                // GET by ID
                request(testHost)
                    .get(testUrl + "/" + res.body._id)
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body._id);
                        should.exist(res.body.user);
                        should.exist(res.body.level);
                        res.body._id.should.eql(testId);
                        res.body.user.should.eql(testObject.user);
                        res.body.level.should.eql(testObject.level);
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should be able to delete a document for the first model', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName[0].toLowerCase(),
            zapUrl = null,
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@alpha.com",
            status: "TEST DELETE ALPHA"
        };
        // SETUP - need to post at least one record        
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                // DELETE
                zapUrl = testUrl + "/" + res.body._id;
                request(testHost)
                    .del(zapUrl)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should be able to delete a document for the second model', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName[1].toLowerCase(),
            zapUrl = null,
            testObject = {};
        testObject = {
            user: "test" + getRandomInt(1000, 1000000) + "@beta.com",
            level: "TEST DELETE BETA"
        };
        // SETUP - need to post at least one record        
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                // DELETE
                zapUrl = testUrl + "/" + res.body._id;
                request(testHost)
                    .del(zapUrl)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should be able to put a document for the first model', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName[0].toLowerCase(),
            putUrl = null,
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@alpha.com",
            status: "TEST PUT ALPHA"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                // PUT
                putUrl = testUrl + "/" + res.body._id;
                request(testHost)
                    .put(putUrl)
                    .send({ status: "UPDATED" })
                    .set('Content-Type', 'application/json')
                    .expect(204)    // No content
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
                        done();
                    });
            });
        /*jslint nomen: false*/
    });

    it('should be able to put a document for the second model', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName[1].toLowerCase(),
            putUrl = null,
            testObject = {};
        testObject = {
            user: "test" + getRandomInt(1000, 1000000) + "@beta.com",
            level: "TEST PUT BETA"
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
                putUrl = testUrl + "/" + res.body._id;
                request(testHost)
                    .put(putUrl)
                    .send({ status: "UPDATED" })
                    .set('Content-Type', 'application/json')
                    .expect(204)    // No content
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

