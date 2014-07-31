'use strict';

var Class = require('kayclass');

// A simpler object to deal with values
module.exports = Class.extend({

    constructor: function FieldHandler(field, value, options) {
        Object.defineProperty(this, 'field', { get: function () { return field; }});
        Object.defineProperty(this, 'value', { get: function () { return value; }});
        Object.defineProperty(this, 'options', { get: function () { return options; }});
    },

    get id() { return this.field.id; },
    get name() { return this.field.id; },
    get tagName() { return this.field.tagName; },
    get availableAttributes() { return this.field.availableAttributes; },
    get type() { return this.field.type; },

    get widgetHtml() {
        return this.field.widgetHtml(this.value, this.options);
    },

    get html() {
        return this.field.html(this.value, this.options, this.fields);
    },

    get labelHtml() {
        return this.field.labelHtml(this.value, this.options);
    },

    get labelText() {
        return this.field.labelText(this.value, this.options);
    },

    get errorHtml() {
        return this.field.errorHtml(this.value, this.options, this.fields);
    },

    get errorText() {
        if ((this.options || {}).renderErrors === false) {
            return '';
        }
        return this.field.validate(this.value, this.options, this.fields);
    },

    get error() {
        if ((this.options || {}).renderErrors === false) {
            return '';
        }
        return this.field.getError(this.value, this.options, this.fields);
    },

    get choices() {
        return this.field.choices;
    },

    get widgetAttributes() {
        return this.field.widgetAttributes(this.value, this.options);
    },

    get valid() {
        return this.field.validate(this.value, this.options) === null;
    },

    get placeholder() {
        return this.field.placeholder;
    }

});
