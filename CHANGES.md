v2.0.0 - Blueberry Pie
----------------------
Introduces breaking changes from 1.0

* the methodsAllowed and ACTIONMethodsAllowed options have been broken compbined into a single object called allowed. Where keys are actions and values are methods to allow.

v1.0.0 - Apple Pie
------------------
Introduce significant breaking changes from 0.X

* Mongoose resource extracted to [external package](https://github.com/esatterwhite/tastypie-mongo)
* Rethink resource extracted to [external package](https://github.com/esatterwhite/tastypie-rethink)
* Resource hydration / dehydration methods now asnycronous
* Removal of several unused validation libraries
