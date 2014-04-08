var parser = require("xml2json");
var format = require("./format.js");

exports.string2json = function(wadl, options) {
  /* Remove XML header as xml2json is not able to parse it */
  wadl = wadl.replace(/<\?[^<]*\?>/g, "");

  return format(parser.toJson(wadl, {
    object: true,
    arrayNotation: true
  }), options);
};
