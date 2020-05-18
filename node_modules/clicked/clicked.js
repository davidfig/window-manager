/**
 * Watcher for click, double-click, or long-click event for both mouse and touch
 * @example
 * import { clicked } from 'clicked'
 *
 * function handleClick()
 * {
 *    console.log('I was clicked.')
 * }
 *
 * const div = document.getElementById('clickme')
 * const c = clicked(div, handleClick, { threshold: 15 })
 *
 * // change callback
 * c.callback = () => console.log('different clicker')
 *
 * // destroy
 * c.destroy()
 *
 * // using built-in querySelector
 * clicked('#clickme', handleClick2)
 *
 * // watching for all types of clicks
 * function handleAllClicks(e) {
 *     switch (e.type)
 *     {
 *         case 'clicked': ...
 *         case 'double-clicked': ...
 *         case 'long-clicked': ...
 *     }
 *
 *     // view UIEvent that caused callback
 *     console.log(e.event)
 * }
 * clicked('#clickme', handleAllClicks, { doubleClicked: true, longClicked: true })
 */

/** @type {object} */
const defaultOptions = {
    threshold: 10,
    clicked: true,
    doubleClicked: false,
    doubleClickedTime: 300,
    longClicked: false,
    longClickedTime: 500,
    capture: false,
    clickDown: false
}

/**
 * @param {HTMLElement|string} element or querySelector entry (e.g., #id-name or .class-name)
 * @param {ClickedCallback} callback called after a click, double click, or long click is registered
 * @param {object} [options]
 * @param {number} [options.threshold=10] if touch moves threshhold-pixels then the touch-click is cancelled
 * @param {boolean} [options.clicked=true] disable watcher for default clicked event
 * @param {boolean} [options.doubleClicked] enable watcher for double click
 * @param {number} [options.doubleClickedTime=500] wait time in millseconds for double click
 * @param {boolean} [options.longClicked] enable watcher for long click
 * @param {number} [options.longClickedTime=500] wait time for long click
 * @param {boolean} [options.clickDown] enable watcher for click start
 * @param {boolean} [options.capture]  events will be dispatched to this registered listener before being dispatched to any EventTarget beneath it in the DOM tree
 * @returns {Clicked}
 */
export function clicked(element, callback, options)
{
    return new Clicked(element, callback, options)
}

class Clicked
{
    constructor(element, callback, options)
    {
        if (typeof element === 'string')
        {
            element = document.querySelector(element)
            if (!element)
            {
                console.warn(`Unknown element: document.querySelector(${element}) in clicked()`)
                return
            }
        }
        this.options = Object.assign({}, defaultOptions, options)
        this.events = {
            mousedown: (e) => this.mousedown(e),
            mouseup: (e) => this.mouseup(e),
            mousemove: (e) => this.mousemove(e),
            touchstart: (e) => this.touchstart(e),
            touchmove: (e) => this.touchmove(e),
            touchcancel: (e) => this.cancel(e),
            touchend: (e) => this.touchend(e)
        }
        element.addEventListener('mousedown', this.events.mousedown, { capture: this.options.capture })
        element.addEventListener('mouseup', this.events.mouseup, { capture: this.options.capture })
        element.addEventListener('mousemove', this.events.mousemove, { capture: this.options.capture })
        element.addEventListener('touchstart', this.events.touchstart, { passive: true, capture: this.options.capture })
        element.addEventListener('touchmove', this.events.touchmove, { passive: true, capture: this.options.capture })
        element.addEventListener('touchcancel', this.events.touchcancel, { capture: this.options.capture})
        element.addEventListener('touchend', this.events.touchend, { capture: this.options.capture })
        this.element = element
        this.callback = callback
    }

    /**
     * removes event listeners added by Clicked
     */
    destroy()
    {
        this.element.removeEventListener('mousedown', this.events.mousedown)
        this.element.removeEventListener('mouseup', this.events.mouseup)
        this.element.removeEventListener('mousemove', this.events.mousemove)
        this.element.removeEventListener('touchstart', this.events.touchstart, { passive: true })
        this.element.removeEventListener('touchmove', this.events.touchmove, { passive: true })
        this.element.removeEventListener('touchcancel', this.events.touchcancel)
        this.element.removeEventListener('touchend', this.events.touchend)
    }

    touchstart(e)
    {
        if (this.down === true)
        {
            this.cancel()
        }
        else
        {
            if (e.touches.length === 1)
            {
                this.handleDown(e.changedTouches[0].screenX, e.changedTouches[0].screenY)
            }
        }
    }

    pastThreshold(x, y)
    {
        return Math.abs(this.lastX - x) > this.options.threshold || Math.abs(this.lastY - y) > this.options.threshold
    }

    touchmove(e)
    {
        if (this.down)
        {
            if (e.touches.length !== 1)
            {
                this.cancel()
            }
            else
            {
                const x = e.changedTouches[0].screenX
                const y = e.changedTouches[0].screenY
                if (this.pastThreshold(x, y))
                {
                    this.cancel()
                }
            }
        }
    }

    /** cancel current event */
    cancel()
    {
        this.down = false
        if (this.doubleClickedTimeout)
        {
            clearTimeout(this.doubleClickedTimeout)
            this.doubleClickedTimeout = null
        }
        if (this.longClickedTimeout)
        {
            clearTimeout(this.longClickedTimeout)
            this.longClickedTimeout = null
        }
    }

    touchend(e)
    {
        if (this.down)
        {
            e.preventDefault()
            this.handleClicks(e, e.pointerId)
        }
    }

    handleClicks(e)
    {
        if (this.options.doubleClicked)
        {
            this.doubleClickedTimeout = setTimeout(() => this.doubleClickedCancel(e), this.options.doubleClickedTime)
        }
        else if (this.options.clicked)
        {
            this.callback({ event: e, type: 'clicked' })
        }
        if (this.longClickedTimeout)
        {
            clearTimeout(this.longClickedTimeout)
            this.longClickedTimeout = null
        }
        this.down = false
    }

    handleDown(e, x, y)
    {
        if (this.doubleClickedTimeout)
        {
            if (this.pastThreshold(x, y))
            {
                if (this.options.clicked)
                {
                    this.callback({ event: e, type: 'clicked' })
                }
                this.cancel()
            }
            else
            {
                this.callback({ event: e, type: 'double-clicked' })
                this.cancel()
            }
        }
        else
        {
            this.lastX = x
            this.lastY = y
            this.down = true
            if (this.options.longClicked)
            {
                this.longClickedTimeout = setTimeout(() => this.longClicked(e), this.options.longClickedTime)
            }
            if (this.options.clickDown) {
                this.callback({ event: e, type: 'click-down' })
            }
        }
    }

    longClicked(e)
    {
        this.longClikedTimeout = null
        this.down = false
        this.callback({ event: e, type: 'long-clicked' })
    }

    doubleClickedCancel(e)
    {
        this.doubleClickedTimeout = null
        if (this.options.clicked)
        {
            this.callback({ event: e, type: 'double-clicked' })
        }
    }

    mousedown(e)
    {
        if (this.down === true)
        {
            this.down = false
        }
        else
        {
            this.handleDown(e, e.screenX, e.screenY)
        }
    }

    mousemove(e)
    {
        if (this.down)
        {
            const x = e.screenX
            const y = e.screenY
            if (this.pastThreshold(x, y))
            {
                this.cancel()
            }
        }
    }

    mouseup(e)
    {
        if (this.down)
        {
            e.preventDefault()
            this.handleClicks(e)
        }
    }
}

/**
 * Callback for
 * @callback Clicked~ClickedCallback
 * @param {UIEvent} event
 * @param {('clicked'|'double-clicked'|'long-clicked'|'click-down')} type
 */