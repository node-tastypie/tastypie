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
  , redirect
  ;

redirect = function( code ) {
	return function (res, data, type, location){
		return res( data || STATUS_CODES[ code ] ).code( code ).type( type ).location( location );
	};
};


/**
 * Http 100 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.continue = function( res, data, type ){
	return res( data || STATUS_CODES[ 100 ] ).code( 100 ).type( type );
};

/**
 * Http 101 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.switching = function( res, data, type ){
	return res( data || STATUS_CODES[ 101 ] ).code( 101 ).type( type );
};

/**
 * Http 102 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.processing = function( res, data, type ){
	return res( data || STATUS_CODES[ 102 ] ).code( 102 ).type( type );
};

/**
 * Http 103 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.checkpoint = function( res, data, type ){
	return res( data || STATUS_CODES[ 103 ] ).code( 103 ).type( type );
};


/**
 * Everything is fine ( 200 OK )!
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.ok = function( res, data, type ){
	return res( data || STATUS_CODES[ 200 ] ).code( 200 ).type( type );
};

/**
 * Http 201 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.created = function( res, data, type, location ){
	return res( data || STATUS_CODES[ 201 ] ).created( location || data.uri || '' ).type( type );
};

/**
 * Http 202 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.accepted = function( res, data, type, location ){
	return res( data || STATUS_CODES[ 202 ] ).code( 202 ).type( type ).location( location || '' );
};


/**
 * Http 203 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.nonAutoritative = function( res, data, type ){
	return res( data || STATUS_CODES[ 203 ] ).code( 203 ).type( type );
};

/**
 * Http 204 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.noContent = function( res, data, type ){
	return res( ).code( 204 ).type( type );
};


/**
 * Http 205 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.resetContent = function( res, data, type ){
	return res( data || STATUS_CODES[ 205 ] ).code( 205 ).type( type );
};

/**
 * Http 206 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.partialContent = function( res, data, type ){
	return res( data || STATUS_CODES[ 206 ] ).code( 206 ).type( type );
};


/**
 * Http 300 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.multipleChoices = function( res, data, type ){
	return res( data || STATUS_CODES[ 300 ] ).code( 300 ).type( type );
};

/**
 * Http 301 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.movedPermanently = redirect( 301 );

/**
 * Http 302 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.found = redirect( 302 );

/**
 * Http 303 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.seeOther = function( res, data, type ){
	return res(data || STATUS_CODES[ 303 ] ).code( 303 ).type( type );
};

/**
 * Http 306 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.switchProxy = function( res, data, type ){
	return res(data || STATUS_CODES[ 306 ] ).code( 306 ).type( type );
};

/**
 * Http 307 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.temporaryRedirect = redirect( 307 )

/**
 * Http 308 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.resumeIncomplete = function( res, data, type ){
	return res(data || STATUS_CODES[ 308 ] ).code( 308 ).type( type );
};

/**
 * Http 401 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.badRequest = function( res, data, type ){
	return res(data || STATUS_CODES[ 400 ] ).code( 400 ).type( type );
};

/**
 * Http 401 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.unauthorized = function( res, data, type ){
	return res(data || STATUS_CODES[ 401 ] ).code( 401 ).type( type );
};

/**
 * Http 403 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.forbidden = function( res, data, type ){
	return res(data || STATUS_CODES[ 403 ] ).code( 403 ).type( type );
};

/**
 * Http 404 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.notFound = function( res, data, type ){
	return res(data || STATUS_CODES[ 404 ] ).code( 404 ).type( type );
};

/**
 * Http 405 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.methodNotAllowed = function( res, data, type ){
	return res(data || STATUS_CODES[ 405 ] ).code( 405 ).type( type );
};

/**
 * Http 406 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.notAcceptable = function( res, data, type ){
	return res(data || STATUS_CODES[ 406 ] ).code( 406 ).type( type );
};

/**
 * Http 407 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.proxyAuthenticationRequired = function( res, data, type ){
	return res(data || STATUS_CODES[ 407 ] ).code( 407 ).type( type );
};

/**
 * Http 408 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.proxyAuthenticationRequired = function( res, data, type ){
	return res(data || STATUS_CODES[ 408 ] ).code( 408 ).type( type );
};

/**
 * Http 409 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.conflict = function( res, data, type ){
	return res(data || STATUS_CODES[ 409 ] ).code( 409 ).type( type );
};

/**
 * Http 410 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.resourceGone = function( res, data, type ){
	return res(data || STATUS_CODES[ 410 ] ).code( 410 ).type( type );
};


/**
 * Http 411 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.lengthRequired = function( res, data, type ){
	return res(data || STATUS_CODES[ 411 ] ).code( 411 ).type( type );
};

/**
 * Http 412 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.preconditionFailed = function( res, data, type ){
	return res(data || STATUS_CODES[ 412 ] ).code( 412 ).type( type );
};

/**
 * Http 413 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.requestEntityTooLarge = function( res, data, type ){
	return res(data || STATUS_CODES[ 413 ] ).code( 413 ).type( type );
};

/**
 * Http 415 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.unsupportedMediaType = function( res, data, type ){
	return res(data || STATUS_CODES[ 415 ] ).code( 415 ).type( type );
};

/**
 * Http 417 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.expectationFailed = function( res, data, type ){
	return res(data || STATUS_CODES[ 417 ] ).code( 417 ).type( type );
};

/**
 * Http 429 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.tooManyRequests = function( res, data, type ){
	return res(data || STATUS_CODES[ 429 ] ).code( 429 ).type( type );
};

/**
 * Http 501 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.notImplemented = function( res, data, type ){
	return res(data || STATUS_CODES[ 501 ] ).code( 501 ).type( type );
};

/**
 * Http 503 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.serviceUnavailable = function( res, data, type ){
	return res(data || STATUS_CODES[ 503 ] ).code( 503 ).type( type );
};

/**
 * Http 504 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.gatewayTimeout = function( res, data, type ){
	return res(data || STATUS_CODES[ 504 ] ).code( 504 ).type( type );
};

/**
 * Http 505 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.httpVersionNotSupported = function( res, data, type ){
	return res(data || STATUS_CODES[ 505 ] ).code( 505 ).type( type );
}

/**
 * Http 507 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.insufficientStorage = function( res, data, type ){
	return res(data || STATUS_CODES[ 507 ] ).code( 507 ).type( type );
};
