
DEMO
================

Demo usage code from the README file.
-------------------------------------------------

### Step 1: Install

Because the __package.json__ file should already contain what you need, simply use this command to install everything:

    $ npm install

### Step 2: Visit MongoLab

Use your own local install of MongoDB or visit [__https://mongolab.com__](https://mongolab.com)
and create a free test database, writing down the credentials.

### Step 3: Edit ~/.bash_profile

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
    
### Step 4: Install and run the app

From your projects root folder, execute the following at the command line:

    $ node index.js

### Step 5: Test the app using curl commands

Leave the app running in one terminal window and open up another.
See the __curl__ command examples in this packages main README file for examples.
