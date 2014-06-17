'use strict';

var _ = require('underscore');

module.exports = {

  camelCaseToRegularForm: function camelCaseToRegularForm(fieldName) {
    return String(fieldName)
      // insert a space before all caps and convert them to lower case
      .replace(/([A-Z])/g, ' $1').toLowerCase()
      // uppercase the first character
      .replace(/^./, function (str) { return str.toUpperCase(); });
  }

  mungeClassValues: function mungeClassValues(classes, output) {
    output = output ? output + (classes ? ' ' : '') : '';
    if (!classes) {
      return output;
    }
    if (classes && typeof classes.join === 'function') {
      output += classes.join(' ');
    }
    return output;
  },

  mapAttributes: function mapAttributes(attrs) {
    return _.map(attrs || [], function (value, key) {
        if (value === undefined) {
            return '';
        } else if (value instanceof RegExp) {
            value = value.source;
        }
        return ' ' + key + '="' + value + '"';
    }).join('');
  },

  htmlTag: function htmlTag(tagName, attrs, content) {
    var closeTag = true,
      selfClosingTags = [
        'area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta',
        'param', 'source', 'track', 'wbr'
      ];

    if (!content && content !== tagName) {
      closeTag = content = false;
    } else if (content === tagName) {
      content = false;
    }

    if (selfClosingTags.indexOf(tagName) > -1) {
      closeTag = content = false;
    }

    attrs = mapAttributes(attrs);

    return '<' + tagName + attrs + (closeTag ? '':'/') + '>' +
      (content || '') +
    (closeTag ? '</' + tagName + '>' : '');
  }

};
