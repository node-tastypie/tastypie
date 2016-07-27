v5.0.0 - Escarole Pie
------
* [BREAKING] The serializer creates an internal mime instance
* [BREAKING] remove `options` from the serialize method stack
* Make the serializer parser and mime objects hidden props
* adding support for strict xml arrays
* Moving the api plugin handler out of the constructor
* update mime module to be a class

v4.0.0 - Derby Pie
------

* Changes behavior in full_hydrate for patch requests allowing for partial updates
* Fixes an async bug in field dehydration where if called from a subclass, function calls may not finish before a second iteration begins causing parent chain problems
* Http helpers allow for an empty body be sending data as null
* Adds support for OPTIONS requests for List / Detail actions
* Better help text for the auto id & uri fields
* bugfix when using a serializer on an API instance crashes on node v6
* Better handling of partial updates for PATCH requests
* cache option on resource is no a config object instead of a cache instance


v3.2.1 - Cherry Pie
------

* Bug that didn't allow the use of the ALL constant in the filters definition. Joi doesn't support symbols

v3.2.0 - Cherry Pie
------

* Includes a default DELETE implementation using the internal remove_object function to perform deletion
* remove the unused prime-util module
* include bug fixes from 2.3

v3.1.1 - Cherry Pie
------

* Fixes bug in field hydrate where the default functions were being passed bundle.object instead of data

v3.1.0 - Cherry Pie
------

* Passes raw data to field default functions

v3.0.0 - Cherry Pie
------
* Default resources handle deserializtion rather than delegating

v2.3.0 - Blueberry Pie
------
* field defaults are passed the object being hydrated if default is a function

v2.2.0 - Blueberry Pie
------

* post_list performs deserialization
* field attributes can contain fals-y values
* char fields allow for an enum and validate against values

v2.1.5 - Blueberry Pie
------
* corrects array field hydration
* Adds better hydration on datetime fields
* Rework on event emitter inheritance on base resource

v2.1.0 - Blueberry Pie
------
* removes strict validation from filter configurlation
* corrects an bad scope references


v2.0.3 - Blueberry Pie
------

* fixes non enumerable properties on fields - resource and name. They were lost on related fields

v2.0.2 - Blueberry Pie
------

* Bug with the defition of the querystring joi validator

v2.0.1 - Blueberry Pie
------

* bug fix where resource mixins did not propogate errors in all known situations. 

v2.0.0 - Blueberry Pie
----------------------
Introduces breaking changes from 1.0

* the methodsAllowed and ACTIONMethodsAllowed options have been broken compbined into a single object called allowed. Where keys are actions and values are methods to allow.
* Remove all underscore methods on internal resource methods
* break resource into logical mixins
* replace all setTimeout of 0 with process.nextTick

v1.0.0 - Apple Pie
------------------
Introduce significant breaking changes from 0.X

* Mongoose resource extracted to [external package](https://github.com/esatterwhite/tastypie-mongo)
* Rethink resource extracted to [external package](https://github.com/esatterwhite/tastypie-rethink)
* Resource hydration / dehydration methods now asnycronous
* Removal of several unused validation libraries
