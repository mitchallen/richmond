/**
 * db-model-test.js
 */

/*global describe, it, before, after*/

"use strict";

var request = require('supertest'),
    should = require('should'),
    TestConfig = require('./test-config'),
    config = new TestConfig(),
    micro = config.richmond,
    getRandomInt = require('./test-lib').getRandomInt,
    service = config.service,
    prefix = service.prefix,
    modelName = "RichmondDbTest";    // Will translate to lowercase

describe('model library' + config.versionLabel, function () {
    before(function () {
        var testModel = null,
            dbConn = null;
        micro
            .logFile("db-model-test-" + config.logVersion + ".log")
            .connect();
        testModel = micro.addModel(modelName, {
            email: { type: String, required: true },
            status: { type: String, required: true },
            password: { type: String, select: false }
        });
        should.exist(testModel);
        dbConn = micro.connection();
        should.exist(dbConn);
        // Purge all previous test records 
        testModel.remove({"email": /@/}, function (err) {
            if (err) {
                console.error(err);
            }
        });
    });

    it('should normalize model name to lowercase', function (done) {
        var name = micro.normalizeModelName("FooTest");
        should.exist(name);
        name.should.match(/footest/);
        done();
    });

    it('should not allow adding a name that is null', function (done) {
        var exceptionCaught = false;
        try {
            micro.normalizeModelName(null);
        } catch (ex) {
            exceptionCaught = true;
            ex.message.should.containEql("can't be null");
        }
        exceptionCaught.should.eql(true);
        done();
    });

    it('should not allow adding a name that contains whitespace', function (done) {
        var exceptionCaught = false;
        try {
            micro.normalizeModelName("space name");
        } catch (ex) {
            exceptionCaught = true;
            ex.message.should.containEql("whitespace");
        }
        exceptionCaught.should.eql(true);
        done();
    });

    it('should be able to find a model by name', function (done) {
        var collection = micro.model(modelName);
        should.exist(collection);
        done();
    });

    it('should be able to save using a model', function (done) {
        var Collection = micro.model(modelName),
            body = {},
            record = null;
        should.exist(Collection);
        body = {
            email: "test-save" + getRandomInt(10, 10000) + "@foo.com",
            status: "This is a test"
        };
        record = new Collection(body);
        record.save(function (err, doc) {
            if (err) { throw err; }
            should.exist(doc);
            done();
        });
    });

    after(function () {
        micro.closeConnection();
        micro.close();
    });
});