var Obsy = require('../lib/obsy');
var should = require('should');
var helpers = {};
var useDebug = false;

helpers.server1 = {};
helpers.server1.testObject = {
	_number: 1,
	_string: 'aString1',
	_array: [ 2, 'aString2', true ],
	_object: {
		_o_number: 3,
		_o_string: 'aString3',
		_o_array: [ 4, 'aString4', false ],
	}
};

helpers.server2 = {};
helpers.server2.testObject = {};


describe(
	'state',
	function() {
		it(
			'helpers are present', 
			function(done) {
				should.exist(helpers);
				should.exist(helpers.server1.testObject);
				done();
			}
		);
	}
);


describe(
	'instantiation',
	function() {
		it(
			'should create a obsy instance', 
			function(done) {				
				helpers.server1.obsy = new Obsy('l337', helpers.server1.testObject);
				helpers.server1.obsy.debug = useDebug;
				helpers.server1.obsy.should.be.a.Object;
				helpers.server1.obsy.linearize.should.be.a.Function;
				done();
			}
		);
	}
);
describe(
	'instantiation2',
	function() {
		it(
			'should create a obsy instance', 
			function(done) {
				helpers.server2.obsy2 = new Obsy('l337', helpers.server2.testObject);
				helpers.server2.obsy2.debug = useDebug;
				helpers.server2.obsy2.should.be.a.Object;
				helpers.server2.obsy2.linearize.should.be.a.Function;
				done();
			}
		);
	}
);


describe(
	'linearize',
	function() {
		it(
			'should linearize object values', 
			function(done) {
				helpers.lin = helpers.server1.obsy.linearize('tst', helpers.server1.testObject);
				// console.log(helpers.lin);
				helpers.lin['tst._number'].should.be.a.Number;
				helpers.lin['tst._string'].should.be.a.String;
				helpers.lin['tst._array'].should.be.a.Array;
				helpers.lin['tst._object._o_number'].should.be.a.Number;
				helpers.lin['tst._object._o_string'].should.be.a.String;
				helpers.lin['tst._object._o_array'].should.be.a.Array;
				done();
			}
		);
	}
);



describe(
	'deepAssign',
	function() {
		it(
			'should objectize previously linearized values', 
			function(done) {
				helpers.lin['tst._number'] = 17;
				helpers.server1.obsy.deepAssign(helpers.server1.testObject, ['_number'], helpers.lin['tst._number']);
				helpers.server1.testObject._number = 13;
				// make sure values are not linked
				helpers.lin['tst._number'] = 15;
				helpers.server1.testObject._number.should.equal(13);
				done();
			}
		);
	}
);


describe(
	'was synced',
	function() {
		it(
			'should detect the sync triggered by using deepAssign directly', 
			function(done) {
				setTimeout(
					function() {
						// console.log(helpers.server2.testObject);
						helpers.server2.testObject._number.should.exist;
						done();
					},
					200
				);
			}
		);
	}
);



/* 
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
 */

