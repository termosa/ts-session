(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define("ts-session", ["angular"], factory);
  } else if (typeof exports === "object") {
    module.exports = factory(require("angular"));
  } else {
    factory(root.angular);
  }
}(this, function (angular) {
  "use strict";

  var moduleId = "tsSession";

  var clone = function(dst, src) {
    if (!src) return dst;

    for (var key in src) {
      if (src.hasOwnProperty(key)) dst[key] = src[key];
    }

    return dst;
  };

  var objectStorage = (function() {
    return {
      data: null,
      save: function save(data) {
        this.data = data;
      },
      load: function load() {
        return this.data;
      },
      drop: function drop() {
        this.data = null;
      }
    };
  })();

  var buildSession = function(storage, safe) {
    var sessions = storage.load() || {};

    var saveState = function() {
      storage.save(sessions);
    };

    var canOverlap = function(id) {
      if (skipSafe()) return true;
      return !safe || typeof sessions[id] === "undefined";
    };

    var skipSafe = (function() {
      var _skip = false;
      return function(skip) {
        if (typeof skip === "undefined") return _skip;
        return _skip = !!skip;
      };
    })();

    var withoutSafe = function(cb) {
      skipSafe(true);
      var result = cb();
      skipSafe(false);
      return result;
    };

    function Session(id, sessionData) {
      if (!canOverlap(id)) {
        throw new Error("Session with the id = '" + id + "' already exists");
      }
      if (!this) return new Session(id, sessionData);

      var session = this;

      sessions[id] = sessions[id] || {};
      clone(sessions[id], sessionData);
      saveState();

      session.getId = function() {
        return id;
      };

      session.get = function(key) {
        if (typeof key === "undefined") return sessions[id];
        return sessions[id][key];
      };

      session.set = function(key, value) {
        sessions[id][key] = value;

        saveState();
        return session;
      };

      session.del = function(key) {
        var data = clone({}, sessions[id]);
        delete data[key];
        sessions[id] = data;

        saveState();
        return session;
      };

      session.reset = function() {
        sessions[id] = {};

        saveState();
        return session;
      };

      return session;
    }

    Session.has = function(id) {
      return typeof sessions[id] !== "undefined";
    };

    Session.get = function(id) {
      if (safe && !Session.has(id)) {
        throw new Error("Session with the id = '" + id + "' does not exist");
      }
      return withoutSafe(function() {
        return Session(id);
      });
    };

    Session.create = function() {
      return Session.apply(null, arguments);
    };

    Session.drop = function(session) {
      if (typeof session === "object") {
        session = session.getId();
      }
      delete sessions[session];
      saveState();
    };

    return Session;
  };

  angular.module(moduleId, [])
    .provider("tsSession", function() {
      var storage = objectStorage;
      var safeMode = true;

      return {
        setStorage: function(customStorage) {
          storage = customStorage;
        },
        safeMode: function(safe) {
          safeMode = safe;
        },
        $get: ["$injector", function($injector) {
          var storageService = typeof storage === "string"
            ? $injector.get(storage) : storage;
          return buildSession(storageService, safeMode);
        }]
      };
    });

  return moduleId;
}));
