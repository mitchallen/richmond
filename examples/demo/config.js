var Controller = require('richmond-web-controller');

module.exports = {
    controller: new Controller(),
    service: {
        logFile: "my-test.log",
        port: process.env.TEST_PORT || null,
        secret: process.env.APP_SECRET || null,
        prefix: "/API",
        database: {
            uri:  process.env.TEST_MONGO_DB || 'mongodb://localhost/mytest',
            options: {
                user: process.env.TEST_MONGO_USER || null,
                pass: process.env.TEST_MONGO_PASS || null
            }
        }
    }
};