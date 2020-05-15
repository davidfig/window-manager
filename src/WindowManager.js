import { html } from './html'
import { Window } from './Window'
import { windowOptions } from './windowOptions'
import { Snap } from './plugins/Snap'
import { LocalAccelerator } from './plugins/LocalAccelerator'
import { Menu } from './plugins/Menu'
export { Window } from './Window'

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
     * @param {boolean} [options.quiet] suppress the simple-window-manager console message
     * @param {object} [options]
     * @param {SnapOptions} [options.snap] turn on edge snapping
     * @param {Window~WindowOptions} [defaultOptions] default WindowOptions used when createWindow is called
     */
    constructor(options={}, defaultOptions={})
    {
        this.windows = []
        this.active = null
        this.modal = null
        this.defaultOptions = Object.assign({}, windowOptions, defaultOptions)
        if (!options.quiet)
        {
            console.log('%c ☕ simple-window-manager initialized ☕', 'color: #ff00ff')
        }
        this._createDom()
        this.plugins = []
        if (options.snap)
        {
            this.snap(options.snap)
        }
    }

    /**
     * Create a window
     * @param {Window~WindowOptions} [options]
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
        win.on('open', this._open, this)
        win.on('focus', this._focus, this)
        win.on('blur', this._blur, this)
        win.on('close', this._close, this)
        win.win.addEventListener('mousemove', (e) => this._move(e))
        win.win.addEventListener('touchmove', (e) => this._move(e))
        win.win.addEventListener('mouseup', (e) => this._up(e))
        win.win.addEventListener('touchend', (e) => this._up(e))
        if (this.plugins['snap'] && !options.noSnap)
        {
            this.plugins['snap'].addWindow(win)
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
        if (win.modal)
        {
            this.modal = win
        }
        if (this.plugins['snap'] && !this.defaultOptions.noSnap)
        {
            this.plugins['snap'].addWindow(win)
        }
        return win
    }

    /**
     * add edge snapping plugin
     * @param {SnapOptions} options
     */
    snap(options)
    {
        this.plugins['snap'] = new Snap(this, options)
        for (let win of this.windows)
        {
            if (!win.options.noSnap)
            {
                this.plugins['snap'].addWindow(win)
            }
        }
    }

    /**
     * adds an application menu
     * @param {MenuOptions} options
     */
    menu(options)
    {
        this.plugins['menu'] = new Menu(this, options)
        this.win.appendChild(this.plugins['menu'].div)
    }

    /**
     * add a local accelerator (keyboard event handler for menu and WindowsManager)
     * @param {LocalAcceleratorOptions} options
     */
    localAccelerator(options)
    {
        this.plugins['localAccelerator'] = new LocalAccelerator(this, options)
    }

    /**
     *
     * @param {string} name
     * @returns {(Menu|LocalAccelerator|Snap)}
     */
    getPlugin(name)
    {
        return this.plugins[name]
    }

    /**
     * remove plugin
     * @param {string} name of plugin
     */
    removePlugin(name)
    {
        if (this.plugins[name])
        {
            this.plugins[name].stop()
            delete this.plugins[name]
        }
    }

    /**
     * send window to front
     * @param {Window} win
     */
    sendToFront(win)
    {
        const index = this.windows.indexOf(win)
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
        this.modalOverlay.remove()
        this.active = this.modal = null
    }

    /**
     * reorder windows
     * @private
     * @returns {number} available z-index for top window
     */
    _reorder()
    {
        let i = 0
        for (; i < this.windows.length; i++)
        {
            this.windows[i].z = i
        }
    }

    _createDom()
    {
        /**
         * This is the top-level DOM element
         * @type {HTMLElement}
         * @readonly
         */
        this.win = html({
            parent: document.body, styles: {
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
            styles: {
                'user-select': 'none',
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'width': '100%',
                'height': '100%',
                'overflow': 'hidden',
                'background': this.defaultOptions.modalBackground
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
        const index = this.windows.indexOf(win)
        if (index === -1)
        {
            this.windows.push(win)
        }
        if (win.options.modal)
        {
            this._focus(win)
            this.modal = win
            this.win.appendChild(this.modalOverlay)
            this.modalOverlay.style.zIndex = win.z - 1
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
        if (index !== this.windows.length - 1)
        {
            this.windows.splice(index, 1)
            this.windows.push(win)
        }
        this._reorder()

        this.active = win
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
        if (this.modal === win)
        {
            this.modalOverlay.remove()
            this.modal = null
        }
        const index = this.windows.indexOf(win)
        if (index !== -1)
        {
            this.windows.splice(index, 1)
        }
        if (this.active === win)
        {
            this._blur(win)
        }
    }

    _move(e)
    {
        for (let key in this.windows)
        {
            this.windows[key]._move(e)
        }
    }

    _up(e)
    {
        for (let key in this.windows)
        {
            this.windows[key]._up(e)
        }
    }

    checkModal(win)
    {
        return !this.modal || this.modal === win
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