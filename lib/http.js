/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * provides helper methods to send appropriate responses to http requests
 * @module  module:tastypie/lib/http
 * @author Eric Satterwhite
 * @since 0.0.1
 */

var http = require( 'http' )
  , STATUS_CODES = http.STATUS_CODES
  , lower = require('mout/string/lowerCase')
  , each  = require('mout/collection/forEach')
  , camelCase = require('mout/string/camelCase') 
  , response
  ;

response = function( code ) {
	return function (res, data, type, location){
		return res( data || STATUS_CODES[ code ] ).code( code ).type( type ).location( location || '' );
	};
};


each( http.STATUS_CODES, function( message, code ){
	exports[ camelCase( lower( message ) ) ] = response( parseInt( code, 10 ) );
});

/**
 * Http 101 status
 * @function
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.switching = response( 101 ); 
/**
 * Http 203 status
 * @function
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.nonAutoritative = response( 203 ); 

/**
 * Http 500 status
 * @function
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.serverError = response( 500 );

/**
 * Http 306 status
 * @function
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 * @param {String} location a url to set in the location header for redirects
 **/
exports.switchProxy = response(306);

return;
/**
 * Http 100 status
 * @function continue
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/

/**
 * Http 102 status
 * @static
 * @function
 * @name processing
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/

/**
 * @static
 * @function
 * @name checkpoint
 * Http 103 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/


/**
 * @static
 * @function
 * @name ok
 * Everything is fine ( 200 OK )!
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/

/**
 * @static
 * @function
 * @name created
 * Http 201 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/

/**
 * @static
 * @function
 * @name accepted
 * Http 202 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/


/**
 * @static
 * @function
 * @name noContent
 * Http 204 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/


/**
 * @static
 * @function
 * @name resetContent
 * Http 205 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/

/**
 * @static
 * @function
 * @name partialContent
 * Http 206 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/


/**
 * @static
 * @function
 * @name multipleChoices
 * Http 300 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/

/**
 * @static
 * @param {String} location a url to set in the location header for redirects
 * @function
 * @name movedPermanently
 * Http 301 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/

/**
 * @static
 * @param {String} location a url to set in the location header for redirects
 * @function
 * @name found
 * Http 302 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/

 /**
 * Http 303 status
 * @param {String} location a url to set in the location header for redirects
 * @static
 * @function
 * @name seeOther
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 * @param {String} location a url to set in the location header for redirects
 **/
 /**
 * Http 307 status
 * @static
 * @function
 * @name temporaryRedirect
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 * @param {String} location a url to set in the location header for redirects
 **/
 /**
 * Http 308 status
 * @static
 * @function
 * @name resumeIncomplete
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 * @param {String} location a url to set in the location header for redirects
 **/

/**
 * Http 401 status
 * @static
 * @function
 * @name badRequest
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 401 status
 * @static
 * @function
 * @name unauthorized
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 403 status
 * @static
 * @function
 * @name forbidden
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 404 status
 * @static
 * @function
 * @name notFound
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 405 status
 * @static
 * @function
 * @name methodNotAllowed
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 406 status
 * @static
 * @function
 * @name notAcceptable
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 407 status
 * @static
 * @function
 * @name proxyAuthenticationRequired
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 408 status
 * @static
 * @function
 * @name requestTimeout
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 409 status
 * @static
 * @function
 * @name conflict
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 410 status
 * @static
 * @function
 * @name resourceGone
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/


/**
 * Http 411 status
 * @static
 * @function
 * @name lengthRequired
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 412 status
 * @static
 * @function
 * @name preconditionFailed
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 413 status
 * @static
 * @function
 * @name requestEntityTooLarge
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 415 status
 * @static
 * @function
 * @name unsupportedMediaType
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 417 status
 * @static
 * @function
 * @name expectationFailed
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 422 status
 * @static
 * @function
 * @name unprocessableEntity
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 429 status
 * @static
 * @function
 * @name tooManyRequests
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/


/**
 * Http 501 status
 * @static
 * @function
 * @name notImplemented
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 502 status
 * @static
 * @function
 * @name badGateway
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/


/**
 * Http 503 status
 * @static
 * @function
 * @name serviceUnavailable
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 504 status
 * @static
 * @function
 * @name gatewayTimeout
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 505 status
 * @static
 * @function
 * @name httpVersionNotSupported
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/

/**
 * Http 507 status
 * @static
 * @function
 * @name insufficientStorage
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
