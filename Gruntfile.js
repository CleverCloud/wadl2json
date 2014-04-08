module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    jasmine_node: {
      all: ["spec/"]
    }
  });

  grunt.loadNpmTasks("grunt-jasmine-node");

  grunt.registerTask("test", ["jasmine_node"]);

  grunt.registerTask("default", ["test"]);
};
