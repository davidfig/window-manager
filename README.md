# simple-window-manager
A javascript-only Window Manager

## features
* basic windowing experience (works great with electron to run multiple windows under one process)
* create normal and modal windows
* optionally snap windows to screen edges and/or other windows
* takes advantage of all the features of the DOM, including undefined width and/or height to automatically adjust size of window based on content
* windows may be resized, maximized, and minimized
* minimize works by minimizing to a small square that can be moved independently. Clicking it restores to its original size and location. Minimizing again moves the small square back to the last minimized location.
* can save and load windowing state (e.g., using localStorage or json files using Electron)
* emits events (using eventemitter3)
* uses javascript animations instead of CSS

## rationale

I used [Ventus](https://github.com/rlamana/Ventus) to build internal tools and editors, but I wanted a more configurable solution with a better event model that didn't rely on CSS.

## live example
[https://davidfig.github.io/window-manager/](https://davidfig.github.io/window-manager/)

## installation

    npm i simple-window-manager

## API documentation
[https://davidfig.github.io/window-manager/jsdoc/](https://davidfig.github.io/window-manager/jsdoc/)

## simple example
```js
    var WM = require('simple-window-manager');

    // this is the window manager with one of the default options changed
    var wm = new WM({ backgroundColorWindow: 'green' });

    // enable window snapping to screen edges and other windows when moving
    wm.snap()

    // create a window    
    var window = wm.createWindow({ width: 500, height: 500, title: 'Test Window' });

    // set content of window
    window.content.style.margin = '10px';
    window.content.innerHTML = 'This is a nifty window.';

    // open the window
    window.open();
```

## License  
MIT License  
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
