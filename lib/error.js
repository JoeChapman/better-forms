'use strict';

var FormError = module.exports = function FormError(message) {
    this.message = message;
    this.formName = 'FormError';
};

FormError.prototype = Object.create(FormError.prototype, {
    constructor: { value: FormError },
    toJSON: { value: function FormErrorToJSON() {
        if (this.fields) {
            return {
                form: this.message,
                fields: this.fields
            };
        }
        return this.message;
    } },
    toString: { value: function FormErrorToString() {
        return this.message;
    } }
});
