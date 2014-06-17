'use strict';

global.sinon = require('sinon');
global.should = require('chai')
    .use(require('sinon-chai'))
    .should();

global.sandbox = function (fn) {
    var describe = global.describe,
        beforeAll, afterAll;

    beforeEach(function () {
        this._sandboxEach = global.sinon.sandbox.create({
            injectInto: this,
            properties: ['spy', 'stub', 'mock']
        });
    });

    afterEach(function () {
        this._sandboxEach.restore();
    });

    before(beforeAll = function () {
        this._sandboxAll = global.sinon.sandbox.create({
            injectInto: this,
            properties: ['spy', 'stub', 'mock']
        });
    });

    after(afterAll = function () {
        this._sandboxAll.restore();
    });

    global.describe = function (string, fn) {
        describe(string, function () {
            before(beforeAll);
            after(afterAll);
            fn();
        });
    };

    return fn;

};
