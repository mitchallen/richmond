/**
 * get-wrapper-test.js
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
    testSecret = 'supersecret',
    testHost = config.host.url,
    sslHost  = config.host.ssl,
    modelName = "GetBeforeAfterTest",
    ownerEmail = "test@owner.com",
    afterTestEmail = "test" + getRandomInt(1000, 1000000) + "@after.com",
    testAfterDocStatus = "UPDATED by afterGet";

var MochaTestDoc = null;

describe('get before and after' + config.versionLabel, function () {
    before(function () {
        var testExtraMessage = 'Testing 123',
            beforeMany = null,
            afterMany = null,
            beforeOne = null,
            afterOne = null,
            f2 = null,
            testExtras = { message: testExtraMessage };
        beforeMany = function (prop, next) {
            should.exist(prop.req);
            var req = prop.req,
                filter = req.query.filter,
                fields = req.query.fields,
                options = req.query.options,
                token = req.token;
            if (filter) {
                f2 = JSON.parse(filter);
                f2.email.should.eql(token.email);
            }
            next(filter, fields, testExtras, options);
        };
        afterMany = function (prop, next) {
            should.exist(prop.req);
            should.exist(prop.docs);
            var docs = prop.docs,
                extras = prop.extras;
            extras.message.should.eql(testExtraMessage);
            docs.push({
                email:  afterTestEmail,
                status: testAfterDocStatus
            });
            next(docs);
        };
        beforeOne = function (prop, next) {
            should.exist(prop.req);
            var req = prop.req,
                fields = req.query.fields;    // Optional
            // Token may not always exist, but for these tests it should.
            should.exist(req.token);
            next(fields, testExtras);
        };
        afterOne = function (prop, next) {
            should.exist(prop.req);
            should.exist(prop.doc);
            var doc = prop.doc,
                extras = prop.extras;
            extras.message.should.eql(testExtraMessage);
            doc.status = testAfterDocStatus;
            next(doc);
        };
        micro
            .setup(service)
            .logFile("get-wrapper-test-" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    getOne:     [{ model: modelName, rights: "PUBLIC",     before: beforeOne, after: afterOne  }],
                    getMany:    [{ model: modelName, rights: "USER",     ssl: 302, before: beforeMany, after: afterMany }],
                    post:       [{ model: modelName, rights: "PUBLIC" }]
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

    it('get filter should respond with proper document', function (done) {
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
            //.set('Content-Type', 'application/json') // If move, returns HTML
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
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body);
                        should.exist(res.body.length);
                        // Should be 2 because afterGet added something
                        res.body.length.should.eql(2);
                        // console.log(JSON.stringify(res.body));
                        should.exist(res.body[0].email);
                        should.exist(res.body[0].status);
                        res.body[0].email.should.eql(testEmail);
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

    it('get document by id should responds with proper document', function (done) {
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
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        /*jslint nomen: true*/
                        should.exist(res.body._id);
                        res.body._id.should.eql(testId);
                        /*jslint nomen: false*/
                        should.exist(res.body.email);
                        should.exist(res.body.status);
                        res.body.email.should.eql(testObject.email);
                        res.body.status.should.eql(testAfterDocStatus);
                        done();
                    });
            });
    });
    after(function () {
        micro.closeService();
    });
});

