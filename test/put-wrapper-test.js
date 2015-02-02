/**
 * put-wrapper-test.js
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
    modelName = "PutTest",    // Will translate to lowercase
    testSecret = 'supersecret',
    ownerEmail = "test@zap.com",
    MochaTestDoc = null;

describe('put before after', function () {
    before(function () {
        var testExtraMessage = 'Testing 123',
            dbOptions = {},
            beforePut,
            afterPut;
        beforePut = function (err, prop, next) {
            should.exist(err);
            should.exist(prop.req);
            should.exist(prop.req.token);
            var options = {},
                extras = { message: testExtraMessage };
            next(prop.req.body, options, extras);
        };
        afterPut = function (err, prop, next) {
            should.exist(err);
            should.exist(prop.req);
            should.exist(prop.req);
            should.exist(prop.numAffected);
            prop.numAffected.should.eql(1);
            next();
        };

        micro
            .logFile("put-wrapper-test.log")
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC" }],
                    getOne:     [{ model: modelName, rights: "PUBLIC" }],
                    getMany:    [{ model: modelName, rights: "PUBLIC" }],
                    post:       [{ model: modelName, rights: "PUBLIC" }],
                    put:        [{ model: modelName, rights: "PUBLIC", before: beforePut, after: afterPut }]
                })
            )
            .secret(testSecret)
            .prefix(prefix);// API prefix, i.e. http://localhost/v1/testdoc
        dbOptions = {
            user: dbConfig.user,
            pass: dbConfig.pass
        };
        micro.connect(dbConfig.uri, dbOptions);
        MochaTestDoc = micro.addModel(modelName, {
            email:  { type: String, required: true },
            status: { type: String, required: true },
        });
        micro.listen(port);
    });

    it('before should inject a message and after should confirm it', function (done) {
        /*jslint nomen: true*/
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
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
                var putUrl = testUrl + "/" + res.body._id;
                request(testHost)
                    .put(putUrl)
                    .send({ status: "UPDATED" })
                    .set('x-auth', jwt.encode({ email: ownerEmail, role: "user" }, testSecret))
                    .set('Content-Type', 'application/json')
                    .expect(204)    // No content
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
        /*jslint nomen: false*/
    });

    after(function () {
        micro.closeService();
    });
});