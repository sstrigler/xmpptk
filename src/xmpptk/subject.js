goog.provide('xmpptk.Subject');

goog.require('goog.array');
goog.require('goog.pubsub.PubSub');

/**
 * This is part of the observer pattern. A subject to observer.
 * @constructor
 * @extends {goog.pubsub.PubSub}
 */
xmpptk.Subject = function() {
    goog.pubsub.PubSub.call(this);
    this._observers = [];
};
goog.inherits(xmpptk.Subject, goog.pubsub.PubSub);

/**
 * attach an observer to this subject
 * @param {xmpptk.Observer} observer the observer
 */
xmpptk.Subject.prototype.attach = function(observer) {
    this._observers.push(observer);
};

/**
 * detach an already registered observer
 * @param {xmpptk.Observer} observer the observer to detach
 */
xmpptk.Subject.prototype.detach = function(observer) {
    // remove observer from list
    this._observers = goog.array.remove(this._observers, observer);

    // notify attached
    if (typeof observer.destroy == 'function') {
      observer.destroy();
    }
};

/**
 * notify observers about our state having changed
 * @param {?string} property the property that has changed
 */
xmpptk.Subject.prototype.notify = function(property) {
    goog.array.forEach(
        this._observers,
        function(o) {
            o.update(property);
        }
    );
};
