/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * A field for dealing with related resources
 * @module tastypie/fields/related
 * @author Eric Satterwhite
 * @since 0.5.0
 * requires path
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
 */

var path     = require( 'path' )
  , Class    = require( '../class' )
  , ApiField = require( './api' )
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
		to:null
	}
	,is_related: true
	,constructor: function(to, options){
		this.parent('constructor', options);
		this.options.to = to;
		this.instance = new this.cls();
	}
});


Object.defineProperties(RelatedField.prototype,{
	cls:{
		enumerable:false
		,writeable: false
		,get: function(){
			var bits  // require path string ( /path/to/module.Class )
			  , mod   // the required module
			  , cls   // the related class object
			  , _to = this.options.to
			  ;
			if( typeof _to === 'string' ){
				bits = _to.split('/');
				var lastBit = bits[bits.length-1];
				var dotPosition = lastBit.indexOf('.');
				var hasCls =  dotPosition !== -1;

				if( hasCls ){
					var module_bits = lastBit.split('.');
					bits[ bits.length-1 ] = module_bits[0];
					cls = module_bits[1];

					_to = path.resolve( bits.join('/') );


				}
				mod = require( _to );
				cls = mod[ cls ];
				this.options.to = cls;
			}

			return this.options.to;
		}
	}
});

module.exports = RelatedField;