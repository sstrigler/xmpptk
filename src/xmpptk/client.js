goog.provide('xmpptk.Client');

goog.require('xmpptk');
goog.require('xmpptk.Config');
goog.require('xmpptk.Model');
goog.require('xmpptk.Roster');
goog.require('xmpptk.RosterItem');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.debug.Logger');

goog.require('goog.json');

/**
 * The actual XMPP connection that wraps all the tricky XMPP stuff.
 * @constructor
 * @extends {xmpptk.Model}
 */
xmpptk.Client = function() {
    xmpptk.Model.call(this);

    /** @type {xmpptk.Roster} */
    this.roster = new xmpptk.Roster(this);

    /** @type {JSJaCJID} */
    this.jid = new JSJaCJID(
        xmpptk.getConfig('username') + '@' +
            xmpptk.getConfig('domain') + '/' +
            xmpptk.getConfig('resource'));

    this.connected = false;
};
goog.inherits(xmpptk.Client, xmpptk.Model);
goog.addSingletonGetter(xmpptk.Client);

/**
 * Own namespaces used.
 * @enum {string}
 */
xmpptk.Client.NS = {
    XMPPTK_STATE: 'xmpptk:state'
};

/**
 * @type {goog.debug.Logger}
 * @protected
*/
xmpptk.Client.prototype._logger = goog.debug.Logger.getLogger('xmpptk.Client');

/**
 * Retrieve the roster associated with the connected user.
 * @param {function(xmpptk.Roster)} callback A function to be called with the
 *                                           resulting roster as argument.
 * @param {object?} context The context for the callback to be called within.
 */
xmpptk.Client.prototype.getRoster = function(callback, context) {
    var iq = new JSJaCIQ();
    iq.setType('get');
    iq.setQuery(NS_ROSTER);

    this._con.sendIQ(iq, {
        'result_handler': goog.bind(function(resIQ) {
            this.roster.setItems(
                goog.array.map(
                    resIQ.getQuery().getElementsByTagName('item'),
                    function(item) {
                        return {
                            'jid'          : item.getAttribute('jid'),
                            'name'         : item.getAttribute('name'),
                            'subscription' : item.getAttribute('subscription'),
                            'client'       : this
                        };
                    },
                    this)
            );

            if (typeof callback == 'function')
                xmpptk.call(callback, context, this.roster);
        }, this),
        'error_handler': goog.bind(function() {
            if (typeof callback == 'function')
                xmpptk.call(callback, context, this.roster);
        }, this)
    });
};

/**
 * Retrieve client's saved state from the server.
 * @param {function(xmpptk.Roster)} callback A function to be called with the
 *                                           resulting state as argument.
 * @param {object?} context The context for the callback to be called within.
 */
xmpptk.Client.prototype.getState = function(callback, context) {
    var iq = new JSJaCIQ();
    iq.setType('get');
    var query = iq.setQuery(NS_PRIVATE);

    query.appendChild(iq.buildNode('xmpptk', {xmlns: xmpptk.Client.NS.XMPPTK_STATE}));

    this._con.sendIQ(iq,
                     {'result_handler':
                      function(resIQ) {
                          var state = resIQ.getChildVal('xmpptk', xmpptk.Client.NS.XMPPTK_STATE);
                          xmpptk.call(callback, context, state);
                      }
                     });
};

/**
 * Retrieve an entity's vCard.
 * @param {string} jid the bare jid of the entity to retrive vCard for
 * @param {function(object)} callback a callback to be called with the result of the query
 * @param {object?} context optional context to call callback with
 */
xmpptk.Client.prototype.getVCard = function(jid, callback, context) {
    var iq = new JSJaCIQ();
    iq.setTo(jid);
    iq.setType('get');
    iq.appendNode('vCard', {'xmlns': 'vcard-temp'});

    this._con.sendIQ(iq, {
        'result_handler': goog.bind(function(resIq) {
            var vCard;
            var vCardEl = resIq.getChild('vCard');
            if (vCardEl) {
                vCard = goog.json.parse(xmpptk.xml2json(vCardEl, " ")).vCard;
            }
            xmpptk.call(callback, context, vCard);
        }, this)
    });
};

/**
 * Determine whether client is connected.
 * @return {boolean} 'true' if client is connected, 'false' otherwise.
 */
xmpptk.Client.prototype.isConnected = function() {
    return typeof this._con !== 'undefined' && this._con.connected();
};

/**
 * Log into XMPP service with credentials given at xmpptk.Config by 'username',
 * 'domain', 'resource' and 'password' properties.
 * @param {function()} callback A callback to be called once authentication is
 *                              finished.
 * @param {context?} context Optional contect for callback from above
 *                           (what 'this' refers to within the callback).
 */
xmpptk.Client.prototype.login = function(callback, context) {
    this._logger.info("logging in with: " + goog.json.serialize(xmpptk.Config));

    this.subscribeOnce('_login', callback, context);

    this._con = new JSJaCHttpBindingConnection(xmpptk.Config);

    this._con.registerHandler('onconnect',
                              JSJaC.bind(this._handleConnected, this));

    this._con.registerHandler('ondisconnect',
                              JSJaC.bind(function() {
                                  this.publish('disconnected',
                                                  this._con.status() == 'session-terminate-conflict');
                              },this));

    this._con.registerHandler('onerror',
                              JSJaC.bind(function(e) {
                                  var error = {code: e.getAttribute('code'),
                                               type: e.getAttribute('type'),
                                               condition: e.firstChild.nodeName};
                                  this._logger.info("an error occured: "+goog.json.serialize(error));
                                  this.publish('error', error);
                              }, this));

    this._con.registerHandler('presence',
                              JSJaC.bind(this._handlePresence, this));

    this._con.registerHandler('message',
                              JSJaC.bind(this._handleMessage, this));

    this._con.registerIQSet('query',
                            NS_ROSTER,
                            JSJaC.bind(this._handleRosterPush, this));

    this._con.registerHandler('packet_in',
                              JSJaC.bind(function(packet) {
                                  this._logger.fine("[IN]: "+packet.xml());
                              }, this));
    this._con.registerHandler('packet_out',
                              JSJaC.bind(function(packet) {
                                  this._logger.fine("[OUT]: "+packet.xml());
                              }, this));

    this._con.connect(xmpptk.Config);
    return this;
};

/**
 * Disconnect from XMPP service.
 * @return {xmpptk.Client} A reference to ourselves.
 */
xmpptk.Client.prototype.logout = function() {
    this._con.disconnect();
    return this;
};

/**
 * Resume a BOSH(!) session.
 * @return {boolean} Whether resume succeeded or not.
 */
xmpptk.Client.prototype.resume = function() {
    return this._con.resume();
};

/**
 * Add/Modify a roster item (using IQ 'set' method). See Section 2.1 of RFC 6121
 * for details.
 * @param {object} item Object with properties 'jid', 'name', 'group'.
 * @param {function()} callback A function to be called with repsonse from
 *                              server.
 * @return {boolean} Whether enqueing packet succeeded.
 */
xmpptk.Client.prototype.rosterItemSet = function(item, callback) {
    var iq = new JSJaCIQ();
    iq.setType('set');
    iq.setQuery(NS_ROSTER).appendChild(
        iq.buildNode(
            'item',
            goog.object.extend(item, {'xmlns': NS_ROSTER})
        )
    );
    return this._con.sendIQ(iq, {'error_handler':  callback,
                                 'result_handler': callback});
};

/**
 * Send a packet (as is).
 * @param {JSJaCPacket} packet the packet to send over the wire
 * @return {boolean} Whether enqueing packet succeeded.
 */
xmpptk.Client.prototype.send = function(packet) {
    return this._con.send(packet);
};

/**
 * Send a presence stanza. This can either be a directed or undirected presence
 * depending on whether the 'jid' parameter is given or not.
 * @param {string} state One of 'available', 'chat', 'away', 'xa', 'dnd' or
 *                       'unavailable'.
 * @param {string?} message A free to choose message to associated with the
 *                         presence's  state.
 * @param {string?} jid An entitie's jid to send the presence to
 *                      (i.e. a directed presence).
 * @param {function(JSJaCPresence)?} extra A function that's allowed to modify
 *                                         the presence stanza to be sent.
 * @return {boolean} Whether enqueing packet succeeded.
 */
xmpptk.Client.prototype.sendPresence = function(state, message, jid, extra) {
    var p = new JSJaCPresence();
    p.setTo(jid);

    switch (state) {
    case 'available': break;
    case 'unavailable': p.setType('unavailable'); break;
    case 'invisible':
        p.setType('invisible');
        break;
    default: p.setShow(state);
    }
    if (message) {
        p.setStatus(message);
    }
    if (extra && typeof extra == 'function') {
        p = extra(p);
    }
    return this.send(p);
};

/**
 * Send a message to another entity.
 * @param {string} jid The recipient for the message.
 * @param {string} message The body of the message to be sent.
 * @return {boolean} Whether enqueing packet succeeded.
 */
xmpptk.Client.prototype.sendMessage = function(jid, message) {
    var m = new JSJaCMessage();
    m.setTo(jid);
    m.setType('chat');
    m.setBody(message);

    return this.send(m);
};

/**
 * Save private state to XMPP service.
 * @param {object} Object denoting state to be saved.
 * @return {boolean} Whether enqueing packet succeeded.
 */
xmpptk.Client.prototype.sendState = function(state) {
    var iq = new JSJaCIQ();
    iq.setType('set');
    iq.setQuery(NS_PRIVATE).
        appendChild(
            iq.buildNode(
                'xmpptk',
                {'xmlns': xmpptk.Client.NS.XMPPTK_STATE},
                state
            )
        );
    // [TODO] Prolly should be using sendIQ here and setting result handlers
    // accordingly.
    return this.send(iq);
};

/**
 * Send a subscription request to remote entity. See Section 3 of RFC 6121 for
 * details.
 * @param {string} jid  The jid of the remote entity.
 * @param {string} type One of 'subscribe', 'subscribed', 'unsubscribe' or
 *                      'unsubscribed'.
 * @return {boolean} Whether enqueing packet succeeded.
 */
xmpptk.Client.prototype.sendSubscription = function(jid, type, message) {
    var p = new JSJaCPresence();
    p.setTo((new JSJaCJID(jid)).removeResource());
    p.setType(type);
    if (message) {
        p.setStatus(message);
    }
    return this.send(p);
};

/**
 * Suspend underlying BOSH(!) session.
 * @return {boolean} Whether suspending the session succeeded.
 */
xmpptk.Client.prototype.suspend = function() {
    return this._con.suspend();
};

/* ---------------------- INTERNAL ---------------------- */

xmpptk.Client.prototype._handleConnected = function() {
    this.set('connected', true);
    this.publish('connected');
    this.publish('_login');
};

xmpptk.Client.prototype._handleMessage = function(m) {
    if (m.getBody() === '') { // hu?
        return;
    }

    this._logger.info("handling message: "+m.xml());

    var message =  {
        'from'  : m.getFromJID().removeResource().toString(),
        'body'  : m.getBody(),
        'ts'    : (new Date()).getTime()
    };
    if (m.getType() == 'error') {
        var e = m.getChild('error');
        message = goog.object.extend(
            message,
            {
                'error':
                {
                    'code': e.getAttribute('code'),
                    'type': e.getAttribute('type'),
                    'cond': e.firstChild.tagName
                }
            }
        );
    }

    this.publish('message', message);
};

xmpptk.Client.prototype._handlePresence = function(p) {
    this._logger.info("handling presence: "+p.xml());

    if (p.getFromJID().isEntity(this.jid)) {
        this._logger.info("got presence from ourselves, discarding");
        // a presence from ourselves
        return;
    }
    if (p.getType() && p.getType().match(/subscribe/)) {
        // it's got to do sth with subscriptions
        return this.publish(
            'subscription',
            {
                'from'    : p.getFromJID().removeResource().toString(),
                'type'    : p.getType(),
                'status'  : p.getStatus()
            }
        );
    }

    var show = 'available';
    if (p.getType() == 'unavailable') {
        show = 'unavailable';
    } else {
        if (p.getShow() !== '') {
            show = p.getShow();
        }
    }

    this.publish(
        'presence',
        {
            'from': p.getFromJID(),
            'presence' :
            {
                'show'     : show,
                'status'   : p.getStatus(),
                'priority' : p.getPriority() || 0
            }
        }
    );
};

xmpptk.Client.prototype._handleRosterPush = function(resIQ) {
    goog.array.forEach(
        resIQ.getQuery().children,
        goog.bind(
            function(i, item) {
                this.publish(
                    'roster_push',
                    {
                        'jid'          : item.getAttribute('jid'),
                        'name'         : item.getAttribute('name'),
                        'subscription' : item.getAttribute('subscription')
                    }
                );
            },
            this
        )
    );

    // send 'result' reply
    this.send(
        new JSJaCIQ().setIQ(
            this._con.domain, 'result', resIQ.getID()
        )
    );
};
