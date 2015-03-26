var assert = require('assert')
var server = require('./server')
var Api    = require('../lib/api')
var Resource = require( '../lib/resource' )

describe('resoruce', function(){
	var api;
	before(function( done ){
		api = new Api('api/resource')
		api.add('more', new Resource)
		server.register([api], function( e ){
			server.start( done );
		})
	});

	describe('Resource', function( ){
		describe('Extension', function( ){
			var Extended
			before(function(){
				Extended = Resource.extend({
					options:{
						fudgeMethodsAllowed:{
							get:true
						}
					}
					,prepend_urls: function(){
						return[{
							route:'/api/resource/candy/fudge'
							,handler:this.dispatch_fudge.bind( this )
							,name:'fudge'
						}]
					}

					,dispatch_fudge: function( req, reply){
						return this.dispatch('fudge', this.bundle( req, reply ) );
					}

					,get_fudge: function( bundle ){
						bundle.data = {message:'fudge'}
						this.respond( bundle )
					}
				});

				api.add('candy', new Extended );
			})
			it('should allow custom routes', function( done ){
				server.inject({
					url:'/api/resource/candy/fudge'
					,method:'get'
					,headers:{
						Accept:'application/json'
						,'Content-Type':'application/json'
					}
				},function( response ){
					var data = JSON.parse( response.result ) 
					assert.equal( data.message, 'fudge' )
					done();
				})
			})
		})
	})
	describe('api', function(){

		it('should accept a request',function( done ){
			server.inject({
				url:'/api/resource'
				,method:'get'
				,headers:{
					Accept:'application/json',
					'Content-Type':'application/json'
				}
			}, function( response ){
				var reply = response.result
				assert.equal( reply.more.schema, "/api/resource/more/schema" );
				assert.equal( reply.more.list, "/api/resource/more" );
				assert.equal( reply.more.detail, "/api/resource/more/{pk}" );
				done();
			});
		});
	});
});
