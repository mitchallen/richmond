/**
 * File: get-after-res-test.js
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
    service       = config.service,
    prefix     = service.prefix,
    testSecret = service.secret,
    testHost = config.host.url,
    sslHost  = config.host.ssl,
    modelName = "GetBeforeAfterTest",
    ownerEmail = "test@owner.com",
    afterTestEmail = "test" + getRandomInt(1000, 1000000) + "@after.com",
    testAfterDocStatus = "UPDATED by afterGet";

var MochaTestDoc = null;

describe('get after error injection' + config.versionLabel, function () {
    before(function () {
        var testExtraMessage = 'Testing 123',
            beforeMany = null,
            afterMany = null,
            beforeOne = null,
            afterOne = null;
        beforeMany = function (prop, next) {
            should.exists(prop.req);
            var req = prop.req,
                filter = req.query.filter,
                fields = req.query.fields,
                options = req.query.options,
                token = req.token,
                extras = { message: testExtraMessage },
                f2 = null;
            if (filter) {
                f2 = JSON.parse(filter);    // parse object 
                f2.email.should.eql(token.email);
            }
            next(filter, fields, extras, options);
        };
        afterMany = function (prop, next) {
            should.exist(next);
            should.exist(prop.req);
            should.exist(prop.res);
            should.exist(prop.docs);
            var res = prop.res,
                extras = prop.extras;
            extras.message.should.eql(testExtraMessage);
            // Testing Response
            res.status(402).json({ error: "Payment required." });
            // next(prop.docs);    // Don't call next when intercepting response
        };
        beforeOne = function (prop, next) {
            should.exist(prop);
            should.exist(prop.req);
            // Token may not always exist, but for these tests it should.
            should.exist(prop.req.token);
            var req = prop.req,
                fields = req.query.fields,
                extras = { message: testExtraMessage };
            next(fields, extras);
        };
        afterOne = function (prop, next) {
            should.exist(next);
            should.exist(prop.req);
            should.exist(prop.res);
            should.exist(prop.doc);
            var res = prop.res,
                extras = prop.extras;
            extras.message.should.eql(testExtraMessage);
            res.status(402).json({ error: "Payment required." });
            // next(prop.doc);    // Don't call when intercepting response
        };
        controller.clear();
        micro
            .setup(service)
            .logFile(config.logFolder + "get-after-res-test-" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    getOne:   [{ model: modelName, rights: "PUBLIC", before: beforeOne, after: afterOne }],
                    getMany:  [{ model: modelName, rights: "USER", ssl: 302, before: beforeMany, after: afterMany }],
                    post:     [{ model: modelName, rights: "PUBLIC" }],
                })
            )
            .secret(testSecret) // Override
            .connect();
        MochaTestDoc = micro.addModel(modelName, {
            email:     { type: String, required: true },
            status: { type: String, required: true },
            password: { type: String, select: false },
        });
        micro.listen();
    });

    it('should return the injected error instead of a document', function (done) {
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
                /*jslint nomen: true*/
                testId = res.body._id;
                /*jslint nomen: false*/
                // GET by ID
                request(testHost)
                    .get(testUrl + "/" + testId)
                    .set('x-auth', jwt.encode({ email: ownerEmail, role: "user" }, testSecret))
                    .expect('Content-Type', /json/)
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
    });

    it('should return the injected error instead of a collection', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testEmail = afterTestEmail,
            testObject = {};
        testObject = {
            email: testEmail,
            status: "TEST GET filter"
        };
        // SETUP - need to post at least one record
        request(testHost)
            .post(testUrl)
            .send(testObject)
            // .set('Content-Type', 'application/json') // If move, returns HTML
            // .expect(201) // Post to NON-SSL
            // .expect(302)    // Post to SSL
            .end(function (err, res) {
                should.not.exist(err);
                should.exist(res);
                // GET
                request(sslHost)
                    .get(testUrl)
                    .set('x-auth', jwt.encode({ email: testEmail, role: "user" }, testSecret))
                    .query('filter={"email":"' + testEmail + '"}')
                    // MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
                    // .expect('Content-Type', /json/)    // Sometimes returns 302 / HTML (nginx)
                    .expect(402)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res);
                        done();
                    });
            });
    });

    after(function () {
        micro.closeService();
    });
});
