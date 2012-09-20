goog.provide('xmpptk.Config');

xmpptk.Config = {
    'httpbase': '/http-bind/',
    'domain':   'localhost',
    'resource': 'xmpptk'
};

/**
 * get a config value
 * @param {string} key the key to retrieve
 * @param {?object} opt_default a default value to be returned if key is not found
 */
xmpptk.getConfig = function(key, opt_default) {
    if (typeof xmpptk.Config[key] != 'undefined') {
        return xmpptk.Config[key];
    } else if (typeof opt_default != 'undefined') {
        return opt_default;
    }
};