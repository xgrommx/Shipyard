var ServerSync = require('../../../lib/shipyard/sync/Server'),
    Syncable = require('../../../lib/shipyard/sync/Syncable'),
    Class = require('../../../lib/shipyard/class/Class'),
    mockXHR = require('../../../lib/shipyard/test/mockXHR'),
    string = require('../../../lib/shipyard/utils/string');

module.exports = {

    'ServerSync': function(it, setup) {
        var Example = new Class({
            Extends: Syncable,
            Sync: {
                'default': {
                    driver: ServerSync,
                    route: 'foo'
                }
            }
        });
        
        it('should save syncables', function(expect) {
            mockXHR(function(data) {
                data = string.parseQueryString(data);
                expect(data).toBeLike({ foo: 'bar' });
                return data;
            });
            var ex = new Example({ 'foo': 'bar' });
            ex.save();
        });
    }

};
