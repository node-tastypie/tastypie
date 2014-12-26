node-tastypie
=============

A re-realization of the popular Django REST framework - Tasypie for Node.js

* Project is **very** `Alpha` and missing a lot of features and functionality. Do not use for any production apps currently

### Create a simple Api

```js
var tastypie = require('tastypie')
var Api = tastypie.Api
var Resource = tastypie.Resource
var hapi = require('hapi')
var server = new hapi.server
var v1 = new Api('api/v1' )

v1.add('test', new Resource() );
v1.add('fake', new Resource() );

server.connection({port:2000})
server.register( v1, function( ){
	
	server.start(function(){
		console.log('server listening localhost:2000')	
	});
})
```

This allows for full HTTP support and basic CRUD operations on a single enpoint - api/v1/test

```sh
curl -XPOST -H "Content-Type: applciation/json" -d '{"test":"fake"}' http://localhost:3000/api/v1/test
curl -XPUT  -H "Content-Type: applciation/json" -d '{"test":"real"}' http://localhost:3000/api/v1/test
curl -XDELETE http://localhost:3000/api/v1/test/fake
```

### Serialization
The base serializer can deal with `xml`, `json` and `jsonp` out of the box. Serialization method is determined by the `Accept` header or a `format` query string param

```sh
curl -H "Accept: application/xml" http://localhost:3000/api/v1/test
curl http://localhost:3000/api/v1/test?format=xml
```

### FIXMEs 
- currently implemented ontop of express. Would like to move to [Hapi.js](http://hapijs.com/api/v7.5.2#route-handler)
	- The hapi request interface is mostly the same, and the parts - Paginator, Serializer, Cache can be used just find with hapi out side of the Resource Class in Hapi plugins and route handlers just fine

### What is Broke ?
1. Request flow for all HTTP Methods is yet to be fleshed out. Mostly data hydration
2. All APIFields are yet to be fleshed out
3. Schema endpoints
4. Notion of streaming responses... 

### What Works ?
1. Serialization / Desrialization in xml, json, and serialization in JSONP
2. Paginators.
3. Caching
4. GET, POST & PUT
	- Resources do not assume any ORM or backend, so the default resource does nothing. You will have to subclass and define all internal methods. Get is mostly done for you.
5. Per Field dyhdration.
6. APIField inheritance

#### Example FS resourse

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
	,constructor: function( meta ){
		this.parent('constructor', meta )
	}

	// internal lower level method responsible for getting the raw data
    , _get_list: function(bundle, callback){
		fs.readFile( path.join(__dirname, 'example','data.json') , callback)
    }


    // internal low level method reponsible for dealing with a POST request
    , _post_list: function _post_list( bundle, opt, callback ){
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

api.add('data', new Base() );

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
