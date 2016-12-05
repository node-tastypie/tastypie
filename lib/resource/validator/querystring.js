/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * Default querystring parameter validator for API Endpoints
 * @module tastypie/lib/resource/validator/querystring
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires joi
 */

var joi = require( 'joi' );

module.exports = joi.object().keys({
    /**
     * @readonly
     * @memberof module:tastypie/lib/resource/validator/querystring
     * @property {Number} limit Limits the number for results per page of data. Default is `25`
     **/
    limit:joi.number().min(0).default(25).description("the number of records to return"),
    /**
     * @readonly
     * @memberof module:tastypie/lib/resource/validator/querystring
     * @property {Number} offset starting page number for listing endpoints Default is `0`
     **/
    offset:joi.number().min(0).default(0).description("the starting page number"),
    /**
     * @readonly
     * @memberof module:tastypie/lib/resource/validator/querystring
     * @property {String}  format ad hoc serialization formats. Allows `json`, `xml`, `jsonp`
     **/
    format:joi.string().alphanum().allow('json','xml','jsonp'),
    /**
     * @readonly
     * @memberof module:tastypie/lib/resource/validator/querystring
     * @property {String}  callback Used for jsonp callback methods
    **/
    callback:joi.string().alphanum().description('query parameter used to force a jsonp response'),

    /**
     * @readonly
     * @memberof module:tastypie/lib/resource/validator/querystring
     * @property {String}  order used to sort collections of resources
     **/
    orderby: joi.alternatives().try(
        joi.string().optional().description('name of a field to sort the results by')
        ,joi.array(  ).items( joi.string() ).optional().description('name of a field to sort the results by')
    )
}).unknown();
