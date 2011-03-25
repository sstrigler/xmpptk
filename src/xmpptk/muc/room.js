goog.provide('xmpptk.muc.Room');
goog.provide('xmpptk.muc.RoomJID');

goog.require('goog.object');
goog.require('goog.json');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Model');
goog.require('xmpptk.muc.Client');
goog.require('xmpptk.muc.Roster');

/** @typedef {{room: string, service: string, nick: string}} */
xmpptk.muc.RoomJid;

/**
 * @constructor
 * @inherits {xmpptk.Model}
 * @param {xmpptk.muc.RoomJID} room_jid Config to denote the rooms identity
 * @param {xmpptk.Client} client 
 */
xmpptk.muc.Room = function(room_jid, client) {
    this._logger.info("creating room " + goog.json.serialize(room_jid));
    xmpptk.Model.call(this);

    // keep calm! it's better than you think, isn't it?
    goog.object.extend(this, room_jid);

    this.id = this.room+'@'+this.service;

    /** @type {string} */
    this.jid = this.room+'@'+this.service+'/'+this.nick;

    /** @type {xmpptk.muc.Roster} */
    this.roster = new xmpptk.muc.Roster();

    /** @private */
    this._client = new xmpptk.muc.Client(client);
};
goog.inherits(xmpptk.muc.Room, xmpptk.Model);

xmpptk.muc.Room.prototype._logger = goog.debug.Logger.getLogger('xmpptk.muc.Room');

xmpptk.muc.Room.prototype.handleGroupchat_message = function(oMsg) {
    this._logger.info("room got a message: "+oMsg.xml());
};

xmpptk.muc.Room.prototype.handleGroupchat_presence = function(oPres) {
    this._logger.info("room got a presence: "+oPres.xml());
};

xmpptk.muc.Room.prototype.join = function() {
    this._logger.info("joining room "+this.jid);

    // register handlers
    this._client.registerRoom(this);

    // send presence to rooms jid
    this._client.sendPresence('available', undefined, this.jid);
};

xmpptk.muc.Room.prototype.part = function() {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
    this._client.sendPresence('unavailable', undefined, this.jid);
};