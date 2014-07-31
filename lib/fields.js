'use strict';

var Field = require('./field'),
    utils = require('./utils'),
    _ = require('underscore'),
    FormError = require('./error'),
    // http://www.w3.org/html/wg/drafts/html/master/forms.html#e-mail-state-(type=email)
    emailRegExp = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$/;

module.exports = {

    text: Field.extend({
        inputType: 'text'
    }),

    string: Field.extend({
        inputType: 'text'
    }),

    number: Field.extend({
        inputType: 'number',
        availableAttributes: [
            'autofocus', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod',
            'formnovalidate', 'formtarget', 'value', 'required', 'selectiondirection',
            'autocomplete', 'inputmode', 'list', 'spellcheck', 'readonly', 'placeholder',
            'pattern', 'step', 'match', 'validateif', 'name', 'min', 'max'
        ]
    }),

    color: Field.extend({
        inputType: 'color'
    }),

    date: Field.extend({
        inputType: 'date'
    }),

    datetime: Field.extend({
        inputType: 'datetime'
    }),

    'datetime-local': Field.extend({
        inputType: 'datetime-local'
    }),

    month: Field.extend({
        inputType: 'month'
    }),

    week: Field.extend({
        inputType: 'week'
    }),

    search: Field.extend({
        inputType: 'search'
    }),

    time: Field.extend({
        inputType: 'time'
    }),

    tel: Field.extend({
        inputType: 'tel'
    }),

    url: Field.extend({
        inputType: 'url'
    }),

    email: Field.extend({
        inputType: 'email',
        validate: function validate(value, fields) {
            if (!Field.prototype.validationReady.call(this, fields)) {
                return false;
            }
            return Field.prototype.validate.call(this, value) ||
                ((!emailRegExp.test(value)) ? new FormError(this.getMessage('typeMismatch')) : null);
        },
        getErrors: function getErrors(value, options, fields) {
            return {
                'noMatch': (fields && fields[this.match] && value !== fields[this.match].value),
                'valueMissing': (this.required && value.length === 0),
                'tooShort': (this.minlength && value.length < this.minlength),
                'tooLong': (this.maxlength && value.length > this.maxlength),
                'patternMismatch': (this.pattern && value.length && !(new RegExp(this.pattern)).test(value)),
                'typeMismatch': !emailRegExp.test(value)
            };
        }
    }),

    hidden: Field.extend({
        inputType: 'hidden',
        html: function html(value, options) {
            return this.widgetHtml(value, options);
        }
    }),

    password: Field.extend({
        inputType: 'password'
    }),

    file: Field.extend({
        inputType: 'file',
        availableAttributes: [
            'type', 'autofocus', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod',
            'formnovalidate', 'formtarget', 'value', 'required', 'selectiondirection', 'accept',
            'multiple', 'placeholder'
        ]
    }),

    radio: Field.extend({
        inputType: 'radio',
        availableAttributes: [
            'autofocus', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod',
            'formnovalidate', 'formtarget', 'required', 'selectiondirection', 'value',
            'autocomplete', 'inputmode', 'list', 'readonly', 'validateif', 'name', 'checked'
        ],
        value: '',
        html: function html(value, options, fields) {
            var contents = this.widgetHtml(value, options) +
                this.labelHtml(value, options) +
                this.errorHtml(value, options, fields);

            return this.fieldHtml(contents, options);
        },
        widgetAttributes: function widgetAttributes(value) {
            var attrs = Field.prototype.widgetAttributes.apply(this, arguments);
            attrs.value = this.value;
            if (value === this.value) {
                attrs.checked = 'checked';
            }
            return attrs;
        },
        parseBody: function parseBody(req) {
            if (this.value === req.body[this.name]) {
                return this.value;
            } else {
                return false;
            }
        }
    }),

    checkbox: Field.extend({
        inputType: 'checkbox',
        availableAttributes: [
            'autofocus', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod',
            'formnovalidate', 'formtarget', 'required', 'selectiondirection', 'value',
            'autocomplete', 'inputmode', 'list', 'readonly', 'validateif', 'name', 'checked'
        ],
        value: true,
        html: function html(value, options, fields) {
            var contents = this.widgetHtml(value, options) +
                this.labelHtml(value, options) +
                this.errorHtml(value, options, fields);

            return this.fieldHtml(contents, options);
        },
        widgetAttributes: function widgetAttributes(value) {
            var attrs = Field.prototype.widgetAttributes.apply(this, arguments);
            attrs.value = this.value;
            if (value === this.value) {
                attrs.checked = 'checked';
            }
            return attrs;
        },
        parseBody: function parseBody(req) {
            if (this.value === true && req.body[this.id] === 'true') {
                return true;
            } else {
                return req.body[this.id] === this.value ? this.value : undefined;
            }
        }
    }),

    select: Field.extend({
        tagName: 'select',
        inputType: 'select',
        availableAttributes: [
            'autofocus', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod',
            'formnovalidate', 'formtarget', 'value', 'required', 'accept', 'multiple',
            'placeholder', 'size', 'selected'
        ],
        widgetHtml: function selectWidgetHtml(value) {
            var html = '',
                attrs = {},
                selected = Field.prototype.widgetAttributes.apply(this, arguments).selected;

            _.each(this.choices, function (name) {
                if (_.isObject(name)) {
                    var origName = name;
                    name = _.keys(name)[0];
                    attrs.value = origName[name];
                } else {
                    attrs.value = name;
                }
                if (attrs.value === selected || attrs.value === value) {
                    attrs.selected = 'selected';
                } else {
                    delete attrs.selected;
                }
                html += utils.htmlTag('option', attrs, name);
            }, this);

            return utils.htmlTag(this.tagName, this.widgetAttributes(value), html);
        },
        widgetAttributes: function widgetAttributes() {
            var attrs = Field.prototype.widgetAttributes.apply(this, arguments);
            delete attrs.value;
            delete attrs.type;
            return attrs;
        },
        validate: function selectWidgetValidate(value) {
            // Coerce choices into an array
            var choices = _.map(this.choices, _.identity);

            return Field.prototype.validate.call(this, value) ||
                (!_.indexOf(choices, value) ? new FormError(this.getMessage('valueMissing')) : null);
        }
    })

};
