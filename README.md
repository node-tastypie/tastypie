node-tastypie
=============

Port of Django's REST framework - Tasypie for Node.js


### Create a simple Api

'''js
var tastypie = require('tastypie')
var Api = tastypie.Api
var Resource = tastypie.Resource
var app = require('express')();

var v1 = new Api('api/v1', app)
api.register('test', new Resource() );
app.listen( 3000 );
'''

This allows for basic CRUD operations on a single enpoint - api/v1/test

### Serialization
The base serializer can deal with xml, json and jsonp out of the box. Serialization method is determined by the `Accept` header or a `format` query string param

'''sh
curl -H "Accept: application/xml" http://localhost:3000/api/v1/test
curl http://localhost:3000/api/v1/test?format=xml
'''