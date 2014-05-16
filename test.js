var child_process = require('child_process')
  , fs = require('fs')
  , util = require("util")
  , production = (process.env.NODE_ENV == 'production')
  , html
  , coverage
  , stdout


html = fs.createWriteStream('coverage.html',{
	flags:"w"
	,encoding:'utf8'
});

if( production ){
	reporter = fs.createWriteStream('tap.xml',{
		flags:'w'
		,encoding:'utf8'
	})
} else {
	reporter = process.stdout
}
coverage = child_process.spawn("mocha", [ "--recursive", "-r", "jscoverage", "--reporter=html-cov"])
stdout = child_process.spawn("mocha", ["--growl", "--recursive", util.format("--reporter=%s", production ? 'xunit':'spec')])

coverage.stdout.pipe( html )
stdout.stdout.pipe( reporter )
