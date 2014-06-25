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

    html: function html(value, options, fields) {
        return this.labelHtml(value, options) +
               this.widgetHtml(value, options) +
               this.errorHtml(value, options, fields);
    },

    errorHtml: function errorHTML(value, options, fields) {
        var error;
        if ((options || {}).renderErrors === false) {
            return '';
        }
        error = this.validate(value, fields);
        return error instanceof FormError ? utils.htmlTag('div', { class: 'fieldError' }, error.message) : '';
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

    widgetHtml: function widgetHtml(value, options) {
        return utils.htmlTag(this.tagName, this.widgetAttributes(value, options));
    },

    getTypeAttribute: function getTypeAttribute() {
        if (this.inputType || this.type) {
            return { type: this.inputType || this.type || 'text' };
        }
        return {};
    },

    getDataAttributes: function getDataAttributes() {
        var dataAttrs = {};
        _.each(this.dataAttributes || {}, function (value, key) {
            dataAttrs['data-' + key] = value;
        });
        return dataAttrs;
    },

    widgetAttributes: function widgetAttributes(value, options) {
        var attrs = this.getTypeAttribute();
        _.extend(attrs, _.pick.apply(null, [this].concat(this.availableAttributes)));
        _.extend(attrs, {
                name: attrs.name || attrs.id || this.id,
                id: this.createValidId(attrs.id || this.id),
                value: value !== undefined ? value : this.value
            },
            this.getTypeAttribute(),
            this.validationMessageAttributes(options)
        );
        return attrs;
    },

    validationMessageAttributes: function validationMessageAttributes(options) {
        var attrs = {},
            messages = {
                'valueMissing': this.required,
                'tooLong': this.maxlength,
                'patternMismatch': this.pattern
            };
        if (!options || (options || {}).renderErrors === false) {
            return attrs;
        }
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

    getMessage: function getMessage(type) {
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
            typeMismatch: 'Please enter a valid ' + this.type,
            noMatch: this.id + ' must match ' + this.match
        };
        return (this.message || {})[type] || defaultMessages[type];
    },

    validationReady: function (fields) {
        if (!fields || !fields[this.validateif]) {
            return true;
        }
        return  (fields && fields[this.validateif] && fields[this.validateif].value !== '');
    },

    validate: function validate(value, fields) {
        var error = null, errors;

        if (!this.validationReady(fields)) {
            return false;
        }

        value = String(typeof value === 'undefined' ? this.value || '' : value);

        errors = {
            'noMatch': (fields && fields[this.match] && value !== fields[this.match].value),
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
