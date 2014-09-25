'use strict';

var Class = require('kayclass'),
    FieldHandler = require('./fieldhandler'),
    _ = require('underscore');

module.exports = Class.extend({

    constructor: function FormHandler(form, values, options) {
        values || (values = {});
        Object.defineProperty(this, 'form', { get: function () { return form; }});
        Object.defineProperty(this, 'values', { get: function () { return values; }});
        Object.defineProperty(this, 'options', { get: function () { return options; }});

        var fields = {};

        _.each(form.fields, function (field, i) {
            fields[i] = new FieldHandler(field, values[i], options);
            Object.defineProperty(fields, i, {
                value: fields[i],
                writeable: true,
                configurable: true
            });
            Object.defineProperty(fields[i], 'fields', { get: function () { return fields; }});
        }, this);

        Object.defineProperty(this, 'fields', { get: function () { return fields; }});

        var fieldsets = [];
        var i = -1;
        _.each(form.fieldsets, function (fieldset, name) {
            var fields = {};
            _.each(fieldset.fields, function (field) {
                fields[field.id] = field;
            });
            fieldsets[++i] = _.extend({}, fieldset, { fields: fields });
            if (fieldset.id) {
                Object.defineProperty(fieldsets, fieldset.id || name, {
                    value: fieldsets[i],
                    writeable: true,
                    configurable: true
                });
            }
        });
        Object.defineProperty(this, 'fieldsets', { get: function () { return fieldsets; }});
    },

    errors: false,

    get method() {
        return this.form.options.method;
    },

    get action() {
        return this.form.options.action;
    },

    get validationErrors() {
        if (this.errors === false) {
            this.errors = this.form.validate(this.values, this.options);
        }
        return this.errors;
    },

    get valid() {
        if (this.errors === false) {
            this.errors = this.form.validate(this.values, this.options);
        }
        return this.errors === null;
    },

    get html() {
        return this.form.html(this.values, this.options);
    },

    get buttonsHtml() {
        return this.form.buttonsHtml(this.options);
    },

    get errorHtml() {
        return this.form.errorHtml(this.values, this.options);
    },

    get successMessage() {
        return this.form.options.successMessage;
    },

    get attributes() {
        return this.form.formAttributes();
    },

    fieldHtml: function fieldHtml(field) {
        var value = '';
        if (field instanceof FieldHandler) {
            value = field.value;
            field = field.field;
        }
        return this.form.fieldHtml(field, value, this.options);
    }

});
