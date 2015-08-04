node-tastypie
=============

[![Codeship Status for esatterwhite/node-tastypie](https://codeship.com/projects/c1cbe300-223a-0132-f5dd-46c80b892b0f/status?branch=master)](https://codeship.com/projects/36472)
[![Build Status](https://travis-ci.org/esatterwhite/node-tastypie.svg?branch=master)](https://travis-ci.org/esatterwhite/node-tastypie)
[![Codacy Badge](https://www.codacy.com/project/badge/35877cfd7e7e42f6bf82f1b8bf292b79)](https://www.codacy.com/app/esatterwhite/node-tastypie)

A re-realization of the popular Django REST framework - Tasypie for Node.js

[API Documentation](http://esatterwhite.github.io/node-tastypie)


### Officially Supported Resources Types

* [Official Monogoose Resource](https://github.com/esatterwhite/tastypie-mongo)
* [Official RethinkDB Resource](https://github.com/esatterwhite/tastypie-rethink)

### Create a simple Api

```js
var tastypie = require('tastypie')
var Api = tastypie.Api
var hapi = require('hapi')
var server = new hapi.server
var v1 = new Api('api/v1' )
var Resource = tastypie.Resource.extend({
	lastName:{ type:'char', attribute:'name.first' },
	fisrtName:{type:'char', attribute: 'name.last'}
})

v1.use('test', new Resource() );

server.connection({port:2000})
server.register( v1, function( ){
	server.start(function(){
		console.log('server listening localhost:2000')	
	});
})
```

##### Get Data

```js

// GET /api/v1/test

{

	"meta":{
		"count":1,
		"limit":25,
		"next":null,
		"previous":null	
	},
	"data":[{
		firstName:"Bill",
		lastName:"Bucks",
		uri:"/api/v1/test/1"	
	}]
} 

```


##### Auto Schema

```js
// GET /api/v1/test/schema

{
	"fields": {
		  "firstName": {
			  "blank": false,
			  "default": null,
			  "help_text": "Forces values to string values by calling toString",
			  "nullable": false,
			  "readonly": false,
			  "type": "string",
			  "unique": false
		  },
		  "lastName": {
			  "blank": false,
			  "default": null,
			  "help_text": "Forces values to string values by calling toString",
			  "nullable": false,
			  "readonly": false,
			  "type": "string",
			  "unique": false
		  },
		  "uri": {
			  "blank": false,
			  "default": null,
			  "help_text": "Forces values to string values by calling toString",
			  "nullable": false,
			  "readonly": false,
			  "type": "string",
			  "unique": false
		  }
	  },
	  "filtering": {},
	  "format": "application/json",
	  "limit": 0,
	  "methodsAllowed": [
		  "get",
		  "put",
		  "post",
		  "delete",
		  "patch",
		  "head",
		  "options"
	  ]

}
```

#### Built-in Fields

* field ( ApiField ) - Generic noop field
* object ( ObjectField ) - Generic no-op field
* char ( character / CharField ) - Converts values to strings
* array ( ArrayField ) Converts comma sparated strings into arrays
* int ( int / IntegerField ) converts numeric values into integers using `parseInt`
* float ( FloatField ) Converts values to floating point number using `parseFloat`
* bool ( BooleanField ) Forces values to booleans
* datetime ( DateTimeField ) Attempts to convert date time strings into date objects
* file ( FileField ) A field that pipes a stream to a configured location, and store a path
* filepath ( FilePathField ) A field that handles file locations rather than dealing with streams or binary data

This allows for full HTTP support and basic CRUD operations on a single enpoint - api/v1/test

```sh
curl -XPOST -H "Content-Type: applciation/json" -d '{"test":"fake"}' http://localhost:3000/api/v1/test
curl -XPUT  -H "Content-Type: applciation/json" -d '{"test":"real"}' http://localhost:3000/api/v1/test
curl -XDELETE http://localhost:3000/api/v1/test/fake
```

#### HTTP Verbs

This is how tastypie handles the base HTTP Methods 

* GET returns a list of resource instance or a specific resource instance
* DELETE removes a specific resource instance
* PUT **REPLACES** a resource instance. This is not a partial update. Any optional fields not define we be set to undefined
* PATCH a **PARTIAL** update to a specific resource instance. 
* **OPTIONS**, **HEAD**, **TRACE**, and **CONNECT** are left to implementation on a per resource bases


### Serialization
The base serializer can deal with `xml`, `json` and `jsonp` out of the box. Serialization method is determined by the `Accept` header or a `format` query string param

```sh
curl -H "Accept: text/xml" http://localhost:3000/api/v1/test
curl http://localhost:3000/api/v1/test?format=xml
```

**NOTE:** hapi captures application/foo so for custom serialization, we must use text/foo

#### Example FS resourse
Of course, Tastypie is not tied to Mongo or mongose, you can use the default resource type to create to put a Rest API around anything. The mongo resource just does a lot of the set up for you.

Here is a resource that will asyncronously read a JSON file from disk are respond to GET requests. Supports XML, JSON, paging and dummy cache out of the box.

```js
var hapi     = require('hapi');
var fs       = require('fs')
var path     = require('path')
var Resource = require('tastypie/lib/resource')
var Api      = require('tastypie/lib/api')
var fields   = require("tastypie/lib/fields")
var Class    = require('tastypie/lib/class')
var Options  = require('tastypie/lib/class/options')
var Serializer = require('tastypie/lib/serializer')
var debug    = require('debug')('tastypie:example')
var app;


// make a simple object template to be populated
// This could be a Model class just as easily

function Schema(){
	this.name = {
		first: undefined, last: undefined
	}
	this.age = undefined;
	this.guid = undefined;
	this.range = []
	this.eyeColor = undefined;
};


var Base = Class({
	inherits:Resource
	,options:{
		objectTpl: Schema // Set the schema as the Object template
	}
	,fields:{
		// remap _id to id
		id       : { type:'ApiField', attribute:'_id' }
	  , age      : { type:'IntegerField' } 

	// can also be a field instance
	, eyeColor : new fields.CharField({'null':true})
	, range    : { type:'ArrayField', 'null': true }
	, fullname : { type:"CharField", 'null':true }

	// remap the uid property to uuid. 
	, uuid     : { type:'CharField', attribute:'guid'}
	, name     : { type:'ApiField'}
   }
   , constructor: function( meta ){
		this.parent('constructor', meta )
   }

	// internal lower level method responsible for getting the raw data
	, get_objects: function(bundle, callback){
		fs.readFile( path.join(__dirname, 'example','data.json') , callback)
	}


	// internal low level method reponsible for dealing with a POST request
	, create_object: function create_object( bundle, opt, callback ){
		bundle = this.full_hydrate( bundle )
		// this.save( bundle, callback )
		callback && callback(null, bundle )
	}
	// per field dehydration method - generates a full name field from name.first & name.last
	, dehydrate_fullname:function( obj, bundle ){
		return obj.name.first + " " + obj.name.last
	}

	// top level method for custom GET /upload 
	, get_upload: function( bundle ){
		this.respond({data:{key:'value'}})
	}
	
	// method that retreives an individual object by id.
	// becuase it's in a flat file, read it, filter and return first object
	,get_object: function(bundle, callback){
		this._get_list(bundle,function(e, objects){
		var obj = JSON.parse( objects ).filter(function( obj ){
			return obj._id = bundle.req.params.id
		})[0]
		callback( null, obj )
	})
	}

	// Proxy method for delegeting HTTP methods to approriate resource method
	, dispatch_upload: function(req, reply ){
		// Do additional magic here.
		return this.dispatch('upload', this.bundle( req, reply ) )
	}
	
	// adds a custom route for upload in addition to standard crud methods
	, prepend_urls:function(){
		return [{
		  route: '/api/v1/data/upload'
		  , handler: this.dispatch_upload.bind( this )
		  , name:'upload'
		}]
	}
});
var api = new Api('api/v1', {
	serializer:new Serializer()
})

app.connection({port:process.env.PORT || 2000 });

api.user('data', new Base() );

app.register( api, function(e){
	app.start(function(){
		console.log('server is ready')
	});
});

```

Now you can read data from a file with your rest API

```sh
curl http://localhost:2000/api/v1/test
curl http://localhost:2000/api/v1/test?format=xml
curl http://localhost:2000/api/v1/test/1
curl http://localhost:2000/api/v1/test/2
curl http://localhost:2000/api/v1/test/2?format=xml
```

### Contributing

Contributions & patches welcome. If you have experience working with the original python / django-tastypie,  input would be greatly appreciated. Anything from docs, test and feature code is fair game.

1. Fork
2. Write Code
3. Write tests
4. Document your code
6. Push
7. Open Pull Request
