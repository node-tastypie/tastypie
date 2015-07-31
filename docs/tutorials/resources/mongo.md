There is an [offically supported package](https://github.com/esatterwhite/tastypie-mongo) which prvoides a {@link module:tastypie/lib/resource|Resource} class to work with [mongoose models](http://mongoosejs.com/) and [Mongodb](https://www.mongodb.org/). The Mongo resource type supports all of the same functionality as the {@link module:tastypie/lib/resource|default resource}, but performs filtering, paging, and data retrieval from a MongoDB Collection using a predefined query. Simply install the package into your project and use in place of the default resource.

```
npm install tastypie-mongoose --save
```

## Querysets

The Mongoose resource accepts a `queryset` option which is a mongoose query class which will serve as the base line query for fetching data. A queryset is a Mongosse query class which is created by calling `toConstructor` on _any_ Mongoose query.


#### Define A Model

```
// person.js
var mongoose = require('mongoose')
var Schema = mongoose.Schema;

var Person =new Schema({
	name: {
		first:{ type:String }
	  , last:{ type:String }
	}
  , age:{type:Number}
  , eyeColor:{type:String}
  , company:{
		address:{
			state:{ type: String }
		  , city: { type: String}
		}
  }
});

module.exports = mongose.model('MyModel', Person);
```

#### Define A Default Query

```
// resources/adult.js
var Resource = require('tastypie-mongoose')
var tastypie = require('tastypie')
var Person = require('person')
var AdultResource = Resource.extend({
	fields:{
		age       : { type: 'int' }
	  , eyeColor  : { type: 'char'}
	  , firstName : { type: 'char', attribute:'name.first'}
	  , lastName  : { type: 'char', attribute:'name.last'}
	  , company   : { type: 'object' }
	}

  , options:{
  		// the default query will only return people older than 18
  		queryset: Person.find({ age:{ $gt:18 } }).toConstructor()
  		filtering:{
  			company:tastypie.constants.ALL
  			,age:['lt','lte','gt','gte','exact']
  		}
  }
})
```

## Plug into A Hapi

The only thing that is left is to create an {@link module:tastypie/lib/api|Api Namespace} for our resource and register with a Hapi server instance

```
var Hapi = require( 'Hapi' )
var Api = require('tastypie').Api
var AdultResource = require('./resources/adult')
var v1, server


v1 = new Api('api/v1');
v1.use('adult', new AdultResource() );

server = new Hapi.Server();
server.connection({
	host:'0.0.0.0'
  , port:3000
  , labels:['api']
});

server.register([v1],function(){
	server.start(function(){
		console.log("server running at http://localhost:3000");
	})
})
```

The mongo resource pushes most functionality down to the database level, including filtering and paging. This means that even complex, nested filter queries can be accomplished with minimal overhead. For example, we could look up all adults over the age of 35 who belong to a company in a city starting with *S* in a single db query

```
{@lang bash}
curl -H "Accept: application/json" http://localhost:3000/api/v1/adult?age__gt=35&company__city__istartswith=s
```