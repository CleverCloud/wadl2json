var wadl2json = module.exports = (function() {
  var wadl2json = {};

  var fs = require("fs");
  var http = require("http");
  var https = require("https");
  var url = require("url");

  var _ = require("lodash");
  var parser = require("xml2json");
  var beautify = require("js-beautify").js_beautify;

  wadl2json._fetchers = {};
  wadl2json._fetchers["http:"] = http;
  wadl2json._fetchers["https:"] = https;

  wadl2json._defaultOptions = {
    prettify:   false,
    sort:       false,
    stringify:  false
  };

  wadl2json._methodsFromWADLResource = function(basePath, resource) {
    var path = basePath + (_.last(basePath) == "/" ? "":"/") + resource.path;

    var methods = _.map(resource.method || [], function(method) {
      var request = method && method.request && method.request[0];
      var params = (resource.param || [])
        .concat(request && request.param || [])
        .concat(request && request.representation && request.representation[0] && request.representation[0].param || []);

      return {
        verb: method.name,
        name: method.id,
        params: _.map(params, function(param) {
          return _.pick(param, ["name", "style"]);
        }),
        path: path
      };
    });

    return methods.concat(_.map(resource.resource || [], _.partial(wadl2json._methodsFromWADLResource, path)));
  };

  wadl2json._groupMethodsByPath = function(methods) {
    return _.chain(methods)
      .groupBy("path")
      .mapValues(function(methods) {
        return _.map(methods, function(method) {
          return _.omit(method, "path");
        });
      })
      .value();
  };

  wadl2json._sortMethodsByPathAndVerb = function(methodsByPath) {
    var paths = _.chain(methodsByPath).keys().sortBy().value();

    return _.foldl(paths, function(sortedMethods, path) {
      sortedMethods[path] = _.sortBy(methodsByPath[path], "verb");
      return sortedMethods;
    }, {});
  };

  wadl2json.fromJSON = function(wadlJson, options) {
    var options = _.extend({}, wadl2json._defaultOptions, options);

    var app = wadlJson && wadlJson.application && wadlJson.application[0];
    var resources = app && app.resources && app.resources[0];
    var base = resources && resources.base;

    var methods = _.flatten(_.map(resources && resources.resource, _.partial(wadl2json._methodsFromWADLResource, "/")));
    var methodsByPath = wadl2json._groupMethodsByPath(methods);

    methodsByPath = options.sort ? wadl2json._sortMethodsByPathAndVerb(methodsByPath) : methodsByPath;
    methodsByPath = options.stringify ? JSON.stringify(methodsByPath) : methodsByPath;
    methodsByPath = options.stringify && options.prettify ? beautify(methodsByPath, {indent_size: 2}) : methodsByPath;

    return methodsByPath;
  };

  wadl2json.fromString = function(wadlString, options) {
    /* Remove XML header as xml2json is not able to parse it */
    var wadlString = wadlString.replace(/<\?[^<]*\?>/g, "");
    var wadlJson = parser.toJson(wadlString, {
      object: true,
      arrayNotation: true
    });

    return wadl2json.fromJSON(wadlJson, options);
  };

  wadl2json.fromFile = function(filename, options) {
    var wadlString = fs.readFileSync(filename).toString();

    return wadl2json.fromString(wadlString, options);
  };

  wadl2json.fromURL = function(wadlURL, callback, options) {
    var protocol = url.parse(wadlURL).protocol;
    var fetcher = wadl2json._fetchers[protocol];

    if(!fetcher) {
      callback(new Error("Invalid protocol: " + protocol + "//"));
    }
    else {
      fetcher.get(wadlURL, function(res) {
        var wadlString = "";
        res.on("data", function(data) {
          wadlString += data;
        });
        res.on("end", function() {
          callback(null, wadl2json.fromString(wadlString, options));
        });
      }).on("error", function(error) {
        callback(error);
      });
    }
  };

  return wadl2json;
})();
