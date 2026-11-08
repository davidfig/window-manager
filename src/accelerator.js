/**
 * Keyboard Accelerator support used by menu (if available) and user-registered keys. Also works for user-defined keys independent of the menu system. Automatically instantiated when used with WindowManager.
 */
class Accelerator {

    init()
    {
        // may be initialized by Menu or WindowManager in any order
        if (!this.initialized)
        {
            this.menuKeys = {}
            this.keys = {}
            document.body.addEventListener('keydown', e => this._keydown(e))
            document.body.addEventListener('keyup', e => this._keyup(e))
            this.initialized = true
        }
    }

    /** clears all menu keys */
    clearMenuKeys()
    {
        this.menuKeys = {}
    }

    /** clear all user-registered keys */
    clearKeys()
    {
        this.keys = {}
    }

    /**
     * Register a shortcut key for use by an open menu
     * @param {Accelerator~KeyCodes} letter
     * @param {MenuItem} menuItem
     * @param {boolean} applicationMenu
     */
    registerMenuShortcut(letter, menuItem)
    {
        if (letter)
        {
            const keyCode = (menuItem.menu.applicationMenu ? 'alt+' : '') + letter
            this.menuKeys[this._prepareKey(keyCode)] = e =>
            {
                menuItem.handleClick(e)
                e.stopPropagation()
                e.preventDefault()
            }
        }
    }

    /**
     * Register special shortcut keys for menu
     * @param {MenuItem} menuItem
     */
    registerMenuSpecial(menu)
    {
        this.menuKeys['escape'] = () => menu.closeAll()
        this.menuKeys['enter'] = e => menu.enter(e)
        this.menuKeys['space'] = e => menu.enter(e)
        this.menuKeys['arrowright'] = e => menu.move(e, 'right')
        this.menuKeys['arrowleft'] = e => menu.move(e, 'left')
        this.menuKeys['arrowup'] = e => menu.move(e, 'up')
        this.menuKeys['arrowdown'] = e => menu.move(e, 'down')
    }

    /**
     * special key registration for alt
     * @param {function} pressed
     * @param {function} released
     */
    registerAlt(pressed, released)
    {
        this.alt = { pressed, released }
    }

    /**
     * Removes menu shortcuts
     */
    unregisterMenuShortcuts()
    {
        this.menuKeys = {}
    }

    /**
     * Keycodes definition. In the form of modifier[+modifier...]+key
     * <p>For example: ctrl+shift+e</p>
     * <p>KeyCodes are case insensitive (i.e., shift+a is the same as Shift+A). And spaces are removed</p>
     * <p>You can assign more than one key to the same shortcut by using a | between the keys (e.g., 'shift+a | ctrl+a')</p>
     * <pre>
     * Modifiers:
     *    ctrl, alt, shift, meta, (ctrl aliases: command, control, commandorcontrol)
     * </pre>
     * <pre>
     * Keys:
     *    escape, 0-9, minus, equal, backspace, tab, a-z, backetleft, bracketright, semicolon, quote,
     *    backquote, backslash, comma, period, slash, numpadmultiply, space, capslock, f1-f24, pause,
     *    scrolllock, printscreen, home, arrowup, arrowleft, arrowright, arrowdown, pageup, pagedown,
     *    end, insert, delete, enter, shiftleft, shiftright, ctrlleft, ctrlright, altleft, altright, shiftleft,
     *    shiftright, numlock, numpad...
     * </pre>
     * For OS-specific codes and a more detailed explanation see {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code}. Also note that 'Digit' and 'Key' are removed from the code to make it easier to type.
     *
     * @typedef {string} Accelerator~KeyCodes
     */

    /**
     * translate a user-provided keycode
     * @param {Accelerator~KeyCodes} keyCode
     * @return {Accelerator~KeyCodes} formatted and sorted keyCode
     * @private
     */
    _prepareKey(keyCode)
    {
        const keys = []
        let split
        keyCode += ''
        if (keyCode.length > 1 && keyCode.indexOf('|') !== -1)
        {
            split = keyCode.split('|')
        }
        else
        {
            split = [keyCode]
        }
        for (let code of split)
        {
            let key = ''
            let modifiers = []
            code = code.toLowerCase().replace(' ', '')
            if (code.indexOf('+') !== -1)
            {
                const split = code.split('+')
                for (let i = 0; i < split.length - 1; i++)
                {
                    let modifier = split[i]
                    modifier = modifier.replace('commandorcontrol', 'ctrl')
                    modifier = modifier.replace('command', 'ctrl')
                    modifier = modifier.replace('control', 'ctrl')
                    modifiers.push(modifier)
                }
                modifiers = modifiers.sort((a, b) => { return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0 })
                for (let part of modifiers)
                {
                    key += part + '+'
                }
                key += split[split.length - 1]
            }
            else
            {
                key = code
            }
            keys.push(key)
        }
        return keys
    }

    /**
     * Make the KeyCode pretty for printing on the menu
     * @param {KeyCode} keyCode
     * @return {string}
     */
    prettifyKey(keyCode)
    {
        let key = ''
        const codes = this._prepareKey(keyCode)
        for (let i = 0; i < codes.length; i++)
        {
            const keyCode = codes[i]
            if (keyCode.indexOf('+') !== -1)
            {
                const split = keyCode.toLowerCase().split('+')
                for (let i = 0; i < split.length - 1; i++)
                {
                    let modifier = split[i]
                    key += modifier[0].toUpperCase() + modifier.substr(1) + '+'
                }
                key += split[split.length - 1].toUpperCase()
            }
            else
            {
                key = keyCode.toUpperCase()
            }
            if (i !== codes.length - 1)
            {
                key += ' or '
            }
        }
        return key
    }

    /**
     * register a key as a global accelerator
     * @param {Accelerator~KeyCodes} keyCode (e.g., Ctrl+shift+E)
     * @param {function} callback
     */
    register(keyCode, callback)
    {
        const keys = this._prepareKey(keyCode)
        for (let key of keys)
        {
            this.keys[key] = e =>
            {
                callback(e)
                e.preventDefault()
                e.stopPropagation()
            }
        }
    }

    _keyup(e)
    {
        if (this.alt && (e.code === 'AltLeft' || e.code === 'AltRight'))
        {
            this.alt.released()
            this.alt.isPressed = false
        }
    }

    _keydown(e)
    {
        if (this.alt && !this.alt.isPressed && (e.code === 'AltLeft' || e.code === 'AltRight'))
        {
            this.alt.pressed()
            this.alt.isPressed = true
            e.preventDefault()
        }
        const modifiers = []
        if (e.altKey)
        {
            modifiers.push('alt')
        }
        if (e.ctrlKey)
        {
            modifiers.push('ctrl')
        }
        if (e.metaKey)
        {
            modifiers.push('meta')
        }
        if (e.shiftKey)
        {
            modifiers.push('shift')
        }
        let keyCode = ''
        for (let modifier of modifiers)
        {
            keyCode += modifier + '+'
        }
        let translate = e.code.toLowerCase()
        translate = translate.replace('digit', '')
        translate = translate.replace('key', '')
        keyCode += translate
        if (this.menuKeys[keyCode])
        {
            this.menuKeys[keyCode](e)
        }
        else if (this.keys[keyCode])
        {
            this.keys[keyCode](e)
        }
    }
}

export const accelerator = new Accelerator()