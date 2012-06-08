var CollectionView = require('../../../lib/shipyard/view/CollectionView');
var Observable = require('../../../lib/shipyard/class/Observable');
var ObservableArray = require('../../../lib/shipyard/class/ObservableArray');

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
			expect(v.childViews[0].get('content')).toBe(arr[0]);

			arr.push('qwerty');

			expect(v.childViews[3].get('content')).toBe(arr[3]);
		});

		it('should be able to accept a new array of content', function(expect) {
			var v = new CollectionView({ content: ['foo', 'bar' ] });

			var arr = ['zxcvqwer', 'bazquux', 'cream soda'];
			v.set('content', arr);

			expect(v.render().indexOf(arr[2])).not.toBe(-1);
			expect(v.childViews.length).toBe(arr.length);
		});

		it('should be able to bind to another array', function(expect) {
			var a = new Observable();
			var view = new CollectionView();
			view.bind('content', a.binding('list'));

			var arr = new ObservableArray(1, 2, 3, 4, 5);
			a.set('list', arr);

			expect(view.toElement().getChildren().length).toBe(5);
			
			arr.splice(1, 2);
			expect(view.childViews.length).toBe(3);
			expect(view.childViews[0].get('content')).toBe(arr[0]);
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
