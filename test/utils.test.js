'use strict';
describe('utils', sandbox(function () {

    var utils = require('../lib/utils');

    describe('.htmlTag()', function () {

        describe('with a tagName ("input") and attrs arguments', function () {

            var html;

            beforeEach(function () {
                html = utils.htmlTag('input', {
                    type: 'text',
                    id: 'testId',
                    value: 'test value'
                });
            });

            it('returns a self-closing input with attrs', function () {

                var html = '<input type="text" id="testId" value="test value"/>';

                html.should.equal.html;

            });

        });

        describe('with a tagName ("input") and a Regex pattern attribute', function () {

            var html;

            beforeEach(function () {
                html = utils.htmlTag('input', {
                    type: 'text',
                    id: 'testId',
                    pattern: /\d{4}/
                });
            });

            it('returns a self-closing input with the source of the Regex pattern', function () {

                var html = '<input type="text" id="testId" pattern="\\d{4}"/>';

                html.should.equal.html;

            });

        });

        describe('with a tagName ("div"), attrs and content arguments', function () {

            var html;

            beforeEach(function () {
                html = utils.htmlTag('div', {
                    id: 'testId',
                    'class': 'testClass'
                }, 'Test Content');
            });

            it('returns a closed div with the attrs and content', function () {

                var html = '<div id="testId" class="testClass">Test Content</div>';

                html.should.equal.html;

            });

        });

        describe('with a tagName ("div"), attrs and content ["div"]', function () {

            var html;

            beforeEach(function () {
                html = utils.htmlTag('div', {
                    id: 'testId',
                    'class': 'testClass'
                }, 'div');
            });

            it('returns a closed, empty div with the attrs', function () {

                var html = '<div id="testId" class="testClass"></div>';

                html.should.equal.html;

            });

        });

        describe('with a tagName ("div"), and a Regex data attribute', function () {

            var html;

            beforeEach(function () {
                html = utils.htmlTag('div', {
                    id: 'testId',
                    'data-pattern': /\d{4}/
                }, 'Test Content');
            });

            it('returns a closed div with the source of the Regex', function () {

                var html = '<div id="testId" data-pattern="\\d{4}"/>Test Content</div>';

                html.should.equal.html;

            });

        });

    });

}));
