/*jshint laxcomma: true, node: true*/
'use strict'
var hapi         = require("hapi")
  , fs           = require('fs')
  , util           = require('util')
  , path         = require('path')
  , Api          = require('../lib/api')
  , http         = require('../lib/http')
  , _Resource    = require('../lib/resource')
  , Throttle     = require('../lib/throttle')
  , Cache        = require('../lib/cache')
  , urljoin      = require('../lib').urljoin
  , fields       = require('../lib/fields')
  , qs_validator = require('../lib/resource/validator/querystring')
  , joi          = require('joi')
  , Schema
  , Model
  , Endpoints
  , connection
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
	  , fake     : new fields.ApiFIeld({readonly:true})
	  , name     : {type:'char'}
	  , fullname : {type:'char'}
	  , city     : {type:'char', attribute:'company.address.city'}
	  , date     : {type:'datetime', attribute:'registered'}
	  , location : {type:'field', readonly: true}
	  , file     : new fields.FileField({create:true, root:path.resolve(__dirname)})
	}

	, constructor: function( opts ){
		this.parent('constructor', opts )
	}

	, dehydrate: function( obj ){
		return obj;
	}

	, dehydrate_fullname: function( obj ){
		return obj.gender + " " + obj.company.address.state;
	}

	, dehydrate_location: function( obj, bundle ){
		return [ obj.longitude, obj.latitude ];
	}
	, dehydrate_fake:function( obj, bundle ){
		return bundle.req.method + " " + obj.index
	}

	, dispatch_upload: function(req, reply ){
		return this.dispatch('upload', this.bundle( req, reply ) )
	}

	, get_objects: function(bundle, callback){
		fs.readFile( path.join(__dirname, 'data.json') , callback)
	}

	, get_object: function( bundle, callback ){
		this.get_objects(bundle,function(e, objects){
			var obj = JSON.parse( objects ).filter(function( obj ){
					return obj.guid == bundle.req.params.pk
				})[0]
				callback( null, obj )
			})
	}

	, post_list: function( bundle ){
		return bundle.res("done").code(201)
	}

	// Results should be sent using multipart/form-data 
	, post_upload: function( bundle ){
		var format = this.format( bundle, this.options.serializer.types );
		this.deserialize( bundle.req.payload, format, function( err, data ){
			bundle.data = data;
			bundle.object = {company:{address:{}}};

			this.fields.file.hydrate( bundle, function( err, value ){
				// quick and dirty respnose
				bundle.data = {file: value}
				this.respond( bundle )
			}.bind( this ));

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
