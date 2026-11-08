import { html } from './html'
import { Window } from './Window'
import { defaultWindowManagerOptions, defaultWindowOptions } from './defaults'
import { Snap } from './Snap'
import { accelerator } from './accelerator'
import { Menu } from './Menu/Menu'

/**
 * Create the WindowManager
 * @param {Object} [options]
 * @param {HTMLElement} [options.parent=document.body] parent to append WindowManager
 * @param {string} [options.backgroundModal=rgba(0, 0, 0, 0.6)] background color for window
 * @param {boolean} [options.quiet] suppress the simple-window-manager console message
 * @param {(boolean|WindowManager~SnapOptions)} [options.snap] initialize snap plugin
 * @param {boolean} [options.noAccelerator] do not initialize keyboard accelerators (needed for Menu)
 * @param {(boolean|'horizontal'|'vertical')} [options.keepInside=true] keep windows inside the parent in a certain direction
 * @param {Object} [options.styles] additional hard-coded styles for main container window (eg, { color: 'green' })
 * @param {Window~WindowOptions} [windowOptions] default options used when createWindow is called
 */
export class WindowManager
{
    constructor(options = {}, windowOptions = {})
    {
        this.options = { ...defaultWindowManagerOptions, ...options }
        this.options.parent = this.options.parent || document.body
        if (!this.options.quiet)
        {
            console.log('%c ☕ simple-window-manager initialized ☕', 'color: #ff00ff')
        }
        this.windows = []
        this.active = null
        this._setupWin()
        this._setupWallpaper()
        this._setupModal()
        if (this.options.snap)
        {
            this.snap(this.options.snap === true ? {} : this.options.snap)
        }
        this.windowOptions = { ...defaultWindowOptions, ...windowOptions }
        window.addEventListener('resize', () => this.resize())
        if (!this.options.noAccelerator)
        {
            accelerator.init()
        }
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
    createWindow(options = {})
    {
        const win = new Window(this, { ...this.windowOptions, ...options })
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
        win.reposition(this.bounds, this.options.keepInside)
        if (win.options.openOnCreate)
        {
            win.open()
        }
        return win
    }

    /**
     * enable edge and/or screen snapping
     * @param {WindowManager~SnapOptions} [options]
     */
    snap(options)
    {
        this._snap = new Snap(this, options)
        for (const win of this.windows)
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
     * @returns {Object} use this object in load() to restore the state of all windows
     */
    save()
    {
        const data = {}
        for (let i = 0; i < this.windows.length; i++)
        {
            const win = this.windows[i]
            data[win.id] = win.save()
            data[win.id].order = i
        }
        return data
    }

    /**
     * restores the state of all the windows
     * NOTE: this requires that the windows have the same id as when save() was called
     * @param {Object} data created by save()
     */
    load(data)
    {
        for (const id in data)
        {
            const win = this.getWindowById(id)
            if (win)
            {
                win.load(data[id])
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

    _setupWin()
    {
        /**
         * This is the top-level DOM element
         * @type {HTMLElement}
         * @readonly
         */
        this.win = html({
            parent: this.options.parent,
            styles: {
                ...{
                    'user-select': 'none',
                    'width': '100%',
                    'height': '100%',
                    'overflow': 'hidden',
                    'z-index': -1,
                    'cursor': 'default',
                },
                ...this.options.styles
            }
        })
    }

    _setupWallpaper()
    {
        /**
         * This is the bottom DOM element. Use this to set a wallpaper or attach elements underneath the windows
         * @type {HTMLElement}
         * @readonly
         */
        this.wallpaper = html({
            parent: this.win,
            styles: {
                ...{
                    'user-select': 'none',
                    'position': 'absolute',
                    'top': 0,
                    'left': 0,
                    'width': '100%',
                    'height': '100%',
                    'overflow': 'hidden'
                }
            }
        })
        this.wallpaper.addEventListener('mousemove', (e) => this._move(e))
        this.wallpaper.addEventListener('touchmove', (e) => this._move(e))
        this.wallpaper.addEventListener('mouseup', (e) => this._up(e))
        this.wallpaper.addEventListener('touchend', (e) => this._up(e))
    }

    _setupModal()
    {
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
                'background': this.options.backgroundModal
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
        if (win.isModal(true))
        {
            const next = this.windows[this.windows.length - 1]
            if (next && next.isModal())
            {
                this.modalOverlay.style.zIndex = next.z
            }
            else
            {
                this.modalOverlay.style.display = 'none'
            }
        }
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

    /** @type {WindowManager~Bounds} */
    get bounds()
    {
        const top = Menu.getApplicationHeight()
        return {
            top: this.win.offsetTop + top,
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
            this.windows[key].reposition(bounds, this.options.keepInside)
        }
    }

    /**
     * Find a window by id
     * @param {*} id
     * @returns {Window}
     */
    getWindowById(id)
    {
        return this.windows.find(win => win.id === id)
    }
}

/**
 * @typedef {Object} WindowManager~Bounds
 * @property {number} left
 * @property {number} right
 * @property {number} top
 * @property {number} bottom
 */

 /**
  * @typedef {Object} WindowManager~SnapOptions
  * @property {boolean} [screen=true] snap to screen edges
  * @property {boolean} [windows=true] snap to window edges
  * @property {number} [snap=20] distance to edge in pixels before snapping and width/height of snap bars
  * @property {string} [color=#a8f0f4] color for snap bars
  * @property {number} [spacing=0] spacing distance between window and edges
  * @property {number} [indicator=10] size in pixels of snapping indicator (the indicator is actually twice the size of what is shown)
  */