/*jshint laxcomma: true, smarttabs: true, node:true, unused:true, esnext:true */
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

  this.full_dehydrate(bundle.object, bundle, ( err, data ) => {
    if( err ){
      err = annotate( err, bundle );
      return this.emit( 'error', err );
    }
    bundle.data = data; 
    this.options.cache.set(bundle.toKey( 'detail' ) , null );
    return this.respond( bundle );
  });
}

/**
 * @mixin
 * @alias module:tastypie/lib/resource/detail
 */
Detail = new Class({


  delete_detail: function delete_detail( bundle ){
    return this.get_object( bundle, ( err, obj ) => {
      
      bundle.object = obj;

      if( !obj ){
        bundle.data = {
          message: `No object found at ${bundle.req.path}` 
          ,statusCode: 404
          ,error:'Not Found'
        };
        return this.respond(bundle, http.notFound);
      }

      this.remove_object( bundle, delete_db.bind( this, bundle ) );
    });
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
  , get_detail: function get_detail( bundle ){
    var that = this;
    this.from_cache( 'detail', bundle, function( err, data ){
      if( err ) return that.emit( 'error', annotate( err, bundle ) );

      if( !data ){
        let err = Boom.notFound(`No object found at ${bundle.req.path}`);
        return that.emit( 'error', annotate( err, bundle ) );
      }

      that.full_dehydrate( data, bundle, function( err, data ){
        bundle.data = data;
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
    var e = Boom.notImplemented("method get_object not implemented");
    e = annotate( e, bundle );
    e.next = bundle.next;
    setImmediate(callback, e );
  }

  /**
   * High level function called in response to an OPTIONS request. Returns with an Allow header and empty body
   * @method module:tastypie/lib/resource/detail#options_detail
   * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `OPTIONS` request
   **/
  , options_detail: function options_detail( bundle ){
    bundle.data = null;
    this.respond( bundle, null, null, ( err, reply ) => {
      let methods = [];
      each( this.options.allowed.detail,function( value, key ){
        if( value ){
          methods.push( key.toUpperCase() );
        }
      });
      reply.header('Allow',methods.join(','));
    });
  }

  /**
   * high level function called to handle PATCH requests
   * @method module:tastypie/lib/resource/detail#patch_detail
   * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `PATCH` request
   **/
  , patch_detail: function patch_detail( bundle ){
    var response = http.ok
      , that = this
      , format
      ;

    format = this.format( bundle, this.options.serializer.types );
    this.deserialize( bundle.req.payload, format, function( err, data ){
      bundle = that.bundle(bundle.req, bundle.res, data );
      // update_object must save the object
      that.update_object( bundle, function( err, bndl ){
        if( err ){
          return that.emit( 'error', annotate(err, bundle) );
        }

        if( !that.options.returnData ){
          bundle.data = null;
          response = http.noContent;
        } else {
          that.full_dehydrate( bndl.object, bndl, function( err, data ){
            if( err ){
              return that.emit( 'error', annotate(err, bundle) );
            }
            bndl.data = data;
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
    var response = http.ok
      , that = this
      , format
      ;

    format = this.format( bundle, this.options.serializer.types );
    this.deserialize( bundle.req.payload, format, function( err, data ){
      bundle = that.bundle(bundle.req, bundle.res, data );
      // replace_object must save the object
      that.replace_object( bundle, function( err, bndl ){
        if( err ){
          err = annotate(err, bundle);
          return that.emit( 'error', err );
        }

        if( !that.options.returnData ){
          bundle.data = null;
          response = http.noContent;
        }
        that.full_dehydrate( bndl.object, bndl, function( err, data ){
          if( err ){
            err = annotate(err, bundle);
            return that.emit( 'error', err );
          }
          bndl.data = data;
          return that.respond( bndl, response );
        });
      });
    });

  }

  /**
   * Low level function called to delete existing objects
   * @method module:tastypie/lib/resource/detail#remove_object
   * @param {module:tastypie/lib/resource~Bundle} bundle An object represneting the current `DELETE` request
   * @param {module:tastypie/lib/resource~NodeBack} callback a callback to be caled when finished
   **/
  , remove_object: function( bundle, callback ){
    var e = Boom.notImplemented('method remove_object not implemented');
    e = annotate( e, bundle );
    setImmediate( callback, e, null );
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
    setImmediate( callback, e, null );
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
    setImmediate(callback, e, null );
  }
});

module.exports = Detail;
