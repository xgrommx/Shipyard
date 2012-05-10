# Class: Field

All properties on a Model are stored via the help of Fields. Data is
stored with primitive values, but Fields can convert the data to useful
data formats.

## Method: constructor

Creates a Field instance.

### Syntax

	var field = new Field([options]);

### Arguments

- options - (_object_, optional)

### Options

- default - (_boolean_) The default value this Field should return if no
  value is provided.
- required - (_boolean_) Whether a value must be defined in order to
  pass validation and save.
- write - (_boolean_) Whether this field should be serialized when the
  Model is saved. Default is true.

## Method: from

Accepts a raw value, and converts it into a JavaScript value that gets
stored on the model, and is returned by `model.get(field)`.

New `Field` types should likely override this method.

### Example

	//date should a `Date` object
	var date = dateField.from('2012-02-01 06:54:22');

## Method: serialize

Accepts a JavaScript value, such as a Date object, and returns a value
that can be serialized into JSON.

### Example
	
	//str should be a string, or perhaps a Number of the millis.
	var str = dateField.serialize(new Date());

# Class: TextField

A field that makes sure it's value is always a String.

### Extends

Field

### Options

- all options from `Field`, plus:
- maxLength - (_number_, optional) Signifies a maximum length that will
  trigger a ValidationError upon validating.
- minLength - (_number_, optional) Similar to `maxLength`, but a minimum
  boundary.


# Class: NumberField

A field that ensures it's value is always a Number.

### Extends

Field

# Class: BooleanField

A field that ensures it's value is always a Boolean.

### Extends

Field

# Class: DateField

A field that makes sure it's value is always a Date object.

### Extends

Field

## Options

- all options from `Field`, plus:
- auto - (_boolean_, optional) Automatically store the current date upon
  saving. Useful for last-modified type fields.
