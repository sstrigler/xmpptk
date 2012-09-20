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

/**
 * set a config value
 * @param {string|object} key either the name of the key to be set or an object of keys and values
 * @param {string} value the value for the key to be set
 */
xmpptk.setConfig = function(key, value) {
    if (typeof key == 'object') goog.object.forEach(key, function(v,k) {xmpptk.setConfig(k,v); });
    else xmpptk.Config[key] = value;
};