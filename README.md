
richmond.js
================

Map REST calls to MongoDB
-------------------------------------------------

<a href="https://travis-ci.org/mitchallen/richmond">
    <img src="https://img.shields.io/travis/mitchallen/richmond.svg?style=flat-square" alt="CI">
</a>
<a href="https://codecov.io/gh/mitchallen/richmond">
<img src="https://codecov.io/gh/mitchallen/richmond/branch/master/graph/badge.svg" alt="Coverage Status">
 </a>
<a href="https://npmjs.org/package/richmond">
    <img src="http://img.shields.io/npm/dt/richmond.svg?style=flat-square" alt="Downloads">
</a>
<a href="https://npmjs.org/package/richmond">
    <img src="http://img.shields.io/npm/v/richmond.svg?style=flat-square" alt="Version">
</a>
<a href="https://npmjs.com/package/richmond">
    <img src="https://img.shields.io/npm/l/richmond.svg?style=flat-square" alt="License"></a>
</a>

## Installation

    $ npm init
    $ npm install richmond --save
    $ npm install richmond-web-controller --save
    
__Important Note:__ be sure to be using the latest
[__richmond-web-controller__](https://www.npmjs.com/package/richmond-web-controller). 
There was a database id validation bug in earlier versions (fixed in 0.1.3).

* * *

## Terminology

* __demo controller__ - refers to the __richmond-web-controller__ that you install separately.

* * *

## Usage

### Step 1: Visit MongoLab

Use your own local install of MongoDB or visit [__https://mlab.com__](https://mlab.com)
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

This file can also be found in the online source under __examples/demo__

Note that this has changed since version 0.1.x.

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


### Step 4: Create index.js in your projects root folder:

This file can also be found in the online source under __examples/demo__

__Important Note:__ if you omit a line in the controller setup for an HTTP method (POST, PUT, etc) trying
to make an HTTP request using that method will result in a returned status of 404 (Not Found).

That may actually be desired.
For example you may want to build a Web service where people can only read (GET) records from your database.
So you would only include the setup lines for *getOne* (get one record) and *getMany* (get collection) in the demo controller.

As of 0.3.0 you can pass all of the service options to the constructor instead of __.setup__.

As of 0.4.0 it is no longer necessary to call __.connect__ if the database configs were already setup.
__.addModel__ will call __.connect__ directly if no connection can be found.

    var Richmond   = require('richmond'),
        config     = require('./config'),
        controller = config.controller,
        service    = config.service,
        micro      = new Richmond(service),
        modelName  = "MyTest";

    micro.controller(
        controller.setup({
            del:        [{ model: modelName, rights: "PUBLIC" }],
            getOne:     [{ model: modelName, rights: "PUBLIC" }],
            getMany:    [{ model: modelName, rights: "PUBLIC" }],
            post:       [{ model: modelName, rights: "PUBLIC" }],
            put:        [{ model: modelName, rights: "PUBLIC" }],
            patch:      [{ model: modelName, rights: "PUBLIC" }],
        })
    );
    micro.addModel(modelName, {
        email:    { type: String, required: true },
        status:   { type: String, required: true },
        password: { type: String, select: false },
    });
    micro.listen();
    console.log("Listening on port:", service.port);

Also note that the lines above in the *controller.setup* code only apply to the demo controller.
Future and third party controllers may implement their own strategy and options for defining how the controller works.

### Step 5: Install and run the app

From your projects root folder, execute the following at the command line:

    $ node index.js

### Step 6: Test the app using curl commands

Note that these commands refer to how the *demo controller* works. 
Future and third party controllers may operate differently.

#### POST

Create a new record at the command line using __curl__ (assumes port __3030__):

    $ curl -i -X POST -H "Content-Type: application/json" 
      -d '{"email":"test@beta.com","password":"foo","status":"OK"}' 
      http://localhost:3030/api/mytest

Repeat that step a few times.
Change the values to create a small set of records to experiment with.

#### GET

Now get all the records (by default non-selected fields, like __password__, will not be returned):

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

### PUT

__PUT__ is similar to __POST__ where you have to pass in data.
But since you are updating a record that already exists, you need to also append a record id to the URL.

    $ curl -i -X PUT -H "Content-Type: application/json" 
      -d '{"email":"test@put.com","password":"foo","status":"UPDATED"}' 
      http://localhost:3030/api/mytest/54ce6eca470103ca057b0097

The general philosophy with __PUT__ is that you should use it to replace the entire record,
and you should use __PATCH__ to do partial updates.
If you only pass in an incomplete set of fields, the demo controller does a merge.
Technically that isn't very RESTful. 
There is no guarantee that future controllers may be more strict.
If you want to be more strict, simply make sure to pass in all fields. 

This is what the demo __PUT__ controller currently does behind the scenes via __mongoose__:

    collection.update( { _id : req.params.id }, { $set : body }, ... )
    
### PATCH

__PATCH__ is simular to __PUT__.
You still need to include the id of the record in the URL.
But the data you pass in is not a set of fields.
Instead it's a set of *instructions* for how to patch the record.

    $ curl -i -X PATCH -H "Content-Type: application/json" 
      -d '[{"op":"replace","path":"/status","value":"PATCH THE STATUS"}]' 
      http://localhost:3030/api/mytest/54ce741e470103ca057b0098
      
Behind the scenes the demo controller currently uses __fast-json-patch__.
Search for that on __npm__ for more info how to apply patches.

### DELETE

Deleting a record through curl is similar to getting a record - you simply append the id to the URL.

    $ curl -i -X DELETE -H "Content-Type: application/json" 
      http://localhost:3021/api/mytest/54ce5b2109f8166e04258d31

* * *

## Middleware

Under the hood this module is using __express.js__ and wraps the __app.use__ call.
 
To inject middleware, like __CORS__, you can do the following (assumes you installed __cors__ and required it):

    micro.use( cors() );
    micro.listen();

* * * 

## SSL

The Web controller in the demo supports SSL. 
 
To use SSL with the demo controller you must add an SSL key with a value of 404 or 302 in the setup.

For example, here is how you would do it for getOne:

    getOne: [{ model: modelName, rights: "PUBLIC", ssl: 404 }],
    
A value of 404 means that if a user attempts to browse to the Non-SSL version of the URL a 404 (Not Found) 
status will be returned.

A value of 302 (Moved) will result in the user being redirected to the SSL equivalent of the request.

* * * 

## Wrappers

You can add __before__ and __after__ wrappers to the demo controller like this:

    post:  [{ model: modelName, rights: "PUBLIC", 
              before: beforePost, after: afterPost }],
    
This example uses a __before__ method to hash a password before saving it.

The __after__ method demonstrates how to remove the hashed password before the doc is returned.

The example also includes showing how to pass through extra data to the after method.:

    var testExtraMessage = 'Testing 123';

    var beforePost = 
	    function (prop, next) {
            var extras = { message: testExtraMessage };
		    var body = prop.req.body;
            if (body.password) {
		        bcrypt.hash(body.password, 10, function (err, hash) {
                    if (err) {
                        throw err;
                    }
                    body.password = hash;
                    next(body, extras);
                 });
            } else {
                next(body, extras);
            }
        };
  
    var afterPost = 
        function (prop, next) {
            var doc = JSON.parse(JSON.stringify(prop.result));
            thepatch = [ { "op": "remove", "path": "/password" } ];
            jsonpatch.apply( doc, thepatch );
            var extras = prop.extras;
            if (extras.message != testExtraMessage) {
                throw new Error("Test extra message not what expected.");
            }
            next(doc);
        };  
    
* * *

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
             }));
        // Model[0]
        micro.addModel(modelName[0], {
            email: 	{ type: String, required: true },
            status: { type: String, required: true },   
        });
        // Model[1]
        micro.addModel(modelName[1], {
            user: { type: String, required: true },
            level: { type: String, required: true },   
        });	
        micro.listen(); 

* * *

## API

## Constructor

You can still call the constructor with no arguments.
As of 0.3.0 you can also call the constructor passing in the options for __setup__.  

The constructor will still initialize internal values, but then call __setup__ with the options as a final step.
If you pass in the options, there would no need to call __setup__ later.
That will save you a step and simplify your code. 

    Richmond = require('richmond');
    micro = new Richmond(options);
    
Or 

    Richmond = require('richmond');
    micro = new Richmond();
    micro.setup(options)

See the __setup__ method for more info on what options are available.

### .setup(options)

A method introduced in 0.2.0 that lets you setup several parameters simultaneously.
This allows you to move some functionality to a config file, etc.

You do not need to include every option in the usage example below.

You can still change a value (example: *prefix*) after calling __setup__.
Just call the related method afterwards (i.e.: micro.prefix("/v1")); 

As of 0.3.0 an alternative is to pass the options to the constructor which will call __setup__ internally.

#### Usage

    micro = new Richmond();

    var options = {
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
    };

    micro.setup(options);
    
Or:

    var options = {
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
    };

    micro = new Richmond(options);

### .logFile(filename)

* If no path is specified, will just write to the apps current directory.
* If writing to a folder, the folder must already exist.
* If this is not called all log output will go through the console.
* You can also skip this call by setting the value through __setup__ or the constructor.

#### Usage

    micro.logFile("my-test.log");

Or via __setup__:
    
    var options = {
        logFile: "my-test.log"
    };
    
    micro.setup(options);
    
Or via the constructor:

    var options = {
        logFile: "my-test.log"
    };

    micro = new Richmond(options);

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
* You can also skip this call by setting the value through __setup__ or the constructor.

#### Usage

    micro.prefix("/v1");

Or via __setup__:
    
    var options = {
        prefix: "/v1"
    };
    
    micro.setup(options);

Or via the constructor:

    var options = {
        prefix: "/v1"
    };
   
    micro = new Richmond(options);

### .addModel(name,model)

* If __.connect__ was not called __.addModel__ will call it with no parameters.
It assumes that all database connection info was set via __setup__ or the constructor.
* Assigns a name to a Mongoose model and saves it.  
* The model name will be used in routes, like this:  http://localhost:3030/api/mytest
* The name will be validated internally with a call to __normalizeModelName__.

#### Usage:

    micro.connect();
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

Returns the Mongoose model that was stored via __addModel__. You can then use that to create a record and use other Mongoose methods, like __.save__.

#### Usage

This example would most likely be used in a POST controller.

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

### connect()
### connect(uri,options)

The __uri__ would be in a form like this: mongodb://HOST:PORT/DATABASE

This is a wrapper for __Mongoose.createConnection__.  See their documentation for more option parameters.

#### Usage

    var options = {
        user: dbConfig.user,
        pass: dbConfig.pass
    };
    micro.connect(dbConfig.uri, options);
    
Alternatively you can set the parameters via __setup__ and then call __connect__ with no parameters:

    var options = {
        database: {
            uri:  process.env.TEST_MONGO_DB || 'mongodb://localhost/mytest',
            options: {
                user: process.env.TEST_MONGO_USER || null,
                pass: process.env.TEST_MONGO_PASS || null
            }
        }
    };
    
    micro.setup(options);
    micro.connect();
    
Or via the constructor:

    var options = {
        database: {
            uri:  process.env.TEST_MONGO_DB || 'mongodb://localhost/mytest',
            options: {
                user: process.env.TEST_MONGO_USER || null,
                pass: process.env.TEST_MONGO_PASS || null
            }
        }
    };
    
    micro = new Richmond(options);
    micro.connect();

### .closeConnecton()

If there is an existing Mongoose connection this will close it. 

### .controller(controller)

Used to assign a controller (like __richmond-web-controller__) to process HTTP requests.

#### Usage

    var controller = config.controller;

    micro.controller(
        controller.setup({
            getOne:   [ { model: modelName, rights: "PUBLIC" } ],
            getMany:  [ { model: modelName, rights: "PUBLIC" } ],
        })
    )

### .use(middleware)

Wrapper for internal __express.js__ app.

#### Usage

    micro.use( cors() );

### .listen()
### .listen(port)

When everything is good to go, make this call last to start listening for requests on a particular port.

#### Usage

    micro.listen(port);
  
Alternatively you can define the port via the __setup__ method or the constructor.
Then call __listen__ with no parameters.
    
    var options = {
        port: process.env.TEST_PORT || null,
    };
    
    micro.setup(options);
    ...
    micro.listen();
    
Or via the constructor:
    
    var options = {
        port: process.env.TEST_PORT || null,
    };
    
    micro = new Richmond(options);
    ...
    micro.listen();

### .closeService()

Closes service and any open connections.

#### Usage

    micro.closeService();

### .secret(secret)

Used internally and externally combined with __jwt-simple__ to encrypt and decrypt strings of data.

__Do NOT hardcode the value__.  Always get it from the environment.  

Internally requests are intercepted by middleware and the headers are scanned for '__x-auth__'.
If __x-auth__ is found it is decoded using __jwt-simple__'s decode method and the string set by __.secret()__.
The result is assigned via the middleware to __req.token__ and carried on to the next method in the chain.
Controllers then have the option to look for the decoded token and use it as they see fit.

Review the __*rights*__ tests for more info.

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
    
Alterntively you can set the *secret* through the __setup__ method.    
        
    var options = {
        secret: process.env.APP_SECRET || null
    };
    
    micro.setup(options);

Or via the constructor:

    var options = {
        secret: process.env.APP_SECRET || null
    };
    
    micro = new Richmond(options);

Then there is no need to call the __.secret__ method directly 
But you can if you want to override the value set through __setup__

* * *

## Tests

In order to run the tests, you need to add two more variables to your environment: __TEST_HOST__ and __TEST_SSL__

    export TEST_HOST=http://localhost:8081
    export TEST_SSL=https://localhost:8081
    
The SSL version must be the https equivelant of the host value.

Internally the test cases use __ngrok__ for SSL testing.

Source the changes:

    $ source ~/.bash_profile

Tests assume that __mocha__ has been installed globally.  If not execute the following:

    $ npm install -g mocha

Run the tests *from the projects root folder* in one of the following ways:

    $ mocha --recursive --timeout 20000
    
Or

    $ npm test
    
Or if you feel like kickin' it old skool:

    make test

### Testing by Version

To run the tests for recent versions:

    $ mocha --timeout 5000 --recursive test/v0004/*test.js

The tests generate log files in a logs/ folder under the projects root folder.

* * *

## Repos

* [bitbucket.org/mitchallen/richmond.git](https://bitbucket.org/mitchallen/richmond.git)
* [github.com/mitchallen/richmond.git](https://github.com/mitchallen/richmond.git)

* * *

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code.

* * *

## Version History

#### Version 0.4.12 release notes

* upgraded test dependency to richmond-web-controller 0.1.9

#### Version 0.4.11 release notes

* upgraded test dependency to richmond-web-controller 0.1.8

#### Version 0.4.10 release notes

* mongoose now uses global.Promise

#### Version 0.4.9 release notes

* refactored some test cases

#### Version 0.4.8 release notes

* removed obsolete Makefile

#### Version 0.4.7 release notes

* brought code coverage up to 100%

#### Version 0.4.6 release notes

* changed description
* added keyworks to package.json

#### Version 0.4.5 release notes

* brought code statement coverage up to 97%

#### Version 0.4.4 release notes

* integrated travis-ci and codecov.io support
* integrated ngrok module into SSL testing
* updated dependencies
* added grunt build support
* brought test cases up to date
* removed test cases for old, outdated versions

#### Version 0.4.3 release notes

* Updated test cases use logs/ folder

#### Version 0.4.2 release notes

* Added new github repo to package.json

#### Version 0.4.1 release notes

* Created an examples folder and updated the README.

#### Version 0.4.0 release notes

* __.addModel__ will now automatically call __.connect__ (with no arguments) if no connection has been made.
* __.addModel__ assumes all connection parameters have been set via __.setup__ or the constructor.

#### Version 0.3.1 release notes

* Refined some of the README examples.

#### Version 0.3.0 release notes

* You can now pass options to the constructor which will call __.setup__ for you.
* Cloned tests to a new version 0.3.x suite and updated for new functionality.
* Added version info to all test suite output and test log file names.

#### Version 0.2.0 release notes

* Updated test cases to use richmond-web-controller 1.3.0 due to id validation issue
* Added .setup method
* Refactored tests by version to support backward compatibility
* Added a PATCH test

#### Version 0.1.3 release notes

* Removed redundant code, updated documentation.

#### Version 0.1.2 release notes

* Updated test cases to use demo controller 0.1.2

#### Version 0.1.1 release notes

* Updated repo url and test controller dependency.

#### Version 0.1.0 release notes

* Initial release


