var helpers = {};
var should = require('should');

describe(
	'a simple test',
	function() {
		it(
			'should return something', 
			function(done) {
				should.exist(helpers);
				done();
			}
		);
	}
);