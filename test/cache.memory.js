var Memory = require('../lib/cache').Memory
  , assert = require('assert')
  ;

describe('cache', function(){
	var cache = new Memory();
	before(function(){

	})

	describe('#get/#set', function(){
		it('should set a value', function(){
			cache.set('foo', 'bar' );
			assert.equal( cache.get('foo'), 'bar')
		})

		it('should expire keys', function( done ){
			cache.setMeta({timeout:0.5});
			cache.set('bar','baz')
			assert.equal( cache.get('bar'), 'baz')

			setTimeout( function(){
				assert.notEqual( cache.get('bar'), 'baz')
				done();
			},1000)
		})

		it('should defaine control property function', function(){
			assert.equal( cache.control.no_cache, true )
			cache.setMeta({control:{no_cache:false}});
			assert.equal( cache.control.no_cache, false)
		})
	})
})