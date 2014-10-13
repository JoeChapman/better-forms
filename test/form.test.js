'use strict';

describe('Form:', sandbox(function () {

    var ServerResponse = require('http').ServerResponse,
        IncomingMessage = require('http').IncomingMessage,
        express = require('express'),
        request = require('supertest'),
        Form = require('../lib/form'),
        FormError = require('../lib/error'),
        Fields = require('../lib/fields'),
        Field = require('../lib/field'),
        instance;



    describe('.createFields()', function () {

        var fields = null, form;

        describe('with fields', function () {

            beforeEach(function () {

                form = new Form('test');

                fields = Form.prototype.createFields.call(form, {
                    firstName: new Fields.string(),
                    lastName: new Fields.string(),
                    age: new Fields.number({label: 'Test'})
                });

            });

            it('returns a hash of new field instances identified by their ids', function () {

                fields.firstName.should.be.instanceof.Field;
                fields.lastName.should.be.instanceof.Field;
                fields.age.should.be.instanceof.Field;

            });

            it('ensures each field has a label generated from name if not provided', function () {

                fields.firstName
                    .label.should.equal('First name');

                fields.lastName
                    .label.should.equal('Last name');

                fields.age
                    .label.should.equal('Test');

            });

        });

        describe('with fieldsets', function () {

            var form;

            beforeEach(function () {

                form = new Form('test');

                Form.prototype.createFields.call(form, [{
                    legend: 'Names',
                    fields: {
                        firstName: new Fields.string(),
                        lastName: new Fields.string()
                    }
                }, {
                    fields: {
                        age: new Fields.number()
                    }
                }]);

            });

            it('creates a list of fieldsets', function () {

                form.fieldsets.should.be.an('array');

            });

            it('gives each fieldset a legend (empty string if not provided)', function () {

                form.fieldsets[0].legend.should.equal('Names');

                form.fieldsets[1].legend.should.equal('');

            });

            it('populates each fieldset with fields if provided', function () {

                form.fieldsets[0].fields.firstName.id.should.equal('firstName');
                form.fieldsets[0].fields.firstName.label.should.equal('First name');
                form.fieldsets[0].fields.lastName.id.should.equal('lastName');
                form.fieldsets[0].fields.lastName.label.should.equal('Last name');

                form.fieldsets[1].fields.age.id.should.equal('age');
                form.fieldsets[1].fields.age.label.should.equal('Age');

            });

            it('returns a hash of new field instances identified by their ids', function () {

                form.fieldsets[0].fields.firstName.should.be.instanceof.Field;
                form.fieldsets[0].fields.lastName.should.be.instanceof.Field;
                form.fieldsets[1].fields.age.should.be.instanceof.Field;

            });

        });

    });

    describe('newing up a form', function () {

        var fields;

        beforeEach(function () {

            fields = {
                firstName: new Fields.string(),
                lastName: new Fields.string(),
                age: new Fields.number()
            };

            instance = new Form('aForm', fields);

        });

        it('uses the first argument as the form name', function () {

            instance.formName
                .should.equal('aForm');

        });

        it('uses the first argument as the form id', function () {

            instance.options.id
                .should.equal('aForm');

        });

        it('uses the first argument as the form template', function () {

            instance.options.template
                .should.equal('aForm');

        });

        it('has a fields object from the second argument', function () {

            instance.fields
                .should.be.an('object');

            instance.fields.firstName
                .should.be.an.instanceof(Field);

            instance.fields.lastName
                .should.be.an.instanceof(Field);

            instance.fields.age
                .should.be.an.instanceof(Field);

        });

        describe('.buttonsHtml', function () {

            it('generates HTML for the submit buttons, in a list', function () {

                instance.buttonsHtml()
                    .should.equal('<ul class="buttonSet">' +
                        '<li><button type="submit">Submit</button></li>' +
                        '</ul>');

            });

            it('can customise the submit button with submitTagName, submitAttrs, submitLabel options', function () {

                instance = new Form('aForm', {
                    firstName: new Fields.string(),
                    lastName: new Fields.string(),
                    age: new Fields.number()
                }, {
                    submitTagName: 'a',
                    submitAttrs: { class: 'button' },
                    submitLabel: 'Foo'
                });


                instance.buttonsHtml()
                    .should.equal('<ul class="buttonSet"><li><a class="button">Foo</a></li></ul>');

            });

            it('can customise the fieldset tag with buttonSetTagName, buttonSetAttrs options', function () {

                instance = new Form('aForm', {
                    firstName: new Fields.string(),
                    lastName: new Fields.string(),
                    age: new Fields.number()
                }, {
                    buttonSetTagName: 'div',
                    buttonSetAttrs: { role: 'menu' }
                });


                instance.buttonsHtml()
                    .should.equal('<div role="menu"><button type="submit">Submit</button></div>');

            });

            it('can include extra HTML with the additionalButtonSetHtml option', function () {

                instance = new Form('aForm', {
                    firstName: new Fields.string(),
                    lastName: new Fields.string(),
                    age: new Fields.number()
                }, {
                    additionalButtonSetHtml: '<div class="foo">Tips:</div>'
                });


                instance.buttonsHtml()
                    .should.equal('<ul class="buttonSet">' +
                        '<li><button type="submit">Submit</button></li>' +
                        '<div class="foo">Tips:</div>' +
                        '</ul>');

            });

        });

        describe('.errorHtml', function () {

            it('generates HTML for the success message when no errors are present', function () {

                instance.errorHtml({}, { renderSuccess: true })
                    .should.equal('<div class="formSuccess"><p>Saved successfully</p></div>');

            });

            it('generates HTML for success message when no errors are present, with a customised message if provided', function () {

                instance.options.successMessage = 'WIN';
                instance.errorHtml({}, { renderSuccess: true })
                    .should.equal('<div class="formSuccess"><p>WIN</p></div>');

            });

            it('generates HTML for error message if errors are present', function () {

                instance.fields.firstName.required = true;

                instance.errorHtml()
                    .should.equal('<div class="formError"><p>This form contains errors</p></div>');

            });

            it('generates HTML for error message if errors are present, with a customised message if provided', function () {

                instance.fields.firstName.required = true;
                instance.fields.firstName.value = '';
                instance.options.errorMessage = 'LOSE';

                instance.errorHtml()
                    .should.equal('<div class="formError"><p>LOSE</p></div>');

            });

            it('will always return a custom error message wrapped in a div.formError tag, if options.errorMessage is supplied', function () {

                instance.fields.firstName.required = true;
                instance.fields.firstName.value = '';

                instance.errorHtml({}, { errorMessage: 'This is an error' })
                    .should.equal('<div class="formError"><p>This is an error</p></div>');

                instance.errorHtml({}, { errorMessage: 'This is an error' })
                    .should.equal('<div class="formError"><p>This is an error</p></div>');

            });

            it('will return an empty string if given the "renderErrors === false" option', function () {

                instance.required = true;

                instance.errorHtml('', { renderErrors: false })
                    .should.equal('');

            });

        });

        describe('.fieldsHtml()', function () {

            it('calls field.html with the value of the field, options and the instantiated fields collection', function () {

                var values = {
                    firstName: 'foo'
                };

                instance._fields = {};

                this.stub(instance.fields.firstName, 'html', function () {});

                instance.fieldsHtml(values, {});

                instance.fields.firstName.html
                    .should.have.been.calledWith('foo', {}, instance._fields);

            });

        });

        describe('.html()', function () {

            beforeEach(function () {
                instance = new Form('aForm', {
                    firstName: new Fields.string({ required: true }),
                    lastName: new Fields.string({ required: true }),
                    age: new Fields.number()
                });
                this.stub(instance, 'errorHtml').returns('<errorHtml>');
                this.stub(instance, 'buttonsHtml').returns('<buttonsHtml>');
            });

            it('outputs form html including all fields html', function () {

                this.stub(Field.prototype, 'html', function (value) {
                    return '<div class="field" data-type="' + this.type + '"><field:' + this.id + ' value="' + (value || '') + '"/></div>';
                });

                instance.html()
                    .should.equal('<form method="post" action="" id="aForm" role="form">' +
                        '<errorHtml>' +
                        '<div class="field" data-type="text"><field:firstName value=""/></div>' +
                        '<div class="field" data-type="text"><field:lastName value=""/></div>' +
                        '<div class="field" data-type="number"><field:age value=""/></div>' +
                        '<buttonsHtml>' +
                        '</form>');

                instance.errorHtml
                    .should.have.been.calledOnce;

                instance.buttonsHtml
                    .should.have.been.calledOnce;

            });

            it('can be customised using options object', function () {

                instance.options.id = 'id';
                instance.options.classes = ['class1', 'class2'];
                instance.options.method = 'GET';
                instance.options.action = '/?foo=bar';
                instance.options.role = undefined;
                instance.options.novalidate = true;
                instance.options.autocomplete = 'off';

                instance.html()
                    .should.equal('<form method="GET" action="/?foo=bar" id="id" class="class1 class2" novalidate="true" autocomplete="off">' +
                        '<errorHtml>' +
                        '<div class="field" data-type="text"><field:firstName value=""/></div>' +
                        '<div class="field" data-type="text"><field:lastName value=""/></div>' +
                        '<div class="field" data-type="number"><field:age value=""/></div>' +
                        '<buttonsHtml>' +
                        '</form>');

            });

            it('uses instance.fieldHtml for each field, and instance.buttonsHtml for the buttons', function () {

                this.stub(instance, 'fieldHtml', function (field) {
                    return field.id + ' ';
                });

                instance.html()
                    .should.equal('<form method="post" action="" id="aForm" role="form">' +
                        '<errorHtml>' +
                        'firstName lastName age ' +
                        '<buttonsHtml>' +
                        '</form>');

            });

            it('gives value properties to HTML fields if passed in', function () {

                instance.html({ firstName: 'foo', lastName: 'bar' })
                    .should.equal('<form method="post" action="" id="aForm" role="form">' +
                        '<errorHtml>' +
                        '<div class="field" data-type="text"><field:firstName value="foo"/></div>' +
                        '<div class="field" data-type="text"><field:lastName value="bar"/></div>' +
                        '<div class="field" data-type="number"><field:age value=""/></div>' +
                        '<buttonsHtml>' +
                        '</form>');

            });

            it('passes values and options arguments to all methods that it calls', function () {

                var values = { firstName: 'foo', lastName: 'bar' }, options = {};
                this.spy(instance, 'fieldHtml');

                instance.html(values, options);

                instance.errorHtml
                    .should.have.been.calledWithExactly(values, options);

                instance.buttonsHtml
                    .should.have.been.calledWithExactly(options);

                instance.fieldHtml
                    .should.have.been.calledWithExactly(instance.fields.firstName, values.firstName, options);

                instance.fieldHtml
                    .should.have.been.calledWithExactly(instance.fields.lastName, values.lastName, options);

                instance.fieldHtml
                    .should.have.been.calledWithExactly(instance.fields.age, values.age, options);

            });

            it('renders fieldsets if defined', function () {

                instance.fieldsets = [
                    { fields: ['firstName'] },
                    { fields: ['lastName'] }
                ];

                instance.html()
                    .should.equal('<form method="post" action="" id="aForm" role="form">' +
                        '<errorHtml>' +
                        '<fieldset>' +
                        '</fieldset>' +
                        '<fieldset>' +
                        '</fieldset>' +
                        '<buttonsHtml>' +
                        '</form>');

            });

        });

        describe('.validate()', function () {

            beforeEach(function () {
                instance = new Form('aForm', {
                    firstName: new Fields.string({ required: true }),
                    lastName: new Fields.string({ required: true }),
                    age: new Fields.number()
                });
            });

            it('will validate all form fields, returning null if all are valid', function () {

                instance.fields.firstName.value = 'Foo';
                instance.fields.lastName.value = 'Bar';
                instance.fields.age.value = '22';

                should.equal(instance.validate(), null);

            });

            it('returns an error object if validation errors are found in the fields', function () {

                instance.fields.firstName.value = 'Foo';
                instance.fields.lastName.value = '';
                instance.fields.age.value = '22';

                instance.validate()
                    .should.be.an.instanceof(FormError);

                instance.validate().message
                    .should.equal('This form contains errors');

            });

            it('returns field errors, attached to the error object if validation errors occur', function () {

                instance.fields.firstName.value = '';
                instance.fields.lastName.value = '';
                instance.fields.age.value = 22;

                instance.validate()
                    .should.be.an.instanceof(FormError);

                instance.validate().fields
                    .should.be.an('object');

                instance.validate().fields.firstName
                    .should.be.an.instanceof(FormError);

                instance.validate().fields.firstName.message
                    .should.equal(instance.fields.firstName.validate().message);

                instance.validate().fields.lastName
                    .should.be.an.instanceof(FormError);

                instance.validate().fields.lastName.message
                    .should.equal(instance.fields.lastName.validate().message);

            });

            it('returns a custom error message specified by options.errorMessage', function () {

                instance.fields.firstName.value = 'Foo';
                instance.fields.lastName.value = '';
                instance.fields.age.value = '22';
                instance.options.errorMessage = 'Oops';

                instance.validate()
                    .should.be.an.instanceof(FormError);

                instance.validate().message
                    .should.equal('Oops');

            });

            it('will validate all form fields against the values passed in as first argument object', function () {

                var values = {
                    firstName: 'foo',
                    lastName: 'bar',
                    age: 27
                };

                should.equal(instance.validate(values), null);

                values.firstName = '';

                instance.validate(values)
                    .should.be.an.instanceof(FormError);

                instance.validate(values).fields.firstName
                    .should.be.an.instanceof(FormError);

            });

        });

        describe('request helper methods', function () {

            var app, simpleRequest;

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

            describe('.setupFormHandler()', function () {

                var values, options;

                beforeEach(function () {
                    values = { firstName: 'Foo', lastName: 'Bar', age: '' };
                    options = {};
                });

                it('injects req.forms[formName] as a FormHandler into request object', function (next) {

                    simpleRequest(function (req, res, callback) {
                        instance.setupFormHandler(req, res, function () {

                            req.forms.aForm
                                .should.be.an('object');

                            arguments[0]
                                .should.equal(req);

                            arguments[1]
                                .should.equal(res);

                            callback();
                        }, null, values);
                    }, next);

                });

                it('injects req.session.forms[Formname] as JSON values into request object for POSTs', function (next) {

                    simpleRequest(function (req, res, callback) {
                        instance.setupFormHandler(req, res, function () {

                            req.session.forms.aForm
                                .should.be.an('object');

                            req.session.forms.aForm.values
                                .should.deep.equal(values);

                            arguments[0]
                                .should.equal(req);

                            arguments[1]
                                .should.equal(res);

                            callback();
                        }, null, values);
                    }, next, 'post');

                });

                it('does not write form values to session for xhr requests', function (next) {

                    simpleRequest(function (req, res, callback) {
                        instance.setupFormHandler(req, res, function () {

                            should.not.exist(req.session.forms.aForm);

                            callback();
                        }, null, values);
                    }, next, 'post', '', { xhr: true });

                });

                it('passes options.errorMessage to req.session.forms[Formname] for POSTs', function (next) {

                    options.errorMessage = 'Error';

                    simpleRequest(function (req, res, callback) {
                        instance.setupFormHandler(req, res, function () {

                            req.session.forms.aForm
                                .should.be.an('object');

                            req.session.forms.aForm.errorMessage
                                .should.equal('Error');

                            arguments[0]
                                .should.equal(req);

                            arguments[1]
                                .should.equal(res);

                            callback();
                        }, null, values, options);
                    }, next, 'post');

                });

                it('passes errors on to callback', function (next) {

                    simpleRequest(function (req, res, callback) {
                        instance.setupFormHandler(req, res, function () {

                            arguments[2]
                                .should.deep.equal({ error: 'error' });

                            callback();

                        }, { error: 'error' });
                    }, next);

                });

            });

            describe('.retrieve()', function () {

                var formHandler;

                beforeEach(function () {
                    this.stub(instance, 'setupFormHandler', function (req, res, next, err, values, options) {
                        formHandler = { values: values, options: options };
                        req.forms = { aForm: formHandler };
                        next(req, res);
                    });
                    this.stub(instance, 'parseBody', function (req) {
                        return req.body;
                    });
                });

                it('it retrieves csrf token from res.locals if it exists', function (next) {

                    simpleRequest(function (req, res, callback) {

                        res.locals = {
                            _csrf: '123'
                        };

                        instance.retrieve(req, res, function () {

                            instance.setupFormHandler
                                .should.have.been.called;

                            req.forms.aForm
                                .should.equal(formHandler);

                            req.forms.aForm.values._csrf
                                .should.equal('123');

                            arguments[0]
                                .should.equal(req);

                            arguments[1]
                                .should.equal(res);

                            callback();
                        });
                    }, next );

                });

                it('adds _csrf field to instance.fields if res.locals._csrf is defined', function (next) {

                    simpleRequest(function (req, res, callback) {
                        res.locals = {
                            _csrf: '123'
                        };
                        instance.retrieve(req, res, function () {

                            instance.setupFormHandler
                                .should.have.been.called;

                            req.forms.aForm
                                .should.equal(formHandler);

                            req.forms.aForm.values._csrf
                                .should.equal('123');

                            instance.fields._csrf.type
                                .should.equal('hidden');

                            instance.fields._csrf.id
                                .should.equal('_csrf');

                            arguments[0]
                                .should.equal(req);

                            arguments[1]
                                .should.equal(res);

                            callback();
                        });
                    }, next);
                });

                it('retrieves values from the getValues method in forms', function (next) {

                    var getValues = this.stub(instance.options, 'getValues', function (req, res, next) {
                        next(null, {
                            firstName: 'Foo',
                            lastName: 'Bar'
                        });
                    });

                    simpleRequest(function (req, res, callback) {
                        instance.retrieve(req, res, function () {

                            instance.setupFormHandler
                                .should.have.been.called;

                            req.forms.aForm
                                .should.equal(formHandler);

                            req.forms.aForm.values
                                .should.deep.equal({
                                    firstName: 'Foo',
                                    lastName: 'Bar'
                                });

                            getValues.getCall(0).args[0]
                                .should.equal(req);

                            getValues.getCall(0).args[1]
                                .should.equal(res);

                            getValues.getCall(0).args[2]
                                .should.be.a('function');

                            arguments[0]
                                .should.equal(req);

                            arguments[1]
                                .should.equal(res);

                            callback();
                        });
                    }, next);

                });

                it('will retrieve values from the request session (instead of getValues()) if available, and then remove them', function (next) {

                    simpleRequest(function (req, res, callback) {

                        req.session.forms = {
                            aForm: {
                                values: {
                                    firstName: 'Baz',
                                    lastName: 'Bing'
                                }
                            }
                        };

                        instance.retrieve(req, res, function () {

                            instance.setupFormHandler
                                .should.have.been.called;

                            req.forms.aForm
                                .should.equal(formHandler);

                            req.forms.aForm.values
                                .should.deep.equal({
                                    firstName: 'Baz',
                                    lastName: 'Bing'
                                });

                            should.not.exist(req.session.forms.aForm);

                            arguments[0]
                                .should.equal(req);

                            arguments[1]
                                .should.equal(res);

                            callback();
                        });
                    }, next);

                });

                it('will retrieve errorMessage from the session if it is available', function (next) {

                    simpleRequest(function (req, res, callback) {

                        req.session.forms = {
                            aForm: {
                                values: {
                                    firstName: 'Baz',
                                    lastName: 'Bing'
                                },
                                errorMessage: 'Foo'
                            }
                        };

                        instance.retrieve(req, res, function () {

                            instance.setupFormHandler
                                .should.have.been.called;

                            req.forms.aForm
                                .should.equal(formHandler);

                            req.forms.aForm.values
                                .should.deep.equal({
                                    firstName: 'Baz',
                                    lastName: 'Bing'
                                });

                            req.forms.aForm.options.errorMessage
                                .should.equal('Foo');

                            should.not.exist(req.session.forms.aForm);

                            arguments[0]
                                .should.equal(req);

                            arguments[1]
                                .should.equal(res);

                            callback();
                        });
                    }, next);

                });

                it('will retrieve values from POST if the req has a method of POST', function (next) {

                    simpleRequest(function (req, res, callback) {

                        instance.retrieve(req, res, function () {

                            instance.setupFormHandler
                                .should.have.been.called;

                            instance.parseBody
                                .should.have.been.called;

                            req.forms.aForm
                                .should.equal(formHandler);

                            req.forms.aForm.values
                                .should.deep.equal({
                                    firstName: 'Boo',
                                    lastName: 'Bop'
                                });

                            should.not.exist(req.session.forms.aForm);

                            arguments[0]
                                .should.equal(req);

                            arguments[1]
                                .should.equal(res);

                            callback();
                        });

                    }, next, 'post', { firstName: 'Boo', lastName: 'Bop' });

                });

            });

            describe('.parseBody()', function () {

                it('gets field values from body on POST', function (next) {
                    simpleRequest(function (req, res, callback) {

                        instance.retrieve(req, res, function () {

                            req.forms.aForm.values
                                .should.deep.equal({ firstName: 'Boo', lastName: 'Bop', age: 17 });

                            callback();

                        });

                    }, next, 'post', { firstName: 'Boo', lastName: 'Bop', age: 17 });
                });

                it('ignores undefined values', function (next) {
                    simpleRequest(function (req, res, callback) {

                        instance.retrieve(req, res, function () {

                            req.forms.aForm.values
                                .should.deep.equal({ firstName: 'Boo', lastName: 'Bop' });

                            callback();

                        });

                    }, next, 'post', { firstName: 'Boo', lastName: 'Bop' });
                });

                it('ignores values in body with no corresponding field', function (next) {
                    simpleRequest(function (req, res, callback) {

                        instance.retrieve(req, res, function () {

                            req.forms.aForm.values
                                .should.deep.equal({ firstName: 'Boo', lastName: 'Bop', age: 17 });

                            callback();

                        });

                    }, next, 'post', { firstName: 'Boo', lastName: 'Bop', age: 17, foo: 'Bar' });
                });


                it('allows fields to use custom body parsers to get values', function (next) {
                    instance = new Form('aForm', {
                        percent: new (Fields.string.extend({
                            parseBody: function (req) {
                                return parseInt(req.body.percent, 10) / 100;
                            }
                        }))()
                    });

                    simpleRequest(function (req, res, callback) {

                        instance.retrieve(req, res, function () {

                            req.forms.aForm.values.percent
                                .should.equal(0.5);

                            callback();

                        });

                    }, next, 'post', { percent: 50 });
                });

                it('responds with the redirectUrl from the session', function (next) {

                    simpleRequest(function (req, res, callback) {

                        req.session.redirectUrl = '/bar';

                        instance.requestHandler(req, res, function () {
                            res.statusCode
                                .should.equal(200);

                            res.body
                                .should.deep.equal({ redirect: '/bar' });

                            callback();
                        });

                    }, next, 'post');
                });


            });

            describe('.requestHandler()', function () {

                it('dispatches GET requests, through .retrieve() to form.options.getHandler', function (next) {

                    this.spy(instance, 'retrieve');

                    this.stub(instance.options, 'getHandler', function (req, res, next) {

                        instance.retrieve
                            .should.have.been.called;

                        instance.retrieve.getCall(0).args[0]
                            .should.equal(req);

                        instance.retrieve.getCall(0).args[1]
                            .should.equal(res);

                        next
                            .should.be.a('function');

                        res.status(200).end();
                    });

                    request(app.get('/form', instance.requestHandler)).get('/form').end(next);

                });

                it('dispatches POST requests, through .retrieve() to form.options.postHandler', function (next) {

                    this.spy(instance, 'retrieve');

                    this.stub(instance.options, 'postHandler', function (req, res, next) {

                        instance.retrieve
                            .should.have.been.called;

                        instance.retrieve.getCall(0).args[0]
                            .should.equal(req);

                        instance.retrieve.getCall(0).args[1]
                            .should.equal(res);

                        next
                            .should.be.a('function');

                        res.status(200).end();
                    });

                    request(app.post('/form', instance.requestHandler)).post('/form').end(next);

                });

            });

            describe('default getHandler', function () {

                var formHandler, internalRes;

                beforeEach(function () {
                    this.stub(instance, 'setupFormHandler', function (req, res, next, err) {
                        formHandler = {};
                        req.forms = { aForm: formHandler };
                        // we need to set the internalRes because supertest gives us back just an
                        // http response object, not the Express response object.
                        next(req, internalRes = res, err);
                    });
                });

                it('sets req.locals.forms to req.forms', function (next) {

                    request(app.get('/form', instance.requestHandler)).get('/form').end(function (err, res) {

                        res.statusCode
                            .should.equal(200);

                        internalRes.locals.forms.aForm
                            .should.equal(formHandler);

                        next(err);
                    });

                });

                it('sets req.locals.forms to req.forms', function (next) {

                    request(app.get('/form', function (req, res, next) {
                        this.spy(res, 'render');
                        return instance.requestHandler(req, res, next);
                    }.bind(this))).get('/form').end(function (err, res) {

                        res.statusCode
                            .should.equal(200);

                        internalRes.render
                            .should.have.been.calledOnce;

                        internalRes.render
                            .should.have.been.calledWithExactly('form.test.jade');

                        next(err);
                    });

                });

                it('passes error to error handling middleware if an error exists', function (next) {

                    this.stub(instance, 'retrieve', function (req, res, callback) {
                        callback(req, res, {
                            error: 'An error'
                        });
                    });
                    app.get('/form', function (req, res, next) {
                        return instance.requestHandler(req, res, next);
                    });
                    app.use(function (err, req, res, next) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            next();
                        }
                    });
                    request(app).get('/form').end(function (err, res) {

                        res.statusCode
                            .should.equal(500);

                        res.body
                            .should.deep.equal({ error: 'An error' });

                        next();
                    });
                });

            });

            describe('default postHandler', function () {

                beforeEach(function () {
                    instance = new Form('aForm', {
                        firstName: new Fields.string({ required: true }),
                        lastName: new Fields.string({ required: true }),
                        age: new Fields.number()
                    }, {
                        id: 'foo',
                        template: 'form.test.jade',
                        setValues: this.stub().callsArg(2),
                        predirect: this.stub().callsArg(2),
                        getValues: function (req, res, callback) {
                            callback(null, { firstName: 'FooFoo', lastName: 'BarBar', age: '0' });
                        }
                    });

                    app.post('/form', instance.requestHandler);
                });

                it('calls setValues if the form is valid', function (next) {

                    request(app).post('/form')
                        .send({ firstName: 'Foo', lastName: 'Bar', age: '' })
                        .end(function (err) {

                            instance.options.setValues
                                .should.have.been.calledOnce;

                            instance.options.setValues
                                .should.have.been.calledWith(
                                    sinon.match.instanceOf(IncomingMessage),
                                    sinon.match.instanceOf(ServerResponse),
                                    sinon.match.func
                                );

                            next(err);
                        });
                });

                it('calls predirect if the form is valid', function (next) {

                    request(app).post('/form')
                        .send({ firstName: 'Foo', lastName: 'Bar', age: '' })
                        .end(function (err) {

                            instance.options.predirect
                                .should.have.been.calledOnce;

                            instance.options.predirect
                                .should.have.been.calledWith(
                                    sinon.match.instanceOf(IncomingMessage),
                                    sinon.match.instanceOf(ServerResponse),
                                    sinon.match.func
                                );

                            next(err);
                        });
                });

                it('calls successHandler after setValues if the form is valid', function (next) {

                    this.spy(instance.options, 'successHandler');
                    this.spy(instance.options, 'errorHandler');

                    instance.options.setValues.func = function (req, res, cb) {
                        try {
                            instance.options.successHandler
                                .should.not.have.been.called;

                            cb();
                        } catch (e) { cb(e); }
                    };

                    request(app).post('/form')
                        .send({ firstName: 'Foo', lastName: 'Bar', age: '' })
                        .end(function (err) {

                            instance.options.successHandler
                                .should.have.been.calledOnce;

                            instance.options.successHandler
                                .should.have.been.calledWithExactly(
                                    sinon.match.instanceOf(IncomingMessage),
                                    sinon.match.instanceOf(ServerResponse),
                                    sinon.match.func
                                );

                            instance.options.errorHandler
                                .should.not.have.been.called;

                            next(err);
                        });

                });

                it('calls errorHandler if form is invalid', function (next) {

                    this.spy(instance.options, 'successHandler');
                    this.stub(instance.options, 'errorHandler').callsArg(3);

                    request(app)
                        .post('/form')
                        .send({ firstName: 'Foo', lastName: '', age: '' })
                        .end(function () {

                            instance.options.setValues
                                .should.not.have.been.called;

                            instance.options.errorHandler
                                .should.have.been.calledOnce;

                            instance.options.errorHandler
                                .should.have.been.calledWithExactly(
                                    sinon.match.instanceOf(FormError),
                                    sinon.match.instanceOf(IncomingMessage),
                                    sinon.match.instanceOf(ServerResponse),
                                    sinon.match.func
                                );

                            instance.options.successHandler
                                .should.not.have.been.called;

                            next();
                        });

                });


                it('calls errorHandler if setValues calls back with an error', function (next) {

                    this.spy(instance.options, 'successHandler');
                    this.stub(instance.options, 'errorHandler').callsArg(3);

                    instance.options.setValues.func = function (req, res, cb) {
                        try {
                            instance.options.errorHandler
                                .should.not.have.been.called;

                            cb(new Error('Failure'));
                        } catch (e) { cb(e); }
                    };

                    request(app).post('/form')
                        .send({ firstName: 'Foo', lastName: 'Bar', age: '' })
                        .end(function (err) {

                            instance.options.errorHandler
                                .should.have.been.calledOnce;

                            instance.options.errorHandler
                                .should.have.been.calledWithExactly(
                                    new Error('Failure'),
                                    sinon.match.instanceOf(IncomingMessage),
                                    sinon.match.instanceOf(ServerResponse),
                                    sinon.match.func
                                );

                            instance.options.successHandler
                                .should.not.have.been.called;

                            next(err);
                        });

                });

                it('responds with a 403 statusCode if the form is invalid', function (next) {

                    request(app)
                        .post('/form')
                        .send({ firstName: '', lastName: 'Bar', age: '' })
                        .end(function (err, res) {

                            res.statusCode
                                .should.equal(403);

                            next(err);
                        });

                });

                it('responds as JSON to an XHR request', function (next) {
                    request(app)
                        .post('/form')
                        .set('X-Requested-With', 'XMLHttpRequest')
                        .send({ firstName: 'Foo', lastName: 'Bar', age: '' })
                        .end(function (err, res) {

                            res.statusCode
                                .should.equal(200);

                            res.body
                                .should.deep.equal({
                                    values: {
                                        firstName: 'FooFoo',
                                        lastName: 'BarBar',
                                        age: '0'
                                    },
                                    errorMessage: null,
                                    success: true
                                });

                            next(err);
                        });

                });

                it('responds as JSON to an XHR request with errors if the form is invalid', function (next) {

                    request(app)
                        .post('/form')
                        .set('X-Requested-With', 'XMLHttpRequest')
                        .send({ firstName: '', lastName: 'Bar', age: '' })
                        .end(function (err, res) {

                            res.statusCode
                                .should.equal(403);

                            res.body
                                .should.deep.equal({
                                    values: {
                                        firstName: '',
                                        lastName: 'Bar',
                                        age: ''
                                    },
                                    errorMessage: {
                                        form: 'This form contains errors',
                                        fields: {
                                            firstName: 'This field is required'
                                        }
                                    }
                                });

                            next(err);
                        });

                });

                it('responds as JSON to an XHR request with HTML string errors if options.htmlErrors is true', function (next) {

                    instance.options.htmlErrors = true;

                    request(app)
                        .post('/form')
                        .set('X-Requested-With', 'XMLHttpRequest')
                        .send({ firstName: '', lastName: 'Bar', age: '' })
                        .end(function (err, res) {

                            res.statusCode
                                .should.equal(403);

                            res.body
                                .should.deep.equal({
                                    values: {
                                        firstName: '',
                                        lastName: 'Bar',
                                        age: ''
                                    },
                                    errorMessage: {
                                        form: '<div class=\"formError\"><p>This form contains errors</p></div>',
                                        fields: {
                                            firstName: '<label for=\"firstName\" class=\"fieldError\">This field is required</label>'
                                        }
                                    }
                                });

                            next(err);
                        });

                });

                it('responds as JSON to an XHR request with HTML string errors if request header \"x-errors-as-html\" is \"enabled\"', function (next) {

                    request(app)
                        .post('/form')
                        .set({'X-Requested-With': 'XMLHttpRequest', 'x-errors-as-html': 'enabled'})
                        .send({ firstName: '', lastName: 'Bar', age: '' })
                        .end(function (err, res) {

                            res.statusCode
                                .should.equal(403);

                            res.body
                                .should.deep.equal({
                                    values: {
                                        firstName: '',
                                        lastName: 'Bar',
                                        age: ''
                                    },
                                    errorMessage: {
                                        form: '<div class=\"formError\"><p>This form contains errors</p></div>',
                                        fields: {
                                            firstName: '<label for=\"firstName\" class=\"fieldError\">This field is required</label>'
                                        }
                                    }
                                });

                            next(err);
                        });

                });

                it('passes error to error handling middleware if an error exists', function (next) {

                    this.stub(instance, 'retrieve', function (req, res, callback) {
                        callback(req, res, {
                            error: 'An error'
                        });
                    });
                    app.get('/form', function (req, res, next) {
                        return instance.requestHandler(req, res, next);
                    });
                    app.use(function (err, req, res, next) {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            next();
                        }
                    });
                    request(app).post('/form').end(function (err, res) {

                        res.statusCode
                            .should.equal(500);

                        res.body
                            .should.deep.equal({ error: 'An error' });

                        next();
                    });

                });

            });

            describe('default postHandler with redirectUrl', function () {

                beforeEach(function () {
                    instance = new Form('aForm', {
                        firstName: new Fields.string({ required: true }),
                        lastName: new Fields.string({ required: true }),
                        age: new Fields.number()
                    }, {
                        redirectUrl: '/foo',
                        id: 'foo',
                        template: 'form.test.jade',
                        setValues: this.stub().callsArg(2),
                        getValues: function (req, res, callback) {
                            callback(null, { firstName: 'FooFoo', lastName: 'BarBar', age: '0' });
                        }
                    });

                    app.post('/form', instance.requestHandler);
                });

                it('Responds as JSON to an XHR request with the redirect url to follow', function (next) {
                    instance.options.redirectUrl = '/foo';

                    request(app)
                        .post('/form')
                        .set('X-Requested-With', 'XMLHttpRequest')
                        .send({ firstName: 'Foo', lastName: 'Bar', age: '' })
                        .end(function (err, res) {

                            res.statusCode
                                .should.equal(200);

                            res.body
                                .should.deep.equal({ redirect: '/foo' });

                            next();
                        });
                });

            });

        });

    });

    describe('newing up a form with options', function () {

        beforeEach(function () {
            instance = new Form('aForm', {
                firstName: new Fields.string({ required: true }),
                lastName: new Fields.string({ required: true }),
                age: new Fields.number()
            }, {
                id: 'foo',
                template: 'bar'
            });
            this.stub(instance, 'errorHtml').returns('');
        });

        it('options object can override builtin values', function () {

            instance.options.id
                .should.equal('foo');

            instance.options.template
                .should.equal('bar');

        });

        it('outputs form html including all fields html', function () {

            instance.html()
                .should.equal('<form method="post" action="" id="foo" role="form">' +
                    '<div class="field" data-type="text"><field:firstName value=""/></div>' +
                    '<div class="field" data-type="text"><field:lastName value=""/></div>' +
                    '<div class="field" data-type="number"><field:age value=""/></div>' +
                    '<ul class="buttonSet">' +
                    '<li><button type="submit">Submit</button></li>' +
                    '</ul>' +
                    '</form>');

        });

    });

}));
