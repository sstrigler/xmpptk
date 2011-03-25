goog.provide('xmpptk.muc.Client');
goog.provide('xmpptk.muc.NS');

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
    this._con.registerHandler('message', '*', '*', 'groupchat', goog.bind(this._handleGroupchatPacket, this));
    this._con.registerHandler('presence', 'x', xmpptk.muc.NS.USER, goog.bind(this._handleGroupchatPacket, this));
};

/**
 * @param {xmpptk.muc.Room}
 */
xmpptk.muc.Client.prototype.registerRoom = function(room) {
    this._logger.info("registering room with id "+room.id);
    this.rooms[room.id] = room;
};

/**
 * @param {xmpptk.muc.Room}
 */
xmpptk.muc.Client.prototype.unregisterRoom = function(room) {
    this._logger.info("unregistering room with id "+room.id);
    delete this.rooms[room.id];
};


xmpptk.muc.Client.prototype._handleGroupchatPacket = function(oJSJaCPacket) {
    this._logger.info("handling muc packet: "+oJSJaCPacket.xml());

    var room_id = oJSJaCPacket.getFromJID().removeResource().toString();
    if (this.rooms[room_id]) {
        this._logger.info("handing over to room with id "+room_id);
        try {
            this.rooms[room_id]['handleGroupchat_'+oJSJaCPacket.pType()](oJSJaCPacket);
        } catch(e) {
            this._logger.severe("failed to call room's handleGroupchatPacket", e);
        }
    }

    return true; // no one else needs to handle this
};

/** @enum {string} */
xmpptk.muc.NS = {
    USER: 'http://jabber.org/protocol/muc#user'
};