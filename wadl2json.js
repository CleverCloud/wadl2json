/**
 * A module generating a JSON representation of a WADL content
 * @module wadl2json
 */
(function() {
  var fs = require("fs");
  var request = require("request");
  var url = require("url");

  var _ = require("lodash");
  var parser = require("xml2json");
  var beautify = require("js-beautify").js_beautify;

  var wadl2json = exports;

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
        params: params,
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
    var methodsByPath = _.groupBy(methods, "path");
    var paths = _.chain(methodsByPath).keys().sortBy().value();

    return _.foldl(paths, function(methods, path) {
      var methodsByVerb = _.groupBy(methodsByPath[path], "verb");
      var verbs = _.chain(methodsByVerb).keys().sortBy().value();

      return _.foldl(verbs, function(methods, verb) {
        var sortedOperations = _.sortBy(methodsByVerb[verb], "name");

        methods[path] = methods[path] || {};
        methods[path][verb.toLowerCase()] = {
          responses: {
            "default": {
              description: _.pluck(sortedOperations, "name").join("\n")
            }
          },
          parameters: (function() {
            var params = _.chain(sortedOperations)
              .pluck("params")
              .flatten(true)
              .uniq("name")
              .map(function(param) {
                return {
                  "name": param.name,
                  "required": param.style == "template",
                  "in": ({template: "path", plain: "body"})[param.style] || param.style,
                  "type": param.type.split(":")[1] || param.type.split(":")[0]
                };
              })
              .value();

            if(_.size(params) > 0) {
              return params;
            }
          })()
        };
        return methods;
      }, methods);
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
    var base = resources && resources.base && require("url").parse(resources.base);

    var methods = _.chain(resources && resources.resource)
      .map(_.partial(wadl2json._methodsFromWADLResource, "/"))
      .flatten(true)
      .filter(function(method) {
        return _.all(options.blacklist, function(path) {
          return method.path.indexOf(path) !== 0;
        });
      })
      .value();

    var methodsByPath = wadl2json._groupMethodsByPath(methods);

    var json = {};
    json.swagger = "2.0";

    json.schemes = [base.protocol.replace(/:$/, "")];
    json.host = base.host;
    json.basePath = base.path.replace(/\/$/, "");

    json.paths = methodsByPath;

    json.info = {
      title: options.title || "",
      version: options.version || "",
      description: options.description || ""
    };

    json = options.stringify ? JSON.stringify(json) : json;
    json = options.stringify && options.prettify ? beautify(json, {indent_size: 2}) : json;

    return json;
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
    request(wadlURL, function(err, res, body) {
      if(err) {
        callback(err);
      }
      else {
        callback(null, wadl2json.fromString(body, options));
      }
    });
  };
})();
