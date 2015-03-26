var hapi = require( 'hapi' )

var app = new hapi.Server();

app.connection({
	port: process.env.PORT || 7100
	,host:'127.0.0.1'
	,labels:'tastypie'
});


var hapistart = app.start;

app.start = function start( callback ){

	if( app.started ){
		return callback()
	}

	app.started = true;
	return hapistart.apply( app, arguments );
};

module.exports = app;
