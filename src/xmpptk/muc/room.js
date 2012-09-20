goog.provide('xmpptk.muc.Room');
goog.provide('xmpptk.muc.RoomJID');

goog.require('goog.object');
goog.require('goog.json');
goog.require('goog.debug.Logger');

goog.require('xmpptk.Model');
goog.require('xmpptk.muc.Client');
goog.require('xmpptk.muc.Occupant');
goog.require('xmpptk.Collection');

/** @typedef {{room: string, service: string, nick: string}} */
xmpptk.muc.RoomJid;

/**
 * @constructor
 * @extends {xmpptk.Model}
 * @param {xmpptk.muc.Client} client a muc enabled xmpp client
 * @param {xmpptk.muc.RoomJID} room_jid Config to denote the rooms identity
 * @param {?string} password an optional password to access to room with
 */
xmpptk.muc.Room = function(client, room_jid, password) {
    this._logger.info("creating room " + goog.json.serialize(room_jid));

    // keep calm! it's better than you think, isn't it?
    goog.object.extend(this, room_jid);

    xmpptk.Model.call(this);

    /** @type {string} */
    this.id = this['room']+'@'+this['service'];

    /** @type {string} */
    this.jid = this['room']+'@'+this['service']+'/'+this['nick'];

    /** @type {string} */
    this.password = password || '';

    /** @type {xmpptk.muc.Roster} */
    this.roster = new xmpptk.Collection(xmpptk.muc.Occupant, 'jid');

    /** @type {string} */
    this.subject = '';

    /** @type {array} */
    this.messages = [];

    /** @type {array} */
    this.events = [];

    /** @type {array} */
    this.chatStates = {};

    /**
     * @type {xmpptk.muc.Client}
     * @private */
    this._client = client;

    /**
     * indicates whether we've been admitted to room or not
     * @type {boolean}
	 * @private
     */
    this._admitted = false;
};
goog.inherits(xmpptk.muc.Room, xmpptk.Model);

xmpptk.muc.Room.prototype._logger = goog.debug.Logger.getLogger('xmpptk.muc.Room');

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
 * actually join the room
 * @param {function(object, string)} callback function to call when actually admitted to the room
 * @return {xmpptk.muc.Room} this rooms
 */
xmpptk.muc.Room.prototype.join = function(callback) {
    this._logger.info("joining room "+this.jid+" with password "+this.password);

    // register handlers
    this._client.registerRoom(this);

    // register callback
    if (callback) {
        this.subscribeOnce('admitted', callback);
    }

    // send presence to rooms jid
    if (this.password != '') {
        var extra = goog.bind(function(p) {
            return p.appendNode('x', {'xmlns': xmpptk.muc.NS.BASE},
                                [p.buildNode('password', {'xmlns': xmpptk.muc.NS.BASE}, this.password)]);
        }, this);
    }

    this._client.sendPresence('available', undefined, this.jid, extra);
    return this;
};

/**
 * leave this room
 */
xmpptk.muc.Room.prototype.part = function() {
    // unregister handlers
    this._client.unregisterRoom(this);

    // send presence
    this._client.sendPresence('unavailable', undefined, this.jid);
};

/**
  * send a message to the room (and thus to all occupants)
  * @param {string} msg the message to send
  */
xmpptk.muc.Room.prototype.sendMessage = function(msg) {
    this._client.sendGroupchatMessage(this.id, msg);
};

/**
 * send a private message to a room participant
 * @param {string} nick the nick of the participant to send message to
 * @param {string} msg the message to send
 */
xmpptk.muc.Room.prototype.sendPrivateMessage = function(nick, msg) {
    var rcpt = this.roster.getItem(this.id+'/'+nick);
    if (rcpt) {
        this._client.sendMessage(rcpt.get('jid'), msg);
    } else {
        this._logger.info("recepient with nick "+nick+" not found in roster");
    }
};

/**
 * sends a composing event to the room (must be supported by conference service)
 */
xmpptk.muc.Room.prototype.sendComposing = function() {
    this._client.sendComposing(this.id);
};

/**
 * set subject of this room
 * @param {string} subject the subject to set
 */
xmpptk.muc.Room.prototype.setSubject = function(subject) {
    this._logger.info("sending subject: "+subject);
    var m = new JSJaCMessage();
    m.setTo(this.id);
    m.setType('groupchat');
    m.setSubject(subject);
    this._client.send(m);
}

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

    if (roomSubject != '') {
        this._logger.info("got subject: "+roomSubject);
        this.set('subject', roomSubject);
    } else {
        var chatState = oMsg.getChatState();
        if (chatState != '') {
			this._logger.info("got a chatState from "+from+": "+chatState);
            this.chatStates[from] = chatState;
            this.set('chatStates', this.chatStates);
        }
        if (oMsg.getBody() == '') {
            this.notify();
            return;
        }
        this.chatStates[from] = '';
        this.set('chatStates', this.chatStates);
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
    this.notify();
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
        if (this.roster.hasItem(from)) {
            this.roster.removeItem(from);
        }
		this.publish('occupant_left', event);
        this.events.push(goog.object.extend(event, {'type': 'occupant_left'}));
        this.set('events', this.events);
    } else {
        var occupant = this.roster.getItem(from);

        var x = oPres.getChild('x', xmpptk.muc.NS.USER);
        if (x) {
            var item = x.getElementsByTagName('item').item(0);

            if (item) {
				var role = item.getAttribute('role');

                if (from == this.jid) {
                    // it's my own presence, check if we're part of the game now
                    if (!this._admitted && !goog.array.contains(['none', 'outcast'], role)) {
                        this._admitted = true;
						this.publish('admitted');
                    }
                }

                occupant.set({
                    'affiliation': item.getAttribute('affiliation'),
                    'role':        role,
                    'real_jid':    item.getAttribute('jid')
                });

				this.publish('occupant_joined', event)
				this.events.push(goog.object.extend(event, {'type': 'occupant_joined'}));
                this.set('events', this.events);

            }
        } else {
            this._logger.info("no item found for "+xmpptk.muc.NS.USER);
        }
    }

    this.notify();
    this._logger.info("done handling presence");
};