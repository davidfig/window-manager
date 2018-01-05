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

        this.z = 10000

        this.active = false
        this.maximized = false
        this.minimized = false

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
        this.active = true
        this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarActive
        this.emit('focus', this)
    }

    /**
     * blur the window
     */
    blur()
    {
        this.active = false
        this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarInactive
        this.emit('blur', this)
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
    get width() { return this.options.width }
    set width(value)
    {
        this.options.width = value
        this.win.style.width = value + 'px'
    }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this.options.height }
    set height(value)
    {
        this.options.height = value
        this.win.style.height = value + 'px'
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
     * change title
     * @type {string}
     */
    get title() { return this._title }
    set title(value)
    {
        this.winTitle.innerText = value
    }
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
            const down = (e) =>
            {
                const event = this._convertMoveEvent(e)
                this._moving = this._toLocal({
                    x: event.pageX,
                    y: event.pageY
                })
                this.emit('move-start', this)
                e.preventDefault();
            }
            this.winTitlebar.addEventListener('mousedown', down)
            this.winTitlebar.addEventListener('touchdown', down)
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
            'background-repeat': 'no-repeat',
            'margin': 0,
            'margin-left': '3px',
            'padding': 0,
            'width': '15px',
            'height': '15px',
            'opacity': .7,
            'color': this.options.foregroundColorButton
        }
        this.buttons = {}
        if (this.options.minimizable)
        {
            button.background = this.options.backgroundMinimizeButton
            this.buttons.minimize = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.minimize, () => console.log('minimize'))
        }
        if (this.options.maximizable)
        {
            button.background = this.options.backgroundMaximizeButton
            this.buttons.maximize = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.maximize, () => console.log('maximize'))
        }
        if (this.options.closable)
        {
            button.background = this.options.backgroundCloseButton
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
            const event = this._convertMoveEvent(e)
            this._resizing = {
                width: this.width - event.pageX,
                height: this.height - event.pageY
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
            this.move(
                event.pageX - this._moving.x,
                event.pageY - this._moving.y
            )
            this.emit('move', this)
        }

        if (this._resizing)
        {
            this.resize(
                event.pageX + this._resizing.width,
                event.pageY + this._resizing.height
            )
            this.emit('resize', this)
        }
    }

    _up()
    {
        this._moving && this._stopMove()
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

    set z(value)
    {
        this.win.style.zIndex = value
    }

    get z()
    {
        return parseInt(this.win.style.zIndex)
    }
}

// 		get maximized() {
// 			return this.options.maximized;
// 		},

// 		set maximized(value) {
// 			if(value) {
// 				this._restoreMaximized = this.stamp();
// 				this.signals.emit('maximize', this, this._restoreMaximized);
// 			}
// 			else {
// 				this.signals.emit('restore', this, this._restoreMaximized);
// 			}
// 			this.options.maximized = value;
// 		},


// 		get minimized() {
// 			return this.options.minimized;
// 		},

// 		set minimized(value) {
// 			if(value) {
// 				this._restoreMinimized = this.stamp();
// 				this.signals.emit('minimize', this, this._restoreMinimized);
// 			}
// 			else {
// 				this.signals.emit('restore', this, this._restoreMinimized);
// 			}

// 			this.options.minimized = value;
// 		},


// 		/**
// 		 * @return A function that restores this window
// 		 */
// 		stamp: function() {
// 			this.restore = (function() {
// 				var size = {
// 					width: this.width,
// 					height: this.height
// 				};

// 				var pos = {
// 					x: this.x,
// 					y: this.y
// 				};

// 				return function() {
// 					this.resize(size.width, size.height);
// 					this.move(pos.x, pos.y);

// 					return this;
// 				};
// 			}).apply(this);

// 			return this.restore;
// 		},

// 		restore: function(){},

// 		maximize: function() {
// 			this.el.addClass('maximazing');
// 			this.el.onTransitionEnd(function(){
// 				this.el.removeClass('maximazing');
// 			}, this);

// 			this.maximized = !this.maximized;
// 			return this;
// 		},

// 		minimize: function() {
// 			this.el.addClass('minimizing');
// 			this.el.onTransitionEnd(function(){
// 				this.el.removeClass('minimizing');
// 			}, this);

// 			this.minimized = !this.minimized;
// 			return this;
// 		}
// 	};