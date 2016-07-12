/*jshint laxcomma: true, smarttabs: true, node: true, unused: true*/
'use strict';
/**
 * A field for dealing with related resources
 * @module tastypie/fields/related
 * @author Eric Satterwhite
 * @since 0.5.0
 * @requires async
 * @requires debug
 * @requires tastypie/lib/class
 * @requires tastypie/lib/utility
 * @requires tastypie/lib/fields/api
 */

var debug    = require('debug')('tastypie:field:related')
  , async    = require('async')
  , ApiField = require( './api' )
  , Class    = require( '../class' )
  , toModule = require('../utility').toModule
  , RelatedField
  ;

/**
 * @constructor
 * @alias module:tastypie/fields/related
 * @extends module:tastypie/fields/api
 * @param {Object} options
 * @param {String} [options.root=os.tempDir()]
 * @param {String} [options.dir]
 */
RelatedField = new Class({
	inherits:ApiField
	,options:{
		to:null,
		minimal: false,
		full: false
	}
	,is_related: true
	,constructor: function(to, options){
		if( arguments.length === 1){
			options = to;
			to = options.to;
		}

		this.parent('constructor', options);
		this.options.to = to;
		this.instance = new this.cls();
	}
	,dehydrate: function( obj,cb ){
		var that = this;
		if( !this.instance.options.apiname ){
			debug('setting field %s related apiname - %s', this.options.name, this.resource.options.apiname );
			this.instance.setOptions({
				apiname: this.resource.options.apiname
			});
		}

		this.parent('dehydrate', obj, function( err, value ){
			if( err ){
				return cb && cb( err, null );
			}

			if( that.options.full ){
				return cb( err, value );
			} else if( that.options.minimal ){
				async.map(
					value,
					that.to_minimal.bind( that ),
					cb
				);
			} else{
				return cb( err, value && value.map(that.instance.to_uri.bind( that.instance ) ) );
			}
		});
	}
	/**
	 * converts a full object in to a minimal representation
	 * @method module:tastypie/lib/field/related#to_minimal
	 * @param {Object} obj A template object instance to introspect
	 * @param {Function} callback a callback function to execute when the related field dehydration is completed
	 **/
	,to_minimal: function( obj, cb ){
		var label = this.instance.options.labelField || 'display'
		  , that  = this
		  , related_field
		  ;
		related_field = this.instance.fields[label];
		related_field.dehydrate( obj, function( err, value ){
			var out = {};
			out.uri =  that.instance.to_uri( obj );
			out[  label ] = value;
			that = label = related_field = null;
			cb( null, out );
		});
	}
});


Object.defineProperties(RelatedField.prototype,{
	cls:{
		enumerable:false
		,writeable: false
		,get: function(){
            if( typeof this.options.to === 'string' ){
                this.options.to = toModule( this.options.to );
            }
            return this.options.to;
		}
	}
});

module.exports = RelatedField;
