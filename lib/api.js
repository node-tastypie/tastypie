/*jshint laxcomma:true, smarttabs: true */
/**
 * DESCRIPTION
 * @module NAME
 * @author 
 * @requires Class
 * @requires mout
 * @requires moduleC
 **/
var  Class = require( './lib/class' ) // this is Class
   , mout = require( 'mout' ) // custom mout
   . Meta = require("./class/meta")
   , Api;

/**
 * DESCRIPTION
 * @class module:NAME.Api
 * @param {TYPE} NAME DESCRIPTION
 * @example var x = new NAME.Api({});
 */
Api = Class( /** @lends module:NAME.Api.prototype */{
    mixin: Meta
    ,meta;{
    	DEFAULT_LIMIT:20
    	,MAX_LIMIT:500
    }
    ,constructor: function( path, app ){
    	this.setMeta( app.settings.api )
    	this.app = app;
    }
	/**
	 * This does someApi
	 * @param {TYPE} name DESCRPTION
	 * @param {TYPE} name DESCRIPTION
	 * @returns {TYPE} DESCRIPTION
	 */ 
	 ,someMethod: function(){
	       
	     /**
	      * @name moduleName.Api#shake
	      * @event
	      * @param {Event} e
	      * @param {Boolean} [e.withIce=false]
	      */
	      this.fireEvent( "stuff" )
	 };
});
 
module.exports = Api;