var async = require('async')
  , hapi = require('hapi')
  , Api = require('../lib/api')
  , Resource = require("../lib/resource")
  , Cache = require('../lib/cache')
  ;

describe('resource', function(){
	var resource, server, c;
	before( function( done ){
		server = new hapi.Server({minimal: true});
		server.connection({host:'localhost'})
		resource = Resource.extend({

			get_object:function( bundle, callback ){
				callback(null, { key:new Date() } )
			}
		});
		c =  new Cache({engine:'catbox-memory'})
		done();
	})
	describe('cached', function(){
		before(function( done ){
			var api = new Api('resource/spec')
			api.use('cached', new resource({
					cache: c
				})
			);

			server.register( [api], done )
		});

		it('should cache detail GET requests', function( done ){
			async.series([
				function( callback ){
					server.inject({
						url:'/resource/spec/cached/1',
						method:'get',
						headers:{
							Accept:'application/json'
						}
					},function( response ){
						response.statusCode.should.equal( 200 );
						callback()
					})
				},
				function( callback ){
					server.inject({
						url:'/resource/spec/cached/1',
						method:'get',
						headers:{
							Accept:'application/json'
						}
					},function( response ){
						response.statusCode.should.equal( 200 );
						callback()
					})
				}
			], function( ){
				var _cache = c.client._cache.connection.cache
				Object
					.keys( _cache  )
					.forEach(function( partition ){
						Object.keys( _cache[ partition ] ).length.should.be.greaterThan(0)
					})
				done();
			})
		});
	});
});
