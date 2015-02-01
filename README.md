
richmond.js
================

A node.js module for mapping Web calls to MongoDB
-------------------------------------------------

## Installation

    $ npm init
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
    console.log( "Listening on port:", port );

### Step 5: Install and run the app

From your projects root folder, execute the following at the command line:

    $ node index.js

### Step 6: Test the app using curl commands

Create a new record at the command line using curl (assumes port 3030):

    $ curl -i -X POST -H "Content-Type: application/json" 
      -d '{"email":"test@yourdomain.com","status":"OK"}' 
      http://localhost:3030/api/mytest

Now get the record:

    $ curl -X GET -H "Accept: applications/json" http://localhost:3030/api/mytest 

In some browsers, like Chrome, you can also see the raw JSON returned by browsing to: http://localhost:3030/api/mytest

## Middleware

Under the hood this module is using expressjs and wraps the app.use call.  
To inject middleware, like CORS, you can do the following (assumes you installed cors and required it):

   micro.use( cors() );
   micro.listen( port );

## SSL

The Web controller in the demo supports SSL.  
To use SSL with that controller you must add an SSL key with a value of 404 or 302 in the setup.

For example, here is how you would did it for getOne:

    getOne: [{ model: modelName, rights: "PUBLIC", ssl: 404 }],
    
A value of 404 means that if a user attempts to browse to the Non-SSL version of the URL a 404 (Not Found) 
status will be returned.

A value of 302 (Moved) will result in the user being redirected to the SSL equivalent of the request.

## PATCH

Patch in the demo controller works, but consider it experimental and perform your own testing to confirm.


## Wrappers

You can add before and after wrappers to the demo controller like this:

    post:  [{ model: modelName, rights: "PUBLIC", before: beforePost, after: afterPost }],
    
This example use a before method to hash a password before saving it.
The after method demonstrates how to remove the hashed password before the doc is returned.
The example also includes showing how to pass through extra data to the after method.:

    var testExtraMessage = 'Testing 123';

    var beforePost = 
	    function( err, prop, next ) {
            if( ! prop.req ) 
		        return err( new Error("(before) prop.req not found") );
            if( ! prop.req.body ) 
                return err( new Error("(before) prop.req.body not found") );
            var extras = { message: testExtraMessage };
		    var body = prop.req.body;
            if( body.password != undefined ) {
		        bcrypt.hash( body.password, 10, function( err, hash ) {
                if( err ) console.err( err );
                    body.password = hash;
                    next( body, extras );
                 });
            } else {
                next( body, extras );
            }
        };
  
    var afterPost = 
        function( err, prop, next ) {
            if( ! prop.req ) return err( new Error("(after) prop.req not found") );
            if( ! prop.res ) return err( new Error("(after) prop.res not found") );
            if( ! prop.result ) return err( new Error("(after) prop.result not found") );
            var doc = JSON.parse(JSON.stringify( prop.result ));
            thepatch = [ { "op": "remove", "path": "/password" } ];
            jsonpatch.apply( doc, thepatch );
            var extras = prop.extras;
            if( extras.message != testExtraMessage ) {
                throw new Error( "Test extra message not what expected.");
            }
            next( doc );
        };  
    
## Tests

Tests assume that mocha has been installed globally.  If not execute the following:

    $ npm install -g mocha

Run the tests in one of the following two ways:

    $ mocha
    
Or

    $ npm test

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

#### Version 0.1.3 release notes

* Final pre-release


