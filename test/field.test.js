'use strict';

describe('Field:', sandbox(function () {

    var Field = require('../lib/field'),
        FormError = require('../lib/error'),
        instance;

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
                    'step', 'match', 'validateif', 'name',
                ]);

        });


        it('has an availableAttributes array, with available message states for the field', function () {

            instance.validStateMessages
                .should.deep.equal([
                    'badInput', 'customError', 'patternMismatch', 'rangeOverflow',
                    'rangeUnderflow', 'stepMismatch', 'tooLong', 'typeMismatch',
                    'valueMissing', 'noMatch', 'tooShort'
                ]);

        });

        it('has a mismatchableTypes array, with all types required for validation against typeMismatch', function () {

            instance.mismatchableTypes
                .should.deep.equal([
                    'email', 'url', 'tel'
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
                    .should.equal('<label for="foo">bar</label>');

            });

            it('overwrites this.label with label from options if defined', function () {

                instance = new Field({ id: 'foo', label: 'bar' });
                instance.labelHtml(null, { label: 'baz' })
                    .should.equal('<label for="foo">baz</label>');

            });

            it('does not generate a label if label option is false', function () {

                instance = new Field({ id: 'foo', label: false });

                instance.labelHtml()
                    .should.equal('');

            });

            it('adds an optionalIndicator if field is optional', function () {

                instance = new Field({ id: 'foo', label: 'baz', optional: true });

                instance.labelHtml()
                    .should.equal('<label for="foo">baz<span class="optionalIndicator">(optional)</span></label>');

            });

            it('adds an optionalIndicator message to the optional field if optional is a string', function () {

                instance = new Field({ id: 'foo', label: 'baz', optional: 'This field is not required' });

                instance.labelHtml()
                    .should.equal('<label for="foo">baz<span class="optionalIndicator">This field is not required</span></label>');

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


            it('ensures field ids only contain allowed characters', function () {

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

            describe('when renderErrors is not false', function () {

                it('will add data-message attribute if passed this.message', function () {

                    instance = new Field({ message: 'Foo' });

                    instance.widgetHtml(undefined, { renderErrors: true })
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
                        'valueMissing': 'Missing',
                        'noMatch': 'Not matching'
                    }});

                    instance.widgetHtml(undefined, { renderErrors: true })
                        .should.equal('<input type="text" ' +
                            'data-message-badInput="Some bad input" ' +
                            'data-message-customError="Oops" ' +
                            'data-message-patternMismatch="Not valid" ' +
                            'data-message-rangeOverflow="Too big" ' +
                            'data-message-rangeUnderflow="Too small" ' +
                            'data-message-stepMismatch="Step wrong" ' +
                            'data-message-tooLong="Too long" ' +
                            'data-message-typeMismatch="Wrong type" ' +
                            'data-message-valueMissing="Missing" ' +
                            'data-message-noMatch="Not matching"/>'
                        );

                });

                it('does not add data-message-* attributes if the key is not in validStateMessages', function () {

                    instance = new Field({ message: { foo: 'Foo', bar: 'Bar', baz: 'Baz' } });

                    instance.widgetHtml(undefined, { renderErrors: true })
                        .should.equal('<input type="text"/>');

                });

                it('will add data-message-toolong attribute if maxlength is provided', function () {

                    instance = new Field({
                        maxlength: 5
                    });

                    instance.widgetHtml(undefined, { renderErrors: true })
                        .should.equal('<input type="text" ' +
                            'maxlength="5" ' +
                            'data-message-tooLong="Please use 5 characters or less"/>'
                        );

                });

                it('will add data-message-valuemissing attribute if required is true', function () {

                    instance = new Field({
                        required: true
                    });

                    instance.widgetHtml(undefined, { renderErrors: true })
                        .should.equal('<input type="text" ' +
                            'required="true" ' +
                            'data-message-valueMissing="This field is required"/>'
                        );

                });

                it('will add data-message-patternMismatch attribute if pattern is defined', function () {

                    instance = new Field({
                        pattern: /\d{4}/
                    });

                    instance.widgetHtml(undefined, { renderErrors: true })
                        .should.equal('<input type="text" ' +
                            'pattern="\\d{4}" ' +
                            'data-message-patternMismatch="Please use the required format"/>'
                        );
                });

                it('will add data-message-noMatch attribute if match is defined', function () {

                    instance = new Field({
                        match: 'password',
                        id: 'confirm'
                    });

                    instance.widgetHtml(undefined, { renderErrors: true })
                        .should.equal('<input type="text" ' +
                            'match="password" ' +
                            'name="confirm" ' +
                            'id="confirm" ' +
                            'data-message-noMatch="' + instance.id + ' must match ' + instance.match + '"/>'
                        );
                });
            });

        });

        describe('.escapeValue()', function () {

            it('escapes double quotes', function () {
                instance.escapeValue('asd"asd"asd')
                    .should.equal('asd&quot;asd&quot;asd');
            });

            it('escapes single quotes', function () {
                instance.escapeValue("asd'asd'asd")
                    .should.equal('asd&apos;asd&apos;asd');
            });

        });

        describe('.getError()', function () {

            beforeEach(function () {
                instance = new Field({ value: 'x' });
            });

            it('will return null if the field is valid', function () {

                should.equal(instance.validate(), null);

            });

            it('will return valueMissing if the field has no value', function () {

                instance.required = true;

                instance.getError('', {}, {})
                    .should.equal('valueMissing');

            });

            it('will return tooShort if the field value is shorter than minlength', function () {

                instance.minlength = 6;

                instance.getError('12345', {}, {})
                    .should.equal('tooShort');

            });

            it('will return tooLong if the field value is longer than maxlength', function () {

                instance.maxlength = 6;

                instance.getError('1234567', {}, {})
                    .should.equal('tooLong');

            });

            it('will return patternMismatch if the field value does not pass the pattern test', function () {

                instance.pattern = /^[^0-9()]+$/;

                instance.getError('1234567', {}, {})
                    .should.equal('patternMismatch');

            });

            it('will return noMatch if the field value is not the same as the match field value', function () {

                var other = new Field({ value: 'x' });
                other.value = 'foo';

                instance.match = 'other';

                instance.getError('bar', {}, { other: other })
                    .should.equal('noMatch');

            });

        });

        describe('.validate()', function () {

            beforeEach(function () {
                instance = new Field({ value: 'x' });
            });

            it('will return null if the field is valid', function () {

                should.equal(instance.validate(), null);

            });

            it('will return null if the field has validateif option referring to a field that has no value', function () {

                instance = new Field({ value: 'x', validateif: 'password' });
                var password = new Field({ id: 'password', value: '' });

                instance.required = true;

                should.equal(instance.validate('', {}, { password: password }), null);

            });

            it('will return an error if the field is `required` and the value is missing', function () {

                instance.required = true;
                instance.value = '';

                instance.validate()
                    .should.be.an.instanceof(FormError);

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
                    .should.be.an.instanceof(FormError);

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
                    .should.be.an.instanceof(FormError);

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
                    .should.be.an.instanceof(FormError);

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
                    .should.be.an.instanceof(FormError);

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
                    .should.be.an.instanceof(FormError);

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
                    .should.be.an.instanceof(FormError);

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
                    .should.be.an.instanceof(FormError);

                instance.validate().message
                    .should.equal('Invalid pattern');

                this.value = 'a';
                instance.validate('b').message
                    .should.equal('Invalid pattern');

            });

        });

        describe('.validationReady()', function () {

            it('returns true if no validateif values', function () {
                var fields = {
                    password: new Field({ id: 'password', value: '' })
                };

                instance = new Field({ value: 'x' });

                instance.validationReady(fields)
                    .should.equal(true);
            });

            it('returns true if validateif value is truthy', function () {
                var fields = {
                    password: new Field({ id: 'password', value: 'secret' })
                };

                instance = new Field({ value: 'x', validateif: 'password' });

                instance.validationReady(fields)
                    .should.equal(true);
            });

            it('returns false if validateif value is falsey', function () {
                var fields = {
                    password: new Field({ id: 'password', value: '' })
                };

                instance = new Field({ value: 'x', validateif: 'password' });

                should.equal(instance.validationReady(fields), false);

            });

            it('returns false if validateif id starts with ! and value is falsey', function () {
                var fields = {
                    password: new Field({ id: 'password', value: 'secret' })
                };

                instance = new Field({ value: 'x', validateif: '!password' });

                should.equal(instance.validationReady(fields), false);
            });

            it('returns true if validateif id starts with ! and value is truthy', function () {
                var fields = {
                    password: new Field({ id: 'password', value: '' })
                };

                instance = new Field({ value: 'x', validateif: '!password' });

                instance.validationReady(fields)
                    .should.equal(true);

            });

            it('returns true if either validateif value is truthy', function () {
                var fields = {
                    password: new Field({ id: 'password', value: '' }),
                    lname: new Field({ id: 'lname', value: 'Foo' })
                };

                instance = new Field({ value: 'x', validateif: 'password, lname' });

                instance.validationReady(fields)
                    .should.equal(true);

            });

            it('returns true if both validateif values are truthy', function () {
                var fields = {
                    password: new Field({ id: 'password', value: 'secret' }),
                    lname: new Field({ id: 'lname', value: 'Foo' })
                };

                instance = new Field({ value: 'x', validateif: 'password, lname' });

                instance.validationReady(fields)
                    .should.equal(true);

            });

            it('returns false if both validateif values are falsey', function () {
                var fields = {
                    password: new Field({ id: 'password', value: '' }),
                    lname: new Field({ id: 'lname', value: '' })
                };

                instance = new Field({ value: 'x', validateif: 'password, lname' });

                should.equal(instance.validationReady(fields), false);

            });

            it('returns false if either validateif value is falsey when "&" in values', function () {
                var fields = {
                    password: new Field({ id: 'password', value: '' }),
                    lname: new Field({ id: 'lname', value: 'Foo' })
                };

                instance = new Field({ value: 'x', validateif: 'password, lname, &' });

                should.equal(instance.validationReady(fields), false);

            });

            it('returns true if both validateif values are truthy when "&" in values', function () {
                var fields = {
                    password: new Field({ id: 'password', value: 'secret' }),
                    lname: new Field({ id: 'lname', value: 'Foo' })
                };

                instance = new Field({ value: 'x', validateif: 'password, lname, &' });

                instance.validationReady(fields)
                    .should.equal(true);

            });

        });

        describe('.getMessage()', function () {

            it('returns this.message if it is a string', function () {

                instance.message = 'message string';

                instance.getMessage()
                    .should.equal('message string');

            });

            it('returns this.message[type] if it is a string', function () {

                instance.message = {
                    msgType: 'message object'
                };

                instance.getMessage('msgType')
                    .should.equal('message object');

            });

            it('returns result of this.message(type) if it is a function', function () {

                instance.message = function () {
                    return 'message function';
                };

                this.spy(instance, 'message');

                instance.getMessage('msgType')
                    .should.equal('message function');

                instance.message
                    .should.have.been.calledWith('msgType');

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
                    .should.equal('<label class="fieldError">This field is required</label>');

            });

            it('will validate against the first argument if supplied', function () {

                instance.pattern = /^a$/;
                instance.value = 'a';

                instance.errorHtml('b')
                    .should.equal('<label class="fieldError">Please use the required format</label>');

                delete instance.pattern;
                instance.required = true;
                instance.value = 'a';

                instance.errorHtml('')
                    .should.equal('<label class="fieldError">This field is required</label>');

            });

            it('will return an empty string if given the "renderErrors === false" option', function () {

                instance.required = true;

                instance.errorHtml('', { renderErrors: false })
                    .should.equal('');

            });

        });

        describe('.html()', function () {

            it('returns the concatenated output of labelHtml + widgetHtml + errorHtml', function () {

                instance.html()
                    .should.equal('<div class=\"field\" data-type=\"text\">' + instance.labelHtml() + instance.widgetHtml() + instance.errorHtml() + '</div>');

            });

            it('uses the optional fieldWrapperTagName if provided', function () {

                this.stub(instance, 'widgetHtml', function () { return '<input>'; } );

                instance.html('', { fieldWrapperTagName: 'li' })
                    .should.equal('<li class=\"field\" data-type=\"text\">' + instance.labelHtml() + instance.widgetHtml() + instance.errorHtml() + '</li>');

            });

            it('uses the instances fieldWrapperTagName if provided', function () {

                instance.fieldWrapperTagName = 'p';

                instance.html()
                    .should.equal('<p class=\"field\" data-type=\"text\">' + instance.labelHtml() + instance.widgetHtml() + instance.errorHtml() + '</p>');

            });

            it('calls each method with the arguments given to it', function () {

                var value = {}, options = {}, fields = {};

                this.spy(instance, 'labelHtml');
                this.spy(instance, 'widgetHtml');
                this.spy(instance, 'errorHtml');

                instance.html(value, options, fields);

                instance.labelHtml
                    .should.always.have.been.calledWithExactly(value, options);

                instance.widgetHtml
                    .should.always.have.been.calledWithExactly(value, options);

                instance.errorHtml
                    .should.always.have.been.calledWithExactly(value, options, fields);

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

}));
