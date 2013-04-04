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

    this.jid = new JSJaCJID(
        xmpptk.getConfig('username') + '@' +
            xmpptk.getConfig('domain') + '/' +
            xmpptk.getConfig('resource'));
};
goog.inherits(xmpptk.Client, xmpptk.Model);
goog.addSingletonGetter(xmpptk.Client);

/**
 * @type {goog.debug.Logger}
 * @protected
*/
xmpptk.Client.prototype._logger = goog.debug.Logger.getLogger('xmpptk.Client');

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
 * retrieve an entity's vCard
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

xmpptk.Client.prototype.isConnected = function() {
    return this._con.connected();
};

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

xmpptk.Client.prototype.logout = function() {
    this._con.disconnect();
    return this;
};

xmpptk.Client.prototype.resume = function() {
    return this._con.resume();
};

xmpptk.Client.prototype.rosterItemSet = function(item, callback) {
    var iq = new JSJaCIQ();
    iq.setType('set');
    iq.setQuery(NS_ROSTER).appendChild(
        iq.buildNode(
            'item',
            goog.object.extend(item, {'xmlns': NS_ROSTER})
        )
    );
    this._con.sendIQ(iq, {'error_handler': callback, 'result_handler': callback});
};

/**
 * send a packet
 * @param {JSJaCPacket} packet the packet to send over the wire
 * @return {boolean} whether enqueing packet succeeded
 */
xmpptk.Client.prototype.send = function(packet) {
    return this._con.send(packet);
};

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
        extra(p);
    }
    this.send(p);
};

xmpptk.Client.prototype.sendMessage = function(jid, message) {
    var m = new JSJaCMessage();
    m.setTo(jid);
    m.setType('chat');
    m.setBody(message);

    this.send(m);
};

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

    this.send(iq);
};

xmpptk.Client.prototype.sendSubscription = function(jid, type, message) {
    var p = new JSJaCPresence();
    p.setTo((new JSJaCJID(jid)).removeResource());
    p.setType(type);
    if (message) {
        p.setStatus(message);
    }
    this.send(p);
};

xmpptk.Client.prototype.suspend = function() {
    return this._con.suspend();
};

xmpptk.Client.prototype._handleConnected = function() {
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

xmpptk.Client.NS = {
    XMPPTK_STATE: 'xmpptk:state'
};
