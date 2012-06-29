var Accessor = require('../../../lib/shipyard/utils/Accessor');

module.exports = {

    'Accessor': function accessorTest(it, setup) {
        it('should be able to define and lookup', function(expect) {
            var foo = {};
            Accessor.call(foo, 'Mock');
            foo.defineMock('bar', 'baz');
            expect(foo.lookupMock('bar')).toBe('baz');
        });

        it('should not lookup native properties', function(expect) {
            var foo = {};
            Accessor.call(foo, 'Mock');
            expect(foo.lookupMock('toString')).toBeUndefined();
        });
    }

};
