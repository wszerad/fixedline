Creating and reading fixed size lines.
===

### Usage:

```js
var Parser = require('fixedline').Parser;
var simple = new Parser({
	date: {
		size: 5,
		type: String
	},
	counter: {
		size: 5,
		type: Number
	},
	bool: {
		size: 5,
		type: Boolean
	}
});

var buffer = sample.encode(['12:06:34 2014/0/30', '012345', 'true']);
//return Buffer of size 29 chars, no matter if there are specified any data or data are to long

//if true, return object {date: ..., counter: ..., bool: ...} else [..., ..., ...]
var toObj = true;

sample.decode(buffer, toObj)

```

### Parser.encode( [ params ] )

return Buffer

### Parser.decode( buffer, toObj )

return Object or Array with data

### Parser.getLine( fd/path, lineNum, toObj )

as above but from file with specified line

### Parser.lineBytes( fd/path, lineNum )

return Object {fd: fileDescription, start: Number, end: Number} where start and end is range in file 

### Parser.getCell( fd/path, lineNum, cellNum/name )

as above but of cell

### Parser.cellBytes( fd/path, lineNum, cellNum )

like .getLine but only one cell

```js
//TODO
.getLines( fd/path, startLine, endLine, toObj )
add array support
```