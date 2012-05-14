var CollectionView = require('../../../lib/shipyard/view/CollectionView');

module.exports = {
	
	'CollectionView': function(it, setup) {
		it('should know when its empty', function(expect) {
			var v = new CollectionView();
			expect(v.isEmpty()).toBe(true);

            v.addItem('test');
			expect(v.isEmpty()).toBe(false);
		});

		it('should be able to add items', function(expect) {
			var v = new CollectionView();
			var content = 'very unique text here';
			v.addItem(content);

			expect(v.render().indexOf(content)).not.toBe(-1);
		});

		it('should be able to remove items', function(expect) {
			var content = 'some more uniquetastic text';
			var v = new CollectionView({ content: [content] });
			
			v.removeItem(content);
			expect(v.get('content').length).toBe(0);
			expect(v.render().indexOf(content)).toBe(-1);
		});

		it('should change if part of the content changes', function(expect) {
			var arr = ['qqqq', 'xxxx', 'zzzz'];
			var v = new CollectionView({ content: arr });
			arr = v.get('content');

			arr.splice(0, 1, 'yyyy');

			expect(v.render().indexOf('qqqq')).toBe(-1);
			expect(v.toElement().getFirst().get('text').trim()).toBe(arr[0]);
		});

		it('should be able to accept a new array of content', function(expect) {
			var v = new CollectionView({ content: ['foo', 'bar' ] });

			var arr = ['zxcvqwer', 'bazquux', 'cream soda'];
			v.set('content', arr);

			expect(v.render().indexOf(arr[2])).not.toBe(-1);
			expect(v.toElement().getChildren().length).toBe(arr.length);
		});

		/*it('should show an empty view when empty', function(expect) {
			var v = new CollectionView();
			v.render();
			expect(v.toElement())
		});*/

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
