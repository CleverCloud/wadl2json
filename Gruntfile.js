module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    jasmine_node: {
      all: ["spec/"]
    },
    jsdoc: {
      dist: {
        src: ["wadl2json.js"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-jasmine-node");
  grunt.loadNpmTasks("grunt-jsdoc");

  grunt.registerTask("test", ["jasmine_node"]);

  grunt.registerTask("default", ["test"]);
};
