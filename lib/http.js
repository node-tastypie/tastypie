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
exports.continue = function( res, data, status ){
	status = status || 100;
	res( data || STATUS_CODES[ status ] ).code( status )
};

/**
 * Http 101 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.switching = function( res, data, status ){
	status = status || 101;
	res( data || STATUS_CODES[ status ] ).code( status )
};


/**
 * Http 103 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.checkpoint = function( res, data, status ){
	status = status || 103;
	res( data || STATUS_CODES[ status ] ).code( status )
};



/**
 * Base response Class
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.ok = function( res, data, status ){
	status = status || 200;
	res( data || STATUS_CODES[ status ] ).code( status );
};

/**
 * Http 201 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.created = function( res, data, status, location ){
	status = status || 201;
	location && res.set('Location', location );
	res( data || STATUS_CODES[ status ] ).code( status )
};

/**
 * Http 202 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.accepted = function( res, data, status, location ){
	status = status || 202;
	location && res.set('Location', location );
	res( data || STATUS_CODES[ status ] ).code( status )
};


/**
 * Http 203 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.nonAutoritative = function( res, data, status ){
	status = status || 203;
	res( data || STATUS_CODES[ status ] ).code( status )
};

/**
 * Http 204 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.noContent = function( res, data, status ){
	status = status || 204;
	res( data || STATUS_CODES[ status ] ).code( status )
};


/**
 * Http 205 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.resetContent = function( res, data, status ){
	status = status || 205;
	res( data || STATUS_CODES[ status ] ).code( status )
};

/**
 * Http 206 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.partialContent = function( res, data, status ){
	status = status || 206;
	res( data || STATUS_CODES[ status ] ).code( status )
};


/**
 * Http 300 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.multipleChoices = function( res, data, status ){
	status = status || 300;
	res( data || STATUS_CODES[ status ] ).code( status )
};

/**
 * Http 301 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.movedPermanently = function( res, data, status, location ){
	status = status || 301;
	location && res.set('Location', location);
	res( data || STATUS_CODES[ status ] ).code( status );
};

/**
 * Http 302 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.found = function( res, data, status, location ){
	status = status || 302;
	location && res.set('Location', location);
	res( data || STATUS_CODES[ status ] ).code( status );
};



/**
 * Http 303 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.seeOther = function( res, data, status ){
	status = status || 303;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 306 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.switchProxy = function( res, data, status ){
	status = status || 306;
	res(data || STATUS_CODES[ status ] ).code( status ) 
}

/**
 * Http 308 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.resumeIncomplete = function( res, data, status ){
	status = status || 308;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 401 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.unauthorized = function( res, data, status ){
	status = status || 401;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 403 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.forbidden = function( res, data, status ){
	status = status || 403;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 405 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.methodNotAllowed = function( res, data, status ){
	status = status || 405;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 407 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.proxyAuthenticationRequired = function( res, data, status ){
	status = status || 407;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 409 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.conflict = function( res, data, status ){
	status = status || 409;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 411 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.lengthRequired = function( res, data, status ){
	status = status || 411;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 413 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.requestEntityTooLarge = function( res, data, status ){
	status = status || 413;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 415 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.unsupportedMediaType = function( res, data, status ){
	status = status || 415;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 417 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.expectationFailed = function( res, data, status ){
	status = status || 417;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 501 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.notImplemented = function( res, data, status ){
	status = status || 501;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 503 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.serviceUnavailable = function( res, data, status ){
	status = status || 503;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};

/**
 * Http 505 status
 * @param {Response} reply Hapijs reply object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.httpVersionNotSupported = function( res, data, status ){
	status = status || 505;
	res(data || STATUS_CODES[ status ] ).code( status ) 
};
