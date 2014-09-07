var fs = require('fs');
var _ = {};

var Parser = _.Parser = function(scheme){
	this.osize = 0;
	this.fill = ' ';
	this.scheme = {};

	function record(name, type, size, len){
		switch(true){
			case type===Boolean:
				type = function(dat){
					return (dat!=='false');
				};
				break;
		}

		this.scheme[name] = {
			conv: type,
			size: size,
			len: len,
			off: this.osize
		};

		this.osize += (len? len : 1)*(size+1);	//for space between values

		return size;
	}

	for(var i in scheme){
		var obj = scheme[i];

		if(Array.isArray(obj.type))
			record.call(this, i, obj.type[0].type, obj.type[0].size, obj.size);
		else
			record.call(this, i, obj.type, obj.size);
	}

	this.names = Object.keys(this.scheme);
	this.buf = new Buffer(this.osize);
};

Parser.prototype.encode = function(params){
	var self = this;
	var isArray = Array.isArray(params);

	this.buf.fill(this.fill);

	function record(data, off, size, conv){
		if(data!==undefined)
			self.buf.write(data.toString(), off, size, 'utf8');
	}

	this.names.forEach(function(name, index){
		var attr = self.scheme[name];
		var conv = (attr.type!==String);
		var data = (isArray? params[index] : params[name]);

		if(attr.len){
			for(var i=0; i<attr.len; i++){
				record(data[i], attr.off+(1+attr.size)*i, attr.size, conv);
			}
		}else{
			record(data, attr.off, attr.size, conv);
		}
	});

	this.buf.write('\n', this.osize-1);
	return new Buffer(this.buf);
};

Parser.prototype.decode = function(buf, arr){
	var ret, i, attr;

	function convert(conv, off, size){
		return conv(buf.toString('utf8', off, off+size).trimRight());
	}

	if(!arr){
		ret = {};

		for(i in this.scheme){
			attr = this.scheme[i];

			if(attr.len){
				ret[i] = [];
				for(var j=0; j<attr.len; j++){
					ret[i].push(convert(attr.conv, attr.off+j*(attr.size+1), attr.size));
				}
			} else {
				ret[i] = convert(attr.conv, attr.off, attr.size);
			}
		}
	}else{
		ret = [];

		for(i in this.scheme){
			attr = this.scheme[i];

			if(attr.len){
				var arr = [];
				ret.push(arr);
				for(var j=0; j<attr.len; j++){
					arr.push(convert(attr.conv, attr.off+j*(attr.size+1), attr.size));
				}
			} else {
				ret.push(convert(attr.conv, attr.off, attr.size));
			}
		}
	}

	return ret;
};

Parser.prototype.getLines = function(fd, startLine, endLine, arr){
	var ret = [],
		params = this.linesBytes(fd, startLine, endLine),
		buf = new Buffer(params.end-params.start);

	fs.readSync(params.fd, buf, 0, params.end-params.start, params.start, 0);

	for(var i=0;i<params.lines; i++){
		ret.push(this.decode(buf.slice(i*this.osize, (i+1)*this.osize), arr));
	}

	return ret;
};

Parser.prototype.getLine = function(fd, line, arr){
	return this.getLines(fd, line, line, arr)[0];
};

Parser.prototype.linesBytes = function(fd, startLine, endLine){
	var size,
		start,
		linesNum,
		lines;

	if(typeof fd === 'string')
		fd = fs.openSync(fd, 'r');

	size = fs.fstatSync(fd).size;
	linesNum = Math.ceil(size/this.osize);

	if(startLine<0)
		startLine = linesNum+startLine;

	if(endLine<0)
		endLine = linesNum+endLine;

	lines = (1+endLine-startLine);
	start = startLine*this.osize;

	return {fd: fd, start: start, end: start+lines*this.osize, lines: lines};
};

Parser.prototype.getCell = function(fd, line, name){
	var index,
		arr,
		chunk,
		size,
		params,
		buf;

	index = this.names.indexOf(name);

	if(index==-1)
		name = this.names[index];

	params = this.cellBytes(fd, line, name);
	size = params.end-params.start;
	buf = new Buffer(size);

	fs.readSync(params.fd, buf, 0, size, params.start, 0);

	if(params.length>1){
		arr = [];
		chunk = size/params.length;
		for(var i=0;i<params.length; i++){
			arr.push(this.scheme[name].conv(buf.toString('utf8', i*chunk, (1+i)*chunk).trimRight()));
		}
		return arr;
	}else
		return this.scheme[name].conv(buf.toString('utf8', 0, size).trimRight());
};

Parser.prototype.cellBytes = function(fd, line, name){
	var size,
		start,
		index,
		len,
		linesNum;

	index = this.names.indexOf(name);

	if(index==-1)
		name = this.names[index];

	if(typeof fd === 'string')
		fd = fs.openSync(fd, 'r');

	size = fs.fstatSync(fd).size;
	linesNum = Math.ceil(size/this.osize);

	if(line<0)
		line = linesNum+line;

	start = line*this.osize+this.scheme[name].off;
	len = this.scheme[name].len || 1;

	return {fd: fd, start: start, end: start+(this.scheme[name].size+1)*len, length: len};
};

module.exports = _;