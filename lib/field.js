'use strict';

var Class = require('kayclass'),
    utils = require('./utils'),
    FormError = require('./error'),
    _ = require('underscore');

module.exports = Class.extend({

    constructor: function Field(props) {
        _.extend(this, props);
        this.type = this.type || this.inputType;
        this.tagName = this.tagName || 'input';
        this.availableAttributes = [].slice.call(this.availableAttributes);
    },

    inputType: 'text',

    availableAttributes: [
        'autofocus', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod',
        'formnovalidate', 'formtarget', 'value', 'required', 'selectiondirection', 'autocomplete',
        'inputmode', 'list', 'minlength', 'maxlength', 'spellcheck', 'readonly',
        'placeholder', 'pattern', 'step'
    ],

    validStateMessages: [
        'badInput', 'customError', 'patternMismatch', 'rangeOverflow', 'rangeUnderflow',
        'stepMismatch', 'tooLong', 'typeMismatch', 'valueMissing'
    ],

    createValidId: function createId(id) {
        if (typeof id !== 'string') {
            return undefined;
        }
        return id.replace(/(?:\]\[)|[\[\]]/g, '_');
    },

    html: function html(value, options) {
        return this.labelHtml(value, options) +
               this.widgetHtml(value, options) +
               this.errorHtml(value, options);
    },

    errorHtml: function errorHTML(value, options) {
        if (!value && !options) {
            return '';
        }
        if ((options || {}).renderErrors === false) {
            return '';
        }
        var error = this.validate(value);
        return error instanceof Error ? utils.htmlTag('div', { class: 'fieldError' }, error.message) : '';
    },

    labelHtml: function labelHtml(value, options) {
        options = options || {};
        var label = options.label || this.label,
            forVal = options.for || this.createValidId(this.id);

        if (!label) {
            return '';
        }
        if (!this.required && !this.noOptionalIndicator) {
            label += utils.htmlTag('span', { 'class': 'optionalIndicator' }, '(optional)');
        }
        return utils.htmlTag('label', { for: forVal }, label);
    },

    widgetHtml: function widgetHtml(value) {
        return utils.htmlTag(this.tagName, this.widgetAttributes(value));
    },

    getTypeAttribute: function () {
        if (this.inputType || this.type) {
            return { type: this.inputType || this.type || 'text' };
        }
        return {};
    },

    getDataAttributes: function () {
        var dataAttrs = {};
        _.each(this.dataAttributes || {}, function (value, key) {
            dataAttrs['data-' + key] = value;
        });
        return dataAttrs;
    },

    widgetAttributes: function widgetAttributes(value) {
        var attrs = this.getTypeAttribute();
        _.extend(attrs, _.pick.apply(null, [this].concat(this.availableAttributes)));
        _.extend(attrs, {
                name: attrs.name || attrs.id || this.id,
                id: this.createValidId(attrs.id || this.id),
                value: value !== undefined ? value : this.value
            },
            this.getTypeAttribute(),
            this.validationMessageAttributes()
        );
        return attrs;
    },

    validationMessageAttributes: function () {
        var attrs = {},
            messages = {
                'valueMissing': this.required,
                'tooLong': this.maxlength,
                'patternMismatch': this.pattern
            };
        if (typeof this.message === 'string') {
            attrs['data-message'] = this.message;
        }
        _.each(this.validStateMessages, function (state) {
            if (messages[state]) {
                attrs['data-message-' + state] = this.getMessage(state);
            } else if (this.message && this.message[state]) {
                attrs['data-message-' + state] = this.message[state];
            }
        }, this);
        return attrs;
    },

    getMessage: function (type) {
        if (typeof this.message === 'string') {
            return this.message;
        } else if (typeof this.message === 'function') {
            return this.message(type);
        }
        var defaultMessages = {
            valueMissing: 'This field is required',
            tooShort: 'Please use ' + this.minlength + ' characters or more',
            tooLong: 'Please use ' + this.maxlength + ' characters or less',
            patternMismatch: 'Please use the required format',
            typeMismatch: 'Please enter a valid ' + this.type
        };
        return (this.message || {})[type] || defaultMessages[type];
    },

    validate: function validate(value) {
        var error = null;
        value = String(typeof value === 'undefined' ? this.value || '' : value);

        var errors = {
            'valueMissing': (this.required && value.length === 0),
            'tooShort': (this.minlength && value.length < this.minlength),
            'tooLong': (this.maxlength && value.length > this.maxlength),
            'patternMismatch': (this.pattern && value.length && !(new RegExp(this.pattern)).test(value))
        };

        _.some(errors, function (value, key) {
            if (value) {
                error = new FormError(this.getMessage(key));
            }
            return value;
        }, this);
        return error;
    },

    parseBody: function parseBody(req) {
        return req.body[this.id];
    }

});
