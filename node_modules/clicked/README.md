# clicked
Javascript handler for clicks, double-clicks, and/or long-clicks that works for both mouse and touch

## changes in version 3
Version 3 introduces long clicks and double clicks. See the example below. Note the changed usage since the library is now compiled with rollup.

## usage
```import { clicked } from 'clicked'```

or

```const clicked = require('clicked').clicked```

## rationale

I wanted to create a vanilla javascript way to handle mouse and touch clicks, double-clicks, and long-clicks.

## example
```js
import { clicked } from 'clicked'

function handleClick()
{
   console.log('I was clicked.')
}
const div = document.getElementById('clickme')
const c = clicked(div, handleClick, { threshold: 15 })

// change callback
c.callback = () => console.log('different clicker')

// destroy
c.destroy()

// using built-in querySelector
clicked('#clickme', handleClick2)

// support for all types of clicks
function handleAllClicks(e) {
    switch (e.type)
    {
        case 'clicked': ...
        case 'double-clicked': ...
        case 'long-clicked': ...
    }
    // view UIEvent that caused callback
    console.log(e.event)
}
clicked('#clickme', handleAllClicks, { doubleClick: true, longClick: true })
```

## API

### clicked(element, callback, options) : Clicked
creates Clicked object for element

|name|type|default|description
|---|---|---|---|
|element|HTMLElement or string||element or querySelector entry (e.g., #id-name or .class-name)|
|callback|ClickedCallback||callback called after clicked
|options|object||optional options|
|options.threshold|number|10|cancels click event when touch or mouse moves more than threshold
|options.doubleClick|boolean|false|enable watcher for double click
|options.doubleClickTime]|number|500|wait time in millseconds for double click
|options.longClick]|boolean|false|enable watcher for long click
|options.longClickTime]|boolean|500|wait time for long click

### Clicked
returned by clicked(...)

### Clicked.destroy()
removes event listeners on element

### Clicked.callback (function): ClickedCallback

|name|type|description
|---|---|---|
|event|UIEvent|last UIEvent that triggered callback|
|type|'clicked' or 'double-clicked' or 'long-clicked'|type of click|

### Clicked.cancel()
cancel any outstanding events

## tests
```yarn test```

Open browser to https://localhost:1234/

## license  
MIT License  
(c) 2019 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
