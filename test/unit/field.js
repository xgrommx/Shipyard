var Class = require('../../lib/shipyard/class/Class'),
	Model = require('../../lib/shipyard/model/Model'),
	fields = require('../../lib/shipyard/model/fields'),
	Field = fields.Field,
    BooleanField = fields.BooleanField,
    DateField = fields.DateField,
    NumberField = fields.NumberField,
    TextField = fields.TextField,
	ForeignKey = fields.ForeignKey,
    ManyToManyField = require('../../lib/shipyard/model/fields/ManyToManyField');

module.exports = {
	'Field': function(it, setup) {
		
		it('should get default values', function(expect) {
			var field = new Field({ 'default': 'test' });

			expect(field.serialize()).toBe('test');
			expect(field.serialize('derp')).toBe('derp');
		
		});
		
	},

    'BooleanField': function(it, setup) {
        var field;
        setup('beforeEach', function() {
            field = new BooleanField();
        });
        
        it('should accept boolean values', function(expect) {
            expect(field.from(true)).toBe(true);
            expect(field.from(false)).toBe(false);
        
        });
        
        it('should convert 1 and 0 to boolean types', function(expect) {
            expect(field.from(0)).toBe(false);
            expect(field.from(1)).toBe(true);
        });

        it('should convert "true" and "false" strings', function(expect) {
            expect(field.from('true')).toBe(true);
            expect(field.from('false')).toBe(false);
        });

        it('should not convert null', function(expect) {
            expect(field.from(null)).toBe(null);
        });
    },

	'DateField': function(it, setup) {
        var field;
        setup('beforeEach', function() {
            field = new DateField();
        });
        
        it('should accept Date objects', function(expect) {
            var d = new Date();
            expect(field.from(d)).toBe(d);
        });

        it('should accept Unix timestamps', function(expect) {
            var d = new Date();
            // new Date's cant be ==, so test value is date, and same
            // getTime()
            var val = field.from(d.getTime());
            expect(val).toBeAnInstanceOf(Date);
            expect(val.getTime()).toBe(d.getTime());
        });

		it('should accept standard timestamps', function(expect) {
			var val = field.from('2012-03-08T15:12:36');
			expect(val).toBeAnInstanceOf(Date);
			expect(val.getTime()).toBe(1331219556000);
		});

        it('should not convert null', function(expect) {
            expect(field.from(null)).toBe(null);
        });
	
	},

    'NumberField': function(it, setup) {
        var field;
        setup('beforeEach', function() {
            field = new NumberField();
        });
        
        it('should accept number values', function(expect) {
            expect(field.from(3)).toBe(3);
        });
        
        it('should parse numbers from strings', function(expect) {
            expect(field.from('21')).toBe(21);
            expect(field.from(' 12')).toBe(12);
        });

        it('should not convert null', function(expect) {
            expect(field.from(null)).toBe(null);
        });
    },

    'TextField': function(it, setup) {
        var field;
        setup('beforeEach', function() {
            field = new TextField();
        });
        
        it('should accept string values', function(expect) {
            expect(field.from('a test')).toBe('a test');
        });

        it('should convert numbers', function(expect) {
            expect(field.from(13)).toBe('13');
            expect(field.from(0)).toBe('0');
        });

        it('should convert booleans', function(expect) {
            expect(field.from(true)).toBe('true');
            expect(field.from(false)).toBe('false');
        });

        it('shouldn\'t convert null', function(expect) {
            expect(field.from(null)).toBe(null);
        });
    
    },

	'ForeignKey': function(it, setup) {
		var field, Example;
		setup('beforeEach', function() {
			Example = new Class({
				Extends: Model,
				fields: {
					id: NumberField(),
					other: TextField()
				}
			});
			field = new ForeignKey(Example);
		});
		
		it('should accept a pk', function(expect) {
			var ex = new Example({ pk: 3 });

			expect(field.from(3)).toBe(ex);
		});

		it('should return a new, empty instance if not in cache', function(expect) {
			var ex = field.from(99);
			expect(ex).toBeAnInstanceOf(Example);
		});

		it('should serialize to the pk option', function(expect) {
			var ex = new Example({ pk: 2, other: 'foo' });

			expect(field.serialize(ex)).toBe(2);

			var field2 = new ForeignKey(Example, { key: 'other' });
			expect(field2.serialize(ex)).toBe('foo');
		});

		it('should serialize entire model with option', function(expect) {
			var ex = new Example({ pk: 5, other: 'bar' });
			var f = new ForeignKey(Example, { serialize: 'all' });

			expect(f.serialize(ex)).toBeLike({ id: 5, other: 'bar' });
		});

        it('should accept JSON for the related Model', function(expect) {
            var ex2 = field.from({ pk: 6, other: 'baz' });
            expect(ex2.get('other')).toBe('baz');
        });

        it('should return a Model if passed a Model', function(expect) {
            var ex = new Example({ pk: 11 });
            expect(field.from(ex)).toBe(ex);
        });
	},

    'ManyToManyField': function(it, setup) {
        // model.get('foos') -> [Foo, Foo, Foo]
        // model.set('foos', [3, 4, 7]) -> [Foo:3, Foo:4, Foo:7]
        // model.set('foos', [Foo:2, Foo:5]) -> [Foo:2, Foo:5]
        // model.set('foos', [{pk:7}]) -> [Foo:7]
        
        var field,
            Example,
            counter = 1;

		var SLICE = Array.prototype.slice;
        setup('beforeEach', function() {
            Example = new Class({
                Extends: Model,
                fields: {
                    id: NumberField(),
                    name: TextField()
                }
            });
            field = new ManyToManyField(Example);
        });

        it('should get an array of Models', function(expect) {
            var ex = new Example({ id: counter++, name: 'foo' });
            var id = ex.get('id');

            expect(SLICE.call(field.from([id]))).toBeLike([ex]);
            expect(SLICE.call(field.from([ex]))).toBeLike([ex]);
        });

        it('should accept an array of JSON', function(expect) {
            var ex = field.from([{ id: counter++, name: 'foo' }])[0];
            expect(ex).toBeAnInstanceOf(Example);
            expect(ex.get('name')).toBe('foo');
        });

        it('should serialize to array of pks', function(expect) {
            var ex1 = new Example({ id: 1 }),
                ex2 = new Example({ id: 2 });

            expect(field.serialize([ex1, ex2])).toBeLike([1, 2]);
        });

        it('should be able to serialize all', function(expect) {
            var ex1 = new Example({ id: counter++, name: 'sean' });
            var allField = new ManyToManyField(Example, {
                serialize: 'all'
            });

            expect(allField.serialize([ex1])).toBeLike([{
                id: ex1.get('id'),
                name: 'sean'
            }]);
        });
    }
};
