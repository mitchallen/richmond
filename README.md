
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

Using your favorite plain text editor add the lines below to __~/.bash_profile__ (if on a Mac or Linux).

Replace __SUBDOMAIN__, __DBPORT__, __DATABASE__, __USER__ and __PASSWORD__ with your values.

You can also choose other values for __APP_SECRET__ and __TEST_PORT__.

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

Create a new record at the command line using __curl__ (assumes port __3030__):

    $ curl -i -X POST -H "Content-Type: application/json" 
      -d '{"email":"test@beta.com","password":"foo","status":"OK"}' 
      http://localhost:3030/api/mytest

Now get the record (by default non-selected fields, like __password__, will not be returned):

    $ curl -X GET -H "Accept: applications/json" 
      http://localhost:3030/api/mytest 

In some browsers, like Chrome, you can also see the raw JSON returned by browsing to: http://localhost:3030/api/mytest

The demo controller lets you get an individual document using the record __id__ like this (substitute for a record from your database):

    $ curl -X GET -H "Accept: applications/json" 
      http://localhost:3030/api/mytest/54ce6eca470103ca057b0097

You can append a filter to a GET request like this (__%7B__ = '__{__' and __%7D__ = '__}__'):

    $ curl -X GET -H "Accept: applications/json" 
      'http://localhost:3030/api/mytest?filter=%7B"email":"test@yourdomain.com"%7D'

You can also select what fields to show (__%20__ is a __space__), even non-selected fields (like password):

    $ curl -X GET -H "Accept: applications/json" 
      'http://localhost:3030/api/mytest?fields=email%20status%20password'

Note that if a field was never set in the record, you will not see it listed in the returned record.

## Middleware

Under the hood this module is using __express.js__ and wraps the __app.use__ call.
 
To inject middleware, like __CORS__, you can do the following (assumes you installed __cors__ and required it):

    micro.use( cors() );
    micro.listen( port );

## SSL

The Web controller in the demo supports SSL. 
 
To use SSL with the demo controller you must add an SSL key with a value of 404 or 302 in the setup.

For example, here is how you would do it for getOne:

    getOne: [{ model: modelName, rights: "PUBLIC", ssl: 404 }],
    
A value of 404 means that if a user attempts to browse to the Non-SSL version of the URL a 404 (Not Found) 
status will be returned.

A value of 302 (Moved) will result in the user being redirected to the SSL equivalent of the request.

## PATCH

Patch in the demo controller works, but consider it experimental and perform your own testing to confirm.

## Wrappers

You can add __before__ and __after__ wrappers to the demo controller like this:

    post:  [{ model: modelName, rights: "PUBLIC", 
              before: beforePost, after: afterPost }],
    
This example use a __before__ method to hash a password before saving it.

The __after__ method demonstrates how to remove the hashed password before the doc is returned.

The example also includes showing how to pass through extra data to the after method.:

    var testExtraMessage = 'Testing 123';

    var beforePost = 
	    function( prop, next ) {
            var extras = { message: testExtraMessage };
		    var body = prop.req.body;
            if( body.password != undefined ) {
		        bcrypt.hash( body.password, 10, function( err, hash ) {
                    if( err ) {
                        throw err;
                    }
                    body.password = hash;
                    next( body, extras );
                 });
            } else {
                next( body, extras );
            }
        };
  
    var afterPost = 
        function( prop, next ) {
            var doc = JSON.parse(JSON.stringify( prop.result ));
            thepatch = [ { "op": "remove", "path": "/password" } ];
            jsonpatch.apply( doc, thepatch );
            var extras = prop.extras;
            if( extras.message != testExtraMessage ) {
                throw new Error( "Test extra message not what expected.");
            }
            next( doc );
        };  
    
## Multiple Models

This module supports multiple models.  The setup could look something like this:

    modelName = ["AlphaTest","BetaTest"];

    micro
        .logFile("two-models-test.log")
        .controller( 
             controller.setup({ 
                 del:     [ { model: modelName[0], rights: "PUBLIC" },
                            { model: modelName[1], rights: "PUBLIC" } ],
                 getOne:  [ { model: modelName[0], rights: "PUBLIC" },
                            { model: modelName[1], rights: "PUBLIC" } ], 
                 getMany: [ { model: modelName[0], rights: "PUBLIC" },
                            { model: modelName[1], rights: "PUBLIC" } ],
                 post:    [ { model: modelName[0], rights: "PUBLIC" },
                            { model: modelName[1], rights: "PUBLIC" } ],
                 put:     [ { model: modelName[0], rights: "PUBLIC" },
                            { model: modelName[1], rights: "PUBLIC" } ]
             }))
             .prefix( prefix );
		 
        var options = {
            user: dbConfig.user,
            pass: dbConfig.pass
        };
		
        micro.connect( dbConfig.uri, options );
		
        // Model[0]
		
        AlphaTestDoc = micro.addModel( modelName[0], {
            email: 	{ type: String, required: true },
            status: { type: String, required: true },   
        });
			
        // Model[1]
		
        BetaTestDoc = micro.addModel( modelName[1], {
            user: { type: String, required: true },
            level: { type: String, required: true },   
        });
				
        micro.listen( port ); 

## API

### .logFile(filename)

* If no path is specified, will just write to the apps current directory.
* If writing to a folder, the folder must already exist.
* If this is not called all log output will go through the console.

#### Usage

    micro.logFile("my-test.log");

### .prefix()

Will return the prefix string.

#### Usage

    var s = micro.prefix();

### .prefix(string)

Allows defining a prefix for all routes.

Will validate the string and convert it internally to lowercase.

    micro.prefix("/API")
    
Routes will contain "/api" like this: http://localhost:3030/api/mytest 
    
    micro.prefix("/v1")
    
Routes will contain "/v1" like this: http://localhost:3030/v1/mytest 
    
Prefix validation rules:

* prefix can't be null
* prefix must begin with a slash
* prefix must not end with a slash
* prefix must not contain whitepace

### .addModel(name,model)

* Assigns a name to a Mongoose model and saves it.  
* The model name will be used in routes, like this:  http://localhost:3030/api/mytest
* The name will be validated internally with a call to __normalizeModelName__.

#### Usage:

    MyTests = micro.addModel("mytest", {
        email:      { type: String, required: true },
        status:     { type: String, required: true },
        password:   { type: String, select: false },
    });
    
    // PURGE all records (don't do in production!)
    MyTests.remove({"email": /@/ }, function (err) {
        if (err) {
            console.error(err);
        }
    }
    
### .model(name)

Returns the Mongoose model that was stored via __addModel__.  
You can then use that to create a record and use other Mongoose methods, like __.save__.
This would most likely be used in a POST controller.

#### Usage

    function (req, res, next) {
        var Collection = micro.model(name),
            record = new Collection(req.body);
        record.save(function (err, doc) {
            if (err) { throw err; }
            res
                .location("/" + name + "/" + doc._id)
                .status(201)    // Created
                .json(doc);
            }
        }
    }

### .normalizeModelName(name)

Makes sure the name is not null, has no spaces and returns the result in all lowercase.
Called internally by __addModel__ and __model__ to make sure that internal keys are lowercase and not incompatible.

#### Usage

    var modelName = micro.normalizeModelName(name);

### connect(uri,options)

The __uri__ would be in a form like this: mongodb://HOST:PORT/DATABASE

This is a wrapper for Mongoose.createConnection.  See their documentation for more option parameters.

#### Usage

    var options = {
        user: dbConfig.user,
        pass: dbConfig.pass
    };
    micro.connect(dbConfig.uri, options);

### .closeConnecton()

If there is an existing Mongoose connect this will close it. 

### .controller(controller)

Used to assign a controller to process requests.

#### Usage

    var controller = config.controller;

    micro.controller(
        controller.setup({
            getOne:   [ { model: modelName, rights: "PUBLIC" } ],
            getMany:  [ { model: modelName, rights: "PUBLIC" } ],
        })
    )

### .use(middleware)

Wrapper for internal express.js app.

#### Usage

    micro.use( cors() );

### .listen(port)

When everything is good to go, make this call last to start listening for requests on a particular port.

#### Usage

    micro.listen(port);

### .closeService()

Closes service and any open connections.

#### Usage

    micro.closeService();

### .secret(secret)

Used internally and externally combined with __jwt-simple__ to encrypt and decrypt strings of data.

__Do NOT hardcode the value__.  Always get it from the environment.  

Internally requests are intercepted my middleware and the headers are scanned for '__x-auth__'.
If __x-auth__ is found it is decoded using __jwt-simple__'s decode method and the string set by __.secret()__.
The result is assigned via the middleware to __req.token__ and carried on to the next method in the chain.  
Controllers then have the option to look for the decoded token and use it as they see fit.

Review the __right*__ tests for more info.

#### Usage

    micro.secret(appSecret);
    
    request(testHost)
        .post(testUrl)
        .send(testObject)
        .set('x-auth', jwt.encode({ username: "Mitch", role: "admin" }, appSecret))
        .set('Content-Type', 'application/json')
        .expect(201)
        .end(function (err, res) {
            should.not.exist(err);
                done();
            });
        });


## Tests

In order to run the tests, you need 
to add two more variables to your environment: __TEST_HOST__ and __TEST_SSL__

For testing, I use the services of https://ngrok.com - for a small annual fee I secured a subdomain
that I can tunnel back to a port on my localhost for testing.  It supports both SSL and Non-SSL.

    # Via ngrok
    export TEST_HOST=http://YOURSUBDOMAIN.ngrok.com
    export TEST_SSL=https://YOURSUBDOMAIN.ngrok.com


Tests assume that mocha has been installed globally.  If not execute the following:

    $ npm install -g mocha

Run the tests in one of the following two ways:

    $ mocha --timeout 20000
    
Or

    $ npm test

The tests generate log files in the projects root folder.

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

## Version History

#### Version 0.1.3 release notes

* Removed redundant code, updated documentation.

#### Version 0.1.2 release notes

* Updated test cases to use demo controller 0.1.2

#### Version 0.1.1 release notes

* Updated repo url and test controller dependency.

#### Version 0.1.0 release notes

* Initial release


