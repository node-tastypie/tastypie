/*jshint laxcomma:true, smarttabs: true */
'use strict'
/**
 * General helpers
 * @module tastypie/lib/util
 * @author Eric Satterwhite
 **/
var noop = new Function();

/**
 * returns a node style callback if from a list of arguments
 * @param {...Object}  Arguments to generate a callback from
 * @return {Function}
 **/
exports.createCallback = function(){
	return typeof arguments[ arguments.length -1 ] == "function" ? arguments[ arguments.length-1 ] : noop
};
