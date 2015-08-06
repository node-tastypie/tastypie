v2.0.1
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
