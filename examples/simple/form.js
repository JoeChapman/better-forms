'use strict';

var forms = require('../../');

module.exports = forms('simple', {
    fname: {
        required: true,
        id: 'firstname'
    },
    lname: {
        required: true,
        id: 'lastname'
    },
    email: new forms.fields.email({
        validateif: 'firstname'
    }),
    pass: new forms.fields.password({
        id: 'password',
        required: true
    }),
    confirm: {
        type: 'password',
        id: 'confirm',
        required: true,
        validateif: 'password',
        match: 'password'
    }
}, {
    action: '/',
    method: 'POST',
    novalidate: true,
    template: 'simple'
});
