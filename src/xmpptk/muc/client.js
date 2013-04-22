goog.provide('xmpptk.muc.Client');
goog.provide('xmpptk.muc.NS');

goog.require('goog.object');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Client');
goog.require('xmpptk.Collection');
goog.require('xmpptk.muc.Room');

/** @enum {string} */
xmpptk.muc.NS = {
    BASE: 'http://jabber.org/protocol/muc',
    USER: 'http://jabber.org/protocol/muc#user'
};

/**
 * @constructor
 * @extends {xmpptk.Client}
 */
xmpptk.muc.Client = function() {
    xmpptk.Client.call(this);

    this.rooms = new xmpptk.Collection(xmpptk.muc.Room);
};
goog.inherits(xmpptk.muc.Client, xmpptk.Client);
goog.addSingletonGetter(xmpptk.muc.Client);

/**
 * @type {goog.debug.Logger}
 * @protected
 */
xmpptk.muc.Client.prototype._logger = goog.debug.Logger.getLogger('xmpptk.muc.Client');

/**
 * @inheritDoc
 */
xmpptk.muc.Client.prototype.login = function(callback, context) {
    goog.base(this, 'login', callback, context);

    // register handlers
    this._con.registerHandler('message',
                              goog.bind(this._handleGroupchatPacket,
                                        this,
                                        'handleGroupchatMessage'));
    this._con.registerHandler('presence', 'x',
                              xmpptk.muc.NS.USER,
                              goog.bind(this._handleGroupchatPacket,
                                        this,
                                        'handleGroupchatPresence'));
};

/**
 * Join a room.
 * @param {string} jid The full jid of the room (including nickname)
 * @param {string=} password Password for room (if required)
 * @return {xmpptk.muc.Room} The new room
 */
xmpptk.muc.Client.prototype.joinRoom = function(jid, password) {
    this._logger.info("joining room "+jid+" with password "+password);

    var room = this.rooms.addItem(new xmpptk.muc.Room(jid));

    // send presence to rooms jid
    var extra;
    if (password && password !== '') {
        extra = goog.bind(function(p) {
            return p.appendNode('x', {'xmlns': xmpptk.muc.NS.BASE},
                                [p.buildNode('password',
                                             {'xmlns': xmpptk.muc.NS.BASE},
                                             password)]);
        }, this);
    }

    this.sendPresence('available', '', jid, extra);

    return room;
};

/**
 * Leave a room.
 * @param {xmpptk.muc.Room} room The room to part/leave.
 */
xmpptk.muc.Client.prototype.partRoom = function(room) {
    // send presence
    this._client.sendPresence('unavailable', '', room.jid);

    // unregister handlers
    this.rooms.remove(room.getId());
};

/**
 * send a private message to a room participant
 * @param {xmpptk.muc.Room} room The room to send a private message in.
 * @param {string} nick The nick of the participant to send message to.
 * @param {string} msg The message to send.
 */
xmpptk.muc.Client.prototype.sendPrivateMessage = function(room, nick, msg) {
    var rcpt = room.roster.getItem(room.jid+'/'+nick);
    if (rcpt) {
        this.sendMessage(rcpt.get('jid'), msg);
    } else {
        this._logger.info("recepient with nick "+nick+" not found in roster");
    }
};

/**
 * Send a groupchat message to a room.
 * @param {xmpptk.muc.Room} room The room to send the message to.
 * @param {string} message The body of the message to send.
 */
xmpptk.muc.Client.prototype.sendGroupchatMessage = function(room, message) {
    var m = new JSJaCMessage();
    m.setTo(room.jid);
    m.setType('groupchat');
    m.setBody(message);

    this._con.send(m);
};

/**
 * Set subject of a room.
 * @param {xmpptk.muc.Room} room The room to set the subject of.
 * @param {string} subject The subject to set.
 */
xmpptk.muc.Client.prototype.setSubject = function(room, subject) {
    this._logger.info("sending subject: "+subject);
    var m = new JSJaCMessage();
    m.setTo(room.jid);
    m.setType('groupchat');
    m.setSubject(subject);
    this.send(m);
};

/**
 * Hand over packet to linked room.
 * @private
 * @param {JSJaCPacket} oJSJaCPacket an object as it's passed by jsjac
 */
xmpptk.muc.Client.prototype._handleGroupchatPacket = function(fn, oJSJaCPacket) {
    this._logger.info("handling muc packet: "+oJSJaCPacket.xml());

    var room_id = oJSJaCPacket.getFromJID().removeResource().toString();
    if (this.rooms.hasItem(room_id)) {
        this._logger.info("handing over to room with id "+room_id);
        try {
            this.rooms.getItem(room_id)[fn](oJSJaCPacket);
        } catch(e) {
            this._logger.severe(
                "failed to call room's handleGroupchatPacket", e);
        }
        return true;
    } else {
        this._logger.info("no room for id "+room_id);
    }

    return false;
};
