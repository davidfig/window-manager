# window-manager
A javascript-only Window Manager based on Ventus.

## features
* basic windowing experience for building tools (works great with electron!)
* emits events (using eventemitter3)

## TODO
* better API documentation
* more configurable options

## rationale

I used [Ventus](https://github.com/rlamana/Ventus) to build internal editors, but decided I needed a more configurable solution that didn't rely on CSS (I dislike having to manage css files). While window-manager currently has fewer features than Ventus, it's easier to configure and provides a more robust event model (e.g., resize and move events).

## installation

    npm i window-manager

## simple example

    const WM = require('window-manager)

    const wm = new WM()

    const window = wm.createWindow({ width: 500, height: 500, title: 'Test Window' })
    window.open()

## live example
https://davidfig.github.io/window-manager/

## API
### src/window-manager.js
```js
    /**
     * constructor for WindowManager
     */
    constructor()

    /**
     * create window
     * @param {object} [options] see below for options
     */
    createWindow(options)

```
### src/window.js
```js
    /**
     * Create a window
     * @param {WindowManager} wm
     * @param {object} [options]
     * @param {string} [options.title]
     * @param {number} [options.x] position
     * @param {number} [options.y] position
     * @param {number} [options.width]
     * @param {number} [options.height]
     * @param {boolean} [options.movable=true]
     * @param {boolean} [options.resizable=true]
     * @param {boolean} [options.maximizable=true]
     * @param {boolean} [options.minimizable=true]
     * @param {boolean} [options.closable=true]
     * @param {boolean} [options.titlebar=true]
     * @param {boolean} [options.titlebarHeight=36px]
     * @param {number} [options.minHeight]
     * @param {number} [options.animateTime]
     * @param {object} [options.colors]
     * @param {string} [options.colors.backgroundColorWindow=#fefefe]
     * @param {string} [options.colors.backgroundColorTitlebarActive=#365d98]
     * @param {string} [options.colors.backgroundColorTitlebarInactive=#888888]
     * @param {string} [options.colors.foregroundColorButton=#ffffff]
     * @param {string} [options.colors.foregroundColorTitle=#ffffff]
     */
    constructor(wm, options)

    /**
     * show maximize button
     * @type {boolean}
     */
    get maximizable() { return this._maximizable }

    /**
     * show minimize button
     * @type {boolean}
     */
    get minimizable() { return this._minimizable }

    /**
     * show close button
     * @type {boolean}
     */
    get closable() { return this._closable }

    /**
     * set animation time
     * @type {number}
     */
    get animateTime() { return this._animateTime }

    /**
     * open the window
     * @param {boolean} [noFocus] do not focus window when opened
     */
    open(noFocus)

    /**
     * focus the window
     */
    focus()

    /**
     * blur the window
     */
    blur()

    /**
     * closes the window (can be reopened with open) if a reference is saved
     */
    close()

    /**
     * left coordinate
     * @type {number}
     */
    get x() { return this._x }

    /**
     * top coordinate
     * @type {number}
     */
    get y() { return this._y }

    /**
     * width of window
     * @type {number}
     */
    get width() { return this._width }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this._height }

    /**
     * colors
     * @param {object} options
     * @param {string} [options.backgroundColorWindow]
     * @param {string} [options.backgroundColorTitlebarActive]
     * @param {string} [options.backgroundColorTitlebarInactive]
     * @param {string} [options.foregroundColorButton]
     */
    setColors(options)

    /**
     * resize the window
     * @param {number} width
     * @param {number} height
     */
    resize(width, height)

    /**
     * move window
     * @param {number} x
     * @param {number} y
     */
    move(x, y)

    /**
     * minHeight for window
     * @type {number}
     */
    get minHeight() { return this._minHeight }

    /**
     * @type {boolean}
     */
    get movable() { return this._movable }

    /**
     * @type {boolean}
     */
    get resizable() { return this._resizable }

    /**
     * whether title bar is visible
     * @type {boolean}
     */
    get titlebar() { return this._titlebar }

// 		/**
// 		 * @return A function that restores this window
// 		 */
// 		stamp: function() {

```
## License  
MIT License  
(c) 2017 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
