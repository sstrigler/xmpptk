goog.provide('xmpptk.muc.Client');

goog.require('goog.object');
goog.require('xmpptk.Client');

/**
 * @constructor
 * @param {xmpptk.Client} client
 */
xmpptk.muc.Client = function() {
    // will it blend?
    goog.object.extend(this, xmpptk.Client.getInstance());
};
goog.addSingletonGetter(xmpptk.muc.Client);

