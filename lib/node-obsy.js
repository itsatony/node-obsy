var redis = require('redis');
var observed = require('observed');


Obsy = function(id, namespace, redisConfig) {
	if (typeof id !== 'string') {
		console.log('--[[obsy] you must provide a unique id for the observable!');
		return false;
	}
	this.id = id;
	if (typeof namespace !== 'object') {
		console.log('--[[obsy] can not obsy a non-object!');
		return false;
	}
	this.redisClient = redis.createClient(redisConfig);
	this.subscribeToRedis();
	this.observedNamespace = observed(namespace);
	this.bindChanges();
};


Obsy.prototype.bindChanges = function() {
	var thisObsy = this;
	thisObsy.observedNamespace.on(
		'changed',
		thisObsy.localChangeHandler
	);
};


// { path: 'name.last',
//   name: 'last',
//   type: 'new',
//   object: { last: 'observed' },
//   value: 'observed',
//   oldValue: undefined }
Obsy.prototype.localChangeHandler = function(path, name, type, object, value, oldValue) {

};


Obsy.prototype.redisChangeHandler = function() {

};


Obsy.prototype.subscribeToRedis = function() {
	this.redisClient.on(
		'message', 
		function(channel, message) {
			console.log('--[[obsy] redis channel ' + channel + ': ' + message);			
		}
	);
	return this.redisClient.subscribe(this.id);
};


Obsy.prototype.sendUpdateToRedis = function(changesArray) {
	for (var i=0; i<changesArray.length; i+=1) {
		// this.redisClient.
	}
	return this;
};


Obsy.prototype.stop = function() {
	this.redisClient.end();
	this.observedNamespace.remove();
	return this;
};


Obsy.prototype.linearize = function(baseId, obj) {
	var linear = {};
	if (baseId.length > 0) baseId += this.keySeperator;
	for (var i in obj) {
		var branchId = baseId + i;
		if (typeof obj[i] === 'number') {
			linear[branchId] = copy(obj[i]);
		} else if (typeof obj[i] === 'string') {
			linear[branchId] = copy(obj[i]);
		} else if (typeof obj[i] === 'boolean') {
			linear[branchId] = copy(obj[i]);
		} else if (typeof obj[i] === 'function') {
			continue;
		} else if (typeof obj[i] === 'object' && Buffer.isBuffer(obj[i])) {
			linear[branchId] = new Buffer(obj[i]);
		} else if (typeof obj[i] === 'object') {
			var subLinears = this.linearize(branchId, obj[i]);
			for (var subId in subLinears) {
				linear[subId] = subLinears[subId];
			}
		}
	}
	return linear;
};


Obsy.prototype.objectize = function(linear) {
	var obj = {};	
	for (var i in linear) {
		var idParts = i.split(this.keySeperator);
		// idParts.shift();
		if (idParts.length > 0) {
			obj = deepAssign(obj, idParts, linear[i]);
		} else {
			obj = copy(linear[i]);
		}
	}
	return obj;
};



// ===================================================


module.exports = Obsy;


// ===================================================


function deepAssign(baseObj, keys, deepValue) {
	var step = baseObj;
	while (keys.length > 0) {
		var key = keys.shift();
		if (keys.length > 0) {
			if (typeof step[key] !== 'object') {
				step[key] = {};
			}
		} else {
			step[key] = copy(deepValue);
		}
		step = step[key];
	}
	return baseObj;
};


function clone(source) {
  if (typeof source === 'undefined') {
		return void 0;
	} else if (source === null) {
		return null;
	} else if (source instanceof Array) {
		var clone = [];
		for (var f = 0; f < source.length; f++) clone.push(copy(source[f]));
	} else if (typeof source.constructor !== 'undefined' && typeof source.constructor.name === 'string' && source.constructor.name === 'ObjectID') { 
    var clone = new source.constructor('' + source);
  } else if (typeof source.constructor === 'function' && source.constructor.name !== 'Object') {
		var clone = new source.constructor(source);
	} else {
		var clone = {};
	  for (var f in source) clone[f] = copy(source[f]);
  }
	return clone;
};


function copy(source) {
	if (typeof source === 'undefined') return void 0;
	else if (typeof source === 'number') return Number(source);
	else if (typeof source === 'string') return String(source);
	else if (typeof source === 'object') return clone(source);
	else if (typeof source === 'function') return source.valueOf();
	else if (typeof source === 'boolean') return Boolean(source.valueOf());
	else return source;
};