/*jshint laxcomma: true, smarttabs: true, node: true, mocha: true*/
'use strict';

var should = require("should")
  , assert   = require('assert')
  , hapi     = require('hapi')
  , Api      = require('../lib/api')
  , Resource = require( '../lib/resource' )
  , xml2js   = require('xml2js')
  , Serializer = require('../lib/serializer')
  , FakeResource
  ;


FakeResource = Resource.extend({
	options:{
		allowed:{
			detail:{get:true, put: true, patch:true, post: true, delete: true}
		}
	}
	, fields:{
		name:{type:'char'}
		,color: {type:'char', required:true, nullable: false}
	}
	,constructor: function( options ){
		this.parent('constructor', options);
	}
	,get_list: function( bundle ){
		bundle.res({
			data:[
				{a:1,b:2}
				,{a:2,b:3}
			]
		})
	}


})

describe('api', function(){
	var server, v1;

	before(function( done ){
		
		server = new hapi.Server();
		v1     = new Api('api/v1',{
			serializer: new Serializer()
		});
		
		v1.use('fake', new FakeResource({ }) );

		server.connection({ host:'0.0.0.0' });
		server.register( v1, function( ){
			server.start( done );
		});
	});

	it('should accept a request',function( done ){
		server.inject({
			url:'/api/v1'
			,method:'get'
			,headers:{
				Accept:'application/json',
				'Content-Type':'application/json'
			}
		}, function( response ){
			var reply = JSON.parse( response.result )
			reply.fake.schema.should.equal( "/api/v1/fake/schema" );
			reply.fake.list.should.equal( "/api/v1/fake" );
			reply.fake.detail.should.equal( "/api/v1/fake/{pk}" );
			done();
		});
	});


	it('should serialize direct responses appropriately ', function( done ){
		server.inject({
			'url':'/api/v1/fake'
			,method:'get'
			,headers:{
				Accept:'text/xml'
			}
		}, function( response ){
			var xml = response.result

			new Serializer().deserialize( xml, 'text/xml', function( err, data ){
				assert.equal( err, null)
				data.data.object.length.should.equal( 2 )
				done()
			})
		})
	})
});