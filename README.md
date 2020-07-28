# simple-window-manager
A javascript-only Window Manager

## version 2
* integrated yy-menu to provide an optional application-level menu
* integrated accelerator from yy-menu to provide keyboard accelerator experience
* the API has changed from v1 to v2
* rollup is used to compile the libraries, so there is no longer a default export: see sample code below
* animations are deprecated for now since they felt slow--I'm open to putting them back in
* finally moved away from `style.left` and `style.top` to `transform: translate(x, y)` (should have done this sooner)
* snapping working much better; screen snapping now optionally responds to window resize
* minimize has been removed since it does the same thing as close (unless we add a taskbar)

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

    yarn add simple-window-manager

## API documentation
[https://davidfig.github.io/window-manager/jsdoc/](https://davidfig.github.io/window-manager/jsdoc/)

## sample code
```js
    import { WindowManager } from 'simple-window-manager'
    // or const WindowManager = require('simple-window-manager').WindowManager

    // this is the window manager with one of the default options changed
    const wm = new WindowManager({ backgroundWindow: 'green', snap: true })

    // create a window
    const window = wm.createWindow({ width: 500, height: 500, title: 'Test Window' })

    // set content of window
    window.content.style.margin = '10px'
    window.content.innerHTML = 'This is a nifty window.'
```

## License
MIT License
(c) 2020 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](david@yopeyopey.com)