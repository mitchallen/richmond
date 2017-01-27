/**
 * test-config.js
 */

"use strict";

var Controller = require('richmond-web-controller'),
    Richmond = require('../../richmond');

function Config() {
    this.controller = new Controller();
    this.logFolder = process.env.TEST_LOG_FOLDER || 'test/output/';
    this.service = {
        secret: process.env.APP_SECRET || null,
        prefix: "/API",
        database: {
            uri:  process.env.TEST_MONGO_DB || 'mongodb://localhost/mytest',
            options: {
                user: process.env.TEST_MONGO_USER || null,
                pass: process.env.TEST_MONGO_PASS || null
            }
        },
        port: process.env.TEST_PORT || 8010,
    };
    this.richmond = new Richmond(this.service);
    this.host = {
        url: process.env.TEST_HOST || null,
        ssl: process.env.TEST_SSL || null
    };
    this.logVersion = "00-04";  // Used in log name.
    this.versionLabel = " [" + this.logVersion + "]"; // Used in test labels.
}

module.exports = Config;