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
    });

    after(function () {
        Field.prototype.html.restore();
        Field.prototype.widgetHtml.restore();
        Field.prototype.labelHtml.restore();
        Field.prototype.errorHtml.restore();
    });

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

    it('has valid and validationErrors properties on it, which call validate(values)', function (next) {

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

                fieldHandler.validationErrors
                    .should.deep.equal(fieldInstance.validate(values.firstName));

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
                    fieldHandler = req.forms.aForm.fields.firstName;

                fieldHandler.widgetHtml
                    .should.equal(fieldInstance.widgetHtml(values.firstName, options));

                fieldInstance.widgetHtml
                    .should.always.have.been.calledWithExactly(values.firstName, options);

                fieldHandler.labelHtml
                    .should.equal(fieldInstance.labelHtml(values.firstName, options));

                fieldInstance.labelHtml
                    .should.always.have.been.calledWithExactly(values.firstName, options);

                fieldHandler.errorHtml
                    .should.equal(fieldInstance.errorHtml(values.firstName, options));

                fieldInstance.errorHtml
                    .should.always.have.been.calledWithExactly(values.firstName, options);

                fieldHandler.html
                    .should.equal(fieldInstance.html(values.firstName, options));

                fieldInstance.html
                    .should.always.have.been.calledWithExactly(values.firstName, options);

                callback();
            }, null, values, options);
        }, next);

    });
}));
