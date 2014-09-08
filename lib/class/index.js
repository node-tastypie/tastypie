/*
Use Prime with Class

credits to MooTools, http://github.com/kamicane and https://github.com/kentaromiura, https://github.com/keeto
*/"use strict";

var prime = require('prime');
var type  = require('mout/lang/isKind');

var Mutators = {};

// Cloning objects and arrays
var cloneOf = function(item){
	switch (type(item)){
		case 'array'  : return cloneArray(item);
		case 'object' : return cloneObject(item);
		default       : return item;
	}
};

var cloneObject = function(object){
	var clone = {};
	for (var key in object) clone[key] = cloneOf(object[key]);
	return clone;
};

var cloneArray = function(array){
	var i = array.length, clone = new Array(i);
	while (i--) clone[i] = cloneOf(array[i]);
	return clone;
};

// reset function to reset objects and arrays in the prototype
var reset = function(object){
	for (var key in object){
		var value = object[key];
		switch (type(value)){
			case 'object' : object[key] = reset(prime.create(value)); break;
			case 'array'  : object[key] = cloneArray(value);          break;
		}
	}
	return object;
};

// wrap methods to be able to use .parent()
var wrap = function(fn, name, proto){

	return function(){

		var _name       = this._callName;
		var _proto      = this._callProto;

		this._callName  = name;
		this._callProto = proto;

		var result = fn.apply(this, arguments);

		this._callName  = _name;
		this._callProto = _proto;

		return result;

	};

};

var matchers = [];

var lookup = function(key){
	var i = matchers.length;
	while (i--){
		var matcher = matchers[i],
			match = key.match(matcher);
		if (match) return ['$mutator:' + matcher, match.slice(1)];
	}
	return null;
};

var Class = prime({

	constructor: function(){
		reset(this);
		// initialize is wrapped, so can use .parent(). .constructor however isn't wrapped.
		if (this.initialize) this.initialize.apply(this, arguments);
	},

	defineMutator: function(key, fn){

		if (type(key) == 'regexp'){
			matchers.push(key);
			key = '$mutator:' + key;
		}

		Mutators[key] = fn;
		return this;

	},

	mutator: function(key, method){

		var mutator;

		if (mutator = lookup(key)){
			key = mutator.shift();
			mutator.unshift(method);
		}

		if (Mutators.hasOwnProperty(key)){
			method = Class.Mutators[key].apply(this, mutator || [method]);
			if (method == null) return;
		}

		if (key === 'mixin'){

			switch (type(method)){
				case "function" : this.implement(prime.create(method.prototype));                         break;
				case "array"    : method.forEach(function(v){this.implement({"mixin": v})}, this); break;
				case "object"   : this.implement(method);                                                 break;
			}

		} else if (typeof method === 'function' && key != 'parent'){

			this.prototype[key] = wrap(method, key, this.prototype);

		} else {

			this.prototype[key] = method;

		}
	},

	parent: function(){

		var callProto = this._callProto;
		var name      = this._callName;
		var proto     = callProto.constructor.parent;

		if (typeof proto[name] != 'function') throw new Error('parent function "' + name + '" does not exist');

		return proto[name].apply(this, arguments);

	}

});

// Check of an object is a subclass of another prime
var isSubPrimeOf = function(object, prime){
	do {
		if (object === prime) return true;
		object = object && object.parent && object.parent.constructor;
	} while (object);
	return false;
};

var classy = function(proto){

	// accept empty proto, or if the proto is a function, use that as constructor (like MooTools 1.x)
	if (!proto) proto = {};
	else if (typeof proto == 'function') proto = {constructor: proto};

	// alias old Class keys

	if (proto.Extends){
		proto.inherits = proto.Extends;
		delete proto.Extends;
	}

	if (proto.Implements){
		proto.mixin = proto.Implements;
		delete proto.Implements;
	}

	// if it will inherit from another class, that class should be a subclass of Class
	if (proto.inherits && !isSubPrimeOf(proto.inherits, Class)) throw new Error('Inherited class should be classyfied');
	if (!proto.inherits) proto.inherits = Class;

	var prim = prime(proto);

	// overload implement method
	var implement = prim.implement;
	prim.implement = function(name, value){
		if (typeof name == 'string'){
			var object = {};
			object[name] = value;
			name = object;
		}
		return implement.call(this, name);
	};

	return prim;

};

classy.prototype = Class.prototype;
classy.Mutators = Mutators;

module.exports = classy;
