# simple-window-manager
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

    npm i simple-window-manager

## simple example

    const WM = require('window-manager)

    const wm = new WM()

    const window = wm.createWindow({ width: 500, height: 500, title: 'Test Window' })
    window.open()

## live example
https://davidfig.github.io/window-manager/

## API
### src/window-options.js
```js
/**
 * @typedef WindowOptions
 * @type {object}
 * @property {number} [x=0]
 * @property {number} [y=0]
 * @property {number} [width=400]
 * @property {number} [height=200]
 * @property {boolean} [movable=true]
 * @property {boolean} [resizable=true]
 * @property {boolean} [maximizable=true]
 * @property {boolean} [minimizable=true]
 * @property {boolean} [closable=true]
 * @property {boolean} [titlebar=true]
 * @property {string} [titlebarHeight=36px]
 * @property {string} [minWidth=200px]
 * @property {string} [minHeight=60px]
 * @property {string} [borderRadius=4px]
 * @property {string} [shadow='0 0 12px 1px rgba(0, 0, 0, 0.6)']
 * @property {number} [animateTime=250]
 * @property {string} [backgroundColorWindow=#fefefe]
 * @property {string} [backgroundColorTitlebarActive=#365d98]
 * @property {string} [backgroundColorTitlebarInactive=#888888]
 * @property {string} [foregroundColorButton=#ffffff]
 * @property {string} [foregroundColorTitle=#ffffff]
 * @property {string} [backgroundMinimizeButton=...]
 * @property {string} [backgroundMaximizeButton=...]
 * @property {string} [backgroundCloseButton=...]
 * @property {string} [backgroundResize=...]
 */
const WindowOptions = {

```
### src/window-manager.js
```js
    /**
     * @param {WindowOptions} [defaultOptions] default WindowOptions used when createWindow is called
     */
    constructor(defaultOptions)

    /**
     * Create a window
     * @param {WindowOptions} [options]
     * @param {string} [options.title]
     * @param {number} [options.x] position
     * @param {number} [options.y] position
     * @param {boolean} [options.modal]
     * @param {Window} [options.center] center in the middle of an existing Window
     * @fires open
     * @fires focus
     * @fires blur
     * @fires close
     * @fires maximize
     * @fires restore
     * @fires move
     * @fires move-start
     * @fires move-end
     * @fires resize
     * @fires resize-start
     * @fires resize-end
     */
    createWindow(options)

```
### src/window.js
```js
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
    get x() { return this.options.x }

    /**
     * top coordinate
     * @type {number}
     */
    get y() { return this.options.y }

    /**
     * width of window
     * @type {number}
     */
    get width() { return this.options.width }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this.options.height }

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
     * maximize the window
     */
    maximize()

    /**
     * change title
     * @type {string}
     */
    get title() { return this._title }

    /**
     * Fires when window is maximized
     * @event maximize
     * @type {Window}
     */


    /**
     * Fires when window is restored to normal after being maximized
     * @event restore
     * @type {Window}
     */


    /**
     * Fires when window opens
     * @event open
     * @type {Window}
     */


    /**
     * Fires when window gains focus
     * @event focus
     * @type {Window}
     */
    /**

    /**
     * Fires when window closes
     * @event close
     * @type {Window}
     */


    /**
     * Fires when resize starts
     * @event resize-start
     * @type {Window}
     */


    /**
     * Fires after resize completes
     * @event resize-end
     * @type {Window}
     */


    /**
     * Fires during resizing
     * @event resize
     * @type {Window}
     */


    /**
     * Fires when move starts
     * @event move-start
     * @type {Window}
     */


    /**
     * Fires after move completes
     * @event move-end
     * @type {Window}
     */


    /**
     * Fires during move
     * @event move
     * @type {Window}
     */


// 		/**
// 		 * @return A function that restores this window
// 		 */
// 		stamp: function() {

```
## License  
MIT License  
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
