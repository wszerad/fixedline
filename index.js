var fs = require('fs');
var _ = {};

var Parser = _.Parser = function(scheme){
	this.osize = 0;
	this.conv = [];
	this.off = [];
	this.size = [];
	this.names = [];

	this.fill = ' ';

	var index = 0;
	var maxSize = 0;
	for(var i in scheme){
		this.names[index] = i;
		this.size[index] = scheme[i].size;
		this.off[index] = this.osize;
		this.osize += scheme[i].size;

		var type = scheme[i].type;
		switch(true){
			case type===Boolean:
				type = function(dat){
					return (dat==='false'? false : true);
				}
				break;
		}
		this.conv[index] = type;
		
		maxSize = Math.max(scheme[i].size, maxSize);
		index++;
	}

	//+1 for new line char
	this.osize++;

	this.buf = new Buffer(this.osize);
	this.bufill = new Buffer(maxSize);
	this.bufill.fill(this.fill);
};

Parser.prototype.encode = function(params){
	var self = this;

	this.size.forEach(function(size, index){
		var data = params[index];
		if(data !== undefined){
			var chars = self.buf.write((self.conv[index]!==String? data.toString() : data), self.off[index], self.size[index]);
			if(chars<self.size[index])
				self.bufill.copy(self.buf, self.off[index]+chars, 0, self.size[index]-chars);
		}else{
			self.bufill.copy(self.buf, self.off[index], 0, self.size[index]);
		}
	});

	this.buf.write('\n', this.osize-1);
	return new Buffer(this.buf);
};

Parser.prototype.decode = function(buf, obj){
	var self = this;
	var ret;

	if(obj){
		ret = {};
		this.size.reduce(function(obj, size, index){
			ret[self.names[index]] = self.conv[index](buf.toString('utf8', self.off[index], self.off[index]+size).trimRight());
		}, ret);
	}else{
		ret = [];

		this.size.forEach(function(size, index){
			ret.push(self.conv[index](buf.toString('utf8', self.off[index], self.off[index]+size).trimRight()));
		});
	}

	return ret;
};

Parser.prototype.getLine = function(fd, line, obj){
	var params = this.lineBytes(fd, line);

	fs.readSync(params.fd, this.buf, 0, this.osize, params.start, 0);
	return this.decode(this.buf, obj);
};

Parser.prototype.lineBytes = function(fd, line){
	var size, start;

	if(typeof fd === 'string')
		fd = fs.openSync(fd, 'r');

	size = fs.fstatSync(fd).size;

	if(line === -1)
		line = Math.ceil(size/this.osize);

	start = line*this.osize;

	return {fd: fd, start: start, end: start+this.osize-1};
};

Parser.prototype.getCell = function(fd, line, cell){
	var index, len, params;

	if((index = this.names.indexOf(cell)) === -1){
		index = cell;
	}

	params = this.cellBytes(fd, line, index);
	len = params.end-params.start+1;
	fs.readSync(params.fd, this.buf, 0, len, params.start, 0);

	return this.conv[index](this.buf.toString('utf8', 0, len).trimRight());
};

Parser.prototype.cellBytes = function(fd, line, index){
	var size, start;

	if(typeof fd === 'string')
		fd = fs.openSync(fd, 'r');

	size = fs.fstatSync(fd).size;

	if(line === -1)
		line = Math.ceil(size/this.osize);

	start = line*this.osize+this.off[index];

	return {fd: fd, start: start, end: start+this.size[index]-1};
};

module.exports = _;