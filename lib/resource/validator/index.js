/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * Default set of joi validators for use with tastypie's validation hooks
 * @module tastypie/lib/resource/validator
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires tastypie/lib/resource/validator/querystring
 * @requires tastypie/lib/resource/validator/oid
 */
var querystring = require('./querystring')
  , oid         = require('./oid')
  ;

exports.oid = oid;
exports.query = querystring;
