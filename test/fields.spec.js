var fields = require('../lib/fields')
var assert = require('assert');

describe("Api Fields", function(){
	describe("ArrayField", function(){
		var f = new fields.ArrayField();
		it("Should convert strings into to An Array", function(){
			var result = f.convert('Hello')

			assert.ok(Array.isArray( result ) )

			result = f.convert('Hello,world')
			assert.ok( Array.isArray( result ) )
			assert.equal( result[0], 'Hello')
			assert.equal( result[1], 'world')
		});

		it('should leave array values untouched', function(){
			var a = [1,2,3];
			var b = f.convert( a );

			assert.deepEqual( a, b )
		})
	})

	describe("BooleanField", function(){
		var f = new fields.BooleanField()
		describe('falsy values', function(){
			it('should convert empty strings to False', function(){
				var value =  f.convert('')
				assert.strictEqual( value, false);
			});

			it('should treat "0" as false', function(){
				var value = f.convert( '0' )
				assert.strictEqual( value, false)
			})
			it('should treat "false" as false', function(){
				var value = f.convert( 'false' )
				assert.strictEqual( value, false)
			})
		})
		describe('truthy values', function(){
			it('should convert strings with chars as true', function(){
				var value =  f.convert('a')
				assert.strictEqual( value, true );
			});

			it('should treat "1" as true', function(){
				var value = f.convert( '1' )
				assert.strictEqual( value, true );
			});

			it('should treat "true" as true', function(){
				var value = f.convert( 'true' )
				assert.strictEqual( value, true );
			})
		});

		describe('boolean values', function(){
			it('should convert strings with chars as true', function(){
				var value =  f.convert('a')
				assert.strictEqual( value, true );
			});

			it('should treat "1" as 1', function(){
				var value = f.convert( '1' );
				assert.strictEqual( value, true );
			})	
		})
	})
})


