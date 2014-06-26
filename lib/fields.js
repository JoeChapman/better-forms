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
        inputType: 'number'
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
        validate: function (value, fields) {
            if (!Field.prototype.validationReady.call(this, fields)) {
                return false;
            }
            return Field.prototype.validate.call(this, value) ||
                ((!emailRegExp.test(value)) ? new FormError(this.getMessage('typeMismatch')) : null);
        }
    }),

    hidden: Field.extend({
        inputType: 'hidden',
        html: function (value, options) {
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
        value: true,
        html: function html(value, options) {
            return this.widgetHtml(value, options) +
                   this.labelHtml(value, options) +
                   this.errorHtml(value, options);
        },
        widgetAttributes: function widgetAttributes(value) {
            var attrs = Field.prototype.widgetAttributes.apply(this, arguments);
            attrs.value = this.value;
            if (value === this.value) {
                attrs.checked = true;
            }
            return attrs;
        },
        parseBody: function (req) {
            if (this.value === true && req.body[this.id] === 'true') {
                return true;
            } else {
                return req.body[this.id] === this.value ? this.value : undefined;
            }
        }
    }),

    checkbox: Field.extend({
        inputType: 'checkbox',
        value: true,
        html: function html(value, options) {
            return this.widgetHtml(value, options) +
                   this.labelHtml(value, options) +
                   this.errorHtml(value, options);
        },
        widgetAttributes: function widgetAttributes(value) {
            var attrs = Field.prototype.widgetAttributes.apply(this, arguments);
            attrs.value = this.value;
            if (value === this.value) {
                attrs.checked = true;
            }
            return attrs;
        },
        parseBody: function (req) {
            if (this.value === true && req.body[this.id] === 'true') {
                return true;
            } else {
                return req.body[this.id] === this.value ? this.value : undefined;
            }
        }
    }),

    select: Field.extend({
        tagName: 'select',
        inputType: null,
        availableAttributes: ['autofocus', 'disabled', 'form', 'formaction', 'formenctype',
            'formmethod', 'formnovalidate', 'formtarget', 'value', 'required', 'accept',
            'multiple', 'placeholder'],
        widgetHtml: function selectWidgetHtml(value) {
            var html = '';
            _.each(this.choices, function (name, index) {
                if (_.isObject(name)) {
                    var origName = name;
                    name = _.keys(name)[0];
                    index = this.choices[index][name];
                    html += utils.htmlTag('option', { value: origName[name] }, name);
                }
                else {
                    html += utils.htmlTag('option', { value: name }, name);
                }
            }, this);
            return utils.htmlTag(this.tagName, this.widgetAttributes(value), html);
        },
        validate: function selectWidgetValidate(value) {
            // Coerce choices into an array
            var choices = _.map(this.choices, _.identity);

            return Field.prototype.validate.call(this, value) ||
                (!_.indexOf(choices, value) ? new FormError(this.getMessage('valueMissing')) : null);
        }
    })

};
