'use strict';
/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
/**
 * provides helper methods to send appropriate responses to http requests
 * @module  module:tastypie/http
 * @author Eric Satterwhite 
 * @since 0.0.1
 */

var http = require( 'http' )
  , STATUS_CODES = http.STATUS_CODES
  ;

/**
 * Http 100 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.continue = function( res, data, type ){
	return res( data || STATUS_CODES[ status ] ).code( 100 ).type( type )
};

/**
 * Http 101 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.switching = function( res, data, type ){
	return res( data || STATUS_CODES[ status ] ).code( 101 ).type( type )
};


/**
 * Http 103 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.checkpoint = function( res, data, type ){
	return res( data || STATUS_CODES[ status ] ).code( 103 ).type( type )
};



/**
 * Base response Class
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.ok = function( res, data, type ){
	return res( data || STATUS_CODES[ status ] ).code( 200 ).type( type );
};

/**
 * Http 201 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.created = function( res, data, type, location ){
	return res( data || STATUS_CODES[ status ] ).code( status ).created( location )
};

/**
 * Http 202 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.accepted = function( res, data, type, location ){
	return res( data || STATUS_CODES[ status ] ).code( status ).type( type )
};


/**
 * Http 203 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.nonAutoritative = function( res, data, type ){
	return res( data || STATUS_CODES[ status ] ).code( 203 ).type( type )
};

/**
 * Http 204 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.noContent = function( res, data, type ){
	return res( data || STATUS_CODES[ status ] ).code( 204 ).type( type )
};


/**
 * Http 205 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.resetContent = function( res, data, type ){
	return res( data || STATUS_CODES[ status ] ).code( 205 ).type( type )
};

/**
 * Http 206 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.partialContent = function( res, data, type ){
	return res( data || STATUS_CODES[ status ] ).code( 206 ).type( type )
};


/**
 * Http 300 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.multipleChoices = function( res, data, type ){
	return res( data || STATUS_CODES[ status ] ).code( 300 ).type( type )
};

/**
 * Http 301 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.movedPermanently = function( res, data, type, location ){
	return res( 301 || STATUS_CODES[ status ] ).code( status ).type( type );
};

/**
 * Http 302 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.found = function( res, data, type, location ){
	return res( 302 || STATUS_CODES[ status ] ).code( status ).type( type );
};



/**
 * Http 303 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.seeOther = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 303 ).type( type ) 
};

/**
 * Http 306 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.switchProxy = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 306 ).type( type ) 
}

/**
 * Http 308 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.resumeIncomplete = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 308 ).type( type ) 
};

/**
 * Http 401 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.unauthorized = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 401 ).type( type ) 
};

/**
 * Http 403 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.forbidden = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 403 ).type( type ) 
};

/**
 * Http 405 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.methodNotAllowed = function( res, data, type ){
	return res(data || STATUS_CODES[ 405 ] ).code( 405 ).type( type ) 
};

/**
 * Http 407 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.proxyAuthenticationRequired = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 407 ).type( type ) 
};

/**
 * Http 409 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.conflict = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 409 ).type( type ) 
};

/**
 * Http 411 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.lengthRequired = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 411 ).type( type ) 
};

/**
 * Http 413 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.requestEntityTooLarge = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 413 ).type( type ) 
};

/**
 * Http 415 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.unsupportedMediaType = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 415 ).type( type ) 
};

/**
 * Http 417 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.expectationFailed = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 417 ).type( type ) 
};

/**
 * Http 501 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.notImplemented = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 501 ).type( type ) 
};

/**
 * Http 503 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.serviceUnavailable = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 503 ).type( type ) 
};

/**
 * Http 505 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.httpVersionNotSupported = function( res, data, type ){
	return res(data || STATUS_CODES[ status ] ).code( 505 ).type( type ) 
};
