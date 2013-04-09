goog.provide('xmpptk.RosterItem');
goog.provide('xmpptk.RosterItem.Subscription');

goog.require('xmpptk.Model');

/**
 * @constructor
 * @extends {xmpptk.Model}
 * @param {jid: string, subscription: xmpptk.Roster.Subscription, name=: string} item props to fill item with
 */
xmpptk.RosterItem = function(item) {
    xmpptk.Model.call(this);

    /** @type {string} */
    this.jid = item['jid'];

    /** @type {xmpptk.RosterItem.Subscription} */
    this.subscription = item.subscription;

    /** @type {string} */
    this.name = item.name || (new JSJaCJID(item['jid'])).getNode();

    this._client = item.client;
    this.set('presence', xmpptk.RosterItem.PRESENCEDEFAULT);

    /** @type {Object.<string, xmpptk.Presence>} */
    this.resources = {};

    this.getVCard();
};
goog.inherits(xmpptk.RosterItem, xmpptk.Model);

xmpptk.RosterItem.id = 'jid';

/** @enum {string} */
xmpptk.RosterItem.Subscription = {
    BOTH: 'both',
    FROM: 'from',
    TO:   'to',
    NONE: 'NONE'
};

/** @enum {string} */
xmpptk.RosterItem.PresenceShow = {
    AVAILABLE: 'available',
    CHAT: 'chat',
    AWAY: 'away',
    XA: 'xa',
    DND: 'dnd',
    UNAVAILABLE: 'unavailable'
};

/** @const */
xmpptk.RosterItem.PRESENCEDEFAULT =
    {show: xmpptk.RosterItem.PresenceShow.UNAVAILABLE,
     status: '',
     priority: 0};

xmpptk.RosterItem.prototype._logger =
    goog.debug.Logger.getLogger('xmpptk.RosterItem');

/**
 * return own id
 */
xmpptk.RosterItem.prototype.getId = function() {
    return this.jid;
};

xmpptk.RosterItem.prototype.getVCard = function() {
    // lookup localStorage - if cache miss retrieve by XMPP
    var vCard;
    if (typeof 'Storage' !== 'undefined')
        vCard = sessionStorage['vCard'+this.getId()];

    if (vCard) {
        this._logger.info('got vCard from localStorage');
        this.set('vCard', goog.json.parse(vCard));
    } else {
        if (!this._client || typeof this._client.getVCard !== 'function')
            return;
        this._logger.info("retrieving vCard");
        this._client.getVCard(this.getId(), function(vCard) {
            if (!vCard)
                return;
            this._logger.info("got avatar by vCard: "+
                              goog.json.serialize(vCard));
            if (typeof 'Storage' !== 'undefined')
                sessionStorage['vCard'+this.getId()] =
                goog.json.serialize(vCard);
            this.set('vCard', vCard);
        }, this);
    }
};

/**
 * Update presence for resource given
 *
 * @param {string} resource the resource associated with this presence
 * @param {{show: xmpptk.RosterItem.PresenceShow, status=: string, priority=: number}} presence properties of the actual presence information
 */
xmpptk.RosterItem.prototype.setPresence = function(resource, presence) {
    if (presence.show === xmpptk.RosterItem.PresenceShow.UNAVAILABLE)
        delete this.resources[resource];
    else
        this.resources[resource] = presence;
    this.set('presence', this._getPresence() ||
             xmpptk.RosterItem.PRESENCEDEFAULT);
};

/**
 * Get 'show' value of presence with highest priority
 * @return {xmpptk.RosterItem.PresenceShow} a 'show' value
 */
xmpptk.RosterItem.prototype.getPresenceShow = function() {
    return this.getPresence().show;
};

/**
 * get the most significant presence information of thie entits
 *
 * @return {{show: xmpptk.RosterItem.PresenceShow, status=: string, priority=: number}}
 */
xmpptk.RosterItem.prototype.getPresence = function() {
    return this.get('presence');
};

/**
 * internal method to really determine the most significant presence
 * information of thie entits
 *
 * @return {{show: xmpptk.RosterItem.PresenceShow, status=: string, priority=: number}}
 */
xmpptk.RosterItem.prototype._getPresence = function() {
    // determine presences with highest priority
    return goog.array.reduce(
        goog.object.getValues(this.resources),
        function(prev, cur) {
            if (!prev || cur.priority > prev.priority)
                return cur;
            else if (cur.priority == prev.priority) {
                if (cur.show == prev.show) {
                    return prev; // doesn't matter
                }
                else if (prev.show == 'chat') {
                    return prev;
                }
                else if (cur.show == 'chat') {
                    return cur;
                }
                else if (prev.show == 'available') {
                    return prev;
                }
                else {
                    // in this case cur is sth of 'away', 'xa' or
                    // 'dnd'. we don't care about any order here so prev
                    // can't be worse.
                    return prev;
                }
            } else
                return prev;
        });
};
