/*jshint laxcomma: true, smarttabs: true*/
'use strict';
/**
 * Validates a mongo style oid string
 * @module tastypie/lib/resource/validator/oid
 * @author Eric Satterwhite
 * @since 0.0.1
 * @requires joi
 **/
var joi = require('joi');

module.exports = joi.string().alphanum().length( 24 );
