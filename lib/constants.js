/*jshint laxcomma: true, smarttabs: true, node: true */
'use strict';
/**
 * Constant values for tastypie
 * @module tastypie/lib/constants
 * @author Eric satterwhite
 * @since 0.1.0
 */

 /**
  * @readonly
  * @name ALL
  * @property {Number} all values for all acceptable filters
  **/
exports.ALL                = Symbol('ALL');
exports.ALL_WITH_RELATIONS = Symbol('ALL_WITH_RELATIONS');

Object.freeze( exports );
