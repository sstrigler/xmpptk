goog.provide('chat.Client');

goog.require('xmpptk.Client');

goog.require('chat.ChatSession');
goog.require('chat.ui.Client');
goog.require('chat.ui.ChatSession');

/**
 * @constructor
 * @extends {xmpptk.Client}
 */
chat.Client = function(cfg) {
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

/**
 * @inheritDoc
 */
chat.Client.prototype.login = function(cfg, callback) {
    if (!cfg || cfg['username'] === '' || cfg['pass'] === '')
        return alert('Please supply username and password in order to login');
    
    if (cfg['username'].indexOf('@') != -1) {
        var tmp = cfg['username'].split('@');
        cfg['username'] = tmp[0];
        cfg['domain'] = tmp[1];
    }

    goog.object.extend(xmpptk.Config, cfg);

    goog.base(this, 'login', function() {
        this.publish('loggedIn');

        this.getRoster(function() {
            this.sendPresence('available');
        }, this);

        if (typeof callback == 'function')
            callback();
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