/*jshint laxcomma: true, smarttabs: true, node: true */
'use strict';
/**
 * Built-in validator classes for tastypie resources
 * @module tastypie/lib/validators
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/parent
 * @requires tastypie/lib/class/options
 * @requires tastypie/lib/exceptions
 */

var Class = require( './class' )
  , Options = require('./class/options')
  , Parent = require('./class/parent')
  , exceptions = require('./exceptions')
  , Validator
  ;

/**
 * A no-op validator that will always return true
 * @class module:tastypie/lib/validators.Validator
 * @param {Object} options
 * @param {Object} [options.validator=null] A object to use as the validators object.
 */

exports.Validator =
Validator = new Class({
	mixin:[ Options, Parent ]
	, options:{
		validator: null
	}

	, constructor: function( options ){
		this.setOptions( options );
	}

	, validate: function( data, cb ){
		process.nextTick(function(){
			return cb && cb( null, true );
		});
	}

});

/**
 * Description
 * @class module:tastypie/lib/validators.FormValidator
 * @extends module:tastypie/lib/validators.Validator
 */
exports.FormValidator = new Class({
	inherits: Validator
  , mixin:[Parent, Options ]
  , constructor: function( options ){
  		this.parent('constructor', options );
  		if( !this.options.validator ){
  			throw new exceptions.ImproperlyConfigured({
  				message:'the `validator` options is required'
  			});
  		}
  }
  , validate: function( data, cb ){
		process.nextTick(function(data ){
			var form = this.options.validator.bind( data );

			form.validate(function( err, bound ){
				var valid, errors, fld;
				if( err ){
					return cb && cb(err,null);
				}

				valid = bound.isValid();
				if( !valid ){
					errors = {};
					for(var key in bound.fields){
						fld = bound.fields[ key ];
						errors[ key ] = fld.error || undefined;
					}
				}
				return cb && cb( errors, valid );
			});
		});
	}
});

/**
 * Validation class for use with a Joi schema
 * @class module:tastypie/lib/validators.JoiValidator
 * @extends module:tastypie/lib/validators.Validator
 * @param {Object} options
 * @param {Object} options.validator A valid joi schema to use as validation
 */
exports.JoiValidator = new Class({
	inherits: Validator
	, constructor: function( options ){
			this.parent('constructor', options );
			if( !this.options.validator || !this.options.validator.isJoi ){
				throw new exceptions.ImproperlyConfigured({
					message:'the `validator` optsion must be a joi object '
				});
			}
	}
	,  validate: function validate( data, cb ){
		process.nextTick(function(){
			var result = this.options.validator.validate( data );
			return cb && cb( result.error, result.value );
		});
	}
});
