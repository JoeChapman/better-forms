Better Forms
============

A better way to create, validate and handle forms in [node](http://nodejs.org)

[![Build Status](https://travis-ci.org/JoeChapman/better-forms.svg?branch=master)](https://travis-ci.org/JoeChapman/better-forms)
[![NPM version](https://badge.fury.io/js/better-forms.svg)](http://badge.fury.io/js/better-forms)

```js
var forms = require('forms');

module.exports = forms('simpleform', {
    fname: new forms.fields.string({label: 'First name', required: true}),
    lname: new forms.fields.string({label: 'Last name', requiredif: 'fname'})
}, {
    action: '/',
    method: 'POST',
    novalidate: true,
    template: 'simple'
});
```

```js
var my_form = require('../my_form');

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

### Usage

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
