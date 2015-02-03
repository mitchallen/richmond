/**
 * smoke-test.js
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
    service = config.service,
    port = service.port,
    prefix = service.prefix,
    dbConfig = config.mongoose,
    testHost = service.host,
    modelName = "SmokeTest",    // Will translate to lowercase
    MochaTestDoc = null;

describe('smoke tests', function () {
    before(function () {
        micro
            .logFile("smoke-test.log")
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC" }],
                    getOne:     [{ model: modelName, rights: "PUBLIC" }],
                    getMany:    [{ model: modelName, rights: "PUBLIC" }],
                    post:       [{ model: modelName, rights: "PUBLIC" }],
                    put:        [{ model: modelName, rights: "PUBLIC" }],
                })
            )
            .prefix(prefix);    // API prefix, i.e. http://localhost/v1/testdoc
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

    it('should confirm that post works', function (done) {
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
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                res.body.email.should.eql(testObject.email);
                res.body.status.should.eql(testObject.status);
                // PURGE all records 
                MochaTestDoc.remove({"email": /@/ }, function (err) {
                    if (err) {
                        console.error(err);
                    }
                    done();
                });
            });
    });

    it('should confirm that get collection works', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@get.com",
            status: "TEST GET COLLECTION"
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
                    // .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body[0].email);
                        should.exist(res.body[0].status);
                        done();
                    });
            });
    });

    it('should confirm that get document works', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = null,
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@get.com",
            status: "TEST GET DOCUMENT"
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
                    .get(testUrl + "/" + testId)
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

    it('should confirm that delete works', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = "",
            zapUrl = "",
            testObject = null;
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
                testId = res.body._id;
                // DELETE
                zapUrl = testUrl + "/" + testId;
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

    it('should confirm that put works', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            putUrl = "",
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