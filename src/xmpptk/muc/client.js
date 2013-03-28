goog.provide('xmpptk.muc.Client');
goog.provide('xmpptk.muc.NS');

goog.require('goog.object');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Client');

/**
 * @constructor
 * @extends {xmpptk.Client}
 */
xmpptk.muc.Client = function() {
    xmpptk.Client.call(this);

    this._logger = goog.debug.Logger.getLogger('xmpptk.muc.Client');
    this._logger.info("instantiated");

    /** @type {Object.<xmpptk.muc.Room>} */
    this.rooms = {};

};
goog.inherits(xmpptk.muc.Client, xmpptk.Client);
goog.addSingletonGetter(xmpptk.muc.Client);

xmpptk.muc.Client.prototype.login = function(callback, context) {
    goog.base(this, 'login', callback, context);

    // register handlers
    this._con.registerHandler('message', goog.bind(this._handleGroupchatPacket, this));
    this._con.registerHandler('presence', goog.bind(this._handleGroupchatPacket, this));
};

/**
 * @param {xmpptk.muc.Room} room the room to register
 */
xmpptk.muc.Client.prototype.registerRoom = function(room) {
    this._logger.info("registering room with id "+room.id);
    this.rooms[room.id] = room;
    this.notify();
};

/**
 * sends a groupchat message to a room
 * @param {string} jid a room's jid
 * @param {string} message the body of the message to send
 */
xmpptk.muc.Client.prototype.sendGroupchatMessage = function(jid, message) {
    var m = new JSJaCMessage();
    m.setTo(jid);
    m.setType('groupchat');
    m.setBody(message);

    this._con.send(m);
};

/**
 * @param {xmpptk.muc.Room} room
 */
xmpptk.muc.Client.prototype.unregisterRoom = function(room) {
    this._logger.info("unregistering room with id "+room.id);
    delete this.rooms[room.id];
    this.notify();
};

/**
 * @param {JSJaCPacket} oJSJaCPacket an object as it's passed by jsjac
 */
xmpptk.muc.Client.prototype._handleGroupchatPacket = function(oJSJaCPacket) {
    this._logger.info("handling muc packet: "+oJSJaCPacket.xml());

    var room_id = oJSJaCPacket.getFromJID().removeResource().toString();
    if (this.rooms[room_id]) {
        this._logger.info("handing over to room with id "+room_id);
        try {
            this.rooms[room_id].handleGroupchatPacket(oJSJaCPacket);
        } catch(e) {
            this._logger.severe("failed to call room's handleGroupchatPacket:"+e.message, e);
        }
        return true;
    } else {
        this._logger.info("no room for id "+room_id);
    }

    return false;
};

/** @enum {string} */
xmpptk.muc.NS = {
    BASE: 'http://jabber.org/protocol/muc',
    USER: 'http://jabber.org/protocol/muc#user'
};
