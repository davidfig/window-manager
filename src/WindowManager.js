import { html } from './html'
import { Window } from './Window'
import { windowOptions } from './windowOptions'
import { Snap } from './Snap'
export { Window } from './Window'

const windowManagerOptions = {
    parent: document.body,
    quiet: false,
    keepInside: true,
    snap: true
}

/**
 * Creates a windowing system to create and manage windows
 *
 * @extends EventEmitter
 * @example
 * var wm = new WindowManager();
 *
 * wm.createWindow({ x: 20, y: 20, width: 200 })
 * wm.content.innerHTML = 'Hello there!'
 */
export class WindowManager
{
    /**
     * @param {object} [options]
     * @param {HTMLElement} [options.parent=document.body]
     * @param {boolean} [options.quiet] suppress the simple-window-manager console message
     * @param {(boolean|SnapOptions)} [options.snap] turn on edge and/or screen snapping
     * @param {(boolean|'horizontal'|'vertical')} [options.keepInside=true] keep windows inside the parent in a certain direction
     * @param {WindowOptions} [defaultOptions] default WindowOptions used when createWindow is called
     */
    constructor(options={}, defaultOptions={})
    {
        this.windows = []
        this.active = null
        this.options = Object.assign({}, windowManagerOptions, options)
        this.defaultOptions = Object.assign({}, windowOptions, defaultOptions)
        if (!this.options.quiet)
        {
            console.log('%c ☕ simple-window-manager initialized ☕', 'color: #ff00ff')
        }
        this._createDom(options.parent || document.body)
        if (this.options.snap)
        {
            this.snap(this.options.snap === true ? {} : this.options.snap)
        }
        window.addEventListener('resize', () => this.resize())
    }

    /**
     * Create a window
     * @param {WindowOptions} [options]
     * @param {string} [options.title]
     * @param {number} [options.x] position
     * @param {number} [options.y] position
     * @param {boolean} [options.modal]
     * @param {(number|*)} [options.id] if not provide, id will be assigned in order of creation (0, 1, 2...)
     * @returns {Window} the created window
     */
    createWindow(options={})
    {
        const win = new Window(this, Object.assign({}, this.defaultOptions, options))
        win.on('open', () => this._open(win))
        win.on('focus', () => this._focus(win))
        win.on('blur', () => this._blur(win))
        win.on('close', () => this._close(win))
        win.win.addEventListener('mousemove', (e) => this._move(e))
        win.win.addEventListener('touchmove', (e) => this._move(e))
        win.win.addEventListener('mouseup', (e) => this._up(e))
        win.win.addEventListener('touchend', (e) => this._up(e))
        if (this._snap && !options.noSnap)
        {
            this._snap.addWindow(win)
        }
        win.resize(this.bounds, this.options.keepInside)
        if (win.options.openOnCreate)
        {
            win.open()
        }
        return win
    }

    /**
     * Attach an existing window to the WindowManager
     * Note: WindowManager.createWindow is the preferred way to create windows to ensure that all the defaultOptions
     * are applied to the Window. If you use this function, then Window needs to be initialized with WindowOptions.
     * @param {Window} win
     * @returns {Window} the window
     */
    attachWindow(win)
    {
        win.on('open', this._open, this)
        win.on('focus', this._focus, this)
        win.on('blur', this._blur, this)
        win.on('close', this._close, this)
        this.win.appendChild(win.win)
        win.wm = this
        win.win.addEventListener('mousemove', (e) => this._move(e))
        win.win.addEventListener('touchmove', (e) => this._move(e))
        win.win.addEventListener('mouseup', (e) => this._up(e))
        win.win.addEventListener('touchend', (e) => this._up(e))
        if (this._snap && !this.defaultOptions.noSnap)
        {
            this._snap.addWindow(win)
        }
        return win
    }

    /**
     * enable edge and/or screen snapping
     * @param {SnapOptions} options
     */
    snap(options)
    {
        this._snap = new Snap(this, options)
        for (let win of this.windows)
        {
            if (!win.options.noSnap)
            {
                this._snap.addWindow(win)
            }
        }
    }

    /**
     * send window to front
     * @param {Window} win
     */
    sendToFront(win)
    {
        const index = this.windows.indexOf(win)
        console.assert(index !== -1, 'sendToFront should find window in this.windows')
        if (index !== this.windows.length - 1)
        {
            this.windows.splice(index, 1)
            this.windows.push(win)
            this._reorder()
        }
    }

    /**
     * send window to back
     * @param {Window} win
     */
    sendToBack(win)
    {
        const index = this.windows.indexOf(win)
        console.assert(index !== -1, 'sendToFront should find window in this.windows')
        if (index !== 0)
        {
            this.windows.splice(index, 1)
            this.windows.unshift(win)
            this._reorder()
        }
    }

    /**
     * save the state of all the windows
     * @returns {object} use this object in load() to restore the state of all windows
     */
    save()
    {
        const data = {}
        for (let i = 0; i < this.windows.length; i++)
        {
            const entry = this.windows[i]
            data[entry.id] = entry.save()
            data[entry.id].order = i
        }
        return data
    }

    /**
     * restores the state of all the windows
     * NOTE: this requires that the windows have the same id as when save() was called
     * @param {object} data created by save()
     */
    load(data)
    {
        for (let i = 0; i < this.windows.length; i++)
        {
            const entry = this.windows[i]
            if (data[entry.id])
            {
                entry.load(data[entry.id])
            }
        }
        // reorder windows
    }

    /**
     * close all windows
     */
    closeAll()
    {
        for (let win of this.windows)
        {
            win.close()
        }
        this.windows = []
        this.active = null
    }

    /**
     * reorder windows
     * @private
     * @returns {number} available z-index for top window
     */
    _reorder()
    {
        let i = 0
        for (const win of this.windows)
        {
            if (!win.isClosed())
            {
                win.z = i++
            }
        }
    }

    /**
     * @param {HTMLElement} parent
     */
    _createDom(parent)
    {
        /**
         * This is the top-level DOM element
         * @type {HTMLElement}
         * @readonly
         */
        this.win = html({
            parent, styles: {
                'user-select': 'none',
                'width': '100%',
                'height': '100%',
                'overflow': 'hidden',
                'z-index': -1,
                'cursor': 'default'
            }
        })

        /**
         * This is the bottom DOM element. Use this to set a wallpaper or attach elements underneath the windows
         * @type {HTMLElement}
         * @readonly
         */
        this.overlay = html({
            parent: this.win, styles: {
                'user-select': 'none',
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'width': '100%',
                'height': '100%',
                'overflow': 'hidden'
            }
        })
        this.overlay.addEventListener('mousemove', (e) => this._move(e))
        this.overlay.addEventListener('touchmove', (e) => this._move(e))
        this.overlay.addEventListener('mouseup', (e) => this._up(e))
        this.overlay.addEventListener('touchend', (e) => this._up(e))

        this.modalOverlay = html({
            parent: this.win,
            styles: {
                'display': 'none',
                'user-select': 'none',
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'width': '100%',
                'height': '100%',
                'overflow': 'hidden',
                'background': this.defaultOptions.backgroundModal
            }
        })
        this.modalOverlay.addEventListener('mousemove', (e) => { this._move(e); e.preventDefault(); e.stopPropagation() })
        this.modalOverlay.addEventListener('touchmove', (e) => { this._move(e); e.preventDefault(); e.stopPropagation() })
        this.modalOverlay.addEventListener('mouseup', (e) => { this._up(e); e.preventDefault(); e.stopPropagation() })
        this.modalOverlay.addEventListener('touchend', (e) => { this._up(e); e.preventDefault(); e.stopPropagation() })
        this.modalOverlay.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation() })
        this.modalOverlay.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation() })
    }

    _open(win)
    {
        this.windows.push(win)
        this._reorder()
        if (win.options.modal)
        {
            this.modalOverlay.style.display = 'block'
            this.modalOverlay.style.zIndex = win.z
        }
        else
        {
            this.modalOverlay.style.display = 'none'
        }
    }

    _focus(win)
    {
        if (this.active === win)
        {
            return
        }
        if (this.active)
        {
            this.active.blur()
        }
        const index = this.windows.indexOf(win)
        console.assert(index !== -1, 'WindowManager._focus should find window in this.windows')
        if (index !== this.windows.length - 1)
        {
            this.windows.splice(index, 1)
            this.windows.push(win)
        }
        this._reorder()
        this.active = this.windows[this.windows.length - 1]
    }

    _blur(win)
    {
        if (this.active === win)
        {
            this.active = null
        }
    }

    _close(win)
    {
        const index = this.windows.indexOf(win)
        console.assert(index !== -1, 'WindowManager._close should find window in this.windows')
        this.windows.splice(index, 1)
        const next = this.windows[this.windows.length - 1]
        if (win.isModal(true))
        {
            if (next && next.isModal())
            {
                this.modalOverlay.style.zIndex = next.z
            }
            else
            {
                this.modalOverlay.style.display = 'none'
            }
        }
        next.focus()
    }

    _move(e)
    {
        for (const key in this.windows)
        {
            this.windows[key]._move(e)
        }
    }

    _up(e)
    {
        for (const key in this.windows)
        {
            this.windows[key]._up(e)
        }
    }

    checkModal(win)
    {
        return !this.modal || this.modal === win
    }

    /** @type {Bounds} */
    get bounds()
    {
        return {
            top: this.win.offsetTop,
            bottom: this.win.offsetTop + this.win.offsetHeight,
            left: this.win.offsetLeft,
            right: this.win.offsetLeft + this.win.offsetWidth
        }
    }

    resize()
    {
        const bounds = this.bounds
        for (const key in this.windows)
        {
            this.windows[key].resize(bounds, this.options.keepInside)
        }
    }
}

/**
 * @typedef {object} SnapOptions
 * @property {boolean} [screen=true] snap to screen edges
 * @property {boolean} [windows=true] snap to window edges
 * @property {number} [snap=20] distance to edge before snapping
 * @property {string} [color=#a8f0f4] color for snap bars
 * @property {number} [spacing=0] spacing distance between window and edges
 */

/**
 * @typedef {object} Bounds
 * @property {number} left
 * @property {number} right
 * @property {number} top
 * @property {number} bottom
 */