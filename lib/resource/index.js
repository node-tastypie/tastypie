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
var path             = require('path')                       // path
  , domain           = require('domain')                     // domain
  , events           = require('events')                     // events
  , util             = require('util')                       // util
  , fs               = require('fs')                         // fs
  , path             = require('path')                       // fs
  , urljoin          = require('urljoin')
  , object           = require('mout/object')
  , qs               = require('querystring')                // qs
  , merge            = require('mout/object/merge')          // merge
  , clone            = require('mout/lang/clone')            // clone
  , isFunction       = require('mout/lang/isFunction')
  , interpolate      = require('mout/string/interpolate')    // interpolate
  , Boom             = require('hapi/node_modules/boom')
  , set        = require('mout/object/set')
  , object           = require('mout/object')
  , Parentize        = require('prime-util/prime/parentize')
  , debug            = require('debug')('tastypie:resource') // debug
  , Class            = require('../class')                    // Class
  , http             = require('../http')                     // http
  , mime             = require('../mime')                     // mime
  , paginator        = require('../paginator')                // paginator
  , Options          = require('../class/options')               // Options
  , exceptions       = require('../exceptions')               // exceptions
  , serializer       = require('../serializer')               // serializer
  , cache            = require('../cache')
  , fields           = require("../fields")
  , Resource
  ;

var EMPTY_OBJECT = {};

function to_json(){
	return (this.data || EMPTY_OBJECT)
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
 * @typedef {Object} NodeCallback
 * @property {Error} [err]
 * @property {Object|Object[]} [data] Data returned from an asyn operation
 **/


/**
 * The base resource implementation providing hooks for extension
 * @constructor
 * @alias module:tastypie/lib/resource
 * @param {Object} [options] Options data configuration
 * @param {String} [options.callbackKey=callback] callback key to be used for jsop responsed
 * @param {String} [options.defaultFormat='application/json'] the default serialziion format if one is not specified
 * @param {Serializer} [options.serializer=serializer] an instance of a serializer to be used to translate data objects
 * @param {Object[]} [routes=null] An array of route definitions add to the resources default crud routes
 * @param {String} [options.collection=data] the name of the key to be used lists of objects on list endpoints
 * @param {Paginator} [options.paginator=paginator] a Paginator Class used to page large list
 * @param {Object} [options.methodsAllowed] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @param {Object} [options.listMethodsAllowed=null] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @param {Object} [options.detailMethodsAllowed=null] an object which maps HTTP method names to a boolean {get:true} This is used as a default for custom actions if non is defined
 * @example var x = new NAME.Thing({});
 */
Resource = new Class({
	inherits: events.EventEmitter
	,mixin:[ Options, Parentize ]
	,options: {
		name:null
		,apiname:null
		,includeUri: true
		,pk:'id'
		,returnData:true
		,defaultFormat:'application/json'
		,serializer: new serializer()
		,cache: new cache.Memory()
		,collection:'data'
	    ,paginator:paginator
	    ,objectTpl:Object
		,methodsAllowed:{
			get:true
			,put:true
			,post:true
			,"delete":true
			,patch:true
			,head:true
			,options:true
		}

		,listMethodsAllowed:null
		,detailMethodsAllowed:null
	}

	,constructor: function( options ){
		this.domain = domain.create();
		// events.EventEmitter.call( this );
		this.setOptions( options )
		this._uricache = null;
        this.domain.on('error', this.exception.bind( this ))


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
				var fieldopt = _fields[key]
				// if 
				if( fieldopt.type && fields[ fieldopt.type ] ){
					fieldopt.attribute = fieldopt.attribute || key;
					_fields[key] = new fields[fieldopt.type]( fieldopt );
					_fields[key].setOptions({name: key})
				} else {
					 fieldopt.options.attribute = fieldopt.options.attribute || key
					_fields[ key ] = fieldopt;
				}
				_fields[key].augment( this, key );

				Object.defineProperty( this, key,{
					get: function(){
						return _fields[ key ]
					}
				})  
			}.bind( this ))

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
	,base_urls: function base_urls(){
		return [{
			route: interpolate(urljoin('/', '{{apiname}}','{{name}}','schema'), this.options).replace(/\/\//g, "/")
		  , handler: this.get_schema.bind( this )
		  , name:'schema'
		}
		,{
			route: interpolate(urljoin('/', '{{apiname}}', '{{name}}','{pk}'), this.options).replace(/\/\//g, "/")
		  , handler:this.dispatch_detail.bind( this )
		  ,name:'list'
		}
		,{
			route: interpolate(urljoin('/', '{{apiname}}', '{{name}}'),this.options).replace(/\/\//g, "/")
		  , handler: this.dispatch_list.bind( this )
		  ,name:'detail'
		}];
	}
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
	,dispatch: function dispatch( action, bundle ){
		var httpmethod
		  , requestmethod
		  , methodsallowed
		  , canDispatch
		  , method
		  , options
		  , req
		  , res
		  ;


		req            = bundle.req
		res            = bundle.res

		options           = this.options
		requestmethod  = (req.headers['x-method-override'] || req.method).toLowerCase()
		httpmethod     = util.format('%s_%s', requestmethod, action );
		method         = this[ httpmethod ];
		methodsallowed = options[ util.format('%sMethodsAllowed', action)] || {}
		canDispatch    = this.check( requestmethod, methodsallowed );
		if( !method ){
			var err = new exceptions.NotImplemented({
				message:util.format('%s for %s', requestmethod.toUpperCase(), req.path )
			})
			err.req = req;
			err.res = res;
			return res(err)
			return this.emit('error',  err );
		}

		if(!canDispatch ){
			return http.methodNotAllowed( bundle.res )
		}

		debug('dispatching %s %s', httpmethod, action );
		//this.is_authenticated( bundle )
		this.domain.run( method.bind( this, bundle) )
	}

	/**
	 * disaptches a list request operating on a collection of objects.
	 * If any additional check / balances or processing needs to occur before a request is actually
	 * dispatched to the handler, this would be a good place to do that.
	 * @method module:tastypie/lib/resource#dispatch_list
	 * @param {Request} request A hapijs request object
	 * @param {Function} reply A hapis reply function
	 **/
	,dispatch_list: function list(req, reply){

		return this.dispatch('list', this.bundle( req, reply ) )
	}

	/**
	 * Top level function used to handle get requests for listing endpoints. It handles paging and serialization
	 * @method module:tastypie/lib/resource#get_list
	 * @param {Bundle} bundle A bundle representing the current request
	 **/
    ,get_list: function get_list( bundle ){
		this._get_list( bundle,function( e, objects ){
			var that = this
			  , to_be_serialize
			  ;
			objects = objects || [];
			objects = this.sort( JSON.parse(objects) );
			debug('paging')
			var paginator = new this.options.paginator({
				limit:rbundle.req.query.limit || 0
				,req:bundle.req
				,res:bundle.res
				,collectionName:this.options.collection
				,objects:objects
			});
			to_be_serialize = paginator.page();
			debug('serializing')
			to_be_serialize[ this.options.collection ] = to_be_serialize[ this.options.collection ].map( function( item ){
				return that.full_dehydrate( item, bundle )
			});
			bundle.data = to_be_serialize
			debug('responding')
			return this.respond( bundle )
		}.bind( this ));
	}

	/**
	 * Top level method used to handle post request to listing endpoints. Used to create new instances
	 * of the associated resource
	 * @method module:tastypie/lib/resource#post_list
	 * @param {Bundle} bundle An object represneting the current `POST` request
	 **/
	,post_list: function post_list( bundle ){
		var that = this;
		var response = http.created
		bundle.data = bundle.req.payload
		
		// _post_list must save the object
		this._post_list( bundle, function(err, bndl ){
			if( err ){
				return that.emit('error', err )
			}

			if(!that.options.returnData ){
				bundle.data = null
				response = http.noContent
			} else {
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
	,put_detail: function put_list( bundle ){
		var that = this;
		var response = http.accepted
		bundle.data = bundle.req.payload
		
		// _put_detail must save the object
		this.update_object( bundle, function(err, bndl ){
			if( err ){
				return that.emit('error', err )
			}

			if(!that.options.returnData ){
				bundle.data = null
				response = http.noContent
			}
			
			bndl.data = that.full_dehydrate( bndl.object, bndl )
			return that.respond( bndl, response );
		});
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#_post_list
	 * @param {bundle} NAME
	 * @param {Function} NAME
	 * @return
	 **/
	,_post_list: function _post_list( bundle, callback ){
		var e = new exceptions.NotImplemented("_post_list is not implemented")
		e.req = bundle.req
		e.res = bundle.res

		callback( e )
	}

	/**
	 * Internal method used to retrieve a full list of objects for a resource
	 * @method module:tastypie/lib/resource#_get_list
	 * @param {module:tastypie/lib/resource~Bundle} bundle
	 * @param {NodeCallback} callback callback function to call when data retrieval is omplete
	 **/
	,_get_list: function _get_list( bundle, callback ){
		var e = new exceptions.NotImplemented("_get_list is not implemented")
		e.req = bundle.req
		e.res = bundle.res
		callback( e )
	}

	/**
	 * creates an object to be used to filter data before it is returns. 
	 * **NOTE** this needs to be implemented to suit the the data source backend 
	 * @method module:tastypie/lib/resource#buildFilters
	 * @param {Object} fiters An object of requested filters
	 * @return {Object} filters An object of filter definitions suitable to be pased to the data backend
	 **/
	,buildFilters:function buildFilters( query ){
		return query;
	}

	/**
	 * Dispatches detail requests which operated on a sigular, specific object
	 * @method module:tastypie/lib/resource#dispatch_detail
	 * @param {Request} req An express request object
	 * @param {Response} rep An express response object
	 * @param {Function} next An express next callback
	 **/
	,dispatch_detail: function detail( req, res ){
		debug('dispatching %s detail', req.method);

		return this.dispatch('detail', this.bundle( req, res ) )
	}

   /**
	 * Top level method used to retreive indiidual objects by id. 
	 * This method handles caching results as well as reading from the cache
	 * @where applicable
	 * @method module:tastypie/lib/resource#get_detail
	 * @param {Bundle} bundle A bundle representing the current request.
	 **/
	,get_detail: function get_detail( bundle ){
		debug('get_detail')
		this._from_cache('detail', bundle, function(err, data){
			data = this.full_dehydrate( data, bundle )
			bundle = this.bundle(bundle.req, bundle.res, data )
			return this.respond( bundle )
		}.bind( this ))
	}


	/**
	 * reads a valeue from the specified cache backend by name. If nothing is found in
	 * cache it wil call {@link module:tastypie/lib/resource#get_object|get_object}
	 * @protected
	 * @method module:tastypie/lib/resource#_from_cache
	 * @param {String} type of request ( list, detail, updload, etc)
	 * @param {Bundle} bundle A bundle representing the current request
	 * @param {Function} callback A calback function to use whkf
	 **/
	,_from_cache:function _from_cache( type, bundle, callback ){
		debug('_from_cache')
		var key = this.cacheKey(
			type
			,bundle.req.info.api_name
			,bundle.req.path
			,bundle.req.method
			,this.options.name
			,bundle.req.query
			,bundle.req.params
		)
		var obj = this.options.cache.get(key, function(err, obj ){

			var that = this;
			if( obj ){
				console.log("CACHE HIT! %s", key)
				return callback( err, obj )
			}

			this.get_object( bundle, function( err, obj ){
				that.options.cache.set( key, obj )
				callback( err, obj )
			});
		}.bind( this ))
		
	}

	/**
	 * Method used to retrieve a specific object
	 * **NOTE** This method *must* be implement for specific use cases. The default does not implement this method
	 * @method module:tastypie/lib/resource#get_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle
	 * @param {NodeCallback} callback
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
	,get_object: function get_object( bundle, callback ){
		var e = new exceptions.NotImplemented("get_object is not implemented");
		e.req = bundle.req;
		e.res = bundle.res;
		e.next = bundle.next;
		this.emit('error',  e);
	}

	/**
	 * Method that is responsibe for updating a specific object during a *PUT* request
	 * @method module:tastypie/lib/resource#update_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle The data bundle representing the current request
	 * @param {NodeCallback} callback callback to be called when the operation finishes.
	 **/
	,update_object: function update_object( bundle, callback ){
		var e = new exceptions.NotImplemented('update_object')
		e.req = bundle.req;
		e.res = bundle.res;
		return callback && callback( e );

	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#cacheKey
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return {String} key A valid cache key for the current request
	 **/
	,cacheKey: function cacheKey( type, api, uri, method, resource, query ){
		return util.format(
			"%s:%s:%s:%s:%s:%s"
			,type
			,api
			,uri
			,method.toLowerCase()
			,resource
			,qs.stringify( query || EMPTY_OBJECT )
		)
	}

	/**
	 * Top level method for generating resource specific schemas for *GET* requests 
	 * @method module:tastypie/lib/resource#get_schema
	 * @param {Request} request A Hapi.js request object
	 * @param {Function} reply A hapi.js reply function
	 **/
	,get_schema: function schema(req, res ){

		var data = {};
		var urls = this.routes
		var that = this;
		var base  = this.options.apiname || "/"
		
		var bundle = this.bundle(req,res, this.build_schema() )
		this.respond( bundle )
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource# build_schema
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	, build_schema: function(){
		var that = this;
			return {
				methodsAllowed: Object.keys( this.options.methodsAllowed ).filter( function( method ){ return !!that.options.methodsAllowed[method]})
				,filtering:{}
				,limit:0
				,format:this.options.serializer.options.defaultFormat 
				,fields: object.map( this.fields, function( field ){

					return {
						'default': field.default,
						'type': field.type(),
						'nullable': field.options.null,
						'blank': !!field.options.blank,
						'readonly': !!field.options.readonly,
						'help_text': field.options.help,
						'unique': !!field.options.unique,

					}
				})

			};
	}

	/**
	 * A method which returns additaional urls to be added to the default uri defintion of a resource
	 * @method module:tastypie/lib/resource#prepend_urls
	 * @return Array an empty array
	 **/
	,prepend_urls: function( ){
		return this.options.routes || [];
	}

	/**
	 * A hook before serialization to converte and complex objects or classes into simple serializable objects
	 * @method module:tastypie/lib/resource#full_dehydrate
	 * @param {Object} obj an object to dehydrate object
	 * @return Object An object containing only serializable data
	 **/
	,full_dehydrate: function( obj, bundle){
		var _obj = {};
		for( var field in this.fields ){
			_obj[ field ] = this.fields[ field ].dehydrate( obj )

			var methodname = 'dehydrate_' + field;
			var method = this[ methodname ]

			if( method ){
				_obj[field] = method.call(this, obj,  bundle, _obj )
			}
		}

		_obj = this.dehydrate( _obj )
		return _obj;
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#full_hydrate
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,full_hydrate: function( bundle ){
		var tpl = this.options.objectTpl;
		bundle = this.hydrate( bundle )
		bundle.object = bundle.object || typeof tpl == 'function' ? new tpl : Object.create( tpl );
		var attr

		for( var fieldname in this.fields ){
			var field = this.fields[ fieldname ];
			var methodname = util.format( 'hydrate_%s', fieldname );
			var method = this[ methodname ];

			if( isFunction( method ) ){
				bundle = method( bundle )
			}
			
			var value;
			attr = field.options.attribute
			if( attr){

				set( bundle.object, attr, field.hydrate( bundle ) )
			}

		}
		return bundle
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#hydrate
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,hydrate: function( bundle ){
		return bundle;
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#to_uri
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,to_uri: function to_uri( obj, bundle, result ){
		return urljoin( this.options.apiname, this.options.name, this.pk( obj, bundle, result ))
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#pk
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,pk: function pk( orig, bundle, result ){
		var pk_field;

		pk_field = this.options.pk || 'id'

		return  orig[pk_field] || result[pk_field] || ( bundle.data && bundle.data[pk_field]) || null;
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#dehydrate
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,dehydrate: function dehydrate( obj ){
		return obj
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#dehydrate_uri
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,dehydrate_uri: function( obj, bundle, result ){
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
	,respond: function respond( bundle, cls, cb ){
		cls = cls || http.ok;
		var format = this.format( bundle, this.options.serializer.types );

		var reply = cls( bundle.res, bundle.data, format );
		return cb && cb( null, reply );
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#error
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,error: function error( bundle, err, cls ){
		cls = cls || http.badRequest;
		var format = this.format( bundle.req, bundle.res, this.options.serializer.types );

		this.serialize({
			status:400
			,msg:err.message
		}, format, function(err, data ){
			cls( bundle.res, data , format );
		}.bind(this));	

	
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#exception
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,exception: function exception( err ){
		var req = err.req
		var reply = err.res;
		var format;
		
		
		if( !reply ){
			throw err;
		}

		format = this.format( err, this.options.serializer.types );
		err.req = err.res = undefined;
		this.serialize( {name:err.name, message:err.message, code:err.code||500}, format, EMPTY_OBJECT, function(serr, data ){
			var e = Boom.wrap(err, data.code, data.message)
			e.output.payload = data;
			return reply( e )
		}.bind(this));	
	}
	/**
	 * Attempts to determin the best serialization format for a given request
	 * @method module:tastypie/lib/resource#format
	 * @param {Bundle|Object} bundle A bundle object or similar object
	 * @param {Array} [types] An array of possible content types this resource can deal with. 
	 * @return
	 **/
	,format: function format( bundle, types ){
		var fmt  = bundle.req.query && bundle.req.query.format
		var ct = this.options.serializer.convertFormat( fmt )
		
		if( fmt && !ct ){
			return bundle.res && bundle.res(new Boom.unsupportedMediaType( 'Unsupported format: ' + fmt ) )
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
	,bundle: function bundle( req, res, data ){
		return { req:req, res:res, data:data || {}, toJSON:to_json }
	}

	/**
	 * Converts a valid object in to a string of the specified format
	 * @method module:tastypie/lib/resource#serialize
	 * @param {Object} data Data object to be serialized before delivery
	 * @param {String} format the 
	 * @param {Function} callback
	 * @return
	 **/
	,serialize: function serialize( data, format, options, callback ){
		this.options.serializer.serialize(
			data
		  , format
		  , options || EMPTY_OBJECT
		  , callback
		);
	}

	/**
	 * DESCRIPTION
	 * @method module:tastypie/lib/resource#deserialize
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,deserialize: function deserialize( data, format, callback ){
		this.options.serializer.deserialize(
			data
		  , format
		  , callback
		);
	}

	/**
	 * Applies custome sorting to a given list of objects. Default applies no sorting
	 * @method module:tastypie/lib/resource#sort
	 * @param {Array} list The list of objects to be sorted
	 * @return Array of sorted objects
	 **/
	,sort: function sort( obj_list ){
		return obj_list;
	}

	/**
	 * Applies custom filtering to a given set of objects.
	 * @method module:tastypie/lib/resource#filter
	 * @param {TYPE} NAME ...
	 * @param {TYPE} NAME ...
	 * @return {TYPE} DESCRIPTION
	 **/
	,filter: function filter( bundle, filters ){
		this.emit('error', new exceptions.NotImplemented("filter") )
	}

	/**
	 * DESCRIPTION
	 * @private
	 * @method module:tastypie/lib/resource#toString
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,toString: function toString( ){
		return '[object Resource]'
	}

	/**
	 * DESCRIPTION
	 * @private
	 * @method module:tastypie/lib/resource#$family
	 * @param {TYPE} NAME
	 * @param {TYPE} NAME
	 * @return
	 **/
	,$family: function $family( ){
		return 'resource'
	}
});
Object.defineProperties( Resource.prototype,{

	/**
	 * A mapping of uris and their associated handlers
	 * @method module:tastypie/lib/resource#outes
	 * @type Object
	 **/
	routes:{
		get: function( ) {
			if( !this._uricache ){
				this._uricache = ( this.prepend_urls() || [] ).concat( this.base_urls() )
			}
			return this._uricache.map(function( route ){
				return {
					path:route.route
					, method: route.method || "*"
					, handler: route.handler
					, config:{
						plugins:{
							tastypie:{
								name: route.name
							}
						}
					}
				};
			});
		}
	}

	/**
	 * An array of all registered uris on a given resource
	 * @property module:tastypie.resources.Resource.urls
	 * @type Array
	 **/
	,urls: {
		get: function( ){
			return  this.routes.map( function( uri ){
				return uri.path
			})
		}
	}
})

Resource.defineMutator = Class.defineMutator;

module.exports = Resource;

