/**
 * shortcut to create an html element
 * @param {object} options
 * @param {type} [options.type=div]
 * @param {string} [options.className]
 * @param {object} [options.styles]
 * @param {HTMLElement} [options.parent]
 * @param {string} [options.html]
 * @returns {HTMLElement}
 * @ignore
 */
function html(options = {})
{
    const element = document.createElement(options.type || 'div');
    if (options.styles)
    {
        Object.assign(element.style, options.styles);
    }
    if (options.className)
    {
        element.className = options.className;
    }
    if (options.html)
    {
        element.innerHTML = options.html;
    }
    if (options.parent)
    {
        options.parent.appendChild(element);
    }
    return element
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var eventemitter3 = createCommonjsModule(function (module) {

var has = Object.prototype.hasOwnProperty
  , prefix = '~';

/**
 * Constructor to create a storage for our `EE` objects.
 * An `Events` instance is a plain object whose properties are event names.
 *
 * @constructor
 * @private
 */
function Events() {}

//
// We try to not inherit from `Object.prototype`. In some engines creating an
// instance in this way is faster than calling `Object.create(null)` directly.
// If `Object.create(null)` is not supported we prefix the event names with a
// character to make sure that the built-in object properties are not
// overridden or used as an attack vector.
//
if (Object.create) {
  Events.prototype = Object.create(null);

  //
  // This hack is needed because the `__proto__` property is still inherited in
  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
  //
  if (!new Events().__proto__) prefix = false;
}

/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */
function addListener(emitter, event, fn, context, once) {
  if (typeof fn !== 'function') {
    throw new TypeError('The listener must be a function');
  }

  var listener = new EE(fn, context || emitter, once)
    , evt = prefix ? prefix + event : event;

  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
  else emitter._events[evt] = [emitter._events[evt], listener];

  return emitter;
}

/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */
function clearEvent(emitter, evt) {
  if (--emitter._eventsCount === 0) emitter._events = new Events();
  else delete emitter._events[evt];
}

/**
 * Minimal `EventEmitter` interface that is molded against the Node.js
 * `EventEmitter` interface.
 *
 * @constructor
 * @public
 */
function EventEmitter() {
  this._events = new Events();
  this._eventsCount = 0;
}

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var names = []
    , events
    , name;

  if (this._eventsCount === 0) return names;

  for (name in (events = this._events)) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  var evt = prefix ? prefix + event : event
    , handlers = this._events[evt];

  if (!handlers) return [];
  if (handlers.fn) return [handlers.fn];

  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
    ee[i] = handlers[i].fn;
  }

  return ee;
};

/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */
EventEmitter.prototype.listenerCount = function listenerCount(event) {
  var evt = prefix ? prefix + event : event
    , listeners = this._events[evt];

  if (!listeners) return 0;
  if (listeners.fn) return 1;
  return listeners.length;
};

/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if (listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  return addListener(this, event, fn, context, false);
};

/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  return addListener(this, event, fn, context, true);
};

/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events[evt]) return this;
  if (!fn) {
    clearEvent(this, evt);
    return this;
  }

  var listeners = this._events[evt];

  if (listeners.fn) {
    if (
      listeners.fn === fn &&
      (!once || listeners.once) &&
      (!context || listeners.context === context)
    ) {
      clearEvent(this, evt);
    }
  } else {
    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
      if (
        listeners[i].fn !== fn ||
        (once && !listeners[i].once) ||
        (context && listeners[i].context !== context)
      ) {
        events.push(listeners[i]);
      }
    }

    //
    // Reset the array, or remove it completely if we have no more listeners.
    //
    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
    else clearEvent(this, evt);
  }

  return this;
};

/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  var evt;

  if (event) {
    evt = prefix ? prefix + event : event;
    if (this._events[evt]) clearEvent(this, evt);
  } else {
    this._events = new Events();
    this._eventsCount = 0;
  }

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Allow `EventEmitter` to be imported as module namespace.
//
EventEmitter.EventEmitter = EventEmitter;

//
// Expose the module.
//
{
  module.exports = EventEmitter;
}
});

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
};

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
function clicked(element, callback, options)
{
    return new Clicked(element, callback, options)
}

class Clicked
{
    constructor(element, callback, options)
    {
        if (typeof element === 'string')
        {
            element = document.querySelector(element);
            if (!element)
            {
                console.warn(`Unknown element: document.querySelector(${element}) in clicked()`);
                return
            }
        }
        this.options = Object.assign({}, defaultOptions, options);
        this.events = {
            mousedown: (e) => this.mousedown(e),
            mouseup: (e) => this.mouseup(e),
            mousemove: (e) => this.mousemove(e),
            touchstart: (e) => this.touchstart(e),
            touchmove: (e) => this.touchmove(e),
            touchcancel: (e) => this.cancel(e),
            touchend: (e) => this.touchend(e)
        };
        element.addEventListener('mousedown', this.events.mousedown, { capture: this.options.capture });
        element.addEventListener('mouseup', this.events.mouseup, { capture: this.options.capture });
        element.addEventListener('mousemove', this.events.mousemove, { capture: this.options.capture });
        element.addEventListener('touchstart', this.events.touchstart, { passive: true, capture: this.options.capture });
        element.addEventListener('touchmove', this.events.touchmove, { passive: true, capture: this.options.capture });
        element.addEventListener('touchcancel', this.events.touchcancel, { capture: this.options.capture});
        element.addEventListener('touchend', this.events.touchend, { capture: this.options.capture });
        this.element = element;
        this.callback = callback;
    }

    /**
     * removes event listeners added by Clicked
     */
    destroy()
    {
        this.element.removeEventListener('mousedown', this.events.mousedown);
        this.element.removeEventListener('mouseup', this.events.mouseup);
        this.element.removeEventListener('mousemove', this.events.mousemove);
        this.element.removeEventListener('touchstart', this.events.touchstart, { passive: true });
        this.element.removeEventListener('touchmove', this.events.touchmove, { passive: true });
        this.element.removeEventListener('touchcancel', this.events.touchcancel);
        this.element.removeEventListener('touchend', this.events.touchend);
    }

    touchstart(e)
    {
        if (this.down === true)
        {
            this.cancel();
        }
        else
        {
            if (e.touches.length === 1)
            {
                this.handleDown(e.changedTouches[0].screenX, e.changedTouches[0].screenY);
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
                this.cancel();
            }
            else
            {
                const x = e.changedTouches[0].screenX;
                const y = e.changedTouches[0].screenY;
                if (this.pastThreshold(x, y))
                {
                    this.cancel();
                }
            }
        }
    }

    /** cancel current event */
    cancel()
    {
        this.down = false;
        if (this.doubleClickedTimeout)
        {
            clearTimeout(this.doubleClickedTimeout);
            this.doubleClickedTimeout = null;
        }
        if (this.longClickedTimeout)
        {
            clearTimeout(this.longClickedTimeout);
            this.longClickedTimeout = null;
        }
    }

    touchend(e)
    {
        if (this.down)
        {
            e.preventDefault();
            this.handleClicks(e, e.pointerId);
        }
    }

    handleClicks(e)
    {
        if (this.options.doubleClicked)
        {
            this.doubleClickedTimeout = setTimeout(() => this.doubleClickedCancel(e), this.options.doubleClickedTime);
        }
        else if (this.options.clicked)
        {
            this.callback({ event: e, type: 'clicked' });
        }
        if (this.longClickedTimeout)
        {
            clearTimeout(this.longClickedTimeout);
            this.longClickedTimeout = null;
        }
        this.down = false;
    }

    handleDown(e, x, y)
    {
        if (this.doubleClickedTimeout)
        {
            if (this.pastThreshold(x, y))
            {
                if (this.options.clicked)
                {
                    this.callback({ event: e, type: 'clicked' });
                }
                this.cancel();
            }
            else
            {
                this.callback({ event: e, type: 'double-clicked' });
                this.cancel();
            }
        }
        else
        {
            this.lastX = x;
            this.lastY = y;
            this.down = true;
            if (this.options.longClicked)
            {
                this.longClickedTimeout = setTimeout(() => this.longClicked(e), this.options.longClickedTime);
            }
            if (this.options.clickDown) {
                this.callback({ event: e, type: 'click-down' });
            }
        }
    }

    longClicked(e)
    {
        this.longClikedTimeout = null;
        this.down = false;
        this.callback({ event: e, type: 'long-clicked' });
    }

    doubleClickedCancel(e)
    {
        this.doubleClickedTimeout = null;
        if (this.options.clicked)
        {
            this.callback({ event: e, type: 'double-clicked' });
        }
    }

    mousedown(e)
    {
        if (this.down === true)
        {
            this.down = false;
        }
        else
        {
            this.handleDown(e, e.screenX, e.screenY);
        }
    }

    mousemove(e)
    {
        if (this.down)
        {
            const x = e.screenX;
            const y = e.screenY;
            if (this.pastThreshold(x, y))
            {
                this.cancel();
            }
        }
    }

    mouseup(e)
    {
        if (this.down)
        {
            e.preventDefault();
            this.handleClicks(e);
        }
    }
}

/**
 * Callback for
 * @callback Clicked~ClickedCallback
 * @param {UIEvent} event
 * @param {('clicked'|'double-clicked'|'long-clicked'|'click-down')} type
 */

const config = {

    /**
     * application menu container styles
     * @type {object}
     */
    ApplicationContainerStyle: {
        'z-index': 999999,
        'position': 'absolute',
        'top': 0,
        'left': 0,
        'user-select': 'none',
        'font-size': '0.85em'
    },

    /**
     * application menu-bar styles
     * @type {object}
     */
    ApplicationMenuStyle: {
        'display': 'flex',
        'position': 'relative',
        'flex-direction': 'row',
        'color': 'black',
        'backgroundColor': 'rgb(230,230,230)',
        'width': '100vw',
        'border': 'none',
        'box-shadow': 'unset',
        'outline': 'none'
    },

    /**
     * application menu entry styles
     * @type {object}
     */
    ApplicationMenuRowStyle: {
        'padding': '0.25em 0.5em',
        'margin': 0,
        'line-height': '1em'
    },

    /**
     * lower-level menu window styles
     * @type {object}
     */
    MenuStyle: {
        'flex-direction': 'column',
        'position': 'absolute',
        'user-select': 'none',
        'color': 'black',
        'z-index': 999999,
        'backgroundColor': 'white',
        'border': '1px solid rgba(0,0,0,0.5)',
        'boxShadow': '1px 3px 3px rgba(0,0,0,0.25)'
    },

    /**
     * lower-level menu row styles
     * @type {object}
     */
    RowStyle: {
        'display': 'flex',
        'padding': '0.25em 1.5em 0.25em',
        'line-height': '1.5em'
    },

    /**
     * lower-level menu accelerator styles
     * @type {object}
     */
    AcceleratorStyle: {
        'opacity': 0.5
    },

    /**
     * lower-level menu separator styles
     * @type {object}
     */
    SeparatorStyle: {
        'border-bottom': '1px solid rgba(0,0,0,0.1)',
        'margin': '0.5em 0'
    },

    /**
     * accelerator key styles
     * NOTE: accelerator keys must use text-decoration as its used as a toggle in the code
     * @type {object}
     */
    AcceleratorKeyStyle: {
        'text-decoration': 'underline',
        'text-decoration-color': 'rgba(0,0,0,0.5)'
    },

    /**
     * minimum column width in pixels for checked and arrow in the lower-level menus
     * @type {number}
     */
    MinimumColumnWidth: 20,

    /**
     * CSS background style for selected MenuItems
     * NOTE: unselected have 'transparent' style
     * @type {string}
     */
    SelectedBackgroundStyle: 'rgba(0,0,0,0.1)',

    /**
     * number of pixels to overlap child menus
     * @type {number}
     */
    Overlap: 5,

    /**
     * time in milliseconds to wait for submenu to open when mouse hovers
     * @param {number}
     */
    SubmenuOpenDelay: 500
};

/**
 * Keyboard Accelerator support used by menu (if available) and user-registered keys. Also works for user-defined keys independent of the menu system. Automatically instantiated when used with WindowManager.
 */
class Accelerator {

    init()
    {
        // may be initialized by Menu or WindowManager in any order
        if (!this.initialized)
        {
            this.menuKeys = {};
            this.keys = {};
            document.body.addEventListener('keydown', e => this._keydown(e));
            document.body.addEventListener('keyup', e => this._keyup(e));
            this.initialized = true;
        }
    }

    /** clears all menu keys */
    clearMenuKeys()
    {
        this.menuKeys = {};
    }

    /** clear all user-registered keys */
    clearKeys()
    {
        this.keys = {};
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
            const keyCode = (menuItem.menu.applicationMenu ? 'alt+' : '') + letter;
            this.menuKeys[this._prepareKey(keyCode)] = e =>
            {
                menuItem.handleClick(e);
                e.stopPropagation();
                e.preventDefault();
            };
        }
    }

    /**
     * Register special shortcut keys for menu
     * @param {MenuItem} menuItem
     */
    registerMenuSpecial(menu)
    {
        this.menuKeys['escape'] = () => menu.closeAll();
        this.menuKeys['enter'] = e => menu.enter(e);
        this.menuKeys['space'] = e => menu.enter(e);
        this.menuKeys['arrowright'] = e => menu.move(e, 'right');
        this.menuKeys['arrowleft'] = e => menu.move(e, 'left');
        this.menuKeys['arrowup'] = e => menu.move(e, 'up');
        this.menuKeys['arrowdown'] = e => menu.move(e, 'down');
    }

    /**
     * special key registration for alt
     * @param {function} pressed
     * @param {function} released
     */
    registerAlt(pressed, released)
    {
        this.alt = { pressed, released };
    }

    /**
     * Removes menu shortcuts
     */
    unregisterMenuShortcuts()
    {
        this.menuKeys = {};
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
        const keys = [];
        let split;
        keyCode += '';
        if (keyCode.length > 1 && keyCode.indexOf('|') !== -1)
        {
            split = keyCode.split('|');
        }
        else
        {
            split = [keyCode];
        }
        for (let code of split)
        {
            let key = '';
            let modifiers = [];
            code = code.toLowerCase().replace(' ', '');
            if (code.indexOf('+') !== -1)
            {
                const split = code.split('+');
                for (let i = 0; i < split.length - 1; i++)
                {
                    let modifier = split[i];
                    modifier = modifier.replace('commandorcontrol', 'ctrl');
                    modifier = modifier.replace('command', 'ctrl');
                    modifier = modifier.replace('control', 'ctrl');
                    modifiers.push(modifier);
                }
                modifiers = modifiers.sort((a, b) => { return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0 });
                for (let part of modifiers)
                {
                    key += part + '+';
                }
                key += split[split.length - 1];
            }
            else
            {
                key = code;
            }
            keys.push(key);
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
        let key = '';
        const codes = this._prepareKey(keyCode);
        for (let i = 0; i < codes.length; i++)
        {
            const keyCode = codes[i];
            if (keyCode.indexOf('+') !== -1)
            {
                const split = keyCode.toLowerCase().split('+');
                for (let i = 0; i < split.length - 1; i++)
                {
                    let modifier = split[i];
                    key += modifier[0].toUpperCase() + modifier.substr(1) + '+';
                }
                key += split[split.length - 1].toUpperCase();
            }
            else
            {
                key = keyCode.toUpperCase();
            }
            if (i !== codes.length - 1)
            {
                key += ' or ';
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
        const keys = this._prepareKey(keyCode);
        for (let key of keys)
        {
            this.keys[key] = e =>
            {
                callback(e);
                e.preventDefault();
                e.stopPropagation();
            };
        }
    }

    _keyup(e)
    {
        if (this.alt && (e.code === 'AltLeft' || e.code === 'AltRight'))
        {
            this.alt.released();
            this.alt.isPressed = false;
        }
    }

    _keydown(e)
    {
        if (this.alt && !this.alt.isPressed && (e.code === 'AltLeft' || e.code === 'AltRight'))
        {
            this.alt.pressed();
            this.alt.isPressed = true;
            e.preventDefault();
        }
        const modifiers = [];
        if (e.altKey)
        {
            modifiers.push('alt');
        }
        if (e.ctrlKey)
        {
            modifiers.push('ctrl');
        }
        if (e.metaKey)
        {
            modifiers.push('meta');
        }
        if (e.shiftKey)
        {
            modifiers.push('shift');
        }
        let keyCode = '';
        for (let modifier of modifiers)
        {
            keyCode += modifier + '+';
        }
        let translate = e.code.toLowerCase();
        translate = translate.replace('digit', '');
        translate = translate.replace('key', '');
        keyCode += translate;
        if (this.menuKeys[keyCode])
        {
            this.menuKeys[keyCode](e);
        }
        else if (this.keys[keyCode])
        {
            this.keys[keyCode](e);
        }
    }
}

const accelerator = new Accelerator();

/**
 * creates a menu bar or a submenu within a menu
 * @param {object} [options]
 * @param {object} [options.styles] additional CSS styles for menu
 */
class Menu
{
    constructor(options)
    {
        accelerator.init();
        options = options || {};
        this.div = document.createElement('div');
        this.styles = options.styles;
        this.children = [];
        this.applyConfig(config.MenuStyle);
        this.div.tabIndex = -1;
    }

    /**
     * append a MenuItem to the Menu
     * @param {MenuItem} menuItem
     */
    append(menuItem)
    {
        if (menuItem.submenu)
        {
            menuItem.submenu.menu = this;
        }
        menuItem.menu = this;
        this.div.appendChild(menuItem.div);
        if (menuItem.type !== 'separator')
        {
            this.children.push(menuItem);
        }
    }

    /**
     * inserts a MenuItem into the Menu
     * @param {number} pos
     * @param {MenuItem} menuItem
     */
    insert(pos, menuItem)
    {
        if (pos >= this.div.childNodes.length)
        {
            this.append(menuItem);
        }
        else
        {
            if (menuItem.submenu)
            {
                menuItem.submenu.menu = this;
            }
            menuItem.menu = this;
            this.div.insertBefore(menuItem.div, this.div.childNodes[pos]);
            if (menuItem.type !== 'separator')
            {
                this.children.splice(pos, 0, menuItem);
            }
        }
    }

    hide()
    {
        let current = this.menu.showing;
        while (current && current.submenu)
        {
            current.div.style.backgroundColor = 'transparent';
            current.submenu.div.remove();
            let next = current.submenu.showing;
            if (next)
            {
                current.submenu.showing.div.style.backgroundColor = 'transparent';
                current.submenu.showing = null;
            }
            current = next;
        }
    }

    show(menuItem)
    {
        accelerator.unregisterMenuShortcuts();
        if (this.menu && this.menu.showing === menuItem)
        {
            this.hide();
            this.menu.showing = null;
            this.div.remove();
            this.menu.showAccelerators();
        }
        else
        {
            if (this.menu)
            {
                if (this.menu.showing && this.menu.children.indexOf(menuItem) !== -1)
                {
                    this.hide();
                }
                this.menu.showing = menuItem;
                this.menu.hideAccelerators();
            }
            const div = menuItem.div;
            const parent = this.menu.div;
            if (this.menu.applicationMenu)
            {
                this.div.style.left = div.offsetLeft + 'px';
                this.div.style.top = div.offsetTop + div.offsetHeight + 'px';
            }
            else
            {
                this.div.style.left = parent.offsetLeft + parent.offsetWidth - config.Overlap + 'px';
                this.div.style.top = parent.offsetTop + div.offsetTop - config.Overlap + 'px';
            }
            this.attached = menuItem;
            this.showAccelerators();
            Menu.application.appendChild(this.div);
            let label = 0, accelerator = 0, arrow = 0, checked = 0;
            for (let child of this.children)
            {
                child.check.style.width = 'auto';
                child.label.style.width = 'auto';
                child.accelerator.style.width = 'auto';
                child.arrow.style.width = 'auto';
                if (child.type === 'checkbox')
                {
                    checked = config.MinimumColumnWidth;
                }
                if (child.submenu)
                {
                    arrow = config.MinimumColumnWidth;
                }
            }
            for (let child of this.children)
            {
                const childLabel = child.label.offsetWidth * 2;
                label = childLabel > label ? childLabel : label;
                const childAccelerator = child.accelerator.offsetWidth;
                accelerator = childAccelerator > accelerator ? childAccelerator : accelerator;
                if (child.submenu)
                {
                    arrow = child.arrow.offsetWidth;
                }
            }
            for (let child of this.children)
            {
                child.check.style.width = checked + 'px';
                child.label.style.width = label + 'px';
                child.accelerator.style.width = accelerator + 'px';
                child.arrow.style.width = arrow + 'px';
            }
            if (this.div.offsetLeft + this.div.offsetWidth > window.innerWidth)
            {
                this.div.style.left = window.innerWidth - this.div.offsetWidth + 'px';
            }
            if (this.div.offsetTop + this.div.offsetHeight > window.innerHeight)
            {
                this.div.style.top = window.innerHeight - this.div.offsetHeight + 'px';
            }
            Menu.application.menu.div.focus();
        }
    }

    applyConfig(base)
    {
        const styles = {};
        for (let style in base)
        {
            styles[style] = base[style];
        }
        if (this.styles)
        {
            for (let style in this.styles)
            {
                styles[style] = this.styles[style];
            }
        }
        for (let style in styles)
        {
            this.div.style[style] = styles[style];
        }
    }

    showAccelerators()
    {
        for (let child of this.children)
        {
            child.showShortcut();
            if (child.type !== 'separator')
            {
                const index = child.text.indexOf('&');
                if (index !== -1)
                {
                    accelerator.registerMenuShortcut(child.text[index + 1], child);
                }
            }
        }
        if (!this.applicationMenu)
        {
            accelerator.registerMenuSpecial(this);
        }
    }

    hideAccelerators()
    {
        for (let child of this.children)
        {
            child.hideShortcut();
        }
    }

    closeAll()
    {
        accelerator.unregisterMenuShortcuts();
        let application = Menu.application.menu;
        if (application.showing)
        {
            let menu = application;
            while (menu.showing)
            {
                menu = menu.showing.submenu;
            }
            while (menu && !menu.applicationMenu)
            {
                if (menu.showing)
                {
                    menu.showing.div.style.backgroundColor = 'transparent';
                    menu.showing = null;
                }
                menu.div.remove();
                menu = menu.menu;
            }
            if (menu)
            {
                menu.showing.div.style.background = 'transparent';
                menu.showing = null;
                menu.hideAccelerators();
            }
        }
    }

    /**
     * move selector to the next child pane
     * @param {string} direction (left or right)
     * @private
     */
    moveChild(direction)
    {
        let index;
        if (direction === 'left')
        {
            const parent = this.selector.menu.menu;
            index = parent.children.indexOf(parent.showing);
            index--;
            index = (index < 0) ? parent.children.length - 1 : index;
            parent.children[index].handleClick();
        }
        else
        {
            let parent = this.selector.menu.menu;
            let selector = parent.showing;
            while (!parent.applicationMenu)
            {
                selector.handleClick();
                selector.div.style.backgroundColor = 'transparent';
                parent = parent.menu;
                selector = parent.showing;
            }
            index = parent.children.indexOf(selector);
            index++;
            index = (index === parent.children.length) ? 0 : index;
            parent.children[index].handleClick();
        }
        this.selector = null;
    }

    /**
     * move selector right and left
     * @param {MouseEvent} e
     * @param {string} direction
     * @private
     */
    horizontalSelector(e, direction)
    {
        if (direction === 'right')
        {
            if (this.selector.submenu)
            {
                this.selector.handleClick(e);
                this.selector.submenu.selector = this.selector.submenu.children[0];
                this.selector.submenu.selector.div.style.backgroundColor = config.SelectedBackgroundStyle;
                this.selector = null;
            }
            else
            {
                this.moveChild(direction);
            }
        }
        else if (direction === 'left')
        {
            if (!this.selector.menu.menu.applicationMenu)
            {
                this.selector.menu.attached.handleClick(e);
                this.selector.menu.menu.selector = this.selector.menu.attached;
                this.selector = null;
            }
            else
            {
                this.moveChild(direction);
            }
        }
        e.stopPropagation();
        e.preventDefault();
    }

    /**
     * move the selector in the menu
     * @param {KeyboardEvent} e
     * @param {string} direction (left, right, up, down)
     */
    move(e, direction)
    {
        if (this.selector)
        {
            this.selector.div.style.backgroundColor = 'transparent';
            let index = this.children.indexOf(this.selector);
            if (direction === 'down')
            {
                index++;
                index = (index === this.children.length) ? 0 : index;
            }
            else if (direction === 'up')
            {
                index--;
                index = (index < 0) ? this.children.length - 1 : index;
            }
            else
            {
                return this.horizontalSelector(e, direction)
            }
            this.selector = this.children[index];
        }
        else
        {
            if (direction === 'up')
            {
                this.selector = this.children[this.children.length - 1];
            }
            else
            {
                this.selector = this.children[0];
            }
        }
        if (this.selector)
        {
            this.selector.div.style.backgroundColor = config.SelectedBackgroundStyle;
        }
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * click the selector with keyboard
     * @private
     */
    enter(e)
    {
        if (this.selector)
        {
            this.selector.handleClick(e);
            e.preventDefault();
            e.stopPropagation();
        }
    }

    /**
     * array containing the menu's items
     * @property {MenuItems[]} items
     * @readonly
     */
    get items()
    {
        return this.children
    }

    /**
     * show application menu accelerators when alt is pressed
     * @private
     */
    showApplicationAccelerators()
    {
        this.hideAccelerators();
        accelerator.registerAlt(() =>
        {
            if (!this.showing)
            {
                this.showAccelerators();
            }
        }, () =>
        {
            this.hideAccelerators();
        });
    }

    /**
     * use this to change the default config settings across all menus
     * @type {config}
     */
    static get config()
    {
        return config
    }

    /**
     * gets application menu height
     * @returns {number}
     */
    static getApplicationHeight()
    {
        return Menu.application ? Menu.application.offsetHeight : 0
    }

    /**
     * sets active application Menu (and removes any existing application menus)
     * @param {Menu} menu
     * @param {HTMLElement} [parent=document.body]
     */
    static setApplicationMenu(menu, parent=document.body)
    {
        accelerator.clearMenuKeys();
        if (Menu.application)
        {
            Menu.application.remove();
        }
        Menu.application = html({ parent, styles: config.ApplicationContainerStyle });
        Menu.application.menu = menu;
        menu.applyConfig(config.ApplicationMenuStyle);
        for (let child of menu.children)
        {
            child.applyConfig(config.ApplicationMenuRowStyle);
            if (child.arrow)
            {
                child.arrow.style.display = 'none';
            }
            menu.div.appendChild(child.div);
        }

        Menu.application.appendChild(menu.div);
        menu.applicationMenu = true;
        menu.div.tabIndex = -1;

        // don't let menu bar focus unless windows are open (this fixes a focus bug)
        menu.div.addEventListener('focus', () =>
        {
            if (!menu.showing)
            {
                menu.div.blur();
            }
        });

        // close all windows if menu is no longer the focus
        menu.div.addEventListener('blur', () =>
        {
            if (menu.showing)
            {
                menu.closeAll();
            }
        });
        menu.showApplicationAccelerators();
    }
}

/**
 * Window class returned by WindowManager.createWindow()
 * @param {WindowManager} [wm]
 * @param {Window~WindowOptions} [options]
 * @fires open
 * @fires focus
 * @fires blur
 * @fires close
 * @fires maximize
 * @fires maximize-restore
 * @fires move
 * @fires move-start
 * @fires move-end
 * @fires resize
 * @fires resize-start
 * @fires resize-end
 * @fires move-x
 * @fires move-y
 * @fires resize-width
 * @fires resize-height
 */
class Window extends eventemitter3
{
    constructor(wm, options = {})
    {
        super();
        this.wm = wm;
        this.options = options;
        this.id = typeof this.options.id === 'undefined' ? Window.id++ : this.options.id;

        this._createWin();
        this._createWinBox();
        this._createTitlebar();
        this._createContent();
        if (this.options.resizable)
        {
            this._createResize();
        }
        this._createOverlay();
        this._buildTransform();
        this._listeners();

        this.active = false;
        this.maximized = false;

        this._closed = true;
        this._restore = null;
        this._moving = null;
        this._resizing = null;
        this._attachedToScreen = { vertical: '', horziontal: '' };
    }

    /**
     * open the window
     * @param {boolean} [noFocus] do not focus window when opened
     */
    open(noFocus)
    {
        if (this._closed)
        {
            this.win.style.display = 'block';
            this._closed = false;
            this.emit('open', this);
            if (!noFocus)
            {
                this.focus();
            }
        }
    }

    /**
     * focus the window
     */
    focus()
    {
        this.active = true;
        if (this.options.titlebar)
        {
            this.winTitlebar.style.backgroundColor = this.options.backgroundTitlebarActive;
        }
        this.emit('focus', this);
    }

    /**
     * blur the window
     */
    blur()
    {
        this.active = false;
        if (this.options.titlebar)
        {
            this.winTitlebar.style.backgroundColor = this.options.backgroundTitlebarInactive;
        }
        this.emit('blur', this);
    }

    /**
     * closes the window (can be reopened with open)
     */
    close()
    {
        if (!this._closed)
        {
            this._closed = true;
            this.win.style.display = 'none';
            this.emit('close', this);
        }
    }

    /**
     * is window closed?
     * @type {boolean}
     * @readonly
     */
    get closed()
    {
        return this._closed
    }

    /**
     * left coordinate
     * @type {number}
     */
    get x() { return this.options.x }
    set x(value)
    {
        if (value !== this.options.x)
        {
            this.options.x = value;
            this.emit('move-x', this);
            this._buildTransform();
        }
    }

    _buildTransform()
    {
        this.win.style.transform = `translate(${this.options.x}px,${this.options.y}px)`;
    }

    /**
     * top coordinate
     * @type {number}
     */
    get y() { return this.options.y }
    set y(value)
    {
        if (value !== this.options.y)
        {
            this.options.y = value;
            this._buildTransform();
            this.emit('move-y', this);
        }
    }

    /**
     * width of window
     * @type {number}
     */
    get width() { return this.options.width || this.win.offsetWidth }
    set width(value)
    {
        if (value !== this.options.width)
        {
            if (value)
            {
                this.win.style.width = `${value}px`;
                this.options.width = this.win.offsetWidth;
            }
            else
            {
                this.win.style.width = 'auto';
                this.options.width = '';
            }
            this.emit('resize-width', this);
        }
    }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this.options.height || this.win.offsetHeight }
    set height(value)
    {
        if (value !== this.options.height)
        {
            if (value)
            {
                this.win.style.height = `${value}px`;
                this.options.height = this.win.offsetHeight;
            }
            else
            {
                this.win.style.height = 'auto';
                this.options.height = '';
            }
            this.emit('resize-height', this);
        }
    }

    /**
     * resize the window
     * @param {number} width
     * @param {number} height
     */
    resize(width, height)
    {
        this.width = width;
        this.height = height;
    }

    /**
     * move window
     * @param {number} x
     * @param {number} y
     */
    move(x, y)
    {
        const keepInside = this.keepInside;
        if (keepInside)
        {
            if (keepInside === true || keepInside === 'horizontal')
            {
                const width = this.wm.win.offsetWidth;
                x = x + this.width > width ? width - this.width : x;
                x = x < 0 ? 0 : x;
            }
            if (keepInside === true || keepInside === 'vertical')
            {
                const height = this.wm.win.offsetHeight;
                y = y + this.height > height ? height - this.height : y;
                const top = Menu.getApplicationHeight();
                y = y < top ? top : y;
            }
        }
        if (x !== this.options.x)
        {
            this.options.x = x;
            this.emit('move-x', this);
        }
        if (y !== this.options.y)
        {
            this.options.y = y;
            this.emit('move-y', this);
        }
        this._buildTransform();
    }

    /**
     * maximize the window
     */
    maximize()
    {
        if (this.options.maximizable)
        {
            if (this.maximized)
            {
                this.x = this.maximized.x;
                this.y = this.maximized.y;
                this.width = this.maximized.width;
                this.height = this.maximized.height;
                this.maximized = null;
                this.emit('restore', this);
                this.buttons.maximize.innerHTML = this.options.maximizeButton;
            }
            else
            {
                const x = this.x, y = this.y, width = this.win.offsetWidth, height = this.win.offsetHeight;
                this.maximized = { x, y, width, height };
                this.x = 0;
                this.y = 0;
                this.width = this.wm.wallpaper.offsetWidth;
                this.height = this.wm.wallpaper.offsetHeight;
                this.emit('maximize', this);
                this.buttons.maximize.innerHTML = this.options.restoreButton;
            }
        }
    }

    /**
     * sends window to back of window-manager
     */
    sendToBack()
    {
        this.wm.sendToBack(this);
    }

    /**
     * send window to front of window-manager
     */
    sendToFront()
    {
        this.wm.sendToFront(this);
    }

    /**
     * save the state of the window
     * @return {Object} data
     */
    save()
    {
        const data = {};
        const maximized = this.maximized;
        if (maximized)
        {
            data.maximized = { left: maximized.left, top: maximized.top, width: maximized.width, height: maximized.height };
        }
        data.x = this.x;
        data.y = this.y;
        if (typeof this.options.width !== 'undefined')
        {
            data.width = this.options.width;
        }
        if (typeof this.options.height !== 'undefined')
        {
            data.height = this.options.height;
        }
        data.closed = this._closed;
        return data
    }

    /**
     * return the state of the window
     * @param {Object} data from save()
     */
    load(data)
    {
        if (data.maximized)
        {
            if (!this.maximized)
            {
                this.maximize(true);
            }
        }
        else if (this.maximized)
        {
            this.maximize(true);
        }
        this.move(data.x, data.y);
        if (typeof data.width !== 'undefined')
        {
            this.width = data.width;
        }
        else
        {
            this.win.style.width = 'auto';
        }
        if (typeof data.height !== 'undefined')
        {
            this.height = data.height;
        }
        else
        {
            this.win.style.height = 'auto';
        }
        if (data.closed)
        {
            this.close(true);
        }
        else if (this.closed)
        {
            this.open(true, true);
        }
    }

    /**
     * change title
     * @type {string}
     */
    get title() { return this._title }
    set title(value)
    {
        this.winTitle.innerText = value;
        this.emit('title-change', this);
    }


    /**
     * right coordinate of window
     * @type {number}
     */
    get right() { return this.x + this.width }
    set right(value)
    {
        this.x = value - this.width;
    }

    /**
     * bottom coordinate of window
     * @type {number}
     */
    get bottom() { return this.y + this.height }
    set bottom(value)
    {
        this.y = value - this.height;
    }

    /**
     * centers window in middle of other window or document.body
     * @param {Window} [win]
     */
    center(win)
    {
        if (win)
        {
            this.move(
                win.x + win.width / 2 - this.width / 2,
                win.y + win.height / 2 - this.height / 2
            );
        }
        else
        {
            this.move(
                window.innerWidth / 2 - this.width / 2,
                window.innerHeight / 2 - this.height / 2
            );
        }
    }

    _createWin()
    {
        /**
         * This is the top-level DOM element
         * @type {HTMLElement}
         * @readonly
         */
        this.win = html({
            parent: this.wm.win,
            styles: {
                'display': 'none',
                'border-radius': this.options.borderRadius,
                'user-select': 'none',
                'overflow': 'hidden',
                'position': 'absolute',
                'min-width': this.options.minWidth,
                'min-height': this.options.minHeight,
                'background-color': this.options.backgroundWindow,
                'width': isNaN(this.options.width) ? this.options.width : this.options.width + 'px',
                'height': isNaN(this.options.height) ? this.options.height : this.options.height + 'px',
                ...this.options.styles
            }
        });
    }

    _createWinBox()
    {
        /**
         * This is the container for the titlebar+content
         * @type {HTMLElement}
         * @readonly
         */
        this.winBox = html({
            parent: this.win,
            styles: {
                'display': 'flex',
                'flex-direction': 'column',
                'width': '100%',
                'height': '100%',
                'min-height': this.options.minHeight
            }
        });
    }

    _createContent()
    {
        /**
         * This is the content DOM element. Use this to add content to the Window.
         * @type {HTMLElement}
         * @readonly
         */
        this.content = html({
            parent: this.winBox,
            type: 'section',
            styles: {
                'display': 'block',
                'flex': 1,
                'min-height': this.options.minHeight,
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            }
        });
    }

    _createOverlay()
    {
        this.overlay = html({
            parent: this.win,
            styles: {
                'display': 'none',
                'position': 'absolute',
                'left': 0,
                'top': 0,
                'width': '100%',
                'height': '100%'
            }
        });
        this.overlay.addEventListener('mousedown', (e) => { this._downTitlebar(e); e.stopPropagation(); });
        this.overlay.addEventListener('touchstart', (e) => { this._downTitlebar(e); e.stopPropagation(); });
    }

    _downTitlebar(e)
    {        const event = this._convertMoveEvent(e);
        this._moving = {
            x: event.pageX - this.x,
            y: event.pageY - this.y
        };
        this.emit('move-start', this);
        this._moved = false;
    }

    _createTitlebar()
    {
        if (this.options.titlebar)
        {
            this.winTitlebar = html({
                parent: this.winBox, type: 'header', styles: {
                    'user-select': 'none',
                    'display': 'flex',
                    'flex-direction': 'row',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'height': this.options.titlebarHeight,
                    'min-height': this.options.titlebarHeight,
                    'border': 0,
                    'padding': '0 8px',
                    'overflow': 'hidden',
                }
            });
            const winTitleStyles = {
                'user-select': 'none',
                'flex': 1,
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'user-select': 'none',
                'cursor': 'default',
                'padding': 0,
                'margin': 0,
                'font-size': '16px',
                'font-weight': 400,
                'color': this.options.foregroundTitle
            };
            if (this.options.titleCenter)
            {
                winTitleStyles['justify-content'] = 'center';
            }
            else
            {
                winTitleStyles['padding-left'] = '8px';

            }
            this.winTitle = html({ parent: this.winTitlebar, type: 'span', html: this.options.title, styles: winTitleStyles });
            this._createButtons();

            if (this.options.movable)
            {
                this.winTitlebar.addEventListener('mousedown', (e) => this._downTitlebar(e));
                this.winTitlebar.addEventListener('touchstart', (e) => this._downTitlebar(e));
            }
            if (this.options.maximizable)
            {
                clicked(this.winTitlebar, () => this.maximize(), { doubleClicked: true, clicked: false});
            }
        }
    }

    _createButtons()
    {
        this.winButtonGroup = html({
            parent: this.winTitlebar, styles: {
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'padding-left': '10px'
            }
        });
        const button = {
            'display': 'inline-block',
            'border': 0,
            'margin': 0,
            'margin-left': '15px',
            'padding': 0,
            'width': '12px',
            'height': '12px',
            'background-color': 'transparent',
            'background-size': 'cover',
            'background-repeat': 'no-repeat',
            'opacity': .7,
            'color': this.options.foregroundButton,
            'outline': 0
        };
        this.buttons = {};
        if (this.options.maximizable)
        {
            this.buttons.maximize = html({ parent: this.winButtonGroup, html: this.options.maximizeButton, type: 'button', styles: button });
            clicked(this.buttons.maximize, () => this.maximize());
        }
        if (this.options.closable)
        {
            this.buttons.close = html({ parent: this.winButtonGroup, html: this.options.closeButton, type: 'button', styles: button });
            clicked(this.buttons.close, () => this.close());
        }
        for (let key in this.buttons)
        {
            const button = this.buttons[key];
            button.addEventListener('mousemove', () =>
            {
                button.style.opacity = 1;
            });
            button.addEventListener('mouseout', () =>
            {
                button.style.opacity = 0.7;
            });
        }
    }

    _createResize()
    {
        this.resizeEdge = html({
            parent: this.winBox, type: 'button', html: this.options.backgroundResize, styles: {
                'position': 'absolute',
                'bottom': 0,
                'right': '4px',
                'border': 0,
                'margin': 0,
                'padding': 0,
                'cursor': 'se-resize',
                'user-select': 'none',
                'height': '15px',
                'width': '10px',
                'background': 'none'
            }
        });
        const down = (e) =>
        {
            const event = this._convertMoveEvent(e);
            const width = this.width || this.win.offsetWidth;
            const height = this.height || this.win.offsetHeight;
            this._resizing = {
                width: width - event.pageX,
                height: height - event.pageY
            };
            this.emit('resize-start');
            e.preventDefault();
        };
        this.resizeEdge.addEventListener('mousedown', down);
        this.resizeEdge.addEventListener('touchstart', down);
    }

    _move(e)
    {
        const event = this._convertMoveEvent(e);

        if (!this._isTouchEvent(e) && e.which !== 1)
        {
            this._moving && this._stopMove();
            this._resizing && this._stopResize();
        }
        if (this._moving)
        {
            this.move(event.pageX - this._moving.x, event.pageY - this._moving.y);
            this.emit('move', this);
            e.preventDefault();
        }
        if (this._resizing)
        {
            this.resize(
                event.pageX + this._resizing.width,
                event.pageY + this._resizing.height
            );
            this.maximized = null;
            this.emit('resize', this);
            e.preventDefault();
        }
    }

    _up()
    {
        if (this._moving)
        {
            this._stopMove();
        }
        this._resizing && this._stopResize();
    }

    _listeners()
    {
        this.win.addEventListener('mousedown', () => this.focus());
        this.win.addEventListener('touchstart', () => this.focus());
    }

    _stopMove()
    {
        this._moving = null;
        this.emit('move-end', this);
    }

    _stopResize()
    {
        this._restore = this._resizing = null;
        this.emit('resize-end', this);
    }

    _isTouchEvent(e)
    {
        return !!window.TouchEvent && (e instanceof window.TouchEvent)
    }

    _convertMoveEvent(e)
    {
        return this._isTouchEvent(e) ? e.changedTouches[0] : e
    }

    /**
     * attaches window to a side of the screen
     * @param {('horizontal'|'vertical')} direction
     * @param {('left'|'right'|'top'|'bottom')} location
     */
    attachToScreen(direction, location)
    {
        this._attachedToScreen[direction] = location;
    }

    /**
     * @param {WindowManager~Bounds} bounds
     * @param {(boolean|'horizontal'|'vertical')} keepInside
     */
    reposition(bounds, keepInside)
    {
        this.bounds = bounds;
        this.keepInside = keepInside;
        let x = this.x;
        let y = this.y;
        x = this._attachedToScreen.horziontal === 'right' ? bounds.right - this.width : x;
        x = this._attachedToScreen.horizontal === 'left' ? bounds.left : x;
        y = this._attachedToScreen.vertical === 'bottom' ? bounds.bottom - this.height : y;
        y = this._attachedToScreen.vertical === 'top' ? bounds.top : y;
        this.move(x, y);
    }

    /**
     * @param {boolean} [ignoreClosed]
     * @returns {boolean}
     */
    isModal(ignoreClosed)
    {
        return (ignoreClosed || !this._closed) && this.options.modal
    }

    /** @returns {boolean} */
    isClosed()
    {
        return this._closed
    }

    get z()
    {
        return parseInt(this.win.style.zIndex)
    }
    set z(value)
    {
        this.win.style.zIndex = value;
    }
}

Window.id = 0;

/**
 * @typedef {Object} Window~WindowOptions
 * @property {number} [x=0]
 * @property {number} [y=0]
 * @property {number} [width]
 * @property {number} [height]
 * @property {boolean} [modal]
 * @property {boolean} [openOnCreate=true]
 * @property {*} [id]
 * @property {boolean} [movable=true]
 * @property {boolean} [resizable=true]
 * @property {boolean} [maximizable=true]
 * @property {boolean} [closable=true]
 * @property {boolean} [noSnap] don't snap this window or use this window as a snap target
 * @property {boolean} [titlebar=true]
 * @property {string} [titlebarHeight=36px]
 * @property {boolean} [titleCenter]
 * @property {string} [minWidth=200px]
 * @property {string} [minHeight=60px]
 * @property {string} [borderRadius=4px]
 * @property {string} [backgroundModal=rgba(0,0,0,0.6)]
 * @property {string} [backgroundWindow=#fefefe]
 * @property {string} [backgroundTitlebarActive=#365d98]
 * @property {string} [backgroundTitlebarInactive=#888888]
 * @property {string} [foregroundButton=#ffffff]
 * @property {string} [foregroundTitle=#ffffff]
 * @property {Object} [styles]
 * @property {string} [maximizeButton=...] used to replace the graphics for the button
 * @property {string} [closeButton=...] used to replace the graphics for the button
 * @property {string} [resize=...] used to replace the graphics for the button
 */

const close='<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><rect id="close" x="0" y="0" width="20" height="20" style="fill:none;"/><g><path d="M3.5,3.5l13,13" style="fill:none;stroke:#fff;stroke-width:3px;"/><path d="M16.5,3.5l-13,13" style="fill:none;stroke:#fff;stroke-width:3px;"/></g></svg>';const maximize='<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><rect id="maximize" x="0" y="0" width="20" height="20" style="fill:none;"/><rect x="2" y="2" width="16" height="16" style="fill:none;stroke:#fff;stroke-width:2px;"/><rect x="2" y="2" width="16" height="3.2" style="fill:#fff;"/></svg>';const resize='<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><rect id="resize" x="0" y="0" width="20" height="20" style="fill:none;"/><clipPath id="_clip1"><rect x="0" y="0" width="20" height="20"/></clipPath><g clip-path="url(#_clip1)"><rect x="0" y="16.8" width="20" height="3.2" style="fill:#fff;"/><path d="M17.737,3.595l-14.142,14.142l2.263,2.263l14.142,-14.142l-2.263,-2.263Z" style="fill:#fff;"/><path d="M16.8,0l0,20l3.2,0l0,-20l-3.2,0Z" style="fill:#fff;"/><path d="M7.099,18.4l11.301,-11.123l0,11.123l-11.301,0Z" style="fill:#fff;"/></g></svg>';const restore='<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><rect id="restore" x="0" y="0" width="20" height="20" style="fill:none;"/><g><rect x="7" y="2.5" width="10" height="10" style="fill:none;stroke:#fff;stroke-width:1.5px;"/><rect x="7" y="2.5" width="10" height="2" style="fill:#fff;"/></g><g><rect x="3" y="7.5" width="10" height="10" style="fill:none;stroke:#fff;stroke-width:1.5px;"/><g><rect x="3" y="7.5" width="10" height="2" style="fill:#fff;"/></g></g></svg>';

const defaultWindowOptions = {
    x: 0,
    y: 0,
    width: undefined,
    height: undefined,
    modal: false,
    openOnCreate: true,
    id: null,

    minWidth: '200px',
    minHeight: '60px',
    borderRadius: 0,
    styles: {},

    movable: true,
    resizable: true,
    maximizable: true,
    closable: true,

    noSnap: false,
    noMenu: false,

    titlebar: true,
    titlebarHeight: '2rem',

    backgroundWindow: '#fefefe',
    backgroundTitlebarActive: '#365d98',
    backgroundTitlebarInactive: '#888888',
    foregroundButton: '#ffffff',
    foregroundTitle: '#ffffff',

    closeButton: close,
    maximizeButton: maximize,
    restoreButton: restore,

    backgroundResize: resize
};

const defaultWindowManagerOptions = {
    quiet: false,
    keepInside: true,
    snap: true,
    noAccelerator: false,
    menu: false,
    styles: {},
    backgroundModal: 'rgba(0, 0, 0, 0.6)',
};

const DEFAULT_COLOR = '#a8f0f4';
const DEFAULT_SIZE = 10;

const SnapOptionsDefault = {
    screen: true,
    windows: true,
    snap: 20,
    color: DEFAULT_COLOR,
    spacing: 0,
    indicator: DEFAULT_SIZE
};

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
class Snap
{
    constructor(wm, options={})
    {
        this.wm = wm;
        this.options = { ...SnapOptionsDefault, ...options };
        this.highlights = html({ parent: this.wm.wallpaper, styles: { position: 'absolute' } });
        this.horizontal = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                height: `${this.options.indicator}px`,
                borderRadius: `${this.options.indicator}px`,
                backgroundColor: this.options.color
            }
        });
        this.vertical = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                width: `${this.options.indicator}px`,
                borderRadius: `${this.options.indicator}px`,
                backgroundColor: this.options.color
            }
        });
        this.horizontal;
        this.showing = [];
    }

    stop()
    {
        this.highlights.remove();
        this.stopped = true;
    }

    addWindow(win)
    {
        win.on('move', () => this.move(win));
        win.on('move-end', () => this.moveEnd(win));
    }

    screenMove(rect, horizontal, vertical)
    {
        const top = Menu.getApplicationHeight();
        const width = this.wm.win.clientWidth;
        const height = this.wm.win.clientHeight;
        if (rect.left - this.options.snap <= width && rect.right + this.options.snap >= 0)
        {
            if (Math.abs(rect.top - top) <= this.options.snap)
            {
                horizontal.push({ distance: Math.abs(rect.top - top), left: 0, width, top: top, side: 'top', screen: true });
            }
            else if (Math.abs(rect.bottom - height) <= this.options.snap)
            {
                horizontal.push({ distance: Math.abs(rect.bottom - height), left: 0, width, top: height, side: 'bottom', screen: true });
            }
        }
        if (rect.top - this.options.snap <= height && rect.bottom + this.options.snap >= 0)
        {
            if (Math.abs(rect.left - 0) <= this.options.snap)
            {
                vertical.push({ distance: Math.abs(rect.left - 0), top: 0, height, left: 0, side: 'left', screen: true });
            }
            else if (Math.abs(rect.right - width) <= this.options.snap)
            {
                vertical.push({ distance: Math.abs(rect.right - width), top: 0, height, left: width, side: 'right', screen: true });
            }
        }
    }

    windowsMove(original, rect, horizontal, vertical)
    {
        for (let win of this.wm.windows)
        {
            if (!win.options.noSnap && win !== original)
            {
                const rect2 = win.win.getBoundingClientRect();
                if (rect.left - this.options.snap <= rect2.right && rect.right + this.options.snap >= rect2.left)
                {
                    if (Math.abs(rect.top - rect2.bottom) <= this.options.snap)
                    {
                        horizontal.push({ distance: Math.abs(rect.top - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'top' });
                        if (Math.abs(rect.left - rect2.left) <= this.options.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true });
                        }
                        else if (Math.abs(rect.right - rect2.right) <= this.options.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true });
                        }
                    }
                    else if (Math.abs(rect.bottom - rect2.top) <= this.options.snap)
                    {
                        horizontal.push({ distance: Math.abs(rect.bottom - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'bottom' });
                        if (Math.abs(rect.left - rect2.left) <= this.options.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true });
                        }
                        else if (Math.abs(rect.right - rect2.right) <= this.options.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true });
                        }
                    }
                }
                if (rect.top - this.options.snap <= rect2.bottom && rect.bottom + this.options.snap >= rect2.top)
                {
                    if (Math.abs(rect.left - rect2.right) <= this.options.snap)
                    {
                        vertical.push({ distance: Math.abs(rect.left - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'left' });
                        if (Math.abs(rect.top - rect2.top) <= this.options.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true });
                        }
                        else if (Math.abs(rect.bottom - rect2.bottom) <= this.options.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true });
                        }
                    }
                    else if (Math.abs(rect.right - rect2.left) <= this.options.snap)
                    {
                        vertical.push({ distance: Math.abs(rect.right - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'right' });
                        if (Math.abs(rect.top - rect2.top) <= this.options.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true });
                        }
                        else if (Math.abs(rect.bottom - rect2.bottom) <= this.options.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true });
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
        this.horizontal.style.display = 'none';
        this.vertical.style.display = 'none';
        const horizontal = [];
        const vertical = [];
        const rect = win.win.getBoundingClientRect();
        if (this.options.screen)
        {
            this.screenMove(rect, horizontal, vertical);
        }
        if (this.options.windows)
        {
            this.windowsMove(win, rect, horizontal, vertical);
        }
        if (horizontal.length)
        {
            horizontal.sort((a, b) => { return a.distance - b.distance });
            const find = horizontal[0];
            this.horizontal.style.display = 'block';
            this.horizontal.style.width = find.width + 'px';
            this.horizontal.y = find.top - this.options.indicator / 2;
            this.horizontal.yPosition = find.top;
            this.horizontal.style.transform = `translate(${find.left}px,${this.horizontal.y}px)`;
            this.horizontal.side = find.side;
            this.horizontal.noSpacing = find.noSpacing;
            this.horizontal.screen = find.screen;
        }
        if (vertical.length)
        {
            vertical.sort((a, b) => { return a.distance - b.distance });
            const find = vertical[0];
            this.vertical.style.display  = 'block';
            this.vertical.style.height = find.height + 'px';
            this.vertical.x = find.left - this.options.indicator / 2;
            this.vertical.xPosition = find.left;
            this.vertical.style.transform = `translate(${this.vertical.x}px,${find.top}px)`;
            this.vertical.side = find.side;
            this.vertical.noSpacing = find.noSpacing;
            this.vertical.screen = find.screen;
        }
    }

    moveEnd(win)
    {
        if (this.stopped)
        {
            return
        }
        const bounds = this.wm.bounds;
        const top = Menu.getApplicationHeight();
        if (this.horizontal.style.display === 'block')
        {
            const spacing = this.horizontal.noSpacing ? 0 : this.options.spacing;
            switch (this.horizontal.side)
            {
                case 'top':
                    win.y = this.horizontal.yPosition + spacing - bounds.top + top;
                    break

                case 'bottom':
                    win.bottom = Math.floor(this.horizontal.yPosition - spacing - bounds.top + top);
                    break
            }
            win.attachToScreen('vertical', this.horizontal.screen ? this.horizontal.side : '');
        }
        if (this.vertical.style.display === 'block')
        {
            const spacing = this.vertical.noSpacing ? 0 : this.options.spacing;
            switch (this.vertical.side)
            {
                case 'left':
                    win.x = this.vertical.xPosition + spacing - bounds.left;
                    break

                case 'right':
                    win.right = Math.floor(this.vertical.xPosition - spacing - bounds.left);
                    break
            }
            win.attachToScreen('horziontal', this.vertical.screen ? this.vertical.side : '');
        }
        this.horizontal.style.display = this.vertical.style.display = 'none';
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
class WindowManager
{
    constructor(options = {}, windowOptions = {})
    {
        this.options = { ...defaultWindowManagerOptions, ...options };
        this.options.parent = this.options.parent || document.body;
        if (!this.options.quiet)
        {
            console.log('%c ☕ simple-window-manager initialized ☕', 'color: #ff00ff');
        }
        this.windows = [];
        this.active = null;
        this._setupWin();
        this._setupWallpaper();
        this._setupModal();
        if (this.options.snap)
        {
            this.snap(this.options.snap === true ? {} : this.options.snap);
        }
        this.windowOptions = { ...defaultWindowOptions, ...windowOptions };
        window.addEventListener('resize', () => this.resize());
        if (!this.options.noAccelerator)
        {
            accelerator.init();
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
        const win = new Window(this, { ...this.windowOptions, ...options });
        win.on('open', () => this._open(win));
        win.on('focus', () => this._focus(win));
        win.on('blur', () => this._blur(win));
        win.on('close', () => this._close(win));
        win.win.addEventListener('mousemove', (e) => this._move(e));
        win.win.addEventListener('touchmove', (e) => this._move(e));
        win.win.addEventListener('mouseup', (e) => this._up(e));
        win.win.addEventListener('touchend', (e) => this._up(e));
        if (this._snap && !options.noSnap)
        {
            this._snap.addWindow(win);
        }
        win.reposition(this.bounds, this.options.keepInside);
        if (win.options.openOnCreate)
        {
            win.open();
        }
        return win
    }

    /**
     * enable edge and/or screen snapping
     * @param {WindowManager~SnapOptions} [options]
     */
    snap(options)
    {
        this._snap = new Snap(this, options);
        for (const win of this.windows)
        {
            if (!win.options.noSnap)
            {
                this._snap.addWindow(win);
            }
        }
    }

    /**
     * send window to front
     * @param {Window} win
     */
    sendToFront(win)
    {
        const index = this.windows.indexOf(win);
        console.assert(index !== -1, 'sendToFront should find window in this.windows');
        if (index !== this.windows.length - 1)
        {
            this.windows.splice(index, 1);
            this.windows.push(win);
            this._reorder();
        }
    }

    /**
     * send window to back
     * @param {Window} win
     */
    sendToBack(win)
    {
        const index = this.windows.indexOf(win);
        console.assert(index !== -1, 'sendToFront should find window in this.windows');
        if (index !== 0)
        {
            this.windows.splice(index, 1);
            this.windows.unshift(win);
            this._reorder();
        }
    }

    /**
     * save the state of all the windows
     * @returns {Object} use this object in load() to restore the state of all windows
     */
    save()
    {
        const data = {};
        for (let i = 0; i < this.windows.length; i++)
        {
            const win = this.windows[i];
            data[win.id] = win.save();
            data[win.id].order = i;
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
            const win = this.getWindowById(id);
            if (win)
            {
                win.load(data[id]);
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
            win.close();
        }
        this.windows = [];
        this.active = null;
    }

    /**
     * reorder windows
     * @private
     * @returns {number} available z-index for top window
     */
    _reorder()
    {
        let i = 0;
        for (const win of this.windows)
        {
            if (!win.isClosed())
            {
                win.z = i++;
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
        });
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
        });
        this.wallpaper.addEventListener('mousemove', (e) => this._move(e));
        this.wallpaper.addEventListener('touchmove', (e) => this._move(e));
        this.wallpaper.addEventListener('mouseup', (e) => this._up(e));
        this.wallpaper.addEventListener('touchend', (e) => this._up(e));
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
        });
        this.modalOverlay.addEventListener('mousemove', (e) => { this._move(e); e.preventDefault(); e.stopPropagation(); });
        this.modalOverlay.addEventListener('touchmove', (e) => { this._move(e); e.preventDefault(); e.stopPropagation(); });
        this.modalOverlay.addEventListener('mouseup', (e) => { this._up(e); e.preventDefault(); e.stopPropagation(); });
        this.modalOverlay.addEventListener('touchend', (e) => { this._up(e); e.preventDefault(); e.stopPropagation(); });
        this.modalOverlay.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
        this.modalOverlay.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); });
    }

    _open(win)
    {
        this.windows.push(win);
        this._reorder();
        if (win.options.modal)
        {
            this.modalOverlay.style.display = 'block';
            this.modalOverlay.style.zIndex = win.z;
        }
        else
        {
            this.modalOverlay.style.display = 'none';
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
            this.active.blur();
        }
        const index = this.windows.indexOf(win);
        console.assert(index !== -1, 'WindowManager._focus should find window in this.windows');
        if (index !== this.windows.length - 1)
        {
            this.windows.splice(index, 1);
            this.windows.push(win);
        }
        this._reorder();
        this.active = this.windows[this.windows.length - 1];
    }

    _blur(win)
    {
        if (this.active === win)
        {
            this.active = null;
        }
    }

    _close(win)
    {
        if (win.isModal(true))
        {
            if (next && next.isModal())
            {
                this.modalOverlay.style.zIndex = next.z;
            }
            else
            {
                this.modalOverlay.style.display = 'none';
            }
        }
    }

    _move(e)
    {
        for (const key in this.windows)
        {
            this.windows[key]._move(e);
        }
    }

    _up(e)
    {
        for (const key in this.windows)
        {
            this.windows[key]._up(e);
        }
    }

    checkModal(win)
    {
        return !this.modal || this.modal === win
    }

    /** @type {WindowManager~Bounds} */
    get bounds()
    {
        const top = Menu.getApplicationHeight();
        return {
            top: this.win.offsetTop + top,
            bottom: this.win.offsetTop + this.win.offsetHeight,
            left: this.win.offsetLeft,
            right: this.win.offsetLeft + this.win.offsetWidth
        }
    }

    resize()
    {
        const bounds = this.bounds;
        for (const key in this.windows)
        {
            this.windows[key].reposition(bounds, this.options.keepInside);
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

export { WindowManager };
//# sourceMappingURL=simple-window-manager.es.js.map
