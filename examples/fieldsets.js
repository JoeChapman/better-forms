'use strict';

var form = require('../');

var f = module.exports = form('Fieldsets', [{
    legend: 'User',
    fields: {
        name: {
            required: true,
            id: 'fname',
            label: 'First name'
        },
        email: form.fields.email(),
        pass: form.fields.password({
            id: 'password',
            required: true,
            minlength: '6'
        }),
        confirm: {
            type: 'password',
            required: true,
            id: 'confirm'
        }
    }
}, {
    legend: 'About',
    fields: {
        likes: form.fields.checkbox(),
        gender: form.fields.radio()
    }
}], {
    action: '/',
    method: 'GET',
    template: __dirname + '/login'
});

f.html()
