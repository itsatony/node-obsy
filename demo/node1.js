// n use 0.11.12 --harmony node1.js

var ObSy = require('../lib/obsy');
var vws = {
	syncMe: {}
};
var myObjectSync = new ObSy('obsyTest1', vws.syncMe);

setInterval(
	function() {
		console.log('==== STATE ====');
		console.log(vws.syncMe);
	},
	1000
);

setTimeout(
	function() {
		vws.syncMe.d = 'reverse';
	},
	4500
);
setTimeout(
	function() {
		delete vws.syncMe.b;
	},
	6500
);
setTimeout(
	function() {
		vws.syncMe.g = new Buffer('bbbbuuuuuuuufffffeeeeerrrrr');
	},
	7500
);