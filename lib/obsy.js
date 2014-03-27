var redis = require('redis');
var observed = require('observed');

Obsy = function(id, namespace, redisConfig) {
	if (typeof id !== 'string') {
		this.log('you must provide a unique id for the observable!');
		return false;
	}
	this.id = '_obsy_' + id;
	this.upid = randomString(6, true, true);
	if (typeof namespace !== 'object') {
		this.log('can not obsy a non-object!');
		return;
	}
	this.keySeperator = '.';
	this.allowedTypes = {
		'object' : true,
		'string' : true,
		'number' : true,
		'boolean' : true,
		'array' : true,
		'buffer' : true,
		// for delete...
		'undefined' : true,
	};
	this.debug = true;
	this.namespace = namespace;
	this.redisClient = redis.createClient(redisConfig);
	this.redisClient.on(
		'error', 
		function(err) {
			throw err;
    }
	);
	this.redisSubscriber = redis.createClient();
	this.subscribeToRedis();
	this.observedNamespace = observed(namespace);
	this.bindChanges();
	this.initialSync();
};


Obsy.prototype.log = function(msg) {
	if (this.debug === true) {
		console.log('--[[obsy] ' + msg);
	}
	return this;
};


Obsy.prototype.bindChanges = function() {
	var thisObsy = this;
	thisObsy.observedNamespace.on(
		'changed',
		function(event) {
			thisObsy.localChangeHandler(event);
		}
	);
};

Obsy.prototype.initialSync = function() {
	// TODO : get from redis first, integrate, sendToRedis next ? not sure...
	var linear = this.linearize(this.id, this.namespace);
	return this;
};

// { path: 'name.last',
//   name: 'last',
//   type: 'new',
//   object: { last: 'observed' },
//   value: 'observed',
//   oldValue: undefined }
Obsy.prototype.localChangeHandler = function(event) {
	this.log('CHANGE-EVENT: ' + event.path + ' ' + event.type);
	var varType = detailedType(event.value);
	if (this.allowedTypes[varType] !== true) {
		this.log('localChangeHandler : varType not allowed for obsy : ' + varType);
		return this;
	}
	var prePath = event.path.split('.');
	prePath.pop();
	var extender = '';
	if (prePath.length > 0) {
		extender += '.' + prePath.join('.')
	}
	var linear = this.linearize(this.id + extender, event.object);
	if (event.type === 'new' || event.type === 'update') {
		// TODO: if an object was updated, make sure to delete all sub-keys as well!
		for (var key in linear) {
			this.log('localChangeHandler : ' + key + ' -> ' + linear[key]);
			this.sendUpdateToRedis(key, linear[key]);
		}
	} else if (event.type === 'deleted') {
		// TODO: if an object was deleted, make sure to delete all sub-keys as well!
		this.log('localChangeHandler : ' + event.path + ' -> undefined');
		this.sendUpdateToRedis(event.path); // , undefined
	} else {
		this.log('EVENT-TYPE : ' + event.type);
	}
	return this;
};


Obsy.prototype.redisChangeHandler = function(channel, message) {
	var value = '';
	var parts = channel.split('.');
	parts.shift();
	var varType = message.split('@@')[0];
	if (varType === 'string') {
		value = message.split('@@')[1];
	} else if (varType === 'boolean') {
		value = (message.split('@@')[1] === 'true') ? true : false;
	} else if (varType === 'number') {
		value = Number(message.split('@@')[1]);
	} else if (varType === 'object') {
		value = {};
	} else if (varType === 'array') {
		value = message.split('@@')[1].split(',');
	} else if (varType === 'buffer') {
		value = new Buffer(message.split('@@')[1]);
	} 
	this.log('DEEP ASSIGN -> ' + parts.join('.') + ' ' + varType + ' ' + value);
	if (message === '_obsy@@DELETE_') {
		deepAssign(this.namespace, parts);
	} else {
		deepAssign(this.namespace, parts, value);
	}
	return this;
};


Obsy.prototype.subscribeToRedis = function() {
	var thisObsy = this;
	this.redisSubscriber.on(
		'pmessage',
		function(pattern, channel, message) {
			if (channel.indexOf(thisObsy.upid) === 0) {
				return false;
			}
			thisObsy.log('redis subscription to channel [' + channel + '] for pattern [' + pattern + '] msg: [' + message + ']');
			thisObsy.redisChangeHandler(channel, message);
		}
	);
	var pattern = '??????' + this.id + '*';
	this.redisSubscriber.psubscribe(pattern);
	thisObsy.log('subscribed to ' + pattern);
	return this;
};


Obsy.prototype.sendUpdateToRedis = function(key, value) {
	var thisObsy = this;
	if (typeof value === 'undefined') {
		this.redisClient.del(
			key,
			function(err, status) {
				if (err === null) {
					var channel = thisObsy.upid + thisObsy.id + thisObsy.keySeperator + key;
					var msg = '_obsy@@DELETE_';
					thisObsy.log('publish : ' + channel + ' : ' +  msg);
					thisObsy.redisClient.publish(channel, msg);
				} else {
					console.log(key, value);
					console.log(err);
					console.log(status);
				}
			}
		);
	} else {
		this.redisClient.set(
			key, 
			value,
			function(err, status) {
				if (status === 'OK') {
					var channel = thisObsy.upid + key;
					var msg = detailedType(value) + '@@' + value;
					thisObsy.log('publish : ' + channel + ' : ' +  msg);
					thisObsy.redisClient.publish(channel, msg);
				} else {
					console.log(key, value);
					console.log(err);
					console.log(status);
				}
			}
		);
	}
	return this;
};


Obsy.prototype.stop = function() {
	this.redisClient.quit();
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
		} else if (typeof obj[i] === 'object' && obj[i] instanceof Array) {
			linear[branchId] = obj[i];
		} else if (typeof obj[i] === 'object') {
			var subLinears = this.linearize(branchId, obj[i]);
			for (var subId in subLinears) {
				linear[subId] = subLinears[subId];
			}
		}
	}
	return linear;
};



// ===================================================


module.exports = Obsy;


// ===================================================


function detailedType(value) {
	var varType = typeof value;
	if (Buffer.isBuffer(value)) {
		varType = 'buffer';
	} else if (value instanceof Array) {
		varType = 'array';
	};
	return varType;
};


function deepAssign(baseObj, keys, deepValue) {
	var step = baseObj;
	while (keys.length > 0) {
		var key = keys.shift();
		if (keys.length > 0) {
			if (typeof step[key] !== 'object') {
				step[key] = {};
			}
		} else {
			if (typeof deepValue === 'undefined') {
				delete step[key];
			} else {
				step[key] = copy(deepValue);
			}
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
		for (var f = 0; f < source.length; f++) {
			clone.push(copy(source[f]));
		}
	} else if (
		typeof source.constructor !== 'undefined' 
		&& typeof source.constructor.name === 'string' 
		&& source.constructor.name === 'ObjectID'
	) { 
    var clone = new source.constructor('' + source);
  } else if (
		typeof source.constructor === 'function' 
		&& source.constructor.name !== 'Object'
	) {
		var clone = new source.constructor(source);
	} else {
		var clone = {};
	  for (var f in source) {
			clone[f] = copy(source[f]);
		}
  }
	return clone;
};


function copy(source) {
	if (typeof source === 'undefined') {
		return void 0;
	} else if (typeof source === 'number') {
		return Number(source);
	} else if (typeof source === 'string') {
		return String(source);
	} else if (typeof source === 'object') {
		return clone(source);
	} else if (typeof source === 'function') {
		return source.valueOf();
	} else if (typeof source === 'boolean') {
		return Boolean(source.valueOf());
	} 
	return source;
};


function randomString(length, numbers, alphabetLowerCase, timestamp, alphabetUpperCase) {   
  var id = '';
	var chars_alphabet = new Array('a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z');
  var chars_numbers = new Array('1','2','3','4','5','6','7','8','9','0');
  var chars_upperCase = new Array('A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z');  
  var idchars = new Array(0);
  if (typeof numbers !== 'boolean') {
		numbers = true;
	}
  if (typeof alphabetLowerCase !== 'boolean') {
		alphabetLowerCase = false;
	}
  if (typeof alphabetUpperCase !== 'boolean') {
		alphabetUpperCase = false;
	}
  if (typeof timestamp !== 'boolean') {
		timestamp = false;
	}
  if (timestamp === true) {
		id += Date.now();
	}
  if (
		timestamp === true 
		&& alphabetLowerCase === false 
		&& numbers === false 
		&& alphabetUpperCase === false
	) {
		return id; 
	}    
  if (numbers === true) { 
		idchars = idchars.concat(chars_numbers); 
	}
  if (alphabetLowerCase === true) { 
		idchars = idchars.concat(chars_alphabet); 
	}
  if (alphabetUpperCase === true) { 
		idchars = idchars.concat(chars_upperCase); 
	}
  var lengthIdChars = idchars.length;
  for (var i=0; i < length; i++) {
    id += idchars[Math.floor(Math.random()*lengthIdChars)];
  }  
  return id;
};

