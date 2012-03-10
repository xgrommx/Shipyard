Views
-----

After you've defined your [data models][Models], it's worth thinking
about Shipyard's [View][] system. The goal of the view system is to let
a developer programmatically define the user interface once, and
whenever the underlying data changes, the views update automatically.

This is possible because Models and Views (and Controllers, for that
matter) are [Observable][].

Binding
-------

Computed Properties
-------------------

[Models]: ./models.md#Models
[View]: ../api/views.md#View
[Observable]: ../api/observable.md#Observable
