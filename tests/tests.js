var _ = require('../index.js').Parser;
var assert = require('assert');
var fs = require('fs');

describe('fixedline.encode', function() {
	it('String', function () {
		var b = new _({
			data: {
				size: 5,
				type: String
			}
		});

		assert.strictEqual(b.encode(['kapus']).toString(), 'kapus\n');
	});

	it('String filling', function () {
		var b = new _({
			data: {
				size: 5,
				type: String
			}
		});

		assert.strictEqual(b.encode(['kap']).toString(), 'kap  \n');
	});

	it('Number', function () {
		var b = new _({
			data: {
				size: 5,
				type: Number
			}
		});

		assert.strictEqual(b.encode([1234]).toString(), '1234 \n');
	});

	it('Boolean', function () {
		var b = new _({
			data: {
				size: 5,
				type: Boolean
			}
		});

		assert.strictEqual(b.encode([true]).toString(), 'true \n');
	});

	it('Array of Boolean', function () {
		var b = new _({
			data: {
				size: 2,
				type: [
					{
						type: Boolean,
						size: 5
					}
				]
			}
		});

		assert.strictEqual(b.encode([[true, true]]).toString(), 'true  true \n');
	});

	it('String overwriting', function () {
		var b = new _({
			data: {
				size: 5,
				type: String
			}
		});

		assert.strictEqual(b.encode(['kapusta musi byc']).toString(), 'kapus\n');
	});

	it('Array filling', function () {
		var b = new _({
			data: {
				size: 2,
				type: [
					{
						type: String,
						size: 2
					}
				]
			}
		});

		assert.strictEqual(b.encode([['ka']]).toString(), 'ka   \n');
	});

	it('Array overwrating', function () {
		var b = new _({
			data: {
				size: 2,
				type: [
					{
						type: String,
						size: 2
					}
				]
			}
		});

		assert.strictEqual(b.encode([['ka', 'pu', 'sta']]).toString(), 'ka pu\n');
	});
});

var multi = new _({
	string: {
		size: 5,
		type: String
	},
	bool: {
		size: 5,
		type: Boolean
	},
	arrB: {
		size: 2,
		type: [
			{
				type: Boolean,
				size: 5
			}
		]
	},
	number: {
		size: 5,
		type: Number
	},
	arrS: {
		size: 2,
		type: [
			{
				type: String,
				size: 5
			}
		]
	}
});

var paramsArr = [['testowo', true, [false, true], 54321, ['abra', 'cadabra']], ['testowo', false, [true, false], 12345, ['abra', 'cadabra']], ['testowo', true, [false, true], 12345, ['abra', 'cadabra']]];
var bufferArr = paramsArr.map(function(ele){
	return multi.encode(ele);
});

var buffer1 = multi.encode(['testowo', false, [true, false], 12345, ['abra', 'cadabra']]);
var buffer2 = multi.encode({
	string: 'testowo',
	bool: false,
	arrB: [true, false],
	number: 12345,
	arrS: ['abra', 'cadabra']
});

var obj = multi.decode(buffer1, false);
var arr = multi.decode(buffer1, true);

describe('fixedline.encode from Object', function(){
	it('from Object === from Array', function(){
		assert.strictEqual(buffer1.toString(), buffer2.toString());
	});
});

describe('fixedline.decode', function(){
	it('String', function () {
		assert.strictEqual(obj.string, 'testo');
	});

	it('String2', function () {
		assert.strictEqual(arr[0], 'testo');
	});

	it('Number', function () {
		assert.strictEqual(obj.number, 12345);
	});

	it('Number2', function () {
		assert.strictEqual(arr[3], 12345);
	});

	it('Boolean', function () {
		assert.strictEqual(obj.bool, false);
	});

	it('Boolean2', function () {
		assert.strictEqual(arr[1], false);
	});

	it('Array of Boolean', function () {
		assert.strictEqual(obj.arrB[0], true);
		assert.strictEqual(obj.arrB[1], false);
	});

	it('Array of Boolean2', function () {
		assert.strictEqual(arr[2][0], true);
		assert.strictEqual(arr[2][1], false);

	});

	it('Array of String', function () {
		assert.strictEqual(obj.arrS[0], 'abra');
		assert.strictEqual(obj.arrS[1], 'cadab');
	});

	it('Array of String2', function () {
		assert.strictEqual(arr[4][0], 'abra');
		assert.strictEqual(arr[4][1], 'cadab');
	});
});

var fd = fs.openSync(__dirname+'/logs/testing.log', 'w+');
bufferArr.forEach(function(buf, i){
	fs.writeSync(fd, buf, 0, buf.length, multi.osize*i);
});

describe('fixedline file operations', function(){
	it('#.linesBytes', function(){
		var ret = multi.linesBytes(fd, -2, -1);
		assert.deepEqual({start: ret.start, end: ret.end, lines: ret.lines}, {start: 42, end: 126, lines: 2 });
	});

	it('#.getLines', function(){
		assert.deepEqual(multi.getLines(fd, -2, -1, true), [
			[
				"testo",
				false,
				[
					true,
					false
				],
				12345,
				[
					"abra",
					"cadab"
				]
			],
			[
				"testo",
				true,
				[
					false,
					true
				],
				12345,
				[
					"abra",
					"cadab"
				]
			]
		]);
	});

	it('#.getLine', function(){
		assert.deepEqual(multi.getLine(fd, -1, true), [
			"testo",
			true,
			[
				false,
				true
			],
			12345,
			[
				"abra",
				"cadab"
			]
		]);
	});

	it('#.cellButes', function(){
		var ret = multi.cellBytes(fd, -2, 'arrB');
		assert.deepEqual({start: ret.start, end: ret.end, length: ret.length}, {start: 54, end: 66, length: 2 });
	});

	it('#.getCell', function(){
		assert.deepEqual(multi.getCell(fd, -2, 'arrB'), [true, false]);
	});
});

setInterval(function(){console.log(':D');}, 300);