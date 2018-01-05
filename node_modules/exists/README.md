exists
======

node exists function. plain and simple.

## exists(thing)

returns true for anything other than null or undefined

```js
var exists = require('exists');

exists(null);      // false
exists(undefined); // false
exists({});        // true
exists([]);        // true
exists('');        // true
exists(false);     // true
```

## exists.allExist(thing)

returns true if all arguments are not null or undefined

```js
var allExist = require('exists').allExist;

allExist(null, undefined);   // false
allExist({}, [], '', false); // true
allExist({}, null)  ;        // false
```

## License
MIT