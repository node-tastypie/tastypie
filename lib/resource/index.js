/*jshint laxcomma: true, smarttabs: true, node:true */
'use strict';
/**
 * Provides the base resource for defining expressive APIs, handling serialization, deserialization, validation,
 * caching, throttling and error handling
 * @module module:tastypie/lib/resource
 * @author Eric Satterwhite
 * @requires module:class
 * @requires module:class/options
 * @since 0.1.0
 * @requires domain
 * @requires events
 * @requires util
 * @requires fs
 * @requires express
 * @requires debug
 * @requires urljoin
 * @requires module:mout/object/merge
 * @requires module:mout/lang/clone
 * @requires module:mout/string/interpolate
 * @requires module:prime-util/prime/Parentize
 * @requires module:tastypie/lib/class
 * @requires module:tastypie/lib/http
 * @requires module:tastypie/lib/mime
 * @requires module:tastypie/lib/paginator
 * @requires module:tastypie/lib/class/options
 * @requires module:tastypie/lib/exceptions
 * @requires module:tastypie/lib/serializer
 **/
var domain           = require( 'domain' )                     // domain
  , events           = require( 'events' )                     // events
  , util             = require( 'util' )                       // util
  , async            = require( 'async' )
  , urljoin          = require( 'urljoin' )
  , joi              = require( 'joi' )
  , Boom             = require( 'boom' )
  , object           = require( 'mout/object' )
  , qs               = require( 'querystring' )                  // qs
  , merge            = require( 'mout/object/merge' )            // merge
  , clone            = require( 'mout/lang/clone' )              // clone
  , isFunction       = require( 'mout/lang/isFunction' )
  , interpolate      = require( 'mout/string/interpolate' )      // interpolate
  , set              = require( 'mout/object/set' )
  , get              = require( 'mout/object/get' )
  , Parentize        = require( 'prime-util/prime/parentize' )
  , debug            = require( 'debug' )( 'tastypie:resource' ) // debug
  , Class            = require( '../class' )                     // Class
  , http             = require( '../http' )                      // http
  , mime             = require( '../mime' )                      // mime
  , paginator        = require( '../paginator' )                 // paginator
  , Options          = require( '../class/options' )             // Options
  , exceptions       = require( '../exceptions' )                // exceptions
  , Serializer       = require( '../serializer' )                // serializer
  , cache            = require( '../cache' )
  , Throttle         = require( '../throttle')
  , fields           = require( '../fields' )
  , EMPTY_OBJECT     = {}
  , mutableMethods   = ['put','post','delete', 'patch']
  , optionsSchema
  , filterschema
  , Resource
  , checks
  ;


filterschema = joi.alternatives().try(
	joi.number()
	, joi.array().items( joi.string().valid('gt','gte','in','lt','lte','ne','nin','regex','all','size','match','contains','icontains','startswith','istartswith','endswith','iendswith') )
);


optionsSchema = joi.object().keys({
	name          : joi.string().allow(null)
  , apiname       : joi.string().allow(null)
  , includeUri    : joi.boolean()
  , pk            : joi.string()
  , limit         : joi.number()
  , returnData    : joi.boolean()
  , defaultFormat : joi.string()
  , collection    : joi.string()
  , objectTpl     : joi.func()
  , filtering     : joi.object().pattern(/.+/, filterschema ).allow( null )
  , ordering      : joi.array( joi.string() ).allow( null )
  , allowed       : joi.object()
  						.pattern(
  							/.+/
  							, joi.object({
  								'get'     :joi.boolean()
  							  , 'put'     :joi.boolean()
  							  , 'post'    :joi.boolean()
  							  , 'delete'  :joi.boolean()
  							  , 'options' :joi.boolean()
  							  , 'head'    :joi.boolean()
  							  , 'patch'   :joi.boolean()
  							  , 'connect' :joi.boolean()
  							}).optionalKeys('get', 'put','post', 'delete', 'options','head', 'patch', 'connect' ) )
}).unknown();

function to_json(){
	return ( this.data || EMPTY_OBJECT );
}

checks = {
	dispatch: function( bundle ){
		var httpmethod = ( bundle.req.headers['x-method-override'] || bundle.req.method ).toLowerCase();
		var actions    = this.options.allowed[ bundle.action ] || EMPTY_OBJECT;

		if( !actions[ httpmethod ] ){
			throw new Boom.methodNotAllowed(util.format( "method not allowed - %s", httpmethod ));
		}

		return util.format( '%s_%s', httpmethod, bundle.action );
	},
	
	access: function( bundle ){ 
		var httpmethod = ( bundle.req.headers['x-method-override'] || bundle.req.method ).toLowerCase();
		var action = bundle.action;
		var method_name = util.format('%s_%s', httpmethod, action );

		if( !this[ method_name ] ){
			throw new Boom.notImplemented( util.format( "%s is not implemented: %s ", httpmethod, bundle.req.path) );
		}

		return this[ method_name ];
	}
};

/**
 * An easy way to pass around request, and reply objects
 * @alias Bundle
 * @typedef {Object} module:tastypie/lib/resource~Bundle
 * @property {Object} req A Hapijs request object
 * @property {Function} res A hapi reply function
 * @property {Object} data A data object representing an entity for serialization / deserialization
 * @property {Object} [object] A fully populated data entity. Mostly used internally
 **/

/**
 * An easy way to pass around request, and reply objects
 * @typedef {Object} module:tastypie/lib/resource~Nodeback as Nodeback
 * @property {Error} [err]
 * @property {Object|Object[]} [data] Data returned from an asyn operation
 **/


 /**
  * An easy way to pass around request, and reply objects
  * @typedef {Error} RequestError
  * @property {Request} req
  * @property {Reply} res
  **/


/**
 * The base resource implementation providing hooks for extension
 * @constructor
 * @tutorial resources
 * @alias module:tastypie/lib/resource
 * @param {Object} [options] Options data configuration
 * @param {?String} [options.name=null] The primary mount path for the resource /<name>, /<name>/{pk}. This will be set by the Api instance if not set
 * @param {String} options.pk=id The field name to use as the unique identifier for each entity
 * @param {Boolean} options.includeUri=true If set to true, a field named uri will be added to the resource instance
 * @param {string} [options.callbackKey=callback] callback key to be used for jsonp responsed
 * @param {string} [options.defaultFormat='application/json'] the default serialziion format if one is not specified
 * @param {module:tastypie/lib/serializer} [options.serializer=serializer] an instance of a serializer to be used to translate data objects
 * @param {Object[]} [options.routes=null] An array of route definitions add to the resources default crud routes
 * @param {String} [options.collection=data] the name of the key to be used lists of objects on list endpoints
 * @param {Number} [options.limit=25] The maximum number of results to return per page for the list endpoint
 * @param {module:tastypie/lib/paginator} [options.paginator=paginator] a Paginator Class used to page large list
 * @param {module:tastypie/lib/cache} [options.cache] A cache instance to be used for response caching.
 * @param {Object} [options.methodsAllowed] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @param {Object} [options.listMethodsAllowed=null] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @param {Object} [options.detailMethodsAllowed=null] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @param {Boolean} [options.returnData=true] return data after put, post requests.
 * @param {?Object} [options.filtering=null] And object defining an array of allowable filter types for each field
 * @example vaar Resource = require('tastypie').Resource
var instnace = new Resource({
	limit:10,
	pk:'user_id',
	defaultFormat:'text/xml',
	collection:'users'
	listMethodsAllowed:{
		get:true,
		put:false,
		post:false
		delete:false
	}
})
 */
Resource = new Class({
	inherits: events.EventEmitter
  , mixin: [Options, Parentize]
  , options: {
		name: null
	  , apiname: null
	  , includeUri: true
	  , pk: 'id'
	  , limit: 25
	  , returnData: true
	  , defaultFormat: 'application/json'
	  , serializer: new Serializer()
	  , cache: new cache()
	  , throttle: new Throttle()
	  , collection: 'data'
	  , paginator: paginator
	  , objectTpl: Object
	  , filtering: null
	  , ordering: null
	  , allowed:{

	  		methods:{
				get: true
			  , put: true
			  , post: true
			  , "delete": true
			  , patch: true
			  , head: true
			  , options: true
		  	}
		  	
		  	, schema:{ 
		  		get: true 
		  	}
	  }
	}

	, constructor: function( options ){
		var _fields, pkattr, allowed, isValid;

		// events.EventEmitter.call( this );
		this.setOptions( options );
		
		isValid        = optionsSchema.validate( this.options );
		allowed        = this.options.allowed;
		pkattr         = this.options.pk;
		this._uricache = null;
		this.domain    = domain.create();
		this.modified  = undefined;

		isValid.error&& this.emit('error', isValid.error )
		this.domain.on( 'error', this.exception.bind( this ) );
		

		if( !allowed.list ){
			this.options.allowed.list = clone( allowed.methods );
		}

		if( !allowed.detail ){
			this.options.allowed.detail = clone( allowed.methods );
		}

		allowed = undefined;

		// field inheritance
		_fields    = merge( clone( this.constructor.parent.fields || EMPTY_OBJECT ), this.fields );
		_fields.id = _fields.id ? _fields.id : {type:'field', attribute:pkattr, readonly:true};

		Object
			.keys( _fields )
			.forEach(function( key ){
				var fieldopt = _fields[key];
				// if
				if( fieldopt.type && fields[ fieldopt.type ] ){
					fieldopt.attribute = fieldopt.attribute || key;
					_fields[key] = new fields[fieldopt.type]( fieldopt );
					_fields[key].setOptions({name: key});
				} else{
					 fieldopt.options.attribute = fieldopt.options.attribute || key;
					_fields[ key ] = fieldopt;
				}
				_fields[key].augment( this, key );

				Object.defineProperty( this, key, {

					get: function(){
						return _fields[ key ];
					}
				});
			}.bind( this ) );

		this.fields = _fields;

		if( this.options.includeUri ){

			this.fields.uri = this.fields.uri || new fields.CharField({readonly:true});
		}
	}

	/**
	 * function used to generate a unique cache key
	 * @protected
	 * @method module:tastypie/lib/resource#cacheKey
	 * @param {String} type
	 * @param {String} uri
	 * @param {String} method
	 * @param {String} resource
	 * @param {Object} query
	 * @param {Object} params
	 * @return {String} key A valid cache key for the current request
	 **/
	, cacheKey: function cacheKey( type, uri, method, resource, query, params ){
		return util.format(
			"%s:%s:%s:%s:%s:%s"
		  , type
		  , uri
		  , method.toLowerCase()
		  , resource
		  , qs.stringify( params || EMPTY_OBJECT )
		  , qs.stringify( query || EMPTY_OBJECT )
		);
	}

	/**
	 * Defines the base urls for this resource
	 * @method module:tastypie/lib/resource#base_urls
	 * @return Array. And array of objects containing a route, name and handler propperty
	 * @example
{
	base_urls: fuinction(){
		return [{
			path:decodeURIComponent('/api/v1/test/{action}'),
			name:"test",
			handler: this.dispatch_test.bind( this )
		}];		
	}
}
	 **/
	, base_urls: function base_urls( ){
		return [{
			path: interpolate( decodeURIComponent( urljoin(  '{{apiname}}', '{{name}}', 'schema' ) ), this.options ).replace( /\/\//g, "/" )
		  , handler: this.get_schema.bind( this )
		  , name: 'schema'
		}
		, {
			path: interpolate( decodeURIComponent( urljoin(  '{{apiname}}', '{{name}}', '{pk}' ) ), this.options ).replace( /\/\//g, "/" )
		  , handler: this.dispatch_detail.bind( this )
		  , name: 'detail'
		}
		, {
			path: interpolate( decodeURIComponent( urljoin(  '{{apiname}}', '{{name}}' ) ), this.options ).replace( /\/\//g, "/" )
		  , handler: this.dispatch_list.bind( this )
		  , name: 'list'
		}];
	}

	/**
	 * creates an object to be used to filter data before it is returns.
	 * **NOTE** this needs to be implemented to suit the the data source backend
	 * @method module:tastypie/lib/resource#buildFilters
	 * @param {Object} fiters An object of requested filters
	 * @return {Object} filters An object of filter definitions suitable to be pased to the data backend
	 **/
	, buildFilters: function buildFilters( query ){
		return query;
	}

	/**
	 * function used to generate a resource schema
	 * @method module:tastypie/lib/resource# build_schema
	 * @return {Object} schema
	 **/
	, build_schema: function build_schema(){
		var that = this;
		var schema;
		var options = this.options
		if( !this._schema_cache ){
			schema = {
			    filtering: options.filtering || EMPTY_OBJECT
		      , ordering: options.ordering || []
			  , formats: Object.keys( options.serializer.options.content_types )
			  , limit: options.limit
			  , fields: object.map( this.fields, function( field ){
					return {
						'default'  : field.default
					  , 'type'     : field.type()
					  , 'nullable' : field.options.nullable
					  , 'blank'    : !!field.options.blank
					  , 'readonly' : !!field.options.readonly
					  , 'help'     : field.options.help
					  , 'unique'   : !!field.options.unique
					};
				})
			};

	
			this.routes && this.actions.forEach( function( action ){
				var allowed = 'allowed.'+action;
				debug('constructing schema for %s, %s', options.name, allowed );
				set(
					schema,
					allowed,
					Object
						.keys( get( that.options, allowed ) ||  EMPTY_OBJECT) 
						.filter( function( method ){
							return !!get(that.options,allowed)[method];
					  	})
				);
			});
			this._schema_cache = schema;
		}
		return this._schema_cache;
	}

	/**
	 * Packages peices of the express request in a single object for easy passing
	 * @method module:tastypie/lib/resource#bundle
	 * @param {Request} req An express request object
	 * @param {Response} rep An express response object
	 * @param {Function} next An express next callback
	 * @param {Object} [data={}] The data object to package
	 * @param {Object} [obj] and object instance used for hydration
	 * @return Object An object packaging important information about the current request
	 **/
	, bundle: function bundle( req, res, data, obj ){
		return {
			req: req
			, res: res
			, data: data || {}
			, object: obj
			, toJSON: to_json
			, toKey: function( type ){
				return util.format(
					"%s:%s:%s:%s:%s:%s"
					, type
					, req.path
					, 'get' // only get request are cached currently.
					, this.options.name
					, qs.stringify( req.params || EMPTY_OBJECT )
					, qs.stringify( req.query || EMPTY_OBJECT )
				);
			}.bind( this )
		};
	}

	/**
	 * determinds if a method / action pair is allowed
	 * @private
	 * @method module:tastypie.resources.Resource#check
	 * @param {String} method The http method to check
	 * @param {Object} allowed  Object of allowed methods
	 * @return {Boolean} allowed
	 **/
	, check: function check( act, bundle ){
		return checks[ act ] && checks[act].call(this, bundle );
	}

	/**
	 * A final hook to run and last deydration operations before a response is returned
	 * @method module:tastypie/lib/resource#dehydrate
	 * @param {Object} obj An object to dehydrate
	 * @return {Object}
	 **/
	, dehydrate: function dehydrate( obj ){
		return obj;
	}

	/**
	 * Generates a uri for a specific object related to this resource
	 * @method module:tastypie/lib/resource#dehydrate_uri
	 * @param {Object} obj
	 * @param {Bundle} bundle
	 * @param {Objectd} result
	 * @return {String} uri
	 **/
	, dehydrate_uri: function( obj, bundle, result ){
		return this.to_uri( obj, bundle, result );
	}

	/**
	 * converts a data string into an object
	 * @method module:tastypie/lib/resource#deserialize
	 * @param {String} data A string of data to be parsed
	 * @param {String} format the content type ( application/json, text/xml, etc ) of the in coming data string 
	 * @param {module:tastypie/lib/resource~Nodeback} callback
	 **/
	, deserialize: function deserialize( data, format, callback ){
		this.options.serializer.deserialize( data, format, callback );
	}

	/**
	 * Primary entry point for a request into the resource. maps Http methods to resource methods
	 * @method module:tastypie/lib/resource#dispatch
	 * @param {String} action the resource action to route the request to
	 * @param {Object|Bundle} bundle A bundle representing the current request
	 **/
	, dispatch: function dispatch( action, bundle ){
		var method_name
		  , method
		  , req
		  , res
		  ;

		req            = bundle.req;
		res            = bundle.res;
		bundle.action  = action;

		try{
			method_name = this.check('dispatch', bundle );
			method = this.check('access', bundle );
		} catch( err ){
			return this.exception( err );
		}

		if(this.throttle( bundle )){
			return this.exception( new Boom.tooManyRequests('Request limit reached'));
		}

		debug( 'dispatching %s %s', req.method, action, req.path );
		this.domain.run(method.bind( this, bundle ));
	}

	/**
	 * Dispatches detail requests which operated on a sigular, specific object
	 * @method module:tastypie/lib/resource#dispatch_detail
	 * @param {Request} req An express request object
	 * @param {Response} rep An express response object
	 * @param {Function} next An express next callback
	 **/
	, dispatch_detail: function detail( req, res ){
		debug( 'dispatching %s detail', req.method );

		return this.dispatch( 'detail', this.bundle( req, res ) );
	}

	/**
	 * disaptches a list request operating on a collection of objects.
	 * If any additional check / balances or processing needs to occur before a request is actually
	 * dispatched to the handler, this would be a good place to do that.
	 * @method module:tastypie/lib/resource#dispatch_list
	 * @param {Request} request A hapijs request object
	 * @param {Function} reply A hapis reply function
	 **/
	, dispatch_list: function list( req, reply ){
		return this.dispatch( 'list', this.bundle( req, reply ) );
	}

	/**
	 * Used to handle uncaught caugt errors during the request life cycle.
	 * @method module:tastypie/lib/resource#exception
	 * @param {RequestError} Error The error generated during the request
	 **/
	, exception: function exception( err ){
		var reply = err.res
		  , format
		  , code
		  ;

		if( !reply ){
			throw err;
		}

		code = err.statusCode || err.code || 500;
		format = this.format( err, this.options.serializer.types );
		err.req = err.res = undefined;

		if( err.isBoom ){
			return reply( err );
		}

		this.serialize( {error: err.name, message: err.message, statusCode: code}, format, EMPTY_OBJECT, function( serr, data ){
			var e = Boom.wrap( err, code, data.message );
			e.output.payload = data;
			reply( e );
		});
	}

	/**
	 * Applies custom filtering to a given set of objects.
	 * @method module:tastypie/lib/resource#filter
	 * @param {Bundle} bundle A request bundle
	 * @param {Object} filters An implementation specific object used to filter data sets
	 * @return {Object}
	 **/
	, filter: function filter( bundle, filters ){
		this.emit( 'error', new exceptions.NotImplemented( "filter" ) );
	}

	/**
	 * Attempts to determin the best serialization format for a given request
	 * @method module:tastypie/lib/resource#format
	 * @param {Bundle|Object} bundle A bundle object or similar object
	 * @param {Array} [types] An array of possible content types this resource can deal with.
	 * @return {String} accepts an accepted format for the the related request
	 **/
	, format: function format( bundle, types ){
		var fmt  = bundle.req.query && bundle.req.query.format
		  , ct = this.options.serializer.convertFormat( fmt )
		  ;

		if( fmt && !ct ){
			return bundle.res && bundle.res( new Boom.unsupportedMediaType( 'Unsupported format: ' + fmt ) );
		} else if( fmt && ct ){
			return ct;
		}

		return mime.determine( bundle.req, types );
	}

	/**
	 * reads a valeue from the specified cache backend by name. If nothing is found in
	 * cache it wil call {@link module:tastypie/lib/resource#get_object|get_object}
	 * @protected
	 * @method module:tastypie/lib/resource#from_cache
	 * @param {String} type of request ( list, detail, updload, etc)
	 * @param {Bundle} bundle A bundle representing the current request
	 * @param {Function} callback A calback function to use whkf
	 **/
	, from_cache: function from_cache( type, bundle, callback ){
		var obj
		  , key = this.cacheKey(
				type
			  , bundle.req.path
			  , bundle.req.method
			  , this.options.name
			  , bundle.req.query
			  , bundle.req.params
		);

		obj = this.options.cache.get( key, function( err, obj ){
			var that = this;

			if( obj ){
				debug("%s %s returning cached object", this.options.apiname, this.options.name );
				return callback( err, obj );
			}
			debug('cahed object miss');
			this.get_object( bundle, function( err, obj ){
				that.options.cache.set( key, obj );
				callback( err, obj );
			});
		}.bind( this ) );

	}

	/**
	 * A hook before serialization to converte and complex objects or classes into simple serializable objects
	 * @method module:tastypie/lib/resource#full_dehydrate
	 * @param {Object} obj an object to dehydrate object
	 * @return Object An object containing only serializable data
	 **/
	, full_dehydrate: function full_dehydrate( obj, bundle, done ){
		var ret = {}
		  , fields = this.fields
		  , methodname
		  , method
		  ;

		async.forEachOf( fields, function( fld, field, cb){
			fld.dehydrate( obj, function( err, data ){
				ret[ field ] = data;
				methodname   = 'dehydrate_' + field;
				method       = this[ methodname ];

				if( method ){
					ret[field] = method.call( this, obj,  bundle, ret );
				}

				this.dehydrate( ret );
				return cb && cb( err );
			}.bind( this ));
		}.bind( this ), function( err ){
			done( err, ret );
		});
	}

	/**
	 * Responsible for converting a raw data object into a resource mapped object
	 * @method module:tastypie/lib/resource#full_hydrate
	 * @param {Bundle} bundle
	 * @return {Bundle}
	 **/
	, full_hydrate: function full_hydrate( bundle, done ){
		var Tpl        = this.options.objectTpl
		  , methodname 
		  , method     
		  , attr
		  ;

		bundle = this.hydrate( bundle );
		bundle.object = bundle.object || ( typeof Tpl === 'function' ? new Tpl() : Object.create( Tpl ) );

		async.forEachOf( this.fields, function(field, fieldname, cb ){
			field = this.fields[ fieldname ];
			
			if( field.options.readonly ){
				return cb && cb( );
			}

			methodname = util.format( 'hydrate_%s', fieldname );
			method = this[ methodname ];

			if( isFunction( method ) ){
				bundle = method( bundle );
			}

			attr = field.options.attribute;

			if( attr ){
				field.hydrate( bundle, function( err, value ){
					set( bundle.object, attr, value );
					return cb && cb( err, value );
				});
			} else{
				return cb && cb( null, undefined );
			}
		}.bind( this ), function( err ){
			done( err, bundle );
		});
	}

    /**
	 * Top level method used to retreive indiidual objects by id.
	 * This method handles caching results as well as reading from the cache
	 * @where applicable
	 * @method module:tastypie/lib/resource#get_detail
	 * @param {Bundle} bundle A bundle representing the current request.
	 **/
	, get_detail: function get_detail( bundle ){

		this.from_cache( 'detail', bundle, function( err, data ){

			if( err ){
				err.req = bundle.req;
				err.res = bundle.res;
				return this.emit( 'error', err );
			}

			if( !data ){
				bundle.data = {
					message: util.format( 'No object found at %s', bundle.req.path )
					,statusCode: 404
					,error:'Not Found'
				};
				return this.respond( bundle, http.notFound );
			}

			this.full_dehydrate( data, bundle, function( err, data ){
				bundle = this.bundle( bundle.req, bundle.res, data );
				return this.respond( bundle );
			}.bind( this ));
		}.bind( this ) );
	}

	/**
	 * Top level function used to handle get requests for listing endpoints. It handles paging and serialization
	 * @method module:tastypie/lib/resource#get_list
	 * @param {Bundle} bundle A bundle representing the current request
	 **/
    , get_list: function get_list( bundle ){
		this._get_list( bundle, function( e, objects ){
			var that = this
			  , to_be_serialize
			  , paginator
			  , name
			  , apiname
			  ;
			
			objects = objects || '[]';
			objects = this.sort( JSON.parse( objects ) );
			paginator = new this.options.paginator({
				limit: bundle.req.query.limit || this.options.limit
			  , req: bundle.req
			  , res: bundle.res
			  , collectionName: this.options.collection
			  , objects: objects
			});

			to_be_serialize = paginator.page();
			debug( ' %s %s : serializing', apiname, this.options.name );

			async.map( to_be_serialize[ this.options.collection ],function( item, done ){
				that.full_dehydrate( item, bundle, done );
			}, function( err, results ){
				to_be_serialize[ that.options.collection ] = results;
				bundle.data = to_be_serialize;
				debug( ' %s %s : responding', apiname, name );
				apiname = name = paginator = to_be_serialize = null;
				return that.respond( bundle );
			});

		}.bind( this ) );
	}

	/**
	 * Method used to retrieve a specific object
	 * **NOTE** This method *must* be implement for specific use cases. The default does not implement this method
	 * @method module:tastypie/lib/resource#get_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle
	 * @param {module:tastypie/lib/resource~Nodeback} callback
	 * @example
var MyResource = new Class({
	inherits: Resource
	, get_object: function( bundle, callback ){
		this._get_list(bundle,function(e, objects){
			var obj = JSON.parse( objects ).filter(function( obj ){
				return obj._id = bundle.req.params.id
			})[0]
			callback( null, obj )
		})
	}
})

	 **/
	, get_object: function get_object( bundle, callback ){
		var e = new exceptions.NotImplemented( "get_object is not implemented" );
		e.req = bundle.req;
		e.res = bundle.res;
		e.next = bundle.next;
		this.emit('error', e);
	}

	/**
	 * Top level method for generating resource specific schemas for *GET* requests
	 * @method module:tastypie/lib/resource#get_schema
	 * @param {Request} request A Hapi.js request object
	 * @param {Function} reply A hapi.js reply function
	 **/
	, get_schema: function get_schema( req, res ){

		this.respond( this.bundle( req, res, this.build_schema( ) ) );
	}

	/**
	 * Final hydration hook method. Is a noop by default
	 * @method module:tastypie/lib/resource#hydrate
	 * @param {Bundle} bundle
	 * @return {Bundle}
	 **/
	, hydrate: function( bundle ){
		return bundle;
	}

	/**
	 * Attempts to determine the primary key value of the specific object related to a resource request
	 * @method module:tastypie/lib/resource#pk
	 * @param {Object} orig
	 * @param {Bundle} bundle
	 * @param {Object} result
	 * @return {String|Number} pk The value at the configured primary key field of the object related to the resource
	 **/
	, pk: function pk( orig, bundle, result ){
		var pk_field;

		pk_field = this.options.pk || 'id';

		return orig[pk_field] || result[pk_field] || ( bundle.data && bundle.data[pk_field] ) || null;
	}

	, patch_detail: function patch_detail( bundle ){
		var response = http.accepted
		  , that = this
	  	  ;

		bundle.data = bundle.req.payload;
		this.update_object( bundle, function( err, bndl ){
			if( err ){
				err.req = bundle.req;
				err.res = bundle.res;

				return that.emit( 'err', err );
			}

			if( !that.options.returnData ){
				bundle.data = null;
				response = http.noContent;
			} else {
				that.full_dehydrate( bndl.object, bndl, function( err, data ){
					bundle.data = data;
					return that.respond( bndl, response );
				});
			}
		});
	}

	/**
	 * Top level method used to handle post request to listing endpoints. Used to create new instances
	 * of the associated resource
	 * @method module:tastypie/lib/resource#post_list
	 * @param {Bundle} bundle An object represneting the current `POST` request
	 **/
	, post_list: function post_list( bundle ){
		var response = http.created
		  , that = this
		  ;

		bundle.data = bundle.req.payload;

		// _post_list must save the object
		this._post_list( bundle, function( err, bndl ){
			if( err ){
				return that.emit( 'error', err );
			}

			if( !that.options.returnData ){
				bundle.data = null;
				response = http.noContent;
			} else{
				that.full_dehydrate( bndl.object, bndl, function( err, data ){
					bundle.data = data;
					return that.respond( bndl, response );
				});
			}
		});
	}
	
	/**
	 * A method which returns additaional urls to be added to the default uri defintion of a resource
	 * @method module:tastypie/lib/resource#prepend_urls
	 * @return Array an empty array
	 **/
	, prepend_urls: function prepend_urls( ){
		return this.options.routes || [];
	}

	/**
	 * Top level method used to handle post request to listing endpoints. Used to update instances with supplied data
	 * @method module:tastypie/lib/resource#post_list
	 * @param {Bundle} bundle An object represneting the current `PUT` request
	 **/
	, put_detail: function put_detail( bundle ){
		var response = http.accepted
		  , that = this
		  ;

		bundle.data = bundle.req.payload;

		// _put_detail must save the object
		this.replace_object( bundle, function( err, bndl ){
			if( err ){
				return that.emit( 'error', err );
			}

			if( !that.options.returnData ){
				bundle.data = null;
				response = http.noContent;
			}
			that.full_dehydrate( bndl.object, bndl, function( err, data ){
				bundle.data = data;
				return that.respond( bndl, response );
			});
		});
	}

	,replace_object: function replace_object( bundle, callback ){
		var e = new exceptions.NotImplemented( 'replace_object' );
		e.req = bundle.req;
		e.res = bundle.res;
		return callback && callback( e );
	}
	
	/**
	 * Method to generate a response for a bundled request. Will set contnent-type and length headers
	 * @chainable
	 * @method module:tastypie/lib/resource#respond
	 * @param {Bundle|Object} bundle A bundle or similar object
	 * @param {HttpResponse|Function} cls An HttpResponse function to call to finish the request. Function should accept a response object, and data to send
	 * @return Resource
	 **/
	, respond: function respond( bundle, cls, cb ){
		cls = cls || http.ok;
		var format = this.format( bundle, this.options.serializer.types );
		var that = this;
		debug('requested format: %s', format,bundle.req.headers.accept );
		this.serialize( bundle.data, format, bundle.req.query, function( err, data ){
			var reply = cls( bundle.res, data, format );
			var mutable = mutableMethods.indexOf( bundle.req.method.toLowerCase() ) !== -1;
			that.modified = mutable ? (new Date()).toUTCString() : that.modified;
			that.modified && reply.header('Last-Modified', that.modified );
			mutable = null;

			return cb && cb( null, reply );
		});
	}

	/**
	 * Converts a valid object in to a string of the specified format
	 * @method module:tastypie/lib/resource#serialize
	 * @param {Object} data Data object to be serialized before delivery
	 * @param {String} format the
	 * @param {?Object} [options={}]
	 * @param {module:tastypie/lib/resource~Nodeback} callback
	 **/
	, serialize: function serialize( data, format, options, callback ){
		this.options.serializer.serialize( data, format, options || EMPTY_OBJECT, callback );
	}


	/**
	 * Applies custome sorting to a given list of objects. Default applies no sorting
	 * @method module:tastypie/lib/resource#sort
	 * @param {Array} list The list of objects to be sorted
	 * @return Array of sorted objects
	 **/
	, sort: function sort( obj_list ){
		return obj_list;
	}

	, throttle: function throttle( bundle ){
		var thrtl
		  , request_id
		  ;

		request_id = util.format(
			'%s:%s:%s'
			, bundle.req.method.toLowerCase()
			, bundle.req.info.remoteAddress || "noaddr"
			, bundle.req.path
		);
		thrtl = this.options.throttle.toThrottle( request_id );

		if( !thrtl ){
			this.options.throttle.incr( request_id );
		}

		return thrtl;
	}

	/**
	 * returns the internal string representation of a resource
	 * @method module:tastypie/lib/resource#toString
	 * @return {String} String representation
	 **/
	, toString: function toString( ){
		return '[object Resource]';
	}

	/**
	 * creates a resource uri for a specific object
	 * @method module:tastypie/lib/resource#to_uri
	 * @param {Object} obj
	 * @param {Bundle} bundle
	 * @param {Object} result
	 * @return {String}
	 **/
	, to_uri: function to_uri( obj, bundle, result ){
		return urljoin( this.options.apiname, this.options.name, this.pk( obj, bundle, result ) );
	}

	/**
	 * Method that is responsibe for updating a specific object during a *PUT* request
	 * @method module:tastypie/lib/resource#update_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle The data bundle representing the current request
	 * @param {module:tastypie/lib/resource~Nodeback} callback callback to be called when the operation finishes.
	 **/
	, update_object: function update_object( bundle, callback ){
		var e = new exceptions.NotImplemented( 'update_object' );
		e.req = bundle.req;
		e.res = bundle.res;
		return callback && callback( e );
	}
	
	/**
	 * Internal method used to retrieve a full list of objects for a resource
	 * @method module:tastypie/lib/resource#_get_list
	 * @param {module:tastypie/lib/resource~Bundle} bundle
	 * @param {module:tastypie/lib/resource~Nodeback} callback callback function to call when data retrieval is
 	 **/
	, _get_list: function _get_list( bundle, callback ){
		var e = new exceptions.NotImplemented( "_get_list is not implemented" );
		e.req = bundle.req;
		e.res = bundle.res;
		callback( e );
	}

	/**
	 * Internal methdo used during the `post_list` method
	 * @protected
	 * @method module:tastypie/lib/resource#_post_list
	 * @param {Bundle} bundle A bundle representing the current request
	 * @param {module:tastypie/lib/resource~Nodeback} callback a callback function to call when the operation is complete
	 **/
	, _post_list: function _post_list( bundle, callback ){
		var e = new exceptions.NotImplemented( "_post_list is not implemented" );
		e.req = bundle.req;
		e.res = bundle.res;

		callback( e );
	}

	/**
	 * Used internally for better type detection
	 * @private
	 * @method module:tastypie/lib/resource#$family
	 * @return {String}
	 **/
	, $family: function $family( ){
		return 'resource';
	}
});

Object.defineProperties( Resource.prototype, {

	routes: {
		/**
		 * @name routes
		 * @property routes A mapping of uris and their associated handlers
		 * @memberof module:tastypie/lib/resource#routes
		 * @type Object
		 **/
		get: function( ){
			var that = this;
			if( !this._uricache ){
				this._uricache = ( this.prepend_urls() || [] ).concat( this.base_urls() );
				this.actions = [];
			}
			return this._uricache.map(function( route ){
				that.actions.indexOf( route.name ) === -1 && that.actions.push( route.name );
				return {
					path: route.path
					, method: route.method || "*"
					, handler: route.handler
					, config: object.merge( that.options.config || {}, route.config || {}, {
						plugins: {
							tastypie: {
								name: route.name
							}
						}
					})
				};
			});
		}
	}

	, urls: {
		/**
		 * @property urls An array of all registered uris on a given resource
		 * @name urls
		 * @memberof module:tastypie.resources.Resource
		 * @type Array
		 **/
		get: function( ){
			return this.routes.map( function( uri ){
				return uri.path;
			});
		}
	}
});

Resource.defineMutator = Class.defineMutator;

/**
 * Helper method to subclass the base resource
 * @static
 * @function
 * @name extend
 * @memberof module:tastypie/lib/resource
 * @param {Object} proto An object to use as the prototyp of a new resource type
 * @return {module:tastypie/lib/resources/Resource}
 **/
Resource.extend = function( proto ){
	proto.inherits = Resource;
	return new Class( proto );
};
module.exports = Resource;

