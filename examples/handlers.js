'use strict';

var forms = require('../');

module.exports = forms('Handlers', {
    name: { required: true, id: 'fname' },
    addr: forms.fields.email(),
    pass: forms.fields.password({
        id: 'password',
        required: true,
        minlength: '6'
    }),
    confirm: { type: 'password', required: true, id: 'confirm' }
}, {
    action: '/',
    method: 'GET',
    getValues: function (req, res, callback) {
        callback();
    },
    setValues: function (req, res, callback) {
        callback();
    }
});
