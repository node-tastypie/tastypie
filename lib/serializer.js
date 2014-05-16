/*jshint laxcomma:true, smarttabs: true */

var prime = require( 'prime' )
	, xmltojs = require( 'xml2js' )
	, jstoxml = require( 'jstoxml' )
	, events  = require("events")
	, util    = require("util")
	, Meta    = require( './class/meta')
	, formats = ['json', 'xml']
	, content_types = {
		'json':'application/json'
		,'jsonp':'text/javascript'
		,'xml':'application/xml'
	}

	, Serializer
	;

module.exports = 
Serializer = prime({
	mixin:[ events.EventEmitter, Meta ]
	,meta:{
		callbackKey:'callback'
		,xmlattr: false
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
	,serialize:function(){}
	,deserialize: function(){}
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
		data = this.meta.xmlattr ? this.to_tree( data ) : data;
		return  jstoxml.toXML(data,{header:true}, ' ')
	}
	,from_xml: function(){
		return this._parser.parseString(data)
	}
	,to_jsonp:function( data ){
		return util.format("%s(%j)", this.meta.callbackKey, data )
	}
});
