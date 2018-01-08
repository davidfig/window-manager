(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const Events = require('eventemitter3')
const Penner = require('penner')
const exists = require('exists')

const Animate = require('./src/animate')

module.exports = class DomEase extends Events
{
    /**
     * @param {object} [options]
     * @param {number} [options.duration=1000] default duration
     * @param {(string|function)} [options.ease=penner.linear] default ease
     * @param {(string|function)} [options.autostart=true]
     * @fires complete
     * @fires each
     */
    constructor(options)
    {
        super()
        this.options = options || {}
        this.options.duration = this.options.duration || 1000
        this.options.ease = this.options.ease || Penner.linear
        this.list = []
        this.empty = true
        if (!options.autostart)
        {
            this.start()
        }
    }

    /**
     * start animation loop
     * alternatively, you can manually call update() on each loop
     */
    start()
    {
        if (!this._requested)
        {
            this._requested = true
            this.loop()
        }
    }

    loop(time)
    {
        if (time)
        {
            const elapsed = this._last ? time - this._last : 0
            this.update(elapsed)
        }
        this._last = time
        this._requestId = window.requestAnimationFrame((time) => this.loop(time))
    }

    /**
     * stop animation loop
     */
    stop()
    {
        if (this._requested)
        {
            window.cancelAnimationFrame(this._requestId)
            this._requested = false
        }
    }

    /**
     * this is the object return by calling add()
     * @typedef Animation
     * @type {object}
     * @property {number} time - current time
     * @property {object} options - options passed (be careful changing these)
     * @fires each
     * @fires complete
     * @fires loop - called when animation repeats or reverses
     */

    /**
     * start an animation
     * @param {(HTMLElement|HTMLElement[])} element
     * @param {object} animate (currently supports x, y, flash)
     * @param {object} [options]
     * @param {number} [options.duration]
     * @param {(string|function)} [options.ease]
     * @param {(boolean|number)} [options.repeat]
     * @param {boolean} [options.reverse]
     * @returns {Animation}
     */
    add(element, animate, options)
    {
        // call add on all elements if array
        if (Array.isArray(element))
        {
            for (let i = 0; i < element.length; i++)
            {
                if (i === element.length - 1)
                {
                    return this.add(element[i], animate, options)
                }
                else
                {
                    this.add(element[i], animate, options)
                }
            }
        }

        // set up default options
        options = options || {}
        options.duration = exists(options.duration) ? options.duration : this.options.duration
        options.ease = options.ease || this.options.ease
        if (typeof options.ease === 'string')
        {
            options.ease = Penner[options.ease]
        }

        if (element.__domEase)
        {
            element.__domEase.add(animate, options)
        }
        else
        {
            const domEase = element.__domEase = new Animate(element)
            domEase.add(animate, options)
            this.list.push(domEase)
        }
        return element.__domEase
    }

    /**
     * remove animation(s)
     * @param {(Animation|HTMLElement)} object
     */
    remove(object)
    {
        const element = object.__domEase ? object.__domEase.element : object
        const index = this.list.indexOf(element)
        if (index !== -1)
        {
            this.list.splice(index, 1)
        }
        delete element.__domEase
    }

    /**
     * remove all animations from list
     */
    removeAll()
    {
        while (this.list.length)
        {
            const animate = this.list.pop()
            if (animate.element.__domEase)
            {
                delete animate.element.__domEase
            }
        }
    }

    /**
     * update frame
     * @param {number} elapsed time in ms
     */
    update(elapsed)
    {
        for (let i = 0, _i = this.list.length; i < _i; i++)
        {
            if (this.list[i].update(elapsed))
            {
                this.list.splice(i, 1)
                i--
                _i--
            }
        }
        this.emit('each', this)
        if (!this.empty && Array.keys(this.list).length === 0 && !this.empty)
        {
            this.emit('done', this)
            this.empty = true
        }
    }

    /**
     * number of elements being animated
     * @type {number}
     */
    get countElements()
    {
        return this.list.length
    }

    /**
     * number of active animations across all elements
     * @type {number}
     */
    get countRunning()
    {
        let count = 0
        for (let entry of this.list)
        {
            count += Object.keys(entry) - 1
        }
        return count
    }

    /**
     * fires when there are no more animations
     * @event complete
     * @type {(DomEase|Animation)}
     */

    /**
     * fires on each loop where there are animations
     * @event each
     * @type {(DomEase|Animation)}
     */

    /**
     * fires when an animation repeats or reverses
     * @event loop
     * @type {Animation}
     */
}
},{"./src/animate":5,"eventemitter3":2,"exists":3,"penner":4}],2:[function(require,module,exports){
'use strict';

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
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],3:[function(require,module,exports){
module.exports = exists;

module.exports.allExist = allExist;

function exists (v) {
  return v !== null && v !== undefined;
}

function allExist (/* vals */) {
  var vals = Array.prototype.slice.call(arguments);
  return vals.every(exists);
}
},{}],4:[function(require,module,exports){

/*
	Copyright © 2001 Robert Penner
	All rights reserved.

	Redistribution and use in source and binary forms, with or without modification, 
	are permitted provided that the following conditions are met:

	Redistributions of source code must retain the above copyright notice, this list of 
	conditions and the following disclaimer.
	Redistributions in binary form must reproduce the above copyright notice, this list 
	of conditions and the following disclaimer in the documentation and/or other materials 
	provided with the distribution.

	Neither the name of the author nor the names of contributors may be used to endorse 
	or promote products derived from this software without specific prior written permission.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
	EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
	MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
	COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
	EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
	GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
	AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
	OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function() {
  var penner, umd;

  umd = function(factory) {
    if (typeof exports === 'object') {
      return module.exports = factory;
    } else if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else {
      return this.penner = factory;
    }
  };

  penner = {
    linear: function(t, b, c, d) {
      return c * t / d + b;
    },
    easeInQuad: function(t, b, c, d) {
      return c * (t /= d) * t + b;
    },
    easeOutQuad: function(t, b, c, d) {
      return -c * (t /= d) * (t - 2) + b;
    },
    easeInOutQuad: function(t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return c / 2 * t * t + b;
      } else {
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
      }
    },
    easeInCubic: function(t, b, c, d) {
      return c * (t /= d) * t * t + b;
    },
    easeOutCubic: function(t, b, c, d) {
      return c * ((t = t / d - 1) * t * t + 1) + b;
    },
    easeInOutCubic: function(t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return c / 2 * t * t * t + b;
      } else {
        return c / 2 * ((t -= 2) * t * t + 2) + b;
      }
    },
    easeInQuart: function(t, b, c, d) {
      return c * (t /= d) * t * t * t + b;
    },
    easeOutQuart: function(t, b, c, d) {
      return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    },
    easeInOutQuart: function(t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return c / 2 * t * t * t * t + b;
      } else {
        return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
      }
    },
    easeInQuint: function(t, b, c, d) {
      return c * (t /= d) * t * t * t * t + b;
    },
    easeOutQuint: function(t, b, c, d) {
      return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
    },
    easeInOutQuint: function(t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return c / 2 * t * t * t * t * t + b;
      } else {
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
      }
    },
    easeInSine: function(t, b, c, d) {
      return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    },
    easeOutSine: function(t, b, c, d) {
      return c * Math.sin(t / d * (Math.PI / 2)) + b;
    },
    easeInOutSine: function(t, b, c, d) {
      return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    },
    easeInExpo: function(t, b, c, d) {
      if (t === 0) {
        return b;
      } else {
        return c * Math.pow(2, 10 * (t / d - 1)) + b;
      }
    },
    easeOutExpo: function(t, b, c, d) {
      if (t === d) {
        return b + c;
      } else {
        return c * (-Math.pow(2, -10 * t / d) + 1) + b;
      }
    },
    easeInOutExpo: function(t, b, c, d) {
      if (t === 0) {
        b;
      }
      if (t === d) {
        b + c;
      }
      if ((t /= d / 2) < 1) {
        return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
      } else {
        return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
      }
    },
    easeInCirc: function(t, b, c, d) {
      return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    },
    easeOutCirc: function(t, b, c, d) {
      return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    },
    easeInOutCirc: function(t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
      } else {
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
      }
    },
    easeInElastic: function(t, b, c, d) {
      var a, p, s;
      s = 1.70158;
      p = 0;
      a = c;
      if (t === 0) {
        b;
      } else if ((t /= d) === 1) {
        b + c;
      }
      if (!p) {
        p = d * .3;
      }
      if (a < Math.abs(c)) {
        a = c;
        s = p / 4;
      } else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
      }
      return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
    },
    easeOutElastic: function(t, b, c, d) {
      var a, p, s;
      s = 1.70158;
      p = 0;
      a = c;
      if (t === 0) {
        b;
      } else if ((t /= d) === 1) {
        b + c;
      }
      if (!p) {
        p = d * .3;
      }
      if (a < Math.abs(c)) {
        a = c;
        s = p / 4;
      } else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
      }
      return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
    },
    easeInOutElastic: function(t, b, c, d) {
      var a, p, s;
      s = 1.70158;
      p = 0;
      a = c;
      if (t === 0) {
        b;
      } else if ((t /= d / 2) === 2) {
        b + c;
      }
      if (!p) {
        p = d * (.3 * 1.5);
      }
      if (a < Math.abs(c)) {
        a = c;
        s = p / 4;
      } else {
        s = p / (2 * Math.PI) * Math.asin(c / a);
      }
      if (t < 1) {
        return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
      } else {
        return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
      }
    },
    easeInBack: function(t, b, c, d, s) {
      if (s === void 0) {
        s = 1.70158;
      }
      return c * (t /= d) * t * ((s + 1) * t - s) + b;
    },
    easeOutBack: function(t, b, c, d, s) {
      if (s === void 0) {
        s = 1.70158;
      }
      return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    },
    easeInOutBack: function(t, b, c, d, s) {
      if (s === void 0) {
        s = 1.70158;
      }
      if ((t /= d / 2) < 1) {
        return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
      } else {
        return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
      }
    },
    easeInBounce: function(t, b, c, d) {
      var v;
      v = penner.easeOutBounce(d - t, 0, c, d);
      return c - v + b;
    },
    easeOutBounce: function(t, b, c, d) {
      if ((t /= d) < 1 / 2.75) {
        return c * (7.5625 * t * t) + b;
      } else if (t < 2 / 2.75) {
        return c * (7.5625 * (t -= 1.5 / 2.75) * t + .75) + b;
      } else if (t < 2.5 / 2.75) {
        return c * (7.5625 * (t -= 2.25 / 2.75) * t + .9375) + b;
      } else {
        return c * (7.5625 * (t -= 2.625 / 2.75) * t + .984375) + b;
      }
    },
    easeInOutBounce: function(t, b, c, d) {
      var v;
      if (t < d / 2) {
        v = penner.easeInBounce(t * 2, 0, c, d);
        return v * .5 + b;
      } else {
        v = penner.easeOutBounce(t * 2 - d, 0, c, d);
        return v * .5 + c * .5 + b;
      }
    }
  };

  umd(penner);

}).call(this);

},{}],5:[function(require,module,exports){
const Events = require('eventemitter3')

const Left = require('./left')
const Top = require('./top')
const Color = require('./color')
const BackgroundColor = require('./backgroundColor')
const ScaleX = require('./scaleX')
const ScaleY = require('./scaleY')
const Scale = require('./scale')
const Opacity = require('./opacity')
const Width = require('./width')
const Height = require('./height')

module.exports = class Animate extends Events
{
    constructor(element)
    {
        super()
        this.element = element
        this.animations = {}
    }

    add(animate, options)
    {
        for (let entry in animate)
        {
            switch (entry)
            {
                case 'left':
                    this.animations['left'] = new Left(this.element, animate[entry], options)
                    break

                case 'top':
                    this.animations['top'] = new Top(this.element, animate[entry], options)
                    break

                case 'color':
                    this.animations[entry] = new Color(this.element, animate[entry], options)
                    break

                case 'backgroundColor':
                    this.animations[entry] = new BackgroundColor(this.element, animate[entry], options)
                    break

                case 'scale':
                    this.animations[entry] = new Scale(this.element, animate[entry], options)
                    break

                case 'scaleX':
                    this.animations[entry] = new ScaleX(this.element, animate[entry], options)
                    break

                case 'scaleY':
                    this.animations[entry] = new ScaleY(this.element, animate[entry], options)
                    break

                case 'opacity':
                    this.animations[entry] = new Opacity(this.element, animate[entry], options)
                    break

                case 'width':
                    this.animations[entry] = new Width(this.element, animate[entry], options)
                    break

                case 'height':
                    this.animations[entry] = new Height(this.element, animate[entry], options)
                    break

                default:
                    console.warn(entry + ' not setup for animation in DomEase.')
            }
        }
    }

    update(elapsed)
    {
        const animations = this.animations
        for (let animation in animations)
        {
            const animate = animations[animation]
            if (animate.update(elapsed))
            {
                const options = animate.options
                if (options.reverse)
                {
                    this.emit('loop-' + animate.name, animate.element)
                    animate.reverse()
                    if (!options.repeat)
                    {
                        options.reverse = false
                    }
                    if (options.repeat !== true)
                    {
                        options.repeat--
                    }
                }
                if (options.repeat)
                {
                    animate.repeat()
                    if (options.repeat !== true)
                    {
                        options.repeat--
                    }
                }
                else
                {
                    this.emit('complete-' + animate.name, animate.element)
                    delete animations[animation]
                }
            }
            this.emit('each-' + animate.name, animate.element)
        }
        this.emit('each', this)
        if (Object.keys(animations) === 0)
        {
            this.emit('empty', this)
            return true
        }
    }
}
},{"./backgroundColor":6,"./color":7,"./height":8,"./left":9,"./opacity":10,"./scale":11,"./scaleX":12,"./scaleY":13,"./top":14,"./width":15,"eventemitter3":2}],6:[function(require,module,exports){
module.exports = class BackgroundColor
{
    constructor(element, colors, options)
    {
        this.name = 'backgroundColor'
        this.element = element
        if (Array.isArray(colors))
        {
            this.colors = colors
        }
        else
        {
            this.colors = [colors]
        }
        this.original = element.style.backgroundColor
        colors.push(this.original)
        this.interval = options.duration / colors.length
        this.options = options
        this.time = 0
    }

    update(elapsed)
    {
        const options = this.options
        this.time += elapsed
        const i = Math.floor(this.time / this.interval)
        const color = this.colors[i]
        if (this.element.style.backgroundColor !== color)
        {
            this.element.style.backgroundColor = this.colors[i]
        }
        if (this.time >= options.duration)
        {
            return true
        }
    }

    repeat()
    {
        this.time = 0
    }

    reverse()
    {
        const reverse = []
        for (let color in this.colors)
        {
            reverse.unshift(this.colors[color])
        }
        reverse.push(reverse.shift())
        this.colors = reverse
    }
}
},{}],7:[function(require,module,exports){
module.exports = class Color
{
    constructor(element, colors, options)
    {
        this.name = 'color'
        this.element = element
        if (Array.isArray(colors))
        {
            this.colors = colors
        }
        else
        {
            this.colors = [colors]
        }
        this.original = element.style.color
        colors.push(this.original)
        this.interval = options.duration / colors.length
        this.options = options
        this.time = 0
    }

    update(elapsed)
    {
        const options = this.options
        this.time += elapsed
        const i = Math.floor(this.time / this.interval)
        const color = this.colors[i]
        if (this.element.style.color !== color)
        {
            this.element.style.color = this.colors[i]
        }
        if (this.time >= options.duration)
        {
            return true
        }
    }

    repeat()
    {
        this.time = 0
    }

    reverse()
    {
        const reverse = []
        for (let color in this.colors)
        {
            reverse.unshift(this.colors[color])
        }
        reverse.push(reverse.shift())
        this.colors = reverse
    }
}
},{}],8:[function(require,module,exports){
module.exports = class Height
{
    constructor(element, height, options)
    {
        this.name = 'height'
        this.element = element
        this.to = height
        this.options = options
        this.start = element.offsetHeight
        this.delta = this.to - this.start
        this.time = 0
    }

    update(elapsed)
    {
        const options = this.options
        this.time += elapsed
        this.element.style.height = options.ease(this.time, this.start, this.delta, options.duration) + 'px'
        if (this.time >= options.duration)
        {
            return true
        }
    }

    repeat()
    {
        this.time = 0
    }

    reverse()
    {
        const swap = this.to
        this.to = this.start
        this.start = swap
        this.delta = -this.delta
    }
}
},{}],9:[function(require,module,exports){
module.exports = class Left
{
    constructor(element, x, options)
    {
        this.name = 'left'
        this.element = element
        this.to = x
        this.options = options
        this.start = element.offsetLeft
        this.delta = this.to - this.start
        this.time = 0
    }

    update(elapsed)
    {
        const options = this.options
        this.time += elapsed
        this.element.style.left = options.ease(this.time, this.start, this.delta, options.duration) + 'px'
        if (this.time >= options.duration)
        {
            return true
        }
    }

    repeat()
    {
        this.time = 0
    }

    reverse()
    {
        const swap = this.to
        this.to = this.start
        this.start = swap
        this.delta = -this.delta
    }
}
},{}],10:[function(require,module,exports){
const exists = require('exists')

module.exports = class Opacity
{
    constructor(element, opacity, options)
    {
        this.name = 'opacity'
        this.element = element
        this.to = opacity
        this.options = options
        this.start = exists(element.opacity) ? parseFloat(element.opacity) : 1
        this.delta = this.to - this.start
        this.time = 0
    }

    update(elapsed)
    {
        const options = this.options
        this.time += elapsed
        this.element.style.opacity = options.ease(this.time, this.start, this.delta, options.duration)
        if (this.time >= options.duration)
        {
            return true
        }
    }

    repeat()
    {
        this.time = 0
    }

    reverse()
    {
        const swap = this.to
        this.to = this.start
        this.start = swap
        this.delta = -this.delta
    }
}
},{"exists":3}],11:[function(require,module,exports){
module.exports = class Scale
{
    constructor(element, value, options)
    {
        this.name = 'scale'
        this.element = element
        this.options = options
        this.to = value
        const transform = element.style.transform
        const scale = transform.indexOf('scale(')
        if (scale == -1)
        {
            this.start = 1
        }
        else
        {
            const extract = transform.substring(scale + ('scale(').length, transform.indexOf(')', scale))
            this.start = parseFloat(extract)
        }
        this.delta = this.to - this.start
        this.time = 0
    }

    update(elapsed)
    {
        const options = this.options
        this.time += elapsed
        let value
        if (this.time >= options.duration)
        {
            value = this.to
        }
        else
        {
            value = options.ease(this.time, this.start, this.delta, options.duration)
        }
        const transform = this.element.style.transform
        const scale = transform.indexOf('scale(')
        if (!transform)
        {
            this.element.style.transform = 'scale(' + value + ')'
        }
        else if (scale == -1)
        {
            this.element.style.transform += ' scale(' + value + ')'
        }
        else
        {
            this.element.style.transform = transform.substr(0, scale + ('scale(').length) + value + transform.substr(transform.indexOf(')'))
        }
        if (this.time >= options.duration)
        {
            return true
        }
    }

    repeat()
    {
        this.time = 0
    }

    reverse()
    {
        const swap = this.to
        this.to = this.start
        this.start = swap
        this.delta = -this.delta
    }
}
},{}],12:[function(require,module,exports){
module.exports = class ScaleX
{
    constructor(element, x, options)
    {
        this.name = 'scaleX'
        this.element = element
        this.options = options
        this.to = x
        const transform = element.style.transform
        const scaleX = transform.indexOf('scaleX')
        if (scaleX == -1)
        {
            this.start = 1
        }
        else
        {
            const extract = transform.substring(scaleX + ('scaleX').length + 1, transform.indexOf(')', scaleX))
            this.start = parseFloat(extract)
        }
        this.delta = this.to - this.start
        this.time = 0
    }

    update(elapsed)
    {
        const options = this.options
        this.time += elapsed
        const scale = options.ease(this.time, this.start, this.delta, options.duration)
        const transform = this.element.style.transform
        const scaleX = transform.indexOf('scaleX')

        if (!transform)
        {
            this.element.style.transform = 'scaleX(' + scale + ')'
        }
        else if (scaleX == -1)
        {
            this.element.style.transform += ' scaleX(' + scale + ')'
        }
        else
        {
            this.element.style.transform = transform.substr(0, scaleX + ('scaleX(').length) + scale + transform.indexOf(')', scaleX)
        }
        if (this.time >= options.duration)
        {
            return true
        }
    }

    repeat()
    {
        this.time = 0
    }

    reverse()
    {
        const swap = this.to
        this.to = this.start
        this.start = swap
        this.delta = -this.delta
    }
}
},{}],13:[function(require,module,exports){
module.exports = class ScaleY
{
    constructor(element, y, options)
    {
        this.name = 'scaleY'
        this.element = element
        this.options = options
        this.to = y
        const transform = element.style.transform
        const scaleY = transform.indexOf('scaleY')
        if (scaleY == -1)
        {
            this.start = 1
        }
        else
        {
            const extract = transform.substring(scaleY + ('scaleY').length + 1, transform.indexOf(')', scaleY))
            this.start = parseFloat(extract)
        }
        this.delta = this.to - this.start
        this.time = 0
    }

    update(elapsed)
    {
        const options = this.options
        this.time += elapsed
        const scale = options.ease(this.time, this.start, this.delta, options.duration)
        const transform = this.element.style.transform
        const scaleY = transform.indexOf('scaleY')

        if (!transform)
        {
            this.element.style.transform = 'scaleY(' + scale + ')'
        }
        else if (scaleY == -1)
        {
            this.element.style.transform += ' scaleY(' + scale + ')'
        }
        else
        {
            this.element.style.transform = transform.substr(0, scaleY + ('scaleY(').length) + scale + transform.indexOf(')', scaleY)
        }
        if (this.time >= options.duration)
        {
            return true
        }
    }

    repeat()
    {
        this.time = 0
    }

    reverse()
    {
        const swap = this.to
        this.to = this.start
        this.start = swap
        this.delta = -this.delta
    }
}
},{}],14:[function(require,module,exports){
module.exports = class Top
{
    constructor(element, y, options)
    {
        this.name = 'top'
        this.element = element
        this.to = y
        this.options = options
        this.start = element.offsetTop
        this.delta = this.to - this.start
        this.time = 0
    }

    update(elapsed)
    {
        const options = this.options
        this.time += elapsed
        this.element.style.top = options.ease(this.time, this.start, this.delta, options.duration) + 'px'
        if (this.time >= options.duration)
        {
            return true
        }
    }

    repeat()
    {
        this.time = 0
    }

    reverse()
    {
        const swap = this.to
        this.to = this.start
        this.start = swap
        this.delta = -this.delta
    }
}
},{}],15:[function(require,module,exports){
module.exports = class Width
{
    constructor(element, width, options)
    {
        this.name = 'width'
        this.element = element
        this.to = width
        this.options = options
        this.start = element.offsetWidth
        this.delta = this.to - this.start
        this.time = 0
    }

    update(elapsed)
    {
        const options = this.options
        this.time += elapsed
        this.element.style.width = options.ease(this.time, this.start, this.delta, options.duration) + 'px'
        if (this.time >= options.duration)
        {
            return true
        }
    }

    repeat()
    {
        this.time = 0
    }

    reverse()
    {
        const swap = this.to
        this.to = this.start
        this.start = swap
        this.delta = -this.delta
    }
}
},{}],16:[function(require,module,exports){
const WM = require('..')
const html = require('../src/html')

// create a window manager and change some of the default styles
const wm = new WM({
    borderRadius: '10px'
})

// create a test window
const test = wm.createWindow( { x: 10, y: 10, title: 'Test Window' })
test.content.style.padding = '1em'
test.content.innerHTML = 'This is a test window.'
test.open()

// create a pink test window, changing the window's style
const test2 = wm.createWindow({
    width: 300, height: 150,
    x: 100, y: 100,
    backgroundColorWindow: 'rgb(255,200,255)',
    titlebarHeight: '22px',
    backgroundColorTitlebarActive: 'green',
    backgroundColorTitlebarInactive: 'purple'
})
test2.content.style.padding = '0.5em'
test2.content.innerHTML = 'This is a pink test window.<br><br>Check out the fancy title bar for other style tests.<br><br><br>And scrolling!!!'
test2.open()

// create a test window with a button to create a modal window
const test3 = wm.createWindow({ x: 300, y: 400, width: 350, title: 'This is one fancy demo!' })
test3.content.style.padding = '1em'
html.create({ parent: test3.content, html: 'OK. It isn\'t that fancy, but it shows off some of the functionality of this library.' })
const div = html.create({ parent: test3.content, styles: { textAlign: 'center', marginTop: '1em' } })
const button = html.create({ parent: div, type: 'button', html: 'open modal window' })
button.onclick = () =>
{
    // create a modal window
    const modal = wm.createWindow({
        modal: true,
        width: 200,
        center: test3, // center window in test3
        title: 'modal window',
        minimizable: false,
        maximizable: false
    })
    const div = html.create({ parent: modal.content, styles: { 'margin': '0.5em' }})
    html.create({ parent: div, html: 'This needs to be closed before using other windows.' })
    const buttonDiv = html.create({ parent: div, styles: { 'text-align': 'center', margin: '1em' } })
    const button = html.create({ parent: buttonDiv, type: 'button', html: 'close modal' })
    button.onclick = () =>
    {
        modal.close()
    }
    modal.open()
}
test3.open()

const test4 = wm.createWindow({ x: 300, y: 20, title: 'My wife\'s art gallery!' })
test4.content.innerHTML = '<iframe width="560" height="315" src="https://www.youtube.com/embed/-slAp_gVa70" frameborder="0" gesture="media" allow="encrypted-media" allowfullscreen></iframe>'
test4.open()
test4.sendToBack()

const test5 = wm.createWindow({ x: 20, y: 600, title: 'window save/load' })
html.create({ parent: test5.content, html: 'Save the windows, and then move windows around and load them.', styles: { margin: '0.5em' }})
const buttons = html.create({ parent: test5.content, styles: { 'text-align': 'center' } })
const save = html.create({ parent: buttons, html: 'save window state', type: 'button', styles: { margin: '1em', background: 'rgb(200,255,200)' } })
const load = html.create({ parent: buttons, html: 'load window state', type: 'button', styles: { margin: '1em', background: 'rgb(255,200,200)' } })
test5.open()
let data
save.onclick = () => data = wm.save()
load.onclick = () => { if (data) wm.load(data) }

const test6 = wm.createWindow({ x: 800, y: 350, width: 250, height: 350, title: 'One of my early games' })
const game = html.create({ parent: test6.content, type: 'button', html: 'play game', styles: { 'margin-top': '50%', 'margin-left': '50%', transform: 'translate(-50%, 0)' } })
game.onclick = () =>
{
    test6.content.style.overflow = 'hidden'
    test6.content.innerHTML = ''
    test6.content.innerHTML = '<iframe width="100%", height="100%" src="https://yopeyopey.com/games/gotpaws/">'
}
test6.open()

const wallpaper = html.create({ parent: wm.overlay, styles: { 'text-align': 'center', 'margin-top': '50%', color: 'white' } })
wallpaper.innerHTML = 'You can also use the background as wallpaper or another window surface.'
},{"..":17,"../src/html":21}],17:[function(require,module,exports){
module.exports = require('./src/window-manager')
},{"./src/window-manager":22}],18:[function(require,module,exports){
/**
 * Javascript: create click event for both mouse and touch
 * @example
 *
 * import clicked from 'clicked';
 * // or var clicked = require('clicked');
 *
 *  function handleClick()
 *  {
 *      console.log('I was clicked.');
 *  }
 *
 *  var div = document.getElementById('clickme');
 *  clicked(div, handleClick, {thresshold: 15});
 *
 */

/**
 * @param {HTMLElement} element
 * @param {function} callback called after click: callback(event, options.args)
 * @param {object} [options]
 * @param {number} [options.thresshold=10] if touch moves threshhold-pixels then the touch-click is cancelled
 * @param {*} [options.args] arguments for callback function
 * @returns {object} object
 * @returns {function} object.disable() - disables clicked
 * @returns {function} object.enable() - enables clicked after disable() is called
 */
function clicked(element, callback, options)
{
    function touchstart(e)
    {
        if (disabled)
        {
            return;
        }
        if (e.touches.length === 1)
        {
            lastX = e.changedTouches[0].screenX;
            lastY = e.changedTouches[0].screenY;
            down = true;
        }
    }

    function pastThreshhold(x, y)
    {
        return Math.abs(lastX - x) > threshhold || Math.abs(lastY - y) > threshhold;
    }

    function touchmove(e)
    {
        if (!down || e.touches.length !== 1)
        {
            touchcancel();
            return;
        }
        var x = e.changedTouches[0].screenX;
        var y = e.changedTouches[0].screenY;
        if (pastThreshhold(x, y))
        {
            touchcancel();
        }
    }

    function touchcancel()
    {
        down = false;
    }

    function touchend(e)
    {
        if (down)
        {
            e.preventDefault();
            callback(e, options.args);
        }
    }

    function mouseclick(e)
    {
        if (!disabled)
        {
            callback(e, options.args);
        }
    }

    options = options || {};
    var down, lastX, lastY, disabled;
    var threshhold = options.thresshold || 10;

    element.addEventListener('click', mouseclick);
    element.addEventListener('touchstart', touchstart, { passive: true });
    element.addEventListener('touchmove', touchmove, { passive: true });
    element.addEventListener('touchcancel', touchcancel);
    element.addEventListener('touchend', touchend);

    return {
        disable: function () { disabled = true; },
        enable: function () { disabled = false; }
    };
}

module.exports = clicked;
},{}],19:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2}],20:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],21:[function(require,module,exports){
function create(options)
{
    options = options || {}
    const object = document.createElement(options.type || 'div')
    if (options.parent)
    {
        options.parent.appendChild(object)
    }
    if (options.styles)
    {
        for (let style in options.styles)
        {
            object.style[style] = options.styles[style]
        }
    }
    if (options.html)
    {
        object.innerHTML = options.html
    }
    return object
}

module.exports = {
    create
}
},{}],22:[function(require,module,exports){
const exists = require('exists')

const html = require('./html')
const WindowOptions = require('./window-options')
const Window = require('./window')

module.exports = class WindowManager
{
    /**
     * @param {WindowOptions} [defaultOptions] default WindowOptions used when createWindow is called
     * @param {boolean} [defaultOptions.quiet] suppress the simple-window-manager console message
     */
    constructor(defaultOptions)
    {
        this._createDom()
        this.windows = []
        this.active = null
        this.modal = null
        this.options = {}
        for (let key in WindowOptions)
        {
            this.options[key] = WindowOptions[key]
        }
        if (defaultOptions)
        {
            for (let key in defaultOptions)
            {
                this.options[key] = defaultOptions[key]
            }
        }
        if (!defaultOptions.quiet)
        {
            console.log('%c ☕ simple-window-manager initialized ☕', 'color: #ff00ff')
        }
    }

    /**
     * Create a window
     * @param {WindowOptions} [options]
     * @param {string} [options.title]
     * @param {number} [options.x] position
     * @param {number} [options.y] position
     * @param {boolean} [options.modal]
     * @param {Window} [options.center] center in the middle of an existing Window
     * @param {string|number} [options.id] if not provide, id will be assigned in order of creation (0, 1, 2...)
     * @fires open
     * @fires focus
     * @fires blur
     * @fires close
     * @fires maximize
     * @fires maximize-restore
     * @fires minimize
     * @fires minimize-restore
     * @fires move
     * @fires move-start
     * @fires move-end
     * @fires resize
     * @fires resize-start
     * @fires resize-end
     */
    createWindow(options)
    {
        options = options || {}
        for (let key in this.options)
        {
            if (!exists(options[key]))
            {
                options[key] = this.options[key]
            }
        }
        const win = new Window(this, options);
        win.on('open', this._open, this)
        win.on('focus', this._focus, this)
        win.on('blur', this._blur, this)
        win.on('close', this._close, this)
        win.win.addEventListener('mousemove', (e) => this._move(e))
        win.win.addEventListener('touchmove', (e) => this._move(e))
        win.win.addEventListener('mouseup', (e) => this._up(e))
        win.win.addEventListener('touchend', (e) => this._up(e))
        if (options.center)
        {
            win.move(
                options.center.x + options.center.width / 2 - (options.width ? options.width / 2 : 0),
                options.center.y + options.center.height / 2 - (options.height ? options.height / 2 : 0)
            )
        }
        if (options.modal)
        {
            this.modal = win
        }
        return win
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
                'overflow': 'hidden'
            }
        })
        this.overlay.addEventListener('mousemove', (e) => this._move(e))
        this.overlay.addEventListener('touchmove', (e) => this._move(e))
        this.overlay.addEventListener('mouseup', (e) => this._up(e))
        this.overlay.addEventListener('touchend', (e) => this._up(e))
    }

    _open(win)
    {
        const index = this.windows.indexOf(win)
        if (index === -1)
        {
            this.windows.push(win)
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

    _checkModal(win)
    {
        return !this.modal || this.modal === win
    }
}
},{"./html":21,"./window":24,"./window-options":23,"exists":20}],23:[function(require,module,exports){
/**
 * @typedef WindowOptions
 * @type {object}
 * @property {number} [x=0]
 * @property {number} [y=0]
 * @property {number} [width]
 * @property {number} [height]
 * @property {boolean} [movable=true]
 * @property {boolean} [resizable=true]
 * @property {boolean} [maximizable=true]
 * @property {boolean} [minimizable=true]
 * @property {boolean} [closable=true]
 * @property {boolean} [titlebar=true]
 * @property {string} [titlebarHeight=36px]
 * @property {string} [minWidth=200px]
 * @property {string} [minHeight=60px]
 * @property {string} [borderRadius=4px]
 * @property {number} [minimizeSize=50]
 * @property {string} [shadow='0 0 12px 1px rgba(0, 0, 0, 0.6)']
 * @property {number} [animateTime=250]
 * @property {(string|function)} [ease] easing name (see https://www.npmjs.com/package/penner) for list or function
 * @property {string} [backgroundColorWindow=#fefefe]
 * @property {string} [backgroundColorTitlebarActive=#365d98]
 * @property {string} [backgroundColorTitlebarInactive=#888888]
 * @property {string} [foregroundColorButton=#ffffff]
 * @property {string} [foregroundColorTitle=#ffffff]
 * @property {string} [backgroundMinimizeButton=...]
 * @property {string} [backgroundMaximizeButton=...]
 * @property {string} [backgroundCloseButton=...]
 * @property {string} [backgroundResize=...]
 */
const WindowOptions = {
    x: 0,
    y: 0,

    minWidth: '200px',
    minHeight: '60px',

    borderRadius: '4px',
    minimizeSize: 50,
    shadow: '0 0 12px 1px rgba(0, 0, 0, 0.6)',
    movable: true,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closable: true,

    titlebar: true,
    titlebarHeight: '36px',

    animateTime: 250,
    ease: 'easeInOutSine',

    backgroundColorWindow: '#fefefe',
    backgroundColorTitlebarActive: '#365d98',
    backgroundColorTitlebarInactive: '#888888',
    foregroundColorButton: '#ffffff',
    foregroundColorTitle: '#ffffff',

    backgroundCloseButton: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAAfElEQVQ4jdXUwQ2AIBBEUULLVkET2N228b1gVFxkIWuik3gbHhCQEH4TYAEESEA09GPpCrBoBeFIfkILlk990UqJa1RUwQCSZdYbaumY0WGsg67lG8M66BxWofWq9tU2sbFZZuO6ZddDaWBz18YyYAjlhV/P/XHwfb4+mw0FvmLroLRViAAAAABJRU5ErkJggg==)',
    backgroundMaximizeButton: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAAVklEQVQ4jWNgoAX4////1v+Ug60MDAwMjFAD/1PDYYyMjIxM1DAIGVDdQBY0vgmZ5pxB4cFClUzDUPQP/jAcNXDUwMFgIEpepkYxBnPhNkoNopIZmAAAdghhoHiIrEcAAAAASUVORK5CYII=)',
    backgroundMinimizeButton: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAAOElEQVQ4jWNgGAWjYBSMgiEJGGGM////p1FkECPjLHQD/1NoICMDAwMDEyWGYAMsSOxz1DacKgAAbrQI132oX0IAAAAASUVORK5CYII=)',
    backgroundRestoreButton: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAA2klEQVQ4ja2UzQ3CMAyFnyuuSD0wBjvAKGUDRmAERugO5U6G6ABw51CJAR6XBIX8OCHquyR27U9pnltgZYnbkNwB2Ff2zSLyUitITqzXlON03n5beTq1dhPETwBjATZoD0PgQ0QuWgPJ4z9AvzFnUp8AxyaRNCSNFzeZ1CGvJpOyr2yVMmmw6xjEVcDIJHd3Lh+aFAJ7ryB1+S6/5E7gA98ADgDuQU0YA8CtBnjC75hc7XpO9M1FoJ0j42KSi82bqEuRNjZNKrncJ0yJaqCY9FXrlyIKcN0fbqs+F7nRockDNMcAAAAASUVORK5CYII=)',

    backgroundResize: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QzREODAwQzcyRjZDMTFFMjg5NkREMENBNjJERUE4Q0IiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QzREODAwQzgyRjZDMTFFMjg5NkREMENBNjJERUE4Q0IiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpDNEQ4MDBDNTJGNkMxMUUyODk2REQwQ0E2MkRFQThDQiIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpDNEQ4MDBDNjJGNkMxMUUyODk2REQwQ0E2MkRFQThDQiIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PuQy0VQAAACLSURBVHjaYpw9ezYDEUARiO8zEaHQHohPArEcCxEK1wGxPxA/wmeyDZLCIyABJjwKNwJxEFShIi7FyAoPArEZEB8DYi0mHFaHIikEaUwE4mtMWBRGAPE+NIU7kJ0BUxiNQyFInpMJKgFTuBuLQj8gXg3yJCicHyFZDQJfgDgOqhEE3gGxD8jNAAEGADlXJQUd3J75AAAAAElFTkSuQmCC) no-repeat',
}

module.exports = WindowOptions
},{}],24:[function(require,module,exports){
const Events = require('eventemitter3')
const clicked = require('clicked')
const Ease = require('../../dom-ease')
const exists = require('exists')

const html = require('./html')

let id = 0

module.exports = class Window extends Events
{
    constructor(wm, options)
    {
        super()
        this.wm = wm

        this.options = options

        this.id = exists(this.options.id) ? this.options.id : id++

        this._createWindow()
        this._listeners()

        this.active = false
        this.maximized = false
        this.minimized = false

        this._closed = true
        this._restore = null
        this._moving = null
        this._resizing = null

        this.ease = new Ease({ duration: this.options.animateTime, ease: this.options.ease })
    }

    /**
     * open the window
     * @param {boolean} [noFocus] do not focus window when opened
     * @param {boolean} [noAnimate] do not animate window when opened
     */
    open(noFocus, noAnimate)
    {
        if (this._closed)
        {
            this.emit('open', this)
            this.win.style.display = 'block'
            if (!noAnimate)
            {
                this.win.style.transform = 'scale(0)'
                this.ease.add(this.win, { scale: 1 })
            }
            this._closed = false
            if (!noFocus)
            {
                this.focus()
            }
        }
    }

    /**
     * focus the window
     */
    focus()
    {
        if (this.wm._checkModal(this))
        {
            if (this.minimized)
            {
                this.minimize()
            }
            this.active = true
            this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarActive
            this.emit('focus', this)
        }
    }

    /**
     * blur the window
     */
    blur()
    {
        if (this.wm.modal !== this)
        {
            this.active = false
            this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarInactive
            this.emit('blur', this)
        }
    }

    /**
     * closes the window (can be reopened with open) if a reference is saved
     */
    close()
    {
        if (!this._closed)
        {
            this._closed = true
            const ease = this.ease.add(this.win, { scale: 0 })
            ease.on('complete-scale', () =>
            {
                this.win.style.display = 'none'
                this.emit('close', this);
            })
        }
    }

    /**
     * left coordinate
     * @type {number}
     */
    get x() { return this.options.x }
    set x(value)
    {
        this.options.x = value
        this.win.style.left = value + 'px'
    }

    /**
     * top coordinate
     * @type {number}
     */
    get y() { return this.options.y }
    set y(value)
    {
        this.options.y = value
        this.win.style.top = value + 'px'
    }

    /**
     * width of window
     * @type {number}
     */
    get width() { return this.options.width || this.win.offsetWidth }
    set width(value)
    {
        this.options.width = value
        if (value)
        {
            this.win.style.width = value + 'px'
        }
        else
        {
            this.win.style.width = 'auto'
        }
    }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this.options.height || this.win.offsetHeight }
    set height(value)
    {
        this.options.height = value
        if (value)
        {
            this.win.style.height = value + 'px'
        }
        else
        {
            this.win.style.height = 'auto'
        }
    }

    /**
     * resize the window
     * @param {number} width
     * @param {number} height
     */
    resize(width, height)
    {
        this.width = width
        this.height = height
    }

    /**
     * move window
     * @param {number} x
     * @param {number} y
     */
    move(x, y)
    {
        this.x = x
        this.y = y
    }

    /**
     * minimize window
     * @param {boolean} noAnimate
     */
    minimize(noAnimate)
    {
        if (this.wm._checkModal(this) && this.options.minimizable && !this.transitioning)
        {
            if (this.minimized)
            {
                if (noAnimate)
                {
                    this.win.style.transform = 'scaleX(1) scaleY(1)'
                    this.minimized = false
                    this.emit('minimize-restore')
                    this.overlay.style.display = 'none'
                }
                else
                {
                    this.transitioning = true
                    const add = this.ease.add(this.win, { scaleX: 1, scaleY: 1, left: this.minimized.x, top: this.minimized.y })
                    add.on('complete-top', () =>
                    {
                        this.minimized = false
                        this.emit('minimize-restore', this)
                        this.transitioning = false
                        this.overlay.style.display = 'none'
                    })
                }
            }
            else
            {
                const x = this.x, y = this.y
                const desired = this.options.minimizeSize
                let delta
                if (this._lastMinimized)
                {
                    delta = { left: this._lastMinimized.x, top: this._lastMinimized.y }
                }
                else
                {
                    delta = { scaleX: (desired / this.win.offsetWidth), scaleY: (desired / this.win.offsetHeight) }
                }
                if (noAnimate)
                {
                    this.win.style.transform = 'scale(1) scale(' + (desired / this.win.offsetWidth) + ',' + (desired / this.win.offsetHeight) + ')'
                    this.win.style.left = delta.left + 'px'
                    this.win.style.top = delta.top + 'px'
                    this.minimized = { x, y }
                    this.emit('minimize', this)
                    this.overlay.style.display = 'block'
                }
                else
                {
                    this.transitioning = true
                    const ease = this.ease.add(this.win, delta)
                    ease.on('complete-scaleY', () =>
                    {
                        this.minimized = { x, y }
                        this.emit('minimize', this)
                        this.transitioning = false
                        this.overlay.style.display = 'block'
                    })
                }
            }
        }
    }

    /**
     * maximize the window
     */
    maximize()
    {
        if (this.wm._checkModal(this) && this.options.maximizable && !this.transitioning)
        {
            this.transitioning = true
            if (this.maximized)
            {
                const ease = this.ease.add(this.win, { left: this.maximized.x, top: this.maximized.y, width: this.maximized.width, height: this.maximized.height })
                ease.on('complete-height', () =>
                {
                    this.options.x = this.maximized.x
                    this.options.y = this.maximized.y
                    this.options.width = this.maximized.width
                    this.options.height = this.maximized.height
                    this.maximized = null
                    this.transitioning = false
                })
                this.buttons.maximize.style.backgroundImage = this.options.backgroundMaximizeButton
                this.emit('restore', this)
            }
            else
            {
                const x = this.x, y = this.y, width = this.win.offsetWidth, height = this.win.offsetHeight
                const ease = this.ease.add(this.win, { left: 0, top: 0, width: this.wm.overlay.offsetWidth, height: this.wm.overlay.offsetHeight })
                ease.on('complete-height', () =>
                {
                    this.maximized = { x, y, width, height }
                    this.transitioning = false
                })
                this.buttons.maximize.style.backgroundImage = this.options.backgroundRestoreButton
                this.emit('maximize', this)
            }
        }
    }

    /**
     * sends window to back of window-manager
     */
    sendToBack()
    {
        this.wm.sendToBack(this)
    }

    /**
     * send window to front of window-manager
     */
    sendToFront()
    {
        this.wm.sendToFront(this)
    }

    /**
     * save the state of the window
     * @return {object} data
     */
    save()
    {
        const data = {}
        const maximized = this.maximized
        if (maximized)
        {
            data.maximized = { x: maximized.x, y: maximized.y, width: maximized.width, height: maximized.height }
        }
        const minimized = this.minimized
        if (minimized)
        {
            data.minimized = { x: this.minimized.x, y: this.minimized.y }
        }
        const lastMinimized = this._lastMinimized
        if (lastMinimized)
        {
            data.lastMinimized = { x: lastMinimized.x, y: lastMinimized.y }
        }
        data.x = this.x
        data.y = this.y
        if (exists(this.options.width))
        {
            data.width = this.options.width
        }
        if (exists(this.options.height))
        {
            data.height = this.options.height
        }
        return data
    }

    /**
     * return the state of the window
     * @param {object} data from save()
     */
    load(data)
    {
        if (data.maximized)
        {
            if (!this.maximized)
            {
                this.maximize(true)
            }
            this.maximized = data.maximized
        }
        if (data.minimized)
        {
            if (!this.minimized)
            {
                this.minimize(true)
            }
            this.minimized = data.minimized
        }
        if (data.lastMinimized)
        {
            this._lastMinimized = data.lastMinimized
        }
        this.x = data.x
        this.y = data.y
        if (exists(data.width))
        {
            this.width = data.width
        }
        else
        {
            this.win.style.width = 'auto'
        }
        if (exists(data.height))
        {
            this.height = data.height
        }
        else
        {
            this.win.style.height = 'auto'
        }
    }

    /**
     * change title
     * @type {string}
     */
    get title() { return this._title }
    set title(value)
    {
        this.winTitle.innerText = value
    }

    /**
     * Fires when window is maximized
     * @event maximize
     * @type {Window}
     */

    /**
     * Fires when window is restored to normal after being maximized
     * @event maximize-restore
     * @type {Window}
     */

    /**
     * Fires when window is restored to normal after being minimized
     * @event minimize-restore
     * @type {Window}
     */

    /**
     * Fires when window opens
     * @event open
     * @type {Window}
     */

    /**
     * Fires when window gains focus
     * @event focus
     * @type {Window}
     */
    /**
     * Fires when window loses focus
     * @event blur
     * @type {Window}
     */
    /**
     * Fires when window closes
     * @event close
     * @type {Window}
     */

    /**
     * Fires when resize starts
     * @event resize-start
     * @type {Window}
     */

    /**
     * Fires after resize completes
     * @event resize-end
     * @type {Window}
     */

    /**
     * Fires during resizing
     * @event resize
     * @type {Window}
     */

    /**
     * Fires when move starts
     * @event move-start
     * @type {Window}
     */

    /**
     * Fires after move completes
     * @event move-end
     * @type {Window}
     */

    /**
     * Fires during move
     * @event move
     * @type {Window}
     */

    _createWindow()
    {
        this.win = html.create({
            parent: this.wm.win, styles: {
                'display': 'none',
                'border-radius': this.options.borderRadius,
                'user-select': 'none',
                'overflow': 'hidden',
                'position': 'absolute',
                'min-width': this.options.minWidth,
                'min-height': this.options.minHeight,
                'box-shadow': this.options.shadow,
                'background-color': this.options.backgroundColorWindow,
                'left': this.options.x,
                'top': this.options.y,
                'width': this.options.width,
                'height': this.options.height
            }
        })

        this.winBox = html.create({
            parent: this.win, styles: {
                'display': 'flex',
                'flex-direction': 'column',
                'width': '100%',
                'height': '100%',
                'min-height': this.options.minHeight
            }
        })
        this._createTitlebar()

        this.content = html.create({
            parent: this.winBox, type: 'section', styles: {
                'display': 'block',
                'flex': 1,
                'min-height': this.minHeight,
                'overflow-x': 'hidden',
                'overflow-y': 'auto'
            }
        })

        if (this.options.resizable)
        {
            this._createResize()
        }

        this.overlay = html.create({
            parent: this.win, styles: {
                'display': 'none',
                'position': 'absolute',
                'left': 0,
                'top': 0,
                'width': '100%',
                'height': '100%'
            }
        })
        this.overlay.addEventListener('mousedown', (e) => { this._downTitlebar(e); e.stopPropagation() })
        this.overlay.addEventListener('touchstart', (e) => { this._downTitlebar(e); e.stopPropagation() })
    }

    _downTitlebar(e)
    {
        if (!this.transitioning)
        {
            const event = this._convertMoveEvent(e)
            this._moving = this._toLocal({
                x: event.pageX,
                y: event.pageY
            })
            this.emit('move-start', this)
            this._moved = false
        }
    }

    _createTitlebar()
    {
        this.winTitlebar = html.create({
            parent: this.winBox, type: 'header', styles: {
                'user-select': 'none',
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'height': this.options.titlebarHeight,
                'min-height': this.options.titlebarHeight,
                'border': 0,
                'padding': '0 8px',
                'overflow': 'hidden',
            }
        })
        this.winTitle = html.create({
            parent: this.winTitlebar, type: 'span', html: this.options.title, styles: {
                'user-select': 'none',
                'flex': 1,
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'user-select': 'none',
                'cursor': 'default',
                'padding': 0,
                'padding-left': '8px',
                'margin': 0,
                'font-size': '16px',
                'font-weight': 400,
                'color': this.options.foregroundColorTitle
            }
        })
        this._createButtons()

        if (this.options.movable)
        {
            this.winTitlebar.addEventListener('mousedown', (e) => this._downTitlebar(e))
            this.winTitlebar.addEventListener('touchstart', (e) => this._downTitlebar(e))
        }
    }

    _createButtons()
    {
        this.winButtonGroup = html.create({
            parent: this.winTitlebar, styles: {
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center',
                'padding-left': '2px'
            }
        })
        const button = {
            'display': 'inline-block',
            'border': 0,
            'margin': 0,
            'margin-left': '5px',
            'padding': 0,
            'width': '12px',
            'height': '12px',
            'background-color': 'transparent',
            'background-size': 'cover',
            'background-repeat': 'no-repeat',
            'opacity': .7,
            'color': this.options.foregroundColorButton,
            'outline': 0
        }
        this.buttons = {}
        if (this.options.minimizable)
        {
            button.backgroundImage = this.options.backgroundMinimizeButton
            this.buttons.minimize = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.minimize, () => this.minimize())
        }
        if (this.options.maximizable)
        {
            button.backgroundImage = this.options.backgroundMaximizeButton
            this.buttons.maximize = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.maximize, () => this.maximize())
        }
        if (this.options.closable)
        {
            button.backgroundImage = this.options.backgroundCloseButton
            this.buttons.close = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.close, () => this.close())
        }
        for (let key in this.buttons)
        {
            const button = this.buttons[key]
            button.addEventListener('mousemove', () =>
            {
                button.style.opacity = 1
            })
            button.addEventListener('mouseout', () =>
            {
                button.style.opacity = 0.7
            })
        }
    }

    _createResize()
    {
        this.resizeEdge = html.create({
            parent: this.winBox, type: 'button', html: '&nbsp', styles: {
                'position': 'absolute',
                'bottom': 0,
                'right': '4px',
                'border': 0,
                'margin': 0,
                'padding': 0,
                'cursor': 'se-resize',
                'user-select': 'none',
                'background': this.options.backgroundResize,
                'height': '15px',
                'width': '10px'
            }
        })
        const down = (e) =>
        {
            if (this.wm._checkModal(this))
            {
                const event = this._convertMoveEvent(e)
                const width = this.width || this.win.offsetWidth
                const height = this.height || this.win.offsetHeight
                this._resizing = {
                    width: width - event.pageX,
                    height: height - event.pageY
                }
                this.emit('resize-start')
                e.preventDefault()
            }
        }
        this.resizeEdge.addEventListener('mousedown', down)
        this.resizeEdge.addEventListener('touchstart', down)
    }

    _move(e)
    {
        if (this.wm._checkModal(this))
        {
            const event = this._convertMoveEvent(e)

            if (!this._isTouchEvent(e) && e.which !== 1)
            {
                this._moving && this._stopMove()
                this._resizing && this._stopResize()
            }
            if (this._moving)
            {
                this.move(
                    event.pageX - this._moving.x,
                    event.pageY - this._moving.y
                )
                if (this.minimized)
                {
                    e.preventDefault()
                    this._lastMinimized = { x: this.win.offsetLeft, y: this.win.offsetTop }
                    this._moved = true
                }
                this.emit('move', this)
                e.preventDefault()
            }

            if (this._resizing)
            {
                this.resize(
                    event.pageX + this._resizing.width,
                    event.pageY + this._resizing.height
                )
                this.maximized = null
                this.emit('resize', this)
                e.preventDefault()
            }
        }
    }

    _up()
    {
        if (this._moving)
        {
            if (this.minimized)
            {
                if (!this._moved)
                {
                    this.minimize()
                }
            }
            this._stopMove()
        }
        this._resizing && this._stopResize()
    }

    _listeners()
    {
        this.win.addEventListener('mousedown', () => this.focus())
        this.win.addEventListener('touchstart', () => this.focus())
    }

    _stopMove()
    {
        this._moving = null
        this.emit('move-end')
    }

    _stopResize()
    {
        this._restore = this._resizing = null
        this.emit('resize-end')
    }

    _isTouchEvent(e)
    {
        return !!window.TouchEvent && (e instanceof window.TouchEvent)
    }

    _convertMoveEvent(e)
    {
        return this._isTouchEvent(e) ? e.changedTouches[0] : e
    }

    _toLocal(coord)
    {
        return {
            x: coord.x - this.x,
            y: coord.y - this.y
        }
    }

    get z() { return parseInt(this.win.style.zIndex) }
    set z(value) { this.win.style.zIndex = value }
}
},{"../../dom-ease":1,"./html":21,"clicked":18,"eventemitter3":19,"exists":20}]},{},[16]);
