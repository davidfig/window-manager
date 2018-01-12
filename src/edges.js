const html = require('./html')

const DEFAULT_COLOR = '#a8f0f4'
const DEFAULT_SIZE = 10

module.exports = class Edges
{
    constructor(wm, options)
    {
        options = options || {}
        this.wm = wm
        this.snap = 20
        this.edges = []
        this.highlights = html({ parent: this.wm.overlay, styles: { 'position': 'absolute' } })
        this.color = options.color || DEFAULT_COLOR
        this.size = options.size || DEFAULT_SIZE
        this.showing = []
        if (options.windows)
        {
            this.windows = {}
        }
        if (options.screen)
        {
            const edges = this.windowEdges = {}
            edges.top = this.addEdge({ type: 'horizontal', start: 0, end: window.innerWidth, y: 0 })
            edges.bottom = this.addEdge({ type: 'horizontal', start: 0, end: window.innerWidth, y: window.innerHeight })
            edges.left = this.addEdge({ type: 'vertical', start: 0, end: window.innerHeight, x: 0 })
            edges.right = this.addEdge({ type: 'vertical', start: 0, end: window.innerHeight, x: window.innerWidth })
            this.boundResizeWindowEdges = this.resizeWindowEdges.bind(this)
            window.addEventListener('resize', this.boundResizeWindowEdges)
        }
    }

    stop()
    {
        window.removeEventListener('resize', this.boundResizeWindowEdges)
        this.highlights.remove()
        this.stopped = true
    }

    resizeWindowEdges()
    {
        if (this.stopped)
        {
            return
        }
        const edges = this.windowEdges
        edges.top.end = window.innerWidth
        edges.bottom.end = window.innerWidth
        edges.bottom.y = window.innerHeight
        edges.left.end = window.innerHeight
        edges.right.end = window.innerHeight
        edges.right.x = window.innerWidth
    }

    addEdge(edge)
    {
        this.edges.push(edge)
        edge.show = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                backgroundColor: this.color
            }
        })
        this.resizeEdge(edge)
        return edge
    }

    resizeEdge(edge)
    {
        switch (edge.type)
        {
            case 'horizontal':
                edge.show.style.left = edge.start + 'px'
                edge.show.style.width = (edge.end - edge.start) + 'px'
                edge.show.style.top = (edge.y - this.size / 2) + 'px'
                edge.show.style.height = this.size + 'px'
                edge.show.style.borderRadius = this.size / 2 + 'px'
                break

            case 'vertical':
                edge.show.style.top = edge.start + 'px'
                edge.show.style.height = (edge.end - edge.start) + 'px'
                edge.show.style.left = (edge.x - this.size / 2) + 'px'
                edge.show.style.width = this.size + 'px'
                edge.show.style.borderRadius = this.size / 2 + 'px'
                break
        }
        return edge
    }

    addWindow(win)
    {
        win.on('move', () => this.move(win))
        win.on('move-end', () => this.moveEnd(win))
        if (this.windows)
        {
            win.on('move-start', () => this.moveStart(win))
            const edges = this.windows[win.id] = {}
            edges.top = this.addEdge({ type: 'horizontal', start: win.x, end: win.right, y: win.y, win })
            edges.bottom = this.addEdge({ type: 'horizontal', start: win.x, end: win.right, y: win.bottom, win })
            edges.left = this.addEdge({ type: 'vertical', start: win.y, end: win.bottom, x: win.x, win })
            edges.right = this.addEdge({ type: 'vertical', start: win.y, end: win.bottom, x: win.right, win })
            win.on('close', () => delete this.windows[win.id])
        }
    }

    moveStart(win)
    {
        for (let id in this.windows)
        {
            const window = this.windows[id].top.win
            if (window !== win)
            {
                this.updateEdges(window)
            }
        }
    }

    move(win)
    {
        if (this.stopped)
        {
            return
        }
        for (let edge of this.showing)
        {
            edge.show.style.display = 'none'
        }
        this.showing = []
        const horizontal = []
        const vertical = []
        for (let edge of this.edges)
        {
            if (edge.win && (edge.win.minimized || edge.win === win))
            {
                continue
            }
            switch (edge.type)
            {
                case 'horizontal':
                    if (win.x - this.snap <= edge.end && win.right + this.snap >= edge.start)
                    {
                        if (Math.abs(win.y - edge.y) <= this.snap)
                        {
                            horizontal.push({ edge, distance: Math.abs(win.y - edge.y), side: 'top' })
                            // edge.show.style.display = 'block'
                            // edge.side = 'top'
                            // this.showing.push(edge)
                        }
                        else if (Math.abs(win.bottom - edge.y) <= this.snap)
                        {
                            horizontal.push({ edge, distance: Math.abs(win.y - edge.y), side: 'bottom' })
                            // edge.show.style.display = 'block'
                            // edge.side = 'bottom'
                            // this.showing.push(edge)
                        }
                    }
                    break

                case 'vertical':
                    if (win.y - this.snap <= edge.end && win.bottom + this.snap >= edge.start)
                    {
                        if (Math.abs(win.x - edge.x) <= this.snap)
                        {
                            vertical.push({ edge, distance: Math.abs(win.x - edge.x), side: 'left' })
                            // edge.show.style.display = 'block'
                            // edge.side = 'left'
                            // this.showing.push(edge)
                        }
                        else if (Math.abs(win.right - edge.x) <= this.snap)
                        {
                            vertical.push({ edge, distance: Math.abs(win.right - edge.x), side: 'right' })
                            // edge.show.style.display = 'block'
                            // edge.side = 'right'
                            // this.showing.push(edge)
                        }
                    }
                    break
            }
        }
        if (horizontal.length)
        {
            horizontal.sort((a, b) => { return a.distance - b.distance })
            const find = horizontal[0]
            find.edge.show.style.display = 'block'
            find.edge.side = find.side
            this.showing.push(find.edge)
        }
        if (vertical.length)
        {
            vertical.sort((a, b) => { return a.distance - b.distance })
            const find = vertical[0]
            find.edge.show.style.display = 'block'
            find.edge.side = find.side
            this.showing.push(find.edge)
        }
    }

    moveEnd(win)
    {
        if (this.stopped)
        {
            return
        }
        for (let edge of this.showing)
        {
            switch (edge.side)
            {
                case 'top':
                    win.y = edge.y
                    break

                case 'bottom':
                    win.bottom = edge.y
                    break

                case 'left':
                    win.x = edge.x
                    break

                case 'right':
                    win.right = edge.x
                    break
            }
            edge.show.style.display = 'none'
        }
        if (this.windows)
        {
            this.updateEdges(win)
        }
    }

    updateEdges(win)
    {
        const edges = this.windows[win.id]
        edges.top.start = win.x
        edges.top.end = win.right
        edges.top.y = win.y
        this.resizeEdge(edges.top)
        edges.bottom.start = win.x
        edges.bottom.end = win.right
        edges.bottom.y = win.bottom
        this.resizeEdge(edges.bottom)
        edges.left.start = win.y
        edges.left.end = win.bottom
        edges.left.x = win.x
        this.resizeEdge(edges.left)
        edges.right.start = win.y
        edges.right.end = win.bottom
        edges.right.x = win.right
        this.resizeEdge(edges.right)
    }
}