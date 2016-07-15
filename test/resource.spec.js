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
	var api, server;
	before(function( done ){
		api = new Api('api/resource');
		api.use('more', new Resource);
		require('../lib');
		server = new hapi.Server({});
		server.connection({host:'localhost'});
		server.register([api], done );
	});

	describe('Resource', function( ){
		describe('Method Behavior', function(){

			describe('Error handling', function(){
				var ErrorResource;
				before(function(){
					ErrorResource = Resource.extend({
						options:{
							allowed:{
								detail:{get:true, put: true, patch:true, post: true, delete: true}
							}
						}
						,constructor: function( options ){
							this.parent('constructor', options);
						}

						, update_object:function( bundle, cb ){
							var e = new Error('PatchError');
							e.name = 'PatchError';
							cb( e );
						}

						, replace_object:function( bundle, cb ){
							cb(new Error('PutError'));
						}

						, get_object:function( bundle, cb ){
							cb(new Error("GetError"));
						}

						,delete_detail: function( bundle ){
							this.delete_object( bundle, function( err, obj ){
								if( err ){
									err.req = bundle.req;
									err.res = bundle.res;
									return this.emit( 'error', err );
								}
							}.bind( this ));
						}

						,delete_object:function( bundle, cb){
							cb(new Error('DeleteError') );
						}
					});
					api.use('errors', new ErrorResource );
				});

				it('should return a PatchError', function( done ){
					server.inject({
						url:'/api/resource/errors/1'
						,method:'patch'
						,headers:{
							Accept:'application/json'
							,'Content-Type':'application/json'
						}
					},function( response ){
						var result = JSON.parse( response.result );
						assert.equal(result.statusCode, 500);
						assert.equal(result.message, 'PatchError');
						done();
					});
				});

				it('should return a GetError', function( done ){
					server.inject({
						url:'/api/resource/errors/1'
						,method:'get'
						,headers:{
							Accept:'application/json'
							,'Content-Type':'application/json'
						}
					},function( response ){
						var result = JSON.parse( response.result );
						assert.equal(result.statusCode, 500);
						assert.equal(result.message, 'GetError');
						done();
					});
				});
				it('should return a PutError', function( done ){
					server.inject({
						url:'/api/resource/errors/1'
						,method:'put'
						,headers:{
							Accept:'application/json'
							,'Content-Type':'application/json'
						}
					},function( response ){
						var result = JSON.parse( response.result );
						assert.equal(result.statusCode, 500);
						assert.equal(result.message, 'PutError');
						done();
					});
				});
				it('should return a DeleteError', function( done ){
					server.inject({
						url:'/api/resource/errors/1'
						,method:'delete'
						,headers:{
							Accept:'application/json'
							,'Content-Type':'application/json'
						}
					},function( response ){
						var result = JSON.parse( response.result );
						assert.equal(result.statusCode, 500);
						assert.equal(result.message, 'DeleteError');
						done();
					});
				});

			});


			describe('~Default Behaviors', function(){
				var ListResource, data;


				before(function( done ){
					data = [
						{ name:'test', id:0, color:'red' }
						,{ name:'foo', id:1, color:'blue' }
					];

					ListResource = Resource.extend({
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

						, update_object:function( bundle, cb ){
							bundle.object = data[ bundle.req.params.pk ];
							this.full_hydrate(bundle,cb);
						}

						, replace_object:function( bundle, cb ){
							cb(new Error('PutError'));
						}

						, get_object:function( bundle, cb ){
							cb(new Error("GetError"));
						}

						,delete_detail: function( bundle ){
							this.delete_object( bundle, function( err, obj ){
								if( err ){
									err.req = bundle.req;
									err.res = bundle.res;
									return this.emit( 'error', err );
								}
							}.bind( this ));
						}

						,delete_object:function( bundle, cb){
							cb(new Error('DeleteError') );
						}
					});
					api.use('list', new ListResource() );
					done()
				});

				it('should allow partial updates with PATCH', function( done ){

					var payload = {name:'abacadaba'};

					server.inject({
						url:'/api/resource/list/1'
						,method:'patch'
						,headers:{
							Accept:'application/json'
							,'Content-Type':'application/json'
						}
						,payload:payload
					},function( response ){
						var data = JSON.parse( response.result );

						assert.equal( data.name, payload.name )
						done();
					})
				})
			});
		});

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
					,get_objects: function( bundle, callback ){
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
