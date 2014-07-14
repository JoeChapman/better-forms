Better Forms
============

A better way to create, validate and handle forms in [Express](https://github.com/expressjs)

[![Build Status](https://travis-ci.org/JoeChapman/better-forms.svg?branch=master)](https://travis-ci.org/JoeChapman/better-forms)
[![NPM version](https://badge.fury.io/js/better-forms.svg)](http://badge.fury.io/js/better-forms)

### Example usage

```js
var forms = require('forms');

module.exports = forms('simpleform', {
    fname: new forms.fields.string({label: 'First name', required: true}),
    lname: new forms.fields.string({label: 'Last name', validateif: 'fname'})
}, {
    action: '/',
    method: 'POST',
    novalidate: true,
    template: 'simple'
});
```

```js
var form = require('../form');

app
    .get('/', form.requestHandler)
    .post('/', form.requestHandler);

```

```jade
doctype html
html(lang="en")
    head
        meta(charset='utf-8')
        title Simple Form
    body
        !=forms.simpleform.html
```

• Adds CSRF support. Install [csurf](https://github.com/expressjs/csurf) and include the following dependencies and middleware in your express server;

```js
    app.use(require('csurf')())
    app.use(require('./middleware/csrf')())
```

```js
module.exports = function () {
    return function (req, res, next) {
        res.locals._csrf = req.csrfToken();
        next();
    };
};
```


### Setup

Install
````
npm install better-forms
````

Test
````
npm test
````

Lint
````
npm run lint
````

### Examples
````
$ git clone git@github.com:JoeChapman/better-forms.git
$ cd better-forms
$ npm install
````

then run an example such as,

````
$ node examples/simple/server
````

and browse to http://localhost:3030
