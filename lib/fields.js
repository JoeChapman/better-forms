'use strict';

var Field = require('./field'),
    utils = require('./utils'),
    _ = require('underscore'),
    FormError = require('./error'),
    // http://www.w3.org/html/wg/drafts/html/master/forms.html#e-mail-state-(type=email)
    emailRegExp = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$/;

var create = function createField(props) {
    props = _.extend(this.defaults, props);
    return new (Field.extend(props))();
};

module.exports = {

    text: function () {
        this.defaults = {
            inputType: 'text'
        };
        return create.apply(this, arguments);
    },

    string: function () {
        this.defaults = {
            inputType: 'text'
        };
        return create.apply(this, arguments);
    },

    number: function () {
        this.defaults = {
            inputType: 'number'
        };
        return create.apply(this, arguments);
    },

    color: function () {
        this.defaults = {
            inputType: 'color'
        };
        return create.apply(this, arguments);
    },

    date: function () {
        this.defaults = {
            inputType: 'date'
        };
        return create.apply(this, arguments);
    },

    datetime: function () {
        this.defaults = {
            inputType: 'datetime'
        };
        return create.apply(this, arguments);
    },

    'datetime-local': function () {
        this.defaults = {
            inputType: 'datetime-local'
        };
        return create.apply(this, arguments);
    },

    month: function () {
        this.defaults = {
            inputType: 'month'
        };
        return create.apply(this, arguments);
    },

    week: function () {
        this.defaults = {
            inputType: 'week'
        };
        return create.apply(this, arguments);
    },

    search: function () {
        this.defaults = {
            inputType: 'search'
        };
        return create.apply(this, arguments);
    },

    time: function () {
        this.defaults = {
            inputType: 'time'
        };
        return create.apply(this, arguments);
    },

    tel: function () {
        this.defaults = {
            inputType: 'tel'
        };
        return create.apply(this, arguments);
    },

    url: function () {
        this.defaults = {
            inputType: 'url'
        };
        return create.apply(this, arguments);
    },

    email: function () {
        this.defaults = {
            inputType: 'email',
            validate: function (value, fields) {
                if (!Field.prototype.validationReady.call(this, fields)) {
                    return false;
                }
                return Field.prototype.validate.call(this, value, fields) ||
                    ((!emailRegExp.test(value)) ? new FormError(this.getMessage('typeMismatch')) : null);
            }
        };
        return create.apply(this, arguments);
    },

    hidden: function () {
        this.defaults = {
            inputType: 'hidden',
            html: function (value, options) {
                return this.widgetHtml(value, options);
            }
        };
        return create.apply(this, arguments);
    },

    password: function () {
        this.defaults = {
            inputType: 'password'
        };
        return create.apply(this, arguments);
    },

    file: function () {
        this.defaults = {
            inputType: 'file',
            availableAttributes: [
                'type', 'autofocus', 'disabled', 'form', 'formaction', 'formenctype', 'formmethod',
                'formnovalidate', 'formtarget', 'value', 'required', 'selectiondirection', 'accept',
                'multiple', 'placeholder'
            ]
        };
        return create.apply(this, arguments);
    },

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
        return create.apply(this, arguments);
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
        return create.apply(this, arguments);
    },

    select: function () {
        this.defaults = {
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
        };
        return create.apply(this, arguments);
    }

};
