/*jshint esnext: true, node: true, smarttabs: true, laxcomma: true, unused: true */
'use strict';
/**
 *
 * @module tastypie/lib/mixin
 * @author Eric Satterwhite
 * @since 6.0.0
 * @requires util
 **/

let util = require( 'util' );

const CACHE    = Symbol('_classCache');
const MIXIN    = Symbol('_cachMixin');
const ORIGINAL = Symbol('_oringinalMixin');

class Builder {
	constructor( superclass ){
		this.superclass = superclass;
	}

	with(...mixins){
		return mixins.reduce(( cls, mixin ) =>{
			return mixin( cls )
		}, this.superclass);
	}
}

function wrap( mixin, wrapper){
	Object.setPrototypeOf( wrapper, mixin);
	if( !mixin[ORIGINAL] ){
		mixin[ORIGINAL] = mixin;
	}

	return wrapper;
}

function HasInstance( mixin ){
	if( Symbol.hasInstance && !mixin.hasOwnProperty( Symbol.hasInstance ) ){
		Object.defineProperty(mixin, Symbol.hasInstance, {
			value: function( instance ){
				let orig = this[ORIGINAL];
				while( instance ){
					if( instance.hasOwnProperty( MIXIN ) && instance[MIXIN] === orig ){
						return true
					}
					instance = Object.getPrototypeOf( instance );
				}
				return false;
			}
		});
	}
};


function Cached( mixin ){
	return wrap( mixin, function( superclass ){
		let cls = mixin[CACHE];
		if(!cls){
			cls = mixin[CACHE] = Symbol( mixin.name );
		}

		if( superclass.hasOwnProperty( cls ) ){
			return superclass[ cls ];
		}

		let instance = mixin( superclass );
		superclass[cls] = instance;
		return instance;
	});
}

function Base( mixin ){
	return wrap( mixin, ( superclass )=>{
		let cls = mixin( superclass );
		cls.prototype[ MIXIN ] = mixin[ ORIGINAL ];
		return cls
	});
};

function Mixin( mixin ){
	return Cached( HasInstance( Base( mixin ) ) );
};

function mix( superclass ){
	return new Builder( superclass );
};

module.exports = mix;
