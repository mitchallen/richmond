/**
 * post-test.js
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
    service = config.service,
    prefix = service.prefix,
    testHost = config.host.url,
    modelName = "PostTest",
    MochaTestDoc = null;

describe('post' + config.versionLabel, function () {
    before(function () {
        var testExtraMessage = 'Testing 123',
            beforePost = null,
            afterPost = null;
        beforePost = function (prop, next) {
            var extras = null,
                body = null;
            should.exist(prop.req);
            should.exist(prop.req.body);
            // Stubbed: Will cause fail in missing field test (which deliberatey removes password)
            // should.exist(prop.req.body.password);
            extras = { message: testExtraMessage };
            body = prop.req.body;
            if (body.password !== undefined) {
                bcrypt.hash(body.password, 10, function (err, hash) {
                    if (err) {
                        throw err;
                    }
                    body.password = hash;
                    next(body, extras);
                });
            } else {
                next(body, extras);
            }
        };
        afterPost = function (prop, next) {
            var doc = null,
                thepatch = null,
                extras = null;
            should.exist(prop.req);
            should.exist(prop.res);
            should.exist(prop.result);
            doc = JSON.parse(JSON.stringify(prop.result));
            thepatch = [
                { "op": "remove", "path": "/password" }
            ];
            jsonpatch.apply(doc, thepatch);
            extras = prop.extras;
            extras.message.should.eql(testExtraMessage);
            next(doc);
        };
        micro
            .logFile(config.logFolder + "post-test-" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC" }],
                    getOne:     [{ model: modelName, rights: "PUBLIC" }],
                    getMany:    [{ model: modelName, rights: "PUBLIC" }],
                    post:       [{ model: modelName, rights: "PUBLIC", before: beforePost, after: afterPost }],
                    put:        [{ model: modelName, rights: "PUBLIC" }],
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

    it('before method should encrypt password', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = null,
            testObject = {};
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
                should.not.exist(res.body.password);
                res.body.status.should.eql(testObject.status);
                testId = res.body._id;
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
                        // password should now be encrypted
                        /*jslint stupid: true */
                        bcrypt.compareSync(
                            testObject.password,
                            res.body.password
                        ).should.eql(true);
                        /*jslint stupid: false */
                        res.body.password.should.not.equal(testObject.foo);
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
        /*jslint nomen: false*/
    });

    it('should return an error if a required field is missing', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@post.com"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
            .expect(403)
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                done();
            });
    });

    after(function () {
        micro.closeService();
    });
});