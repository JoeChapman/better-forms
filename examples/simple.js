'use strict';

var forms = require('../');

var f = module.exports = forms('Simple', {
    name: { required: true, id: 'fname' },
    addr: forms.fields.email(),
    pass: forms.fields.password({
        id: 'password'
    }),
    confirm: { type: 'password', id: 'confirm' }
}, {
    action: '/',
    method: 'GET'
});


// console.log(f.fields.password.html());
