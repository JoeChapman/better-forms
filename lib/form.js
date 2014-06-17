'use strict';
var _ = require('underscore'),
    utils =require('./utils'),
    Class = require('nobleclass'),
    // http://www.w3.org/html/wg/drafts/html/master/forms.html#e-mail-state-(type=email)
    emailRegExp = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,253}[a-zA-Z0-9])?)*$/;


/* Form Class */
var Form = Class.extend({
    constructor: function Form(name, fields, options) {
        this.formName = this.formName || name;
        this.options = _.defaults(options || {}, this.options, {
            postHandler: this.postHandler.bind(this),
            getHandler: this.getHandler.bind(this),
            successHandler: this.successHandler.bind(this),
            errorHandler: this.errorHandler.bind(this),
            getValues: this.getValues,
            setValues: this.setValues,
            successMessage: 'Saved successfully',
            errorMessage: 'This form contains errors',
            submitTagName: 'button',
            submitAttrs: { type: 'submit' },
            submitLabel: 'Submit',
            buttonSetTagName: 'ul',
            buttonSetAttrs: { class: 'buttonSet' },
            additionalButtonSetHtml: '',
            fieldWrapperTagName: 'div',
            id: this.formName,
            template: this.formName,
            classes: [],
            method: 'post',
            action: '',
            role: 'form',
            redirectUrl: false
        });
        this.requestHandler = this.requestHandler.bind(this);
        this.fieldsets = [];

        this.createFields(fields);
    },

    createFields: function createFields(fields) {
        function getField(field, name) {
            field.id = field.id || name;
            field.label = !field.label && field.label !== false ? utils.camelCaseToRegularForm(name) : field.label;
            if (field instanceof Field) {
                return field;
            }
            field.type = field.type || 'string';
            return new Form.fields[field.type](field);
        }

        return (this.fields = _.flatten(_.map(fields || this.fields, function (field, name) {
            if (field.fields) {
                fields = _.map(field.fields, function (field, name) {
                    return getField(field, name);
                }, this);
                (this.fieldsets || (this.fieldsets = [])).push(
                    _.extend({ legend: '' }, field, { fields: fields })
                );
                return fields;
            } else {
                return getField(field, name);
            }
        }, this)));
    },

    getValues: function (req, res, callback) { callback(null, {}); },
    setValues: function (req, res, callback) { callback(null); },

    requestHandler: function requestHandler(req, res, next) {
        var handler = this.options[req.method.toLowerCase() + 'Handler'];
        if (!handler) {
            next();
        }
        this.retrieve(req, res, function (req, res, err, options) {
            handler(req, res, next, err, options);
        });
    },

    retrieve: function retrieve(req, res, callback) {
        var values, options = { renderErrors: false, renderSuccess: false };
        if (req.method === 'POST') {
            values = this.parseBody(req);
        } else if (req.session && req.session.forms && req.session.forms[this.formName]) {
            if (req.session.forms[this.formName].success) {
                options.renderErrors = false;
                options.renderSuccess = true;
            }
            values = req.session.forms[this.formName].values;
            if (req.session.forms[this.formName].errorMessage) {
                options.errorMessage = req.session.forms[this.formName].errorMessage;
            }
            delete req.session.forms[this.formName];
            if (!values) {
                return this.options.getValues(req, res, function (err, values) {
                    this.setupFormHandler(req, res, callback, err, values, options);
                }.bind(this));
            }
        } else {
            return this.options.getValues(req, res, function (err, values) {
                this.setupFormHandler(req, res, callback, err, values, { renderErrors: false });
            }.bind(this));
        }
        this.setupFormHandler(req, res, callback, null, values, options);
    },

    parseBody: function parseBody(req) {
        var ret = {},
            parseField = function (field) {
                var val = field.parseBody(req);
                if (typeof val !== 'undefined') {
                    ret[field.id] = val;
                }
            };

        this.fields.forEach(function (field) {
            if (field.length) {
                field.forEach(function (field) {
                    parseField(field);
                });
            } else {
                parseField(field);
            }
        });

        return ret;
    },

    setupFormHandler: function setupFormHandler(req, res, callback, err, values, options) {
        req.forms || (req.forms = {});
        req.forms[this.formName] = new FormHandler(this, values, options);
        if (req.method !== 'GET' && req.session && !req.xhr) {
            (req.session.forms || (req.session.forms = {}))[this.formName] = { values: values };
            if ((options || {}).errorMessage) {
                req.session.forms[this.formName].errorMessage = options.errorMessage;
            }
        }
        callback(req, res, err, options);
    },

    getHandler: function getHandler(req, res, next, err, options) {
        if (err) {
            return next(err);
        }
        res.locals.forms = req.forms;
        if (this.options.successTemplate && options.renderSuccess) {
            res.render(this.options.successTemplate);
        } else {
            res.render(this.options.template);
        }
    },


    postHandler: function postHandler(req, res, next, err) {
        if (err) {
            return next(err);
        }
        if (req.forms[this.formName].valid) {
            this.options.setValues(req, res, this.dispatchPostResponse.bind(this, req, res, next));
        } else {
            this.dispatchPostResponse(req, res, next, req.forms[this.formName].validationErrors);
        }
    },

    dispatchPostResponse: function dispatchPostResponse(req, res, next, err) {
        if (err) {
            this.options.errorHandler(err, req, res, next);
        } else {
            this.options.successHandler(req, res, next);
        }
    },

    successHandler: function successHandler(req, res) {
        var formObject = { values: false, errorMessage: null, success: true };
        if (req.xhr) {
            this.options.getValues(req, res, function (err, formValues) {
                formObject.values = formValues || {};
                if (this.options.redirectUrl) {
                    res.redirect(this.options.redirectUrl);
                } else {
                    res.json(200, formObject);
                }
            }.bind(this));
        } else {
            if (req && req.session && !this.options.redirectUrl) {
                (req.session.forms || (req.session.forms = {}))[this.formName] = formObject;
            } else if (this.options.redirectUrl && req.session.forms) {
                delete req.session.forms[this.formName];
            }
            res.redirect(this.options.redirectUrl || req.path);
        }
    },

    errorHandler: function errorHandler(err, req, res, next) {
        if (!(err instanceof Form.Error)) {
            return next(err);
        }
        var form = req.forms[this.formName],
            formObject = {
                values: form.values,
                errorMessage: err
            };

        if (req.xhr) {
            res.json(403, formObject);
        } else {
            if (req && req.session) {
                formObject.errorMessage = formObject.errorMessage.toString();
                (req.session.forms || (req.session.forms = {}))[this.formName] = formObject;
            }
            res.redirect(req.path);
        }
    },

    validate: function validate(values) {
        values || (values = {});
        var error = null,
            fields = {},

            validateField = function (field) {
                var fieldError = field.validate(values[field.id]);
                if (fieldError) {
                    fields[field.id] = fieldError;
                    error = true;
                }
            };

        this.fields.forEach(function (field) {
            if (field.length) {
                field.forEach(function (field) {
                    validateField(field);
                });
            } else {
                validateField(field);
            }
        });

        if (error) {
            error = new Form.Error(this.options.errorMessage);
            error.fields = fields;
        }
        return error;
    },

    html: function html(values, options) {
        values = values || {};
        var ret = this.errorHtml(values, options);
        if (this.options.fieldsets) {
            ret += this.fieldsetsHtml(values, options);
        } else {
            ret += this.fieldsHtml(values, options);
        }
        ret += this.buttonsHtml(options);

        return utils.htmlTag('form', this.formAttributes(values), ret);
    },

    errorHtml: function errorHtml(values, options) {
        options || (options = {});

        if (options.renderErrors === false && !options.renderSuccess) {
            return '';
        }
        if (options.errorMessage && !options.renderSuccess) {
            return utils.htmlTag('div', { class: 'formError' }, utils.htmlTag('p', {}, String(options.errorMessage)));
        }
        var validation = this.validate(values);
        if (validation instanceof Error && !options.renderSuccess) {
            return utils.htmlTag('div', { class: 'formError' }, utils.htmlTag('p', {}, validation.message));
        } else if (options.renderSuccess) {
            return utils.htmlTag('div', { class: 'formSuccess' }, utils.htmlTag('p', {}, this.options.successMessage));
        } else {
            return '';
        }
    },

    buttonsHtml: function buttonsHtml() {
        var options = this.options,
            button = utils.htmlTag(options.submitTagName, options.submitAttrs, options.submitLabel);

        if (options.buttonSetTagName === ('ul' || 'ol')) {
            button = utils.htmlTag('li', false, button);
        }

        return utils.htmlTag(
            options.buttonSetTagName,
            options.buttonSetAttrs,
            options.additionalButtonSetHtmlToLeft === true ?
                (options.additionalButtonSetHtml + button) : (button + options.additionalButtonSetHtml)
        );
    },

    fieldsHtml: function fieldsHtml(values, options, fields) {
        return _.map(this.fields, function (field) {
            if (fields && fields.indexOf(field.id) === -1) {
                return '';
            } else {
                return this.fieldHtml(field, values[field.id], options);
            }
        }, this).join('');
    },

    fieldsetsHtml: function fieldsetsHtml(values, options) {
        return _.map(this.options.fieldsets, function (fieldset) {
            return '<fieldset>' +
                (fieldset.legend ? ('<legend>' + fieldset.legend + '</legend>') : '') +
                this.fieldsHtml(values, options, fieldset.fields) +
            '</fieldset>';
        }, this).join('');
    },

    formAttributes: function formAttributes() {
        var attrs = {
            method: this.options.method,
            action: this.options.action
        };
        if (this.options.classes && this.options.classes.length) {
            attrs.class = utils.mungeClassValues(this.options.classes);
        }

        if (this.options.id) {
            attrs.id = this.options.id;
        }

        if (this.options.role) {
            attrs.role = this.options.role;
        }
        return attrs;
    },

    fieldHtml: function fieldHtml(field, value, options) {
        return utils.htmlTag(
            this.options.fieldWrapperTagName,
            _.extend({
                'class': utils.mungeClassValues(field.classes, 'field'),
                'data-type': field.type
            }, field.getDataAttributes()),
            field.html(value, options)
        );
    },

});

Form.Error = function (message) {
    this.message = message;
    this.formName = 'FormError';
};
Form.Error.prototype = Object.create(Error.prototype, {
    constructor: { value: Form.Error },
    toJSON: { value: function FormErrorToJSON() {
        if (this.fields) {
            return {
                form: this.message,
                fields: this.fields
            };
        }
        return this.message;
    } },
    toString: { value: function FormErrorToString() {
        return this.message;
    } }
});


// A simpler object to deal with values
var FormHandler = Class.extend({

    constructor: function FormHandler(form, values, options) {
        values || (values = {});
        Object.defineProperty(this, 'form', { get: function () { return form; }});
        Object.defineProperty(this, 'values', { get: function () { return values; }});
        Object.defineProperty(this, 'options', { get: function () { return options; }});

        var fields = [];

        _.each(form.fields, function (field, i) {
            fields[i] = new FieldHandler(field, values[field.id], options);
            Object.defineProperty(fields, field.id, {
                value: fields[i],
                writeable: true,
                configurable: true
            });
        }, this);

        Object.defineProperty(this, 'fields', { get: function () { return fields; }});

        var fieldsets = [], i = -1;

        _.each(form.fieldsets, function (fieldset, name) {
            fieldsets[++i] = _.extend({}, fieldset, { fields: _.map(fieldset.fields, function (field) {
                return fields[field.id];
            }, this) });
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

    get method() {
        return this.form.options.method;
    },

    get action() {
        return this.form.options.action;
    },

    get validationErrors() {
        return this.form.validate(this.values, this.options);
    },

    get valid() {
        return this.form.validate(this.values, this.options) === null;
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

    fieldHtml: function fieldHtml(field, value) {
        if (field instanceof FieldHandler) {
            value = field.value;
            field = field.field;
        }
        return this.form.fieldHtml(field, value, this.options);
    }

});

var Field = Class.extend({

    constructor: function Field(fieldObject) {
        _.extend(this, fieldObject);
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
                error = new Form.Error(this.getMessage(key));
            }
            return value;
        }, this);
        return error;
    },

    parseBody: function parseBody(req) {
        return req.body[this.id];
    }

});

// A simpler object to deal with values
var FieldHandler = Class.extend({

    constructor: function FieldHandler(field, value, options) {
        Object.defineProperty(this, 'field', { get: function () { return field; }});
        Object.defineProperty(this, 'value', { get: function () { return value; }});
        Object.defineProperty(this, 'options', { get: function () { return options; }});
    },

    get id() { return this.field.id; },
    get name() { return this.field.id; },
    get type() { return this.field.type; },
    get tagName() { return this.field.tagName; },
    get availableAttributes() { return this.field.availableAttributes; },

    get widgetHtml() {
        return this.field.widgetHtml(this.value, this.options);
    },

    get html() {
        return this.field.html(this.value, this.options);
    },

    get labelHtml() {
        return this.field.labelHtml(this.value, this.options);
    },

    get errorHtml() {
        return this.field.errorHtml(this.value, this.options);
    },

    get valid() {
        return this.field.validate(this.value, this.options) === null;
    },

    get validationErrors() {
        return this.field.validate(this.value, this.options);
    }
});

Form.fields = {

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
        validate: function (value) {
            return Field.prototype.validate.call(this, value) ||
                ((!emailRegExp.test(value)) ? new Form.Error(this.getMessage('typeMismatch')) : null);
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
                (!_.indexOf(choices, value) ? new Form.Error(this.getMessage('valueMissing')) : null);
        }
    })

};

module.exports = function FormFactory(name, fields, options) {
    return new (Form.extend({ formName: name, fields: fields, options: options }))();
};
module.exports.extend = Form.extend.bind(Form);
module.exports.prototype.createFields = Form.prototype.createFields;
module.exports.fields = Form.fields;
module.exports.Error = Form.Error;
module.exports.Field = Field;
