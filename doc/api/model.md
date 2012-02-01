# Class: Model

Models represent the actual data that an application will be using. 
Models also abstract away the specifics of where the data is stored.
Whether you store the data on a server and need Ajax requests to fetch
it, or you store it in the local SQLite database, the public API for 
Models stays the same, so the rest of your application can blissfully
ignorant.


## constructor / initialize

### Syntax

    var model = new Model([data]);

### Arguments

1. data - (_object_, optional) An object of key-value pairs relating to
   the Model's `fields` for the initial data.

## set

### Syntax

    model.set(arguments);

### Arguments

- Two arguments (property, value)
    - property - (_string_) A key corresponding to the same name of one
      of the model's `fields`.
    - value - (_mixed_) The value to set for the speific field.
- One argument (properties)
    - properties - (_object_) An object of key-value pairs that work
      like calling `set` with each pair individually as the two-argument
      path.
