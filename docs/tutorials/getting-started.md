REST Apis seem to be taking over the world as of late, and Node has been the platform of choice for building them. However, when you take a look at some of the tooling for building robust REST APIs in the node community, the options are bleak at best. When you take a look at all of the properties that would make an API RESTful, it is easy to see that it is rather complex.</p>

## REST

There are a few fundamental properties that make apis [RESTful](https://en.wikipedia.org/wiki/Representational_state_transfer) - they should be a **Scaleable**, **Stateless**, **Cacheable**, fit into a **Layered System** which is apart of a **Client / Server** model that provides a **Uniform Interface**. In the confines of a Restful HTTP API, it is common to use the HTTP verbs ( GET, PUT, POST, DELETE, etc ) to describe what action the API should perform. 

When it comes right down to it, there isn't really anything the facilitates this in the Node world. Most frameworks are limited and leave a lot of this work up to you which leads to a lot of repetitive boilerplate work. And like many DIYers in the JavaScript community, this frustration has lead me to build one myself. For the [better part of a year](https://github.com/esatterwhite/node-tastypie) I have been working on the side on a REST framework heavily inspired by a [Django](https://www.djangoproject.com/) project called [Tastypie](http://tastypieapi.org/) which focuses on implementing *most* of the REST principles with an emphasis on [HATEOAS](https://en.wikipedia.org/wiki/HATEOAS) - And wrote it in JavaScript!

## Tastypie

Tastypie is built on top of [Hapi](http://hapijs.com/) from the fine folks at Walmart. Tastypie lets you Define a Resource which will provide basic CRUD operations which map to the HTTP verbs complete with customization **serialization**, **Validation**, **Caching**, etc. Plus easy-as-pie Mongoose support to boot. To create Your first CRUD API we need 3 things - a **Data Model**, a tastypie **Resource** definition, and an `API Namespace` to hold your resources. 

*T he source code for the examples can be found [here](https://bitbucket.org/esatterwhite/tastypie-get-started)*

We start by making a pretty simple data model with Mongoose

```
{@lang bash}
npm install -s hapi mongoose joi boom tastypie@0.2.2
```

#### Define A Model

```
// model.js
var mongoose = require('mongoose')
mongoose.set('debug',true)
var connection = mongoose.createConnection('mongodb://localhost:27017/test')
var Schema = mongoose.Schema;
var User;

User = new Schema({
  name:{type:String}
  ,age:{type:Number}
  ,index:{type:Number}
  ,guid:{type:String}
  ,tags:[{type:String}]
  ,company:{
    name:{type:String}
    ,address:{
      city: {type:String}
      ,state: {type:String}
      ,street: {type:String}
      ,country: {type:String}
    }
  }
},{collection:'tastypie_user'});

module.exports = connection.model('User', User)
```

#### Define A Resource

The next step is to define a Resource for this data model. While tastypie resources are not inherently tied to mongoose, it does ship with a Resource class specifically for mongoose. Basically, give it a query constructor, and a field definition. Done!


```
// resource.js
var tastypie = require('tastypie')
var MongoResource = tastypie.Resource.Mongoose;
var User  = require('./model')

var Resource = MongoResource.extend({
  options:{
    queryset: User.find().toConstructor()
  }
  ,fields:{
    name: {type:'char'}
    ,age:{type:'int', attribute:'age'}
    ,companyName:{type:'char', attribute:'company.name', readonly:true}
  }
});
module.exports = Resource;
```

This is the bare bones set up of a resource which will give us full CRUD support. You must give it a query constructor using the `toConstructor` method on a mongoose query. We're using the simple case here. And a `fields` definition which defines the data fields you want to expose. The resource class will auto add an `id` field and `uri` field. But we'll come back to that.

#### Plug Into Hapi
Now we just need to wire it up to Hapi.

```
// server.js

var hapi = require('hapi')
var tastypie = require('tastypie')
var Api = tastypie.Api
var UserResource = require('./resource')
var app
var v1;

app = new hapi.Server();

app.connection({
  port:3000,
  labels:['api']
})

v1 = new Api('api/v1')
v1.use('user',new UserResource() );

app.register([v1], function( e ){
  app.start( function(){
    console.log('server running at http://localhost:3000')
  })	
})
```

That is it! The Tastpie `API` class is a Hapi plugin which adds the url prefix you defined - ( `api/v1` in our case ). 

## Interacting With Your API

Under the hood our resource creates 7 routes by default.

* `GET /api/v1` - endpoint schema
* `GET /api/v1/user` - Get all users
* `GET /api/v1/user/schema` - User schema
* `GET /api/v1/user/{pk}` -get user by id
* `POST /api/v1/user` - create a user
* `PUT /api/v1/user/{pk}` - update a user
* `DELETE /api/v1/user/{pk}` - delete a user

Tastypie uses the standard HTTP Headers `Accept` and `Content-Type` to deal with serialization / serialization of data. You can use whatever HTTP client you like. [Curl](http://linux.die.net/man/1/curl) will do us OK here.

#### API Schema

Each `API` instance registers an endpoint which provides all of the defined routes under it as a means for endpoint discovery. In our example it is just the `list`, `detail`, and `schema` endpoints, as you add more resources, this becomes a bit more dense.

```
// curl http://localhost:3000/api/v1
{
    "user": {
        "detail": "/api/v1/user/{pk}",
        "list": "/api/v1/user",
        "schema": "/api/v1/user/schema"
    }
}
```

Internally Tastypie maps each of the routes to an instance method using the HTTP verb. For example creating a user with `POST /api/v1/user` maps to `post_list`, where as `GET /api/v1/user` maps to the `get_list` method. Most functionality on a resource is granular and function based so you can subclass & change things if you like. If not granular, there is probably a config option for it.

From here we can take a look at the list endpoint which will return a paged set of data. The default page size is set to 25.

```
{
    "meta": {
        "count": 100,
        "limit": 25,
        "next": "/api/v1/meth?limit=25&offset=25",
        "offset": 0,
        "previous": null
    },
    "data":[
        {
            "age": 31,
            "companyName": "ISOTRONIC",
            "id": "557af820f3c3008b415de043",
            "name": "Sonia Velazquez",
            "uri": "/api/v1/meth/557af820f3c3008b415de043"
        },
        {
            "age": 24,
            "companyName": "CENTREXIN",
            "id": "557af820f3c3008b415de044",
            "name": "Shawna Perez",
            "uri": "/api/v1/meth/557af820f3c3008b415de044"
        }
    ]
}
```

You can see here we have a structured response with two primary blocks, `meta` and `data`. The `meta` block gives you some information about the response. Namely how many records are in the actual data set ( of the query you created ), the current page size or `limit`,and URIs to the `next` and `previous` page, if they exist.

The `data` block is an array of objects mapping be to the model we defined with the auto included `id` and `uri` field which is the unique identifier for that specific object. You can also see here that there is a `companyName` field which surfaced the nested value from our model. This is because our field definition specified a name path in the `attribute` property.

```
companyName:{type:'char', attribute:'company.name', readonly:true}
```

There are a number of ways to reshape the data, the `attribute` field is the easiest. It works in both directions, so one could actually send data in the `companyName` field and tastypie would resolve it to `company.name`. But in general, it is best to use a data structure that mirrors your model, so we marked this as `readonly`.

#### Resource Schema

Each defined resource comes standard with a simple schema definition mapped to the `/schema` uri which defines default format, allowed methods, and field definitions.

```
// curl http://localhost:3000/api/v1/user/schema
{
    "fields": {
        "age": {
            "blank": false,
            "default": null,
            "help": "Converts values to Numbers with a base of 10",
            "nullable": false,
            "readonly": false,
            "type": "integer",
            "unique": false
        },
        "companyName": {
            "blank": false,
            "default": null,
            "help": "Forces values to string values by calling toString",
            "nullable": false,
            "readonly": true,
            "type": "string",
            "unique": false
        },
        "id": {
            "blank": false,
            "default": null,
            "help": "A general no op field",
            "nullable": false,
            "readonly": true,
            "type": "string",
            "unique": false
        },
        "name": {
            "blank": false,
            "default": null,
            "help": "Forces values to string values by calling toString",
            "nullable": false,
            "readonly": false,
            "type": "string",
            "unique": false
        },
        "uri": {
            "blank": false,
            "default": null,
            "help": "Forces values to string values by calling toString",
            "nullable": false,
            "readonly": true,
            "type": "string",
            "unique": false
        }
    },
    "filtering": null,
    "format": "application/json",
    "limit": 25,
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
This sort of information can come in very hand for auto generating user interfaces for example.

If you don't like this schema format, you can alter this by changing the `get_schema` method on your resource to return a [JSONSchema](http://json-schema.org/) definition if you prefer. Or to return what ever you like for that matter.

#### Paging

You can use a number of special query string params to control how data is paged on the `list` endpoint. Namely -

* `limit` - Page size ( default 25 )
* `offset` - The starting point in the list

`limit=25&offset=50` would be the start of page 3

#### Sorting
sorting is handled query param `orderby` where you can pass it the name of a field to sort on. Sorting is descending by default. Specifying a negetive field ( `-<FOO>` ) would flip the order

```
{@lang bash}
orderby=-age
```

#### Advanced Querying

You might have noticed the `filtering` field on the schema. One of the things that makes an API "Good" is the ability to use query and filter the data to get very specific subsets of data. Tastypie exposes this through the query string as `field` and `filter` combinations. By default, the resource doesn't have anything enabled, you need to specify which filters are allowed on which fields, or specify `1` to allow everything

```
var Resource = MongoResource.extend({
  options:{
    queryset: User.find().toConstructor(),
    filtering:{
        name:['startswith','istartswith','endswith','iendswith'],
        age:['gt','lt','lte','gte', 'exact'],
        company:['istartswith'],
        companyName: ['istartswith']
    }
  }
  ,fields:{
    name: {type:'char'}
    ,age:{type:'int', attribute:'age'}
    ,companyName:{type:'char', attribute:'company.name', readonly:true}
  }
});
```

All of the primary query types in mongo query filters are exposed. 

##### Built In Filters

| Filter        | Function      |
| ------------- | ------------- |
| gt            | greater than                              |
| gte           | greater than or equal to                  |
| lt            | less than                                 |
| lte           | less than or equal to                     |
| in            | value in set ( [ 1,2,3 ])                 |
| nin           | Value **not** in set                      |
| size          | Size of set ( array length )              |
| startswith    | Case Sensitive string match               |
| istartswith   | Case **Insensitive** string match         |
| endswith      | Case Sensitive string match               |
| iendswith     | Case **Insensitive** string match         |
| contains      | Case Sensitive global string match        |
| icontains     | Case **Insensitive** global string match  |
| exact ( = )   | Exact Case Sensitive string match         |
| iexact        | Exact Case **Insensitive** string match   |
| match         | Matches an item in an array ( elemMatch ) |


Filters are added by appending a double underscore ``__`` and the filter type to the end of a field name. Given our example, if we wanted to find people who were older than 25, we would use the following URI syntax

```
{@lang bash}
http://localhost:3000/api/v1/user?age__gt=25
```
Filters are additive for a given field. For example, if we we only wanted people where we between 25 and 45, we would just add another filter

```
{@lang bash}
http://localhost:3000/api/v1/user?age__gt=25&age__lt=45
```

The same double underscore `__` syntax is used to access nested fields where the filter is always the last parameter. So we could find people whos age was  **greater than** 25, **less than** 45 and whose Company Name **starts with** `W`

```
{@lang bash}
http://localhost:3000/api/v1/user?age__gt=25&age__lt=45&company__name__istartswith=w
```

Remember, remapped fields still work for filtering, so the same would also be true for `companyName`

```
{@lang bash}
http://localhost:3000/api/v1/user?age__gt=25&age__lt=45&companyName__istartswith=w
```

Resources provide a simple and expressive syntax to query for very specific subsets of data without any of the boilerplate work to set it up. And as you would expect, regular params will map back to `exact` where applicable

```
{@lang bash}
http://localhost:3000/api/v1/user?age=44
```


#### Serialization

Tastypie supports multiple serialization formats out of the box as well as a way to define your own custom formats. The base `serializer` class supports `xml`, `json` & `jsonp` by default. You add formats or create your own serialization formats by subclassing the `Serializer` class and defining the approriate methods. Each format must define a `to_<FORMAT>` and a `from_<FORMAT>`. For example, tastypie defines the `to_xml` and `from_xml` methods. JSON is defined by `to_json`, `from_json`

To get back xml just change the `Accept` header
**NOTE:** *Hapi deals with most `application/foo` formats, but is blind to `text/foo`. So the safe bet here is to use `text/xml`*

```
{@lang xml}
// curl -H "Accept: text/xml" http://localhost:3000/api/v1/user

<?xml version="1.0" encoding="UTF-8"?>
<response>
 <meta type="object">
  <count type="number">100</count>
  <limit type="number">1</limit>
  <offset type="number">0</offset>
  <previous type="null">null</previous>
  <next type="string">/api/v1/meth?limit=25&offset=25</next>
 </meta>
 <data type="array">
  <object type="object">
   <name type="string">Dejesus Zimmerman</name>
   <age type="number">31</age>
   <companyName type="string">AVENETRO</companyName>
   <id type="string">557af820f3c3008b415de02c</id>
   <uri type="string">/api/v1/meth/557af820f3c3008b415de02c</uri>
  </object>
 </data>
</response>
```

#### Validation

At the time of writing, Tastypie ( `0.2.2` ) delegates validation responsibility to [Hapi](http://hapijs.com/api#route-options). You can specifiy a `validation` object in the Resource options which is passed to the Route configuration untouched. So to validate that the `Age` Param of incoming post / put data is an integer and less than 100, we could update our resource to hold the following

```
// resource.js
var tastypie = require('tastypie')
var MongoResource = tastypie.Resource.Mongoose;
var User  = require('./model')
var joi = require('joi')

var Resource = MongoResource.extend({
  options:{
    queryset: User.find().toConstructor()
    ,validation:{
       payload:joi.object({
           age:joi.integer().max(100).min(0)
       }).unknown()
    }
  }
  ,fields:{
    name: {type:'char'}
    ,age:{type:'int', attribute:'age', default:0}
    ,companyName:{type:'char', attribute:'company.name', readonly:true}
  }
});
module.exports = Resource;
```

This is a pretty good overview of tastypie, and we are still just scratching the surface. However, with less than 100 lines of code, we have a pretty feature rich and expressive CRUD API. Next time we'll cover adding custom endpoints beyond CRUD, advanced data preparation through Resource fields and access control.