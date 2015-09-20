datasha
========================

A modern database management tool written in Javascript (Angular.js) and PHP (Symfony/FOSRest).

Build for production
--------------
    $ ./dist.sh

You will find the finished version in packages/datasha-x.x.x and a tarball in packages/datasha-x.x.x.tar.bz2.
   
Running the production version
--------------
Put it somewhere within the web root of an Apache web server with PHP 5.4 or later and navigate to the directory it's in.

Overview
--------------
Datasha is meant to replace the aging web database administration tools which are standard across the spectrum of hosting providers and internal infrastructure setups today (ie PHPMyAdmin). As such it should be fast, usable, work across all mobile devices, work with several database engines, be easily deployable on many web servers and maybe even pretty.

Features
-------------

Datasha aims to match all of the features found in the available tools such as advanced criteria searches, single/bulk data manipulation, schema manipulation, intelligent query analysis, inline editing, intelligent foreign key navigation, etc.

But we're also adding many which have been mysteriously absent on the standard tools. You are able to perform safe Edit and Delete operations on rows of multi-table joined SQL queries if you want to, for example.

Architecture
--------------
Datasha is composed of two components. One is an Angular/Material application which consumes one or more Datasha API endpoints. The default API endpoint can be pointed at any URL during compilation.
The other component is an API layer written in PHP using Symfony/FOSRest. This component has a "driver" abstraction which allows other DBMS or NoSQL data providers to be hooked up and made available to the client for establishing connections.

Security 
--------------
**Datasha encrypts credentials at rest on the server**\
When a user provides the password for a database connection, Datasha uses it to establish a connection using its API layer, which, providing the database connection is successful, will generate a fresh public/private keypair and encrypt the credential using the public key. The crypto-text and public key are stored in the user's session. The private key is returned to the browser and is not stored. The browser stores the key in memory and localStorage. The client then sends the private key with each transaction related to the connection.

**Key material stored in browser is password-encrypted with SJCL**\
When stored in localStorage, the private keys which authenticate connections are always encrypted using the Stanford Javascript Crypto Library (SJCL)'s password encryption routine, which at its core uses AES-128 symmetric encryption.

Preparing for development
--------------
    $ cd api
    $ composer install
    $ cd ../web
    $ npm install
    $ bower install
    $ grunt

While developing
----------------
Open dataforest/web/build/dev.html in browser. To auto-compile your changes, use:

    $ grunt watch
