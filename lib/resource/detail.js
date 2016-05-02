
/*jshint laxcomma: true, smarttabs: true, node:true */
'use strict';
/**
 * Mixin class providing functionality for detail endpoints
 * @module tastypie/lib/resource/detail
 * @author Eric Satterwhite
 * @since 1.0.1
 * @requires boom
 * @requires tastypie/lib/class
 * @requires tastypie/lib/http
 **/
var util         = require('util')
  , Boom         = require('boom')
  , Class        = require('../class')
  , http         = require('../http')
  , Detail
  ;

/**
 * @mixin
 * @alias module:tastypie/lib/resource/detail
 */
Detail = new Class({

	/**
	 * Dispatches detail requests which operated on a sigular, specific object
	 * @method module:tastypie/lib/resource/detail#dispatch_detail
	 * @param {Request} req An express request object
	 * @param {Response} rep An express response object
	 * @param {Function} next An express next callback
	 **/
	dispatch_detail: function detail( req, res ){
		return this.dispatch( 'detail', this.bundle( req, res ) );
	}

    /**
	 * Top level method used to retreive indiidual objects by id.
	 * This method handles caching results as well as reading from the cache
	 * @where applicable
	 * @method module:tastypie/lib/resource/detail#get_detail
	 * @param {Bundle} bundle A bundle representing the current request.
	 **/
	, get_detail: function get_detail( bundle ){
		var that = this;
		this.from_cache( 'detail', bundle, function( err, data ){

			if( err ){
				err.req = bundle.req;
				err.res = bundle.res;
				return that.emit( 'error', err );
			}

			if( !data ){
				bundle.data = {
					message: util.format( 'No object found at %s', bundle.req.path )
					,statusCode: 404
					,error:'Not Found'
				};
				return that.respond( bundle, http.notFound );
			}

			that.full_dehydrate( data, bundle, function( err, data ){
				bundle = that.bundle( bundle.req, bundle.res, data );
				return that.respond( bundle );
			});
		});
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
	, get_object: function get_object( bundle, callback ){
		var e = new Boom.notImplemented("method get_object not implemented");
		e.req = bundle.req;
		e.res = bundle.res;
		e.next = bundle.next;
		callback && callback( e )
	}

	, patch_detail: function patch_detail( bundle ){
		var response = http.accepted
		  , that = this
		  ;

		this.deserialize( bundle.req.payload, format, function( err, data ){
			bundle = that.bundle(bundle.req, bundle.res, data );
			// update_object must save the object
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
						if( err ){
							err.req = bundle.req;
							err.res = bundle.res;
							return that.emit( 'error', err );
						}
						bundle.data = data;
						return that.respond( bndl, response );
					});
				}
			});
		});


	}

	/**
	 * Top level method used to handle post request to listing endpoints. Used to update instances with supplied data
	 * @method module:tastypie/lib/resource/detail#put_detail
	 * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `PUT` request
	 **/
	, put_detail: function put_detail( bundle ){
		var response = http.accepted
		  , that = this
		  ;

		this.deserialize( bundle.req.payload, format, function( err, data ){
			bundle = that.bundle(bundle.req, bundle.res, data );
			// replace_object must save the object
			this.replace_object( bundle, function( err, bndl ){
				if( err ){
					err.req = bundle.req;
					err.res = bundle.res;
					return that.emit( 'error', err );
				}

				if( !that.options.returnData ){
					bundle.data = null;
					response = http.noContent;
				}
				that.full_dehydrate( bndl.object, bndl, function( err, data ){
					if( err ){
						err.req = bundle.req;
						err.res = bundle.res;
						return that.emit( 'error', err );
					}
					bundle.data = data;
					return that.respond( bndl, response );
				});
			});
		});

	}

	/**
	 * Low level function called to replace existing objects
	 * @method module:tastypie/lib/resource/detail#replace_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `PUT` request
	 * @param {module:tastypie/lib/resource~NodeBack} callback a callback to be caled when finished
	 **/
	,replace_object: function replace_object( bundle, callback ){
		var e = new Boom.notImplemented("method get_object not implemented");
		e.req = bundle.req;
		e.res = bundle.res;
		return callback && callback( e );
	}

	/**
	 * Method that is responsibe for updating a specific object during a *PUT* request
	 * @method module:tastypie/lib/resource/detail#update_object
	 * @param {module:tastypie/lib/resource~Bundle} bundle The data bundle representing the current request
	 * @param {module:tastypie/lib/resource~Nodeback} callback callback to be called when the operation finishes.
	 **/
	, update_object: function update_object( bundle, callback ){
		var e = new Boom.notImplemented("method update_object not implemented");
		e.req = bundle.req;
		e.res = bundle.res;
		return callback && callback( e );
	}
});

module.exports = Detail;
