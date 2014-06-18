'use strict';

var forms = require('../');

module.exports = forms('Simple', {
    name: { required: true, id: 'fname' },
    addr: forms.fields.email(),
    pass: forms.fields.password({ id: 'password', required: true }),
    confirm: { type: 'password', required: true, id: 'confirm' }
}, {
    action: '/',
    method: 'GET'
});
