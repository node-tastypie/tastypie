/*jshint laxcomma:true, smarttabs: true */
"use strict";
/**
 * Holds common exception classes
 * @module module:lib/exceptions
 * @author Eric Satterwhite
 * @requires util
 * @requires class
 * @requires class/meta
 * @requires module:prime-util/prime/parentize
 * @since 0.1.0
 **/

var util = require("util")
  , Class = require("./class")
  , Meta = require("./class/meta")
  , Parent = require("prime-util/prime/parentize")
  , EMPTY_STRING = ""
  , BaseException
  , HttpException
  , UnsupportedFormat
  , NotImplemented
  , SerializationError
  , NotFound
  , Unauthorized
  , BadRequest

/**
 * Base Exeption Class
 * @class module:lib/execpetions.BaseException
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.BaseException = 
BaseException = new Class({
	inherits: Error
	,mixin: [ Meta, Parent ]
	, meta: {
		name:'Exception'
		,message:""
		,code:1000
		,type:'base_exception'
	}
	, constructor: function Exception( meta ){
		var tmp;
		this.setMeta( meta );
		this.name = this.meta.name
		tmp = Error.call( this, this.meta.message );
		tmp.name = this.name;
		this.stack = tmp.stack;
		tmp = undefined;
	}
});

Object.defineProperties( BaseException.prototype,{
	code:{
		get:function(){
			return this.meta.code;
		}
	}

	,type: {
		get: function( ){
			return this.meta.type;
		}
	}
	,message:{
		get: function( ){
			return this.meta.message;
		}
	}
});

/**
 * Exception thrown when a serialization format is no supported
 * @class module:lib/exceptions.UnsupportedFormat
 * @param {String} type the name of the format that is not supported
 **/
exports.UnsupportedFormat = 
UnsupportedFormat = new Class({
	inherits: BaseException
	,meta:{
		name: "UnsupportedFormat"
		,code:1001
	}
	,constructor: function UnsupportedFormat( type, meta ){
		(meta = meta||this.meta).message = util.format( "Unsupported serialization format: %s", type )
		this.parent('constructor', meta)
	}
})

/**
 * Raised when a class instance method has not been implemented
 * @class module:lib/exceptions.NotImplemented
 * @param {String} method the name of the method that is not et implemented
 **/
exports.NotImplemented = 
NotImplemented = new Class({
	inherits: BaseException 
	,meta:{
		name: "NotImplemented"
		,code: 1001
		,type:"implementation_error"
	}
	,constructor: function NotImplemented( method, meta ){
		(meta = meta ||this.meta ).message = util.format( "Method %s not implemented", method ); 
		this.parent('constructor', meta );
	}
});

/**
 * Raised when an error occurs during serialization of an object
 * @class module:lib/exceptions.SerializationError
 * @param {String} reason The reason the serialization failed
 **/
exports.SerializationError = 
SerializationError = new Class({
	inherits: BaseException
	,meta:{
		name: "SerializationError"
		,code:1002
		,type:'serialization_error'
	}
	,constructor: function SerializationError( reason, meta ){
		meta = meta || this.meta
		this.parent('constructor', meta);
	}		
});
