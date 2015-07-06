exports.Serializer        = require('./serializer')
exports.Resource          = require('./resource')

// mongoose is a dev / optional dep.
try{
	exports.Resource.Mongoose = require("./resource/mongoose")
} catch( e ){
	console.error("unable to load mongo resource:", e.message )
	console.error(e.stack)
}

exports.Api               = require('./api')
exports.http              = require('./http')
exports.Paginator         = require('./paginator')
exports.Cache             = require('./cache')
exports.exceptions        = require('./exceptions')
exports.Class             = require('./class')
exports.Class.Options     = require('./class/options')
exports.http              = require('./http')
