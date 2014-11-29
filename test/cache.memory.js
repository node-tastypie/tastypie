var Memory = require('../lib/cache').Memory
  , assert = require('assert')
  ;

describe('cache', function(){
	var cache = new Memory();
	before(function(){

	})

	describe('#get/#set', function(){
		it('should set a value', function(){
			cache.set('foo', 'bar', function(){
				cache.get('foo', function(err, value ){

					assert.equal(value, 'bar' )
				})
				
			});
		})

		it('should expire keys', function( done ){
			cache.setOptions({timeout:0.5});
			cache.set('bar','baz')

			 cache.get('bar', function( err, value){
			 	assert.equal( value, 'baz')
			 })

			setTimeout( function(){
				cache.get('bar', function(err, value){
					assert.notEqual(value, 'baz')
					done();
				})
			},1000)
		})

		it('should defaine control property function', function(){
			assert.equal( cache.control.no_cache, true )
			cache.setOptions({control:{no_cache:false}});
			assert.equal( cache.control.no_cache, false)
		})
	})
})
