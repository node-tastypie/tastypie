One of the major components of a tastypie resource is the data preparation cycle, or `hydration` cycle. The hydration cycle is the aspect of a resource that is responsible for massaging raw user input into data objects suitable for saving to a data source, and vice versa.
The hydration cycle also encompasses the serialization machinery of the resource which is responsible for converting data object into standard data formats ( JSON, xml, etc ) and vice version

## Serializtion Cycle
Each Tastypie resource has {@link module:tastypie/lib/serializer|Serializer} instance which it uses internally to convert data between well formatted string and javascript objects. This behavior is defined in the {@link module:tastypie/lib/resource#serialize|serialize} and {@link module:tastypie/lib/resource#deserialize|deserialize} resource methods A serializer class defines how 
data is converted to and from a string. This is done via the `to_` and `from_` methods for each of the formats. For example, the default serializer defines the following methods:

* {@link module:tastypie/lib/serializer#to_json|to_json} - Converts an object to a JSON string
* {@link module:tastypie/lib/serializer#from_json|from_json} - Converts a JSON string to a javascript object
* {@link module:tastypie/lib/serializer#to_xml|to_xml} - Converts a javascript object to an XML string
* {@link module:tastypie/lib/serializer#from_xml|from_xml} - Converts an XML String to a javascript object

### Serialization

Serialization is the act of converting a javascript object into a standard format string - JSON string, XML String, YAML String, etc. In the simplest case this is as simple as calling `JSON.stringify`. To add support for serialization of a new format, you must define the `to_` method on a serializer class.

```
var tastypie = require('tastypie')
  , Class    = tastypie.Class
  , Serializer = tastypie.Serializer
  , JSONSerializer
  ;

JSONSerializer = new Class({

	inherits: Serializer
	
	,options:{
		content_types :{
			'application/json':'json'
		}
	}
	
	,to_json: function( data, options, callback ){
		callback( null, JSON.stringify( data ) );
	}

});
```

### Deserialization

Deserialization is the act of converting a standard format string ( usually from user input ) into a javascript object. To add support for deserialization of a new format, you must define the `from_` method on a serializer class.

```
var tastypie = require('tastypie')
  , Class    = tastypie.Class
  , Serializer = tastypie.Serializer
  , JSONSerializer
  ;

JSONSerializer = new Class({

	inherits: Serializer
	
	,options:{
		content_types :{
			'application/json':'json'
		}
	}

	,from_json: function( data, callback ){
		callback( null, JSON.parse( data ) );
	}

});
```

## Hydration Cycle

The hydration cycle is the component of a resource that enforces the data contract defined by the resource and it's fields  {@link module:tastypie/fields|fields}. More specifically, `hydration` is the act of converting raw user input into a consistent data structure that is suitable to be handed off to application code. `Deyhdration` is the act of taking data returned from the application code and data layers and converting into a data structure suitable for serialization. 

### Hydration

{@link module:tastypie/lib/resource#full_hydrate|Hydration} Takes user input from a client request and re-shapes / re-maps it into a an object suitable for further processing. Commonly, this may be an ORM model for saving data to a data store or for using in additional application code. The **key** aspect of the hydration cycle centers around the {@link module:tastypie/fields|fields} defined on the resource.

The {@link module:tastypie/fields.options.attribute|attribute} property on each of the field defines how the resource will reshape the incoming user input. The `attribute` can be a dot ( `.` ) separated name path to relocate each of the values from the input. If no `attribute` is defined, the name of field is used.

*It is important to note that a resource will ignore any data found in the request payload. It is only concerned with matching field names.*

```
var tastypie = require('tastypie')
  , Resource = tastypie.Resource
  , template
  , MyResource
  ;


MyResource = Resource.extend({
	options:{

	}	
	
	,fields:{
		shallow : { type:'int' }
	  , nested  : { type:'char', attribute:'a.b.c' }
	}
})
```

The resource above defines two fields, one with an attribute and one with out - given a request payload as such:

```
{
	"shallow": 10,
	"nested":"hello world",
	"fake": true
}
```

The result of hydration will result in an object with the following structure:

```
{
	"shallow": 10,
	"a":{
		"b":{
			"c":"hello world"	
		}
	}
}
```
By defining an `attribute` on the **nested** field of `a.b.c`, the resource created an object structure to match the name path and set the value from the user input at the final property `c`, and ignored the non matching field value of `fake`.

#### Per Field Hydration

Situations arise when a simple field attribute may not be enough to express the mapping of a data structure between user input and the internal data structure you want to work with. For this, the hydration process exposes method hooks for each field. By defining a resource method prefixed with `hydrate` and the name of the field, you have to ability to return any value you wish as the data is being reshaped. The method is passed the entire request {@link module:tastypie/lib/resource~Bundle|Bundle} giving you the ability to directly change the internal data structure

```
var tastypie = require('tastypie')
  , Resource = tastypie.Resource
  , MyResource
  ;


MyResource = Resource.extend({
	options:{
		// resource specific defaults
	}	
	
	,fields:{
		shallow : { type:'int' }
	  , nested  : { type:'char', attribute:'a.b.c' }
	  , fake    : { type:'bool' }
	}

	,hydrate_fake: function( bundle ){
		if( bundle.data.shallow > 10 ){
			bundle.data.fake = true;
		} else {
			bundle.data.fake = false
		}

		return bundle;
	}
})
```

Here the value of the `fake` field is dependent on the value of a different field. This soft of logic simply isn't possible with a name path style attribute, but is the same every time and a field hydration function is a good fit. At the time of writing, the per field hydration and dehydration functions are synchronous and must return a {@link module:tastypie/lib/resource~Bundle|Bundle} object.

### Dehydration

#### Per Field Dehydration

```
Client Request  
	-> Resource Handler & Access check & Throttle
		-> Deserialize 
			-> hydrate
				-> reesource actions
					-> dehydrate
						-> Cache actions
							-> serialize
								-> Client response

```