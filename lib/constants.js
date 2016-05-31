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
  * @property {Symbol} ALL signifies that all fields of a resource will qualify for a specific operation where the field is of a primitive type
  * @property {Symbol} ALL_WITH_RELATIONS signifies that all fields of a resource will qualify for a specific operation. If the field is a related field the operation
  * will propogate to the related resource
  **/
exports.ALL                = Symbol('ALL');
exports.ALL_WITH_RELATIONS = Symbol('ALL_WITH_RELATIONS');

Object.freeze( exports );
