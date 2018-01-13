const html = require('./html')

const DEFAULT_COLOR = '#a8f0f4'
const DEFAULT_SIZE = 10

module.exports = class Snap
{
    /**
     * add edge snapping plugin
     * @param {object} options
     * @param {boolean} [options.screen] snap to screen edges
     * @param {boolean} [options.windows] snap to window edges
     * @private
     */
    constructor(wm, options)
    {
        options = options || {}
        this.wm = wm
        this.snap = 20
        this.screen = options.screen
        this.windows = options.windows
        const backgroundColor = options.color || DEFAULT_COLOR
        this.size = options.size || DEFAULT_SIZE
        this.highlights = html({ parent: this.wm.overlay, styles: { 'position': 'absolute' } })
        this.horizontal = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                height: this.size + 'px',
                backgroundColor
            }
        })
        this.vertical = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                width: this.size + 'px',
                backgroundColor
            }
        })
        this.horizontal
        this.showing = []
    }

    stop()
    {
        this.highlights.remove()
        this.stopped = true
    }

    addWindow(win)
    {
        win.on('move', () => this.move(win))
        win.on('move-end', () => this.moveEnd(win))
    }

    screenMove(rect, horizontal, vertical)
    {
        const width = document.body.clientWidth
        const height = document.body.clientHeight
        if (rect.left - this.snap <= width && rect.left + rect.width + this.snap >= 0)
        {
            if (Math.abs(rect.top - 0) <= this.snap)
            {
                horizontal.push({ distance: Math.abs(rect.top - 0), left: 0, width, top: 0, side: 'top' })
            }
            else if (Math.abs(rect.top + rect.height - height) <= this.snap)
            {
                horizontal.push({ distance: Math.abs(rect.top + rect.height - height), left: 0, width, top: height, side: 'bottom' })
            }
        }
        if (rect.top - this.snap <= height && rect.top + rect.height + this.snap >= 0)
        {
            if (Math.abs(rect.left - 0) <= this.snap)
            {
                vertical.push({ distance: Math.abs(rect.left - 0), top: 0, height, left: 0, side: 'left' })
            }
            else if (Math.abs(rect.left + rect.width - width) <= this.snap)
            {
                vertical.push({ distance: Math.abs(rect.left + rect.width - width), top: 0, height, left: width, side: 'right' })
            }
        }
    }

    windowsMove(original, rect, horizontal, vertical)
    {
        for (let win of this.wm.windows)
        {
            if (!win.options.noSnap && win !== original)
            {
                const rect2 = win.win.getBoundingClientRect()
                if (rect.left - this.snap <= rect2.right && rect.right + this.snap >= rect2.left)
                {
                    if (Math.abs(rect.top - rect2.bottom) <= this.snap)
                    {
                        horizontal.push({ distance: Math.abs(rect.top - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'top' })
                    }
                    else if (Math.abs(rect.bottom - rect2.top) <= this.snap)
                    {
                        horizontal.push({ distance: Math.abs(rect.bottom - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'bottom' })
                    }
                }
                if (rect.top - this.snap <= rect2.bottom && rect.bottom + this.snap >= rect2.top)
                {
                    if (Math.abs(rect.left - rect2.right) <= this.snap)
                    {
                        vertical.push({ distance: Math.abs(rect.left - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'left' })
                    }
                    else if (Math.abs(rect.right - rect2.left) <= this.snap)
                    {
                        vertical.push({ distance: Math.abs(rect.right - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'right' })
                    }
                }
            }
        }
    }

    move(win)
    {
        if (this.stopped || win.options.noSnap)
        {
            return
        }
        this.horizontal.style.display = 'none'
        this.vertical.style.display = 'none'
        const horizontal = []
        const vertical = []
        const rect = win.win.getBoundingClientRect()
        if (this.screen)
        {
            this.screenMove(rect, horizontal, vertical)
        }
        if (this.windows)
        {
            this.windowsMove(win, rect, horizontal, vertical)
        }
        if (horizontal.length)
        {
            horizontal.sort((a, b) => { return a.distance - b.distance })
            const find = horizontal[0]
            this.horizontal.style.display = 'block'
            this.horizontal.style.left = find.left + 'px'
            this.horizontal.style.width = find.width + 'px'
            this.horizontal.style.top = find.top - this.size / 2 + 'px'
            this.horizontal.y = find.top
            this.horizontal.side = find.side
        }
        if (vertical.length)
        {
            vertical.sort((a, b) => { return a.distance - b.distance })
            const find = vertical[0]
            this.vertical.style.display  = 'block'
            this.vertical.style.top = find.top + 'px'
            this.vertical.style.height = find.height + 'px'
            this.vertical.style.left = find.left - this.size / 2 + 'px'
            this.vertical.x = find.left
            this.vertical.side = find.side
        }
    }

    moveEnd(win)
    {
        if (this.stopped)
        {
            return
        }
        if (this.horizontal.style.display === 'block')
        {
            const adjust = win.minimized ? (win.height - win.height * win.minimized.scaleY) / 2 : 0
            switch (this.horizontal.side)
            {
                case 'top':

                    win.y = this.horizontal.y - adjust
                    break

                case 'bottom':
                    win.bottom = this.horizontal.y + adjust
                    break
            }
        }
        if (this.vertical.style.display === 'block')
        {
            const adjust = win.minimized ? (win.width - win.width * win.minimized.scaleX) / 2 : 0
            switch (this.vertical.side)
            {
                case 'left':
                    win.x = this.vertical.x - adjust
                    break

                case 'right':
                    win.right = this.vertical.x + adjust
                    break
            }
        }
        this.horizontal.style.display = this.vertical.style.display = 'none'
    }
}