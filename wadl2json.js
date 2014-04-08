var parser = require("xml2json");
var fs = require("fs");
var http = require("http");
var https = require("https");
var format = require("./format.js");

exports.string2json = function(wadl, options) {
  /* Remove XML header as xml2json is not able to parse it */
  wadl = wadl.replace(/<\?[^<]*\?>/g, "");

  return format(parser.toJson(wadl, {
    object: true,
    arrayNotation: true
  }), options);
};

exports.file2json = function(filename, options) {
  var content = fs.readFileSync(filename).toString();
  return exports.string2json(content, options);
};

exports.url2json = function(url, callback, options) {
  var protocol = url.indexOf("https://") == 0 ? https : http;

  protocol.get(url, function(res) {
    var content = "";
    res.on("data", function(data) {
      content += data;
    });
    res.on("end", function() {
      callback(null, exports.string2json(content, options));
    });
  }).on("error", function(error) {
    callback(error);
  });
};
