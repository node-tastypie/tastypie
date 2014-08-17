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
 **/


var  xml2js = require( 'xml2js' )
	, jstoxml = require( 'jstoxml' )
	, xml     = require("libxmljs")
	, events  = require("events")
	, util    = require("util")
	, Class   = require("./class")
	, jstoxml = require("jstoxml")
	, Meta    = require( './class/meta')
	, kindOf  = require("mout/lang/kindOf")
	, formats = ['json', 'xml']
	, createCallback = require('./utility').createCallback
	, content_types = {
		'application/json':'json'
		,'text/javascript':'jsonp'
		,'application/xml':'xml'
	}
	, Serializer
	;



var TOP_LEVEL = "response"
var OBJECT = "object"
var OBJECTS = "objects"
var VALUE  = "value"
var ARRAY  = 'array'


/**
 * DESCRIPTION
 * @class module:NAME.Thing
 * @param {Object} [meta] Serializer instance meta options
 * @param {String} [meta.callbackKey=callback] callback key to be used for jsop responsed
 * @param {String} [meta.defaultFormat='application/json'] the default serialziion format if one is not specified
 * @example var x = new NAME.Thing({});
 */
Serializer = Class({
	 mixin:[ events.EventEmitter, Meta ]
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
	}
	,constructor:function( meta ){
		this.setMeta( meta )
		this._parser = new xml2js.Parser( this.meta.xml );
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {Object} NAME ...
	 * @param {String} NAME ...
	 * @param {Options} NAME ...
	 * @param {Function} NAME ...
	 * @throws SerializationError
	 **/
	,serialize:function( data, format, callback ){
		var desired_format 
		  , method_name;
		var callback =  createCallback.apply(null, Array.prototype.slice.call(arguments) );

		desired_format = content_types[ format || this.meta.defaultFormat ] 
	  	method_name = "to_" + desired_format;

		if( this[method_name] && typeof this[method_name] == 'function'){
			return this[method_name]( data, callback )
		}

		throw util.format("unsupported format %s ", desired_format )
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return
	 **/
	,deserialize: function(data, format, callback ){
		var desired_format
		  , method_name;
		var callback = createCallback.apply(null, arguments );

		desired_format = content_types[ format || this.meta.defaultFormat ] 
	  	method_name = "from_" + desired_format;

		if( this[method_name] && typeof this[method_name] == 'function'){
			return this[method_name]( data, callback )
		}

		throw "unsupported format"
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return
	 **/
	,to_json:function( data, callback ){
		setTimeout(function(){
			try{
				callback( null, JSON.stringify( data ) );
			} catch( err ){
				callback( err , null );
			}
		},0)
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return
	 **/
	,from_json: function( data, callback ){
		setTimeout( function(){
			try{
				callback( null, JSON.parse( data, null, 2 ) )
			} catch( err ){
				callback( err, null )
			}
		},0);
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return
	 **/
	,to_xml: function( data, callback ){
		setTimeout( function(){
			try{
				callback(null, jstoxml.toXML( this.to_jstree( data) , {header:false, indent:" "} ) );
			} catch( err ){
				callback( err, null )
			}
		}.bind( this ),0)
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return
	 **/
	,from_xml: function( data, callback ){
		var callback = createCallback( arguments );
		this._parser.parseString(data, callback)
	}

	/**
	 * DESCRIPTION
	 * @method NAME
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
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return
	 **/
	,to_jsonp:function( data, callback ){
		setTimeout( function(){
			try{
				callback(null, util.format("%s(%j)", this.meta.callbackKey, data ) );
			} catch( err ){
				callback( err, null );
			}
		},0)
	}

});

module.exports = Serializer;
