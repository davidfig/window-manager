const Events = require('eventemitter3')
const clicked = require('clicked')
const Velocity = require('velocity-animate')

const html = require('./html')

let id = 0

module.exports = class Window extends Events
{
    constructor(wm, options)
    {
        super()
        this.wm = wm
        this.id = id++

        this.options = options

        this._createWindow()
        this._listeners()

        this.active = false
        this.maximized = false
        this._minimized = false

        this._closed = true
        this._restore = null
        this._moving = null
        this._resizing = null
    }

    /**
     * open the window
     * @param {boolean} [noFocus] do not focus window when opened
     */
    open(noFocus)
    {
        if (this._closed)
        {
            this.emit('open', this)
            this.win.style.display = 'block'
            Velocity(this.win, { scale: [1, 'easeInOutSine', 0] }, { duration: this.options.animateTime })
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
            if (this._minimized)
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
            Velocity(this.win, { scale: [0, 'easeInOutSine'] }, { duration: this.options.animateTime }).then(() =>
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
    }

    /**
     * width of window
     * @type {number}
     */
    get width() { return this.options.width || this.win.offsetWidth }
    set width(value)
    {
        this.options.width = value
        if (value)
        {
            this.win.style.width = value + 'px'
        }
        else
        {
            this.win.style.width = 'auto'
        }
    }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this.options.height || this.win.offsetHeight }
    set height(value)
    {
        this.options.height = value
        if (value)
        {
            this.win.style.height = value + 'px'
        }
        else
        {
            this.win.style.height = 'auto'
        }
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

    minimize()
    {
        if (this.wm._checkModal(this) && this.options.minimizable && !this.transitioning)
        {
            this.transitioning = true
            if (this._minimized)
            {
                Velocity(this.win, { scaleX: 1, scaleY: 1, left: this._minimized.x, top: this._minimized.y }, { duration: this.options.animationTime, ease: 'easeInOutSine' }).then(() =>
                {
                    this._minimized = false
                    this.emit('minimize-restore')
                    this.transitioning = false
                    this.overlay.style.display = 'none'
                })
            }
            else
            {
                const x = this.x, y = this.y
                const desired = this.options.minimizeSize
                const delta = { scaleX: (desired / this.win.offsetWidth), scaleY: (desired / this.win.offsetHeight) }
                if (this._lastMinimized)
                {
                    delta.left = this._lastMinimized.x
                    delta.top = this._lastMinimized.y
                }
                Velocity(this.win, delta, { duration: this.options.animationTime, ease: 'easeInOutSine' }).then(() =>
                {
                    this._minimized = { x, y }
                    this.emit('minimize', this)
                    this.transitioning = false
                    this.overlay.style.display = 'block'
                })
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
                Velocity(this.win, { left: this.maximized.x, top: this.maximized.y, width: this.maximized.width, height: this.maximized.height }, { duration: this.options.animateTime, ease: 'easeInOutSine' }).then(() =>
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
                Velocity(this.win, { left: 0, top: 0, width: this.wm.overlay.offsetWidth, height: this.wm.overlay.offsetHeight }, { duration: this.options.animateTime, ease: 'easeInOutSine' }).then(() =>
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
     * change title
     * @type {string}
     */
    get title() { return this._title }
    set title(value)
    {
        this.winTitle.innerText = value
    }

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
     * Fires when window loses focus
     * @event blur
     * @type {Window}
     */
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

    _createWindow()
    {
        this.win = html.create({
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
                'width': this.options.width,
                'height': this.options.height
            }
        })

        this.winBox = html.create({
            parent: this.win, styles: {
                'display': 'flex',
                'flex-direction': 'column',
                'width': '100%',
                'height': '100%',
                'min-height': this.options.minHeight
            }
        })
        this._createTitlebar()

        this.content = html.create({
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

        this.overlay = html.create({
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
        this.winTitlebar = html.create({
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
        this.winTitle = html.create({
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
        this.winButtonGroup = html.create({
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
            this.buttons.minimize = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.minimize, () => this.minimize())
        }
        if (this.options.maximizable)
        {
            button.backgroundImage = this.options.backgroundMaximizeButton
            this.buttons.maximize = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.maximize, () => this.maximize())
        }
        if (this.options.closable)
        {
            button.backgroundImage = this.options.backgroundCloseButton
            this.buttons.close = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
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
        this.resizeEdge = html.create({
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
                if (this._minimized)
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
            if (this._minimized)
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
        this.emit('move-end')
    }

    _stopResize()
    {
        this._restore = this._resizing = null
        this.emit('resize-end')
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