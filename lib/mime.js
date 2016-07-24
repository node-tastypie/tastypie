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
  , types        = require('mime/types')
  ;

const EMPTY_STRING = '';

class Mime extends mime.Mime {

	constructor(){
		super();
		this.default_type = null;
		this.define( types );
	}

	lookup( format, fallback ){
		return super.lookup( format || EMPTY_STRING, fallback );
	}

	extension( ext ){
		return super.extension( ext || EMPTY_STRING );
	}
	/**
	 * best guess determination of request mime type from Accept header
	 * @param {Request} request
	 * @param {String[]} types
	 * @return {String}
	 **/
	static determine( req, types ){

		types = Array.isArray( types ) && types.length ? types : null;

		var accept = accepts( req )
		  , allowed = types || accept.types()
		  ;

		return intersection( accept.types(), allowed )[0];
	}

	/**
	 * Returns a full mime type given a short hand version
	 * @param {String} type a content type to look up
	 * @return String
	 * @example mime.from( 'json' ) // application/json
	 **/
	static from( type ){
		return  type ? mime.lookup( type ) : null;
	}

/**
 * Shortcut to mime.define. Provides a way to define custom mime types
 **/
	static define( map ){
		return mime.define.call( mime, map );
	}
}

module.exports = new Mime();
module.exports.Mime = Mime;
