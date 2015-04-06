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
 * @requires module:tastypie/Class
 * @requires module:tastypie/http
 * @requires module:tastypie/mime
 * @requires module:tastypie/paginator
 * @requires module:tastypie/Options
 * @requires module:tastypie/exceptions
 * @requires module:tastypie/serializer
 **/
var path             = require( 'path' )                       // path
  , domain           = require( 'domain' )                     // domain
  , events           = require( 'events' )                     // events
  , util             = require( 'util' )                       // util
  , fs               = require( 'fs' )                         // fs
  , path             = require( 'path' )                       // fs
  , urljoin          = require( 'urljoin' )
  , object           = require( 'mout/object' )
  , qs               = require( 'querystring' )                // qs
  , merge            = require( 'mout/object/merge' )          // merge
  , clone            = require( 'mout/lang/clone' )            // clone
  , isFunction       = require( 'mout/lang/isFunction' )
  , interpolate      = require( 'mout/string/interpolate' )        // interpolate
  , Boom             = require( 'boom' )
  , set              = require( 'mout/object/set' )
  , object           = require( 'mout/object' )
  , Parentize        = require( 'prime-util/prime/parentize' )
  , debug            = require( 'debug' )( 'tastypie:resource' )     // debug
  , Class            = require( '../class' )                       // Class
  , http             = require( '../http' )                        // http
  , mime             = require( '../mime' )                        // mime
  , paginator        = require( '../paginator' )                   // paginator
  , Options          = require( '../class/options' )               // Options
  , exceptions       = require( '../exceptions' )                  // exceptions
  , Serializer       = require( '../serializer' )                  // serializer
  , cache            = require( '../cache' )
  , fields           = require( '../fields' )
  , EMPTY_OBJECT     = {}
  , Resource
  ;

/**
 * DESCRIPTION
 * @function to_json
 * @return {Object}
 **/
function to_json(){
	return ( this.data || EMPTY_OBJECT );
};


/**
 * An easy way to pass around request, and reply objects
 * @alias Bundle
 * @typedef {Object} module:tastypie/lib/resource~Bundle
 * @property {Object} request A Hapijs request object
 * @property {Function} reply A hapi reply function
 * @property {Object} data A data object representing an entity for serialization / deserialization
 * @property {Object} [object] A fully populated data entity. Mostly used internally
 **/

/**
 * An easy way to pass around request, and reply objects
 * @typedef {Object} Nodeback
 * @property {Error} [err]
 * @property {Object|Object[]} [data] Data returned from an asyn operation
 **/


/**
 * The base resource implementation providing hooks for extension
 * @constructor
 * @alias module:tastypie/lib/resource
 * @param {Object} [options] Options data configuration
 * @param {string} [options.callbackKey=callback] callback key to be used for jsop responsed
 * @param {string} [options.defaultFormat='application/json'] the default serialziion format if one is not specified
 * @param {Serializer} [options.serializer=serializer] an instance of a serializer to be used to translate data objects
 * @param {Object[]} [routes=null] An array of route definitions add to the resources default crud routes
 * @param {string} [options.collection=data] the name of the key to be used lists of objects on list endpoints
 * @param {Paginator} [options.paginator=paginator] a Paginator Class used to page large list
 * @param {Object} [options.methodsAllowed] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @param {Object} [options.listMethodsAllowed=null] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @param {Object} [options.detailMethodsAllowed=null] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @example var x = new NAME.Thing({});
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
	  , cache: new cache.Memory()
	  , collection: 'data'
	  , paginator: paginator
	  , objectTpl: Object
	  , methodsAllowed: {
			get: true
		  , put: true
		  , post: true
		  , "delete": true
		  , patch: true
		  , head: true
		  , options: true
		}

	  , listMethodsAllowed: null
	  , detailMethodsAllowed: null
	}

	/**
	 * DESCRIPTION
	 **/
	, constructor: function( options ){
		this.domain = domain.create();
		// events.EventEmitter.call( this );
		this.setOptions( options );
		this._uricache = null;
		this.domain.on( 'error', this.exception.bind( this ) );

		if( !this.options.listMethodsAllowed ){
			this.options.listMethodsAllowed = clone( this.options.methodsAllowed );
		}

		if( !this.options.detailMethodsAllowed ){
			this.options.detailMethodsAllowed = clone( this.options.methodsAllowed );
		}


		// field inheritance
		var _fields = clone( this.constructor.parent.fields || EMPTY_OBJECT );
		_fields = merge( _fields, this.fields );

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
					/**
					 * @readonly
					 * @property {TYPE} <NAME> <DESCRIPTION>
					 **/
					get: function(){
						return _fields[ key ]
					}
				})
			}.bind( this ) );

		this.fields = _fields;

		if( this.options.includeUri ){

			this.fields.uri = this.fields.uri || new fields.CharField()
		}
	}

	/**
	 * defines the base urls for this resource
	 * @method module:tastypie/lib/resource#base_urls
	 * @return Array. And array of objects containing a route and handler
	 **/
	, base_urls: function base_urls( ){
		return [{
			route: interpolate( decodeURIComponent( urljoin( '/', '{{apiname}}', '{{name}}', 'schema' ) ), this.options ).replace( /\/\//g, "/" )
		  , handler: this.get_schema.bind( this )
		  , name: 'schema'
		}
		, {
			route: interpolate( decodeURIComponent( urljoin( '/', '{{apiname}}', '{{name}}', '{pk}' ) ), this.options ).replace( /\/\//g, "/" )
		  , handler: this.dispatch_detail.bind( this )
		  , name: 'detail'
		}
		, {
			route: interpolate( decodeURIComponent( urljoin( '/', '{{apiname}}', '{{name}}' ) ), this.options ).replace( /\/\//g, "/" )
		  , handler: this.dispatch_list.bind( this )
		  , name: 'list'
		}];
	}

	/**
	 * determinds if a method / action pair is allowed
	 * @private
	 * @method module:tastypie.resources.Resource#check
	 * @param {String} method The http method to check
	 * @param {Object} allowed  Object of allowed methods
	 * @return {Boolean} allowed
	 **/
	, check: function check( method, allowed ){
		allowed = allowed || {};
		method = method.toLowerCase();

		return !!allowed[method];
	}
	/**
	 * Primary entry point for a request into the resource. maps Http methods to resource methods
	 * @method module:tastypie/lib/resource#dispatch
	 * @param {String} action the resource action to route the request to
	 * @param {Object|Bundle} bundle A bundle representing the current request
	 **/
	, dispatch: function dispatch( action, bundle ){
		var httpmethod
		  , requestmethod
		  , methodsallowed
		  , canDispatch
		  , method
		  , options
		  , req
		  , res
		  , err
		  ;


		req            = bundle.req;
		res            = bundle.res;

		options        = this.options;
		requestmethod  = ( req.headers['x-method-override'] || req.method ).toLowerCase();
		httpmethod     = util.format( '%s_%s', requestmethod, action );
		method         = this[ httpmethod ];
		methodsallowed = options[ util.format( '%sMethodsAllowed', action )] || {};
		canDispatch    = this.check( requestmethod, methodsallowed );
		if( !method ){
			err = new exceptions.NotImplemented({
				message: util.format( '%s for %s', requestmethod.toUpperCase(), req.path )
			});
			err.req = req;
			err.res = res;
			return res( err );
			return this.emit( 'error',  err );
		}

		if( !canDispatch ){
			return http.methodNotAllowed( bundle.res );
		}

		debug( 'dispatching %s %s', httpmethod, action );
		//this.is_authenticated( bundle )
		this.domain.run( method.bind( this, bundle ) );
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
	 * Top level function used to handle get requests for listing endpoints. It handles paging and serialization
	 * @method module:tastypie/lib/resource#get_list
	 * @param {Bundle} bundle A bundle representing the current request
	 **/
    , get_list: function get_list( bundle ){
		this._get_list( bundle, function( e, objects ){
			var that = this
			  , to_be_serialize
			  , paginator
			  ;

			objects = objects || [];
			objects = this.sort( JSON.parse( objects ) );
			debug( 'paging' );
			paginator = new this.options.paginator({
				limit: bundle.req.query.limit || 0
			  , req: bundle.req
			  , res: bundle.res
			  , collectionName: this.options.collection
			  , objects: objects
			});

			to_be_serialize = paginator.page();
			debug( 'serializing' )

			to_be_serialize[ this.options.collection ] = to_be_serialize[ this.options.collection ].map( function( item ){
				return that.full_dehydrate( item, bundle );
			});

			bundle.data = to_be_serialize;
			debug( 'responding' );
			return this.respond( bundle );
		}.bind( this ) );
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
				bundle.data = null
				response = http.noContent
			} else{
				bndl.data = that.full_dehydrate( bndl.object, bndl )
			}

			return that.respond( bndl, response );
		});
	}

	/**
	 * Top level method used to handle post request to listing endpoints. Used to update instances with supplied data
	 * @method module:tastypie/lib/resource#post_list
	 * @param {Bundle} bundle An object represneting the current `PUT` request
	 **/
	, put_detail: function put_list( bundle ){
		var response = http.accepted
		  , that = this
		  ;

		bundle.data = bundle.req.payload;

		// _put_detail must save the object
		this.update_object( bundle, function( err, bndl ){
			if( err ){
				return that.emit( 'error', err );
			}

			if( !that.options.returnData ){
				bundle.data = null;
				response = http.noContent;
			}

			bndl.data = that.full_dehydrate( bndl.object, bndl );
			return that.respond( bndl, response );
		});
	}

	/**
	 * Internal methdo used during the `post_list` method
	 * @protected
	 * @method module:tastypie/lib/resource#_post_list
	 * @param {Bundle} bundle A bundle representing the current request
	 * @param {Nodeback} callback a callback function to call when the operation is complete
	 **/
	, _post_list: function _post_list( bundle, callback ){
		var e = new exceptions.NotImplemented( "_post_list is not implemented" );
		e.req = bundle.req;
		e.res = bundle.res;

		callback( e );
	}

	/**
	 * Internal method used to retrieve a full list of objects for a resource
	 * @method module:tastypie/lib/resource#_get_list
	 * @param {module:tastypie/lib/resource~Bundle} bundle
	 * @param {Nodeback} callback callback function to call when data retrieval is omplete
	 **/
	, _get_list: function _get_list( bundle, callback ){
		var e = new exceptions.NotImplemented( "_get_list is not implemented" )
		e.req = bundle.req;
		e.res = bundle.res;
		callback( e );
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
				err.res = bundle.res
				return this.emit( 'error', err );
			}

			if( !data ){
				bundle.data = {
					message: 'not found'
					, code: 404
				};
				return this.respond( bundle, http.notFound );
			}

			data = this.full_dehydrate( data, bundle );
			bundle = this.bundle( bundle.req, bundle.res, data );
			return this.respond( bundle );
		}.bind( this ) );
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
		debug( 'from_cache' );
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
				return callback( err, obj );
			}

			this.get_object( bundle, function( err, obj ){
				that.options.cache.set( key, obj );
				callback( err, obj );
			});
		}.bind( this ) );

	}


	/**
	 * Method used to retrieve a specific object
	 * **NOTE** This method *must* be implement for specific use cases. The default does not implement this method
	 * @method module:tastypie/lib/resource#get_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle
	 * @param {Nodeback} callback
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
		this.emit( 'error',  e );
	}

	/**
	 * Method that is responsibe for updating a specific object during a *PUT* request
	 * @method module:tastypie/lib/resource#update_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle The data bundle representing the current request
	 * @param {Nodeback} callback callback to be called when the operation finishes.
	 **/
	, update_object: function update_object( bundle, callback ){
		var e = new exceptions.NotImplemented( 'update_object' )
		e.req = bundle.req;
		e.res = bundle.res;
		return callback && callback( e );

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
		)
	}

	/**
	 * Top level method for generating resource specific schemas for *GET* requests
	 * @method module:tastypie/lib/resource#get_schema
	 * @param {Request} request A Hapi.js request object
	 * @param {Function} reply A hapi.js reply function
	 **/
	, get_schema: function get_schema( req, res ){

		var data   = {}
		  , urls   = this.routes
		  , that   = this
		  , base   = this.options.apiname || "/"
		  , bundle = this.bundle( req, res, this.build_schema( ) )
		  ;

		this.respond( bundle );
	}

	/**
	 * function used to generate a resource schema
	 * @method module:tastypie/lib/resource# build_schema
	 * @return {Object} schema
	 **/
	, build_schema: function build_schema(){
		var that = this;

		return {
				methodsAllowed: Object.keys( this.options.methodsAllowed )
									  .filter( function( method ){
										return !!that.options.methodsAllowed[ method ]
									  })
			  , filtering: {}
			  , limit: 0
			  , format: this.options.serializer.options.defaultFormat
			  , fields: object.map( this.fields, function( field ){
				return {
					'default': field.default
				  , 'type': field.type()
				  , 'nullable': field.options.null
				  , 'blank': !!field.options.blank
				  , 'readonly': !!field.options.readonly
				  , 'help': field.options.help
				  , 'unique': !!field.options.unique
				}
			})
		};
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
	 * A hook before serialization to converte and complex objects or classes into simple serializable objects
	 * @method module:tastypie/lib/resource#full_dehydrate
	 * @param {Object} obj an object to dehydrate object
	 * @return Object An object containing only serializable data
	 **/
	, full_dehydrate: function full_dehydrate( obj, bundle ){
		var ret = {}
		  , fields = this.fields
		  , fld
		  , field
		  , methodname
		  , method
		  ;

		for( field in fields ){
			fld = this.fields[ field ];
			ret[ field ] = fld.dehydrate( obj );

			methodname = 'dehydrate_' + field;
			method = this[ methodname ];

			if( method ){
				ret[field] = method.call( this, obj,  bundle, ret );
			}
		}

		return this.dehydrate( ret );
	}

	/**
	 * Responsible for converting a raw data object into a resource mapped object
	 * @method module:tastypie/lib/resource#full_hydrate
	 * @param {Bundle} bundle
	 * @return {Bundle}
	 **/
	, full_hydrate: function( bundle ){
		var Tpl        = this.options.objectTpl
		  , field      = this.fields[ fieldname ]
		  , methodname 
		  , method     
		  , fieldname
		  , value
		  , attr
		  ;

		bundle = this.hydrate( bundle );
		bundle.object = bundle.object || ( typeof Tpl == 'function' ? new Tpl : Object.create( Tpl ) );

		for( fieldname in this.fields ){
			field = this.fields[ fieldname ]
			
			if( field.options.readonly ){
				continue;
			}

			methodname = util.format( 'hydrate_%s', fieldname )
			method = this[ methodname ]

			if( isFunction( method ) ){
				bundle = method( bundle );
			}

			attr = field.options.attribute;
			if( attr ){
				set( bundle.object, attr, field.hydrate( bundle ) );
			}

		}
		return bundle;
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
	 * creates a resource uri for a specific object
	 * @method module:tastypie/lib/resource#to_uri
	 * @param {Object} obj
	 * @param {Bundle} bundle
	 * @param {Object} result
	 * @return {String}
	 **/
	, to_uri: function to_uri( obj, bundle, result ){
		return urljoin( this.options.apiname, this.options.name, this.pk( obj, bundle, result ) )
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

	/**
	 * A final hook to run and last deydration operations before a response is returned
	 * @method module:tastypie/lib/resource#dehydrate
	 * @param {Object} obj An object to dehydrate
	 * @return {Object}
	 **/
	, dehydrate: function dehydrate( obj ){
		return obj
	}

	/**
	 * Generates a uri for a specific object related to this resource
	 * @method module:tastypie/lib/resource#dehydrate_uri
	 * @param {Object} obh
	 * @param {Bundle} bundle
	 * @param {Objectd} result
	 * @return {String} uri
	 **/
	, dehydrate_uri: function( obj, bundle, result ){
		return this.to_uri( obj, bundle, result );
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
		this.serialize( bundle.data, format, null, function( err, data ){
			var reply = cls( bundle.res, data, format );
			return cb && cb( null, reply );
		})
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#error
	 * @param {Bundle} bundle
	 * @param {Error} err
	 * @param {Response} [cls=moduletastypie/lib/http.badRequest] The response instance
	 **/
	, error: function error( bundle, err, cls ){
		cls = cls || http.badRequest;
		var format = this.format( bundle.req, bundle.res, this.options.serializer.types );

		this.serialize({
			status: 400
		  , msg: err.message
		}, format, function( err, data ){
			cls( bundle.res, data, format );
		}.bind( this ) );
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#exception
	 * @param {Error} err
	 **/
	, exception: function exception( err ){
		var req   = err.req
		  , reply = err.res
		  , format
		  ;

		if( !reply ){
			throw err;
		}

		format = this.format( err, this.options.serializer.types );
		err.req = err.res = undefined;

		if( err.isBoom ){
			return reply( err );
		}

		this.serialize( {error: err.name, message: err.message, statusCode: err.statusCode || err.code || 500}, format, EMPTY_OBJECT, function( serr, data ){
			var e = Boom.wrap( err, data.code, data.message );
			e.output.payload = data;
			return reply( e );
		}.bind( this ) );
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
			return bundle.res && bundle.res( new Boom.unsupportedMediaType( 'Unsupported format: ' + fmt ) )
		} else if( fmt && ct ){
			return ct;
		}

		return mime.determine( bundle.req, types );
	}

	/**
	 * Packages peices of the express request in a single object for easy passing
	 * @method module:tastypie/lib/resource#bundle
	 * @param {Request} req An express request object
	 * @param {Response} rep An express response object
	 * @param {Function} next An express next callback
	 * @param {Object} [data={}] The data object to package
	 * @return Object An object packaging important information about the current request
	 **/
	, bundle: function bundle( req, res, data ){
		return {
			req: req
			, res: res
			, data: data || {}
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
				)
			}.bind( this )
		}
	}

	/**
	 * Converts a valid object in to a string of the specified format
	 * @method module:tastypie/lib/resource#serialize
	 * @param {Object} data Data object to be serialized before delivery
	 * @param {String} format the
	 * @param {?Object} [options={}]
	 * @param {Nodeback} callback
	 **/
	, serialize: function serialize( data, format, options, callback ){
		this.options.serializer.serialize( data, format, options || EMPTY_OBJECT, callback );
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#deserialize
	 * @param {String} data
	 * @param {String} format
	 * @param {Nodeback} callback
	 **/
	, deserialize: function deserialize( data, format, callback ){
		this.options.serializer.deserialize( data, format, callback );
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
	 * returns the internal string representation of a resource
	 * @method module:tastypie/lib/resource#toString
	 * @return {String} String representation
	 **/
	, toString: function toString( ){
		return '[object Resource]'
	}

	/**
	 * Used internally for better type detection
	 * @private
	 * @method module:tastypie/lib/resource#$family
	 * @return {String}
	 **/
	, $family: function $family( ){
		return 'resource'
	}
});

Object.defineProperties( Resource.prototype, {

	routes: {
		/**
		|* @name routes
		 * @property routes A mapping of uris and their associated handlers
		 * @memberof module:tastypie/lib/resource#routes
		 * @type Object
		 **/
		get: function( ){
			var that = this;
			if( !this._uricache ){
				this._uricache = ( this.prepend_urls() || [] ).concat( this.base_urls() )
			}
			return this._uricache.map(function( route ){
				return {
					path: route.route
					, method: route.method || "*"
					, handler: route.handler
					, config: object.merge(that.options.config || {}, {
						plugins: {
							tastypie: {
								name: route.name
							}
						}
					, validate: that.options.validation || undefined
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
 * @memberof module:tastypie/lib/resources.Resource
 * @param {Object} proto An object to use as the prototyp of a new resource type
 * @return {module:tastypie/lib/resources/Resource}
 **/
Resource.extend = function( proto ){
	proto.inherits = Resource
	return new Class( proto );
};
module.exports = Resource;
