var should = require('should')
  , assert = require('assert')
  , async  = require('async')
  , Api    = require('../lib/api')
  , server = require("./server")
  , Resource = require('../lib/resource')
  , Throttle = require('../lib/throttle')


var Base = Resource.extend({
	_get_list: function( bundle, cb ){
		cb(null,JSON.stringify( [{key:'value'}] ) );	
	}
})

describe('resource', function(){
	var api, endpoints;
	describe('throttled', function(){

		before(function( done ){
			api = new Api('spec/resource')
			endpoints = new Base({
				throttle: new Throttle.Memory({ at: 5, timeframe:1000 })
			});

			api.use('throttled', endpoints )

			server.register( [api], function(e ){
				server.start( done )
			})
		});

		after(function( done ){
			server.stop( done )
		});

		it('should throttle requests', function(  done ){
			async.parallel({
				zero:function( callback ){
					server.inject({
						method:'get',
						url:'/spec/resource/throttled',
						headers:{
							Accept:'application/json',
							'Content-Type':"application/json"
						}
					},function( response ){
						callback(null,  response.statusCode );
					})					
				}
				,one:function( callback ){
					server.inject({
						method:'get',
						url:'/spec/resource/throttled',
						headers:{
							Accept:'application/json',
							'Content-Type':"application/json"
						}
					},function( response ){

						callback(null,  response.statusCode );
					})
				}
				,two:function( callback ){
					server.inject({
						method:'get',
						url:'/spec/resource/throttled',
						headers:{
							Accept:'application/json',
							'Content-Type':"application/json"
						}
					},function( response ){
						callback(null,  response.statusCode );
					})
				}
				,three:function( callback ){
					server.inject({
						method:'get',
						url:'/spec/resource/throttled',
						headers:{
							Accept:'application/json',
							'Content-Type':"application/json"
						}
					},function( response ){
						callback(null,  response.statusCode );
					})
				}
				,four:function( callback ){
					server.inject({
						method:'get',
						url:'/spec/resource/throttled',
						headers:{
							Accept:'application/json',
							'Content-Type':"application/json"
						}
					},function( response ){
						callback(null,  response.statusCode );
					})
				}
				,five:function( callback ){
					server.inject({
						method:'get',
						url:'/spec/resource/throttled',
						headers:{
							Accept:'application/json',
							'Content-Type':"application/json"
						}
					},function( response ){
						callback(null,  response.statusCode );
					})
				}
				,six:function( callback ){
					server.inject({
						method:'get',
						url:'/spec/resource/throttled',
						headers:{
							Accept:'application/json',
							'Content-Type':"application/json"
						}
					},function( response ){
						callback(null,  response.statusCode );
					})
				}
			}, function( err, results ){
				results.zero.should.equal( 200 )
				results.one.should.equal( 200 )
				results.two.should.equal( 200 )
				results.three.should.equal( 200 )
				results.four.should.equal( 200 )
				results.five.should.equal( 429  )
				results.six.should.equal( 429  )
				done()
			})
		})
	})
})