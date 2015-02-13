/**
 * get-test.js
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
    MochaTestDoc = null,
    modelName = "GetTest";

describe('get' + config.versionLabel, function () {
    before(function () {
        micro
            .setup(service)
            .logFile(config.logFolder + "get-test-" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    del:      [ { model: modelName, rights: "PUBLIC" } ],
                    getOne:   [ { model: modelName, rights: "PUBLIC" } ],
                    getMany:  [ { model: modelName, rights: "PUBLIC" } ],
                    post:     [ { model: modelName, rights: "PUBLIC" } ],
                    put:      [ { model: modelName, rights: "PUBLIC" } ],
                })
            );
        micro.connect();
        MochaTestDoc = micro.addModel(modelName, {
            email:      { type: String, required: true },
            status:     { type: String, required: true },
            password:   { type: String, select: false },
        });
        micro.listen();
    });

    it('should get a filtered document', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testEmail = "test" + getRandomInt(1000, 1000000) + "@filter.com",
            testObject = {};
        testObject = {
            email: testEmail,
            status: "TEST GET filter"
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
                    // MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
                    .query('filter={"email":"' + testEmail + '"}')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body);
                        should.exist(res.body[0]);
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

    it('should get fields from a list', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testEmail = "test" + getRandomInt(1000, 1000000) + "@filter.com",
            testObject = {};
        testObject = {
            email: testEmail,
            status: "TEST GET filter"
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
                    // MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
                    .query('filter={"email":"' + testEmail + '"}')
                    .query('fields=email status')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body[0].email);
                        should.exist(res.body[0].status);
                        res.body[0].email.should.eql(testEmail);
                        done();
                    });
            });
    });

    it('should get a single field', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testEmail = "test" + getRandomInt(1000, 1000000) + "@filter.com",
            testObject = {};
        testObject = {
            email: testEmail,
            status: "TEST GET filter"
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
                    // MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
                    .query('filter={"email": "' + testEmail + '"}')
                    .query('fields=email')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body[0].email);
                        should.not.exist(res.body[0].status);
                        res.body[0].email.should.eql(testEmail);
                        done();
                    });
            });
    });

    it('should not get field where select equals false', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = null,
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@get.com",
            status: "TEST GET NON-SELECTED",
            password: "FOO"
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
                        should.not.exist(res.body.password);
                        res.body.email.should.eql(testObject.email);
                        res.body.status.should.eql(testObject.status);
                        done();
                    });
            });
    });

    it('should get field even though selected equals false', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testId = null,
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@get.com",
            status: "TEST GET NON-SELECTED",
            password: "FOO"
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
                    .query('fields=email status password')
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
                        should.exist(res.body.password);
                        res.body.email.should.eql(testObject.email);
                        res.body.status.should.eql(testObject.status);
                        res.body.password.should.eql(testObject.password);
                        done();
                    });
            });
    });

    it('should get multiple selected fields', function (done) {
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
                    .query('fields=email status')
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
                        res.body.status.should.eql(testObject.status);
                        done();
                    });
            });
    });

    it('should only get a single field and an id', function (done) {
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
                    .query('fields=email')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        /*jslint nomen: true*/
                        should.exist(res.body._id);
                        res.body._id.should.eql(testId);
                        /*jslint nomen: false*/
                        should.exist(res.body.email);
                        should.not.exist(res.body.status);
                        res.body.email.should.eql(testObject.email);
                        done();
                    });
            });
    });

    it('should get an error for a bad filter format', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testEmail = "test" + getRandomInt(1000, 1000000) + "@filter.com",
            testObject = {};
        testObject = {
            email: testEmail,
            status: "TEST GET filter"
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
                    // USE SINGLE QUOTES LEADS TO ERROR
                    .query("filter={'email':'" + testEmail + "'}")
                    .expect(403)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body.error);
                        done();
                    });
            });
    });

    it('should get a limited number of documents', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testEmail = "test" + getRandomInt(1000, 1000000) + "@limit.com",
            testObject = {};
        testObject = {
            email: testEmail,
            status: "TEST GET filter"
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
                    // MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
                    .query('options={"limit":1}')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        should.exist(res.body[0].email);
                        should.exist(res.body[0].status);
                        should.not.exist(res.body[1]);
                        done();
                    });
            });
    });

    it('should get a skipped document', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testEmail = "test" + getRandomInt(1000, 1000000) + "@limit.com",
            testObject = {};
        testObject = {
            email: testEmail,
            status: "TEST GET filter"
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
                    .query('options={"sort": {"email":1},"limit":1 }')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        var firstRecord = res.body[0];
                        should.exist(res.body[0].email);
                        should.exist(res.body[0].status);
                        should.not.exist(res.body[1]);
                        // GET
                        request(testHost)
                            .get(testUrl)
                            .query('options={"sort": {"email":1},"limit":1,"skip":1}')
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .end(function (err, res) {
                                should.not.exist(err);
                                var secondRecord = res.body[0];
                                should.exist(res.body[0].email);
                                should.exist(res.body[0].status);
                                should.not.exist(res.body[1]);
                                firstRecord.email.should.not.eql(secondRecord.email);
                                done();
                            });
                    });
            });
    });

    it('should get a sorted list of documents', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testEmail = "test" + getRandomInt(1000, 1000000) + "@sort.com",
            testObject = {};
        testObject = {
            email: testEmail,
            status: "TEST GET filter"
        };
        // SETUP - ideally would ensure there are at least three records
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
                    // MUST USE DOUBLE QUOTES - or JSON.parse bombs in GET.
                    .query('options={"sort":{"email":1} }')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        var prev = null,
                            i = 0,
                            compare = null;
                        should.not.exist(err);
                        if (res.body.length < 3) {
                            console.log("WARNING: ideally would like at least 3 records to test sort");
                        }
                        prev = null;
                        /*jslint plusplus: true */
                        for (i = 0; i < res.body.length; i++) {
                            if (prev) {
                                compare = (prev < res.body[i].email);
                                compare.should.be.type('boolean');
                                compare.should.eql(true);
                            }
                            prev = res.body[i].email;
                        }
                        done();
                    });
            });
    });

    after(function () {
        micro.closeService();
    });
});

