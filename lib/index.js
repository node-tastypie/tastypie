var debug                 = require('debug')('tastypie')
exports.Serializer        = require('./serializer')
exports.Resource          = require('./resource')
try{
	exports.Resource.Mongoose = require('tastypie-mongoose')
}catch( err ){
	debug("unable to load tastypie-mongoose");
	debug("MongooseResource not avaible");
	debug("npm install tastypie-mongoose --save"):
}
exports.Resource.Rethink  = require('./resource/rethink')
exports.Api               = require('./api')
exports.http              = require('./http')
exports.Paginator         = require('./paginator')
exports.Cache             = require('./cache')
exports.exceptions        = require('./exceptions')
exports.Class             = require('./class')
exports.Class.Options     = require('./class/options')
exports.http              = require('./http')
exports.constants         = require('./constants')
exports.urljoin           = require('urljoin')
