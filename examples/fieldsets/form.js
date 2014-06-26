'use strict';

var forms = require('../../');

module.exports = forms('fieldsets', [{
    legend: 'User',
    fields: {
        name: {
            required: true,
            id: 'fname',
            label: 'First name'
        },
        email: new forms.fields.email(),
        pass: new forms.fields.password({
            id: 'password',
            required: true,
            minlength: '6'
        }),
        confirm: {
            type: 'password',
            required: true,
            id: 'confirm',
            match: 'password'
        }
    }
}, {
    legend: 'About',
    fields: {
        likes: new forms.fields.checkbox()
    }
}], {
    action: '/',
    method: 'POST',
    template: 'fieldsets',
    novalidate: true
});

