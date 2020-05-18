import Events from 'eventemitter3'
import { clicked } from 'clicked'

import { html } from './html'

/**
 * Window class returned by WindowManager.createWindow()
 * @extends EventEmitter
 * @fires open
 * @fires focus
 * @fires blur
 * @fires close
 * @fires maximize
 * @fires maximize-restore
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
export class Window extends Events
{
    /**
     * @param {WindowManager} [wm]
     * @param {object} [options]
     */
    constructor(wm, options={})
    {
        super()
        this.wm = wm
        this.options = options
        this.id = typeof this.options.id === 'undefined' ? Window.id++ : this.options.id
        this._createWindow()
        this._listeners()

        this.active = false
        this.maximized = false

        this._closed = true
        this._restore = null
        this._moving = null
        this._resizing = null
        this._attachedToScreen = { vertical: '', horziontal: '' }
    }

    /**
     * open the window
     * @param {boolean} [noFocus] do not focus window when opened
     */
    open(noFocus)
    {
        if (this._closed)
        {
            this.win.style.display = 'block'
            this._closed = false
            this.emit('open', this)
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
        this.active = true
        if (this.options.titlebar)
        {
            this.winTitlebar.style.backgroundColor = this.options.colors.backgroundTitlebarActive
        }
        this.emit('focus', this)
    }

    /**
     * blur the window
     */
    blur()
    {
        this.active = false
        if (this.options.titlebar)
        {
            this.winTitlebar.style.backgroundColor = this.options.colors.backgroundTitlebarInactive
        }
        this.emit('blur', this)
    }

    /**
     * closes the window (can be reopened with open)
     */
    close()
    {
        if (!this._closed)
        {
            this._closed = true
            this.win.style.display = 'none'
            this.emit('close', this)
        }
    }

    /**
     * is window closed?
     * @type {boolean}
     * @readonly
     */
    get closed()
    {
        return this._closed
    }

    /**
     * left coordinate
     * @type {number}
     */
    get x() { return this.options.x }
    set x(value)
    {
        if (value !== this.options.x)
        {
            this.options.x = value
            this.emit('move-x', this)
            this._buildTransform()
        }
    }

    _buildTransform()
    {
        this.win.style.transform = `translate(${this.options.x}px,${this.options.y}px)`
    }

    /**
     * top coordinate
     * @type {number}
     */
    get y() { return this.options.y }
    set y(value)
    {
        if (value !== this.options.y)
        {
            this.options.y = value
            this._buildTransform()
            this.emit('move-y', this)
        }
    }

    /**
     * width of window
     * @type {number}
     */
    get width() { return this.options.width || this.win.offsetWidth }
    set width(value)
    {
        if (value !== this.options.width)
        {
            if (value)
            {
                this.win.style.width = `${value}px`
                this.options.width = this.win.offsetWidth
            }
            else
            {
                this.win.style.width = 'auto'
                this.options.width = ''
            }
            this.emit('resize-width', this)
        }
    }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this.options.height || this.win.offsetHeight }
    set height(value)
    {
        if (value !== this.options.height)
        {
            if (value)
            {
                this.win.style.height = `${value}px`
                this.options.height = this.win.offsetHeight
            }
            else
            {
                this.win.style.height = 'auto'
                this.options.height = ''
            }
            this.emit('resize-height', this)
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
        const keepInside = this.keepInside
        if (keepInside)
        {
            const bounds = this.bounds
            if (keepInside === true || keepInside === 'horizontal')
            {
                x = x + this.width > bounds.right ? bounds.right - this.width : x
                x = x < bounds.left ? bounds.left : x
            }
            if (keepInside === true || keepInside === 'vertical')
            {
                y = y + this.height > bounds.bottom ? bounds.bottom - this.height : y
                y = y < bounds.top ? bounds.top : y
            }
        }
        if (x !== this.options.x)
        {
            this.options.x = x
            this.emit('move-x', this)
        }
        if (y !== this.options.y)
        {
            this.options.y = y
            this.emit('move-y', this)
        }
        this._buildTransform()
    }

    /**
     * maximize the window
     */
    maximize()
    {
        if (this.options.maximizable)
        {
            if (this.maximized)
            {
                this.x = this.maximized.x
                this.y = this.maximized.y
                this.width = this.maximized.width
                this.height = this.maximized.height
                this.maximized = null
                this.emit('restore', this)
                this.buttons.maximize.innerHTML = this.options.maximizeButton
            }
            else
            {
                const x = this.x, y = this.y, width = this.win.offsetWidth, height = this.win.offsetHeight
                this.maximized = { x, y, width, height }
                this.x = 0
                this.y = 0
                this.width = this.wm.overlay.offsetWidth + 'px'
                this.height = this.wm.overlay.offsetHeight + 'px'
                this.emit('maximize', this)
                this.buttons.maximize.innerHTML = this.options.restoreButton
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
            data.maximized = { left: maximized.left, top: maximized.top, width: maximized.width, height: maximized.height }
        }
        data.x = this.x
        data.y = this.y
        if (typeof this.options.width !== 'undefined')
        {
            data.width = this.options.width
        }
        if (typeof this.options.height !== 'undefined')
        {
            data.height = this.options.height
        }
        data.closed = this._closed
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
        }
        else if (this.maximized)
        {
            this.maximize(true)
        }
        this.x = data.x
        this.y = data.y
        if (typeof data.width !== 'undefined')
        {
            this.width = data.width
        }
        else
        {
            this.win.style.width = 'auto'
        }
        if (typeof data.height !== 'undefined')
        {
            this.height = data.height
        }
        else
        {
            this.win.style.height = 'auto'
        }
        if (data.closed)
        {
            this.close(true)
        }
        else if (this.closed)
        {
            this.open(true, true)
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
     * centers window in middle of other window or document.body
     * @param {Window} [win]
     */
    center(win)
    {
        if (win)
        {
            this.move(
                win.x + win.width / 2 - this.width / 2,
                win.y + win.height / 2 - this.height / 2
            )
        }
        else
        {
            this.move(
                window.innerWidth / 2 - this.width / 2,
                window.innerHeight / 2 - this.height / 2
            )
        }
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
        /**
         * This is the top-level DOM element
         * @type {HTMLElement}
         * @readonly
         */
        this.win = html({
            parent: (this.wm ? this.wm.win : null), styles: {
                'display': 'none',
                'border-radius': this.options.borderRadius,
                'user-select': 'none',
                'overflow': 'hidden',
                'position': 'absolute',
                'min-width': this.options.minWidth,
                'min-height': this.options.minHeight,
                'box-shadow': this.options.shadow,
                'background-color': this.options.colors.backgroundWindow,
                'width': isNaN(this.options.width) ? this.options.width : this.options.width + 'px',
                'height': isNaN(this.options.height) ? this.options.height : this.options.height + 'px'
            },
            className: this.options.classNames.win
        })

        this.winBox = html({
            parent: this.win, styles: {
                'display': 'flex',
                'flex-direction': 'column',
                'width': '100%',
                'height': '100%',
                'min-height': this.options.minHeight
            },
            className: this.options.classNames.winBox
        })
        this._createTitlebar()

        /**
         * This is the content DOM element. Use this to add content to the Window.
         * @type {HTMLElement}
         * @readonly
         */
        this.content = html({
            parent: this.winBox, type: 'section', styles: {
                'display': 'block',
                'flex': 1,
                'min-height': this.minHeight,
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            },
            className: this.options.classNames.content
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
            },
            className: this.options.classNames.overlay
        })
        this.overlay.addEventListener('mousedown', (e) => { this._downTitlebar(e); e.stopPropagation() })
        this.overlay.addEventListener('touchstart', (e) => { this._downTitlebar(e); e.stopPropagation() })
        this._buildTransform()
    }

    _downTitlebar(e)
    {
        const event = this._convertMoveEvent(e)
        this._moving = {
            x: event.pageX - this.x,
            y: event.pageY - this.y
        }
        this.emit('move-start', this)
        this._moved = false
    }

    _createTitlebar()
    {
        if (this.options.titlebar)
        {
            this.winTitlebar = html({
                parent: this.winBox, type: 'header', styles: {
                    'user-select': 'none',
                    'display': 'flex',
                    'flex-direction': 'row',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'height': this.options.titlebarHeight,
                    'min-height': this.options.titlebarHeight,
                    'border': 0,
                    'padding': '0 8px',
                    'overflow': 'hidden',
                },
                className: this.options.classNames.titlebar
            })
            const winTitleStyles = {
                'user-select': 'none',
                'flex': 1,
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'user-select': 'none',
                'cursor': 'default',
                'padding': 0,
                'margin': 0,
                'font-size': '16px',
                'font-weight': 400,
                'color': this.options.colors.foregroundTitle
            }
            if (this.options.titleCenter)
            {
                winTitleStyles['justify-content'] = 'center'
            }
            else
            {
                winTitleStyles['padding-left'] = '8px'

            }
            this.winTitle = html({ parent: this.winTitlebar, type: 'span', html: this.options.title, styles: winTitleStyles, className: this.options.classNames.winTitle })
            this._createButtons()

            if (this.options.movable)
            {
                this.winTitlebar.addEventListener('mousedown', (e) => this._downTitlebar(e))
                this.winTitlebar.addEventListener('touchstart', (e) => this._downTitlebar(e))
            }
        }
    }

    _createButtons()
    {
        this.winButtonGroup = html({
            parent: this.winTitlebar, styles: {
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'padding-left': '10px'
            },
            className: this.options.classNames.winButtonGroup
        })
        const button = {
            'display': 'inline-block',
            'border': 0,
            'margin': 0,
            'margin-left': '15px',
            'padding': 0,
            'width': '12px',
            'height': '12px',
            'background-color': 'transparent',
            'background-size': 'cover',
            'background-repeat': 'no-repeat',
            'opacity': .7,
            'color': this.options.colors.foregroundButton,
            'outline': 0
        }
        this.buttons = {}
        if (this.options.maximizable)
        {
            this.buttons.maximize = html({ parent: this.winButtonGroup, html: this.options.maximizeButton, type: 'button', styles: button, className: this.options.maximize })
            clicked(this.buttons.maximize, () => this.maximize())
        }
        if (this.options.closable)
        {
            this.buttons.close = html({ parent: this.winButtonGroup, html: this.options.closeButton, type: 'button', styles: button, className: this.options.close })
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
            parent: this.winBox, type: 'button', html: this.options.backgroundResize, styles: {
                'position': 'absolute',
                'bottom': 0,
                'right': '4px',
                'border': 0,
                'margin': 0,
                'padding': 0,
                'cursor': 'se-resize',
                'user-select': 'none',
                'height': '15px',
                'width': '10px',
                'background': 'none'
            },
            className: this.options.classNames.resizeEdge
        })
        const down = (e) =>
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
        this.resizeEdge.addEventListener('mousedown', down)
        this.resizeEdge.addEventListener('touchstart', down)
    }

    _move(e)
    {
        const event = this._convertMoveEvent(e)

        if (!this._isTouchEvent(e) && e.which !== 1)
        {
            this._moving && this._stopMove()
            this._resizing && this._stopResize()
        }
        if (this._moving)
        {
            this.move(event.pageX - this._moving.x, event.pageY - this._moving.y)
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

    _up()
    {
        if (this._moving)
        {
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

    /**
     * attaches window to a side of the screen
     * @param {('horizontal'|'vertical')} direction
     * @param {('left'|'right'|'top'|'bottom')} location
     */
    attachToScreen(direction, location)
    {
        this._attachedToScreen[direction] = location
    }

    /**
     * @param {Bounds} bounds
     * @param {(boolean|'horizontal'|'vertical')} keepInside
     */
    resize(bounds, keepInside)
    {
        this.bounds = bounds
        this.keepInside = keepInside
        let x = this.x
        let y = this.y
        x = this._attachedToScreen.horziontal === 'right' ? bounds.right - this.width : x
        x = this._attachedToScreen.horizontal === 'left' ? bounds.left : x
        y = this._attachedToScreen.vertical === 'bottom' ? bounds.bottom - this.height : y
        y = this._attachedToScreen.vertical === 'top' ? bounds.top : y
        this.move(x, y)
    }

    /**
     * @param {boolean} [ignoreClosed]
     * @returns {boolean}
     */
    isModal(ignoreClosed)
    {
        return (ignoreClosed || !this._closed) && this.options.modal
    }

    /** @returns {boolean} */
    isClosed()
    {
        return this._closed
    }

    get z()
    {
        return parseInt(this.win.style.zIndex)
    }
    set z(value)
    {
        this.win.style.zIndex = value
    }
}

Window.id = 0