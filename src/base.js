goog.provide('xmpptk');

xmpptk.call = function(fn, context, args) {
    if (context) {
        fn = goog.bind(fn, context);
    }
    try {
        return fn(args);
    } catch(e) { console.error(e); }
    return false;
};