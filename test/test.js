var fs = require('fs');
var _ = require('../index.js').Parser;

var writer = fs.createWriteStream(__dirname+'/logs/out.log');
var Parser = new _({
	date: {
		size: 18,
		type: String
	},
	name: {
		size: 10,
		type: String
	},
	overtext: {
		size: 12,
		type: String
	},
	counter: {
		size: 6,
		type: Number
	},
	bool: {
		size: 5,
		type: Boolean
	}
});

writer.on('open', function(){
	writer.write(Parser.encode(['12:06:34 2014/0/30', 'fixrows', 'Some text which is too long', '012345', 'true']));
	writer.write(Parser.encode(['12:06:35 2014/0/30', 'fixrows', 'Some text which is too long', '012h45', 'true']));
	writer.write(Parser.encode(['12:06:36 2014/0/30', 'fixrows', 'Some text', '0145', 'false']));
	writer.write(Parser.encode(['12:07:34 2014/0/30', 'fixrows', 'Some text', '2345', 'false']));
	writer.write(Parser.encode(['12:08:34 2014/0/30', 'admin', 'Some text which is too long', '01345', 'true']));
	writer.close();

	setTimeout(function(){
		console.log(Parser.lineBytes(__dirname+'/logs/out.log', 0));
		console.log(Parser.cellBytes(__dirname+'/logs/out.log', 1, 0));
		console.log(Parser.getCell(__dirname+'/logs/out.log', 1, 'name'));
		console.log(Parser.getLine(__dirname+'/logs/out.log', 2, true));
	} ,100);
});

writer.on('error', function(err){
	console.log('Error:')
	console.log(err);
});