var assert = require('assert')
var server = require('./server')
var Api    = require('../lib/api')
var Resource = require( '../lib/resource' )
var xml2js   = require( 'xml2js' )
var fs = require('fs')
var path = require('path')
var fields = require('../lib/fields')
describe('resoruce', function(){
	var api;
	before(function( done ){
		api = new Api('api/resource')
		api.add('more', new Resource)
		server.register([api], function( e ){
			server.start( done );
		});
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
						this.respond( bundle );
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
						objectTpl:{range:[]}
					}
					,fields:{
						name:{type:'char', attribute:'name.first'}
						,value:{type:'integer'}
					}
					,_get_list: function( bundle, callback ){
						var data = path.resolve(__dirname, '..', 'example', 'data.json')
						fs.readFile(data,function( err, buffer ){
							callback( err, buffer )
						})
					}
					,dehydrate_value: function( obj, bundle, ret ){
						return 2
					}

				});

				api.add('file', new File );
				done();
			})
			it('should convert field definitions to Field instances', function(){
				var f = new File();
				assert.ok( f.fields.name instanceof fields.char )
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
						assert.ok(instance.hasOwnProperty( 'name' ) )
						assert.ok(instance.hasOwnProperty( 'value' ) )
						assert.equal(instance.value, 2 )
					})
					done();
				})
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
				assert.equal( reply.more.schema, "/api/resource/more/schema" );
				assert.equal( reply.more.list, "/api/resource/more" );
				assert.equal( reply.more.detail, "/api/resource/more/{pk}" );
				done();
			});
		});
	});
});
