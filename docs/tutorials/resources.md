Resource are the  primary component in tastypie, and represent a collection of similar data or functionality. This could be a database table, a file, static data on disk, etc. A simple example could be a User for a blog site. 

### Class Based

As with most major components of tastypie, resources are class based. The primary reason is extensibility. The default resource type does not make any assumptions of data sources or functionality. Classes make it easier for you to override and add new functionality. The {@link module:tastypie/lib/class|Class} used in tastypie is a small amount of sugar around javascript inheritance which allows for things like calling parent functions and multiple inheritance ( mixins )

### Mixin Functionality

To work around some of the limitations of what javascript inheritance provides, tastypie uses the notion of mixins. Mixins are small classes that don't have unique constructor functions. Much of the funcationlity of the base resource is implemented as mixins and re-composed as the base resource. {@link module:tastypie/lib/resource/list|Listing} endpoints, {@link module:tastypie/lib/resource/detail|Detail} endpoints, and {@link module:tastypie/lib/resource/schema|Schema} endpoint functionality are all set up as mixins. This makes it easy to swap out and re-use large chunks of functionality. If, for example, you wanted to use [JSONSchema](http://json-schema.org/), or [Swagger](https://github.com/swagger-api/swagger-spec) in stead of the default schema definition, you could swap out the Schema mixin. When creating or extending a class, you can pass a class or an array of classes through the `mixin` key and all of the functions will be inherited by the parent.

```
{@lang javascript}
Resource = new Class({
	mixin: [ Options, Parentize, Schema, List, Detail ]
}}
```

### Method Mapping

Tasypie maps incomming requests to instance methods on a resource in a clean manner. In simple terms, it joins the HTTP Verb of the request and the name of the requestd route's action with an undercore - `get_list`, `post_list`, `put_list`, `get_schema`, etc. If the method in question is not defined on the target resource, a `501 Not Implemented` is returned to the client.

### Bundles

Bundles in tastypie are used as a single place to hold important data and information. Namely, bundles contain the current request object as `req`, a reply function as `res`, a `data` object containg data for serialization, and an `object` which will be populated by incoming data from clients.

### Data Preparation

Tastypie has two cycles for managing and shaping data as it flows between `client <> server`. There is the **Serialization / Deserialization** cycle which parses between JavaScript Object and formatted strings, like `xml`, `json`, etc. There is also the *hydration / deydration* cycle which is responsible for re-shaping data in between serialization / deserialization. That is, converting data from a data source into a final format for clients, and converting formats sent from a client into something suitable for a data source. For example, if your database schema were to change, you would be able to maintain compatible output formats from your resources - Renaming fields, surfacing nested data, injecting static data, etc.


### Responding To Requests

There are a number of ways to respond to incoming requests. 

* Passing a bundle to the {@link module:tastypie/lib/resource#respond|respond} method, which will handle content negotiation, serialization, etc
* Calling the res function directly from the bundle
* Calling the reply function directly from the main rout handler
