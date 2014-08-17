/*jshint laxcomma:true, smarttabs: true */
'use strict'
/**
 * DESCRIPTION
 * @module module:lib/util
 * @author Eric Satterwhite
 **/
var noop = new Function();

exports.createCallback = function(){
	return typeof arguments[ arguments.length -1 ] == "function" ? arguments[ arguments.length-1 ] : noop
};