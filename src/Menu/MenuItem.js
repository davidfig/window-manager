import { html } from '../html'
import { config } from './config'
import { accelerator } from '../accelerator'

/**
 * creates a MenuItem within a Menu
 * @param {object} options
 * @param {string} [options.label] label for menu entry may include accelerator by placing & before letter)
 * @param {string} [options.type] separator, checkbox, or undefined
 * @param {object} [options.styles] additional CSS styles to apply to this MenuItem
 * @param {string} [options.accelerator] see Accelerator for inputs (e.g., ctrl+shift+A)
 * @param {MenuItem} [options.submenu] attaches a submenu (and changes type to submenu)
 * @param {boolean} [options.checked] check the checkbox
 */
export class MenuItem
{
    constructor(options)
    {
        options = options || {}
        this.styles = options.styles
        this.div = html()
        this.type = options.type
        this.click = options.click
        if (this.type === 'separator')
        {
            this.applyConfig(config.SeparatorStyle)
        }
        else
        {
            this._checked = options.checked
            this.createChecked(options.checked)
            this.text = options.label || '&nbsp;&nbsp;&nbsp;'
            this.createShortcut()
            this.createAccelerator(options.accelerator)
            this.createSubmenu(options.submenu)
            if (options.submenu)
            {
                this.submenu = options.submenu
                this.submenu.applyConfig(config.MenuStyle)
            }
            this.applyConfig(config.RowStyle)
            this.div.addEventListener('mousedown', (e) => this.handleClick(e))
            this.div.addEventListener('touchstart', (e) => this.handleClick(e))
            this.div.addEventListener('mouseenter', () => this.mouseenter())
            this.div.addEventListener('mouseleave', () => this.mouseleave())
        }
    }

    /**
     * The click callback
     * @callback MenuItem~ClickCallback
     * @param {InputEvent} e
     */

    mouseenter()
    {
        if (!this.submenu || this.menu.showing !== this )
        {
            this.div.style.backgroundColor = config.SelectedBackgroundStyle
            if (this.submenu && (!this.menu.applicationMenu || this.menu.showing))
            {
                this.submenuTimeout = setTimeout(() =>
                {
                    this.submenuTimeout = null
                    this.submenu.show(this)
                }, this.menu.applicationMenu ? 0 : config.SubmenuOpenDelay)
            }
        }
    }

    mouseleave()
    {
        if (!this.submenu || this.menu.showing !== this)
        {
            if (this.submenuTimeout)
            {
                clearTimeout(this.submenuTimeout)
                this.submenuTimeout = null
            }
            this.div.style.backgroundColor = 'transparent'
        }
    }

    applyConfig(base)
    {
        const styles = {}
        for (let style in base)
        {
            styles[style] = base[style]
        }
        if (this.styles)
        {
            for (let style in this.styles)
            {
                styles[style] = this.styles[style]
            }
        }
        for (let style in styles)
        {
            this.div.style[style] = styles[style]
        }
    }

    createChecked(checked)
    {
        this.check = html({ parent: this.div, html: checked ? '&#10004;' : '' })
    }

    createShortcut()
    {
        if (this.type !== 'separator')
        {
            const text = this.text
            this.label = html({ parent: this.div })
            let current = html({ parent: this.label, type: 'span' })
            if (text.indexOf('&') !== -1)
            {
                let i = 0
                do
                {
                    const letter = text[i]
                    if (letter === '&')
                    {
                        i++
                        this.shortcutSpan = html({ parent: this.label, type: 'span', html: text[i], styles: config.AcceleratorKeyStyle })
                        current = html({ parent: this.label, type: 'span' })
                    }
                    else
                    {
                        current.innerHTML += letter
                    }
                    i++
                }
                while (i < text.length)
            }
            else
            {
                this.label.innerHTML = text
            }
        }
    }

    showShortcut()
    {
        if (this.shortcutSpan)
        {
            this.shortcutSpan.style.textDecoration = 'underline'
        }
    }

    hideShortcut()
    {
        if (this.shortcutSpan)
        {
            this.shortcutSpan.style.textDecoration = 'none'
        }
    }

    createAccelerator(acceleratorKey)
    {
        this.accelerator = html({ parent: this.div, html: acceleratorKey ? accelerator.prettifyKey(acceleratorKey) : '', styles: config.AcceleratorStyle })
        if (accelerator)
        {
            accelerator.register(acceleratorKey, (e) => this.click(e))
        }
    }

    createSubmenu(submenu)
    {
        this.arrow = html({ parent: this.div, html: submenu ? '&#9658;' : '' })
    }

    closeAll()
    {
        let menu = this.menu
        accelerator.unregisterMenuShortcuts()
        while (menu && !menu.applicationMenu)
        {
            if (menu.showing)
            {
                menu.showing.div.style.backgroundColor = 'transparent'
                menu.showing = null
            }
            menu.div.remove()
            menu = menu.menu
        }
        if (menu.showing)
        {
            menu.showing.div.style.background = 'transparent'
            menu.showing = null
            menu.hideAccelerators()
        }
    }

    handleClick(e)
    {
        if (this.submenu)
        {
            if (this.submenuTimeout)
            {
                clearTimeout(this.submenuTimeout)
                this.submenuTimeout = null
            }
            this.submenu.show(this)
            this.div.style.backgroundColor = config.SelectedBackgroundStyle
            if (typeof e !== 'undefined' && this.menu.applicationMenu && document.activeElement !== this.menu.div)
            {
                this.menu.div.focus()
            }
            if (e)
            {
                e.preventDefault()
            }
        }
        else if (this.type === 'checkbox')
        {
            this.checked = !this.checked
            this.closeAll()
        }
        else
        {
            this.closeAll()
        }

        if (this.click)
        {
            this.click(e, this)
        }
    }

    get checked()
    {
        return this._checked
    }
    set checked(value)
    {
        this._checked = value
        this.check.innerHTML = this._checked ? '&#10004;' : ''
    }
}