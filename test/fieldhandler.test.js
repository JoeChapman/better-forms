'use strict';

describe('FieldHandler:', sandbox(function () {

    var express = require('express'),
        request = require('supertest'),
        Form = require('../lib/form'),
        Fields = require('../lib/fields'),
        Field = require('../lib/field'),
        instance,
        values = {};

    var app, simpleRequest;

    before(function () {
        this.spy(Field.prototype, 'html');
        this.spy(Field.prototype, 'widgetHtml');
        this.spy(Field.prototype, 'labelHtml');
        this.spy(Field.prototype, 'errorHtml');
        this.spy(Field.prototype, 'labelText');
        this.spy(Field.prototype, 'widgetAttributes');
    });

    after(function () {
        Field.prototype.html.restore();
        Field.prototype.widgetHtml.restore();
        Field.prototype.labelHtml.restore();
        Field.prototype.errorHtml.restore();
        Field.prototype.labelText.restore();
        Field.prototype.widgetAttributes.restore();
    });

    beforeEach(function () {
        instance = new Form('aForm', {
            firstName: new Fields.string({
                label: 'Foo',
                required: true,
                placeholder: 'First name'
            }),
            lastName: new Fields.string({ label: 'Bar', required: true }),
            age: new Fields.number({ label: 'Baz' }),
            title: new Fields.select({ choices: [{ 'Mrs': 'mrs' }, { 'Mr': 'mr' }] })
        }, {
            template: 'form.test.jade'
        });
        app = express();

        app.set('views', __dirname + '/dummyViews/');
        app.set('view engine', 'jade');
        app.use(require('body-parser').json({extended: true}));
        app.use(require('cookie-parser')('a'));
        app.use(require('express-session')({
            saveUninitialized: true,
            resave: true,
            secret: 'a'
        }));
        // Simple wrapper for mocking request objects.
        simpleRequest = function (cb, next, method, values, options) {
            var req = request(app[method || 'get']('/form', function (req, res) {
                req.session.forms = req.session.forms || {};
                try {
                    cb(req, res, function () { res.status(200).end(); });
                } catch (e) {
                    next(e);
                }
            }))[method || 'get']('/form').send(values);
            if (options && options.xhr) {
                req.set('X-Requested-With', 'XMLHttpRequest');
            }
            req.end(next);
        };
    });

    it('has errorText and valid properties on it, which call validate(values)', function (next) {

        this.spy(Field.prototype, 'validate');
        values.firstName = '';

        simpleRequest(function (req, res, callback) {
            instance.setupFormHandler(req, res, function () {

                var fieldInstance = instance.fields.firstName,
                    fieldHandler = req.forms.aForm.fields.firstName;

                fieldHandler.valid
                    .should.equal(false);

                fieldInstance.validate
                    .should.always.have.been.calledWith(values.firstName);

                fieldInstance.validate.reset();

                fieldHandler.errorText
                    .should.deep.equal(fieldInstance.validate(values.firstName));

                callback();
            }, null, values);
        }, next);

    });

    it('has error property on it, which calls getError', function (next) {

        this.spy(Field.prototype, 'getError');
        values.firstName = '';

        simpleRequest(function (req, res, callback) {
            instance.setupFormHandler(req, res, function () {

                var fieldInstance = instance.fields.firstName,
                    fieldHandler = req.forms.aForm.fields.firstName;

                fieldHandler.error
                    .should.equal('valueMissing');

                fieldInstance.getError
                    .should.always.have.been.calledWith(values.firstName);

                fieldInstance.getError.reset();

                fieldHandler.error
                    .should.deep.equal(fieldInstance.getError(values.firstName));

                callback();
            }, null, values);
        }, next);

    });

    it('has a choices property on it, which returns field.choices', function (next) {

        simpleRequest(function (req, res, callback) {
            instance.setupFormHandler(req, res, function () {

                var fieldInstance = instance.fields.title,
                    fieldHandler = req.forms.aForm.fields.title;

                fieldHandler.choices
                    .should.equal(fieldInstance.choices);

                callback();
            }, null, values);
        }, next);

    });

    it('has a placeholder property on it, which returns field.placeholder', function (next) {

        simpleRequest(function (req, res, callback) {
            instance.setupFormHandler(req, res, function () {

                var fieldInstance = instance.fields.firstName,
                    fieldHandler = req.forms.aForm.fields.firstName;

                fieldHandler.placeholder
                    .should.equal(fieldInstance.placeholder);

                callback();
            }, null, values);
        }, next);

    });

    it('has id, tagName, availableAttributes and type properties, of their respective properties', function (next) {

        simpleRequest(function (req, res, callback) {
            instance.setupFormHandler(req, res, function () {

                var fieldInstance = instance.fields.firstName,
                    fieldHandler = req.forms.aForm.fields.firstName;

                fieldHandler.id
                    .should.equal(fieldInstance.id);

                fieldHandler.name
                    .should.equal(fieldInstance.id);

                fieldHandler.tagName
                    .should.equal(fieldInstance.tagName);

                fieldHandler.availableAttributes
                    .should.equal(fieldInstance.availableAttributes);

                fieldHandler.type
                    .should.equal(fieldInstance.type);

                callback();
            }, null, values);
        }, next);

    });

    it('has html, widgetHtml, labelHtml, errorHtml properties, which call their respective form methods', function (next) {

        values.firstName = '';
        var options = {};

        simpleRequest(function (req, res, callback) {
            instance.setupFormHandler(req, res, function () {

                var fieldInstance = instance.fields.firstName,
                    fieldHandler = req.forms.aForm.fields.firstName,
                    fields = {firstName: {}, lastName: {}, age: {}};

                fieldInstance.fields = fields;

                fieldHandler.widgetHtml
                    .should.equal(fieldInstance.widgetHtml(values.firstName, options));

                fieldInstance.widgetHtml
                    .should.always.have.been.calledWithExactly(values.firstName, options);

                fieldHandler.labelHtml
                    .should.equal(fieldInstance.labelHtml(values.firstName, options));

                fieldInstance.labelHtml
                    .should.always.have.been.calledWithExactly(values.firstName, options);

                fieldHandler.errorHtml
                    .should.equal(fieldInstance.errorHtml(values.firstName, options, fields));

                fieldInstance.errorHtml
                    .should.have.been.calledWith(values.firstName, options, fields);

                fieldHandler.html
                    .should.equal(fieldInstance.html(values.firstName, options, fields));

                fieldInstance.html
                    .should.have.been.calledWithExactly(values.firstName, options, fields);

                callback();
            }, null, values, options);
        }, next);

    });

    it('has labelText, widgetAttributes properties, which call their respective form methods', function (next) {

        values.firstName = '';
        var options = {};

        simpleRequest(function (req, res, callback) {
            instance.setupFormHandler(req, res, function () {

                var fieldInstance = instance.fields.firstName,
                    fieldHandler = req.forms.aForm.fields.firstName,
                    fields = {firstName: {}, lastName: {}, age: {}};

                fieldInstance.fields = fields;

                fieldHandler.labelText
                    .should.equal(fieldInstance.labelText(values.firstName, options));

                fieldInstance.labelText
                    .should.always.have.been.calledWithExactly(values.firstName, options);

                fieldHandler.widgetAttributes
                    .should.deep.equal(fieldInstance.widgetAttributes(values.firstName, options));

                fieldInstance.widgetAttributes
                    .should.have.been.calledWith(values.firstName, options);

                callback();
            }, null, values, options);
        }, next);

    });

    describe('custom getter', function () {

        describe('when not set', function () {

            it('returns undefined', function (next) {

                simpleRequest(function (req, res, callback) {
                    instance.setupFormHandler(req, res, function () {

                        var fieldHandler = req.forms.aForm.fields.firstName;

                        should.equal(fieldHandler.custom, undefined);

                        callback();
                    }, null, values);
                }, next);

            });

        });

        describe('when set', function () {

            var options = {};

            beforeEach(function () {
                instance.fields.firstName.custom = this.stub().returns('foo');
            });

            it('has a custom property which calls a custom handler if it exists', function (next) {

                simpleRequest(function (req, res, callback) {
                    instance.setupFormHandler(req, res, function () {

                        var fieldInstance = instance.fields.firstName,
                            fieldHandler = req.forms.aForm.fields.firstName,
                            fields = {firstName: {}, lastName: {}, age: {}};

                        fieldInstance.fields = fields;

                        fieldHandler.custom
                            .should.deep.equal(fieldInstance.custom(values.firstName, options));

                        callback();
                    }, null, values, options);
                }, next);

            });

        });
    });


}));
