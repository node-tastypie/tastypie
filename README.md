node-tastypie
=============

Port of Django's REST framework - Tasypie for Node.js

* Project is **very** `Alpha` and missing a lot of features and functionality. Do not use for any production apps currently

### Create a simple Api

```js
var tastypie = require('tastypie')
var Api = tastypie.Api
var Resource = tastypie.Resource
var app = require('express')();

var v1 = new Api('api/v1', app)
api.register('test', new Resource() );
app.listen( 3000 );
```

This allows for basic CRUD operations on a single enpoint - api/v1/test

### Serialization
The base serializer can deal with `xml`, `json` and `jsonp` out of the box. Serialization method is determined by the `Accept` header or a `format` query string param

```sh
curl -H "Accept: application/xml" http://localhost:3000/api/v1/test
curl http://localhost:3000/api/v1/test?format=xml
```

### Contributing

Contributions & patches welcome. If you have experience working with the original python / django-tastypie,  input would be greatly appreciated. Anything from docs, test and feature code is fair game.

1. Fork
2. Write Code
3. Write tests
4. Document your code
6. Push
7. Open Pull Request