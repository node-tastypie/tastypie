
/*jshint laxcomma: true, smarttabs: true, node:true, unused:true, esversion:6, esnext:true */
'use strict';
/**
 * Mixin class providing functionality for detail endpoints
 * @module tastypie/lib/resource/detail
 * @author Eric Satterwhite
 * @since 1.0.1
 * @requires boom
 * @requires mout/collection/forEach
 * @requires tastypie/lib/class
 * @requires tastypie/lib/http
 **/
var Boom         = require('boom')
  , co           = require('co')
  , each         = require('mout/collection/forEach')
  , Class        = require('../class')
  , http         = require('../http')
  , Detail
  ;


function annotate( err, bundle ){
	if(!err){
		return err;
	}

	err.req = bundle.req;
	err.res = bundle.res;
	return err;
}

function delete_db( bundle, err, data ){
	if( err ){
		err = annotate( err );
		return this.emit( 'error', err );
	}

	if(!this.options.returnData){
		return this.respond( bundle, http.noContent );
	}

	return this.full_dehydrate(bundle.object, bundle)
		.then(( data )=>{
			bundle.data = data;	
			this.options.cache.set(bundle.toKey( 'detail' ) , null );
			return this.respond( bundle );
		})
		.catch(( err )=>{
			err = annotate( err, bundle );
			return this.emit( 'error', err );
		});
}

/**
 * @mixin
 * @alias module:tastypie/lib/resource/detail
 */
Detail = new Class({


	delete_detail: function* delete_detail( bundle ){
		let obj = yield this.get_object( bundle )
		bundle.object = obj;

		if( !obj ){
			bundle.data = {
				message: `No object found at ${bundle.req.path}` 
				,statusCode: 404
				,error:'Not Found'
			};
			return this.respond(bundle, http.notFound);
		}

		yield this.remove_object( bundle );
		delete_db( bundle );
		return obj;
	}

	/**
	 * Dispatches detail requests which operated on a sigular, specific object
	 * @method module:tastypie/lib/resource/detail#dispatch_detail
	 * @param {Request} req An express request object
	 * @param {Response} rep An express response object
	 * @param {Function} next An express next callback
	 **/
	, dispatch_detail: function dispatch_detail( req, res ){
		return this.dispatch( 'detail', this.bundle( req, res ) );
	}

    /**
	 * Top level method used to retreive indiidual objects by id.
	 * This method handles caching results as well as reading from the cache
	 * @where applicable
	 * @method module:tastypie/lib/resource/detail#get_detail
	 * @param {Bundle} bundle A bundle representing the current request.
	 **/
	, get_detail:function* get_detail( bundle ){
		let data = yield this.from_cache( 'detail', bundle )
		if( !data ){
			bundle.data = {
				message: `No object found at ${bundle.req.path}` 
			  , statusCode: 404
			  , error:'Not Found'
			};
			return this.respond( bundle, http.notFound );
		}

		let hydrated = yield this.full_dehydrate( data, bundle );
		bundle = this.bundle( bundle.req, bundle.res, hydrated );
		return this.respond( bundle );
	}
	/**
	 * Method used to retrieve a specific object
	 * **NOTE** This method *must* be implement for specific use cases. The default does not implement this method
	 * @method module:tastypie/lib/resource/detail#get_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle
	 * @param {module:tastypie/lib/resource~Nodeback} callback
	 * @example
var MyResource = Resource.extend({
	get_object: function( bundle, callback ){
		Model.get( bundle.req.params.pk, callback )
	}
})
	 * @example
var MyResource = new Class({
	inherits: Resource
	, get_object: function( bundle, callback ){
		this.get_objects(bundle,function(e, objects){
			var obj = JSON.parse( objects ).filter(function( obj ){
				return obj._id = bundle.req.params.pk
			})[0]
			callback( null, obj )
		})
	}
})
	 **/
	, get_object: function get_object( bundle ){
		var e = Boom.notImplemented("method get_object not implemented");
		e = annotate( e, bundle );
		e.next = bundle.next;
		return Promise.reject( e );
	}

	/**
	 * High level function called in response to an OPTIONS request. Returns with an Allow header and empty body
	 * @method module:tastypie/lib/resource/detail#options_detail
	 * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `OPTIONS` request
	 **/
	, options_detail: function options_detail( bundle ){
		bundle.data = null;
		return new Promise(function( resolve, reject ){
			this.respond( bundle, null, null, function( err, reply ){
				let methods = [];
				if(err){
					return reject( err )
				}
				each( this.options.allowed.detail,( value, key ) => {
					if( value ){
						methods.push( key.toUpperCase() );
					}
				});
				reply.header('Allow',methods.join(','));
				resolve( reply )
			}.bind( this ));
		}.bind( this ))
	}

	/**
	 * high level function called to handle PATCH requests
	 * @method module:tastypie/lib/resource/detail#patch_detail
	 * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `PATCH` request
	 **/
	, patch_detail:function* patch_detail( bundle ){
		let response = http.ok
		  , that = this
		  , format
		  ;

		format        = this.format( bundle, this.options.serializer.types );
		bundle.data   = yield this.deserialize( bundle.req.payload, format);
		bundle        = yield this.update_object( bundle )

		if( !this.options.returnData ){
			bundle.data = null;
			response = http.noContent;
		} else {
			let dehydrated = yield this.full_dehydrate( bundle.object, bundle);
			bundle.data = dehydrated;
		}

		return this.respond( bundle, response );
	}

	/**
	 * Top level method used to handle post request to listing endpoints. Used to update instances with supplied data
	 * @method module:tastypie/lib/resource/detail#put_detail
	 * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `PUT` request
	 **/
	, put_detail: function* put_detail( bundle ){
		var response = http.ok
		  , that = this
		  , format
		  , data
		  ;

		format        = this.format( bundle, this.options.serializer.types );
		bundle.data   = yield this.deserialize( bundle.req.payload, format )
		bundle        = yield this.replace_object( bundle )

		if( !this.options.returnData ){
			bundle.data = null;
			response = http.noContent;
		}

		bundle.data = yield this.full_dehydrate( bundle.object, bundle ) 
		return this.respond( bundle, response );
	}

	/**
	 * Low level function called to delete existing objects
	 * @method module:tastypie/lib/resource/detail#replace_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `DELETE` request
	 * @param {module:tastypie/lib/resource~NodeBack} callback a callback to be caled when finished
	 **/
	, remove_object: function( bundle, callback ){
		var e = Boom.notImplemented('method remove_object not implemented');
		e = annotate(e, bundle);
		return Promise.reject( e );
	}

	/**
	 * Low level function called to replace existing objects
	 * @method module:tastypie/lib/resource/detail#replace_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `PUT` request
	 * @param {module:tastypie/lib/resource~NodeBack} callback a callback to be caled when finished
	 **/
	, replace_object: function replace_object( bundle, callback ){
		var e = Boom.notImplemented("method replace_object not implemented");
		e = annotate(e, bundle);
		return Promise.reject( e );
	}

	/**
	 * Method that is responsibe for updating a specific object during a *PUT* request
	 * @method module:tastypie/lib/resource/detail#update_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle The data bundle representing the current request
	 * @param {module:tastypie/lib/resource~Nodeback} callback callback to be called when the operation finishes.
	 **/
	, update_object: function update_object( bundle, callback ){
		var e = Boom.notImplemented("method update_object not implemented");
		e = annotate(e, bundle);
		return Promise.reject( e );
	}
});

module.exports = Detail;
