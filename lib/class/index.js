/*jshint node:true, laxcomma:true, smarttabs: true, forin:false, unused: false */
'use strict';
/**
 * Prototypal inheritance made easy - A slight modification on the prime libs
 * @module tastypie/lib/class
 * @author Eric Satterwhite
 * @requires mout/object/hasOwn
 * @requires mout/object/mixIn
 * @requires mout/lang/createObject
 * @requires mout/lang/kindOf
 * @requires mout/lang/clone
 * @requires mout/object/merge
 **/
var hasOwn = require("mout/object/hasOwn")
  , mixIn  = require("mout/object/mixIn")
  , create = require("mout/lang/createObject")
  , clone = require('mout/lang/clone')
  , kindOf = require("mout/lang/kindOf")
  , isObject = require('mout/lang/isObject')
  , merge  = require('mout/object/merge')
  , mutators = {

    };

var hasDescriptors = true;

try {
    Object.defineProperty({}, "~", {});
    Object.getOwnPropertyDescriptor({}, "~");
} catch (e){
    hasDescriptors = false;
}

// we only need to be able to implement "toString" and "valueOf" in IE < 9
var hasEnumBug = !({valueOf: 0}).propertyIsEnumerable("valueOf"),
    buggy      = ["toString", "valueOf"];

var verbs = /^constructor|inherits|mixin$/;

var implement = function(proto){
    var mutator
      , value
      , descriptor
      , prototype
      ;

    prototype = this.prototype;

    for (var key in proto){
        if (key.match(verbs)){
            continue;
        }

        if( mutators.hasOwnProperty( key ) ){
            mutator = mutators[ key ];
            value = proto[ key ];
            value = mutator.call( this, value );
            
            if( !value ){
               continue;
            }
            this[ key ] = value;
        }

        if (hasDescriptors){
            descriptor = Object.getOwnPropertyDescriptor(proto, key);
            if (descriptor){
                Object.defineProperty(prototype, key, descriptor);
                continue;
            }
        }
        prototype[key] = proto[key];
    }

    if (hasEnumBug){
        for (var i = 0; (key = buggy[i]); i++){
            value = proto[key];
            if (value !== Object.prototype[key]){
                prototype[key] = value;
            }
        }
    }

    return this;
};

var prime = function(proto){

    if (kindOf(proto) === "Function"){
        proto = {constructor: proto};
    }

    var superprime = proto.inherits;

    // if our nice proto object has no own constructor property
    // then we proceed using a ghosting constructor that all it does is
    // call the parent's constructor if it has a superprime, else an empty constructor
    // proto.constructor becomes the effective constructor
    var constructor = (hasOwn(proto, "constructor")) ? proto.constructor : (superprime) ? function(){
        return superprime.apply(this, arguments);
    } : function(){};

    if (superprime){

        mixIn(constructor, superprime);

        var superproto = superprime.prototype;
        // inherit from superprime
        var cproto = constructor.prototype = create(superproto);

        // setting constructor.parent to superprime.prototype
        // because it's the shortest possible absolute reference
        constructor.parent = superproto;
        cproto.constructor = constructor;
        cproto.$class = constructor;
        isObject(proto.options) && isObject(superproto.options) && (proto.options = merge(clone(superproto.options), proto.options));

    }

    if (!constructor.implement){
        constructor.implement = implement;
    }

    var mixins = proto.mixin;
    if (mixins){
        if (kindOf(mixins) !== "Array"){
            mixins = [mixins];
        }

        for (var i = 0; i < mixins.length; i++){
            constructor.implement(create(mixins[i].prototype));
        }
    }

    // implement proto and return constructor
    return constructor.implement(proto);
};

prime.defineMutator = function(name ,fn ){
    Object.defineProperty( mutators, name, {
        enumerable: true
        ,configurable: false
        ,get: function( ){
            return fn;
        }
    });
};

/**
 * @constructor
 * @alias module:tastypie/lib/class
 * @param {Object} prototype an object to serve as the instance prototype
 * @param {Function} [prototype.constructor]
 * @param {Class|Class[]|Function|Function[]} [prototype.mixin]
 * @param {Function|Class} [prototype.extends] A function or class definintion to server as the prototype to inherit from ( parent class )
 * @example 
var EventEmitter = require('events').EventEmitter
var Options = require('tastypie/lib/class/options');

MyClass = new Class({
    extends: require('fs').Stream
    ,mixin:[ EventEmitter, Options ]
    ,options:{
        isActive: false
    }
    ,constructor: function( options ){
        this.setOptions( options ) // from options mixin
        console.log("im the constructor");
        EventEmitter.call( this );
    }
    ,work: function(){
        console.log('I'm doing work)
        this.emit('work', this.options.isActive )
    }
 });
 */

module.exports = prime;
