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
    },
    jshint: {
      all: ["Gruntfile.js", "wadl2json.js", "spec/**/*.js"]
    }
  });

  grunt.loadNpmTasks("grunt-jasmine-node");
  grunt.loadNpmTasks("grunt-jsdoc");
  grunt.loadNpmTasks("grunt-contrib-jshint");

  grunt.registerTask("test", ["jasmine_node"]);

  grunt.registerTask("default", ["jshint", "test"]);
};
