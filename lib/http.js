'use strict';
/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
/**
 * provides helper methods to send appropriate responses to http requests
 * @module  module:tastypie/http
 * @author Eric Satterwhite 
 * @since 0.0.1
 */

/**
 * Http 100 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.continue = function( res, data, status ){
	status = status || 100;
	res.status( status ).send( data || "Continue")
};

/**
 * Http 101 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.switching = function( res, data, status ){
	status = status || 101;
	res.status( status ).send( data || "Switching Protocols")
};


/**
 * Http 103 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.checkpoint = function( res, data, status ){
	status = status || 103;
	res.status( status ).send( data || "Checkpoint")
};



/**
 * Base response Class
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.ok = function( res, data, status ){
	status = status || 200;
	res.status( status ).send( data || "OK");
};

/**
 * Http 201 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.created = function( res, data, status, location ){
	status = status || 201;
	location && res.set('Location', location );
	res.status( status ).send( data || "Created")
};

/**
 * Http 202 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.accepted = function( res, data, status, location ){
	status = status || 202;
	location && res.set('Location', location );
	res.status( status ).send( data || "Accepted")
};


/**
 * Http 203 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.nonAutoritative = function( res, data, status ){
	status = status || 203;
	res.status( status ).send( data || "Non Autoritative Information")
};

/**
 * Http 204 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.noContent = function( res, data, status ){
	status = status || 204;
	res.status( status ).send( data || "Non Autoritative Information")
};


/**
 * Http 205 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.resetContent = function( res, data, status ){
	status = status || 205;
	res.status( status ).send( data || 'Reset Content')
};

/**
 * Http 206 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.partialContent = function( res, data, status ){
	status = status || 206;
	res.status( status ).send( data || 'Partial content')
};


/**
 * Http 300 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.multipleChoices = function( res, data, status ){
	status = status || 300;
	res.status( status ).send( data || 'Multipl Choices')
};

/**
 * Http 301 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.movedPermanently = function( res, data, status, location ){
	status = status || 301;
	location && res.set('Location', location);
	res.status( status ).send( data || 'Moved Permanently');
};

/**
 * Http 302 status
 * @param {String} name Name of the exception
 * @param {String} message message to be displayed
 **/
exports.found = function( res, data, status, location ){
	status = status || 302;
	location && res.set('Location', location);
	res.status( status ).send( data || 'Found');
};



/**
 * Http 303 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.seeOther = function( res, data, status ){
	status = status || 303;
	res.status(status).send( data ||'See Other')
};

/**
 * Http 304 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.notModified = function( res, data, status ){
	status = status || 304;
	res.status(status).send( data ||'Not Modified'),
};

/**
 * Http 306 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.switchProxy = function( res, data, status ){
	status = status || 306;
	res.status(status).send( data ||'Switch Proxy'),
};

/**
 * Http 307 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.temporaryRedirect = function( res, data, status,location ){
	status = status || 307;
	location && res.set('Location', location)
	;res.status(status).send( data ||'Temporary Redirect'),
}

/**
 * Http 308 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.resumeIncomplete = function( res, data, status ){
	status = status || 308;
	res.status(status).send( data ||'Resume Incomplete'),
};

/**
 * Http 400 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.badRequest = function( res, data, status ){
	status = status || 400;
	res.status(status).send( data ||'Bad Request'),
};

/**
 * Http 401 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.unauthorized = function( res, data, status ){
	status = status || 401;
	res.status(status).send( data ||'Unauthorized'),
};

/**
 * Http 402 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.paymentRequired = function( res, data, status ){
	status = status || 402;
	res.status(status).send( data ||'Payment Required'),
};

/**
 * Http 403 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.forbidden = function( res, data, status ){
	status = status || 403;
	res.status(status).send( data ||'Forbidden'),
};

/**
 * Http 404 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.notFound = function( res, data, status ){
	status = status || 404;
	res.status(status).send( data ||'Not Found'),
};

/**
 * Http 405 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.methodNotAllowed = function( res, data, status ){
	status = status || 405;
	res.status(status).send( data ||'Method Not Allowed'),
};

/**
 * Http 406 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.notAcceptable = function( res, data, status ){
	status = status || 406;
	res.status(status).send( data ||'Not Acceptable'),
};

/**
 * Http 407 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.proxyAuthenticationRequired = function( res, data, status ){
	status = status || 407;
	res.status(status).send( data ||'Proxy Authentication Required'),
};

/**
 * Http 408 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.requestTimeout = function( res, data, status ){
	status = status || 408;
	res.status(status).send( data ||'Request Timeout'),
};

/**
 * Http 409 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.conflict = function( res, data, status ){
	status = status || 409;
	res.status(status).send( data ||'Conflict'),
};

/**
 * Http 410 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.gone = function( res, data, status ){
	status = status || 410;
	res.status(status).send( data ||'Gone'),
};

/**
 * Http 411 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.lengthRequired = function( res, data, status ){
	status = status || 411;
	res.status(status).send( data ||'Length Required'),
};

/**
 * Http 412 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.preconditionFailed = function( res, data, status ){
	status = status || 412;
	res.status(status).send( data ||'Precondition Failed'),
};

/**
 * Http 413 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.requestEntityTooLarge = function( res, data, status ){
	status = status || 413;
	res.status(status).send( data ||'Request Entity Too Large'),
};

/**
 * Http 414 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.requestURITooLong = function( res, data, status ){
	status = status || 414;
	res.status(status).send( data ||'Request URI Too Long'),
};

/**
 * Http 415 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.unsupportedMediaType = function( res, data, status ){
	status = status || 415;
	res.status(status).send( data ||'Unsupported Media Type'),
};

/**
 * Http 416 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.requestedRangeNotSatisfiable = function( res, data, status ){
	status = status || 416;
	res.status(status).send( data ||'Requested Range Not Satisfiable'),
};

/**
 * Http 417 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.expectationFailed = function( res, data, status ){
	status = status || 417;
	res.status(status).send( data ||'Expectation Failed'),
};

/**
 * Http 500 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.internalServerError = function( res, data, status ){
	status = status || 500;
	res.status(status).send( data ||'Internal Server Error'),
};

/**
 * Http 501 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.notImplemented = function( res, data, status ){
	status = status || 501;
	res.status(status).send( data ||'Not Implemented'),
};

/**
 * Http 502 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.badGateway = function( res, data, status ){
	status = status || 502;
	res.status(status).send( data ||'Bad Gateway'),
};

/**
 * Http 503 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.serviceUnavailable = function( res, data, status ){
	status = status || 503;
	res.status(status).send( data ||'Service Unavailable'),
};

/**
 * Http 504 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.gatewayTimeout = function( res, data, status ){
	status = status || 504;
	res.status(status).send( data ||'Gateway Timeout'),
};

/**
 * Http 505 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.httpVersionNotSupported = function( res, data, status ){
	status = status || 505;
	res.status(status).send( data ||'HTTP Version Not Supported'),
};

/**
 * Http 511 status
 * @param {Response} res express response object
 * @param {String} data String data to send in the response
 * @param {Number} status The http status code to set on the response
 **/
exports.networkAuthenticationRequired = function( res, data, status ){
	status = status || 511;
	res.status(status).send( data ||'Network Authentication Required')
};
