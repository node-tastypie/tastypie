node-tastypie
=============

A re-realization of the popular Django REST framework - Tasypie for Node.js

* Project is **very** `Alpha` and missing a lot of features and functionality. Do not use for any production apps currently

### Create a simple Api

```js
var tastypie = require('tastypie')
var Api = tastypie.Api
var Resource = tastypie.Resource
var app = require('express')();

var v1 = new Api('api/v1', app)
v1.register('test', new Resource() );
app.listen( 3000 );
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
var Resource = require('./lib/resource')
var Api = require('./lib/api')
var app = require('express')();
var fields = require("./lib/fields")
var Class = require('./lib/class')
var fs = require('fs')
var path = require('path')
var debug = require('debug')('tastypie:simple')

var R = new Class({
	inherits: Resource
	,resourceName:'lookup'
	,methodsAllowed:{
		get:true
	}
	,fields:{
		test:{ 
			attribute:'id'
			,type:'ApiField'
		} 
	}
	// Called by get_list to get the data, does caching
	,_get_list: function( bundle, callback ){
		var key = this.cacheKey(
			"list"
			,bundle.req.api_name
			,bundle.req.uri
			,bundle.req.method
			,this.meta.name
			,bundle.req.query
			,bundle.req.params
		)
		var that = this;
		this.meta.cache.get(key, function( err, data ){
			debug('cache return')
			if( data ){
				debug("cached")
				return callback( null, data )
			}
			// Reads a file name data.json from disk
			fs.readFile(path.resolve("./data.json"), 'utf8', function(err, contents){
				debug("file return")
				that.meta.cache.set( key, contents)
				callback( null, contents )
			})
		})
	}

	// handles a put request to an specific instance
	,put_detail: function( bundle ){
		var format = this.format(bundle, this.meta.serializer.types )
		this.deserialize( bundle.req.body, format, function(err, data ){
			console.log( data );
			bundle = this.update_object( bundle )
			bundle.data = this.full_dehydrate( bundle.data )
			return this.respond(bundle)
		}.bind( this ) )
	}

	// per field dehydration method - maps the test field value to id
	,dehydrate_test: function( obj ){
		return obj.id
	}
	,update_object: function(bundle){
		return bundle
	}

	// method that retreives an individual object by id.
	// becuase it's in a flat file, read it, filter and return first object
	,get_object: function(bundle, callback){
		this._get_list(bundle,function(e, objects){
			var obj = JSON.parse( objects ).filter(function( obj ){
				return obj.id = bundle.req.params.id
			})[0]
			callback( null, obj )
		})
	}
});
var counter = 0;
var api = new Api('api/v1', app,{
	middleware:[
		function(req, res, next){
			console.log("request %d", ++counter)
			next()
		}
	]
});
api.register('test', new R );
app.listen(process.env.PORT || 2000);
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
