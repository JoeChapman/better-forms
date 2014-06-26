Better Forms
============

A better way to create, validate and handle forms in [node](http://nodejs.org)

```js
var forms = require('forms');

module.exports = forms('my_form', {
    fname: new forms.fields.string({label: 'First name', required: true}),
    lname: new forms.fields.string({label: 'Last name', requiredif: 'fname'})
});
```

```js
var my_form = require('../my_form');

res.render('my_tempplate', {form: my_form})
```

```jade
doctype html
html(lang="en")
    head
        meta(charset='utf-8')
        title Simple Form
    body
        !=forms.my_form.html
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
