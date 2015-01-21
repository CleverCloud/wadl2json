var wadl2json = require("../wadl2json.js");

var _ = require("lodash");

describe("wadl2json.fromFile", function() {
  var swaggerJson = wadl2json.fromFile("spec/simple.wadl", {
    sort: true,
    title: "Simple API",
    description: "Simple API description",
    version: "1.4.2",
    blacklist: ["/internal"]
  });

  it("should generate the right swagger version", function() {
    expect(swaggerJson.swagger).toBe("2.0");
  });

  it("should generate the right schemes", function() {
    expect(swaggerJson.schemes.length).toBe(1);
    expect(swaggerJson.schemes[0]).toBe("http");
  });

  it("should generate the right host", function() {
    expect(swaggerJson.host).toBe("api.example.com");
  });

  it("should generate the right basepath", function() {
    expect(swaggerJson.basePath).toBe("/basepath");
  });

  it("should generate the right title", function() {
    expect(swaggerJson.info.title).toBe("Simple API");
  });

  it("should generate the right description", function() {
    expect(swaggerJson.info.description).toBe("Simple API description");
  });

  it("should generate the right version", function() {
    expect(swaggerJson.info.version).toBe("1.4.2");
  });

  it("should detect all paths", function() {
    expect(_.size(swaggerJson.paths)).toBe(5);
  });

  it("should make children resources inherit path from their parent", function() {
    expect(_.has(swaggerJson.paths, "/organisations/{id}/applications/{appId}")).toBe(true);
  });

  it("should detect all methods", function() {
    var methods = _.chain(swaggerJson.paths)
      .map(function(methods) { return _.keys(methods); })
      .flatten()
      .value();

    expect(_.size(methods)).toBe(6);
  });

  it("should sort by path", function() {
    var paths = _.keys(swaggerJson.paths);

    expect(paths[0]).toBe("/organisations");
    expect(paths[1]).toBe("/organisations/{id}");
    expect(paths[2]).toBe("/organisations/{id}/applications");
    expect(paths[3]).toBe("/organisations/{id}/applications/{appId}");
    expect(paths[4]).toBe("/users");
  });

  it("should sort by verb", function() {
    var verbs = _.keys(swaggerJson.paths["/organisations/{id}"]);

    expect(verbs[0]).toBe("get");
    expect(verbs[1]).toBe("post");
  });

  it("should merge names if there are several operations per method", function() {
    expect(swaggerJson.paths["/organisations/{id}"].get.responses["default"].description).toBe("getOrganisationWithApps\ngetOrganisationWithMembers");
  });

  it("should merge params if there are several operations per method", function() {
    var params = _.pluck(swaggerJson.paths["/organisations/{id}"].get.parameters, "name");

    expect(params[0]).toBe("id");
    expect(params[1]).toBe("show-apps");
    expect(params[2]).toBe("show-members");
  });

  it("should ignore blacklisted paths", function() {
    expect(swaggerJson.paths["/internal/applications"]).toBeUndefined();
    expect(swaggerJson.paths["/internal/applications/{appId}"]).toBeUndefined();
  });
});
