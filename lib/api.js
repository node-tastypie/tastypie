/*jshint laxcomma:true, smarttabs: true */
'use strict';
/**
 * DESCRIPTION
 * @module tastypie/lib/api
 * @author Eric Satterwhite
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 * @requires mout
 **/
var  Class           = require( './class' ) // this is Class
   , util            = require('util')
   , path            = require('path')
   , Boom            = require('hapi/node_modules/boom')
   , array           = require( 'mout/array' ) // custom mout
   , clone           = require( 'mout/lang/clone' ) // custom mout
   , toArray         = require( 'mout/lang/toArray' ) // custom mout
   , isObject        = require('mout/lang/isObject')
   , makePath        = require( 'mout/string/makePath' )
   , debug           = require('debug')('tastypie:api')
   , Options         = require( './class/options' )
   , pkg         	 = require('../package.json')
   , mime            = require('./mime')
   , startsWithSlash = /^\//
   , endsWithSlash   = /\/$/
   , trailingSlashes = /^\/|\/$/g
   , Api
   ;

function determineFormat( request, reply, types ){
 var fmt = request.query && request.query.format
   , ct  = Serializer.convertFormat( fmt )
   ;

 if( fmt && !ct ){
	return reply(request.hapi.boom.badRequest('Unsupported serialization format: ' + fmt ));
 } else if( fmt && ct ){
	return ct;
 }
 // default type lookups
 return mime.determine( request, types );
}

/**
 * Provides namespaces for collections of resource ( api/v1, api/v2, etc )
 * @constructor
 * @alias module:tastypie/lib/api
 * @param {Object} options api configuration options
 * @example var x = new Api({});
 */
Api = Class( /** @lends module:NAME.Api.prototype */{
	mixin: Options
	
	,options:{
		DEFAULT_LIMIT:20
		,MAX_LIMIT:500
		, serializer: null
	}

	,constructor: function( path,  options ){
		// this.setOptions( app.settings.api )
		this.basepath = this.normalizePath( path );
		this.baseexp = new RegExp( "^" + this.basepath );
		this.setOptions( options );
		this.api_cache = {};
		this.url_cache = [];
		this.pending = []

		this.register = function( plugin, options, next ){
			this.plg = plugin;
			var resource;
			var that = this;

			for( var key in this.api_cache ){
				debug('registering plugin %s', key );
				this._register(key, this.api_cache[ key ] );
			}

			plugin.expose('name', pkg.name);
			plugin.expose('version', pkg.version);
			
			this.registered = true
			//////
			debug("serializer? %s", !!this.options.serializer)
			if( this.options.serializer ){
				debug("Loading serialization plugin")
				debug('adding server serializer for %s', this.basepath)
				plugin.ext('onPostAuth', function( request, reply ){

					var Serializer = this.options.serializer;
					// if it is a format hapi deals with, it has already parsed it
					// 
					if( !request.payload || isObject( request.payload ) ){
						return reply.continue();
					}

					// if it is a string, lets try to deserialize it
					Serializer.deserialize( request.payload, request.headers['content-type'], function( err, data ){
					  if( data ){
						request.payload = data;
					  }
					  reply( err );
					});
				}.bind( this ));

				plugin.ext('onPreResponse', function(request, reply){
					
					debug('makign data %s', format)
					var response = request.response
					  , query    = request.query
					  , Serializer = this.options.serializer
					  , format
					  ;

					var fmt  = request.query && request.query.format
					var ct = this.options.serializer.convertFormat( fmt )

					if(fmt && !ct ){
						reply(new Boom.UnsupportedFormat( 'Unsupported format: ' + fmt ) )
					} else if( fmt && ct ){
						format = ct;
					} else{
						format = mime.determine( request, Serializer.types )
					}



					if( query.hasOwnProperty('callback') && !( query.hasOwnProperty('format') ) ){
					  return reply.continue();
					}

					if(!format){
					  return reply.continue();
					}

					if( response.isBoom ){
					  return reply.continue();
					}
					Serializer.serialize( response.source, format, request.query, function(err, content ){

					  reply(content)
						.type(format);
					});
				}.bind( this ));
			}

			/////
			plugin.route({
				path: this.basepath
				,method:'GET'
				,handler: function( request, reply ){
					var data = {}, current;
					for( var name in that.api_cache ){
						current = that.api_cache[ name ]

						data[ name ] = {}
						current.routes.forEach( function( r ){
							debugger;
							var plg = r.config.plugins.tastypie
							if( !plg.name ){
								return;
							}
							data[name][plg.name] = r.path
						})
					}
					reply( data )
				}
			})
			return next();
		}.bind( this )


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

	 	if( this.plg ){
			this._register( prefix, resource );
	 		
	 	} 
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
