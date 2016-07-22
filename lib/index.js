/*jshint laxcomma: true, smarttabs: true, node:true, mocha: true, esnext: true, unused: true*/
'use strict';
/**
 * code collection module
 * @module tastypie/lib
 * @author Eric satterwhite 
 * @since 0.0.1
 * @requires url-join
 * @requires tastypie/lib/serializer
 * @requires tastypie/lib/resource
 * @requires tastypie/lib/api
 * @requires tastypie/lib/http
 * @requires tastypie/lib/paginator
 * @requires tastypie/lib/cache
 * @requires tastypie/lib/exceptions
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 * @requires tastypie/lib/constants
 * @requires tastypie/lib/fields
 * @requires tastypie/lib/resrouce/validator
 */

/**
 * @readonly
 * @static
 * @memberof tastypie
 * @property {Function} urljoin helper function for joining url segments - similar to path.join
 **/
exports.urljoin            = require( 'url-join' );
exports.Serializer         = require('./serializer');
exports.Resource           = require('./resource');
exports.Api                = require('./api');
exports.Paginator          = require('./paginator');
exports.Cache              = require('./cache');
exports.exceptions         = require('./exceptions');
exports.Class              = require('./class');
exports.Class.Options      = require('./class/options');
exports.http               = require('./http');
exports.constants          = require('./constants');
exports.fields             = require('./fields' );
exports.validators         = require( './resource/validator' );

exports.ALL                = exports.constants.ALL
exports.ALL_WITH_RELATIONS = exports.constants.ALL_WITH_RELATIONS
