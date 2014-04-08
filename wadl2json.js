var parser = require("xml2json");
var fs = require("fs");
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
