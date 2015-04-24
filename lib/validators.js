/*jshint laxcomma: true, smarttabs: true*/
/*globals module,process,require,exports,__dirname,__filename */
'use strict';
/**
 * Built-in validator classes for tastypie resources
 * @module tastypie/lib/validators
 * @author Eric Satterwhite
 * @since 0.1.0
 * @requires prime-util/prime/parentize
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 * @requires tastypie/lib/exceptions
 */

var Class = require( './class' )
  , Options = require('./class/options')
  , Parent = require("prime-util/prime/parentize")
  , exceptions = require('./exceptions')
  , FormValidator
  , JoiValidator
  , Validator
  ;

/**
 * Description
 * @class module:validators.js.Thing
 * @param {TYPE} param
 * @example var x = new validators.js.THING();
 */

exports.Validator = 
Validator = new Class({
	mixin:[ Options, Parent ]
	, options:{
		validator: null
	}

	, constructor: function Validator( options ){
		this.setOptions( options )
	}

	, validate: function( data, cb ){
		process.nextTick(function(){
			return cb && cb( null, true );
		});
	}
  
});

/**
 * Description
 * @class module:validators.js.Thing
 * @param {TYPE} param
 * @example var x = new validators.js.THING();
 */

exports.FormValidator =
FormValidator = new Class({
	inherits: Validator
  , mixin:[Parent, Options ]
  , constructor: function FormValidator( options ){
  		this.parent('constructor', options )
  		if( !this.options.validator ){
  			throw new exceptions.ImproperlyConfigured({
  				message:'the `validator` options is required'
  			})
  		}
  }
  , validate: function( data, cb ){
		process.nextTick(function(data, cb ){
			var form = this.options.validator.bind( data );

			form.validate(function( err, bound ){
				var valid, errors, fld
				if( err ){
					return cb&& cb(err,null);
				}

				valid = bound.isValid()
				if( !valid ){
					errors = {}
					for(var key in bound.fields){
						fld = bound.fields[ key ]
						errors[ key ] = fld.error || undefined
					}
				}
				cb && cb( errors, valid );
			});
		})
	}
});

/**
 * Description
 * @class module:validators.js.Thing
 * @param {TYPE} param
 * @example var x = new validators.js.THING();
 */

exports.JoiValidator =
JoiValidator = new Class({
	inherits: Validator
	, constructor: function FormValidator( options ){
			this.parent('constructor', options )
			if( !this.options.validator || !this.options.validator.isJoi ){
				throw new exceptions.JoiValidator({
					message:'the `validator` optsion must be a joi object '
				})
			}
	}	
	,  validate: function JoiValidator( data, cb ){
		process.nextTick(function(){
			var result = this.options.validator.validate( data );
			return cb && cb( result.error, result.value )
		})	
	}
});
