goog.provide('chat');

goog.require('goog.object');

goog.require('goog.events.EventType');

goog.require('goog.debug.Logger');
goog.require('goog.debug.Logger.Level');
goog.require('goog.debug.LogManager');
goog.require('goog.debug.Console');

goog.require('xmpptk.Config');

goog.require('chat.Client');

/**
 * @param {xmpptk.Config} cfg a configuration 
 * @param {object} opt_cfg another configuration 
 */
chat.load = function(cfg, opt_cfg) {
    goog.object.extend(xmpptk.Config, cfg);

    if (xmpptk.getConfig('debug')) {
        goog.debug.LogManager.getRoot().setLevel(
            goog.debug.Logger.Level[
                xmpptk.getConfig('log_level', 'ALL')
            ]);
        var logconsole = new goog.debug.Console();
        logconsole.setCapturing(true);
    }

    var client = chat.Client.getInstance();
    client.login(opt_cfg, function() {
        goog.events.listen(
            window,
            goog.events.EventType.UNLOAD,
            function() {client.logout(); });
    });
};
goog.exportSymbol('chat.load', chat.load);
