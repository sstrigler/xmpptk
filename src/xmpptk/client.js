goog.provide('xmpptk.Client');

goog.require('xmpptk');
goog.require('xmpptk.Config');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.pubsub.PubSub');
goog.require('goog.debug.Logger');

goog.require('goog.json');

/**
 * The actual XMPP connection that wraps all the tricky XMPP stuff.
 * @constructor
 * @extends {goog.pubsub.PubSub}
 * @param {xmpptk.Config} cfg A configuration
 */
xmpptk.Client = function(cfg) {

    goog.pubsub.PubSub.call(this);

    /** @private */
    this._cfg = cfg;

    this.con = new JSJaCHttpBindingConnection(cfg);

    this.con.registerHandler('onconnect',
                              JSJaC.bind(this._handleConnected, this));

    this.con.registerHandler('ondisconnect',
                              JSJaC.bind(function() {
                                  this.publish('disconnected',
                                                  this.con.status() == 'session-terminate-conflict');
                              },this));

    this.con.registerHandler('presence',
                              JSJaC.bind(this._handlePresence, this));

    this.con.registerHandler('message',
                              JSJaC.bind(this._handleMessage, this));

    this.con.registerIQSet('query',
                            NS_ROSTER,
                            JSJaC.bind(this._handleRosterPush, this));

    this.con.registerHandler('packet_in',
                              JSJaC.bind(function(packet) {
                                  this._logger.fine("[IN]: "+packet.xml());
                              }, this));
    this.con.registerHandler('packet_out',
                              JSJaC.bind(function(packet) {
                                  this._logger.fine("[OUT]: "+packet.xml());
                              }, this));
};
goog.inherits(xmpptk.Client, goog.pubsub.PubSub);

/**
 * @type {goog.debug.Logger}
 * @protected
*/
xmpptk.Client.prototype._logger = goog.debug.Logger.getLogger('xmpptk.Client');

xmpptk.Client.prototype.getRoster = function(callback, context) {
    var iq = new JSJaCIQ();
    iq.setType('get');
    iq.setQuery(NS_ROSTER);

    this.con.sendIQ(iq, {
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

xmpptk.Client.prototype.getState = function(callback, context) {
    var iq = new JSJaCIQ();
    iq.setType('get');
    var query = iq.setQuery(NS_PRIVATE);

    query.appendChild(iq.buildNode('xmpptk', {xmlns: xmpptk.Client.ns.XMPPTK_STATE}));

    this.con.sendIQ(iq,
                     {result_handler:
                      function(resIQ) {
                          var state = resIQ.getChildVal('xmpptk', xmpptk.Client.ns.XMPPTK_STATE);
                          xmpptk.call(callback, context, state);
                      }
                     });
};


xmpptk.Client.prototype.isConnected = function() {
    return this.con.connected();
};

xmpptk.Client.prototype.login = function(callback, context) {
    this._logger.info("logging in with: " + goog.json.serialize(this._cfg));
    this.subscribeOnce('_login', callback, context);
    this.con.connect(this._cfg);
};

xmpptk.Client.prototype.logout = function() {
    this.con.disconnect();
};

xmpptk.Client.prototype.resume = function() {
    return this.con.resume();
};

xmpptk.Client.prototype.rosterItemSet = function(item, callback) {
    var iq = new JSJaCIQ();
    iq.setType('set');
    iq.setQuery(NS_ROSTER).appendChild(
        iq.buildNode(
            'item',
            goog.object.extend(item, {xmlns: NS_ROSTER})
        )
    );
    this.con.sendIQ(iq, {error_handler: callback, result_handler: callback});
};

xmpptk.Client.prototype.sendPresence = function(state, message, jid) {
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
    this.con.send(p);
};

xmpptk.Client.prototype.sendMessage = function(jid, message) {
    var m = new JSJaCMessage();
    m.setTo(jid);
    m.setType('chat');
    m.setBody(message);

    this.con.send(m);
};

xmpptk.Client.prototype.sendState = function(state) {
    var iq = new JSJaCIQ();
    iq.setType('set');
    iq.setQuery(NS_PRIVATE).
        appendChild(
            iq.buildNode(
                'xmpptk',
                {xmlns: xmpptk.Client.ns.XMPPTK_STATE},
                state
            )
        );

    this.con.send(iq);
};

xmpptk.Client.prototype.sendSubscription = function(jid, type, message) {
    var p = new JSJaCPresence();
    p.setTo((new JSJaCJID(jid)).removeResource());
    p.setType(type);
    if (message) {
        p.setStatus(message);
    }
    this.con.send(p);
};

xmpptk.Client.prototype.suspend = function() {
    return this.con.suspend();
};

xmpptk.Client.prototype._handleConnected = function() {
    this.publish('connected');
    this.publish('_login');
};

xmpptk.Client.prototype._handleMessage = function(m) {
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

    this.publish('message', message);
};

xmpptk.Client.prototype._handlePresence = function(p) {
    if (p.getFromJID().isEntity(new JSJaCJID(this.con.jid))) {
        // a presence from ourselves
        return;
    }
    if (p.getType() && p.getType().match(/subscribe/)) {
        // it's got to do sth with subscriptions
        return this.publish(
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
    this.publish(
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

xmpptk.Client.prototype._handleRosterPush = function(resIQ) {
    goog.array.forEach(
        resIQ.getQuery().children,
        goog.bind(
            function(i, item) {
                this.publish(
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
    this.con.send(
        new JSJaCIQ().setIQ(
            this.con.domain, 'result', resIQ.getID()
        )
    );
};

xmpptk.Client.ns = {
    XMPPTK_STATE: 'xmpptk:state'
};
