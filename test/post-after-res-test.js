/**
 * File: post-after-res-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    bcrypt = require("bcrypt"),
    TestConfig = require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
    controller = config.controller,
    getRandomInt = require('./test-lib').getRandomInt,
    service       = config.service,
    port     = service.port,
    prefix     = service.prefix,
    dbConfig = config.mongoose,
    testHost = service.host,
    modelName = "PostTest";    // Will translate to lowercase

var MochaTestDoc = null;

describe('post after error', function () {
    before(function () {
        var testExtraMessage = 'Testing 123',
            dbOptions = {},
            beforePost = null,
            afterPost = null;
        beforePost = function (prop, next) {
            var extras = null,
                body = null;
            should.exist(prop.req);
            should.exist(prop.req.body);
            // Stubbed: Will cause fail in missing field test (which deliberately removes password)
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
        afterPost =
            function (prop, next) {
                should.exist(next);
                should.exist(prop.req);
                should.exist(prop.res);
                should.exist(prop.result);
                var res = prop.res;
                // Testing Response
                res.status(402).json({ error: "Payment required." });
                // next(doc);    // Don't call when intercepting
            };
        micro
            .logFile("post-after-res-test.log")
            .controller(
                controller.setup({
                    del:      [{ model: modelName, rights: "PUBLIC" }],
                    getOne:   [{ model: modelName, rights: "PUBLIC" }],
                    getMany:  [{ model: modelName, rights: "PUBLIC" }],
                    post:     [{ model: modelName, rights: "PUBLIC", before: beforePost, after: afterPost }],
                    put:      [{ model: modelName, rights: "PUBLIC" }],
                })
            )
            .prefix(prefix);    // API prefix, i.e. http://localhost/v1/testdoc
        dbOptions = {
            user: dbConfig.user,
            pass: dbConfig.pass
        };
        micro.connect(dbConfig.uri, dbOptions);
        MochaTestDoc = micro.addModel(modelName, {
            email:      { type: String, required: true },
            password:   { type: String, required: true, select: false },
            status:     { type: String, required: true }
        });
        micro.listen(port);
    });

    it('should return the injected error', function (done) {
        var testUrl = null,
            testObject = {};
        testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase();
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@afterpost.com",
            password: "foo",
            status: "Testing beforePost and afterPost"
        };
        request(testHost)
            .post(testUrl)
            .send(testObject)
            .set('Content-Type', 'application/json')
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

    after(function () {
        micro.closeService();
    });
});
