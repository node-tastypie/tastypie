/*jshint laxcomma: true, smarttabs: true, node: true*/
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
  ;

exports.query = querystring;
