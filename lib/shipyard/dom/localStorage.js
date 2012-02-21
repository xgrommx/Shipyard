var dom = require('./');

module.exports = dom.window.get('localStorage');

//<node>
if (!module.exports) {
    var store = {};
    module.exports = {
        getItem: function(key) {
            return key in store ? store[key] : null;
        },
        setItem: function(key, value) {
            store[key] = value;
        },
        clear: function() {
            store = {};
        }
    };
}
//</node>
