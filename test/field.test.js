'use strict';

describe('Field:', sandbox(function () {

    var Form = require('../lib/form'),
        Field = Form.Field,
        instance;

    describe('fields', function () {

        it('has field children which are all extended from Field, and have types matching to their names', function () {

            Form.fields
                .should.have.keys(
                    'text', 'string', 'number', 'color', 'date', 'datetime', 'datetime-local',
                    'month', 'week', 'search', 'time', 'tel', 'url', 'email', 'hidden', 'password',
                    'file', 'checkbox', 'select'
                );

            for (var i in Form.fields) {
                (new Form.fields[i]())
                    .should.be.instanceof(Field);
                if (i !== 'select') {
                    Form.fields[i].prototype.inputType
                        .should.equal(i === 'string' ? 'text' : i);
                }
            }

        });

        describe('instance', function () {

            beforeEach(function () {
                instance = new Field();
            });

            it('has a tagName property', function () {

                instance.tagName
                    .should.be.a('string');

            });

            it('has an availableAttributes array, with available attributes for the field', function () {

                instance.availableAttributes
                    .should.deep.equal(['autofocus', 'disabled', 'form', 'formaction',
                        'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'value',
                        'required', 'selectiondirection', 'autocomplete', 'inputmode', 'list',
                        'minlength', 'maxlength', 'spellcheck', 'readonly', 'placeholder', 'pattern',
                        'step'
                    ]);

            });


            it('has an availableAttributes array, with available message states for the field', function () {

                instance.validStateMessages
                    .should.deep.equal([
                        'badInput', 'customError', 'patternMismatch', 'rangeOverflow',
                        'rangeUnderflow', 'stepMismatch', 'tooLong', 'typeMismatch',    'valueMissing'
                    ]);

            });

            it('composes the options given to it, into itself', function () {

                instance = new Field({ foo: true, bar: true });
                instance.foo
                    .should.equal(true);

                instance.bar
                    .should.equal(true);

            });

            it('options object can override builtin values', function () {

                instance = new Field({ availableAttributes: [], tagName: 'foo' });
                instance.tagName
                    .should.equal('foo');

                instance.availableAttributes
                    .should.deep.equal([]);

            });

            describe('.labelHtml()', function () {

                it('has a labelHtml function which will generate a label HTML tag with this.id and this.label', function () {

                    instance = new Field({ id: 'foo', label: 'bar' });
                    instance.labelHtml()
                        .should.equal('<label for="foo">bar<span class=\"optionalIndicator\">(optional)</span></label>');

                });

                it('overwrites this.label with label from options if defined', function () {

                    instance = new Field({ id: 'foo', label: 'bar' });
                    instance.labelHtml(null, { label: 'baz' })
                        .should.equal('<label for="foo">baz<span class=\"optionalIndicator\">(optional)</span></label>');

                });

                it('does not generate a label if label option is false', function () {

                    instance = new Field({ id: 'foo', label: false });

                    instance.labelHtml()
                        .should.equal('');

                });

                it('adds a required indicator if field is required', function () {

                    instance = new Field({ id: 'foo', label: 'baz', required: true });

                    instance.labelHtml()
                        .should.equal('<label for="foo">baz</label>');

                });

            });

            describe('.widgetHtml()', function () {

                it('will generate an HTML field with the `name` field as the instance.id', function () {

                    instance = new Field({ id: 'foo', tagName: 'input' });
                    instance.widgetHtml()
                        .should.equal('<input type="text" name="foo" id="foo"/>');

                });

                it('will render supplied attributes that are in the availableAttributes list', function () {

                    instance = new Field({ id: 'foo', type: 'text', tagName: 'input', autofocus: true,
                        disabled: true, form: 'a', formaction: '/', formenctype: 'utf-8',
                        formmethod: 'post', formnovalidate: true, formtarget: 'a', value: 'foo',
                        required: true, selectiondirection: 'rtl'
                    });
                    instance.widgetHtml()
                        .should.equal('<input type="text" autofocus="true" disabled="true" ' +
                            'form="a" formaction="/" formenctype="utf-8" formmethod="post" ' +
                            'formnovalidate="true" formtarget="a" value="foo" required="true" ' +
                            'selectiondirection="rtl" name="foo" id="foo" data-message-valueMissing="This field is required"/>');

                });


                it('ensures field ids only contain allows characters', function () {

                    instance = new Field({ id: '[fancy][id]' });
                    instance.widgetHtml()
                        .should.equal('<input type="text" name="[fancy][id]" id="_fancy_id_"/>');

                });

                it('will override value with the first argument', function () {

                    instance = new Field({ id: 'foo', type: 'text', tagName: 'input', value: 'a' });
                    instance.widgetHtml()
                        .should.equal('<input type="text" value="a" name="foo" id="foo"/>');

                    instance.widgetHtml('foo')
                        .should.equal('<input type="text" value="foo" name="foo" id="foo"/>');

                });

                it('will add data-message attribute if passed this.message', function () {

                    instance = new Field({ message: 'Foo' });

                    instance.widgetHtml()
                        .should.equal('<input type="text" data-message="Foo"/>');

                });

                it('will add data-message-* attributes based on the validStateMessages if this.messages is an object', function () {

                    instance = new Field({ message: {
                        'badInput': 'Some bad input',
                        'customError': 'Oops',
                        'patternMismatch': 'Not valid',
                        'rangeOverflow': 'Too big',
                        'rangeUnderflow': 'Too small',
                        'stepMismatch': 'Step wrong',
                        'tooLong': 'Too long',
                        'typeMismatch': 'Wrong type',
                        'valueMissing': 'Missing'
                    }});

                    instance.widgetHtml()
                        .should.equal('<input type="text" ' +
                            'data-message-badInput="Some bad input" ' +
                            'data-message-customError="Oops" ' +
                            'data-message-patternMismatch="Not valid" ' +
                            'data-message-rangeOverflow="Too big" ' +
                            'data-message-rangeUnderflow="Too small" ' +
                            'data-message-stepMismatch="Step wrong" ' +
                            'data-message-tooLong="Too long" ' +
                            'data-message-typeMismatch="Wrong type" ' +
                            'data-message-valueMissing="Missing"/>'
                        );

                });

                it('does not add data-message-* attributes if the key is not in validStateMessages', function () {

                    instance = new Field({ message: { foo: 'Foo', bar: 'Bar', baz: 'Baz' } });

                    instance.widgetHtml()
                        .should.equal('<input type="text"/>');

                });

                it('will add data-message-toolong attribute if maxlength is provided', function () {

                    instance = new Field({
                        maxlength: 5
                    });

                    instance.widgetHtml()
                        .should.equal('<input type="text" ' +
                            'maxlength="5" ' +
                            'data-message-tooLong="Please use 5 characters or less"/>'
                        );

                });

                it('will add data-message-valuemissing attribute if required is true', function () {

                    instance = new Field({
                        required: true
                    });

                    instance.widgetHtml()
                        .should.equal('<input type="text" ' +
                            'required="true" ' +
                            'data-message-valueMissing="This field is required"/>'
                        );

                });

                it('will add data-message-patternMismatch attribute if pattern is defined', function () {

                    instance = new Field({
                        pattern: /\d{4}/
                    });

                    instance.widgetHtml()
                        .should.equal('<input type="text" ' +
                            'pattern="\\d{4}" ' +
                            'data-message-patternMismatch="Please use the required format"/>'
                        );

                });

            });

            describe('.validate()', function () {

                beforeEach(function () {
                    instance = new Field({ value: 'x' });
                });

                it('will return null if the field is valid', function () {

                    should.equal(instance.validate(), null);

                });

                it('will return an error if the field is `required` and the value is missing', function () {

                    instance.required = true;
                    instance.value = '';

                    instance.validate()
                        .should.be.an.instanceof(Error);

                    instance.validate().message
                        .should.equal('This field is required');

                    instance.value = 'ab';
                    instance.validate('').message
                        .should.equal('This field is required');

                });

                it('will return a custom `valueMissing` error message if supplied (and the field is required and empty)', function () {

                    instance.required = true;
                    instance.value = '';
                    instance.message = { valueMissing: 'Foo Required Bar' };

                    instance.validate()
                        .should.be.an.instanceof(Error);

                    instance.validate().message
                        .should.equal('Foo Required Bar');

                    instance.value = 'ab';
                    instance.validate('').message
                        .should.equal('Foo Required Bar');

                });

                it('will return an error if the field has `minlength` and the value is shorter than that', function () {

                    instance.minlength = 3;
                    instance.value = 'ab';

                    instance.validate()
                        .should.be.an.instanceof(Error);

                    instance.validate().message
                        .should.equal('Please use 3 characters or more');

                    instance.value = 'abc';
                    instance.validate('ab').message
                        .should.equal('Please use 3 characters or more');

                });

                it('will return a custom `tooShort` error message if supplied (and the field is shorter than minlength)', function () {

                    instance.minlength = 3;
                    instance.value = 'ab';
                    instance.message = { tooShort: 'Foo Too Short Bar' };

                    instance.validate()
                        .should.be.an.instanceof(Error);

                    instance.validate().message
                        .should.equal('Foo Too Short Bar');

                    instance.value = 'abc';
                    instance.validate('ab').message
                        .should.equal('Foo Too Short Bar');

                });

                it('will return an error if the field has `maxlength` and the value is longer than that', function () {

                    instance.maxlength = 3;
                    instance.value = 'abcd';

                    instance.validate()
                        .should.be.an.instanceof(Error);

                    instance.validate().message
                        .should.equal('Please use 3 characters or less');

                    instance.value = 'ab';
                    instance.validate('abcd').message
                        .should.equal('Please use 3 characters or less');

                });

                it('will return a custom `tooLong` error message if supplied (and the field is longer than maxlength)', function () {

                    instance.maxlength = 3;
                    instance.value = 'abcd';
                    instance.message = { tooLong: 'Foo Too Long Bar' };

                    instance.validate()
                        .should.be.an.instanceof(Error);

                    instance.validate().message
                        .should.equal('Foo Too Long Bar');

                    instance.value = 'ab';
                    instance.validate('abcd').message
                        .should.equal('Foo Too Long Bar');

                });

                it('will return an error if the field has `pattern` and the value doesnt match it', function () {

                    instance.pattern = '^a$';
                    instance.value = 'b';

                    instance.validate()
                        .should.be.an.instanceof(Error);

                    instance.validate().message
                        .should.equal('Please use the required format');

                    this.value = 'a';
                    instance.validate('b').message
                        .should.equal('Please use the required format');

                });

                it('will return a custom `tooLong` error message if supplied (and the field is longer than maxlength)', function () {

                    instance.pattern = '^a$';
                    instance.value = 'b';
                    instance.message = { patternMismatch: 'Invalid pattern' };

                    instance.validate()
                        .should.be.an.instanceof(Error);

                    instance.validate().message
                        .should.equal('Invalid pattern');

                    this.value = 'a';
                    instance.validate('b').message
                        .should.equal('Invalid pattern');

                });

            });

            describe('.getMessage()', function () {

                it('returns this.message if it is a string', function () {

                    instance.message = 'message string';

                    instance.getMessage().should.equal('message string');

                });

                it('returns this.message[type] if it is a string', function () {

                    instance.message = {
                        msgType: 'message object'
                    };

                    instance.getMessage('msgType').should.equal('message object');

                });

                it('returns result of this.message(type) if it is a function', function () {

                    instance.message = function () {
                        return 'message function';
                    };

                    this.spy(instance, 'message');

                    instance.getMessage('msgType').should.equal('message function');
                    instance.message.should.have.been.calledWith('msgType');

                });

            });

            describe('.errorHtml()', function () {

                it('will return an empty string when there are no validation errors', function () {

                    instance.errorHtml()
                        .should.equal('');

                });

                it('will return the error message inside of a tag if the field is invalid', function () {

                    instance.required = true;
                    instance.value = '';

                    instance.errorHtml()
                        .should.equal('<div class="fieldError">This field is required</div>');

                });

                it('will validate against the first argument if supplied', function () {

                    instance.pattern = /^a$/;
                    instance.value = 'a';

                    instance.errorHtml('b')
                        .should.equal('<div class="fieldError">Please use the required format</div>');

                    delete instance.pattern;
                    instance.required = true;
                    instance.value = 'a';

                    instance.errorHtml('')
                        .should.equal('<div class="fieldError">This field is required</div>');

                });

                it('will return an empty string if given the "renderErrors === false" option', function () {

                    instance.required = true;

                    instance.errorHtml('', { renderErrors: false })
                        .should.equal('');

                });

            });

            describe('.html()', function () {

                it('returns the concatinated output of labelHtml + widgetHtml + errorHtml', function () {

                    instance.html()
                        .should.equal(instance.labelHtml() + instance.widgetHtml() + instance.errorHtml());

                });

                it('calls each method with the arguments given to it', function () {

                    this.spy(instance, 'labelHtml');
                    this.spy(instance, 'widgetHtml');
                    this.spy(instance, 'errorHtml');

                    var value = {}, options = {};

                    instance.html(value, options);

                    instance.labelHtml
                        .should.always.have.been.calledWithExactly(value, options);

                    instance.widgetHtml
                        .should.always.have.been.calledWithExactly(value, options);

                    instance.errorHtml
                        .should.always.have.been.calledWithExactly(value, options);

                });

            });

            describe('.parseBody()', function () {

                it('returns field value from request body', function () {

                    instance = new Field({ id: 'field' });

                    instance.parseBody({
                        body: {
                            field: 'foo',
                            otherfield: 'bar'
                        }
                    }).should.equal('foo');

                });

            });

        });

        describe('.email', function () {

            beforeEach(function () {
                instance = new Form.fields.email();
            });

            it('will validate against the W3C email RegExp, returning a typeMismatch error if validation fails', function () {

                instance.value = 'b';

                instance.validate()
                    .should.be.an.instanceof(Error);

                instance.validate().message
                    .should.equal('Please enter a valid email');

            });

            it('will return a custom `typeMismatch` error message if supplied (and the value is not an email)', function () {

                instance.value = 'b';
                instance.message = { typeMismatch: 'Invalid email Foo' };

                instance.validate()
                    .should.be.an.instanceof(Error);

                instance.validate().message
                    .should.equal('Invalid email Foo');

            });

            it('will also validate against maxlength, required and pattern', function () {

                instance.maxlength = 10;
                instance.required = true;
                instance.pattern = /^a@a.a$/;
                instance.value = '';
                instance.message = {
                    valueMissing: 'valueMissing',
                    tooLong: 'tooLong',
                    patternMismatch: 'patternMismatch',
                    typeMismatch: 'typeMismatch'
                };

                instance.validate('')
                    .should.be.an.instanceof(Error);

                instance.validate('').message
                    .should.equal('valueMissing');

                instance.validate('aaaaaaaaaaa')
                    .should.be.an.instanceof(Error);

                instance.validate('aaaaaaaaaaa').message
                    .should.equal('tooLong');

                instance.validate('ab@ab.ab')
                    .should.be.an.instanceof(Error);

                instance.validate('ab@ab.ab').message
                    .should.equal('patternMismatch');

                should.equal(instance.validate('a@a.a'), null);

            });

        });

        describe('.file', function () {

            beforeEach(function () {
                instance = new Form.fields.file();
            });

            it('has its own set of availableAttributes', function () {

                instance.availableAttributes
                    .should.deep.equal(['type', 'autofocus', 'disabled', 'form', 'formaction',
                        'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'value',
                        'required', 'selectiondirection', 'accept', 'multiple', 'placeholder']);

            });

        });

        describe('.select', function () {

            beforeEach(function () {
                instance = new Form.fields.select({ id: 'select', label: 'label', choices: ['Mr', { 'Mrs': 'Mrs' }, 'Miss'], required: true });
            });

            describe('.widgetHtml()', function () {

                it('adds choices to option elements', function () {

                    instance.widgetHtml()
                        .should.equal('<select required="true" name="select" id="select" data-message-valueMissing="This field is required"><option value="Mr">Mr</option><option value="Mrs">Mrs</option><option value="Miss">Miss</option></select>');

                });

            });

            describe('.validate()', function () {

                it('will validate against missing values', function () {

                    instance.message = {
                        valueMissing: 'valueMissing'
                    };

                    instance.validate('')
                        .should.be.an.instanceof(Error);

                    instance.validate('').message
                        .should.equal('valueMissing');

                });

            });
        });

        describe('.checkbox', function () {

            beforeEach(function () {
                instance = new Form.fields.checkbox({ id: 'checkbox', label: 'label' });
            });

            describe('.html()', function () {

                it('renders input first', function () {

                    this.stub(instance, 'widgetHtml', function () { return 'widgetHtml'; });
                    this.stub(instance, 'labelHtml', function () { return 'labelHtml'; });

                    instance.html()
                        .should.equal('widgetHtmllabelHtml');

                });

            });

            describe('.widgetHtml()', function () {

                it('adds checked attribute if value passed matches values attribute', function () {

                    instance.widgetHtml(true)
                        .should.equal('<input type="checkbox" value="true" name="checkbox" id="checkbox" checked="true"/>');

                });

            });

            describe('.parseBody()', function () {

                it('compares POSTed string value to "true" if field.value is boolean', function () {

                    instance.parseBody({ body: { checkbox: 'true' } })
                        .should.equal(true);

                    should.not.exist(instance.parseBody({ body: { checkbox: 'aString' } }));

                });

                it('accepts POSTed true(bool) if field.value is boolean', function () {

                    instance.parseBody({ body: { checkbox: true } })
                        .should.equal(true);

                    should.not.exist(instance.parseBody({ body: { checkbox: null } }));

                });

                it('returns POSTed string value if field.value is not boolean', function () {

                    instance = new Form.fields.checkbox({ id: 'checkbox', label: 'label', value: 'aString' });

                    should.not.exist(instance.parseBody({ body: { checkbox: 'true' } }));

                    instance.parseBody({ body: { checkbox: 'aString' } })
                        .should.equal('aString');

                });

            });

        });

    });

}));
