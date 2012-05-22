# Class: ObservableArray

A class that mimics the entire `Array` interface, but is an
`Observable`. This allows you to treat it like an array, but to also be
able to observe when the Array itself changes.

### Extends

[Observable][]


## Method: constructor

### Syntax

	var arr = new ObservableArray([argsOrArray]);

### Arguments

1. argsOrArray - (_mixed_, optional) An existing array, or any number of
   arguments, or nothing.

## Event: arrayChange

This event will be emitted any time the array changes, such as a value
being added or removed, or a value being overwritten. The property
`array` can be observed for the same effect.

The index of the change, plus the values removed and added starting at
that index, are passed to event listener.

### Example

	var arr = new ObservableArray('a', 'b', 'c');
	arr.observe('array', function(index, removed, added) {
		console.log(index, removed, added);
	});
	arr.push('d'); // logged: 3, [], ['d']

[Observable]: ./observable.md#Observable
