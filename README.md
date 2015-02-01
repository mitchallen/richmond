
richmond.js
================

A node.js module for mapping Web calls to MongoDB
-------------------------------------------------

## Installation

    $ npm install richmond --save
    $ npm install richmond-web-controller --save

## Usage

### Step 1: Visit MongoLab

Use your own local install of MongoDB or visit https://mongolab.com 
and create a free test database, writing down the credentials.

### Step 2: Edit ~/.bash_profile

Using your favorite plain text editor add the lines below to ~/.bash_profile (if on a Mac or Linux).
Replace SUBDOMAIN, DBPORT, DATABASE, USER and PASSWORD with your values.
You can also choose other values for APP_SECRET and TEST_PORT.

    # Application
    export APP_SECRET=testsecret

    # MONGO LABS DB
    export TEST_MONGO_DB=mongodb://SUBDOMAIN.mongolab.com:DBPORT/DATABASE
    export TEST_MONGO_USER=USER
    export TEST_MONGO_PASS=PASSWORD

    export TEST_PORT=3030 
    
When you are done with that, execute the following at the command line:

    $ source ~/.bash_profile

### Step 3: Create a config.js file in your projects root folder:

    /**
     * config.js
     */

    var Controller = require('richmond-web-controller');

    module.exports = {
		
	    controller: new Controller(),
		
	    mongoose: {
		    uri:  process.env.TEST_MONGO_DB || 'mongodb://localhost/mytest',
		    user: process.env.TEST_MONGO_USER || null,
		    pass: process.env.TEST_MONGO_PASS || null	
	    },
		
	    service: {
		    secret: process.env.APP_SECRET || null,
		    prefix: "/API",
		    port: process.env.TEST_PORT || null
	    }
    };

### Step 4: Create index.js in your projects root folder:

    var Richmond   = require('richmond'),
	    micro      = new Richmond(),
	    config     = require('./config'),
	    controller = config.controller,
	    service    = config.service,
	    port 	   = service.port,
	    prefix 	   = service.prefix,
	    dbConfig   = config.mongoose,
	    MyTestDoc  = null,
	    modelName  = "MyTest";	

    micro
		.logFile("my-test.log")
		.controller( 
		  	controller.setup({ 
		  		del: 		[{ model: modelName, rights: "PUBLIC" }],
		  		getOne:  	[{ model: modelName, rights: "PUBLIC" }], 
		  		getMany:  	[{ model: modelName, rights: "PUBLIC" }],
		  		post: 		[{ model: modelName, rights: "PUBLIC" }],
		  		put: 		[{ model: modelName, rights: "PUBLIC" }],
		  	}))
		.prefix( prefix );	
    var options = {
        user: dbConfig.user,
        pass: dbConfig.pass
    };
    micro.connect( dbConfig.uri, options );
    MyTestDoc = micro.addModel( modelName, {
        email: 	{ type: String, required: true },
        status: { type: String, required: true },
        password: { type: String, select: false }, 
    });
    micro.listen( port );

### Step 5: Install and run the app

From your projects root folder, execute the following at the command line:

    $ npm install
    $ node index.js

### Step 6: Test the app

    TODO: curl commands 

## Tests

    $ npm test

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

#### Version 0.1.3 release notes

* Final pre-release


