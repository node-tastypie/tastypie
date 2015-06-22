var should = require('should')
  , async = require('async')
  , server = require('./server')
  , Api = require('../lib/api')
  , Resource = require("../lib/resource")
  , Cache = require('../lib/cache')
  ;

describe('resource', function(){
	var resource = Resource.extend({

		get_object:function( bundle, callback ){
			callback(null, { key:new Date() } )
		}
	})

	describe('cached', function(){
		before(function( done ){
			var api = new Api('resource/spec')			
			api.use('cached', new resource({
					cache: new Cache.Memory()
				})
			);

			server.register( [api], function(){

				server.start( done )
			})
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
			], function( err, results ){
				Object.keys(process._cache).length.should.be.greaterThan(0)
				done();
			})
		});
	});
});
