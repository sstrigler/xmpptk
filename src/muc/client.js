goog.provide('muc.Client');

goog.require('xmpptk.muc.Client');

muc.Client = function() {
    xmpptk.muc.Client.call(this);
};
goog.inherits(muc.Client, xmpptk.muc.Client);