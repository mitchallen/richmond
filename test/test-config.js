/**
 * test-config.js
 */

module.exports = {
		
	mongoose: {
		uri:  process.env.TEST_MONGO_DB || 'mongodb://localhost/pageblizzard',
		user: process.env.TEST_MONGO_USER || null,
		pass: process.env.TEST_MONGO_PASS || null	
	},
		
	service: {
		secret: process.env.APP_SECRET || null,
		prefix: "/API",
		port: process.env.TEST_PORT || null,
		host: process.env.TEST_HOST || null,
	    hostSsl:  process.env.TEST_SSL || null
	}
};


