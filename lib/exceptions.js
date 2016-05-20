/*jshint laxcomma:true, smarttabs: true, node: true */
"use strict";
/**
 * Holds common exception classes
 * @module module:tastypie/lib/exceptions
 * @author Eric Satterwhite
 * @requires util
 * @requires class
 * @requires class/options
 * @requires module:class/parent
 * @since 0.1.0
 **/

var util = require("util")
  , Class = require("./class")
  , Options = require("./class/options")
  , Parent = require("./class/parent")
  , BaseException
  ;
/**
 * Base Exeption Class
 * @class module:lib/execpetions.BaseException
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.BaseException =
BaseException = new Class({
	inherits: Error
	,mixin: [ Options, Parent ]
	, options: {
		name:'Exception'
		,message:""
		,code:1000
		,type:'base_exception'
	}
	, constructor: function Exception( options ){
		var tmp;
		this.setOptions( options );
		this.name = this.options.name;
		tmp = Error.call( this, this.options.message );
		tmp.name = this.name;
		this.stack = tmp.stack;
		tmp = undefined;
	}
});

Object.defineProperties( BaseException.prototype,{
	code:{
		get:function(){
			return this.options.code;
		}
	}

	,type: {
		get: function( ){
			return this.options.type;
		}
	}
	,message:{
		get: function( ){
			return this.options.message;
		}
	}
});

/**
 * Exception thrown when a serialization format is no supported
 * @class module:tastypie/lib/exceptions.UnsupportedFormat
 * @param {String} type the name of the format that is not supported
 **/
exports.UnsupportedFormat = new Class({
	inherits: BaseException
	,options:{
		name: "UnsupportedFormat"
		,code:1001
	}
	,constructor: function UnsupportedFormat( type, options ){
		(options = options||this.options).message = util.format( "Unsupported serialization format: %s", type );
		this.parent('constructor', options);
	}
});

/**
 * Raised when a class instance method has not been implemented
 * @class module:tastypie/lib/exceptions.NotImplemented
 * @param {String} method the name of the method that is not et implemented
 **/
exports.NotImplemented = new Class({
	inherits: BaseException
	,options:{
		name: "NotImplemented"
		,code: 1001
		,type:"implementation_error"
	}
	,constructor: function NotImplemented( method, options ){
		(options = options ||this.options ).message = util.format( "Method %s not implemented", method );
		this.parent('constructor', options );
	}
});

/**
 * Raised when an error occurs during serialization of an object
 * @class module:tastypie/lib/exceptions.SerializationError
 * @param {String} reason The reason the serialization failed
 **/
exports.SerializationError = new Class({
	inherits: BaseException
	,options:{
		name: "SerializationError"
		,code:1002
		,type:'serialization_error'
	}
	,constructor: function SerializationError( reason, options ){
		options = options || this.options;
		this.parent('constructor', options);
	}
});

/**
 * Some part of tastypie has been configured incorrectly
 * @class module:tastypie/lib/exceptions.ImproperlyConfigured
 */
exports.ImproperlyConfigured = new Class({
	inherits:BaseException
	,options:{
		name:'ImproperlyConfigured'
		,code:1003
		,type:'improperly_configured'
	}
});


/**
 * Raised when request filters are used incorrectly
 * @class module:tastypie/lib/exceptions.ResourceFilterError
 */
exports.ResourceFilterError =  new Class({
	inherits: BaseException
	,options:{
		name:'ResourceFilterError'
		,code:1004
		,type:'resource_filter'
	}
});
