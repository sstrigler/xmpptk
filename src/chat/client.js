goog.provide('chat.Client');

goog.require('xmpptk.Client');

goog.require('chat.ChatSession');
goog.require('chat.ui.Client');
goog.require('chat.ui.ChatSession');

/**
 * @constructor
 * @extends {xmpptk.Client}
 */
chat.Client = function() {
    xmpptk.Client.call(this); // call superclass
    new chat.ui.Client(this);

    this._chatSessions = {};
    this.subscribe('message', this._handleChatMessage, this);
};
goog.inherits(chat.Client, xmpptk.Client);
goog.addSingletonGetter(chat.Client);

/**
 * @type {goog.debug.Logger}
 * @protected
 */
chat.Client.prototype._logger = goog.debug.Logger.getLogger('chat.Client');

chat.Client.prototype.login = function(callback, context) {
    if (!xmpptk.getConfig('username') || !xmpptk.getConfig('password')) {
        this.publish('login', {'callback': callback,
                               'context': context});
        return;
    }

    if (xmpptk.getConfig('username').indexOf('@') !== -1) {
        var split = xmpptk.getConfig('username').split('@');
        xmpptk.setConfig({'username':  split[0],
                          'domain': split[1]});
    }

    goog.base(this, 'login', function() {
        this.publish('loggedIn');

        this.getRoster(function() {
            this.sendPresence('available');
        }, this);

        if (typeof callback == 'function')
            xmpptk.call(callback, context);
    }, this);
};

chat.Client.prototype.addChatSession = function(jid) {
    this._chatSessions[jid] = new chat.ChatSession(this.roster.getItem(jid));
    this.publish('chatSession', this._chatSessions[jid]);
};

chat.Client.prototype._handleChatMessage = function(message) {
    if (!this._chatSessions[message['from']]) {
        this.addChatSession(message['from']);
    }
    this._chatSessions[message['from']].handleChatMessage(message);
};
