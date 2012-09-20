goog.provide('chat.ChatSession');

goog.require('xmpptk.Model');

/**
 * @constructor
 * @extends {xmpptk.Model}
 */
chat.ChatSession = function(entity) {
    xmpptk.Model.call(this);
    this.entity = entity;
};
goog.inherits(chat.ChatSession, xmpptk.Model);

chat.ChatSession.prototype.handleChatMessage = function(message) {
    this.publish('message', message);
};

chat.ChatSession.prototype.sendMessage = function(body) {
    chat.Client.getInstance().sendMessage(this.entity.getId(), body);
};