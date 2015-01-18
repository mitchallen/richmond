/**
 * test-config.js
 */

module.exports = {
	service: {
		dbConn: process.env.TEST_MONGO_DB || 'mongodb://localhost/microtest',
		dbUser: process.env.TEST_MONGO_USER || null,
		dbPass: process.env.TEST_MONGO_PASS || null
	}
};


