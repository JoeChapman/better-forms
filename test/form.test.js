'use strict';

describe('Form:', sandbox(function () {

    var ServerResponse = require('http').ServerResponse,
        IncomingMessage = require('http').IncomingMessage,
        express = require('express'),
        request = require('supertest'),
        Form = require('../lib/form'),
        Field = Form.Field,
        instance;


    describe('.createFields()', function () {

        var fields = null, form;

        describe('with fields', function () {

            beforeEach(function () {

                form = {};

                fields = Form.prototype.createFields.call(form, {
                    firstName: new Form.fields.string(),
                    lastName: new Form.fields.string(),
                    age: new Form.fields.number({label: 'Test'})
                });

            });

            it('returns a list of new field instances', function () {

                fields[0].should.be.instanceof.Field;
                fields[1].should.be.instanceof.Field;
                fields[2].should.be.instanceof.Field;

            });

            it('ensures each field has a label generated from name if not provided', function () {

                fields[0]
                    .label.should.equal('First name');

                fields[1]
                    .label.should.equal('Last name');

                fields[2]
                    .label.should.equal('Test');

            });

        });

        describe('with fieldsets', function () {

            var form;

            beforeEach(function () {

                form = {};

                Form.prototype.createFields.call(form, [
                    {
                        legend: 'Names',
                        fields: {
                            firstName: new Form.fields.string(),
                            lastName: new Form.fields.string()
                        }
                    }, {
                        fields: {
                            age: new Form.fields.number()
                        }
                    }
                ]);

            });

            it('creates a list of fieldsets', function () {

                form.fieldsets.should.be.an('array');

            });

            it('gives each fieldset a legend (empty string if not provided)', function () {

                form.fieldsets[0].legend.should.equal('Names');

                form.fieldsets[1].legend.should.equal('');

            });

            it('populates each fieldset with fields if provided', function () {

                form.fieldsets[0].fields.should.eql([
                    new Form.fields.string({id: 'firstName', label: 'First name'}),
                    new Form.fields.string({id: 'lastName', label: 'Last name'})
                ]);

                form.fieldsets[1].fields.should.eql([
                    new Form.fields.number({id: 'age', label: 'Age'})
                ]);

            });

        });

    });

    describe('newing up a form', function () {

        var fields;

        beforeEach(function () {

            fields = {
                firstName: new Form.fields.string(),
                lastName: new Form.fields.string(),
                age: new Form.fields.number()
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
                .should.be.a('array');

            instance.fields[0]
                .should.be.an.instanceof(Form.fields.string);

            instance.fields[1]
                .should.be.an.instanceof(Form.fields.string);

            instance.fields[2]
                .should.be.an.instanceof(Form.fields.number);

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
                    firstName: new Form.fields.string(),
                    lastName: new Form.fields.string(),
                    age: new Form.fields.number()
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
                    firstName: new Form.fields.string(),
                    lastName: new Form.fields.string(),
                    age: new Form.fields.number()
                }, {
                    buttonSetTagName: 'div',
                    buttonSetAttrs: { role: 'menu' }
                });


                instance.buttonsHtml()
                    .should.equal('<div role="menu"><button type="submit">Submit</button></div>');

            });

            it('can include extra HTML with the additionalButtonSetHtml option', function () {

                instance = new Form('aForm', {
                    firstName: new Form.fields.string(),
                    lastName: new Form.fields.string(),
                    age: new Form.fields.number()
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

                instance.fields[0].required = true;

                instance.errorHtml()
                    .should.equal('<div class="formError"><p>This form contains errors</p></div>');

            });

            it('generates HTML for error message if errors are present, with a customised message if provided', function () {

                instance.fields[0].required = true;
                instance.fields[0].value = '';
                instance.options.errorMessage = 'LOSE';

                instance.errorHtml()
                    .should.equal('<div class="formError"><p>LOSE</p></div>');

            });

            it('will always return a custom error message wrapped in a div.formError tag, if options.errorMessage is supplied', function () {

                instance.fields[0].required = true;
                instance.fields[0].value = '';

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

        describe('.fieldHtml()', function () {

            it('renders wrapped HTML of a given field (1st argument)', function () {

                this.stub(instance.fields[0], 'html').returns('<foo:field:foo>');

                instance.fieldHtml(instance.fields[0])
                    .should.equal('<div class="field" data-type="text"><foo:field:foo></div>');

            });

            it('passes the 2nd argument as the field value', function () {

                this.stub(instance.fields[0], 'html').returns('<foo:field:foo>');

                instance.fieldHtml(instance.fields[0], 'a')
                    .should.equal('<div class="field" data-type="text"><foo:field:foo></div>');

                instance.fields[0].html
                    .should.have.been.calledWith('a');

            });

            it('can be customised with fieldWrapperTagName and field.classes options', function () {

                instance = new Form('aForm', {
                    firstName: new Form.fields.string({ classes: ['foo', 'bar', 'baz'] }),
                    lastName: new Form.fields.string(),
                    age: new Form.fields.number()
                }, {
                    fieldWrapperTagName: 'field',
                });

                this.stub(instance.fields[0], 'html').returns('<foo:field:foo>');

                instance.fieldHtml(instance.fields[0], 'a')
                    .should.equal('<field class="field foo bar baz" data-type="text"><foo:field:foo></field>');

                instance.fields[0].html
                    .should.have.been.calledWith('a');

            });

            it('can include data attributes from the fields dataAttributes object', function () {

                this.stub(instance.fields[0], 'html').returns('<foo:field:foo>');

                instance.fields[0].dataAttributes = {
                    foo: 'bar',
                    baz: 'bang'
                };

                instance.fieldHtml(instance.fields[0])
                    .should.equal('<div class="field" data-type="text" data-foo="bar" data-baz="bang"><foo:field:foo></div>');

            });

        });

        describe('.html()', function () {

            beforeEach(function () {
                instance = new Form('aForm', {
                    firstName: new Form.fields.string({ required: true }),
                    lastName: new Form.fields.string({ required: true }),
                    age: new Form.fields.number()
                });
                this.stub(instance, 'errorHtml').returns('<errorHtml>');
                this.stub(instance, 'buttonsHtml').returns('<buttonsHtml>');
                this.stub(Form.Field.prototype, 'html', function (value) {
                    return '<field:' + this.id + ' value="' + (value || '') + '"/>';
                });
            });

            it('outputs form html including all fields html', function () {

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

                instance.html()
                    .should.equal('<form method="GET" action="/?foo=bar" class="class1 class2" id="id">' +
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
                    .should.have.been.calledWithExactly(instance.fields[0], values.firstName, options);

                instance.fieldHtml
                    .should.have.been.calledWithExactly(instance.fields[1], values.lastName, options);

                instance.fieldHtml
                    .should.have.been.calledWithExactly(instance.fields[2], values.age, options);

                Field.prototype.html
                    .should.have.been.calledWithExactly(values.firstName, options);

                Field.prototype.html
                    .should.have.been.calledWithExactly(values.lastName, options);

            });

            it('renders fieldsets if defined', function () {

                instance.options.fieldsets = [
                    { fields: ['firstName'] },
                    { fields: ['lastName'] }
                ];

                instance.html()
                    .should.equal('<form method="post" action="" id="aForm" role="form">' +
                        '<errorHtml>' +
                        '<fieldset>' +
                        '<div class="field" data-type="text"><field:firstName value=""/></div>' +
                        '</fieldset>' +
                        '<fieldset>' +
                        '<div class="field" data-type="text"><field:lastName value=""/></div>' +
                        '</fieldset>' +
                        '<buttonsHtml>' +
                        '</form>');

            });

        });

        describe('.validate()', function () {

            beforeEach(function () {
                instance = new Form('aForm', {
                    firstName: new Form.fields.string({ required: true }),
                    lastName: new Form.fields.string({ required: true }),
                    age: new Form.fields.number()
                });
            });

            it('will validate all form fields, returning null if all are valid', function () {

                instance.fields[0].value = 'Foo';
                instance.fields[1].value = 'Bar';
                instance.fields[2].value = '22';

                instance.should.equal(instance.validate(), null);

            });

            it('returns an error object if validation errors are found in the fields', function () {

                instance.fields[0].value = 'Foo';
                instance.fields[1].value = '';
                instance.fields[2].value = '22';

                instance.validate()
                    .should.be.an.instanceof(Error);

                instance.validate().message
                    .should.equal('This form contains errors');

            });

            it('returns field errors, attached to the error object if validation errors occur', function () {

                instance.fields[0].value = '';
                instance.fields[1].value = '';
                instance.fields[2].value = 22;

                instance.validate()
                    .should.be.an.instanceof(Error);

                instance.validate().fields
                    .should.be.an('object');

                instance.validate().fields.firstName
                    .should.be.an.instanceof(Error);

                instance.validate().fields.firstName.message
                    .should.equal(instance.fields[0].validate().message);

                instance.validate().fields.lastName
                    .should.be.an.instanceof(Error);

                instance.validate().fields.lastName.message
                    .should.equal(instance.fields[1].validate().message);

            });

            it('returns a custom error message specified by options.errorMessage', function () {

                instance.fields[0].value = 'Foo';
                instance.fields[1].value = '';
                instance.fields[2].value = '22';
                instance.options.errorMessage = 'Oops';

                instance.validate()
                    .should.be.an.instanceof(Error);

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
                    .should.be.an.instanceof(Error);

                instance.validate(values).fields.firstName
                    .should.be.an.instanceof(Error);

            });

        });

        describe('request helper methods', function () {

            var app, simpleRequest;

            beforeEach(function () {
                instance = new Form('aForm', {
                    firstName: new Form.fields.string({ label: 'Foo', required: true }),
                    lastName: new Form.fields.string({ label: 'Bar', required: true }),
                    age: new Form.fields.number({ label: 'Baz' })
                }, {
                    template: 'form.test.jade'
                });
                app = express();

                app.set('views', __dirname + '/dummyViews/');
                app.set('view engine', 'jade');
                app.use(require('body-parser')());
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
                        });
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

                describe('FormHandler object', function () {

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

                            simpleRequest(function (req, res, callback) {
                                instance.setupFormHandler(req, res, function () {

                                    req.forms.aForm.fields.length
                                        .should.equal(instance.fields.length);

                                    req.forms.aForm.fields[0].field
                                        .should.equal(instance.fields[0]);

                                    req.forms.aForm.fields[0].value
                                        .should.equal(values.firstName);

                                    req.forms.aForm.fields[1].field
                                        .should.equal(instance.fields[1]);

                                    req.forms.aForm.fields[1].value
                                        .should.equal(values.lastName);

                                    req.forms.aForm.fields[2].field
                                        .should.equal(instance.fields[2]);

                                    callback();
                                }, null, values);
                            }, next);

                        });

                        it('fields are also accessible via their ids', function (next) {

                            simpleRequest(function (req, res, callback) {
                                instance.setupFormHandler(req, res, function () {

                                    req.forms.aForm.fields[0]
                                        .should.equal(req.forms.aForm.fields.firstName);

                                    req.forms.aForm.fields[1]
                                        .should.equal(req.forms.aForm.fields.lastName);

                                    req.forms.aForm.fields[2]
                                        .should.equal(req.forms.aForm.fields.age);

                                    callback();
                                }, null, values);
                            }, next);

                        });

                        it('field id accessors are not enumerable', function (next) {

                            simpleRequest(function (req, res, callback) {
                                instance.setupFormHandler(req, res, function () {

                                    Object.keys(req.forms.aForm.fields)
                                        .should.deep.equal(['0', '1', '2']);

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
                                        firstName: new Form.fields.string({ label: 'Foo', required: true }),
                                        lastName: new Form.fields.string({ label: 'Bar', required: true }),
                                    }
                                },
                                {
                                    id: 'bar',
                                    legend: 'Bar',
                                    fields: {
                                        age: new Form.fields.number({ label: 'Baz' })
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

                                    req.forms.aForm.fieldsets[0].fields[0]
                                        .should.equal(req.forms.aForm.fields.firstName);

                                    req.forms.aForm.fieldsets[0].fields[1]
                                        .should.equal(req.forms.aForm.fields.lastName);

                                    req.forms.aForm.fieldsets[1].fields[0]
                                        .should.equal(req.forms.aForm.fields.age);

                                    callback();
                                }, null, values);
                            }, next);

                        });

                    });

                    describe('FieldHandler object', function () {

                        it('has valid and validationErrors properties on it, which call validate(values)', function (next) {

                            this.spy(Form.Field.prototype, 'validate');
                            values.firstName = '';

                            simpleRequest(function (req, res, callback) {
                                instance.setupFormHandler(req, res, function () {

                                    var fieldInstance = instance.fields[0],
                                        fieldHandler = req.forms.aForm.fields[0];

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

                                    var fieldInstance = instance.fields[0],
                                        fieldHandler = req.forms.aForm.fields[0];

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

                            this.spy(Form.Field.prototype, 'html');
                            this.spy(Form.Field.prototype, 'widgetHtml');
                            this.spy(Form.Field.prototype, 'labelHtml');
                            this.spy(Form.Field.prototype, 'errorHtml');
                            values.firstName = '';

                            simpleRequest(function (req, res, callback) {
                                instance.setupFormHandler(req, res, function () {

                                    var fieldInstance = instance.fields[0],
                                        fieldHandler = req.forms.aForm.fields[0];

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
                    });

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
                        percent: new (Form.fields.string.extend({
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

                        res.send(200);
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

                        res.send(200);
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
                            res.send(500, err);
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
                        firstName: new Form.fields.string({ required: true }),
                        lastName: new Form.fields.string({ required: true }),
                        age: new Form.fields.number()
                    }, {
                        id: 'foo',
                        template: 'bar',
                        setValues: this.stub().callsArg(2),
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

                    request(app).post('/form')
                        .send({ firstName: 'Foo', lastName: '', age: '' })
                        .end(function () {

                            instance.options.setValues
                                .should.not.have.been.called;

                            instance.options.errorHandler
                                .should.have.been.calledOnce;

                            instance.options.errorHandler
                                .should.have.been.calledWithExactly(
                                    sinon.match.instanceOf(Form.Error),
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
                        .end(function () {

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

                            next();
                        });

                });

                it('302 redirects back to a GET of the same page (see the PostRedirectGet pattern)', function (next) {

                    request(app)
                        .post('/form')
                        .end(function (err, res) {

                            res.statusCode
                                .should.equal(302);

                            res.headers.location
                                .should.equal('/form');


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
                            res.send(500, err);
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

        });

    });

    describe('newing up a form with options', function () {

        beforeEach(function () {
            instance = new Form('aForm', {
                firstName: new Form.fields.string({ required: true }),
                lastName: new Form.fields.string({ required: true }),
                age: new Form.fields.number()
            }, {
                id: 'foo',
                template: 'bar'
            });
            this.stub(instance, 'errorHtml').returns('');
            this.stub(Form.Field.prototype, 'html', function (value) {
                return '<field:' + this.id + ' value="' + (value || '') + '"/>';
            });
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
