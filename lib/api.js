/*jshint laxcomma:true, smarttabs: true, node: true, unused: false, esnext: true */
'use strict';
/**
 * Serves as name space for a collection of resources. i.e., api/v1, api/v2, etc
 * @module tastypie/lib/api
 * @author Eric Satterwhite
 * @requires util
 * @requires boom
 * @requires debug
 * @requires mout/lang/isObject
 * @requires tastypie/lib/class
 * @requires tastypie/lib/class/options
 * @example
 var api = new Api('api/v1')

 api.add('test', new tatsypie.Resource() )
 // GET /api/v1/test?format=json
 **/
var  Class           = require( './class' ) // this is Class
   , util            = require('util')
   , Boom            = require('boom')
   , isObject        = require('mout/lang/isObject')
   , has             = require('mout/object/hasOwn')
   , debug           = require('debug')('tastypie:api')
   , Options         = require( './class/options' )
   , pkg         	 = require('../package.json')
   , mime            = require('./mime')
   , endsWithSlash   = /\/$/
   , trailingSlashes = /^\/|\/$/g
   , Api
   ;

function onPostAuth( request, reply ){
	let serializer = this.options.serializer;
	request.info.api_name = this.basepath;

	// if it is a format hapi deals with, it has already parsed it
	if(!this.baseexp.test( request.path ) || !request.payload || isObject( request.payload ) ){
		return reply.continue();
	}

	// if it is a string, lets try to deserialize it
	serializer.deserialize( request.payload, request.headers['content-type'], function( err, data ){
	  if( data ){
		request.payload = data;
		return reply.continue( );
	  }
	  reply( err );
	});
}

function onPreResponse( request, reply ){
	var response = request.response
	  , query    = request.query
	  , serializer = this.options.serializer
	  , format
	  , fmt
	  , ct
	  ;

	fmt  = request.query && request.query.format;
	ct   = this.options.serializer.convertFormat( fmt );

	if( fmt && !ct ){
		return reply( Boom.unsupportedMediaType(`unsupported serialization format ${fmt}`) );
	}

	format = (fmt && ct) ? ct : mime.determine( request, serializer.types );
	debug('requested format %s', format);
	if( has(query,'callback') && !( has(query, 'format') ) || response.isBoom ){
	  return reply.continue();
	}

	serializer.serialize( response.source, format, request.query, function( err, content ){

	  if( err ){
	  	return reply( err );
	  }
	  
	  reply( content )
		.code( response.statusCode )
		.type( format || serializer.options.defaultFormat );
	});

}

/**
 * Provides namespaces for collections of resource ( api/v1, api/v2, etc )
 * @constructor
 * @alias module:tastypie/lib/api
 * @param {Object} options api configuration options
 * @param {?module:tastypie/lib/serializer} [serilaizer=null] A serializer instance to handle serialization / deserializion during the lifecycle of the request - rather than at the resource level.
 * @example var api = new Api('api/v1');
x.use('fake', new Resource() )
 */
Api = new Class( /** @lends module:NAME.Api.prototype */{
	mixin: Options
	
	,options:{
		DEFAULT_LIMIT:20
		,MAX_LIMIT:500
		, serializer: null
	}

	,constructor: function( path,  options ){
		this.setOptions( options );
		this.basepath  = this.normalizePath( path );
		this.baseexp   = new RegExp( "^" + this.basepath );
		this.api_cache = {};
		this.url_cache = [];
		this.pending   = [];
		this.register  = this.plug.bind(this);
		
		this.register.attributes = {
			name:'tastypie'
			,version:pkg.version
			,multiple: true
		};

	}

	, plug: function( plugin, options, next ){
		var that = this;
		this.plg = plugin;
		for( let key in this.api_cache ){
			if( this.api_cache.hasOwnProperty( key ) ){
				debug('registering plugin %s', key );
				this._register(key, this.api_cache[ key ] );
			}
		}

		plugin.expose('name', pkg.name);
		plugin.expose('version', pkg.version);
		
		debug("serializer %s", !!this.options.serializer, this.basepath );

		// FIXME: I don't like this...
		if( this.options.serializer  ){
			debug("Loading serialization plugin for %s", this.basepath );
			debug('adding server serializer for %s', this.basepath);
			plugin.ext('onPostAuth',onPostAuth.bind( this ));
			plugin.ext('onPreResponse', onPreResponse.bind( this ));
		}

		plugin.route({
			path: this.basepath
			,method:'GET'
			,handler: function( request, reply ){
				var data = {}, current;
				for( let name in that.api_cache ){
					if( that.api_cache.hasOwnProperty( name ) ){
						current = that.api_cache[ name ];

						data[ name ] = {};
						for( let r of current.routes ){
							let plg = r.config.plugins.tastypie;
							if( !plg.name ){
								return;
							}
							data[name][plg.name] = r.path;
						}
					}
				}
				reply( data );
			}
		});
		return next();
	}

	, _register: function( name, resource ){
		this.plg.route( resource.routes );
	}
	/**
	 * Mounts a resource on a route prefix 
	 * @method module:tastypie/lib/api#use
	 * @param {String} [prefix] The route prefix in addition the the API prefix 
	 * @param {module:tastypie/lib/resource} resource A resource instance to mount at the prfix path
	 */ 
	 ,use: function(/*prefix, resource*/){
	 	var prefix, resource;
	 	if( arguments.length === 1){
	 		resource = arguments[0];
	 		prefix   = arguments[0].options.name || '';
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
	 	this.api_cache[ prefix ] = resource;
	 	resource.setOptions({
	 		apiname:this.basepath
	 		,name: resource.options.name || prefix
	 	});

	 	if( this.plg ){
			this._register( prefix, resource );
	 		
	 	} 
		this.url_cache = [];
	 	return this;

	 }

	/**
	 * Normalizes a uri path by stripping trailing or adding leading slashed acordingly
	 * @protected
	 * @method module:tastypie/lib/api#normalizePath
	 * @param {String} path The path to normalize
	 * @returns {String} The newly formated path
	 */ 
	 ,normalizePath: function( path ){
		return util.format( 
			'/%s'
			, path.replace(trailingSlashes,'')
		);
	 }

});

// defines a quick url look up per API object
// it is cached on first call until another
// resource is registered

/**
 * @readonly
 * @name urls
 * @instance
 * @memberof module:tastypie/lib/api
 * @property {Object} urls An object containing all know methods registed to the api instance
 **/
Object.defineProperties(Api.prototype,{
	urls:{
		get: function(){
			var routes;
			if( !this.url_cache.length ){
				routes = this.plg && this.plg.table()[0].table || [];
				var baseexp = this.baseexp;
				
				this.url_cache = routes
					.map(function( r ){
						return r.path;
					})
					.filter(function( r ){
						return baseexp.test( r );
					});
			}
			return this.url_cache;
		}
	}
});

module.exports = Api;
