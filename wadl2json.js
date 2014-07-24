/**
 * A module generating a JSON representation of a WADL content
 * @module wadl2json
 */
(function() {
  var fs = require("fs");
  var http = require("http");
  var https = require("https");
  var url = require("url");

  var _ = require("lodash");
  var parser = require("xml2json");
  var beautify = require("js-beautify").js_beautify;

  var wadl2json = exports;
  wadl2json._fetchers = {};
  wadl2json._fetchers["http:"] = http;
  wadl2json._fetchers["https:"] = https;

  wadl2json._defaultOptions = {
    prettify:   false,
    sort:       false,
    stringify:  false
  };

  /**
   * Extract all methods from a parsed WADL content
   * @private
   * @param {string} basePath - path which will be prepended to resource path
   * @param {object} resource - WADL <resource> tag
   * @returns {array} all methods contained in resource
   */
  exports._methodsFromWADLResource = function(basePath, resource) {
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

  /**
   * Group methods by path
   * @private
   * @param {array} methods - methods returned by _methodsFromWADLResource
   * @returns {object} methods grouped by path
   */
  exports._groupMethodsByPath = function(methods) {
    return _.chain(methods)
      .groupBy("path")
      .mapValues(function(methods) {
        return _.map(methods, function(method) {
          return _.omit(method, "path");
        });
      })
      .value();
  };

  /**
   * Sort methods by path, and then by verb
   * @private
   * @param {object} methodsByPath - methods returned by _groupMethodsByPath
   * @returns {object} same object, with keys sorted by name
   */
  exports._sortMethodsByPathAndVerb = function(methodsByPath) {
    var paths = _.chain(methodsByPath).keys().sortBy().value();

    return _.foldl(paths, function(sortedMethods, path) {
      var methodsByVerb = _.groupBy(methodsByPath[path], "verb");
      var verbs = _.chain(methodsByVerb).keys().sortBy().value();

      sortedMethods[path] = _.foldl(verbs, function(methods, verb) {
        return methods.concat(_.sortBy(methodsByVerb[verb], "name"));
      }, []);

      return sortedMethods;
    }, {});
  };

  /**
   * Generate a JSON representation from parsed WADL content
   * @param {object} wadlJson - object representing wadl content
   * @param {object} [options] - options
   * @returns {object|string} JSON representation of given WADL content
   */
  exports.fromJSON = function(wadlJson, options) {
    options = _.extend({}, wadl2json._defaultOptions, options);

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

  /**
   * Generate a JSON representation from raw WADL content
   * @param {string} wadlString - raw WADL content
   * @param {object} [options] - options
   * @returns {object|string} JSON representation of given WADL content
   */
  exports.fromString = function(wadlString, options) {
    /* Remove XML header as xml2json is not able to parse it */
    wadlString = wadlString.replace(/<\?[^<]*\?>/g, "");
    var wadlJson = parser.toJson(wadlString, {
      object: true,
      arrayNotation: true
    });

    return wadl2json.fromJSON(wadlJson, options);
  };

  /**
   * Generate a JSON representation from a WADL file
   * @param {string} filename - name of a file containing WADL content
   * @param {object} [options] - options
   * @returns {object|string} JSON representation of given WADL content
   */
  exports.fromFile = function(filename, options) {
    var wadlString = fs.readFileSync(filename).toString();

    return wadl2json.fromString(wadlString, options);
  };

  /**
   * @callback requestCallback
   * @param {object} error - Forwarded error if unreachable content or generation fail. May be null.
   * @param {object|string} JSON representation of given WADL content
   */

  /**
   * Generate a JSON representation from a remote WADL file
   * @param {string} wadlURL - url of remote WADL content
   * @param {requestCallback} callback - function called on process end
   * @param {object} [options] - options
   */
  exports.fromURL = function(wadlURL, callback, options) {
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
})();
