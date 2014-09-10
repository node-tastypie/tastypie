/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * http.js
 * @module http.js
 * @author 
 * @since 0.0.1
 */
var HttpResponse
  , NotFound
  , Unauthorized
  , BadRequest

/**
 * Base Exeption Class
 * @extends module:lib/exceptions.BaseException
 * @class module:lib/execpetions.HttpResponse
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.HttpResponse =
HttpResponse = function( res, data, status ){
	status = status || 200;
	res.status( status ).send( data || "OK")
}


/**
 * DESCRIPTION
 * @class module:lib/exceptions.NotFound
 * @param {TYPE} NAME ...
 * @param {TYPE} NAME ...
 **/
exports.NotFound = 
NotFound = function( res, bundle ){
	var status = 404;
	res.set('Content-Type', bundle.req.headers['Accepts'])
	res.status( 404 ).send( bundle.data || "Not Found" )
};

/**
 * Raised when a request is unauthorized
 * @class module:lib/exceptions.Unauthorized
 **/
exports.Unauthorized = 
Unauthorized = function( res, bundle ){
	var status = 401;

	res.status( status ).send( bundle.data || "You are not authorized to do that")
};

/**
 * Raised when a request is determined to be "bad"
 * @class module:lib/exceptions.BadRequest
 * @param {String} reason The reaspon the request is bad
 **/
exports.BadRequest = 
BadRequest = function( res, data, status ){
	var status = status ||  400;

	res.status( status ).send( data || "Bad Request")
};
