'use strict';
var _ = require('underscore'),
    utils = require('./utils'),
    Class = require('kayclass'),
    FormError = require('./error'),
    Field = require('./field'),
    formFields = require('./fields'),
    FieldHandler = require('./fieldhandler');

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
            redirectUrl: false,
            novalidate: false
        });
        this.requestHandler = this.requestHandler.bind(this);
        this.fieldsets = [];

        this.createFields(fields);
    },

    createFields: function createFields(fields) {

        function getField(field, name) {
            field.id = field.id || name;
            field.label = !field.label && field.label !== false ? utils.camelCaseToRegularForm(name) : field.label;
            if (field instanceof Field) { return field; }
            field.type = field.type || 'string';
            if (!formFields[field.type]) {
                throw new Error('Field of type: ' + field.type + ' does not exist');
            }
            return new formFields[field.type](field);
        }

        _.each(fields || this.fields, function (field, name) {
            if (field.fields) {
                var fields = {};
                _.each(field.fields, function (field, name) {
                    field = getField(field, name);
                    delete fields[name];
                    fields[field.id] = field;
                }, this);
                this.fieldsets.push( _.extend({ legend: '' }, field, { fields: fields }) );
            } else {
                field = getField(field, name);
                delete this.fields[name];
                this.fields[field.id] = field;
            }
        }, this);
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
        if (!(err instanceof FormError)) {
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

        _.each(this.fields, function (field) {
            if (field.length) {
                field.forEach(function (field) {
                    validateField(field);
                });
            } else {
                validateField(field);
            }
        });

        if (error) {
            error = new FormError(this.options.errorMessage);
            error.fields = fields;
        }
        return error;
    },

    html: function html(values, options) {
        var ret = '';

        if (values || options) {
            ret += this.errorHtml(values, options);
        }

        values = values || {};

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
        if (this.options.novalidate) {
            attrs.novalidate = this.options.novalidate;
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

        var fieldsets = [];
        var i = -1;
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

    fieldHtml: function fieldHtml(field) {
        var value = '';
        if (field instanceof FieldHandler) {
            value = field.value;
            field = field.field;
        }
        return this.form.fieldHtml(field, value, this.options);
    }

});

module.exports = function FormFactory(name, fields, options) {
    return new (Form.extend({
        formName: name,
        fields: fields,
        options: options
    }))();
};


module.exports.extend = Form.extend.bind(Form);
module.exports.prototype.createFields = Form.prototype.createFields;
module.exports.fields = formFields;
