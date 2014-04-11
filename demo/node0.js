// n use 0.11.12 --harmony node0.js
var ObSy = require('../lib/obsy');
var vws = {
	syncMe: {
		x: 17
	}
};
var myObjectSync = new ObSy('obsyTest1', vws.syncMe);
myObjectSync.debug = true;

// myObjectSync.empty();

setInterval(
	function() {
		console.log('==== STATE ====');
		console.log(vws.syncMe);
	},
	1000
);


setTimeout(
	function() {
		vws.syncMe.a = 1;
	},
	1000
);
setTimeout(
	function() {
		vws.syncMe.b = {
			b1: 'super',
			b2: 'sync'
		};
	},
	3000
);

setTimeout(
	function() {
		
	},
	11000
);

setTimeout(
	function() {
		process.exit();
	},
	15000
);

