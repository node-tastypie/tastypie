/*jshint laxcomma:true, smarttabs: true, node: true */
'use strict';
/**
 * General helpers
 * @module tastypie/lib/util
 * @author Eric Satterwhite
 **/
var path = require( 'path' )
  , get  = require('mout/object/get')
  , startsWith = require('mout/string/startsWith')
  , toArray = require('mout/lang/toArray')
  , moduleExp = /(^[\.\/]+)?(([\w\\\/\-\_]+)?([\w]+))/g
  , noop = function(){}
  ;

/**
 * returns a node style callback if from a list of arguments
 * @param {...Object}  Arguments to generate a callback from
 * @return {Function}
 **/
exports.createCallback = function(){
	return typeof arguments[ arguments.length -1 ] === "function" ? arguments[ arguments.length-1 ] : noop;
};


/**
 * @param {String} string to a module or module member to resolve
 * @param {Boolean} [resolve] True to force path resoluation. by default, if the string starts with a dot, the path will be resolved
 * @example toModule('express/router.Router') // returns Router class from express router module
 * @example toModule('./packages/hive-stdlib/string.startWith') // returns startsWith function from string module with auth path resolution
 * @example toModule('test/module', true) // attempts to require module called test/module relative to the process's CWD
 */
exports.toModule = function( str, resolve ){
	var matches,mod;

	matches = str.match( moduleExp );

	mod = matches.shift();
	resolve = resolve == null ?  startsWith( mod, '.' ) ? true : false : !!resolve;
	mod = require( resolve ? path.resolve( mod ) : mod );
	return matches.length ? get( mod, matches.join('.') ) : mod;

}; 


exports.attempt = function( fn, args, scope ){
	try{
		return [ null, fn.apply( scope, toArray( args ) ) ];
	} catch( err ){
		return [ err, null ];
	}
};


exports.annotate = function annotate( err, bundle ){
	err.res = bundle.res;
	err.req = bundle.req;
	return err;
}
