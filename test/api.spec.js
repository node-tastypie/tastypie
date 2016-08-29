/*jshint laxcomma: true, smarttabs: true, node: true, mocha: true*/
'use strict';

var should = require("should")
  , xml2js   = require('xml2js')
  , assert   = require('assert')
  , hapi     = require('hapi')
  , typecast = require('mout/string/typecast')
  , http     = require('../lib/http')
  , Api      = require('../lib/api')
  , Resource = require( '../lib/resource' )
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
			meta:{},
			data:[
				{a:1, b:2}
				,{a:2,b:3}
			]
		});
	}

	,post_list: function(bundle){
		if(typeof bundle.req.payload === 'string' ){
			return this.respond(bundle, http.serverError)
		}

		bundle.data = bundle.req.payload;
		this.respond(bundle, http.created)
	}

	,serialize:function( data, format, callback ){
		callback( null, data )
	}

})

describe('api', function(){
	var server, v1;

	before(function( done ){
		
		server = new hapi.Server();
		v1     = new Api('api/v1',{
			serializer: new Serializer({})
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
			new Serializer().deserialize( xml, 'text/xml').then(function(  data ){
				assert.equal( err, null)
				data.data.length.should.equal( 2 )
				done()
			}, ( err )=>{
				console.log( err.stack )
				done( err )
			} )
		})
	})

	it('should return an error for unsupported formats via querystring', function( done ){
		server.inject({
			url:'/api/v1/fake?format=fake'
			,method:'get'
		}, function( response ){
			response.statusCode.should.equal( 415 )
			done();
		})
	});


	it('should return json when given an unexpected accept header', function( done ){
		server.inject({
			url:'/api/v1/fake'
			,method:'get'
			,headers:{
				Accept:'text/fake'
			}
		}, function( response ){
			response.statusCode.should.equal( 200 )
			response.headers['content-type'].indexOf('application/json').should.be.greaterThan(-1)
			assert.doesNotThrow(function(){
				JSON.parse( response.result );
				done();
			})
		})
	});

	it('should deserialize incoming data',function( done ){
		let data = {a:{b:{c:'foobar'}}}
		  ;
		server.inject({
			url:'/api/v1/fake'
			,method:'post'
			,headers:{
				'Content-Type':'text/xml'
				,Accept:'application/json'
			}
			,payload: `
				<object>
					<a type="object">
						<b type="object">
							<c type="boolean">true</c>
						</b>
						<d type="number">1</d>
						<d type="number">2</d>
						<d type="number">3</d>
					</a>
				</object>
			`
		}, function( response ){
			response.statusCode.should.equal( 201 )
			let result = JSON.parse( response.result )
			typecast(result.a.b.c).should.be.a.Boolean()
			result.a.d.should.be.a.Array()
			done()
		})
	})
	describe('#use', function(){
		let server, v1
		before(function( done ){
			
			server = new hapi.Server();
			v1     = new Api('api/v1');
			
			v1.use(new FakeResource({ 
				name:'morefake'
				,serializer: new Serializer()
			}));

			server.connection({ host:'0.0.0.0' });
			server.register( v1, function( ){
				server.start( done );
			});
		});

		it('should accept a resource with name as a singular argument',function(done){
			server.inject({
				url:'/api/v1/morefake'
				,method:'get'
				,headers:{
					Accept:'application/json'
				}
			}, function( response ){
				response.statusCode.should.equal( 200 )
				done();
			})
		})
	})
});
