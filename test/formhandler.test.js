'use strict';

describe('FormHandler object', function () {

    var express = require('express'),
        request = require('supertest'),
        Form = require('../lib/form'),
        Fields = require('../lib/fields'),
        instance,
        app;

    var values = {}, simpleRequest, options = {};

    beforeEach(function () {
        instance = new Form('aForm', {
            firstName: new Fields.string({ label: 'Foo', required: true }),
            lastName: new Fields.string({ label: 'Bar', required: true }),
            age: new Fields.number({ label: 'Baz' })
        }, {
            template: 'form.test.jade'
        });
        app = express();

        app.set('views', __dirname + '/dummyViews/');
        app.set('view engine', 'jade');
        app.use(require('body-parser').json({extended: true}));
        app.use(require('cookie-parser')('a'));
        app.use(require('express-session')({ secret: 'a' }));
        // Simple wrapper for mocking request objects.
        simpleRequest = function (cb, next, method, values, options) {
            var req = request(app[method || 'get']('/form', function (req, res) {
                req.session.forms = req.session.forms || {};
                try {
                    cb(req, res, function () { res.send(200); });
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

    it('has references to the form instance, and values passed to it', function (next) {

        simpleRequest(function (req, res, callback) {
            instance.setupFormHandler(req, res, function () {

                req.forms.aForm
                    .should.be.an('object');

                req.forms.aForm.values
                    .should.deep.equal({
                        firstName: 'Foo',
                        lastName: 'Bar'
                    });

                req.forms.aForm.form
                    .should.equal(instance);

                callback();
            }, null, {
                firstName: 'Foo',
                lastName: 'Bar'
            });
        }, next);

    });

    it('has valid and validationErrors properties on it, which call validate(values)', function (next) {

        this.spy(instance, 'validate');
        values.firstName = '';

        simpleRequest(function (req, res, callback) {
            instance.setupFormHandler(req, res, function () {

                req.forms.aForm.valid
                    .should.equal(false);

                instance.validate
                    .should.always.have.been.calledWith(values);

                instance.validate.reset();

                req.forms.aForm.validationErrors
                    .should.deep.equal(instance.validate(values));

                callback();
            }, null, values);
        }, next);

    });


    it('has html and buttonsHtml properties, which call their respective form methods', function (next) {

        this.spy(instance, 'html');
        this.spy(instance, 'buttonsHtml');
        this.spy(instance, 'errorHtml');
        values.firstName = '';

        simpleRequest(function (req, res, callback) {
            instance.setupFormHandler(req, res, function () {

                req.forms.aForm.buttonsHtml
                    .should.equal(instance.buttonsHtml(options));

                instance.buttonsHtml
                    .should.always.have.been.calledWithExactly(options);

                req.forms.aForm.errorHtml
                    .should.equal(instance.errorHtml(values, options));

                instance.errorHtml
                    .should.always.have.been.calledWithExactly(values, options);

                req.forms.aForm.html
                    .should.equal(instance.html(values, options));

                instance.html
                    .should.always.have.been.calledWithExactly(values, options);

                callback();
            }, null, values, options);
        }, next);

    });

    describe('fields property', function () {

        it('has a fields property which returns a list of FieldHandler objects', function (next) {

            values.lastName = 'bar';

            simpleRequest(function (req, res, callback) {
                instance.setupFormHandler(req, res, function () {

                    Object.keys(req.forms.aForm.fields).length
                        .should.equal(Object.keys(instance.fields).length);

                    req.forms.aForm.fields.firstName.field
                        .should.equal(instance.fields.firstName);

                    req.forms.aForm.fields.firstName.value
                        .should.equal(values.firstName);

                    req.forms.aForm.fields.lastName.field
                        .should.equal(instance.fields.lastName);

                    req.forms.aForm.fields.lastName.value
                        .should.equal(values.lastName);

                    req.forms.aForm.fields.age.field
                        .should.equal(instance.fields.age);

                    callback();
                }, null, values);
            }, next);

        });

        it('fields are also accessible via their ids', function (next) {

            simpleRequest(function (req, res, callback) {
                instance.setupFormHandler(req, res, function () {

                    req.forms.aForm.fields.firstName
                        .should.equal(req.forms.aForm.fields.firstName);

                    req.forms.aForm.fields.lastName
                        .should.equal(req.forms.aForm.fields.lastName);

                    req.forms.aForm.fields.age
                        .should.equal(req.forms.aForm.fields.age);

                    callback();
                }, null, values);
            }, next);

        });

        it('field id accessors are not enumerable', function (next) {

            simpleRequest(function (req, res, callback) {
                instance.setupFormHandler(req, res, function () {

                    Object.keys(req.forms.aForm.fields)
                        .should.deep.equal(['firstName', 'lastName', 'age']);

                    callback();
                }, null, values);
            }, next);

        });

    });

    describe('fieldsets property', function () {

        beforeEach(function () {
            instance.fields = instance.createFields([
                {
                    id: 'foo',
                    legend: 'Foo',
                    fields: {
                        firstName: new Fields.string({ label: 'Foo', required: true }),
                        lastName: new Fields.string({ label: 'Bar', required: true }),
                    }
                },
                {
                    id: 'bar',
                    legend: 'Bar',
                    fields: {
                        age: new Fields.number({ label: 'Baz' })
                    }
                }
            ]);
        });

        it('returns a list of FieldHandler objects', function (next) {

            simpleRequest(function (req, res, callback) {
                instance.setupFormHandler(req, res, function () {

                    req.forms.aForm.fieldsets.length
                        .should.equal(2);

                    req.forms.aForm.fieldsets[0].legend
                        .should.equal('Foo');

                    req.forms.aForm.fieldsets[1].legend
                        .should.equal('Bar');

                    callback();
                }, null, values);
            }, next);

        });

        it('references fieldsets by id as well', function (next) {

            simpleRequest(function (req, res, callback) {
                instance.setupFormHandler(req, res, function () {

                    req.forms.aForm.fieldsets.foo
                        .should.equal(req.forms.aForm.fieldsets[0]);

                    req.forms.aForm.fieldsets.bar
                        .should.equal(req.forms.aForm.fieldsets[1]);

                    callback();
                }, null, values);
            }, next);

        });

        it('contains references to fields for each fieldset', function (next) {

            simpleRequest(function (req, res, callback) {
                instance.setupFormHandler(req, res, function () {

                    req.forms.aForm.fields.firstName.id
                        .should.equal('firstName');

                    req.forms.aForm.fields.lastName.id
                        .should.equal('lastName');

                    req.forms.aForm.fields.age.id
                        .should.equal('age');

                    callback();
                }, null, values);
            }, next);

        });

    });

});
