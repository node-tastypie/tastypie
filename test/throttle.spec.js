var Throttle = require('../lib/throttle')

  describe("Throttle", function(){
  	describe("Memory", function(){

  		var short, long;

  		before(function( done ){
  			short = new Throttle.Memory({
  				at:5
  				,timeframe:1000
  			});

  			long = new Throttle.Memory({
  				at:10
  				,timeframe: 2000
  			});

  			done()
  		});



  		it('should respect', function( done ){
  			this.timeout(2000)
  			var throttle, key;
  			key = "SHORT"
  			for(var count = 0; count < 4; count++){
	  			short.incr( key );
	  			throttle = short.toThrottle( key );
	  			// console.log( throttle )
  				throttle.should.be.false
  			}

			short.incr( key );
			throttle = short.toThrottle( key );
			throttle.should.be.true

			setTimeout(function(){
				short.incr( key );
				throttle = short.toThrottle( key );
				throttle.should.be.false
	  			done();
			}, 1100 )

  		});

  		it('should respect long time frames', function( done ){
  			this.timeout(3000)
  			var throttle, key;
  			key = "LONG"
  			for(var count = 0; count < 9; count++){
	  			long.incr( key );
	  			throttle = long.toThrottle( key );
	  			// console.log( throttle )
  				throttle.should.be.false
  			}

			long.incr( key );
			throttle = long.toThrottle( key );
			throttle.should.be.true

			setTimeout(function(){
				long.incr( key );
				throttle = long.toThrottle( key );
				throttle.should.be.false
	  			done();
			}, 2100 )

  		})
  	})
  })