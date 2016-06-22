The primary thing you need to do to get started with tastypie, is define a resource which will expose the URIs for your API. The Base resource is set up with 2 primary actions ( `list` and `detail` ) and allows the base CRUD http verbs - `GET`, `PUT`, `POST`, `DELETE`, and optionally `PATCH`. 


## Define A Resource

A functional resource, by convention, should define method handlers for each of the actions & verbs where it makes sense - where the resource method name is `<VERB>_<ACTION>`.

```
var tastypie = require('tastypie')
var Resource = tastypie.Resource;
var http     = tasypie.http
var Simple;

Simple = Resource.extend({
    fields:{
        key:{type:'char'}
    }
    ,constructor:function( options ){
        this.parent('constructor', options)
    }
    ,get_list: function( bundle ){
        // the data property is what gets returnedt
        bundle.data = { key:'value' }; 

        // use the respond method if you
        // want serialization, status code, etc...
        return this.respond( bundle )
    }
    , get_detail: function( bundle ){
        bundle.data = {success:1}
        return this.respond( bundle )
    }
    , put_detail: function( bundle ){
        budnel.data = {key:'updated'}
        return this.respond( bundle, http.accepted )
    }
    , post_list: function( bundle ){
        var data = bundle.req.payload;
        // do something with the data.
        return this.respond( bundle, http.created)
    }
    , delete_detail: function( bundle ){
        bundle.data = null;
        return this.respond( bundle, http.noContent )
    }
    , patch_detail: function( bundle ){
        // or just send a straight response.
        return bundle.res({any:'data you want'}).code( 201 )
    }
});

module.exports = Simple;
```

That is pretty much all there is to it. You can use the {@link module:tastypie/lib/resource#respond|respond} method on the resource if you would like to have some level of consistency. The respond method will take care of Content negotiation, serialization, and set some headers for you. If you want to *skip* all of that, you can just use the `res` method on the `bundle`, which is a [hapi reply function](http://hapijs.com/api#replyerr-result).

## Registring Resource With Hapi

Once you have a resource, you need to add it to an {@link module:tastypie/lib/api|API Namespace} and register with a [Hapi Server](http://hapijs.com/api#server) instance

```
var Hapi = require('hapi');
var Api  = require('tastypie').Api;
var Simple = require('./simple');
var server, v1

server = new Hapi.Server();
server.connection({
    host:'0.0.0.0',
    port:3000,
    labels:['api']
});

v1 = new Api('api/v1');
v1.use('simple', new Simple())

server.register(v1,function(){
    server.start(function(){
        console.log('server running at http://localhost:3000/')
    });
})
```

Now we have three urls registered **/api/v1/simple**, **/api/v1/simple/{id}**, and **/api/v1/simple/schema**, which support has support for the main CRUD Verbs.

## API Level Serializer

A common _gotcha_ when attempting to respond directly to requests ( by using `bundle.res()` ) is that you lose content negotiation and proper serialization. As a remedy, you can specify a serializer {@link module:tastypie/lib/api|on an api instance} and it will attempt to serialize object appropriately. 

```
var Api = require('tastypie').Api;
var Serializer = require('tastypie').Serializer;
var server = new( require('hapi') ).Server();
var v1 = new Api('api/v1', {
    serializer: new Serializer()
});

v1.use('simple', new Simple());
server.register( v1, console.log );
```

When a serializer is present, the `Api` instance will inject itself into the request life-cycle and do the heavy lifting. Now you can use reply with plain old JSON objects ( `return bundle.res({})` ). Really nice for prototyping or quick iterations with front-end teams. 

## Final Source

Here is the example code in its entirety


```
var tastypie = require('tastypie')
var Resource = tastypie.Resource;
var http     = tastypie.http
var Hapi     = require('hapi');
var Api      = require('tastypie').Api;
var server, v1, Simple;

// resource
Simple = Resource.extend({

     get_list: function( bundle ){
        // the data property is what gets returned
        bundle.data = {'key': 'value'};

        // use the respond method if you
        // want serialization, status code, etc...
        return this.respond( bundle )
    }
    , get_detail: function( bundle ){
        bundle.data = {success:1}
        return this.respond( bundle )
    }
    , put_detail: function( bundle ){
        budnel.data = {key:'updated'}
        return this.respond( bundle, http.accepted )
    }
    , post_list: function( bundle ){
        var data = bundle.req.payload;
        // do something with the data.
        return this.respond( bundle, http.created)
    }
    , delete_detail: function( bundle ){
        bundle.data = null;
        return this.respond( bundle, http.noContent )
    }
    , patch_detail: function( bundle ){
        // or just send a straight response.
        return bundle.res({any:'data you want'}).code( 201 )
    }
});

// server setup
server = new Hapi.Server();
server.connection({
    host:'0.0.0.0',
    port:3000,
    labels:['api']
});

// namespace setup
v1 = new Api('api/v1');
v1.use('simple', new Simple())

server.register(v1,function(){
    server.start(function(){
        console.log('server running at http://localhost:3000/')
    });
})
```
