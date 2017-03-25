/*jshint laxcomma: true, smarttabs: true, node: true*/
'use strict';
/**
 * A field type for dealing with incoming file streams.
 * Will write the file to a location and store its path
 * @module tastypie/fields/file
 * @author Eric Satterwhite
 * @since 0.5.0
 * requires os
 * requires fs
 * requires path
 * requires url-join
 * requires boom
 * requires mkdirp
 * @requires tastypie/lib/class
 * @requires tastypie/lib/fields/api
 */

var os       = require( 'os' )
  , fs       = require( 'fs' )
  , path     = require( 'path' )
  , urljoin  = require( 'url-join' )
  , boom     = require( 'boom' ) 
  , mkdirp   = require( 'mkdirp' )
  , Class    = require( '../class' )
  , ApiField = require( './api' )
  , FileField
  ;

/**
 * @constructor
 * @alias module:tastypie/fields/file
 * @extends module:tastypie/fields/api
 * @param {Object} options
 * @param {Boolean} [options.stream=false]
 * @param {String} [options.root=os.tempDir()]
 * @param {String} [options.dir]
 * @param {Boolean} [options.create=false] Auto create the resolved directory
 */
FileField = new Class({
  inherits: ApiField
  , options:{
      root: os.tmpDir(),
      dir: 'uploads',
      create: false
  }
  ,constructor: function( options ){
    this.parent('constructor', options );

    try {
      this.options.create && mkdirp.sync( path.join( this.options.root, this.options.dir ) );
    } catch( e ){
      if( e.code && e.code !== 'EEXIST' ){
        this.emit('error', boom.wrap( e ) );
      }
      // pass. don't care;
    }
  }

  , convert: function( value ){
      return urljoin( this.options.dir, path.basename( value ) );
  }
  
  , hydrate: function( bundle, cb ){
      var fpath  // file path to write
        , out    // output write stream
        ;

      this.parent('hydrate', bundle, ( err, value ) => {
        fpath = path.join( this.options.root, this.options.dir,  value.hapi.filename );
        out   = fs.createWriteStream( fpath );
        value.once('error', cb );
        value.once('end', cb.bind( null, null, fpath ) );
        value.pipe( out );
      });
  }
});
module.exports = FileField;
