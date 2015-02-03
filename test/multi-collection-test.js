/**
 * File: multi-collection-test.js
 */

"use strict";

/*global describe, it, before, after*/

var request = require('supertest'),
    should = require('should'),
    TestConfig = new require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
    getRandomInt = require('./test-lib').getRandomInt,
    service = config.service,
    port = service.port,
    prefix = service.prefix,
    dbConfig = config.mongoose,
    alphaModel = null,
    betaModel = null,
    modelName = ["AlphaRichmondTest", "BetaRichmondTest"];

describe('mulitple collections', function () {
    before(function () {
        micro.logFile("multiple-collections-test.log");
        var options = {},
            dbConn = null;
        options = {
            user: dbConfig.user,
            pass: dbConfig.pass
        };
        micro.connect(dbConfig.uri, options);
        alphaModel = micro.addModel(modelName[0], {
            email:     { type: String, required: true },
            status: { type: String, required: true },
            password: { type: String, select: false },
        });
        should.exist(alphaModel);
        betaModel = micro.addModel(modelName[1], {
            email:     { type: String, required: true },
            level: { type: String, required: true },
        });
        should.exist(alphaModel);
        dbConn = micro.connection();
        should.exist(dbConn);
    });

    it('should be able to find any model by name', function (done) {
        var alphaCollection = micro.model(modelName[0]),
            betaCollection = micro.model(modelName[1]);
        should.exist(alphaCollection);
        should.exist(betaCollection);
        // Purge all previous test records 
        alphaModel.remove({"email": /@/ }, function (err) {
            if (err) {
                console.error(err);
            }
            betaModel.remove({"email": /@/ }, function (err) {
                if (err) {
                    console.error(err);
                }
                done();
            });
        });
    });

    it('should be able to save using any model', function (done) {
        function beta() {
            var Collection = micro.model(modelName[1]),
                body = {},
                record = null;
            should.exist(Collection);
            body = {
                email: "test-save" + getRandomInt(10, 10000) + "@beta.com",
                level: "This is a test of beta"
            };
            record = new Collection(body);
            record.save(function (err, doc) {
                if (err) { throw err; }
                should.exist(doc.level);
                done();
            });
        }
        function alpha() {
            var Collection = micro.model(modelName[0]),
                body = {},
                record = null;
            should.exist(Collection);
            body = {
                email: "test-save" + getRandomInt(10, 10000) + "@alpha.com",
                status: "This is a test of alpha"
            };
            record = new Collection(body);
            record.save(function (err, doc) {
                if (err) { throw err; }
                should.exist(doc.status);
                beta();    // Call next test method.
            });
        }
        alpha();
    });

    after(function () {
        micro.closeConnection();
        micro.close();
    });
});

