0.0.2 (27.06.2014)
==================

Features:

- Add support for CSRF token (#2 @joechapman)

0.0.3 (28.06.2014)
==================

Features:

- Updated Simple form example (@joechapman)

0.0.4 (03.07.2014)
==================

Features:

- Make json in xhr response optionally take html strings as messages (#6 @joechapman)
- Fix validateif validation
- increase test coverage

0.0.5 (14.07.2014)
==================

Features:

- Add noMatch and tooShort to data-message attrs
- Add match and validateif to available attributes
- Always render data-message attrs

0.0.6 (15.07.2014)
==================

Features:

- Add checked and name attributes to Field class
- Persist selected option in select field
- Get correct radio value when parsing body

0.0.7 (24.07.2014)
==================

Features:

- Field html returns wrapped fields
- Preselect select option
- Documentation

0.0.8 (24.07.2014)
==================

Features:

- Fix documentation link

0.0.9 (24.07.2014)
==================

Features:

- Add typeMismatch validation and data-message to email Field

0.0.10 (25.07.2014)
==================

Features:

- New fieldHandler helpers for errorText, labelText, widgetAttributes, choices & placeholder
- Removed fieldHandler.validationErrors, replaced with errorText

0.0.11 (31.07.2014)
==================

Features:

- New fieldHandler helpers error - returns error key such as 'valueMissing', 'typeMismatch'
- Exposed field and error Classes

0.0.12 (01.08.2014)
==================

- XHR redirects returned as JSON object (@mattyod)
- Updated dependencies (@mattyod)
- Refactored out deprecated methods after dependency update (@mattyod)

0.0.13 (15.08.2014)
==================

- validateif values can be tested with either AND and OR logic
- validateif id references can force their respective values to be tested for the inverse quality with '!'
- bugfix: Form.validate called only when necessary, not twice as in post handling.

0.0.15 (22.08.2014)
==================

- fixed bug in way _csrf field was created.

0.2.0 (28.08.2014)
==================

- Dynamic redirectUrl feature; add redirectUrl to session to redirect to on successful post.

0.2.1 (01.09.2014)
==================

- added escapeValue method to field.js, catches single and double quotes before
writing back to template.

0.2.2 (10.09.14)
================

- Show error messge by setting new Form.error in setValues callback.
- Allow api errors to be propogated thru to form error handler, even if formHandler.valid is true

0.2.3 (11.09.14)
================

- Update dependencies.

0.2.4 (15.09.14)
================

- put req.forms[this.formName] in method on form so can be overwritten. Useful for returning different values when error handling
- getForm removed
- getFormObject, accepts error and request, conditional logic can be applied

0.2.5 (25.09.14)
================

- formHandler attributes returns formAttributes
- new form attributes allowed; 'autocomplete', 'enctype', 'accept-charset'
- radio and checkbox role attributes added as standard
