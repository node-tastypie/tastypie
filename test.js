var child_process = require('child_process')
  , fs = require('fs')
  , util = require("util")
  , clone = require('mout/lang/clone')
  , production = (process.env.NODE_ENV === 'test')
  , html
  , reporter
  , coverage
  , mocha
  , env
  ;

env = clone( process.env );
env.MOCHA_COLORS = 1;

if( production ){
	reporter = fs.createWriteStream('tap.xml',{
		flags:'w'
		,encoding:'utf8'
	});
} else {
	html = fs.createWriteStream('coverage.html',{
		flags:"w"
		,encoding:'utf8'
	});
	coverage = child_process.spawn("mocha", [ "--recursive", "-r", "jscoverage", "--reporter=html-cov"]);
	coverage.stdout.pipe( html );
	reporter = process.stdout;
}

mocha = child_process.spawn("mocha", [
	"--growl"
	, "--recursive"
	, util.format("--reporter=%s", production ? 'xunit':'spec')
	, 'test/*.spec.js'
],{env:env})
mocha.on('exit', function( code ){
	process.exit( code );
})
mocha.stdout.pipe( reporter );
mocha.stderr.pipe( reporter );
