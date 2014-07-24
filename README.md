Better Forms
============

A better way to create, validate and handle forms in [Express](https://github.com/expressjs)

[![Build Status](https://travis-ci.org/JoeChapman/better-forms.svg?branch=master)](https://travis-ci.org/JoeChapman/better-forms)
[![NPM version](https://badge.fury.io/js/better-forms.svg)](http://badge.fury.io/js/better-forms)

Use Better Forms to create your form, securely handle requests, validate form data and display validation errors.

### Example usage

Build a form, giving it a name and fields. [More examples](https://github.com/better-forms/DOCUMENTATION.md)

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

Hook up your router to use form.requestHandler for each form request and Better Forms will process the request accordingly
```js
var form = require('../form');

app
    .get('/', form.requestHandler)
    .post('/', form.requestHandler);

```

Print out the form mark up in your template
```jade
doctype html
html(lang="en")
    head
        meta(charset='utf-8')
        title Simple Form
    body
        !=forms.simpleform.html
```

Add CSRF support.
Install [csurf](https://github.com/expressjs/csurf)

```
$ npm install csurf
```
And use it in your server
```js
app.use(require('csurf')())
```

Set a token in your middleware
```js

module.exports = function () {
    return function (req, res, next) {
        res.locals._csrf = req.csrfToken();
        next();
    };
};
```
Use the middleware in your server
```js
app.use(require('./middleware/csrf')())
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
