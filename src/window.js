const Events = require('eventemitter3')
const exists = require('exists')
const clicked = require('clicked')
const Velocity = require('velocity-animate')

const html = require('./html')

let id = 0

module.exports = class Window extends Events
{
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
    {
        super()
        this.wm = wm
        this.id = id++

        options = options || {}
        this._minHeight = options.minHeight || '60px'
        this._titlebarHeight = options.titlebarHeight || '36px'
        this._animateTime = exists(options.animateTime) || 250
        this._title = options.title
        this._titlebar = exists(options.titlebar) ? options.titlebar : true
        this._titlebarHeight = options.titlebarHeight || '36px'
        this.colors = {
            'backgroundColorWindow': '#fefefe',
            'backgroundColorTitlebarActive': '#365d98',
            'backgroundColorTitlebarInactive': '#888888',
            'foregroundColorButton': '#ffffff',
            'foregroundColorTitle': '#ffffff'
        }

        this._createWindow(options)
        this._listeners()
        this.setColors(options.colors)

        this.width = options.width || 400
        this.height = options.height || 200
        this.x = options.x || 0
        this.y = options.y || 0
        this.movable = exists(options.movable) ? options.movable : true
        this.resizable = exists(options.resizable) ? options.resizable : true
        this.maximizable = exists(options.maximizable) ? options.maximizable : true
        this.minimizable = exists(options.minimizable) ? options.minimizable : true
        this.closable = exists(options.closable) ? options.closable : true
        this.titlebar = exists(options.titlebar) ? options.titlebar : true
        this.z = 10000

        this.enabled = true
        this.active = false
        this.maximized = false
        this.minimized = false

        this._closed = true
        this._restore = null
        this._moving = null
        this._resizing = null
    }

    /**
     * show maximize button
     * @type {boolean}
     */
    get maximizable() { return this._maximizable }
    set maximizable(value)
    {
        this._maximizable = value
        this.buttons.maximize.style.display = value ? 'inline-block' : 'none'
    }

    /**
     * show minimize button
     * @type {boolean}
     */
    get minimizable() { return this._minimizable }
    set minimizable(value)
    {
        this._minimizable = value
        this.buttons.minimize.style.display = value ? 'inline-block' : 'none'
    }

    /**
     * show close button
     * @type {boolean}
     */
    get closable() { return this._closable }
    set closable(value)
    {
        this._closable = value
        this.buttons.close.style.display = value ? 'inline-block' : 'none'
    }

    /**
     * set animation time
     * @type {number}
     */
    get animateTime() { return this._animateTime }
    set animateTime(value) { this._animateTime = value }

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
            Velocity(this.win, { scale: [1, 'easeInOutSine', 0] }, { duration: this._animateTime })
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
        this.setColors()
        this.emit('focus', this)
    }

    /**
     * blur the window
     */
    blur()
    {
        this.active = false
        this.setColors()
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
            Velocity(this.win, { scale: [0, 'easeInOutSine'] }, { duration: this._animateTime }).then(() =>
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
    get x() { return this._x }
    set x(value)
    {
        this._x = value
        this.win.style.left = value + 'px'
    }

    /**
     * top coordinate
     * @type {number}
     */
    get y() { return this._y }
    set y(value)
    {
        this._y = value
        this.win.style.top = value + 'px'
    }

    set z(value)
    {
        this.win.style.zIndex = value
    }

    get z()
    {
        return parseInt(this.win.style.zIndex)
    }


    /**
     * width of window
     * @type {number}
     */
    get width() { return this._width }
    set width(value)
    {
        this._width = value
        this.win.style.width = value + 'px'
    }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this._height }
    set height(value)
    {
        this._height = value
        this.win.style.height = value + 'px'
    }

    /**
     * colors
     * @param {object} options
     * @param {string} [options.backgroundColorWindow]
     * @param {string} [options.backgroundColorTitlebarActive]
     * @param {string} [options.backgroundColorTitlebarInactive]
     * @param {string} [options.foregroundColorButton]
     */
    setColors(options)
    {
        options = options || {}
        for (let key in options)
        {
            this.colors[key] = options[key]
        }
        this.win.style.backgroundColor = this.colors['backgroundColorWindow']
        this.winTitlebar.style.backgroundColor = this.colors[this.active ? 'backgroundColorTitlebarActive' : 'backgroundColorTitlebarInactive']
        for (let button in this.buttons)
        {
            this.buttons[button].style.color = this.colors['foregroundColorButton']
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

    /**
     * minHeight for window
     * @type {number}
     */
    get minHeight() { return this._minHeight }
    set minHeight(value)
    {
        this._minHeight = value
        this.win.style.minHeight = this.content.style.minHeight = value
    }

    /**
     * @type {boolean}
     */
    get movable() { return this._movable }
    set movable(value) { this._movable = value }

    /**
     * @type {boolean}
     */
    get resizable() { return this._resizable }
    set resizable(value)
    {
        this.resizeEdge.style.display = value ? 'block' : 'none'
        this._resizable = value
    }

    /**
     * whether title bar is visible
     * @type {boolean}
     */
    get titlebar() { return this._titlebar }
    set titlebar(value)
    {
        this.winTitlebar.style.display = value ? 'flex' : 'none'
        this._titlebar = value
    }

    _createWindow(options)
    {
        this.win = html.create({
            parent: this.wm.win, styles: {
                'display': 'none',
                'border-radius': '4px',
                'user-select': 'none',
                'overflow': 'hidden',
                'position': 'absolute',
                'min-width': '200px',
                'min-height': this.minHeight,
                'box-shadow': '0 0 12px 1px rgba(0, 0, 0, 0.6)'
            }
        })

        this.winBox = html.create({
            parent: this.win, styles: {
                'display': 'flex',
                'flex-direction': 'column',
                'height': '100%',
                'min-height': this.minHeight,
                'width': '100%'
            }
        })
        this._createTitlebar(options)

        this.content = html.create({
            parent: this.winBox, type: 'section', styles: {
                'display': 'block',
                'flex': 1,
                'min-height': this.minHeight,
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            }
        })

        this._createResize()

        this.overlay = html.create({
            parent: this.win, styles: {
                'display': 'none'
            }
        })
    }

    _createTitlebar(options)
    {
        this.winTitlebar = html.create({
            parent: this.winBox, type: 'header', styles: {
                'user-select': 'none',
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'height': this._titlebarHeight,
                'min-height': this._titlebarHeight,
                'border': 0,
                'padding': '0 8px',
                'overflow': 'hidden',
            }
        })
        this.winTitle = html.create({
            parent: this.winTitlebar, type: 'span', html: options.title, styles: {
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
                'color': this.colors.foregroundColorTitle
            }
        })
        this._createButtons()

        const down = (e) =>
        {
            const event = this._convertMoveEvent(e)
            if (this.enabled && this.movable)
            {
                this._moving = this._toLocal({
                    x: event.pageX,
                    y: event.pageY
                })
                e.preventDefault();
            }
        }
        this.winTitlebar.addEventListener('mousedown', down)
        this.winTitlebar.addEventListener('touchdown', down)
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
            'opacity': .7
        }
        this.buttons = {}
        button.background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8KSDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NzYwRDNDRkMzMDM5MTFFMkI5MUFGMzlFMTgwOEI4ODEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NzYwRDNDRkQzMDM5MTFFMkI5MUFGMzlFMTgwOEI4ODEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCQjE5RDA1NzMwMzQxMUUyQjkxQUYzOUUxODA4Qjg4MSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCQjE5RDA1ODMwMzQxMUUyQjkxQUYzOUUxODA4Qjg4MSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PsZJjdUAAAAlSURBVHjaYvz//z8DsYCJgQQwqhgZsCCx8QU4I7piRkImAwQYAJ10BBYiYyqTAAAAAElFTkSuQmCC) no-repeat 1px 1px'
        this.buttons.minimize = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
        button.background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8KSDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QkIxOUQwNTUzMDM0MTFFMkI5MUFGMzlFMTgwOEI4ODEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QkIxOUQwNTYzMDM0MTFFMkI5MUFGMzlFMTgwOEI4ODEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCQjE5RDA1MzMwMzQxMUUyQjkxQUYzOUUxODA4Qjg4MSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCQjE5RDA1NDMwMzQxMUUyQjkxQUYzOUUxODA4Qjg4MSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PqAiG1YAAAA7SURBVHjaYvz//z8DsYAJSj8E4v948AdkxSSZDALyQMyIBQtgU0ySyQOomAWJ/RCPuo8ggpGUSAEIMACTWxDft/Hl3wAAAABJRU5ErkJggg==) no-repeat 1px 1px'
        this.buttons.maximize = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
        button.background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8KSDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QkIxOUQwNTEzMDM0MTFFMkI5MUFGMzlFMTgwOEI4ODEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QkIxOUQwNTIzMDM0MTFFMkI5MUFGMzlFMTgwOEI4ODEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCQjE5RDA0RjMwMzQxMUUyQjkxQUYzOUUxODA4Qjg4MSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCQjE5RDA1MDMwMzQxMUUyQjkxQUYzOUUxODA4Qjg4MSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PpFaWsQAAABxSURBVHjajJDRDcAgCERtJ2AER+oIjuZIHcER3IBCvDYX5KMklwg8lPNQ1fI3TjpfJgl9QX2F32yquuI2CWqCXNH/YFejgUpgexmGeUAjmMH+9AA4aKUN5h174qFkYEs8CMNuaMYdkc/sNySAW/0RYABjHiW8yydeWwAAAABJRU5ErkJggg==) no-repeat 1px 1px'
        this.buttons.close = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
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
        clicked(this.buttons.maximize, () => console.log('maximize'))
        clicked(this.buttons.minimize, () => console.log('minimize'))
        clicked(this.buttons.close, () => this.close())
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
                'background': 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QzREODAwQzcyRjZDMTFFMjg5NkREMENBNjJERUE4Q0IiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QzREODAwQzgyRjZDMTFFMjg5NkREMENBNjJERUE4Q0IiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpDNEQ4MDBDNTJGNkMxMUUyODk2REQwQ0E2MkRFQThDQiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpDNEQ4MDBDNjJGNkMxMUUyODk2REQwQ0E2MkRFQThDQiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PuQy0VQAAACLSURBVHjaYpw9ezYDEUARiO8zEaHQHohPArEcCxEK1wGxPxA/wmeyDZLCIyABJjwKNwJxEFShIi7FyAoPArEZEB8DYi0mHFaHIikEaUwE4mtMWBRGAPE+NIU7kJ0BUxiNQyFInpMJKgFTuBuLQj8gXg3yJCicHyFZDQJfgDgOqhEE3gGxD8jNAAEGADlXJQUd3J75AAAAAElFTkSuQmCC) no-repeat',
                'height': '15px',
                'width': '10px'
            }
        })
        const down = (e) =>
        {
            if (this.resizable)
            {
                const event = this._convertMoveEvent(e)
                this._resizing = {
                    width: this.width - event.pageX,
                    height: this.height - event.pageY
                }

                e.preventDefault()
            }
        }
        this.resizeEdge.addEventListener('mousedown', down)
        this.resizeEdge.addEventListener('touchstart', down)
    }

    _listeners()
    {
        this.win.addEventListener('mousedown', () => this.focus())
        this.win.addEventListener('touchstart', () => this.focus())

        const move = (e) =>
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
            }

            if (this._resizing)
            {
                this.resize(
                    event.pageX + this._resizing.width,
                    event.pageY + this._resizing.height
                )
            }
        }
        this.win.addEventListener('mousemove', move)
        this.win.addEventListener('touchmove', move)
        this.wm.overlay.addEventListener('mousemove', move)
        this.wm.overlay.addEventListener('touchmove', move)

        const up = () =>
        {
            this._moving && this._stopMove();
            this._resizing && this._stopResize();
        }
        this.win.addEventListener('mouseup', up)
        this.win.addEventListener('touchend', up)
        this.wm.overlay.addEventListener('mouseup', up)
        this.wm.overlay.addEventListener('touchend', up)
    }

    _stopMove()
    {
        this._moving = null
    }

    _stopResize()
    {
        this._restore = this._resizing = null
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

    _toGlobal(coord)
    {
        return {
            x: coord.x + this.x,
            y: coord.y + this.y
        }
    }
}

// 		get maximized() {
// 			return this._maximized;
// 		},

// 		set maximized(value) {
// 			if(value) {
// 				this._restoreMaximized = this.stamp();
// 				this.signals.emit('maximize', this, this._restoreMaximized);
// 			}
// 			else {
// 				this.signals.emit('restore', this, this._restoreMaximized);
// 			}
// 			this._maximized = value;
// 		},


// 		get minimized() {
// 			return this._minimized;
// 		},

// 		set minimized(value) {
// 			if(value) {
// 				this._restoreMinimized = this.stamp();
// 				this.signals.emit('minimize', this, this._restoreMinimized);
// 			}
// 			else {
// 				this.signals.emit('restore', this, this._restoreMinimized);
// 			}

// 			this._minimized = value;
// 		},

// 		set enabled(value) {
// 			if(!value) {
// 				this.el.addClass('disabled');
// 			}
// 			else {
// 				this.el.removeClass('disabled');
// 			}

// 			this._enabled = value;
// 		},

// 		get enabled() {
// 			return this._enabled;
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