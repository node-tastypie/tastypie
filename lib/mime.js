/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Small lib for dealing with negotiation of mime types.
 * @module tastypie/lib/mime
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires accepts
 * @requires mime
 * @requires mout/array/intersection
 */

var accepts      = require( 'accepts' )
  , mime         = require( 'mime' )
  , intersection = require( 'mout/array/intersection' )
  ;



/**
 * best guess determination of request mime type from Accept header
 * @param {Request} request
 * @param {String[]} types
 * @return
 **/
exports.determine = function( req, types ){

	types = Array.isArray( types ) && types.length ? types : null;

	var accept = accepts( req )
	  , allowed = types || accept.types()
	  ;

	return intersection( accept.types(), allowed )[0];
};

/**
 * Returns a full mime type given a short hand version
 * @param {String} type a content type to look up
 * @return String
 * @example mime.from( 'json' ) // application/json
 **/
exports.from = function( type ){
	return  type ? mime.lookup( type ) : null;
};

Object.defineProperty(exports,'types',{
	get:function(){
		return mime.types;
	}
});

/**
 * Shortcut to mime.define. Provides a way to define custom mime types
 **/
exports.define = mime.define.bind( mime );
