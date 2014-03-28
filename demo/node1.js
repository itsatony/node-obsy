// n use 0.11.12 --harmony node1.js
var ObSy = require('../lib/obsy');
var vws = {
	syncMe: {}
};
var myObjectSync = new ObSy('obsyTest1', vws.syncMe);
myObjectSync.debug = true;

setInterval(
	function() {
		console.log('==== STATE ====');
		console.log(vws.syncMe);
	},
	1000
);

setTimeout(
	function() {
		vws.syncMe.d = ['reverse','nla,blu',1];
	},
	4500
);
setTimeout(
	function() {
		vws.syncMe.g = new Buffer('bbbbuuuuuuuufffffeeeeerrrrr');
	},
	7500
);

setTimeout(
	function() {
		delete vws.syncMe.b;
	},
	9500
);

setTimeout(
	function() {
		process.exit();
	},
	15000
);