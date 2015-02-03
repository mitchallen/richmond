/**
 * test-config.js
 */

"use strict";

var Controller = require('@minja/richmond-web-controller'),
    Richmond = require('../richmond');

function Config() {
    this.controller = new Controller();
    this.richmond = new Richmond();
    this.mongoose = {
        uri:  process.env.TEST_MONGO_DB || 'mongodb://localhost/mytest',
        user: process.env.TEST_MONGO_USER || null,
        pass: process.env.TEST_MONGO_PASS || null
    };
    this.service = {
        secret: process.env.APP_SECRET || null,
        prefix: "/API",
        port: process.env.TEST_PORT || null,
        host: process.env.TEST_HOST || null,
        hostSsl:  process.env.TEST_SSL || null
    };
}

module.exports = Config;