goog.provide('xmpptk.Observer');

goog.require('xmpptk.Subject');

/**
 * @constructor
 * @param {xmpptk.Subject} subject
 */
xmpptk.Observer = function(subject) {
    this.observe(subject);
};

/**
 * @param {xmpptk.Subject} subject
 */
xmpptk.Observer.prototype.observe = function(subject) {
    this.subject = subject;
    subject.attach(this);
};

xmpptk.Observer.prototype.update = function() {
    // must be overwritten
    throw "update called on observer but wasn't handled";
};

