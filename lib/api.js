/*jshint laxcomma:true, smarttabs: true */
'use strict';
/**
 * DESCRIPTION
 * @module NAME
 * @author Eric Satterwhite
 * @requires Class
 * @requires module:class/meeta
 * @requires mout
 **/
var  Class           = require( './class' ) // this is Class
   , array           = require( 'mout/array' ) // custom mout
   , clone           = require( 'mout/lang/clone' ) // custom mout
   , toArray         = require( 'mout/lang/toArray' ) // custom mout
   , Options         = require( './class/options' )
   , debug           = require('debug')('tastypie:api')
   , util            = require('util')
   , path            = require('path')
   , makePath        = require( 'mout/string/makePath' )
   , pkg         	 = require('../package.json')
   , startsWithSlash = /^\//
   , endsWithSlash   = /\/$/
   , trailingSlashes = /^\/|\/$/g
   , Api
   ;
/**
 * Class which maps a url prefix to an API resource
 * @class module:NAME.Api
 * @param {TYPE} NAME DESCRIPTION
 * @example var x = new NAME.Api({});
 */
Api = Class( /** @lends module:NAME.Api.prototype */{
	mixin: Options
	,options:{
		DEFAULT_LIMIT:20
		,MAX_LIMIT:500
	}
	,constructor: function( path,  options ){
		// this.setOptions( app.settings.api )
		this.basepath = this.normalizePath( path );
		this.baseexp = new RegExp( "^" + this.basepath );
		this.setOptions( options );
		this.api_cache = {};
		this.url_cache = [];
		
		this.register = function( plugin, options, next ){
			this.plg = plugin;
			var resource;
			debug('registering plugin', this.api_cache );
			for( var key in this.api_cache ){
				this._register( this.api_cache[ key ] );
			}

			plugin.expose('name', pkg.name);
			plugin.expose('version', pkg.version);
			this.registered = true
			return next();
		}.bind( this );

		this.register.attributes = {
			name:util.format('%s-%s', pkg.name, path )
			,version:pkg.version
		};

	}
	, _register: function( name, resource ){
		this.plg.route( resource.routes );
	}
	/**
	 * This does someApi
	 * @param {TYPE} name DESCRPTION
	 * @param {TYPE} name DESCRIPTION
	 * @returns {TYPE} DESCRIPTION
	 */ 
	 ,add: function(/*prefix, resource*/){
	 	var prefix, router, resource
	 	if( arguments.length == 1){
	 		resource = arguments[0]
	 		prefix   = arguments[0].options.name || ''
		 	prefix   = prefix.replace(endsWithSlash,'');
	 	} else {
	 		resource = arguments[1];
	 		prefix   = arguments[0];
		 	prefix   = prefix.replace(endsWithSlash,'');
		 	resource.setOptions({
		 		name:prefix
		 		,apiname: this.basepath 
		 	} );
	 	}
	 	this.api_cache[ prefix ] = resource
	 	resource.setOptions({
	 		apiname:this.basepath
	 		,name: resource.options.name || prefix
	 	})
		this._register( prefix, resource );
		this.url_cache = [];
	 	return this;

	 }

	/**
	 * Normalizes a uri path by stripping trailing or adding leading slashed acordingly
	 * @param {String} path The path to normalize
	 * @param {TYPE} name DESCRIPTION
	 * @returns {String} The newly formated path
	 */ 
	 ,normalizePath: function( path ){
		return util.format( 
			'/%s'
			, path.replace(trailingSlashes,'')
		)
	 }
});

// defines a quick url look up per API object
// it is cached on first call until another
// resource is registered
Object.defineProperties(Api.prototype,{
	urls:{
		get: function(){
			var routes 
			if( !this.url_cache.length ){
				routes = this.plg && this.plg.table()[0].table || [];
				var baseexp = this.baseexp;
				
				this.url_cache = routes
					.map(function( r ){
						return r.path
					})
					.filter(function( r ){
						return baseexp.test( r )
					});
			}
			return this.url_cache;
		}
	}
})

module.exports = Api;
