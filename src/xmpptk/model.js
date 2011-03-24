goog.provide('xmpptk.Model');

goog.require('xmpptk.subject');
goog.require('goog.object');

xmpptk.Model = function() {
    xmpptk.subject.call(this);
};
goog.inherits(xmpptk.Model, xmpptk.subject);

xmpptk.Model.prototype.get = function(prop) {
    if (typeof prop == 'undefined') {
        // return object with all of our properties
        var obj = {};

        for (var i in this) {
            if (this.hasOwnProperty(i)) { // it's a member property
                if (i.indexOf('_') !== 0) { // no hidden props
                    obj[i] = this[i];
                }
            }
        }
        return obj;
    }
    // return named property
    if (typeof this[prop] != 'undefined') {
        return this[prop];
    }
    throw "property not found: "+prop;
};

xmpptk.Model.prototype.set = function(prop, value, skip_notify) {
    if (!prop) {
        // I don't see a reason how prop could be null here but
        // somehow in MSIE it turns out to be so in some cases. At
        // least this makes fckwing MSIE work so don't get crazy and
        // just forget about it!
        return;
    }

    if (typeof value == 'undefined') {
        // fill in whole object
        goog.object.forEach(
            prop,
            function(val, key) {
                this.set(key, val, true);
            },
            this
        );
    } else if (prop.indexOf('_') != 0) { // skip hidden props
        this[prop] = value;
    }
    if (!skip_notify) {
        this.notify();
    }
    return this;
};