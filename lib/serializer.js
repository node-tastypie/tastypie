/*jshint laxcomma:true, smarttabs: true */
/**
 * Provides standard data serialization & deserialization functionality
 * @module module:lib/serializer
 * @author Eric Satterwhite
 * @requires xml2js
 * @requires jstoxml
 * @requires events
 * @requires util
 * @requires module:class/meta
 * @requires mout/lang/kindOf
 * @requires module:lib/utility
 * @since 0.1.0
 **/


var Serializer;
const  xml2js          = require( 'xml2js' )
	, jstoxml        = require( 'jstoxml' )
	, domain         = require( 'domain' )
	, events         = require("events")
	, util           = require("util")
	, kindOf         = require("mout/lang/kindOf")
	, debug          = require('debug')('tastypie:serializer')
	, Class          = require("./class")
	, mime           = require("./mime")
	, Meta           = require( './class/meta')
	, Parent         = require('prime-util/prime/parentize')
	, exceptions     = require("./exceptions")
	, createCallback = require('./utility').createCallback
	, formats        = ['json', 'xml', 'jsonp']
	, TOP_LEVEL      = "response"
	, OBJECT         = "object"
	, OBJECTS        = "objects"
	, VALUE          = "value"
	, ARRAY          = 'array'
	, attempt
	;

/**
 * Base serializer implementation. Handles xml, json and jsonp
 * @class module:NAME.Thing
 * @param {Object} [meta] Serializer instance meta options
 * @param {String} [meta.callbackKey=callback] callback key to be used for jsop responsed
 * @param {String} [meta.defaultFormat='application/json'] the default serialziion format if one is not specified
 * @example var x = new NAME.Thing({});
 */
Serializer = Class({
	inherits: events.EventEmitter
	,mixin:[ Meta, Parent ]
	,meta:{
		callbackKey:'callback'
		,defaultFormat:"application/json"
		,xml:{
			"explicitCharKey":false
			,"trim":true
			,"normalize":false
			,"explicitArray":false
			,"ignoreAttrs":true
			,"mergeAttrs":false
			,"validator":null
			,"timeout":20000
		}
		, content_types :{
			'application/json':'json'
			,'text/javascript':'jsonp'
			,'application/xml':'xml'
		}
	}
	,constructor:function( meta ){
		this.setMeta( meta )
		this._parser = new xml2js.Parser( this.meta.xml );
	}

	/**
	 * Serialized an object into a string of a specified format
	 * @method module:tastypie/serializer.Serializer#serialize
	 * @param {Object} data The data object to be serialized into a string
	 * @param {String} format The format to serialize the object down to
	 * @param {Function} callback A callback function to be called when serialization is complete
	 * @throws SerializationError
	 **/
	,serialize:function( data, format, callback ){
		var method_name
		  , length = arguments.length
		  , err
		  , callback =  createCallback.apply(null, Array.prototype.slice.call(arguments) );
		
		switch( length ){
			case 1:
				format = this.meta.defaultFormat;
				break;
			case 2:
			case 3:
				format = typeof format == 'string' ? format : this.meta.defaultFormat;
				break;
		};
		desired_format = this.meta.content_types[ format ] 
	  	method_name = "to_" + desired_format;

		debug('desired format: %s', desired_format)
		if( this[method_name] && typeof this[method_name] == 'function'){
			return this[method_name]( data, callback );
		}

		throw new exceptions.UnsupportedFormat( desired_format );
	}

	,convertFormat: function convertFormat( format ){
		return mime.from( format) || null;
	}

	/**
	 * Converts a data string into a javascript object based on a specified content type
	 * @method module:tastypie/serializer.Serializer#deserialize
	 * @param {String} Data string to convert into an object
	 * @param {String} contentType the content type of the string to be deserialzie
	 * @param {Function} callback a function to call when deserialization is complete
	 * @return
	 **/
	,deserialize: function(data, format, callback ){
		var desired_format
		  , method_name
		  , length = arguments.length
		  , callback =  createCallback.apply(null, Array.prototype.slice.call(arguments) );

		switch( length ){
			case 1:
				format = this.meta.defaultFormat;
				break;
			case 2:
			case 3:
				format = typeof format == 'string' ? format : this.meta.defaultFormat;
				break;
		};

		// format is an optional argument
		if( arguments.length === 2 && typeof callback === 'function' ){
			format = this.meta.defaultFormat;
		}
		desired_format = this.meta.content_types[ format ] 
	  	method_name = "from_" + desired_format;

	  	method_name = "from_" + this.meta.content_types[ format ];
		if( this[method_name] && typeof this[method_name] == 'function'){
			return this[method_name]( data, callback )
		}

		err = new exceptions.UnsuportedFormat( format );
		this.emit('error', err );
		callback( err, null );
	}

	/**
	 * Converts an object into a valid JSON string
	 * @method module:tastypie/serializer.Serializer#to_json
	 * @param {String} json valid json string to parse into an object
	 * @param {Function} callback callback function to call when deserialization is complete
	 **/
	,to_json:function( data, callback ){
		setTimeout(this.attempt(function(err){
			callback(err, JSON.stringify( data ) );
		}.bind( this )),0)
	}

	/**
	 * Converts a json string into an object
	 * @method module:tastypie/serializer.Serializer#from_json
	 * @param {String} json valid json string to parse into an object
	 * @param {Function} callback callback function to call when deserialization is complete
	 **/
	,from_json: function( data, callback ){
		setTimeout( this.attempt(function(){
			callback( null, JSON.parse( data, null, 2 ) )
		}.bind( this )),0);
	}

	/**
	 * Converts an object to an xml string
	 * @method module:tastypie/serializer.Serializer#to_xml
	 * @param {String} data object to convert into an xml string
	 * @param {Function} callback callback function to call when deserialization is complete
	 **/
	,to_xml: function( data, callback ){
		setTimeout( this.attempt(function(){
			callback(null, jstoxml.toXML( this.to_jstree( data) , {header:true, indent:" "} ) );
		}.bind( this )),0)
	}

	/**
	 * converts an xml string into an object
	 * @method module:tastypie/serializer.Serializer#from_xml
	 * @param {String} xml valid xml string to parse into an object
	 * @param {Function} callback callback function to call when deserialization is complete
	 **/
	,from_xml: function( data, callback ){
		this._parser.parseString(data, callback)
	}

	/**
	 * DESCRIPTION
	 * @private
	 * @method module:tastypie/serializer.Serializer#to_jstree
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return
	 **/
	,to_jstree: function( data, name, depth, element){
		depth = depth == null ? 0 : depth;
		var data_type = kindOf( data ).toLowerCase();

		switch( data_type ){
			case ARRAY:
				element = {
					_name: name || OBJECTS
					,_attrs:{
						type:ARRAY
					}
					,_content:[]
				}

				data.forEach(function( item ){
					element._content.push( this.to_jstree( item, null, depth+1 ));
				}.bind(this))
				
				break;

			case OBJECT:
				if(depth === 0){
					element = {
						_name:TOP_LEVEL
						,_content:[]
					};

				} else {
					name = name || OBJECT
					element = {
						_content:[]
						,_name:name
						,_attrs:{
							type:OBJECT
						}
					}
					if( name != data_type ){
						element._attrs.type = data_type;
					} 
				}
				for( var key in data ){
					element._content.push( this.to_jstree( data[key], key, depth+1, element ) ) 
				}
				break;

			default:
				element = {
					_attrs:{
						type: data_type
					}
					,_content: String( data )
					,_name: name || VALUE
				}
				break;
		}
		return element;
	}

	/**
	 * Converts an object in to a jsonp string
	 * @method module:tastypie/serializer.Serializer#to_jsonp
	 * @param {Object} data data object to serialzie
	 * @param {Function} callback a callback function to call when serialization is complete. Must accept an error object and data payload
	 **/
	,to_jsonp:function( data, callback ){
		setTimeout( this.attempt(function(){
			callback(null, util.format("%s(%j)", this.meta.callbackKey, data ) );
		}.bind( this )),0)
	}

	,attempt: function( /*fn, [ arg1, arg2 ...] */ ){
		var fn = Array.prototype.shift.apply( arguments );

		try{ 
			return fn.apply(null, arguments ) 
		} catch( e ){
			this.emit( 'error', e )
			return fn( err, null)
		}
	}

});


Object.defineProperties(Serializer.prototype,{
	types: {
		get: function(){
			return Object.keys( this.meta.content_types )
		}
	}
})
module.exports           = Serializer;

