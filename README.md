ObSy
====


## atomic ObjectSync across nodeJS processes
The idea behind ObSy is that there are many cases where one has different nodeJS processes that need to share 'memory'.
ObSy greatly simplifies sharing a namespace/object between processes by turining the task into 1 line of code.


### how ObSy works
ObSy uses the observed library (the new/upcoming ECMA harmony Object.observe method) to handle changes to a local namespace. Those changes are then sent to a redis for persistence and, via publish/subscribe, to other processes that registered the same namespace.
Changes are encoded, so that they are (pseudo-) atomic, meaning that changes to a deep property does not require syncing the compelte object. 


### limitations
- Functions are not synced (no plan of supporting that any time soon). 
- Special objects (using non-standard constructors like e.g. mongoDB ObjectID, ...) are not synced correctly. I am planning to include a 'plugin' system that will allow anybody to handle special object types.
- when using a direct set to the observed namespace will simply wipe the ObSy handler and thus break the sync.


### requirements
ObSy needs nodeJS 0.11+ to work (harmony required to allow Object.observe) and a redis instance reachable from all processes that want to sync and object


### version
ObSy is very early and hardly tested. Tests are next on the ToDo list (see issues).


### installing
````
npm install obsy
````


### tests
````
make test
````


### example
````
var ObSy = require('obsy');
var someParentNamespace = {
	syncedObject: {}
};
var myObjectSync = new ObSy('theNameOfYourSyncGroup', someParentNamespace.syncedObject);
````


### demo
assuming you have n installed AND screen / multiple terminals running AND a local redis instance :
````
$ cd demo
$ n use 0.11.12 --harmony node0.js
// switch to new terminal quickly !
$ n use 0.11.12 --harmony node1.js
// with debug active you will see both nodes syncing the demo namespace ... 
// kind of feels like magic to me ;)
````

