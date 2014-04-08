var _ = require("lodash");
var beautify = require("js-beautify").js_beautify;

var defaultOptions = {
  prettify: false,
  sort: false
};

var stringify = function(methodsByPath, options) {
  var stringified = JSON.stringify(methodsByPath);

  return options.stringify ? beautify(stringified, {indent_size: 2}) : stringified;
};

var sort = function(methodsByPath) {
  var paths = _.chain(methodsByPath).keys().sortBy().value();

  return _.foldl(paths, function(sortedMethods, path) {
    sortedMethods[path] = _.sortBy(methodsByPath[path], "verb");
    return sortedMethods;
  }, {});
};

var extractMethods = function(json) {
  var app = json && json.application && json.application[0];
  var resources = app && app.resources && app.resources[0];
  var base = resources && resources.base;

  var methodsFromResources = function(basePath, resource) {
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

    return methods.concat(_.map(resource.resource || [], _.partial(methodsFromResources, path)));
  };

  var methods = _.flatten(_.map(resources && resources.resource, _.partial(methodsFromResources, "/")));
  var methodsByPath = _.chain(methods)
    .groupBy("path")
    .mapValues(function(methods) {
      return _.map(methods, function(method) {
        return _.omit(method, "path");
      });
    })
    .value();

  return methodsByPath;
};

var format = module.exports = function(wadl, options) {
  var options = _.extend({}, defaultOptions, options);
  var methodsByPath = extractMethods(wadl);
  var json = options.sort ? sort(methodsByPath) : methodsByPath;
  var stringified = stringify(json, options);

  return stringified;
};
