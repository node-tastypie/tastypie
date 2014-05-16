var util = require("util")

function UnsupportedFormat( type ){
	this.name = "Unsupported Format"
	this.message = util.format( "Unsupported serialization format: %s", type )
}
UnsupportedFormat.prototype = new Error();

