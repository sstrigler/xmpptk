goog.provide('xmpptk.observer');

xmpptk.observer = function(subject) {
    this.observe(subject);
};

xmpptk.observer.prototype.observe = function(subject) {
    this.subject = subject;
    subject.attach(this);
};

xmpptk.observer.prototype.update = function() {
    // must be overwritten
    throw("update called on observer but wasn't handled");
};

