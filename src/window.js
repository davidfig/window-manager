const Events = require('eventemitter3')
const clicked = require('clicked')
const Ease = require('../../dom-ease')
const exists = require('exists')

const html = require('./html')

let id = 0

/**
 * Window class returned by WindowManager.createWindow()
 * @extends EventEmitter
 * @hideconstructor
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
 * @fires move-x
 * @fires move-y
 * @fires resize-width
 * @fires resize-height
 */
class Window extends Events
{
    /**
     * @param {WindowManager} wm
     * @param {object} options
     */
    constructor(wm, options)
    {
        super()
        this.wm = wm

        this.options = options

        this.id = exists(this.options.id) ? this.options.id : id++

        this._createWindow()
        this._listeners()

        this.active = false
        this.maximized = false
        this.minimized = false

        this._closed = true
        this._restore = null
        this._moving = null
        this._resizing = null

        this.ease = new Ease({ duration: this.options.animateTime, ease: this.options.ease })
    }

    /**
     * open the window
     * @param {boolean} [noFocus] do not focus window when opened
     * @param {boolean} [noAnimate] do not animate window when opened
     */
    open(noFocus, noAnimate)
    {
        if (this._closed)
        {
            this.emit('open', this)
            this.win.style.display = 'block'
            if (!noAnimate)
            {
                this.win.style.transform = 'scale(0)'
                this.ease.add(this.win, { scale: 1 })
            }
            this._closed = false
            if (!noFocus)
            {
                this.focus()
            }
        }
    }

    /**
     * focus the window
     */
    focus()
    {
        if (this.wm._checkModal(this))
        {
            if (this.minimized)
            {
                this.minimize()
            }
            this.active = true
            this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarActive
            this.emit('focus', this)
        }
    }

    /**
     * blur the window
     */
    blur()
    {
        if (this.wm.modal !== this)
        {
            this.active = false
            this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarInactive
            this.emit('blur', this)
        }
    }

    /**
     * closes the window (can be reopened with open) if a reference is saved
     */
    close()
    {
        if (!this._closed)
        {
            this._closed = true
            const ease = this.ease.add(this.win, { scale: 0 })
            ease.on('complete-scale', () =>
            {
                this.win.style.display = 'none'
                this.emit('close', this);
            })
        }
    }

    /**
     * left coordinate
     * @type {number}
     */
    get x() { return this.options.x }
    set x(value)
    {
        this.options.x = value
        this.win.style.left = value + 'px'
        this.emit('move-x', this)
    }

    /**
     * top coordinate
     * @type {number}
     */
    get y() { return this.options.y }
    set y(value)
    {
        this.options.y = value
        this.win.style.top = value + 'px'
        this.emit('move-y', this)
    }

    /**
     * width of window
     * @type {number}
     */
    get width() { return this.options.width || this.win.offsetWidth }
    set width(value)
    {
        if (value)
        {
            this.win.style.width = value + 'px'
            this.options.width = this.win.offsetWidth
        }
        else
        {
            this.win.style.width = 'auto'
            this.options.width = ''
        }
        this.emit('resize-width', this)
    }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this.options.height || this.win.offsetHeight }
    set height(value)
    {
        if (value)
        {
            this.win.style.height = value + 'px'
            this.options.height = this.win.offsetHeight
        }
        else
        {
            this.win.style.height = 'auto'
            this.options.height = ''
        }
        this.emit('resize-height', this)
    }

    /**
     * resize the window
     * @param {number} width
     * @param {number} height
     */
    resize(width, height)
    {
        this.width = width
        this.height = height
    }

    /**
     * move window
     * @param {number} x
     * @param {number} y
     */
    move(x, y)
    {
        this.x = x
        this.y = y
    }

    /**
     * minimize window
     * @param {boolean} noAnimate
     */
    minimize(noAnimate)
    {
        if (this.wm._checkModal(this) && this.options.minimizable && !this.transitioning)
        {
            if (this.minimized)
            {
                if (noAnimate)
                {
                    this.win.style.transform = 'scaleX(1) scaleY(1)'
                    this.minimized = false
                    this.emit('minimize-restore', this)
                    this.overlay.style.display = 'none'
                }
                else
                {
                    this.transitioning = true
                    const add = this.ease.add(this.win, { scaleX: 1, scaleY: 1, left: this.minimized.x, top: this.minimized.y })
                    add.on('complete-top', () =>
                    {
                        this.minimized = false
                        this.emit('minimize-restore', this)
                        this.transitioning = false
                        this.overlay.style.display = 'none'
                    })
                }
            }
            else
            {
                const x = this.x, y = this.y
                const desired = this.options.minimizeSize
                let delta
                if (this._lastMinimized)
                {
                    delta = { left: this._lastMinimized.x, top: this._lastMinimized.y }
                }
                else
                {
                    delta = { scaleX: (desired / this.win.offsetWidth), scaleY: (desired / this.win.offsetHeight) }
                }
                if (noAnimate)
                {
                    this.win.style.transform = 'scale(1) scale(' + (desired / this.win.offsetWidth) + ',' + (desired / this.win.offsetHeight) + ')'
                    this.win.style.left = delta.left + 'px'
                    this.win.style.top = delta.top + 'px'
                    this.minimized = { x, y }
                    this.emit('minimize', this)
                    this.overlay.style.display = 'block'
                }
                else
                {
                    this.transitioning = true
                    const ease = this.ease.add(this.win, delta)
                    ease.on('complete-scaleY', () =>
                    {
                        this.minimized = { x, y }
                        this.emit('minimize', this)
                        this.transitioning = false
                        this.overlay.style.display = 'block'
                    })
                }
            }
        }
    }

    /**
     * maximize the window
     */
    maximize()
    {
        if (this.wm._checkModal(this) && this.options.maximizable && !this.transitioning)
        {
            this.transitioning = true
            if (this.maximized)
            {
                const ease = this.ease.add(this.win, { left: this.maximized.x, top: this.maximized.y, width: this.maximized.width, height: this.maximized.height })
                ease.on('complete-height', () =>
                {
                    this.options.x = this.maximized.x
                    this.options.y = this.maximized.y
                    this.options.width = this.maximized.width
                    this.options.height = this.maximized.height
                    this.maximized = null
                    this.transitioning = false
                })
                this.buttons.maximize.style.backgroundImage = this.options.backgroundMaximizeButton
                this.emit('restore', this)
            }
            else
            {
                const x = this.x, y = this.y, width = this.win.offsetWidth, height = this.win.offsetHeight
                const ease = this.ease.add(this.win, { left: 0, top: 0, width: this.wm.overlay.offsetWidth, height: this.wm.overlay.offsetHeight })
                ease.on('complete-height', () =>
                {
                    this.maximized = { x, y, width, height }
                    this.transitioning = false
                })
                this.buttons.maximize.style.backgroundImage = this.options.backgroundRestoreButton
                this.emit('maximize', this)
            }
        }
    }

    /**
     * sends window to back of window-manager
     */
    sendToBack()
    {
        this.wm.sendToBack(this)
    }

    /**
     * send window to front of window-manager
     */
    sendToFront()
    {
        this.wm.sendToFront(this)
    }

    /**
     * save the state of the window
     * @return {object} data
     */
    save()
    {
        const data = {}
        const maximized = this.maximized
        if (maximized)
        {
            data.maximized = { x: maximized.x, y: maximized.y, width: maximized.width, height: maximized.height }
        }
        const minimized = this.minimized
        if (minimized)
        {
            data.minimized = { x: this.minimized.x, y: this.minimized.y }
        }
        const lastMinimized = this._lastMinimized
        if (lastMinimized)
        {
            data.lastMinimized = { x: lastMinimized.x, y: lastMinimized.y }
        }
        data.x = this.x
        data.y = this.y
        if (exists(this.options.width))
        {
            data.width = this.options.width
        }
        if (exists(this.options.height))
        {
            data.height = this.options.height
        }
        return data
    }

    /**
     * return the state of the window
     * @param {object} data from save()
     */
    load(data)
    {
        if (data.maximized)
        {
            if (!this.maximized)
            {
                this.maximize(true)
            }
            this.maximized = data.maximized
        }
        if (data.minimized)
        {
            if (!this.minimized)
            {
                this.minimize(true)
            }
            this.minimized = data.minimized
        }
        if (data.lastMinimized)
        {
            this._lastMinimized = data.lastMinimized
        }
        this.x = data.x
        this.y = data.y
        if (exists(data.width))
        {
            this.width = data.width
        }
        else
        {
            this.win.style.width = 'auto'
        }
        if (exists(data.height))
        {
            this.height = data.height
        }
        else
        {
            this.win.style.height = 'auto'
        }
    }

    /**
     * change title
     * @type {string}
     */
    get title() { return this._title }
    set title(value)
    {
        this.winTitle.innerText = value
        this.emit('title-change', this)
    }


    /**
     * right coordinate of window
     * @type {number}
     */
    get right() { return this.x + this.width }
    set right(value)
    {
        this.x = value - this.width
    }

    /**
     * bottom coordinate of window
     * @type {number}
     */
    get bottom() { return this.y + this.height }
    set bottom(value)
    {
        this.y = value - this.height
    }

    /**
     * Fires when window is maximized
     * @event Window#maximize
     * @type {Window}
     */

    /**
     * Fires when window is restored to normal after being maximized
     * @event Window#maximize-restore
     * @type {Window}
     */

    /**
     * Fires when window is restored to normal after being minimized
     * @event Window#minimize-restore
     * @type {Window}
     */

    /**
     * Fires when window opens
     * @event Window#open
     * @type {Window}
     */

    /**
     * Fires when window gains focus
     * @event Window#focus
     * @type {Window}
     */
    /**
     * Fires when window loses focus
     * @event Window#blur
     * @type {Window}
     */
    /**
     * Fires when window closes
     * @event Window#close
     * @type {Window}
     */

    /**
     * Fires when resize starts
     * @event Window#resize-start
     * @type {Window}
     */

    /**
     * Fires after resize completes
     * @event Window#resize-end
     * @type {Window}
     */

    /**
     * Fires during resizing
     * @event Window#resize
     * @type {Window}
     */

    /**
     * Fires when move starts
     * @event Window#move-start
     * @type {Window}
     */

    /**
     * Fires after move completes
     * @event Window#move-end
     * @type {Window}
     */

    /**
     * Fires during move
     * @event Window#move
     * @type {Window}
     */

    /**
     * Fires when width is changed
     * @event Window#resize-width
     * @type {Window}
     */

    /**
     * Fires when height is changed
     * @event Window#resize-height
     * @type {Window}
     */

    /**
     * Fires when x position of window is changed
     * @event Window#move-x
     * @type {Window}
     */


    /**
     * Fires when y position of window is changed
     * @event Window#move-y
     * @type {Window}
     */

    _createWindow()
    {
        this.win = html({
            parent: this.wm.win, styles: {
                'display': 'none',
                'border-radius': this.options.borderRadius,
                'user-select': 'none',
                'overflow': 'hidden',
                'position': 'absolute',
                'min-width': this.options.minWidth,
                'min-height': this.options.minHeight,
                'box-shadow': this.options.shadow,
                'background-color': this.options.backgroundColorWindow,
                'left': this.options.x,
                'top': this.options.y,
                'width': isNaN(this.options.width) ? this.options.width : this.options.width + 'px',
                'height': isNaN(this.options.height) ? this.options.height : this.options.height + 'px'
            }
        })

        this.winBox = html({
            parent: this.win, styles: {
                'display': 'flex',
                'flex-direction': 'column',
                'width': '100%',
                'height': '100%',
                'min-height': this.options.minHeight
            }
        })
        this._createTitlebar()

        this.content = html({
            parent: this.winBox, type: 'section', styles: {
                'display': 'block',
                'flex': 1,
                'min-height': this.minHeight,
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            }
        })

        if (this.options.resizable)
        {
            this._createResize()
        }

        this.overlay = html({
            parent: this.win, styles: {
                'display': 'none',
                'position': 'absolute',
                'left': 0,
                'top': 0,
                'width': '100%',
                'height': '100%'
            }
        })
        this.overlay.addEventListener('mousedown', (e) => { this._downTitlebar(e); e.stopPropagation() })
        this.overlay.addEventListener('touchstart', (e) => { this._downTitlebar(e); e.stopPropagation() })
    }

    _downTitlebar(e)
    {
        if (!this.transitioning)
        {
            const event = this._convertMoveEvent(e)
            this._moving = this._toLocal({
                x: event.pageX,
                y: event.pageY
            })
            this.emit('move-start', this)
            this._moved = false
        }
    }

    _createTitlebar()
    {
        this.winTitlebar = html({
            parent: this.winBox, type: 'header', styles: {
                'user-select': 'none',
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'height': this.options.titlebarHeight,
                'min-height': this.options.titlebarHeight,
                'border': 0,
                'padding': '0 8px',
                'overflow': 'hidden',
            }
        })
        this.winTitle = html({
            parent: this.winTitlebar, type: 'span', html: this.options.title, styles: {
                'user-select': 'none',
                'flex': 1,
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'user-select': 'none',
                'cursor': 'default',
                'padding': 0,
                'padding-left': '8px',
                'margin': 0,
                'font-size': '16px',
                'font-weight': 400,
                'color': this.options.foregroundColorTitle
            }
        })
        this._createButtons()

        if (this.options.movable)
        {
            this.winTitlebar.addEventListener('mousedown', (e) => this._downTitlebar(e))
            this.winTitlebar.addEventListener('touchstart', (e) => this._downTitlebar(e))
        }
    }

    _createButtons()
    {
        this.winButtonGroup = html({
            parent: this.winTitlebar, styles: {
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'padding-left': '2px'
            }
        })
        const button = {
            'display': 'inline-block',
            'border': 0,
            'margin': 0,
            'margin-left': '5px',
            'padding': 0,
            'width': '12px',
            'height': '12px',
            'background-color': 'transparent',
            'background-size': 'cover',
            'background-repeat': 'no-repeat',
            'opacity': .7,
            'color': this.options.foregroundColorButton,
            'outline': 0
        }
        this.buttons = {}
        if (this.options.minimizable)
        {
            button.backgroundImage = this.options.backgroundMinimizeButton
            this.buttons.minimize = html({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.minimize, () => this.minimize())
        }
        if (this.options.maximizable)
        {
            button.backgroundImage = this.options.backgroundMaximizeButton
            this.buttons.maximize = html({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.maximize, () => this.maximize())
        }
        if (this.options.closable)
        {
            button.backgroundImage = this.options.backgroundCloseButton
            this.buttons.close = html({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.close, () => this.close())
        }
        for (let key in this.buttons)
        {
            const button = this.buttons[key]
            button.addEventListener('mousemove', () =>
            {
                button.style.opacity = 1
            })
            button.addEventListener('mouseout', () =>
            {
                button.style.opacity = 0.7
            })
        }
    }

    _createResize()
    {
        this.resizeEdge = html({
            parent: this.winBox, type: 'button', html: '&nbsp', styles: {
                'position': 'absolute',
                'bottom': 0,
                'right': '4px',
                'border': 0,
                'margin': 0,
                'padding': 0,
                'cursor': 'se-resize',
                'user-select': 'none',
                'background': this.options.backgroundResize,
                'height': '15px',
                'width': '10px'
            }
        })
        const down = (e) =>
        {
            if (this.wm._checkModal(this))
            {
                const event = this._convertMoveEvent(e)
                const width = this.width || this.win.offsetWidth
                const height = this.height || this.win.offsetHeight
                this._resizing = {
                    width: width - event.pageX,
                    height: height - event.pageY
                }
                this.emit('resize-start')
                e.preventDefault()
            }
        }
        this.resizeEdge.addEventListener('mousedown', down)
        this.resizeEdge.addEventListener('touchstart', down)
    }

    _move(e)
    {
        if (this.wm._checkModal(this))
        {
            const event = this._convertMoveEvent(e)

            if (!this._isTouchEvent(e) && e.which !== 1)
            {
                this._moving && this._stopMove()
                this._resizing && this._stopResize()
            }
            if (this._moving)
            {
                this.move(
                    event.pageX - this._moving.x,
                    event.pageY - this._moving.y
                )
                if (this.minimized)
                {
                    e.preventDefault()
                    this._lastMinimized = { x: this.win.offsetLeft, y: this.win.offsetTop }
                    this._moved = true
                }
                this.emit('move', this)
                e.preventDefault()
            }

            if (this._resizing)
            {
                this.resize(
                    event.pageX + this._resizing.width,
                    event.pageY + this._resizing.height
                )
                this.maximized = null
                this.emit('resize', this)
                e.preventDefault()
            }
        }
    }

    _up()
    {
        if (this._moving)
        {
            if (this.minimized)
            {
                if (!this._moved)
                {
                    this.minimize()
                }
            }
            this._stopMove()
        }
        this._resizing && this._stopResize()
    }

    _listeners()
    {
        this.win.addEventListener('mousedown', () => this.focus())
        this.win.addEventListener('touchstart', () => this.focus())
    }

    _stopMove()
    {
        this._moving = null
        this.emit('move-end', this)
    }

    _stopResize()
    {
        this._restore = this._resizing = null
        this.emit('resize-end', this)
    }

    _isTouchEvent(e)
    {
        return !!window.TouchEvent && (e instanceof window.TouchEvent)
    }

    _convertMoveEvent(e)
    {
        return this._isTouchEvent(e) ? e.changedTouches[0] : e
    }

    _toLocal(coord)
    {
        return {
            x: coord.x - this.x,
            y: coord.y - this.y
        }
    }

    get z() { return parseInt(this.win.style.zIndex) }
    set z(value) { this.win.style.zIndex = value }
}

module.exports = Window