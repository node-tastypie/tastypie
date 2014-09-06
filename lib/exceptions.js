/*jshint laxcomma:true, smarttabs: true */
"use strict";
/**
 * Holds common exception classes
 * @module module:lib/exceptions
 * @author Eric Satterwhite
 * @requires util
 * @since 0.1.0
 **/

var util = require("util")
  , EMPTY_STRING = ""
  , BaseException
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
BaseException = function( name, message ){
	this.name = name;
	this.message = message;
};

BaseException.prototype = new Error();


/**
 * Base Exeption Class
 * @extends module:lib/exceptions.BaseException
 * @class module:lib/execpetions.HttpException
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.HttpException =
HttpException = function( name, message ){
	BaseException.call( 
		  this
		, name
		, reason
	)

	this.status = 500
}

/**
 * Exception thrown when a serialization format is no supported
 * @class module:lib/exceptions.UnsupportedFormat
 * @param {String} type the name of the format that is not supported
 **/
exports.UnsupportedFormat = 
UnsupportedFormat = function( type ){

	BaseException.call( 
		  this
		, "UnsupportedFormat"
		, util.format( "Unsupported serialization format: %s", type )
	)
};

/**
 * Raised when a class instance method has not been implemented
 * @class module:lib/exceptions.NotImplemented
 * @param {String} method the name of the method that is not et implemented
 **/
exports.NotImplemented = 
NotImplemented = function( method ){
	BaseException.call( 
		  this
		, "NotImplementd"
		, util.format( "Msethod %s not implementd", method )
	)
};

/**
 * Raised when an error occurs during serialization of an object
 * @class module:lib/exceptions.SerializationError
 * @param {String} reason The reason the serialization failed
 **/
exports.SerializationError = 
SerializationError = function( reason ){
	BaseException.call( 
		  this
		, "SerializationError"
		, util.format( "Serialization Error %s", reason || EMPTY_STRING  )
	);
};

/**
 * DESCRIPTION
 * @class module:lib/exceptions.NotFound
 * @param {TYPE} NAME ...
 * @param {TYPE} NAME ...
 **/
exports.NotFound = 
NotFound = function( ){
	HttpException.call( 
		  this
		, "NotFound"
		, "Object Not Found"
	);

	this.status = 404;
};

/**
 * Raised when a request is unauthorized
 * @class module:lib/exceptions.Unauthorized
 **/
exports.Unauthorized = 
Unauthorized = function( ){
	HttpException.call( 
		  this
		, "Unauthorized"
		, "Request Unauthorized"
	);

	this.status = 401;
};

/**
 * Raised when a request is determined to be "bad"
 * @class module:lib/exceptions.BadRequest
 * @param {String} reason The reaspon the request is bad
 **/
exports.BadRequest = 
BadRequest = function( reason ){
	HttpException.call( 
		  this
		, "BadRequest"
		, reason
	);

	this.status = 400
};


util.inherits( UnsupportedFormat, BaseException );
util.inherits( SerializationError, BaseException );
util.inherits( NotImplemented, BaseException );
util.inherits( NotFound, HttpException );
util.inherits( Unauthorized, HttpException );
util.inherits( BadRequest, HttpException );
