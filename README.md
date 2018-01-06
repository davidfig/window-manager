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
https://davidfig.github.io/window-manager/

## installation

    npm i simple-window-manager

## simple example

    const WM = require('window-manager)

    const wm = new WM({ backgroundColorWindow: 'green' })

    const window = wm.createWindow({ width: 500, height: 500, title: 'Test Window' })
    window.content.style.margin = '10px'
    window.content.innerHTML = 'This is a nifty window.'
    window.open()

## API
### src/window-options.js
```js
/**
 * @typedef WindowOptions
 * @type {object}
 * @property {number} [x=0]
 * @property {number} [y=0]
 * @property {number} [width]
 * @property {number} [height]
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
 * @property {number} [minimizeSize=50]
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
     * @fires maximize-restore
     * @fires minimize
     * @fires minimize-restore
     * @fires move
     * @fires move-start
     * @fires move-end
     * @fires resize
     * @fires resize-start
     * @fires resize-end
     */
    createWindow(options)

    /**
     * send window to front
     * @param {Window} win
     */
    sendToFront(win)

    /**
     * send window to back
     * @param {Window} win
     */
    sendToBack(win)

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
    get width() { return this.options.width || this.win.offsetWidth }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this.options.height || this.win.offsetHeight }

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
     * sends window to back of window-manager
     */
    sendToBack()

    /**
     * send window to front of window-manager
     */
    sendToFront()

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
     * @event maximize-restore
     * @type {Window}
     */


    /**
     * Fires when window is restored to normal after being minimized
     * @event minimize-restore
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


```
## License  
MIT License  
(c) 2018 [YOPEY YOPEY LLC](https://yopeyopey.com/) by [David Figatner](https://twitter.com/yopey_yopey/)
