wadl2json
=========

Convert a WADL remote file into a JSON string.

How to build
------------

    sbt stage

How to run
----------

    ./wadl2json http://api.example.com/api/resources/application.wadl

Example of returned data
------------------------

    {
      "/users/{userId}":[{
        "verb": "GET",
        "name": "getUser",
        "params": [{
          "name": "userId",
          "style": "template"
        }]
      },{
        "verb": "DELETE",
        "name": "removeUser",
        "params": [{
          "name": "userId",
          "style": "template"
        },{
          "name": "Authorization",
          "style": "header"
        }]
      }]
    }
