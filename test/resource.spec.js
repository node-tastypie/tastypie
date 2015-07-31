/*jshint laxcomma: true, smarttabs: true, node: true, mocha: true*/
var assert   = require('assert')
  , hapi     = require('hapi')
  , Api      = require('../lib/api')
  , Resource = require( '../lib/resource' )
  , xml2js   = require( 'xml2js' )
  , fs       = require('fs')
  , path     = require('path')
  , fields   = require('../lib/fields')
  , http     = require('../lib/http')
  ;

describe('resoruce', function(){
	var api, server
	before(function( done ){
		api = new Api('api/resource')
		api.use('more', new Resource)
		require('../lib');
		server = new hapi.Server({minimal:true})
		server.connection({host:'localhost'})
		server.register([api], done );
	});

	describe('Resource', function( ){
		describe('Extension', function( ){
			var Extended
			before(function(){
				Extended = Resource.extend({
					options:{
						allowed:{
							fudge:{
								get:true
								,post:true
								,put:false
							}
						}
					}
					,prepend_urls: function(){
						return[{
							path:'/api/resource/candy/fudge'
							,handler:this.dispatch_fudge.bind( this )
							,name:'fudge'
						}]
					}

					,dispatch_fudge: function( req, reply){
						return this.dispatch('fudge', this.bundle( req, reply ) );
					}

					,get_fudge: function( bundle ){
						bundle.data = {message:'fudge'}
						this.respond( bundle );
					}

					,put_fudge: function( bundle ){
						// method not allowed
					}

					,post_fudge: function( bundle ){
						this.respond( bundle, http.created )
					}
				});

				api.use('candy', new Extended );
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


			it('should return a 405 for disallowed methods', function( done ){
				server.inject({
					url:'/api/resource/candy/fudge'
					,method:"put"
				}, function( response ){
					response.statusCode.should.equal( 405 )
					done();
				})	
			})

			describe('#respond',function() {
				it('should allow custome response classes', function( done ){
					server.inject({
						url:'/api/resource/candy/fudge'
						,method:"post"
					}, function( response ){
						response.statusCode.should.equal( 201 )
						done();
					})	
				})
			})

			it('should return xml', function( done ){
				var parser = new xml2js.Parser({
					"explicitCharKey":false
					,"trim":true
					,"normalize":false
					,"explicitArray":false
					,"explicitRoot":false
					,"ignoreAttrs":true
					,"mergeAttrs":false
					,"validator":null
					,"timeout":20000
				});

				server.inject({
					url:'/api/resource/candy/fudge'
					,method:'get'
					,headers:{
						Accept:'text/xml'
						,'Content-Type':'application/json'
					}
				}, function( response ){
					parser.parseString( response.result, function( err,  data ){
						assert.equal( data.message, 'fudge' );
						done();				
					});
				});
			});
		});

		describe('File Resource', function(){
			var File;

			before( function( done ){
				File = Resource.extend({
					options:{
						objectTpl:function(){ this.range = [] }
						,pk:'guid'
					}
					,fields:{
						name:{type:'char', attribute:'company.name'}
						,value:{type:'integer'}
					}
					,_get_list: function( bundle, callback ){
						var data = path.resolve(__dirname, '..', 'example', 'data.json')
						fs.readFile(data,function( err, buffer ){
							callback( err, buffer )
						})
					}
					,dehydrate_value: function( /* obj, bundle, ret */ ){
						return 2
					}
				});

				api.use('file', new File );
				done();
			})

			it('should convert field definitions to Field instances', function(){
				var f = new File();
				f.fields.name.should.be.instanceOf( fields.char )
			});

			it('should accept a GET request', function( done ){
				server.inject({
					url:'/api/resource/file'
					,method:"get"
				}, function( response ){
					assert.equal( response.statusCode, 200 )
					done();
				})
			});

			it('should map attribute values', function( done ){
				server.inject({
					url:'/api/resource/file'
					,method:"get"
				}, function( response ){
					var data = JSON.parse( response.result ).data

					data.forEach(function( instance ){
						instance.should.have.property( 'name' )
						instance.should.have.property( 'value' ) 
						instance.value.should.equal( 2 );
					})
					done();
				});
			});

			describe('/schema', function(){
				it('should render defined fields', function( done ){
					server.inject({
						url:'/api/resource/file/schema'
						,method:"get"
					}, function( response ){
						var data = JSON.parse( response.result )
						var fields = Object.keys( data.fields );
						fields.indexOf( 'name' ).should.equal(0);
						fields.indexOf( 'value' ).should.equal( 1 )
						fields.indexOf( 'faked' ).should.be.lessThan(0)
						done();
					});
				});
			});

			it('should map attribute values', function( done ){
				server.inject({
					url:'/api/resource/file'
					,method:"get"
				}, function( response ){
					var data = JSON.parse( response.result )
					var obj = data.data[0]
					assert.ok(obj.hasOwnProperty( 'name' ) )
					assert.equal(typeof obj.name, 'string' )
					done();
				})
			})

		})
	});

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
				 reply.more.schema.should.equal( "/api/resource/more/schema" );
				 reply.more.list.should.equal( "/api/resource/more" );
				 reply.more.detail.should.equal( "/api/resource/more/{pk}" );
				done();
			});
		});
	});
});
