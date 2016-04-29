var fields = require('../lib/fields');
var assert = require('assert');
var kindOf = require('mout/lang/kindOf')
var fs = require('fs')
var path = require('path')

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

			it('should treat false as false', function(){
				var value = f.convert( false )
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

			it('should treat true as true', function(){
				var value = f.convert( true )
				assert.strictEqual( value, true)
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
		});

		describe('dehydrate',function(){
			describe('default values', function(){
				it('should accept `false` as a default value', function( done ){
					var f = new fields.BooleanField({name:'fakebool', attribute:'fakebool', default:false });

					f.dehydrate({}, function( err, value ){
						assert.strictEqual( value, false, 'expected false, got ' + value );
						done();
					})
				});

				it('should cast an empty string default value to `false`', function( done ){
					var f = new fields.BooleanField({name:'fakebool', attribute:'fakebool', default:'' });
					f.dehydrate({}, function( err, value ){
						assert.strictEqual( value, false, 'expected false, got ' + value );
						done();
					});
				});

				it('should cast a null default value to `false` ', function( done ){
					var f = new fields.BooleanField({name:'fakebool', attribute:'fakebool', default:null });
					f.dehydrate({}, function( err, value ){
						assert.strictEqual( value, false, 'expected false, got ' + value );
						done();
					});
				});
			});
		});

		describe('#convert',function(){
			it('should convert string to boolean', function(){
				var value = f.convert('true');
				value.should.be.a.Boolean;
				value.should.equal( true );

				value = f.convert('false');
				value.should.be.a.Boolean;
				value.should.equal( false );

			});

			it('should convert numbers to boolean', function(){
				var value = f.convert(1);
				value.should.be.a.Boolean;
				value.should.equal( true );

				value = f.convert(0);
				value.should.be.a.Boolean;
				value.should.equal( false );
			});
		})

	})

	describe('Datefield', function(){
		var f;
		before(function( done ){
			f = new fields.DateField();
			done()
		})

		describe('#convert',function(){
			it('should convert strings to dates', function(){
				var value = f.convert('2014-01-22')
				value.getFullYear().should.equal( 2014 )
				value.getMonth().should.equal(0)
				value.getDate().should.equal(22)
				value.getHours().should.equal(0)
				value.getMinutes().should.equal(0)
				value.getSeconds().should.equal(0)
			})

		});
	});

	describe('DateTimeField', function(){
		var f;
		beforeEach(function(){
			f = new fields.DateTimeField({ name:'dtf', attribute:'dtf'});
		});

		describe('#hydrate', function(){
			it('should convert a date string into a date object', function( done ){
				var bundle = {
					data:{},
					object:{
						dtf:'2014-02-27T15:54:04.000Z'
					}
				};

				f.hydrate( bundle, function( err, value ){
					assert( kindOf( value ), 'Date');
					assert.equal( value.getYear(), 2014 )
					assert.equal( value.getMinutes(), 54 )
					done();
				})
			})
		});
	});

	describe('ArrayField', function( ){
		var f;
		before( function( ){
			f = new fields.ArrayField();
		});
		describe('#convert', function( ){
			it('should convert single values to an array', function(){
				var value = f.convert( 1 );
				value.should.be.a.Array
			})

			it("should conver comma separate string values", function(){
				var value = f.convert('1, 2, 3');
				value.should.be.a.Array;
				value[0].should.be.String;
				value[0].should.equal('1');
			});

			it("should no convert array values", function(){
				var value = f.convert([1,2,3]);
				value.should.be.a.Array;
				value[0].should.be.Number;
				value[0].should.equal(1);
			});
		})
	})

	describe('FileFIeld', function(){
		var f, location, dir;

		before(function(){
			dir = 'uploads'
			location = path.join( __dirname, dir, 'data.json' )
			f = new fields.FileField({
				dir: dir
				, attribute: 'file'
				, name: 'file'
				,root:__dirname
				,create:true
			});
		});

		after(function( done ){
			fs.unlink( location, function( err ){
				done( err );
			});
		});

		describe('#hydrate', function(  ){
			var bundle = {
				req:{
					payload:{

					}
				},
				res:{},
				data:{
					file: fs.createReadStream( path.resolve(__dirname,'..' , 'example', 'data.json' ) )
				},
				object:{}
			}

			bundle.data.file.hapi = {
				filename:'data.json'
			}

			it('should consume streams', function( done ) {
				f.hydrate( bundle, function( err, d ){
					d.should.equal( path.join(__dirname, 'uploads', 'data.json'))
					done()
				})
			});
		});
		describe('#dehydrate', function( ){
			var bundle = {
				file: '/tmp/uploads/data.json'
			}
			it('should return a path', function( done ){
				f.dehydrate( bundle, function( err, value ){
					value.should.equal( dir + '/' + 'data.json')
					done();
				})
			})
		});
	});

	describe('FilePathField', function(){
		var f;

		before(function(){
			f = new fields.FilePathField({
				name:'file'
				,attribute:'file'
			});
		});

		describe('#hydrate', function(){

			it('should not alter the file path location', function( done ){

				var bundle = {
					data:{
						file: path.join( __dirname, '..', 'example', 'data.json' )
					}
				};
				bundle.data.file.hapi = {
					filename:'data.json'
				}
				f.hydrate( bundle, function( err, value ){
					value.should.equal( path.join( __dirname, '..', 'example', 'data.json' ) )

					done(err)
				})
			})
		});

		describe('#dehydrate', function(){
			it('should path relative to dir option', function( done ){
				var data = {
					file:path.join( f.options.root, f.options.dir, 'data.json' )
				}

				f.dehydrate( data, function( err, value ){
					value.should.equal( f.options.dir + '/' + 'data.json');
					done( err )
				})
			})
		})
	})
})


