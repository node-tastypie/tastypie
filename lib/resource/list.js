/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true */
'use strict';
/**
 * Mixin class providing functionality for listing endpoints
 * @module tastypie/lib/resource/list
 * @author Eric Satterwhite
 * @since 1.0.1
 * @requires debug
 * @requires class
 * @requires class/options
 * @requires boom
 * @requires async
 * @requires mout/collection/forEach
 * @requires tastypie/lib/http
 * @requires tastypie/lib/class
 **/
var Boom         = require('boom')
  , co           = require('co')
  , EventEmitter = require('events').EventEmitter
  , async        = require('async')
  , isString     = require('mout/lang/isString')
  , each         = require('mout/collection/forEach')
  , debug        = require('debug')("tastypie:resources:list")
  , Class        = require('../class')
  , http         = require('../http')
  , List
  ;

/**
 * @mixin
 * @alias module:tastypie/lib/resource/list
 * @extends EventEmitter
 */
List = new Class({
	inherits: EventEmitter
	
	/**
	 * Internal method used during the `post_list` method
	 * @protected
	 * @method module:tastypie/lib/resource/list#create_object
	 * @param {Bundle} bundle A bundle representing the current request
	 * @param {module:tastypie/lib/resource~Nodeback} callback a callback function to call when the operation is complete
	 **/
	, create_object: function create_object( bundle, callback ){
		var e = Boom.notImplemented( "create_object is not implemented" );
		e.req = bundle.req;
		e.res = bundle.res;

		return Prommise.reject( e );
	}

	/**
	 * disaptches a list request operating on a collection of objects.
	 * If any additional check / balances or processing needs to occur before a request is actually
	 * dispatched to the handler, this would be a good place to do that.
	 * @method module:tastypie/lib/resource/list#dispatch_list
	 * @param {Request} request A hapijs request object
	 * @param {Function} reply A hapis reply function
	 **/
	, dispatch_list: function list( req, reply ){
		return this.dispatch( 'list', this.bundle( req, reply ) );
	}

	/**
	 * Top level function used to handle get requests for listing endpoints. It handles paging and serialization
	 * @method module:tastypie/lib/resource/list#get_list
	 * @param {Bundle} bundle A bundle representing the current request
	 **/
    , get_list:co.wrap(function* get_list( bundle ){
		let objects
		  , to_be_serialized
		  , paginator
		  , name
		  , apiname
		  ;

		objects   = yield this.get_objects( bundle );
		objects   = objects || '[]';

		if( isString( objects ) || Buffer.isBuffer( objects ) ){
			objects = JSON.parse(objects)
		}

		objects   = this.sort( objects );
		paginator = new this.options.paginator({
			limit: bundle.req.query.limit || this.options.limit
		  , req: bundle.req
		  , res: bundle.res
		  , collectionName: this.options.collection
		  , objects: objects
		});

		to_be_serialized = paginator.page();
		debug( ' %s %s : serializing', apiname,  this.options.name );
		let collection = to_be_serialized[ this.options.collection ];
		for( let idx in collection ){
			collection[ idx ] = yield this.full_dehydrate( collection[idx], bundle ); 
		}
		debug( ' %s %s : responding', apiname, name );
		bundle.data = to_be_serialized;
		apiname = name = paginator = to_be_serialized = null;
		return this.respond( bundle );
	})

	/**
	 * Internal method used to retrieve a full list of objects for a resource
	 * @method module:tastypie/lib/resource/list#get_objects
	 * @param {module:tastypie/lib/resource~Bundle} bundle
	 * @param {module:tastypie/lib/resource~Nodeback} callback callback function to call when data retrieval is
 	 **/
	, get_objects: function get_objects( bundle ){
		var e = Boom.notImplemented( "get_objects is not implemented" );
		e.req = bundle.req;
		e.res = bundle.res;
		return Promise.reject( e );
	}

	/**
	 * High level function called in response to an OPTIONS request. Returns with an Allow header and empty body
	 * @method module:tastypie/lib/resource/detail#options_detail
	 * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `OPTIONS` request
	 **/
	, options_list: function options_list( bundle ){
		bundle.data = null;
		return new Promise(function( reject, resolve ){
			this.respond( bundle, null, null, function( err, reply ){
				let methods = [];
				each( this.options.allowed.list, ( value, key ) => {
					if( value ){
						methods.push( key.toUpperCase() );
					}
				});
				reply.header('Allow',methods.join(','));
			}.bind( this ));
		}.bind( this ))
	}

	/**
	 * Top level method used to handle post request to listing endpoints. Used to create new instances
	 * of the associated resource
	 * @method module:tastypie/lib/resource/list#post_list
	 * @param {Bundle} bundle An object represneting the current `POST` request
	 **/
	, post_list: co.wrap(function* post_list( bundle ){
		let response = http.created
		  , format = this.format( bundle, this.options.serializer.types )
		  , that = this
		  , data
		  ;

		data   = yield this.deserialize( bundle.req.payload, format )
		bundle = yield this.create_object( this.bundle(bundle.req, bundle.res, data ) )

		if( !this.options.returnData ){
			bundle.data = null;
			return this.respond( bundle, http.noContent );
		} 

		bundle.data = yield this.full_dehydrate( bundle.object, bundle )
		return this.respond( bundle, response );
	})
});

module.exports = List;
