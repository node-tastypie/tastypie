/*jshint laxcomma: true, node: true*/
'use strict'
var hapi         = require("hapi")
  , fs           = require('fs')
  , path         = require('path')
  , Api          = require('../lib/api')
  , _Resource    = require('../lib/resource')
  , Cache        = require('../lib/cache')
  , fields       = require('../lib/fields')
  , server
  , port
  , v1
  ;

port       = process.env.PORT || 3000
server     = new hapi.Server()

server.connection({
	port:port,
	host:'0.0.0.0',
	labels:['main']
})


var Base = _Resource.extend({
	options:{
		pk:'guid'
		,cache: new Cache({engine:'catbox-memory'})
		,allowed:{
			upload:{
				get:true,
				post:true
			}
		}

	}

	,fields:{
	    age      : { type:'int' }
	  , fake     : new fields.ApiField({readonly:true})
	  , name     : {type:'char'}
	  , fullname : {type:'char'}
	  , city     : {type:'char', attribute:'company.address.city'}
	  , date     : {type:'datetime', attribute:'registered'}
	  , location : {type:'field', readonly: true}
	  , file     : new fields.FileField({create:true, root:path.resolve(__dirname), exclude: true})
	}

	, constructor: function( opts ){
		this.parent('constructor', opts )
	}

	, dehydrate_fullname: function( obj ){
		return `${obj.gender} ${obj.company.address.state}`;
	}

	, dehydrate_location: function( obj /*, bundle */ ){
		return [ obj.longitude, obj.latitude ];
	}
	, dehydrate_fake:function( obj, bundle ){
		return `${bundle.req.method} ${obj.index}`;
	}

	, dispatch_upload: function( req, reply ){
		return this.dispatch('upload', this.bundle( req, reply ) );
	}

	, get_objects: function(bundle){
		return new Promise(function( resolve, reject){
			fs.readFile( path.join(__dirname, 'data.json') , (err, buf)=>{
				if( err ){
					reject( err )
				} else {
					resolve( buf )
				}
			});
		});
	}

	, get_object: function*( bundle ){
		let objects = yield this.get_objects(bundle)
		return JSON.parse( objects ).filter(function( obj ){
			return obj.guid === bundle.req.params.pk;
		})[0];
	}

	// return a yieldable object
	, post_list: function( bundle ){
		return Promise.resolve( bundle.res("done").code(201) )
	}

	// use a generator function
	// Results should be sent using multipart/form-data 
	, post_upload: function*( bundle ){
		let format = this.format( bundle, this.options.serializer.types );
		bundle.data = yield this.deserialize( bundle.req.payload, format);
		bundle.object = {company:{address:{}}};
		this.fields.file.hydrate( bundle, function( err, value ){
			// quick and dirty respnose
			bundle.data = {file: value}
			this.respond( bundle )
		}.bind( this ));
	}

	, prepend_urls:function(){
		return [{
			path: '/api/v1/data/upload'
			, handler: this.dispatch_upload.bind( this )
			, name:'upload'
			, config:{
				payload:{
					output:'stream'
					,maxBytes: 3 + Math.pow(1024, 2)
					,parse: true
				}
			}
			}]
		}
});

// Api setup
v1 = new Api('api/v1');
v1.use('data', new Base )

server.register( [v1, require('vision'), require('inert'), require('tv')], function(){
	server.start(function(){
		console.log(`server running at http://${server.info.host}:${server.info.port}` );
	})

});


module.exports = Base;
