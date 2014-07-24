var wadl2json = require("../wadl2json.js");

var _ = require("lodash");

describe("wadl2json.fromFile", function() {
  var methodsByPath = wadl2json.fromFile("spec/simple.wadl", {
    sort: true
  });

  it("should detect all paths", function() {
    expect(_.size(methodsByPath)).toBe(5);
  });

  it("should make children resources inherit path from their parent", function() {
    expect(_.has(methodsByPath, "/organisations/{id}/applications/{appId}")).toBe(true);
  });

  it("should detect all methods", function() {
    var methods = _.chain(methodsByPath).values().flatten().value();
    expect(_.size(methods)).toBe(7);
  });

  it("should sort by path", function() {
    var paths = _.keys(methodsByPath);

    expect(paths[0]).toBe("/organisations");
    expect(paths[1]).toBe("/organisations/{id}");
    expect(paths[2]).toBe("/organisations/{id}/applications");
    expect(paths[3]).toBe("/organisations/{id}/applications/{appId}");
    expect(paths[4]).toBe("/users");
  });

  it("should sort by verb", function() {
    var verbs = _.pluck(methodsByPath["/organisations/{id}"], "verb");

    expect(verbs[0]).toBe("GET");
    expect(verbs[1]).toBe("GET");
    expect(verbs[2]).toBe("POST");
  });

  it("should sort by name", function() {
    var names = _.pluck(methodsByPath["/organisations/{id}"], "name");

    expect(names[0]).toBe("getOrganisation");
    expect(names[1]).toBe("getOrganisationWithFilter");
  });
});
