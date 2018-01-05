const Events = require('eventemitter3')

const html = require('./html')
const Window = require('./window')

module.exports = class WindowManager extends Events
{
    /**
     * constructor for WindowManager
     */
    constructor()
    {
        super()
        this._createWindow()
        this.windows = []
        this.active = null
    }

    /**
     * create window
     * @param {object} [options] see below for options
     */
    createWindow(options)
    {
        const win = new Window(this, options);
        win.on('open', this._open, this)
        win.on('focus', this._focus, this)
        win.on('blur', this._blur, this)
        win.on('close', this._close, this)
        return win
    }

    _createWindow()
    {
        this.win = html.create({
            parent: document.body, styles: {
                'user-select': 'none',
                'width': '100%',
                'height': '100%',
                'overflow': 'hidden',
                'z-index': -1,
                'cursor': 'default'
            }
        })
        this.overlay = html.create({
            parent: this.win, styles: {
                'user-select': 'none',
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'width': '100%',
                'height': '100%',
                'overflow': 'hidden',
                'opacity': 0
            }
        })
    }

    _open(win)
    {
        const index = this.windows.indexOf(win)
        if (index === 1)
        {
            this.windows.push(win)
        }
    }

    _focus(win)
    {
        const baseZ = 10000
        const maxZ = baseZ + 10000
        let currentZ, index

        if (this.active === win)
        {
            return
        }

        if (this.active)
        {
            currentZ = this.active.z
            this.active.blur()
        }
        else
        {
            currentZ = baseZ
        }

        // Reorder windows stack
        index = this.windows.indexOf(win)
        this.windows.splice(index, 1)
        this.windows.push(win)

        win.z = currentZ + 1

        // Refresh z-indexes just every 'maxZ' activations
        if (currentZ > maxZ + this.windows.length)
        {
            for (var z, i = this.windows.length; i--;)
            {
                z = this.windows[i].z
                this.windows[i].z = baseZ + (z - maxZ)
            }
        }

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
}