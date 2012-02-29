var CollectionView = require('../../../lib/shipyard/view/CollectionView');

module.exports = {
	
	'CollectionView': function(it, setup) {
		it('should know when its empty', function(expect) {
			var v = new CollectionView();
			expect(v.isEmpty()).toBe(true);

            v.addItem('test');
			expect(v.isEmpty()).toBe(false);
		});

		it('should merge itemViewOptions', function(expect) {
			var v = new CollectionView({
				itemViewOptions: {
					'class': 'example'
				}
			});

			expect(v.itemViewOptions.tag).toBe('span');
			expect(v.itemViewOptions['class']).toBe('example');
		});
	}

};
