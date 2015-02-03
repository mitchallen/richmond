/**
 * rights-user-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    jwt = require('jwt-simple'),
    Richmond = require('../richmond'),
    micro = new Richmond(),
    config = require('./test-config'),
    controller = config.controller,
    getRandomInt = require('./test-lib').getRandomInt,
    service       = config.service,
    port     = service.port,
    prefix     = service.prefix,
    dbConfig = config.mongoose,
    testHost = service.host,
    modelName = "RightsUserTest",
    testSecret = service.secret,
    MochaTestDoc = null;

describe('user rights', function () {
    before(function () {
        micro
            .logFile("rights-user-test.log")
            .secret(testSecret)
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC" }],
                    getOne:     [{ model: modelName, rights: "PUBLIC" }],
                    getMany:    [{ model: modelName, rights: "ADMIN"  }],
                    post:       [{ model: modelName, rights: "USER"   }],
                    put:        [{ model: modelName, rights: "PUBLIC" }]
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

    it('should be able to post as a user', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@user.com",
            status: "TEST USER POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth', jwt.encode({ username: "Mitch", role: "user" }, testSecret))
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

    it('should return an error if token is missing', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@user.com",
            status: "TEST USER POST"
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
            email: "test" + getRandomInt(1000, 1000000) + "@user.com",
            status: "TEST USER POST"
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
                // console.error("BAD TOKEN SEGMENTS: " + res.body.error);
                done();
            });
    });

    it('should return an error for an invalid token', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@user.com",
            status: "TEST USER POST"
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
                // console.error("INVALID TOKEN: " + res.body.error);
                done();
            });
    });

    it('should return an error for an unauthorized post attempt', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = null;
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@user.com",
            status: "TEST USER POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
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
            email: "test" + getRandomInt(1000, 1000000) + "@user.com",
            status: "TEST USER POST"
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
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@user.com",
            status: "TEST USER POST"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth', jwt.encode({ username: "Mitch", role: "public" }, 'BadSecretKey'))
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

    it('should be able to get a collection when a public role is required', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@user.com",
            status: "TEST GET COLLECTION"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('x-auth', jwt.encode({ username: "Mitch", role: "user" }, testSecret))
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                // GET
                request(testHost)
                    .get(testUrl)
                     // Should require admin access
                    .set('x-auth', jwt.encode({ username: "Mitch", role: "user" }, testSecret))
                    .expect('Content-Type', /json/)
                    .expect(401)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
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
            .set('x-auth', jwt.encode({ username: "Mitch", role: "user" }, testSecret))
            .set('Content-Type', 'application/json')
            .expect(201)
            .end(function (err, res) {
                should.not.exist(err);
                testId = res.body._id;
                // GET by ID
                request(testHost)
                    .get(testUrl + "/" + testId)
                    .set('x-auth', jwt.encode({ username: "Mitch", role: "user" }, testSecret))
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
        /*jslint nomen: true*/
    });

    after(function () {
        micro.closeService();
    });
});