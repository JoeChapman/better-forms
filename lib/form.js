'use strict';
var _ = require('underscore'),
    utils = require('./utils'),
    Class = require('kayclass'),
    FormError = require('./error'),
    Field = require('./field'),
    formFields = require('./fields'),
    FormHandler = require('./formhandler');

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
            novalidate: false,
            htmlErrors: false
        });
        this.requestHandler = this.requestHandler.bind(this);
        this.fieldsets = [];
        this.createFields(fields);
    },

    createField: function createField(field, name) {
        field.id = field.id || name;
        field.label = !field.label && field.label !== false ? utils.camelCaseToRegularForm(field.id) : field.label;
        if (field instanceof Field) {
            return field;
        }
        field.type = field.type || 'string';
        if (!formFields[field.type]) {
            throw new Error('Field of type: ' + field.type + ' does not exist');
        }
        return new formFields[field.type](field);
    },

    createFields: function createFields(fields) {
        this.fields = this.fields || {};
        fields = fields || this.fields;

        _.each(fields, function eachField(field, name) {
            if (field.fields) {
                var fieldset = field;
                _.each(fieldset.fields, function (field, name) {
                    field = this.createField(field, name);
                    delete fieldset.fields[name];
                    this.fields[field.id] = fieldset.fields[field.id] = field;
                }, this);
                this.fieldsets.push(
                    _.extend({ legend: '' }, fieldset, { fields: fieldset.fields })
                );
            } else {
                field = this.createField(field, name);
                delete this.fields[name];
                this.fields[field.id] = field;
            }
        }, this);

        return this.fields;
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

    security: function security(res) {
        if (res.locals && res.locals._csrf && !this.fields._csrf) {
            this.fields._csrf = new formFields.hidden({ id: '_csrf' });
        }
    },

    retrieve: function retrieve(req, res, callback) {
        var values,
            options = {
                renderErrors: false,
                renderSuccess: false,
                fieldWrapperTagName: this.options.fieldWrapperTagName
            };

        this.security(res);

        if (req.method === 'POST') {
            values = this.parseBody(req);
        } else if (req.session && req.session.forms && req.session.forms[this.formName]) {
            values = this.sessionValues(req, res, callback, options);
            if (values && res.locals && res.locals._csrf) {
                values._csrf = res.locals._csrf;
            }
            if (!values) {
                return this.options.getValues(req, res, function (err, values) {
                    if (values && res.locals && res.locals._csrf) {
                        values._csrf = res.locals._csrf;
                    }
                    this.setupFormHandler(req, res, callback, err, values, options);
                }.bind(this));
            }
        } else {
            return this.options.getValues(req, res, function (err, values) {
                if (values && res.locals && res.locals._csrf) {
                    values._csrf = res.locals._csrf;
                }
                this.setupFormHandler(req, res, callback, err, values, options);
            }.bind(this));
        }
        this.setupFormHandler(req, res, callback, null, values, options);
    },

    sessionValues: function sessionValues(req, res, callback, options) {
        var values;
        if (req.session.forms[this.formName].success) {
            options.renderErrors = false;
            options.renderSuccess = true;
        }
        values = req.session.forms[this.formName].values;
        if (req.session.forms[this.formName].errorMessage) {
            options.errorMessage = req.session.forms[this.formName].errorMessage;
        }
        delete req.session.forms[this.formName];
        return values;
    },

    parseBody: function parseBody(req) {
        var ret = {},
            parseField = function (field) {
                var val = field.parseBody(req);
                if (typeof val !== 'undefined') {
                    ret[field.id] = val;
                }
            };

        _.each(this.fields, function (field) {
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

        if (req.method !== 'GET' && req.session && !req.xhr) {
            (req.session.forms || (req.session.forms = {}))[this.formName] = { values: values };
            if ((options || {}).errorMessage) {
                req.session.forms[this.formName].errorMessage = options.errorMessage;
            }
        }

        req.forms[this.formName] = new FormHandler(this, values, options);
        this._fields = req.forms[this.formName].fields;

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

    postHandler: function postHandler(req, res, next, err, options) {
        if (err) {
            return next(err);
        }
        if (req.forms[this.formName].valid) {
            this.options.setValues(req, res, this.dispatchPostResponse.bind(this, req, res, next, options));
        } else {
            this.dispatchPostResponse(req, res, next, options, req.forms[this.formName].validationErrors);
        }
    },

    dispatchPostResponse: function dispatchPostResponse(req, res, next, options, err) {
        if (err) {
            options.renderErrors = true;
            options.errorMessage = err.message;
            this.options.errorHandler(err, req, res, next);
        } else {
            this.options.successHandler(req, res, next);
        }
    },

    redirect: function redirect(req) {
        this.options.redirectUrl = req.session.redirectUrl || this.options.redirectUrl;
        // Successfully redirected, delete from session
        if (req.session && req.session.redirectUrl) {
            delete req.session.redirectUrl;
        }
    },

    successHandler: function successHandler(req, res) {
        var formObject = {
                values: false,
                errorMessage: null,
                success: true
            };

        this.redirect(req);

        if (req.xhr) {
            this.options.getValues(req, res, function (err, formValues) {
                if (this.options.redirectUrl) {
                    res.status(200).json({ redirect: this.options.redirectUrl });
                } else {
                    formObject.values = Object.keys(formValues).length ? formValues : req.forms[this.formName].values;
                    res.status(200).json(formObject);
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

    htmlErrors: function htmlErrors(err, req) {
        if (this.options.htmlErrors || req.headers['x-errors-as-html'] === 'enabled') {
            var form = req.forms[this.formName];
            err.message = form.errorHtml;
            _.each(form.fields, function (field) {
                if (err.fields[field.id]) {
                    err.fields[field.id].message = field.errorHtml;
                }
            });
        }
        return err;
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
            formObject.errorMessage = this.htmlErrors(err, req);
            res.status(403).json(formObject);
        } else {
            res.locals.forms = req.forms;
            if (req && req.session) {
                formObject.errorMessage = formObject.errorMessage.toString();
                (req.session.forms || (req.session.forms = {}))[this.formName] = formObject;
            }
            res.status(403).render(this.options.template);
        }
    },

    validate: function validate(values) {
        values || (values = {});

        var error = null,
            fields = {},
            validateField = function (field) {
                var fieldError = field.validate(values[field.id], {}, this._fields);
                if (fieldError) {
                    fields[field.id] = fieldError;
                    error = true;
                }
            }.bind(this);

        _.each(this.fields, function (field) {
            validateField(field);
        });

        if (error) {
            error = new FormError(this.options.errorMessage);
            error.fields = fields;
        }
        return error;
    },

    html: function html(values, options) {
        var ret = this.errorHtml(values, options);

        values = values || {};

        if (this.fieldsets.length > 0) {
            ret += this.fieldsetsHtml(values, options);
        } else {
            ret += this.fieldsHtml(values, options);
        }
        ret += this.buttonsHtml(options);

        return utils.htmlTag('form', this.formAttributes(values), ret);
    },

    errorHtml: function errorHtml(values, options) {
        var error;

        options || (options = {});

        if (options.renderErrors === false && !options.renderSuccess) {
            return '';
        }

        if (options.errorMessage && !options.renderSuccess) {
            return utils.htmlTag('div', { class: 'formError' }, utils.htmlTag('p', {}, String(options.errorMessage)));
        }

        error = this.validate(values);

        if (error instanceof FormError && !options.renderSuccess) {
            return utils.htmlTag('div', { class: 'formError' }, utils.htmlTag('p', {}, error.message));
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
        return _.map(fields || this.fields, function (field) {
            if (fields && !fields[field.id]) {
                return '';
            } else {
                return this.fieldHtml(field, values[field.id], options);
            }
        }, this).join('');
    },

    fieldHtml: function fieldHtml(field, value, options) {
        return field.html(value, options, this._fields);
    },

    fieldsetsHtml: function fieldsetsHtml(values, options) {
        return _.map(this.fieldsets, function (fieldset) {
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
    }

});

module.exports = function FormFactory(name, fields, options) {
    return new Form(name, fields, options);
};

module.exports.extend = Form.extend.bind(Form);
module.exports.prototype.createFields = Form.prototype.createFields;
