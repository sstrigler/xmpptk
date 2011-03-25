goog.provide('xmpptk.muc.Client');

goog.require('goog.object');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Client');

/**
 * @constructor
 */
xmpptk.muc.Client = function(client) {
    // will it blend?
    goog.object.extend(this, client);

    this._logger = goog.debug.Logger.getLogger('xmpptk.muc.Client');
    this._logger.info("instantiated");

    this.rooms = {};

    // register handlers
    this._con.registerHandler('message', '*', '*', 'groupchat', goog.bind(this._handleGroupchatMessage, this));
};

/**
 * @param {xmpptk.muc.Room}
 */
xmpptk.muc.Client.prototype.registerRoom = function(room) {
    this._logger.info("registering room with id "+room.id);
    this.rooms[room.id] = room;
};

xmpptk.muc.Client.prototype._handleGroupchatMessage = function(oMsg) {
    this._logger.info("handling muc message: "+oMsg.xml());

    var room_id = oMsg.getFromJID().removeResource().toString();
    if (this.rooms[room_id]) {
        this._logger.info("handing over to room with id "+room_id);
        try {
            this.rooms[room_id].handleGroupchatMessage(oMsg);
        } catch(e) {
            this._logger.severe("failed to call room's handleGroupchatMessage", e);
        }
    }

    return true; // no one else needs to handle this
};
