goog.provide('xmpptk.muc.Room');
goog.provide('xmpptk.muc.RoomJID');

goog.require('goog.object');
goog.require('goog.json');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Model');
goog.require('xmpptk.muc.Client');
goog.require('xmpptk.muc.Occupant');
goog.require('xmpptk.Collection');

/**
 * @constructor
 * @extends {xmpptk.Model}
 * @param {string} full_jid Full jid of room including nick.
 */
xmpptk.muc.Room = function(full_jid) {
    this._logger.info("creating room for " + full_jid);

    xmpptk.Model.call(this);

    /** @type {string} */
    this.jid = full_jid.substring(0, full_jid.indexOf('/'));

    /** @type {string} */
    this.full_jid =  full_jid;

    /** @type {xmpptk.muc.Roster} */
    this.roster = new xmpptk.Collection(xmpptk.muc.Occupant, 'jid');

    /** @type {string} */
    this.subject = '';

    /** @type {array} */
    this.messages = [];

    /**
     * events like join/part messages
     * @type {array} */
    this.events = [];

    /**
     * indicates whether we've been admitted to room or not
     * @type {boolean}
     */
    this.admitted = false;
};
goog.inherits(xmpptk.muc.Room, xmpptk.Model);

xmpptk.muc.Room.prototype._logger =
    goog.debug.Logger.getLogger('xmpptk.muc.Room');

xmpptk.muc.Room.prototype.getId = function() { return this.jid; };

/**
 * handle a JSJaCPacket directed to this room
 * @param {JSJaCPacket} oPacket a JSJaCPacket to handle
 */
xmpptk.muc.Room.prototype.handleGroupchatPacket = function(oPacket) {
    // actually looking for a more elegant solution, but hey, saw the
    // ponies?
    this._logger.info(oPacket.pType());
    switch (oPacket.pType()) {
    case 'presence': return this._handleGroupchatPresence(oPacket);
    case 'message': return this._handleGroupchatMessage(oPacket);
    }
};

/**
 * handles a message packet directed to this room
 * @private
 * @param {JSJaCMessage} oMsg a presence packet
 * @return {boolean}
 */
xmpptk.muc.Room.prototype._handleGroupchatMessage = function(oMsg) {
    this._logger.info("room got a message: "+oMsg.xml());

    var roomSubject = oMsg.getSubject();
    var from = oMsg.getFromJID().getResource();

    if (roomSubject !== '') {
        this._logger.info("got subject: "+roomSubject);
        this.set('subject', roomSubject);
    } else {
        var msg = {from: from,
                   body: oMsg.getBody(),
                   type: oMsg.getType()
                  };
        var delay = oMsg.getChild('delay', 'urn:xmpp:delay');
        if (delay) {
            msg.delay = delay.getAttribute('stamp');
        }
        this.publish('message', msg);
        this.messages.push(msg);
        this.set('messages', this.messages);
    }
};

/**
 * handles a presence packet directed to this room
 * @private
 * @param {JSJaCPresence} oPres a presence packet
 */
xmpptk.muc.Room.prototype._handleGroupchatPresence = function(oPres) {
    this._logger.info("room got a presence: "+oPres.xml());

    var from = oPres.getFrom();

    var event = {from: oPres.getFromJID().getResource(),
                 status: oPres.getStatus()};

    if (oPres.isError()) {
        var error = oPres.getChild('error');
        if (error.getAttribute('type') == 'cancel' &&
            error.firstChild.tagName == 'conflict') {
            this.publish('nick_conflict');
        }
    } else if (oPres.getType() == 'unavailable') {
        var status = oPres.getChild('status', xmpptk.muc.NS.USER);
        if (status && status.getAttribute('code') == '307') {
            event.kicked = true;
            var actor = oPres.getChild('actor', xmpptk.muc.NS.USER);
            if (actor)
                event.actor = actor.getAttribute('nick');
            var reason = oPres.getChild('reason', xmpptk.muc.NS.USER);
            if (reason && reason.firstChild)
                event.reason = reason.firstChild.nodeValue;
        }
        this.roster.remove(from);
        this.publish('occupant_left', event);
        this.events.push(goog.object.extend(event, {'type': 'occupant_left'}));
    } else {
        var occupant = this.roster.getItem(from);

        var x = oPres.getChild('x', xmpptk.muc.NS.USER);
        if (x) {
            var item = x.getElementsByTagName('item').item(0);

            if (item) {
                var role = item.getAttribute('role');

                if (from == this.full_jid) {
                    // it's my own presence, check if we're part of the game now
                    if (!this.admitted &&
                        !goog.array.contains(['none', 'outcast'], role)) {
                        this.set('admitted', true);
                    }
                }

                occupant.set({
                    'affiliation': item.getAttribute('affiliation'),
                    'role':        role,
                    'real_jid':    item.getAttribute('jid')
                });

                this.publish('occupant_joined', event);
                this.events.push(goog.object.extend(event, {'type': 'occupant_joined'}));
            }
        } else {
            this._logger.info("no item found for "+xmpptk.muc.NS.USER);
        }
    }

    this.notify();
    this._logger.info("done handling presence");
};
