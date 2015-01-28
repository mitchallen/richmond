/**
 * test-config.js
 */

module.exports = {
	service: {
		secret: process.env.APP_SECRET || null,
		prefix: "/API",
		dbConn: process.env.TEST_MONGO_DB || 'mongodb://localhost/microtest',
		dbUser: process.env.TEST_MONGO_USER || null,
		dbPass: process.env.TEST_MONGO_PASS || null,
		port: process.env.TEST_PORT || null,
		host: process.env.TEST_HOST || null,
	    hostSsl:  process.env.TEST_SSL || null
	}
};


