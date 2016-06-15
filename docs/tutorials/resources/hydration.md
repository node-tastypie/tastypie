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

### Hydration

#### Per Field Hydration

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