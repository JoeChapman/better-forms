'use strict';

var forms = require('../');

var simpleForm = module.exports = forms('Simple', {
    name: { required: true, id: 'fname' }
});

console.log(simpleForm.fields);
