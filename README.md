# TS-Session

Angular TS-Session is a client-side web session controller for [AngularJS](https://angularjs.org/).

TS-Session can help you to manage your session data. It is easily configured to use any synchronous storage. And it provides simple interface for storing multiple sessions (can be useful for OAuth standard and similar to it).

## Provider API

### tsSessionProvider.safeMode(&lt;bool>)

While it's enabled it prevents overriding session or loading nonexistent session by throwing error.

*By default safe mode is enabled.*

``` js
module
.config([
  'tsSessionProvider',
  function(tsSessionProvider) {
    tsSessionProvider.setSafe(< 1: true, 2: false >);
  }
])
.factory('createSession', [
  'tsSession',
  function(Session) {
    var sessionId = 'user';
    var nonexistentSessionId = 'foo';

    Session.create(sessionId);
    Session.create(sessionId); // 1: throws an error, 2: returns the same session instance

    Session.get(nonexistentSessionId); // 1: throws an error, 2: creates new session
  }
]);
```

### tsSessionProvider.setStorage(&lt;string|object>)

Defines strategy for saving session. By default it stores data in JavaScript.

``` js
module
.factory('sessionStorage', [
  '$window',
  function($window) {
    var sessionKey = 'session';
    var storage = $window.localStorage;
    var JSON = $window.JSON;

    return {
      save: function(data) {
        storage.setItem(sessionKey, JSON.stringify(data));
      },
      load: function() {
        return JSON.parse(storage.getItem(sessionKey));
      },
      drop: function() {
        storage.removeItem(sessionKey);
      }
    };
  }
])
.config([
  'tsSessionProvider',
  'sessionStorage',
  function(tsSessionProvider, sessionStorage) {
    tsSessionProvider.setStorage(sessionStorage);
    // or you can pass the service name only
    tsSessionProvider.setStorage('sessionStorage');
  }
]);
```

## Service API

### tsSession.create(&lt;id>, [session])

Creates new session.

Synonyms: ```new Session(<id>, <session>)```, ```Session.create(<id>, <session>)```.

``` js
module
.factory('userSession', [
  'tsSession',
  function(Session) {
    var session = new Session('user');
    // or Session.create('user')
    // or Session('user')
    session.isAuthenticated = function() {
      return !!this.get('id');
    };
    return session;
  }
]);
```

### tsSession.has(&lt;id>)

Checks whether there is a session specified by ```id``` and returns ```true``` or ```false```.

``` js
module
.factory('userSession', [
  '$window',
  'tsSession',
  function($window, Session) {
    var Date = $window.Date;

    if (Session.has('user')) {
      return Session.get('user');
    }

    return Session.create('user', {
      session_created: Date.now()
    });
  }
]);
```

### tsSession.get(&lt;id>)

Returns session if it exists. Otherwise returns ```undefined``` or throws error if in **safe** mode.

``` js
module
.run([
  'tsSession',
  function(Session) {
    Session.create('user:roles', ['guest']);
  }
])
.factory('authorize', [
  'tsSession',
  'acl'
  function(Session, acl) {
    var roles = Session.get('user:roles');
    return function(action) {
      // roles.get() // returns the actual data
      return acl.authorize(action, roles.get());
    };
  }
]);
```

### tsSession.drop(&lt;id|object>)

Remove session.

``` js
module
.factory('account', [
  '$http',
  'tsSession',
  'userSession',
  function($http, Session, userSession) {
    function create() { ... }

    function remove() {
      var id = userSession.get('id');
      return $http.delete('/api/account/' + id)
        .then(function() {
          Session.drop(userSession);
          // or Session.drop(userSession.getId());
        });
    }

    return {
      create: create,
      remove: remove
    };
  }
]);
```

## Session API

### session.getId()

Returns the ID of session

``` js
module
.run([
  'tsSession',
  function(Session) {
    var session = new Session('user');
    session.getId(); // returns "user"
  }
]);
```

### session.get([key])

Returns session data if ```key``` is not defined or value of session property with specified ```key```.

``` js
module.run([
  'tsSession',
  function(Session) {
    var session = new Session('user', { id: 1, name: 'John' });
    session.get(); // returns { id: 1, name: "John" }
    session.get('name'); // returns "John"
  }
]);
```

### session.set(&lt;key|object>, [value])

Stores data. If ```key``` is specified it creates a property with the name defined by ```key``` and sets it to the value of second argument. If ```key``` is object **set** will copy all of the properties to the session.

Returns session instance, so you can chain execution of session methods;

``` js
module.run([
  'tsSession',
  function(Session) {
    var session = new Session('user');
    session
      .set({ id: 1 })
      .set('name', 'John')
      .get(); // returns { id: 1, name: "John" }
  }
]);
```

### session.del(&lt;key>)

Deletes the property specified by ```key```.

Returns session instance, so you can chain execution of session methods;

``` js
module.run([
  'tsSession',
  function(Session) {
    var session = new Session('user', { id: 1, name: 'John' });
    session.del('name');
    session.get(); // returns { id: 1 }
  }
]);
```

### session.reset()

Drops all of the data in the session.

Returns session instance, so you can chain execution of session methods;

``` js
module.run([
  'tsSession',
  function(Session) {
    var session = new Session('user', { id: 1, name: 'John' });
    session.reset();
    session.get(); // returns {}
  }
]);
```

