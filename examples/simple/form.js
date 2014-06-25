'use strict';

var forms = require('../../index');

module.exports = forms('simple', {
    fname: {
        required: true,
        id: 'firstname'
    },
    lname: {
        required: true,
        id: 'lastname'
    },
    email: forms.fields.email({
        validateif: 'firstname'
    }),
    pass: forms.fields.password({
        id: 'password',
        required: true
    }),
    confirm: {
        type: 'password',
        id: 'confirm',
        required: true,
        match: 'password'
    }
}, {
    action: '/',
    method: 'POST',
    novalidate: true,
    template: 'simple'
});
