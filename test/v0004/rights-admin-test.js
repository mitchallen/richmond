/**
 * rights-admin-test.js
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
    modelName = "RightsAdminTest",
    testSecret = 'supersecret',
    MochaTestDoc = null;

describe('admin rights' + config.versionLabel, function () {
    before(function () {
        micro
            .logFile(config.logFolder + "rights-admin-test-" + config.logVersion + ".log")
            .defaultErrorHandler()
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC" }],
                    getOne:     [{ model: modelName, rights: "PUBLIC" }],
                    getMany:    [{ model: modelName, rights: "USER"   }],
                    post:       [{ model: modelName, rights: "ADMIN"  }],
                    put:        [{ model: modelName, rights: "PUBLIC" }]
                })
            )
            .secret(testSecret); // Override
        MochaTestDoc = micro.addModel(modelName, {
            email:  { type: String, required: true },
            status: { type: String, required: true },
        });
        micro.listen();
    });

    it('should be able to post as admin', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@admin.com",
            status: "TEST ADMIN POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth', jwt.encode({ username: "Mitch", role: "admin" }, testSecret))
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

    it('should return an error for a missing token', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@admin.com",
            status: "TEST ADMIN POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(401)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res.body.error);
                // Should return: Request Error: Missing token
                done();
            });
    });

    it('should return an error for bad token segments', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@admin.com",
            status: "TEST ADMIN POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth', 'BAD_TOKEN')
            .set('Content-Type', 'application/json')
            .expect(500)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res.body.error);
                // Should return: Error: Not enough or too many segments
                done();
            });
    });

    it('should return an error for an invalid token', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@admin.com",
            status: "TEST ADMIN POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth',
                'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NABC.eyJ1c2VybmFtZSI6Ik1pdGNoIn0.XdF4h3e-5eR5LOjwTdph9a_yBvMLwnY6Ll5eEdQ_ZHk')
            .set('Content-Type', 'application/json')
            .expect(500)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res.body.error);
                // SyntaxError: Unexpected token
                done();
            });
    });

    it('should return an error for an unauthorized post attempt', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@admin.com",
            status: "TEST ADMIN POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth', jwt.encode({ username: "Mitch", role: "reader" }, testSecret))
            .set('Content-Type', 'application/json')
            .expect(401)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res.body.error);
                done();
            });
    });

    it('should return an error for a missing role', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@admin.com",
            status: "TEST ADMIN POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth', jwt.encode({ username: "Mitch" }, testSecret))
            .set('Content-Type', 'application/json')
            .expect(401)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res.body.error);
                done();
            });
    });

    it('should return an error for an invalid secret key', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@admin.com",
            status: "TEST ADMIN POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth', jwt.encode({ username: "Mitch", role: "reader" }, 'BadSecretKey'))
            .set('Content-Type', 'application/json')
            .expect(500)
            .end(function (err, res) {
                should.not.exist(err);
                // Error: Signature verification failed
                // console.log(JSON.stringify(res.body));
                should.exist(res.body.error);
                done();
            });
    });

    it('should be able to get a collection when a user role is required', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@get.com",
            status: "TEST GET COLLECTION"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth', jwt.encode({ username: "Mitch", role: "admin" }, testSecret))
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                // GET
                request(testHost)
                    .get(testUrl)
                    .set('x-auth', jwt.encode({ username: "Mitch", role: "admin" }, testSecret))
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

    it('should be able to get a document when a public role is required', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = null,
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@get.com",
            status: "TEST GET DOCUMENT"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth', jwt.encode({ username: "Mitch", role: "admin" }, testSecret))
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                testId = res.body._id;
                // GET by ID
                request(testHost)
                    .get(testUrl + "/" + testId)
                    .set('x-auth', jwt.encode({ username: "Mitch", role: "admin" }, testSecret))
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

    after(function () {
        micro.closeService();
    });
});