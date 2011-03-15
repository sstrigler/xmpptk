goog.provide('xmpptk.xmpp');

goog.require('xmpptk');

goog.require('goog.array');
goog.require('goog.object');

/**
 * The actual XMPP connection that wraps all the tricky XMPP stuff.
 * @constructor
 * @param {{httpbase: string, xmppdomain: string, user: string, password: string, resource: string, debug: boolean}} cfg A configuration
 * @param {goog.pubsub.PubSub} p A pubsub channel
 * @param {goog.debug.Logger} logger A logger for debugging
 */
xmpptk.xmpp = function(cfg, p, logger) {

    this._cfg = cfg;
    this._p = p;
    this._debug = logger;

    this._con = new JSJaCHttpBindingConnection({httpbase: cfg.httpbase});

    this._con.registerHandler('onconnect',
                              JSJaC.bind(this._handleConnected, this));

    this._con.registerHandler('ondisconnect',
                              JSJaC.bind(function() {
                                  this._p.publish('disconnected',
                                                  this._con.status() == 'session-terminate-conflict');
                              },this));

    this._con.registerHandler('presence',
                              JSJaC.bind(this._handlePresence, this));

    this._con.registerHandler('message',
                              JSJaC.bind(this._handleMessage, this));

    this._con.registerIQSet('query',
                            NS_ROSTER,
                            JSJaC.bind(this._handleRosterPush, this));

    this._con.registerHandler('packet_in',
                              JSJaC.bind(function(packet) {
                                  this._debug.fine("[IN]: "+packet.xml());
                              }, this));
    this._con.registerHandler('packet_out',
                              JSJaC.bind(function(packet) {
                                  this._debug.fine("[OUT]: "+packet.xml());
                              }, this));
};

xmpptk.xmpp.prototype.getRoster = function(callback, context) {
    var iq = new JSJaCIQ();
    iq.setType('get');
    iq.setQuery(NS_ROSTER);

    this._con.sendIQ(iq, {
        result_handler: function(resIQ) {
            var roster = [];
            goog.array.forEach(resIQ.getQuery().children,
                               function(i, item) {
                                   roster.push(
                                       {
                                           jid          : item.getAttribute('jid'),
                                           name         : item.getAttribute('name'),
                                           subscription : item.getAttribute('subscription')
                                       }
                                   );
                               });

            xmpptk.call(callback, context, roster);
        },
        error_handler: function() {
            xmpptk.call(callback, context, []);
        }
    });
};

xmpptk.xmpp.prototype.getState = function(callback, context) {
    var iq = new JSJaCIQ();
    iq.setType('get');
    var query = iq.setQuery(NS_PRIVATE);

    query.appendChild(iq.buildNode('xmpptk', {xmlns: xmpptk.xmpp.ns.XMPPTK_STATE}));

    this._con.sendIQ(iq,
                     {result_handler:
                      function(resIQ) {
                          var state = resIQ.getChildVal('xmpptk', xmpptk.xmpp.ns.XMPPTK_STATE);
                          xmpptk.call(callback, context, state);
                      }
                     });
};


xmpptk.xmpp.prototype.isConnected = function() {
    return this._con.connected();
};

xmpptk.xmpp.prototype.login = function(callback, context) {
    this._p.subscribeOnce('_login', callback, context, true);
    this._con.connect({
        'domain'   : this._cfg.xmppdomain,
        'username' : this._cfg.user,
        'pass'     : this._cfg.password,
        'resource' : this._cfg.resource
    });
};

xmpptk.xmpp.prototype.logout = function() {
    this._con.disconnect();
};

xmpptk.xmpp.prototype.resume = function() {
    return this._con.resume();
};

xmpptk.xmpp.prototype.rosterItemSet = function(item, callback) {
    var iq = new JSJaCIQ();
    iq.setType('set');
    iq.setQuery(NS_ROSTER).appendChild(
        iq.buildNode(
            'item',
            goog.object.extend(item, {xmlns: NS_ROSTER})
        )
    );
    this._con.sendIQ(iq, {error_handler: callback, result_handler: callback});
};

xmpptk.xmpp.prototype.sendPresence = function(state, message, jid) {
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
    this._con.send(p);
};

xmpptk.xmpp.prototype.sendMessage = function(jid, message) {
    var m = new JSJaCMessage();
    m.setTo(jid);
    m.setType('chat');
    m.setBody(message);

    this._con.send(m);
};

xmpptk.xmpp.prototype.sendState = function(state) {
    var iq = new JSJaCIQ();
    iq.setType('set');
    iq.setQuery(NS_PRIVATE).
        appendChild(
            iq.buildNode(
                'xmpptk',
                {xmlns: xmpptk.xmpp.ns.XMPPTK_STATE},
                state
            )
        );

    this._con.send(iq);
};

xmpptk.xmpp.prototype.sendSubscription = function(jid, type, message) {
    var p = new JSJaCPresence();
    p.setTo((new JSJaCJID(jid)).removeResource());
    p.setType(type);
    if (message) {
        p.setStatus(message);
    }
    this._con.send(p);
};

xmpptk.xmpp.prototype.suspend = function() {
    return this._con.suspend();
};

xmpptk.xmpp.prototype._handleConnected = function() {
    this._p.publish('connected');
    this._p.publish('_login');
};

xmpptk.xmpp.prototype._handleMessage = function(m) {
    if (m.getBody() === '') { // hu?
        return;
    }
    var message =  {
        from  : m.getFromJID().removeResource().toString(),
        body  : m.getBody(),
        ts    : (new Date()).getTime()
    };
    if (m.getType() == 'error') {
        var e = m.getChild('error');
        message = goog.object.extend(
            message,
            {
                error:
                {
                    code: e.getAttribute('code'),
                    type: e.getAttribute('type'),
                    cond: e.firstChild.tagName
                }
            }
        );
    }

    this._p.publish('message', message);
};

xmpptk.xmpp.prototype._handlePresence = function(p) {
    if (p.getFromJID().isEntity(new JSJaCJID(this._con.jid))) {
        // a presence from ourselves
        return;
    }
    if (p.getType() && p.getType().match(/subscribe/)) {
        // it's got to do sth with subscriptions
        return this._p.publish(
            'subscription',
            {
                from    : p.getFromJID().removeResource().toString(),
                type    : p.getType(),
                message : p.getStatus()
            }
        );
    }
    var state = 'available';
    if (p.getType() == 'unavailable') {
        state = 'unavailable';
    } else {
        if (p.getShow() !== '') {
            state = p.getShow();
        }
    }
    this._p.publish(
        'presence',
        {
            from: p.getFrom(),
            presence :
            {
                state   : state,
                message : p.getStatus()
            }
        }
    );
};

xmpptk.xmpp.prototype._handleRosterPush = function(resIQ) {
    goog.array.forEach(
        resIQ.getQuery().children,
        goog.bind(
            function(i, item) {
                this._p.publish(
                    'roster_push',
                    {
                        jid          : item.getAttribute('jid'),
                        name         : item.getAttribute('name'),
                        subscription : item.getAttribute('subscription')
                    }
                );
            },
            this
        )
    );

    // send 'result' reply
    this._con.send(
        new JSJaCIQ().setIQ(
            this._con.domain, 'result', resIQ.getID()
        )
    );
};

xmpptk.xmpp.ns = {
    XMPPTK_STATE: 'xmpptk:state'
};
