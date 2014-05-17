/*jshint laxcomma:true, smarttabs: true */

var  xml2js = require( 'xml2js' )
	, jstoxml = require( 'jstoxml' )
	, xml     = require("libxmljs")
	, events  = require("events")
	, util    = require("util")
	, Class   = require("./class")
	, Meta    = require( './class/meta')
	, kindOf  = require("mout/lang/kindOf")
	, formats = ['json', 'xml']
	, content_types = {
		'application/json':'json'
		,'text/javascript':'jsonp'
		,'application/xml':'xml'
	}
	, Serializer
	;

Serializer = Class({
	 mixin:[ events.EventEmitter, Meta ]
	,meta:{
		callbackKey:'callback'
		,xmlattr: false
		,defaultFormat:"application/json"
		,xml:{
			"explicitCharKey":false
			,"trim":true
			,"normalize":false
			,"explicitArray":false
			,"ignoreAttrs":false
			,"mergeAttrs":false
			,"validator":null
			,"timeout":20000
		}
	}
	,constructor:function( meta ){
		this.setMeta( meta )
		this._parser = new xml2js.Parser( this.meta.xml );
	}
	,serialize:function( data, format, options ){
		var desired_format
		  , method_name;

		desired_format = content_types[ format || this.meta.defaultFormat ] 
	  	method_name = "to_" + desired_format;

		if( this[method_name] && typeof this[method_name] == 'function'){
			return this[method_name]( data, options )
		}

		throw "unsupported format"
	}

	,deserialize: function(data, format, options ){
		var desired_format
		  , method_name;

		desired_format = content_types[ format || this.meta.defaultFormat ] 
	  	method_name = "from_" + desired_format;

		if( this[method_name] && typeof this[method_name] == 'function'){
			return this[method_name]( data, options )
		}

		throw "unsupported format"
	}
	,to_json:function( data ){
		return JSON.stringify( data );
	}
	,from_json: function( data ){
		return JSON.parse( data, null, 2)
	}

	/**
	 * DESCRIPTION
	 * @method NAME
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return
	 **/
	,to_xml: function( data ){
		return this.to_tree( data ).toString();
	}
	,from_xml: function( data ){
		return this._parser.parseString(data)
	}

	,to_tree: function( data, name, depth, doc ){
		depth = depth == null ? 0 : depth;
		var element;
		var data_type = kindOf( data ).toLowerCase()
		switch( data_type ){
			case 'array':
				element = new xml.Element( doc, name ||"objects");
				if( name ){
					element = new xml.Element( doc, name );
					element.attr({type:'list'});
				} else {
					element = new xml.Element( doc, 'objects' )
				}

				data.forEach(function( item ){
					element.addChild( this.to_tree( item, null, depth+1, doc));
				}.bind(this))
				
				break;
			case 'object':
				if(depth === 0){
					doc = new xml.Document()
					element = doc.node(name || 'reponse' )

				} else {
					name = 'object'
					element = new xml.Element( doc, name )
					if( name != data_type ){
						element.attr({type:data_type});
					}
				}
				for( var key in data ){
					element.addChild( this.to_tree( data[key], key, depth+1, doc ) )
				}
				break;

			default:
				element = new xml.Element( doc, name || 'value' )

				element.attr({type:data_type});
				element.text( String( data ) )
		}

		return element
	}
	,to_jsonp:function( data ){
		return util.format("%s(%j)", this.meta.callbackKey, data )
	}
	});

	module.exports = Serializer;
