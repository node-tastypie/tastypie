/ *jshint laxcomma:true, smarttabs: true */
'use strict';
/**
 * Provides data pagination and data payload stardization functionality
 * @module module:lib/paginator
 * @author Eric Satterwhite
 * @requires util
 * @requires module:class
 * @requires module:class/options
 * @requires mout/lang/kindOf
 * @since 0.1.0
 * @requires xml2js
 * @requires util
 * @requires url
 * @requires events
 * @requires Class
 * @requires Options
 * @requires isNumber
 * @requires clone
 * @requires exceptions
 * @requires debug
 **/


var  xml2js      = require( 'xml2js' )                       // xml2js
	, util       = require( 'util' )                         // util
	, url        = require( 'url' )                          // url
	, debug      = require( 'debug' )('tastypie:paginator' ) // debug
	, events     = require( 'events' )                       // events
	, isNumber   = require( 'mout/lang/isNumber' )           // isNumber
	, clone      = require( 'mout/lang/clone' )              // clone
	, Class      = require( './class' )                      // Class
	, Options       = require( './class/options' )                 // Options
	, Parent     = require( 'prime-util/prime/parentize' )    // Options
	, exceptions = require( './exceptions' )                 // exceptions
	, Paginator
	;

/**
 * Description
 * @class module:paginator.js.Thing
 * @param {TYPE} param
 * @example var x = new paginator.js.THING();
 */
module.exports = 
Paginator = Class(/* @lends module:tastypie/paginator.Paginator.prototype */{
    inherits:events.EventEmitter
  , mixin:[ Parent, Options ]
  , options:{
	  objects:[]
	, limit:null
	, max:1000
	, offset:0
	, req:null
	, res:null
	, collectionName: 'objects'
  }
  , constructor: function( options ){
		this.setOptions( options );
  }

  /**
   * Generates a page of a data set
   * @method module:tastypie/paginator.Paginator
   * @return page An array sliced from the original data set using offset & limit parameters
   **/
  , page: function page(){
	  var limit = this.limit();
	  var offset = this.offset();
	  var count = this.count();
	  var ret = {
		  options:{
			  count:count 
			, limit: limit
			, offset: offset
		  }
	  };

	  if( limit ){
		  ret.options.previous = this.previous( limit, offset, count );
		  ret.options.next = this.next( limit, offset, count );
	  }

	  ret[ this.options.collectionName ] = this.slice( limit, offset );
	  // dereference the request and respons
	  this.setOptions({
			req:undefined
		  , res:undefined
	  });
	  return ret;
  }
  /**
   * Returns  the uri for the next page if their is one
   * @method module:tastypie/paginator.Paginator#next
   * @param {Number} limit the number of items in the page
   * @param {Number} offset where in the data set to derive the page from
   * @param {Number} count the length of the current data set
   * @return uri the URI that can be used to retrieve the next page
   **/
  , next: function next( limit, offset, count ){
	  var value = limit + offset
	  if( value > count - 1 ){
		  return null;
	  }

	  return this.uri(limit, value)
  }
  /**
   * DESCRIPTION
   * @method module:tastypie/paginator.Paginator#offset
   * @param {TYPE} NAME
   * @param {TYPE} NAME
   * @return
   **/
  , offset: function offset( ){
	  var offset = this.options.offset;
	  var query = this.options.req.query || {};

	  if( query.offset != null ){
		  offset = parseInt( query.offset, 10 )
	  }

	  if( !isNumber( offset ) || offset<0 ){
		throw new exceptions.BadRequest("bad offset param")
	  }

	  return offset;
  }
  /**
   * Returns  the uri for the previous page if their is one
   * @method module:tastypie/paginator.Paginator#previous
   * @param {Number} limit the number of items in the page
   * @param {Number} offset where in the data set to derive the page from
   * @param {Number} count the length of the current data set
   * @return uri the URI that can be used to retrieve the previous page
   **/
  , previous: function previous( limit, offset, count ){
  
	  var value = offset - limit;
	  if( value < 0 ){
		  return null;
	  }

	  return this.uri( limit, value )
  }
  /**
   * returns the number of objects in the current data set
   * @method module:tastypie/paginator.Paginator#count
   * @return Number
   **/
  , count: function count(){
	  return Array.isArray( this.options.objects ) ? this.options.objects.length : 0;
  }
  /**
   * retuns a slice from the current data set to represent a page
   * @method module:tastypie/paginator.Paginator#slice
   * @param {Number} limit The maximum number of items to include in the slice
   * @param {Number} offset The starting position in the data set at which to start the slice
   * @return Array
   **/
  , slice: function slice(limit, offset ){
 	
	if( limit <=0 ){
		return this.options.objects.slice( offset, this.options.objects.length )
	}

	return this.options.objects.slice( offset, ( offset ) + limit )
  }
  /**
   * returns the number of items that should be included in the data set.
   * Checks req.query for limit or a configured limit option 
   * @method module:tastypie/paginator.Paginator#limit
   * @return Number
   **/
  , limit: function limit(){
	  var lmt;

	  lmt = parseInt( this.options.req && this.options.req.query.limit || this.options.limit || 25, 10);
	  lmt = Math.min( lmt, this.options.max);
	  if(!isNumber( lmt ) ){
		this.emit(
			'error'
			, new exceptions.BadRequest('limit must be a number')
		    , this.options.req
			, this.options.res	
		);
	  }

	  return lmt;
  }
  /**
   * generates a URI that will return page of data 
   * @method module:tastypie/paginator.Paginator#uri
   * @param {Number} limit The maximum number of items to include in the slice
   * @param {Number} offset The starting position in the data set at which to start the slice
   * @return
   **/
  , uri: function uri( limit, offset ){
	  var values = clone(this.options.req.query || {});

	  values.limit = limit;
	  values.offset = offset;
	  return url.format({
	  	 pathname:this.options.req.uri
	  	 ,query: values
	  });
  } 
});
