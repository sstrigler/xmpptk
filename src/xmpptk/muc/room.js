goog.provide('xmpptk.muc.Room');
goog.provide('xmpptk.muc.RoomJID');

goog.require('goog.object');

goog.require('xmmptk.Model');
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
    xmpptk.Model.call(this);

    // keep calm! it's better than you think, isn't it?
    goog.object.extend(this, room_jid);

    /** @type {string} */
    this.jid = this.room+'@'+this.service+'/'+this.nick;

    /** @type {xmpptk.muc.Roster} */
    this.roster = new xmpptk.muc.Roster();

    /** @type {xmpptk.Client} */
    this.client = client;
};
goog.inherit(xmpptk.muc.Room, xmpptk.Model);

xmpptk.muc.Room.prototype.join = function() {
    // setup handlers

    // send presence to rooms jid
    this.client.sendPresence('available', undefined, this.jid);
};

xmpptk.muc.Room.prototype.part = function() {
    // disconnect handlers

    // send presence
    this.client.sendPresence('unavailable', undefined, this.jid);
};