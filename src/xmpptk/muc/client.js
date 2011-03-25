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

    // register handlers
    this._con.registerHandler('message', '*', '*', 'groupchat', goog.bind(this._handleGroupchatMessage, this));
};

xmpptk.muc.Client.prototype._logger = goog.debug.Logger.getLogger('xmpptk.muc.Client');

xmpptk.muc.Client.prototype._handleGroupchatMessage = function(oMsg) {
    this._logger.info("handling muc message: "+oMsg.xml());

    return true;
};
