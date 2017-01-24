/**
 * smoke-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    ngrok = require('ngrok'),
    TestConfig = require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
    controller = config.controller,
    getRandomInt = require('./test-lib').getRandomInt,
    service = config.service,
    prefix = service.prefix,
    testHost = config.host.url,
    modelName = "SmokeTest",    // Will translate to lowercase
    MochaTestDoc = null;

describe('ngrok' + config.versionLabel, function () {
    before(function () {
        micro
            .logFile(config.logFolder + "smoke-test-" + config.logVersion + ".log")
            .controller(
                controller.setup({
                    del:        [{ model: modelName, rights: "PUBLIC" }],
                    getOne:     [{ model: modelName, rights: "PUBLIC" }],
                    getMany:    [{ model: modelName, rights: "PUBLIC" }],
                    post:       [{ model: modelName, rights: "PUBLIC" }],
                    put:        [{ model: modelName, rights: "PUBLIC" }],
                })
            );
        MochaTestDoc = micro.addModel(modelName, {
            email:  { type: String, required: true },
            status: { type: String, required: true },
        });
        micro.listen();
    });

    after(function () {
        micro.closeService();
    });

    afterEach(function () {
        ngrok.disconnect();
    });


    it('should confirm that post works @DEBUG', function (done) {
        var testUrl = prefix.toLowerCase() + "/" + modelName.toLowerCase(),
            testObject = {};
        testObject = {
            email: "test" + getRandomInt(1000, 1000000) + "@post.com",
            status: "TEST POST"
        };

        // console.log("SERVICE PORT:", service.port);
        var options = {
            proto: 'http',
            addr: service.port
        }
        ngrok.connect( options, function( err, grokHost ) {
            if(err) done(err);
            // console.log("NGROK HOST: ", grokHost );
            // console.log("HOST: ", testHost);
            // console.log("URL: ", testUrl);
            // console.log("OBJECT: ", testObject);
            // request(testHost)
            request(grokHost)
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
    });

});