goog.provide('xmpptk.Config');

/**
 * @constructor
 */
xmpptk.Config = function(obj) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            this[i] = obj[i];
        }
    }

    // set some reasonable defaults
    this.httpbase = obj.httpbase || '/http-bind/';
    this.domain = obj.domain || 'localhost';
    this.resource = obj.resource || 'helpim';

};
