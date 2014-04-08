var wadl2json = require("../wadl2json.js");

var _ = require("lodash");

describe("wadl2json.fromFile", function() {
  var methodsByPath = wadl2json.fromFile("spec/simple.wadl");

  it("should detect all paths", function() {
    expect(_.size(methodsByPath)).toBe(5);
  });

  it("should make children resources inherit path from their parent", function() {
    expect(_.has(methodsByPath, "/organisations/{id}/applications/{appId}")).toBe(true);
  });

  it("should detect all methods", function() {
    var methods = _.chain(methodsByPath).values().flatten().value();
    expect(_.size(methods)).toBe(5);
  });
});
