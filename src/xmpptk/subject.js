goog.provide('xmpptk.Subject');

goog.require('goog.array');

/**
 * This is part of the observer pattern. A subject to observer.
 */

xmpptk.Subject = function() {
    this._observers = [];
};
  
xmpptk.Subject.prototype.attach = function(observer) {
    this._observers.push(observer);
};

xmpptk.Subject.prototype.detach = function(observer) {
    // remove observer from list
    this._observers = goog.array.remove(this._observers, observer);

    // notify attached
    if (typeof observer.destroy == 'function') {
      observer.destroy();
    }
};

xmpptk.Subject.prototype.notify = function() {
    goog.array.forEach(
        this._observers,
        function(o) {
            o.update();
        }
    );
};
