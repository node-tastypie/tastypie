## Serializtion Cycle

Each Tastypie resource has a {@link module:tastypie/lib/serializer|Serializer} instance which it uses internally to convert data between well formatted string and javascript objects. This behavior is defined in the {@link module:tastypie/lib/serializer#serialize|serialize} and {@link module:tastypie/lib/serializer#deserialize|deserialize} methods. A serializer class defines how 
data is converted to and from a string. This is done via the `to_<FORMAT>` and `from_<FORMAT>` methods for each of the formats. For example, the default serializer defines the following methods:

* **to_json** - Converts an object to a JSON string
* **from_json** - Converts a JSON string to a javascript object
* **to_xml** - Converts a javascript object to an XML string
* **from_xml** - Converts an XML String to a javascript object

#### Serialization

Serialization is the act of converting a javascript object into a standard format string - JSON string, XML String, YAML String, etc. In the simplest case this is as simple as calling `JSON.stringify`. To add support for serialization of a new format, you must define the `to_` method on a serializer class.

```js:git
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

```js:git
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


## XML Handling

Tastypie 5.0 introduced the `strict` xml option for the default serializer which changes the way array elements are handled during serialization. When `strict mode` is set to **false**, Arrays are treated as an object of type array with repeating elements

```
var Serializer = require('./lib/serializer')
var s = new Serializer({xml:{strict: false}})
var data = {
	a:{
		b:[1,2,3]
		,c:[{
			foo:'bar'
		},{
			bar:'baz'
		}]
	}
}
s.serialize(data ,'text/xml',function( err, result ){
	console.log( result )
});
```

```html
<?xml version="1.0" encoding="UTF-8"?>
<response>
 <a type="object">
  <b type="array">
   <value type="number">1</value>
   <value type="number">2</value>
   <value type="number">3</value>
  </b>
  <c type="array">
   <object type="object">
    <foo type="string">bar</foo>
   </object>
   <object type="object">
    <bar type="string">baz</bar>
   </object>
  </c>
 </a>
</response>
```

This has been the default behavior of the serializer since 1.0 of tastypie and was done in an effort to be in line with the behaviors of the python libraries. However, there are two problems that arise with this implementation. 

1. It is non standard XML format and may break existing XML parsing libaries in the wild
2. XML data sent to be deserialized by tastypie would be parsed incorrectly. ( see point #1 )

For this reason, when strict mode is enabled arrays will be serialized as repeating elements. When in strict mode, XML responses sent from tastypie can be sent back in the same format as they were received


```
var Serializer = require('./lib/serializer')
var s = new Serializer()
var data = {
	a:{
		b:[1,2,3]
		,c:[{
			foo:'bar'
		},{
			bar:'baz'
		}]
	}
}
s.serialize(data ,'text/xml',function( err, result ){
	console.log( result )
});
```

```html
<?xml version="1.0" encoding="UTF-8"?>
<response>
 <a type="object">
  <b type="number">1</b>
  <b type="number">2</b>
  <b type="number">3</b>
  <c type="object">
   <foo type="string">bar</foo>
  </c>
  <c type="object">
   <bar type="string">baz</bar>
  </c>
 </a>
</response>
```

