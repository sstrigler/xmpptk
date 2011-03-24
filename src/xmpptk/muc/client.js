goog.provide('xmpptk.muc.Client');

goog.require('goog.object');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Client');

/**
 * @constructor
 */
xmpptk.muc.Client = function(client) {
    this._logger.info("instantiated");

    // will it blend?
    goog.object.extend(this, client);
};

xmpptk.muc.Client.prototype._logger = goog.debug.Logger.getLogger('xmpptk.muc.Client');
