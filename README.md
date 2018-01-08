# simple-window-manager
A javascript-only Window Manager based on Ventus.

## features
* basic windowing experience (works great with electron!)
* create normal and modal windows
* takes advantage of the DOM to allow an undefined width and/or height to automatically adjust size of window based on content
* windows may be resized, maximized, and minimized
* minimize works by minimizing to a small square that can be moved independently. Clicking it restores to its original size and location. Minimizing again moves the small square back to the last minimized location.
* emits events (using eventemitter3)
* uses javascript animations instead of CSS

## rationale

I used [Ventus](https://github.com/rlamana/Ventus) to build internal editors, but decided I needed a more configurable solution that didn't rely on CSS for configuration so it's easier to use with npm.

## live example
[https://davidfig.github.io/window-manager/](https://davidfig.github.io/window-manager/)

## installation

    npm i simple-window-manager

## API documentation
[https://davidfig.github.io/window-manager/jsdoc/](https://davidfig.github.io/window-manager/jsdoc/)

## simple example
```js
    const WM = require('window-manager)

    const wm = new WM({ backgroundColorWindow: 'green' })

    const window = wm.createWindow({ width: 500, height: 500, title: 'Test Window' })
    window.content.style.margin = '10px'
    window.content.innerHTML = 'This is a nifty window.'
    window.open()
```

## License  
MIT License  
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
