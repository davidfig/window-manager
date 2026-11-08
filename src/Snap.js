import { html } from './html'
import { Menu } from './Menu/Menu'

const DEFAULT_COLOR = '#a8f0f4'
const DEFAULT_SIZE = 10

const SnapOptionsDefault = {
    screen: true,
    windows: true,
    snap: 20,
    color: DEFAULT_COLOR,
    spacing: 0,
    indicator: DEFAULT_SIZE
}

/**
 * edge snapping plugin
 * @param {WindowManager} wm
 * @param {object} [options]
 * @param {boolean} [options.screen=true] snap to screen edges
 * @param {boolean} [options.windows=true] snap to window edges
 * @param {number} [options.snap=20] distance to edge in pixels before snapping and width/height of snap bars
 * @param {string} [options.color=#a8f0f4] color for snap bars
 * @param {number} [options.spacing=0] spacing distance between window and edges
 * @param {number} [options.indicator=10] size in pixels of snapping indicator (the indicator is actually twice the size of what is shown)
 * @ignore
 */
export class Snap
{
    constructor(wm, options={})
    {
        this.wm = wm
        this.options = { ...SnapOptionsDefault, ...options }
        this.highlights = html({ parent: this.wm.wallpaper, styles: { position: 'absolute' } })
        this.horizontal = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                height: `${this.options.indicator}px`,
                borderRadius: `${this.options.indicator}px`,
                backgroundColor: this.options.color
            }
        })
        this.vertical = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                width: `${this.options.indicator}px`,
                borderRadius: `${this.options.indicator}px`,
                backgroundColor: this.options.color
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
        const top = Menu.getApplicationHeight()
        const width = this.wm.win.clientWidth
        const height = this.wm.win.clientHeight
        if (rect.left - this.options.snap <= width && rect.right + this.options.snap >= 0)
        {
            if (Math.abs(rect.top - top) <= this.options.snap)
            {
                horizontal.push({ distance: Math.abs(rect.top - top), left: 0, width, top: top, side: 'top', screen: true })
            }
            else if (Math.abs(rect.bottom - height) <= this.options.snap)
            {
                horizontal.push({ distance: Math.abs(rect.bottom - height), left: 0, width, top: height, side: 'bottom', screen: true })
            }
        }
        if (rect.top - this.options.snap <= height && rect.bottom + this.options.snap >= 0)
        {
            if (Math.abs(rect.left - 0) <= this.options.snap)
            {
                vertical.push({ distance: Math.abs(rect.left - 0), top: 0, height, left: 0, side: 'left', screen: true })
            }
            else if (Math.abs(rect.right - width) <= this.options.snap)
            {
                vertical.push({ distance: Math.abs(rect.right - width), top: 0, height, left: width, side: 'right', screen: true })
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
                if (rect.left - this.options.snap <= rect2.right && rect.right + this.options.snap >= rect2.left)
                {
                    if (Math.abs(rect.top - rect2.bottom) <= this.options.snap)
                    {
                        horizontal.push({ distance: Math.abs(rect.top - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'top' })
                        if (Math.abs(rect.left - rect2.left) <= this.options.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true })
                        }
                        else if (Math.abs(rect.right - rect2.right) <= this.options.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true })
                        }
                    }
                    else if (Math.abs(rect.bottom - rect2.top) <= this.options.snap)
                    {
                        horizontal.push({ distance: Math.abs(rect.bottom - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'bottom' })
                        if (Math.abs(rect.left - rect2.left) <= this.options.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true })
                        }
                        else if (Math.abs(rect.right - rect2.right) <= this.options.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true })
                        }
                    }
                }
                if (rect.top - this.options.snap <= rect2.bottom && rect.bottom + this.options.snap >= rect2.top)
                {
                    if (Math.abs(rect.left - rect2.right) <= this.options.snap)
                    {
                        vertical.push({ distance: Math.abs(rect.left - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'left' })
                        if (Math.abs(rect.top - rect2.top) <= this.options.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true })
                        }
                        else if (Math.abs(rect.bottom - rect2.bottom) <= this.options.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true })
                        }
                    }
                    else if (Math.abs(rect.right - rect2.left) <= this.options.snap)
                    {
                        vertical.push({ distance: Math.abs(rect.right - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'right' })
                        if (Math.abs(rect.top - rect2.top) <= this.options.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true })
                        }
                        else if (Math.abs(rect.bottom - rect2.bottom) <= this.options.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true })
                        }
                    }
                }
            }
        }
    }

    move(win)
    {
        if (this.stopped || win.options.noSnap || win.isModal())
        {
            return
        }
        this.horizontal.style.display = 'none'
        this.vertical.style.display = 'none'
        const horizontal = []
        const vertical = []
        const rect = win.win.getBoundingClientRect()
        if (this.options.screen)
        {
            this.screenMove(rect, horizontal, vertical)
        }
        if (this.options.windows)
        {
            this.windowsMove(win, rect, horizontal, vertical)
        }
        if (horizontal.length)
        {
            horizontal.sort((a, b) => { return a.distance - b.distance })
            const find = horizontal[0]
            this.horizontal.style.display = 'block'
            this.horizontal.style.width = find.width + 'px'
            this.horizontal.y = find.top - this.options.indicator / 2
            this.horizontal.yPosition = find.top
            this.horizontal.style.transform = `translate(${find.left}px,${this.horizontal.y}px)`
            this.horizontal.side = find.side
            this.horizontal.noSpacing = find.noSpacing
            this.horizontal.screen = find.screen
        }
        if (vertical.length)
        {
            vertical.sort((a, b) => { return a.distance - b.distance })
            const find = vertical[0]
            this.vertical.style.display  = 'block'
            this.vertical.style.height = find.height + 'px'
            this.vertical.x = find.left - this.options.indicator / 2
            this.vertical.xPosition = find.left
            this.vertical.style.transform = `translate(${this.vertical.x}px,${find.top}px)`
            this.vertical.side = find.side
            this.vertical.noSpacing = find.noSpacing
            this.vertical.screen = find.screen
        }
    }

    moveEnd(win)
    {
        if (this.stopped)
        {
            return
        }
        const bounds = this.wm.bounds
        const top = Menu.getApplicationHeight()
        if (this.horizontal.style.display === 'block')
        {
            const spacing = this.horizontal.noSpacing ? 0 : this.options.spacing
            switch (this.horizontal.side)
            {
                case 'top':
                    win.y = this.horizontal.yPosition + spacing - bounds.top + top
                    break

                case 'bottom':
                    win.bottom = Math.floor(this.horizontal.yPosition - spacing - bounds.top + top)
                    break
            }
            win.attachToScreen('vertical', this.horizontal.screen ? this.horizontal.side : '')
        }
        if (this.vertical.style.display === 'block')
        {
            const spacing = this.vertical.noSpacing ? 0 : this.options.spacing
            switch (this.vertical.side)
            {
                case 'left':
                    win.x = this.vertical.xPosition + spacing - bounds.left
                    break

                case 'right':
                    win.right = Math.floor(this.vertical.xPosition - spacing - bounds.left)
                    break
            }
            win.attachToScreen('horziontal', this.vertical.screen ? this.vertical.side : '')
        }
        this.horizontal.style.display = this.vertical.style.display = 'none'
    }
}


/**
 * @typedef {Object} Snap~SnapOptions
 * @property {boolean} [screen=true] snap to screen edges
 * @property {boolean} [windows=true] snap to window edges
 * @property {number} [snap=20] distance to edge before snapping
 * @property {string} [color=#a8f0f4] color for snap bars
 * @property {number} [spacing=0] spacing distance between window and edges
 * @property {number} [options.indicator=10] size in pixels of snapping indicator (the indicator is actually twice the size of what is shown)
 */