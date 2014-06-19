'use strict';

var Field = require('./field'),
    utils = require('./utils'),
    _ = require('underscore'),
    FormError = require('./error'),
    // http://www.w3.org/html/wg/drafts/html/master/forms.html#e-mail-state-(type=email)
    emailRegExp = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$/;

function fieldFactory (props) {
    props = _.extend(this.defaults, props);
    return new (Field.extend(props))();
}

module.exports = {

    text: function () {
        this.defaults = {
            inputType: 'text'
        };
        return fieldFactory.apply(this, arguments);
    },

    string: function () {
        this.defaults = {
            inputType: 'text'
        };
        return fieldFactory.apply(this, arguments);
    },

    number: function () {
        this.defaults = {
            inputType: 'number'
        };
        return fieldFactory.apply(this, arguments);
    },

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

    email: function () {
        this.defaults = {
            inputType: 'email',
            validate: function (value) {
                return Field.prototype.validate.call(this, value) ||
                    ((!emailRegExp.test(value)) ? new FormError(this.getMessage('typeMismatch')) : null);
            }
        };
        return fieldFactory.apply(this, arguments);
    },

    hidden: Field.extend({
        inputType: 'hidden',
        html: function (value, options) {
            return this.widgetHtml(value, options);
        }
    }),

    password: function () {
        this.defaults = {
            inputType: 'password'
        };
        return fieldFactory.apply(this, arguments);
    },

    file: Field.extend({
        inputType: 'file',
        availableAttributes: [
            'type', 'autofocus', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod',
            'formnovalidate', 'formtarget', 'value', 'required', 'selectiondirection', 'accept',
            'multiple', 'placeholder'
        ]
    }),

    checkbox: function () {
        this.defaults = {
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
        };
        return fieldFactory.apply(this, arguments);
    },

    radio: function () {
        this.defaults = {
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
        };
        return fieldFactory.apply(this, arguments);
    },

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
