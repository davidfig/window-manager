(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const FPS = require('yy-fps')

const WM = require('../src/window-manager')
const html = require('../src/html')

const menu = require('./menu')

// create a window manager and change some of the default styles
const wm = new WM({
    borderRadius: '10px',
    snap: { screen: true, windows: true, spacing: 5 }
})

window.onload = () =>
{
    // creates test windows
    test()
    test2()
    test3()
    test4()
    test5()
    test7()
    // menu(wm)
    update()
}

const top = 10

function test()
{
    const test = wm.createWindow({ x: 10, y: top, titlebar: false, title: 'Test Window', resizable: false, maximizable: false, minimizable: false, titleCenter: true, closable: false })
    test.content.style.padding = '1em'
    test.content.innerHTML = 'This is a test window.'
    test.open()
}

function test2()
{
    const test = wm.createWindow({
        width: 300, height: 150,
        x: 100, y: 100,
        backgroundColorWindow: 'rgb(255,200,255)',
        titlebarHeight: '22px',
        backgroundColorTitlebarActive: 'green',
        backgroundColorTitlebarInactive: 'purple'
    })
    test.content.style.padding = '0.5em'
    test.content.innerHTML = 'This is a pink test window.<br><br>Check out the fancy title bar for other style tests.<br><br><br>And scrolling!!!'
    test.open()
}

function test3()
{
    // create a test window with a button to create a modal window
    const test = wm.createWindow({ x: 300, y: 400, width: 350, title: 'This is one fancy demo!' })
    test.content.style.padding = '1em'
    html({ parent: test.content, html: 'OK. It isn\'t that fancy, but it shows off some of the functionality of this library.<br><br>Please excuse the mess. I do NOT keep my desktop this messy, but I thought it made for a good demo.' })
    const div = html({ parent: test.content, styles: { textAlign: 'center', marginTop: '1em' } })
    const button = html({ parent: div, type: 'button', html: 'open modal window' })
    button.onclick = () =>
    {
        // create a modal window
        const modal = wm.createWindow({
            modal: true,
            width: 200,
            title: 'modal window',
            minimizable: false,
            maximizable: false
        })
        const div = html({ parent: modal.content, styles: { 'margin': '0.5em' } })
        html({ parent: div, html: 'This needs to be closed before using other windows.' })
        const buttonDiv = html({ parent: div, styles: { 'text-align': 'center', margin: '1em' } })
        const button = html({ parent: buttonDiv, type: 'button', html: 'close modal' })
        button.onclick = () =>
        {
            modal.close()
        }
        modal.open()

        // center window in test
        modal.center(test)
    }
    test.open()
}

function test4()
{
    const test = wm.createWindow({ x: 300, y: top, title: 'My wife\'s art gallery!' })
    test.content.innerHTML = '<iframe width="560" height="315" src="https://www.youtube.com/embed/-slAp_gVa70" frameborder="0" allow="encrypted-media" allowfullscreen></iframe>'
    test.open()
    test.sendToBack()
}

function test5()
{
    const test = wm.createWindow({ x: 20, y: 600, title: 'window save/load' })
    html({ parent: test.content, html: 'Save the windows, and then move windows around and load them.', styles: { margin: '0.5em' } })
    const buttons = html({ parent: test.content, styles: { 'text-align': 'center' } })
    const save = html({ parent: buttons, html: 'save window state', type: 'button', styles: { margin: '1em', background: 'rgb(200,255,200)' } })
    const load = html({ parent: buttons, html: 'load window state', type: 'button', styles: { margin: '1em', background: 'rgb(255,200,200)' } })
    test.open()
    let data
    save.onclick = () => data = wm.save()
    load.onclick = () => { if (data) wm.load(data) }
}

function test7()
{
    const test = wm.createWindow({ x: 700, y: 40, width: 400, height: 300, title: 'API documentation' })
    test.content.innerHTML = '<iframe width="100%" height="100%" src="https://davidfig.github.io/window-manager/jsdoc/"></iframe>'
    test.open()
}

const wallpaper = html({ parent: wm.overlay, styles: { 'text-align': 'center', 'margin-top': '50%', color: 'white' } })
wallpaper.innerHTML = 'You can also use the background as wallpaper or another window surface.'

const fps = new FPS()
function update()
{
    fps.frame(false, true)
    requestAnimationFrame(update)
}
},{"../src/html":17,"../src/window-manager":19,"./menu":2,"yy-fps":11}],2:[function(require,module,exports){
const Menu = require('yy-menu')
const Item = Menu.MenuItem

function menu(wm)
{
    const file = new Menu()
    file.append(new Item({ label: '&New Window', accelerator: 'ctrl+m', click: () => newWindow(wm) }))

    const windows = new Menu()
    for (let i = 0; i < wm.windows.length; i++)
    {
        windows.append(new Item({
            type: 'checkbox', label: 'Window ' + (i < 10 ? '&' : '') + i, accelerator: i < 10 ? 'ctrl+' + i : null, checked: true, click: (e, item) =>
            {
                if (item.checked)
                {
                    wm.windows[i].open()
                }
                else
                {
                    wm.windows[i].close()
                }
            }
        }))
    }
    const about = new Menu()
    about.append(new Item({ label: 'simple-&window-manager', click: () => aboutWM()}))
    about.append(new Item({ label: 'yy-menu', click: () => aboutMenu() }))

    const main = new Menu()
    main.append(new Item({ label: '&File', submenu: file }))
    main.append(new Item({ label: '&Windows', submenu: windows }))
    main.append(new Item({ label: 'About', submenu: about }))
    Menu.setApplicationMenu(main)
}

function newWindow()
{

}

function aboutWM()
{

}

function aboutMenu()
{

}

module.exports = menu
},{"yy-menu":15}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');
var Penner = require('penner');
var exists = require('exists');

var Ease = require('./ease');

/**
 * Manages all eases
 * @extends EventEmitter
 * @example
 * var Ease = require('dom-ease');
 * var ease = new Ease({ duration: 3000, ease: 'easeInOutSine' });
 *
 * var test = document.getElementById('test')
 * ease.add(test, { left: 20, top: 15, opacity: 0.25 }, { repeat: true, reverse: true })
 */

var DomEase = function (_EventEmitter) {
    _inherits(DomEase, _EventEmitter);

    /**
     * @param {object} [options]
     * @param {number} [options.duration=1000] default duration
     * @param {(string|function)} [options.ease=penner.linear] default ease
     * @param {(string|function)} [options.autostart=true]
     * @param {boolean} [options.pauseOnBlur] pause timer on blur, resume on focus
     * @fires DomEase#each
     * @fires DomEase#complete
     */
    function DomEase(options) {
        _classCallCheck(this, DomEase);

        var _this = _possibleConstructorReturn(this, (DomEase.__proto__ || Object.getPrototypeOf(DomEase)).call(this));

        _this.options = options || {};
        _this.options.duration = _this.options.duration || 1000;
        _this.options.ease = _this.options.ease || Penner.linear;
        _this.list = [];
        _this.empty = true;
        if (!_this.options.autostart) {
            _this.start();
        }
        if (_this.options.pauseOnBlur) {
            window.addEventListener('blur', function () {
                return _this.blur();
            });
            window.addEventListener('focus', function () {
                return _this.focus();
            });
        }
        return _this;
    }

    /**
     * start animation loop (automatically called unless options.autostart=false)
     */


    _createClass(DomEase, [{
        key: 'start',
        value: function start() {
            if (!this._requested) {
                this._requested = true;
                this.loop();
                this.running = true;
            }
        }
    }, {
        key: 'blur',
        value: function blur() {
            if (this.running) {
                this.stop();
                this.running = true;
            }
        }
    }, {
        key: 'focus',
        value: function focus() {
            if (this.running) {
                this.start();
            }
        }
    }, {
        key: 'loop',
        value: function loop(time) {
            var _this2 = this;

            if (time) {
                var elapsed = this._last ? time - this._last : 0;
                this.update(elapsed);
            }
            this._last = time;
            this._requestId = window.requestAnimationFrame(function (time) {
                return _this2.loop(time);
            });
        }

        /**
         * stop animation loop
         */

    }, {
        key: 'stop',
        value: function stop() {
            if (this._requested) {
                window.cancelAnimationFrame(this._requestId);
                this._requested = false;
                this.running = false;
            }
        }

        /**
         * add eases
         * @param {HTMLElement} element
         * @param {object} params
         * @param {number} [params.left] in px
         * @param {number} [params.top] in px
         * @param {number} [params.width] in px
         * @param {number} [params.height] in px
         * @param {number} [params.scale]
         * @param {number} [params.scaleX]
         * @param {number} [params.scaleY]
         * @param {number} [params.opacity]
         * @param {(color|color[])} [params.color]
         * @param {(color|color[])} [params.backgroundColor]
         * @param {object} [options]
         * @param {number} [options.duration]
         * @param {(string|function)} [options.ease]
         * @param {(boolean|number)} [options.repeat]
         * @param {boolean} [options.reverse]
         * @returns {Ease}
         */

    }, {
        key: 'add',
        value: function add(element, params, options) {
            // set up default options
            options = options || {};
            options.duration = exists(options.duration) ? options.duration : this.options.duration;
            options.ease = options.ease || this.options.ease;
            if (typeof options.ease === 'string') {
                options.ease = Penner[options.ease];
            }
            var ease = new Ease(element, params, options);
            this.list.push(ease);
            return ease;
        }

        /**
         * remove all eases on element
         * @param {HTMLElement} element
         */

    }, {
        key: 'removeObjectEases',
        value: function removeObjectEases(element) {
            var list = this.list;
            for (var i = 0, _i = list.length; i < _i; i++) {
                var ease = list[i];
                if (ease.element === element) {
                    list.splice(i, 1);
                    i--;
                    _i--;
                }
            }
        }

        /**
         * remove eases using Ease object returned by add()
         * @param {Ease} ease
         */

    }, {
        key: 'remove',
        value: function remove(ease) {
            var list = this.list;
            for (var i = 0, _i = list.length; i < _i; i++) {
                if (list[i] === ease) {
                    list.splice(i, 1);
                    return;
                }
            }
        }

        /**
         * remove all eases
         */

    }, {
        key: 'removeAll',
        value: function removeAll() {
            this.list = [];
        }

        /**
         * update frame; this is called automatically if start() is used
         * @param {number} elapsed time in ms
         */

    }, {
        key: 'update',
        value: function update(elapsed) {
            for (var i = 0, _i = this.list.length; i < _i; i++) {
                if (this.list[i].update(elapsed)) {
                    this.list.splice(i, 1);
                    i--;
                    _i--;
                }
            }
            this.emit('each', this);
            if (!this.empty && this.list.length === 0) {
                this.emit('done', this);
                this.empty = true;
            }
        }

        /**
         * number of eases
         * @returns {number}
         */

    }, {
        key: 'getCount',
        value: function getCount() {
            return this.list.length;
        }
    }]);

    return DomEase;
}(EventEmitter);

/**
 * fires when there are no more animations for a DOM element
 * @event DomEase#complete
 * @type {DomEase}
 */

/**
 * fires on each loop for a DOM element where there are animations
 * @event DomEase#each
 * @type {DomEase}
 */

module.exports = DomEase;

},{"./ease":5,"eventemitter3":6,"exists":7,"penner":8}],5:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');
var exists = require('exists');

var Ease = function (_EventEmitter) {
    _inherits(Ease, _EventEmitter);

    /**
     * Ease class returned by DomEase.add()
     * @extends EventEmitter
     * @param {HTMLElement} element
     * @param {object} params
     * @param {number} [params.left] in px
     * @param {number} [params.top] in px
     * @param {number} [params.width] in px
     * @param {number} [params.height] in px
     * @param {number} [params.scale]
     * @param {number} [params.scaleX]
     * @param {number} [params.scaleY]
     * @param {number} [params.opacity]
     * @param {(color|color[])} [params.color]
     * @param {(color|color[])} [params.backgroundColor]
     * @param {object} [options]
     * @param {number} [options.duration]
     * @param {(string|function)} [options.ease]
     * @param {(boolean|number)} [options.repeat]
     * @param {boolean} [options.reverse]
     * @param {number} [options.wait]
     * @returns {Ease}
     * @fires Ease#each
     * @fires Ease#complete
     * @fires Ease#loop
     * @hideconstructor
     */
    function Ease(element, params, options) {
        _classCallCheck(this, Ease);

        var _this = _possibleConstructorReturn(this, (Ease.__proto__ || Object.getPrototypeOf(Ease)).call(this));

        _this.element = element;
        _this.list = [];
        _this.time = 0;
        _this.duration = options.duration;
        _this.ease = options.ease;
        _this.repeat = options.repeat;
        _this.reverse = options.reverse;
        _this.wait = options.wait || 0;
        for (var entry in params) {
            switch (entry) {
                case 'left':
                    _this.numberStart(entry, element.offsetLeft, params[entry], 'px');
                    break;

                case 'top':
                    _this.numberStart(entry, element.offsetTop, params[entry], 'px');
                    break;

                case 'color':
                    _this.colorStart('color', element.style.color, params[entry]);
                    break;

                case 'backgroundColor':
                    _this.colorStart('backgroundColor', element.style.backgroundColor, params[entry]);
                    break;

                case 'scale':
                    _this.transformStart(entry, params[entry]);
                    break;

                case 'scaleX':
                    _this.transformStart(entry, params[entry]);
                    break;

                case 'scaleY':
                    _this.transformStart(entry, params[entry]);
                    break;

                case 'opacity':
                    _this.numberStart(entry, exists(element.style.opacity) ? parseFloat(element.style.opacity) : 1, params[entry]);
                    break;

                case 'width':
                    _this.numberStart(entry, element.offsetWidth, params[entry], 'px');
                    break;

                case 'height':
                    _this.numberStart(entry, element.offsetHeight, params[entry], 'px');
                    break;

                default:
                    console.warn(entry + ' not setup for animation in dom-ease.');
            }
        }
        return _this;
    }

    /**
     * create number entry
     * @private
     * @param {string} entry
     * @param {number} start
     * @param {number} to
     * @param {string} [units]
     */


    _createClass(Ease, [{
        key: 'numberStart',
        value: function numberStart(entry, start, to, units) {
            var ease = { type: 'number', entry: entry, to: to, start: start, delta: to - start, units: units || '' };
            this.list.push(ease);
        }
    }, {
        key: 'numberUpdate',
        value: function numberUpdate(ease, percent) {
            this.element.style[ease.entry] = ease.start + ease.delta * percent + ease.units;
        }

        /**
         * reverse number and transform
         * @private
         * @param {object} ease
         */

    }, {
        key: 'easeReverse',
        value: function easeReverse(ease) {
            var swap = ease.to;
            ease.to = ease.start;
            ease.start = swap;
            ease.delta = -ease.delta;
        }
    }, {
        key: 'transformStart',
        value: function transformStart(entry, to) {
            var ease = { type: 'transform', entry: entry, to: to };
            if (!this.transforms) {
                this.readTransform();
            }
            var transforms = this.transforms;
            var found = void 0;
            for (var i = 0, _i = transforms.length; i < _i; i++) {
                var transform = transforms[i];
                if (transform.name === entry) {
                    switch (entry) {
                        case 'scale':case 'scaleX':case 'scaleY':
                            ease.start = parseFloat(transform.values);
                            break;
                    }
                    found = true;
                    break;
                }
            }
            if (!found) {
                switch (entry) {
                    case 'scale':case 'scaleX':case 'scaleY':
                        ease.start = 1;
                }
            }
            ease.delta = to - ease.start;
            this.list.push(ease);
        }
    }, {
        key: 'transformUpdate',
        value: function transformUpdate(ease, percent) {
            if (!this.changedTransform) {
                this.readTransform();
                this.changedTransform = true;
            }
            var name = ease.entry;
            var transforms = this.transforms;
            var values = ease.start + ease.delta * percent;
            for (var i = 0, _i = transforms.length; i < _i; i++) {
                if (transforms[i].name === name) {
                    transforms[i].values = values;
                    return;
                }
            }
            this.transforms.push({ name: name, values: values });
        }
    }, {
        key: 'colorUpdate',
        value: function colorUpdate(ease) {
            var elementStyle = this.element.style;
            var style = ease.style;
            var colors = ease.colors;
            var i = Math.floor(this.time / ease.interval);
            var color = colors[i];
            if (elementStyle[style] !== color) {
                elementStyle[style] = colors[i];
            }
        }
    }, {
        key: 'colorReverse',
        value: function colorReverse(ease) {
            var reverse = [];
            var colors = ease.colors;
            for (var color in colors) {
                reverse.unshift(colors[color]);
            }
            reverse.push(reverse.shift());
            ease.colors = reverse;
        }
    }, {
        key: 'colorStart',
        value: function colorStart(style, original, colors) {
            var ease = { type: 'color', style: style };
            if (Array.isArray(colors)) {
                ease.colors = colors;
            } else {
                ease.colors = [colors];
            }
            colors.push(original);
            ease.interval = this.duration / colors.length;
            this.list.push(ease);
        }
    }, {
        key: 'update',
        value: function update(elapsed) {
            if (this.wait) {
                this.wait -= elapsed;
                if (this.wait < 0) {
                    elapsed = -this.wait;
                    this.wait = 0;
                } else {
                    return;
                }
            }
            this.changedTransform = false;
            var list = this.list;
            var leftover = null;
            this.time += elapsed;
            if (this.time >= this.duration) {
                leftover = this.time - this.duration;
                this.time -= leftover;
            }
            var percent = this.ease(this.time, 0, 1, this.duration);
            for (var i = 0, _i = list.length; i < _i; i++) {
                var ease = list[i];
                switch (ease.type) {
                    case 'number':
                        this.numberUpdate(ease, percent);
                        break;

                    case 'color':
                        this.colorUpdate(ease);
                        break;

                    case 'transform':
                        this.transformUpdate(ease, percent);
                        break;
                }
            }
            if (this.changedTransform) {
                this.writeTransform();
            }
            this.emit('each', this);

            // handle end of duration
            if (leftover !== null) {
                if (this.reverse) {
                    this.reverseEases();
                    this.time = leftover;
                    this.emit('loop', this);
                    if (!this.repeat) {
                        this.reverse = false;
                    } else if (this.repeat !== true) {
                        this.repeat--;
                    }
                } else if (this.repeat) {
                    this.emit('loop', this);
                    this.time = leftover;
                    if (this.repeat !== true) {
                        this.repeat--;
                    }
                } else {
                    this.emit('complete', this);
                    return true;
                }
            }
        }
    }, {
        key: 'reverseEases',
        value: function reverseEases() {
            var list = this.list;
            for (var i = 0, _i = list.length; i < _i; i++) {
                var ease = list[i];
                if (ease.type === 'color') {
                    this.colorReverse(ease);
                } else {
                    this.easeReverse(ease);
                }
            }
        }
    }, {
        key: 'readTransform',
        value: function readTransform() {
            this.transforms = [];
            var transform = this.element.style.transform;
            var inside = void 0,
                name = '',
                values = void 0;
            for (var i = 0, _i = transform.length; i < _i; i++) {
                var letter = transform[i];
                if (inside) {
                    if (letter === ')') {
                        inside = false;
                        this.transforms.push({ name: name, values: values });
                        name = '';
                    } else {
                        values += letter;
                    }
                } else {
                    if (letter === '(') {
                        values = '';
                        inside = true;
                    } else if (letter !== ' ') {
                        name += letter;
                    }
                }
            }
        }
    }, {
        key: 'writeTransform',
        value: function writeTransform() {
            var transforms = this.transforms;
            var s = '';
            for (var i = 0, _i = transforms.length; i < _i; i++) {
                var transform = transforms[i];
                s += transform.name + '(' + transform.values + ')';
            }
            this.element.style.transform = s;
        }
    }]);

    return Ease;
}(EventEmitter);

/**
 * fires when eases are complete
 * @event Ease#complete
 * @type {Ease}
 */

/**
 * fires on each loop while eases are running
 * @event Ease#each
 * @type {Ease}
 */

/**
 * fires when eases repeat or reverse
 * @event Ease#loop
 * @type {Ease}
 */

module.exports = Ease;

},{"eventemitter3":6,"exists":7}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
module.exports = exists;

module.exports.allExist = allExist;

function exists (v) {
  return v !== null && v !== undefined;
}

function allExist (/* vals */) {
  var vals = Array.prototype.slice.call(arguments);
  return vals.every(exists);
}
},{}],8:[function(require,module,exports){

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

},{}],9:[function(require,module,exports){
// TinyColor v1.4.1
// https://github.com/bgrins/TinyColor
// Brian Grinstead, MIT License

(function(Math) {

var trimLeft = /^\s+/,
    trimRight = /\s+$/,
    tinyCounter = 0,
    mathRound = Math.round,
    mathMin = Math.min,
    mathMax = Math.max,
    mathRandom = Math.random;

function tinycolor (color, opts) {

    color = (color) ? color : '';
    opts = opts || { };

    // If input is already a tinycolor, return itself
    if (color instanceof tinycolor) {
       return color;
    }
    // If we are called as a function, call using new instead
    if (!(this instanceof tinycolor)) {
        return new tinycolor(color, opts);
    }

    var rgb = inputToRGB(color);
    this._originalInput = color,
    this._r = rgb.r,
    this._g = rgb.g,
    this._b = rgb.b,
    this._a = rgb.a,
    this._roundA = mathRound(100*this._a) / 100,
    this._format = opts.format || rgb.format;
    this._gradientType = opts.gradientType;

    // Don't let the range of [0,255] come back in [0,1].
    // Potentially lose a little bit of precision here, but will fix issues where
    // .5 gets interpreted as half of the total, instead of half of 1
    // If it was supposed to be 128, this was already taken care of by `inputToRgb`
    if (this._r < 1) { this._r = mathRound(this._r); }
    if (this._g < 1) { this._g = mathRound(this._g); }
    if (this._b < 1) { this._b = mathRound(this._b); }

    this._ok = rgb.ok;
    this._tc_id = tinyCounter++;
}

tinycolor.prototype = {
    isDark: function() {
        return this.getBrightness() < 128;
    },
    isLight: function() {
        return !this.isDark();
    },
    isValid: function() {
        return this._ok;
    },
    getOriginalInput: function() {
      return this._originalInput;
    },
    getFormat: function() {
        return this._format;
    },
    getAlpha: function() {
        return this._a;
    },
    getBrightness: function() {
        //http://www.w3.org/TR/AERT#color-contrast
        var rgb = this.toRgb();
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    },
    getLuminance: function() {
        //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
        var rgb = this.toRgb();
        var RsRGB, GsRGB, BsRGB, R, G, B;
        RsRGB = rgb.r/255;
        GsRGB = rgb.g/255;
        BsRGB = rgb.b/255;

        if (RsRGB <= 0.03928) {R = RsRGB / 12.92;} else {R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);}
        if (GsRGB <= 0.03928) {G = GsRGB / 12.92;} else {G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);}
        if (BsRGB <= 0.03928) {B = BsRGB / 12.92;} else {B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);}
        return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
    },
    setAlpha: function(value) {
        this._a = boundAlpha(value);
        this._roundA = mathRound(100*this._a) / 100;
        return this;
    },
    toHsv: function() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
    },
    toHsvString: function() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
        return (this._a == 1) ?
          "hsv("  + h + ", " + s + "%, " + v + "%)" :
          "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
    },
    toHsl: function() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
    },
    toHslString: function() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
        return (this._a == 1) ?
          "hsl("  + h + ", " + s + "%, " + l + "%)" :
          "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
    },
    toHex: function(allow3Char) {
        return rgbToHex(this._r, this._g, this._b, allow3Char);
    },
    toHexString: function(allow3Char) {
        return '#' + this.toHex(allow3Char);
    },
    toHex8: function(allow4Char) {
        return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
    },
    toHex8String: function(allow4Char) {
        return '#' + this.toHex8(allow4Char);
    },
    toRgb: function() {
        return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
    },
    toRgbString: function() {
        return (this._a == 1) ?
          "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
          "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
    },
    toPercentageRgb: function() {
        return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
    },
    toPercentageRgbString: function() {
        return (this._a == 1) ?
          "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
          "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
    },
    toName: function() {
        if (this._a === 0) {
            return "transparent";
        }

        if (this._a < 1) {
            return false;
        }

        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
    },
    toFilter: function(secondColor) {
        var hex8String = '#' + rgbaToArgbHex(this._r, this._g, this._b, this._a);
        var secondHex8String = hex8String;
        var gradientType = this._gradientType ? "GradientType = 1, " : "";

        if (secondColor) {
            var s = tinycolor(secondColor);
            secondHex8String = '#' + rgbaToArgbHex(s._r, s._g, s._b, s._a);
        }

        return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
    },
    toString: function(format) {
        var formatSet = !!format;
        format = format || this._format;

        var formattedString = false;
        var hasAlpha = this._a < 1 && this._a >= 0;
        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");

        if (needsAlphaFormat) {
            // Special case for "transparent", all other non-alpha formats
            // will return rgba when there is transparency.
            if (format === "name" && this._a === 0) {
                return this.toName();
            }
            return this.toRgbString();
        }
        if (format === "rgb") {
            formattedString = this.toRgbString();
        }
        if (format === "prgb") {
            formattedString = this.toPercentageRgbString();
        }
        if (format === "hex" || format === "hex6") {
            formattedString = this.toHexString();
        }
        if (format === "hex3") {
            formattedString = this.toHexString(true);
        }
        if (format === "hex4") {
            formattedString = this.toHex8String(true);
        }
        if (format === "hex8") {
            formattedString = this.toHex8String();
        }
        if (format === "name") {
            formattedString = this.toName();
        }
        if (format === "hsl") {
            formattedString = this.toHslString();
        }
        if (format === "hsv") {
            formattedString = this.toHsvString();
        }

        return formattedString || this.toHexString();
    },
    clone: function() {
        return tinycolor(this.toString());
    },

    _applyModification: function(fn, args) {
        var color = fn.apply(null, [this].concat([].slice.call(args)));
        this._r = color._r;
        this._g = color._g;
        this._b = color._b;
        this.setAlpha(color._a);
        return this;
    },
    lighten: function() {
        return this._applyModification(lighten, arguments);
    },
    brighten: function() {
        return this._applyModification(brighten, arguments);
    },
    darken: function() {
        return this._applyModification(darken, arguments);
    },
    desaturate: function() {
        return this._applyModification(desaturate, arguments);
    },
    saturate: function() {
        return this._applyModification(saturate, arguments);
    },
    greyscale: function() {
        return this._applyModification(greyscale, arguments);
    },
    spin: function() {
        return this._applyModification(spin, arguments);
    },

    _applyCombination: function(fn, args) {
        return fn.apply(null, [this].concat([].slice.call(args)));
    },
    analogous: function() {
        return this._applyCombination(analogous, arguments);
    },
    complement: function() {
        return this._applyCombination(complement, arguments);
    },
    monochromatic: function() {
        return this._applyCombination(monochromatic, arguments);
    },
    splitcomplement: function() {
        return this._applyCombination(splitcomplement, arguments);
    },
    triad: function() {
        return this._applyCombination(triad, arguments);
    },
    tetrad: function() {
        return this._applyCombination(tetrad, arguments);
    }
};

// If input is an object, force 1 into "1.0" to handle ratios properly
// String input requires "1.0" as input, so 1 will be treated as 1
tinycolor.fromRatio = function(color, opts) {
    if (typeof color == "object") {
        var newColor = {};
        for (var i in color) {
            if (color.hasOwnProperty(i)) {
                if (i === "a") {
                    newColor[i] = color[i];
                }
                else {
                    newColor[i] = convertToPercentage(color[i]);
                }
            }
        }
        color = newColor;
    }

    return tinycolor(color, opts);
};

// Given a string or object, convert that input to RGB
// Possible string inputs:
//
//     "red"
//     "#f00" or "f00"
//     "#ff0000" or "ff0000"
//     "#ff000000" or "ff000000"
//     "rgb 255 0 0" or "rgb (255, 0, 0)"
//     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
//     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
//     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
//     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
//     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
//     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
//
function inputToRGB(color) {

    var rgb = { r: 0, g: 0, b: 0 };
    var a = 1;
    var s = null;
    var v = null;
    var l = null;
    var ok = false;
    var format = false;

    if (typeof color == "string") {
        color = stringInputToObject(color);
    }

    if (typeof color == "object") {
        if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
            rgb = rgbToRgb(color.r, color.g, color.b);
            ok = true;
            format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
        }
        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
            s = convertToPercentage(color.s);
            v = convertToPercentage(color.v);
            rgb = hsvToRgb(color.h, s, v);
            ok = true;
            format = "hsv";
        }
        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
            s = convertToPercentage(color.s);
            l = convertToPercentage(color.l);
            rgb = hslToRgb(color.h, s, l);
            ok = true;
            format = "hsl";
        }

        if (color.hasOwnProperty("a")) {
            a = color.a;
        }
    }

    a = boundAlpha(a);

    return {
        ok: ok,
        format: color.format || format,
        r: mathMin(255, mathMax(rgb.r, 0)),
        g: mathMin(255, mathMax(rgb.g, 0)),
        b: mathMin(255, mathMax(rgb.b, 0)),
        a: a
    };
}


// Conversion Functions
// --------------------

// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

// `rgbToRgb`
// Handle bounds / percentage checking to conform to CSS color spec
// <http://www.w3.org/TR/css3-color/>
// *Assumes:* r, g, b in [0, 255] or [0, 1]
// *Returns:* { r, g, b } in [0, 255]
function rgbToRgb(r, g, b){
    return {
        r: bound01(r, 255) * 255,
        g: bound01(g, 255) * 255,
        b: bound01(b, 255) * 255
    };
}

// `rgbToHsl`
// Converts an RGB color value to HSL.
// *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
// *Returns:* { h, s, l } in [0,1]
function rgbToHsl(r, g, b) {

    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return { h: h, s: s, l: l };
}

// `hslToRgb`
// Converts an HSL color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
function hslToRgb(h, s, l) {
    var r, g, b;

    h = bound01(h, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);

    function hue2rgb(p, q, t) {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    if(s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// `rgbToHsv`
// Converts an RGB color value to HSV
// *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
// *Returns:* { h, s, v } in [0,1]
function rgbToHsv(r, g, b) {

    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max === 0 ? 0 : d / max;

    if(max == min) {
        h = 0; // achromatic
    }
    else {
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h, s: s, v: v };
}

// `hsvToRgb`
// Converts an HSV color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
 function hsvToRgb(h, s, v) {

    h = bound01(h, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);

    var i = Math.floor(h),
        f = h - i,
        p = v * (1 - s),
        q = v * (1 - f * s),
        t = v * (1 - (1 - f) * s),
        mod = i % 6,
        r = [v, q, p, p, t, v][mod],
        g = [t, v, v, q, p, p][mod],
        b = [p, p, t, v, v, q][mod];

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// `rgbToHex`
// Converts an RGB color to hex
// Assumes r, g, and b are contained in the set [0, 255]
// Returns a 3 or 6 character hex
function rgbToHex(r, g, b, allow3Char) {

    var hex = [
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16))
    ];

    // Return a 3 character hex if possible
    if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
    }

    return hex.join("");
}

// `rgbaToHex`
// Converts an RGBA color plus alpha transparency to hex
// Assumes r, g, b are contained in the set [0, 255] and
// a in [0, 1]. Returns a 4 or 8 character rgba hex
function rgbaToHex(r, g, b, a, allow4Char) {

    var hex = [
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16)),
        pad2(convertDecimalToHex(a))
    ];

    // Return a 4 character hex if possible
    if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
    }

    return hex.join("");
}

// `rgbaToArgbHex`
// Converts an RGBA color to an ARGB Hex8 string
// Rarely used, but required for "toFilter()"
function rgbaToArgbHex(r, g, b, a) {

    var hex = [
        pad2(convertDecimalToHex(a)),
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16))
    ];

    return hex.join("");
}

// `equals`
// Can be called with any tinycolor input
tinycolor.equals = function (color1, color2) {
    if (!color1 || !color2) { return false; }
    return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
};

tinycolor.random = function() {
    return tinycolor.fromRatio({
        r: mathRandom(),
        g: mathRandom(),
        b: mathRandom()
    });
};


// Modification Functions
// ----------------------
// Thanks to less.js for some of the basics here
// <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

function desaturate(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.s -= amount / 100;
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
}

function saturate(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.s += amount / 100;
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
}

function greyscale(color) {
    return tinycolor(color).desaturate(100);
}

function lighten (color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.l += amount / 100;
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
}

function brighten(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var rgb = tinycolor(color).toRgb();
    rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
    rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
    rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
    return tinycolor(rgb);
}

function darken (color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.l -= amount / 100;
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
}

// Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
// Values outside of this range will be wrapped into this range.
function spin(color, amount) {
    var hsl = tinycolor(color).toHsl();
    var hue = (hsl.h + amount) % 360;
    hsl.h = hue < 0 ? 360 + hue : hue;
    return tinycolor(hsl);
}

// Combination Functions
// ---------------------
// Thanks to jQuery xColor for some of the ideas behind these
// <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

function complement(color) {
    var hsl = tinycolor(color).toHsl();
    hsl.h = (hsl.h + 180) % 360;
    return tinycolor(hsl);
}

function triad(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
    ];
}

function tetrad(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
    ];
}

function splitcomplement(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
        tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
    ];
}

function analogous(color, results, slices) {
    results = results || 6;
    slices = slices || 30;

    var hsl = tinycolor(color).toHsl();
    var part = 360 / slices;
    var ret = [tinycolor(color)];

    for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
        hsl.h = (hsl.h + part) % 360;
        ret.push(tinycolor(hsl));
    }
    return ret;
}

function monochromatic(color, results) {
    results = results || 6;
    var hsv = tinycolor(color).toHsv();
    var h = hsv.h, s = hsv.s, v = hsv.v;
    var ret = [];
    var modification = 1 / results;

    while (results--) {
        ret.push(tinycolor({ h: h, s: s, v: v}));
        v = (v + modification) % 1;
    }

    return ret;
}

// Utility Functions
// ---------------------

tinycolor.mix = function(color1, color2, amount) {
    amount = (amount === 0) ? 0 : (amount || 50);

    var rgb1 = tinycolor(color1).toRgb();
    var rgb2 = tinycolor(color2).toRgb();

    var p = amount / 100;

    var rgba = {
        r: ((rgb2.r - rgb1.r) * p) + rgb1.r,
        g: ((rgb2.g - rgb1.g) * p) + rgb1.g,
        b: ((rgb2.b - rgb1.b) * p) + rgb1.b,
        a: ((rgb2.a - rgb1.a) * p) + rgb1.a
    };

    return tinycolor(rgba);
};


// Readability Functions
// ---------------------
// <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

// `contrast`
// Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
tinycolor.readability = function(color1, color2) {
    var c1 = tinycolor(color1);
    var c2 = tinycolor(color2);
    return (Math.max(c1.getLuminance(),c2.getLuminance())+0.05) / (Math.min(c1.getLuminance(),c2.getLuminance())+0.05);
};

// `isReadable`
// Ensure that foreground and background color combinations meet WCAG2 guidelines.
// The third argument is an optional Object.
//      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
//      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
// If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

// *Example*
//    tinycolor.isReadable("#000", "#111") => false
//    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
tinycolor.isReadable = function(color1, color2, wcag2) {
    var readability = tinycolor.readability(color1, color2);
    var wcag2Parms, out;

    out = false;

    wcag2Parms = validateWCAG2Parms(wcag2);
    switch (wcag2Parms.level + wcag2Parms.size) {
        case "AAsmall":
        case "AAAlarge":
            out = readability >= 4.5;
            break;
        case "AAlarge":
            out = readability >= 3;
            break;
        case "AAAsmall":
            out = readability >= 7;
            break;
    }
    return out;

};

// `mostReadable`
// Given a base color and a list of possible foreground or background
// colors for that base, returns the most readable color.
// Optionally returns Black or White if the most readable color is unreadable.
// *Example*
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
tinycolor.mostReadable = function(baseColor, colorList, args) {
    var bestColor = null;
    var bestScore = 0;
    var readability;
    var includeFallbackColors, level, size ;
    args = args || {};
    includeFallbackColors = args.includeFallbackColors ;
    level = args.level;
    size = args.size;

    for (var i= 0; i < colorList.length ; i++) {
        readability = tinycolor.readability(baseColor, colorList[i]);
        if (readability > bestScore) {
            bestScore = readability;
            bestColor = tinycolor(colorList[i]);
        }
    }

    if (tinycolor.isReadable(baseColor, bestColor, {"level":level,"size":size}) || !includeFallbackColors) {
        return bestColor;
    }
    else {
        args.includeFallbackColors=false;
        return tinycolor.mostReadable(baseColor,["#fff", "#000"],args);
    }
};


// Big List of Colors
// ------------------
// <http://www.w3.org/TR/css3-color/#svg-color>
var names = tinycolor.names = {
    aliceblue: "f0f8ff",
    antiquewhite: "faebd7",
    aqua: "0ff",
    aquamarine: "7fffd4",
    azure: "f0ffff",
    beige: "f5f5dc",
    bisque: "ffe4c4",
    black: "000",
    blanchedalmond: "ffebcd",
    blue: "00f",
    blueviolet: "8a2be2",
    brown: "a52a2a",
    burlywood: "deb887",
    burntsienna: "ea7e5d",
    cadetblue: "5f9ea0",
    chartreuse: "7fff00",
    chocolate: "d2691e",
    coral: "ff7f50",
    cornflowerblue: "6495ed",
    cornsilk: "fff8dc",
    crimson: "dc143c",
    cyan: "0ff",
    darkblue: "00008b",
    darkcyan: "008b8b",
    darkgoldenrod: "b8860b",
    darkgray: "a9a9a9",
    darkgreen: "006400",
    darkgrey: "a9a9a9",
    darkkhaki: "bdb76b",
    darkmagenta: "8b008b",
    darkolivegreen: "556b2f",
    darkorange: "ff8c00",
    darkorchid: "9932cc",
    darkred: "8b0000",
    darksalmon: "e9967a",
    darkseagreen: "8fbc8f",
    darkslateblue: "483d8b",
    darkslategray: "2f4f4f",
    darkslategrey: "2f4f4f",
    darkturquoise: "00ced1",
    darkviolet: "9400d3",
    deeppink: "ff1493",
    deepskyblue: "00bfff",
    dimgray: "696969",
    dimgrey: "696969",
    dodgerblue: "1e90ff",
    firebrick: "b22222",
    floralwhite: "fffaf0",
    forestgreen: "228b22",
    fuchsia: "f0f",
    gainsboro: "dcdcdc",
    ghostwhite: "f8f8ff",
    gold: "ffd700",
    goldenrod: "daa520",
    gray: "808080",
    green: "008000",
    greenyellow: "adff2f",
    grey: "808080",
    honeydew: "f0fff0",
    hotpink: "ff69b4",
    indianred: "cd5c5c",
    indigo: "4b0082",
    ivory: "fffff0",
    khaki: "f0e68c",
    lavender: "e6e6fa",
    lavenderblush: "fff0f5",
    lawngreen: "7cfc00",
    lemonchiffon: "fffacd",
    lightblue: "add8e6",
    lightcoral: "f08080",
    lightcyan: "e0ffff",
    lightgoldenrodyellow: "fafad2",
    lightgray: "d3d3d3",
    lightgreen: "90ee90",
    lightgrey: "d3d3d3",
    lightpink: "ffb6c1",
    lightsalmon: "ffa07a",
    lightseagreen: "20b2aa",
    lightskyblue: "87cefa",
    lightslategray: "789",
    lightslategrey: "789",
    lightsteelblue: "b0c4de",
    lightyellow: "ffffe0",
    lime: "0f0",
    limegreen: "32cd32",
    linen: "faf0e6",
    magenta: "f0f",
    maroon: "800000",
    mediumaquamarine: "66cdaa",
    mediumblue: "0000cd",
    mediumorchid: "ba55d3",
    mediumpurple: "9370db",
    mediumseagreen: "3cb371",
    mediumslateblue: "7b68ee",
    mediumspringgreen: "00fa9a",
    mediumturquoise: "48d1cc",
    mediumvioletred: "c71585",
    midnightblue: "191970",
    mintcream: "f5fffa",
    mistyrose: "ffe4e1",
    moccasin: "ffe4b5",
    navajowhite: "ffdead",
    navy: "000080",
    oldlace: "fdf5e6",
    olive: "808000",
    olivedrab: "6b8e23",
    orange: "ffa500",
    orangered: "ff4500",
    orchid: "da70d6",
    palegoldenrod: "eee8aa",
    palegreen: "98fb98",
    paleturquoise: "afeeee",
    palevioletred: "db7093",
    papayawhip: "ffefd5",
    peachpuff: "ffdab9",
    peru: "cd853f",
    pink: "ffc0cb",
    plum: "dda0dd",
    powderblue: "b0e0e6",
    purple: "800080",
    rebeccapurple: "663399",
    red: "f00",
    rosybrown: "bc8f8f",
    royalblue: "4169e1",
    saddlebrown: "8b4513",
    salmon: "fa8072",
    sandybrown: "f4a460",
    seagreen: "2e8b57",
    seashell: "fff5ee",
    sienna: "a0522d",
    silver: "c0c0c0",
    skyblue: "87ceeb",
    slateblue: "6a5acd",
    slategray: "708090",
    slategrey: "708090",
    snow: "fffafa",
    springgreen: "00ff7f",
    steelblue: "4682b4",
    tan: "d2b48c",
    teal: "008080",
    thistle: "d8bfd8",
    tomato: "ff6347",
    turquoise: "40e0d0",
    violet: "ee82ee",
    wheat: "f5deb3",
    white: "fff",
    whitesmoke: "f5f5f5",
    yellow: "ff0",
    yellowgreen: "9acd32"
};

// Make it easy to access colors via `hexNames[hex]`
var hexNames = tinycolor.hexNames = flip(names);


// Utilities
// ---------

// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
function flip(o) {
    var flipped = { };
    for (var i in o) {
        if (o.hasOwnProperty(i)) {
            flipped[o[i]] = i;
        }
    }
    return flipped;
}

// Return a valid alpha value [0,1] with all invalid values being set to 1
function boundAlpha(a) {
    a = parseFloat(a);

    if (isNaN(a) || a < 0 || a > 1) {
        a = 1;
    }

    return a;
}

// Take input from [0, n] and return it as [0, 1]
function bound01(n, max) {
    if (isOnePointZero(n)) { n = "100%"; }

    var processPercent = isPercentage(n);
    n = mathMin(max, mathMax(0, parseFloat(n)));

    // Automatically convert percentage into number
    if (processPercent) {
        n = parseInt(n * max, 10) / 100;
    }

    // Handle floating point rounding errors
    if ((Math.abs(n - max) < 0.000001)) {
        return 1;
    }

    // Convert into [0, 1] range if it isn't already
    return (n % max) / parseFloat(max);
}

// Force a number between 0 and 1
function clamp01(val) {
    return mathMin(1, mathMax(0, val));
}

// Parse a base-16 hex value into a base-10 integer
function parseIntFromHex(val) {
    return parseInt(val, 16);
}

// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
// <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
function isOnePointZero(n) {
    return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
}

// Check to see if string passed in is a percentage
function isPercentage(n) {
    return typeof n === "string" && n.indexOf('%') != -1;
}

// Force a hex value to have 2 characters
function pad2(c) {
    return c.length == 1 ? '0' + c : '' + c;
}

// Replace a decimal with it's percentage value
function convertToPercentage(n) {
    if (n <= 1) {
        n = (n * 100) + "%";
    }

    return n;
}

// Converts a decimal to a hex value
function convertDecimalToHex(d) {
    return Math.round(parseFloat(d) * 255).toString(16);
}
// Converts a hex value to a decimal
function convertHexToDecimal(h) {
    return (parseIntFromHex(h) / 255);
}

var matchers = (function() {

    // <http://www.w3.org/TR/css3-values/#integers>
    var CSS_INTEGER = "[-\\+]?\\d+%?";

    // <http://www.w3.org/TR/css3-values/#number-value>
    var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

    // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
    var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

    // Actual matching.
    // Parentheses and commas are optional, but not required.
    // Whitespace can take the place of commas or opening paren
    var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
    var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

    return {
        CSS_UNIT: new RegExp(CSS_UNIT),
        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
    };
})();

// `isValidCSSUnit`
// Take in a single string / number and check to see if it looks like a CSS unit
// (see `matchers` above for definition).
function isValidCSSUnit(color) {
    return !!matchers.CSS_UNIT.exec(color);
}

// `stringInputToObject`
// Permissive string parsing.  Take in a number of formats, and output an object
// based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
function stringInputToObject(color) {

    color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
    var named = false;
    if (names[color]) {
        color = names[color];
        named = true;
    }
    else if (color == 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0, format: "name" };
    }

    // Try to match string input using regular expressions.
    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
    // Just return an object and let the conversion functions handle that.
    // This way the result will be the same whether the tinycolor is initialized with string or object.
    var match;
    if ((match = matchers.rgb.exec(color))) {
        return { r: match[1], g: match[2], b: match[3] };
    }
    if ((match = matchers.rgba.exec(color))) {
        return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    if ((match = matchers.hsl.exec(color))) {
        return { h: match[1], s: match[2], l: match[3] };
    }
    if ((match = matchers.hsla.exec(color))) {
        return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    if ((match = matchers.hsv.exec(color))) {
        return { h: match[1], s: match[2], v: match[3] };
    }
    if ((match = matchers.hsva.exec(color))) {
        return { h: match[1], s: match[2], v: match[3], a: match[4] };
    }
    if ((match = matchers.hex8.exec(color))) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            a: convertHexToDecimal(match[4]),
            format: named ? "name" : "hex8"
        };
    }
    if ((match = matchers.hex6.exec(color))) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            format: named ? "name" : "hex"
        };
    }
    if ((match = matchers.hex4.exec(color))) {
        return {
            r: parseIntFromHex(match[1] + '' + match[1]),
            g: parseIntFromHex(match[2] + '' + match[2]),
            b: parseIntFromHex(match[3] + '' + match[3]),
            a: convertHexToDecimal(match[4] + '' + match[4]),
            format: named ? "name" : "hex8"
        };
    }
    if ((match = matchers.hex3.exec(color))) {
        return {
            r: parseIntFromHex(match[1] + '' + match[1]),
            g: parseIntFromHex(match[2] + '' + match[2]),
            b: parseIntFromHex(match[3] + '' + match[3]),
            format: named ? "name" : "hex"
        };
    }

    return false;
}

function validateWCAG2Parms(parms) {
    // return valid WCAG2 parms for isReadable.
    // If input parms are invalid, return {"level":"AA", "size":"small"}
    var level, size;
    parms = parms || {"level":"AA", "size":"small"};
    level = (parms.level || "AA").toUpperCase();
    size = (parms.size || "small").toLowerCase();
    if (level !== "AA" && level !== "AAA") {
        level = "AA";
    }
    if (size !== "small" && size !== "large") {
        size = "small";
    }
    return {"level":level, "size":size};
}

// Node: Export function
if (typeof module !== "undefined" && module.exports) {
    module.exports = tinycolor;
}
// AMD/requirejs: Define the module
else if (typeof define === 'function' && define.amd) {
    define(function () {return tinycolor;});
}
// Browser: Expose to window
else {
    window.tinycolor = tinycolor;
}

})(Math);

},{}],10:[function(require,module,exports){
// yy-counter
// In-browser counter to watch changeable values like counters or FPS
// David Figatner
// (c) YOPEY YOPEY LLC 2017
// MIT License
// https://github.com/davidfig/counter

module.exports = class Counter
{
    /**
     * @param {object} [options]
     * @param {string} [options.side=rightbottom] side to place the panel (combination of right/left and bottom/top)
     * @param {number} [options.padding=7px]
     * @param {string} [options.color=white]
     * @param {string} [options.background=rgba(0,0,0,0.5)]
     * @param {*} {options.xxx} where xxx is a CSS style for the div
     */
    constructor(options)
    {
        options = options || {}
        options.side = options.side || 'rightbottom'
        options.side.toLowerCase()
        options.padding = options.padding || '7px'
        options.color = options.color || 'white'
        options.background = options.background || 'rgba(0,0,0,0.5)'
        this.div = document.createElement('div')
        Counter.findParent(options.side).appendChild(this.div)
        for (let style in options)
        {
            if (style !== 'parent' && style !== 'side')
            {
                this.div.style[style] = options[style]
            }
        }
    }

    /**
     * find the parent div for one of the corners
     * @param {string} [options.side] side to place the panel (combination of right/left and bottom/top)
     * @return {HTMLElement}
     */
    static findParent(side)
    {
        const styles = []
        let name = 'yy-counter-'
        if (side.indexOf('left') !== -1)
        {
            name += 'left-'
            styles['left'] = 0
        }
        else
        {
            name += 'right-'
            styles['right'] = 0
        }
        if (side.indexOf('top') !== -1)
        {
            name += 'top'
            styles['top'] = 0
        }
        else
        {
            name += 'bottom'
            styles['bottom'] = 0
        }
        const test = document.getElementById(name)
        if (test)
        {
            return test
        }
        const container = document.createElement('div')
        container.id = name
        container.style.overflow = 'hidden'
        container.style.position = 'fixed'
        container.style.zIndex = 10000
        container.style.pointerEvents = 'none'
        container.style.userSelect = 'none'
        for (let style in styles)
        {
            container.style[style] = styles[style]
        }
        document.body.appendChild(container)
        return container
    }

    /**
     * replaces the innerHTML of the console
     * @param {string|number} text1
     * @param {string|number} [text2]
     * @param {string|number} [...textn] any number of arguments
     */
    log()
    {
        let s = ''
        for (let arg of arguments)
        {
            s += '<div>' + arg + '</div>'
        }
        this.div.innerHTML =  s
    }

    /**
     * appends to the innerHTML of the console
     * @param {string|number} text1
     * @param {string|number} [text2]
     * @param {string|number} [...textn] any number of arguments
     */
    append()
    {
        let s = this.div.innerHTML
        for (let arg of arguments)
        {
            s += '<div>' + arg + '</div>'
        }
        this.div.innerHTML = s
    }
}
},{}],11:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Color = require('tinycolor2');
var Counter = require('yy-counter');

var STYLES = {
    'background': 'rgba(0, 0, 0, 0.5)',
    'color': 'white'
};

var STYLES_FPS = {
    'padding': '0.1em 0.5em'
};

var STYLES_METER = {};

module.exports = function () {
    /**
     * @param {object} [options]
     * @param {boolean} [options.meter=true] include a meter with the FPS
     * @param {string} [options.side=bottom-right] include any combination of left/right and top/bottom
     * @param {number} [options.FPS=60] desired FPS
     * @param {number} [options.tolerance=1] minimum tolerance for fluctuations in FPS number
     * @param {number} [options.meterWidth=100] width of meter div
     * @param {number} [options.meterHeight=25] height of meter div
     * @param {number} [options.meterLineHeight=4] height of meter line
     * @param {styles[]} [options.styles] CSS styles to apply to the div (in javascript format)
     * @param {styles[]} [options.stylesFPS] CSS styles to apply to the FPS text (in javascript format)
     * @param {styles[]} [options.stylesMeter] CSS styles to apply to the FPS meter (in javascript format)
     * @param {string} [options.text=" FPS"] change the text to the right of the FPS
     */
    function FPS(options) {
        _classCallCheck(this, FPS);

        this.options = options || {};
        this.tolerance = this.options.tolerance || 1;
        this.FPS = this.options.FPS || 60;
        this.meterWidth = this.options.meterWidth || 100;
        this.meterHeight = this.options.meterHeight || 25;
        this.meterLineHeight = this.options.meterLineHeight || 4;
        this.div = document.createElement('div');
        Counter.findParent(this.options.side || 'bottom-right').appendChild(this.div);
        this.style(this.div, STYLES, this.options.styles);
        this.divFPS();
        this.meter = typeof this.options.meter === 'undefined' || this.options.meter;
        this.lastTime = 0;
        this.frameNumber = 0;
        this.lastUpdate = 0;
        this.lastFPS = '--';
    }

    /**
     * change desired FPS
     * @type {number}
     */


    _createClass(FPS, [{
        key: 'remove',


        /**
         * remove meter from DOM
         */
        value: function remove() {
            this.div.remove();
        }

        /**
         * @type {boolean} meter (the FPS graph) is on or off
         */

    }, {
        key: 'style',
        value: function style(div, style1, style2) {
            for (var style in style1) {
                div.style[style] = style1[style];
            }
            if (style2) {
                for (var _style in style2) {
                    div.style[_style] = style2[_style];
                }
            }
        }

        /**
         * create div for text FPS
         * @private
         * @param {HTMLElement} div
         * @param {object} options (see contructor)
         */

    }, {
        key: 'divFPS',
        value: function divFPS() {
            var div = this.div;
            var options = this.options;
            var divFPS = document.createElement('div');
            div.appendChild(divFPS);
            this.fpsSpan = document.createElement('span');
            divFPS.appendChild(this.fpsSpan);
            var span = document.createElement('span');
            divFPS.appendChild(span);
            span.innerText = typeof options.text !== 'undefined' ? options.text : ' FPS';
            this.style(div, STYLES_FPS, options.stylesFPS);
        }

        /**
         * create div for FPS meter
         * @private
         * @param {HTMLElement} div
         * @param {object} options (see contructor)
         */

    }, {
        key: 'divMeter',
        value: function divMeter() {
            var div = this.div;
            var options = this.options;
            if (!this.meterCanvas) {
                this.meterCanvas = document.createElement('canvas');
                div.appendChild(this.meterCanvas);
                this.meterCanvas.width = this.meterWidth;
                this.meterCanvas.height = this.meterHeight;
                this.meterCanvas.style.width = div.width + 'px';
                this.meterCanvas.style.height = div.height + 'px';
                this.style(this.meterCanvas, STYLES_METER, options.stylesMeter);
            } else {
                this.meterCanvas.style.display = 'block';
            }
        }

        /**
         * call this at the start of the frame to calculate FPS
         */

    }, {
        key: 'frame',
        value: function frame() {
            this.frameNumber++;
            var currentTime = performance.now() - this.lastTime;

            // skip large differences to remove garbage
            if (currentTime > 500) {
                if (this.lastTime !== 0) {
                    this.lastFPS = Math.floor(this.frameNumber / (currentTime / 1000));
                    if (this.lastFPS >= this.FPS - this.tolerance && this.lastFPS <= this.FPS + this.tolerance) {
                        this.lastFPS = this.FPS;
                    }
                }
                this.lastTime = performance.now();
                this.frameNumber = 0;
            }
            this.fpsSpan.innerText = this.lastFPS;
            if (this.meterCanvas && this.lastFPS !== '--') {
                this.meterUpdate(this.lastFPS / this.FPS);
            }
        }
    }, {
        key: 'meterUpdate',
        value: function meterUpdate(percent) {
            var c = this.meterCanvas.getContext('2d');
            var data = c.getImageData(0, 0, this.meterCanvas.width, this.meterCanvas.height);
            c.putImageData(data, -1, 0);
            c.clearRect(this.meterCanvas.width - 1, 0, 1, this.meterCanvas.height);
            if (percent < 0.5) {
                c.fillStyle = Color.mix('#ff0000', '0xffa500', percent * 200).toHexString();
            } else {
                c.fillStyle = Color.mix('#ffa500', '#00ff00', (percent - 0.5) * 200).toHexString();
            }
            var height = (this.meterCanvas.height - this.meterLineHeight) * (1 - percent);
            c.fillRect(this.meterCanvas.width - 1, height, 1, this.meterLineHeight);
        }
    }, {
        key: 'side',
        value: function side(options) {
            if (options.side) {
                options.side = options.side.toLowerCase();
                if (options.side.indexOf('left') !== -1) {
                    STYLES['left'] = 0;
                    delete STYLES['right'];
                } else {
                    STYLES['right'] = 0;
                    delete STYLES['left'];
                }
                if (options.side.indexOf('top') !== -1) {
                    STYLES['top'] = 0;
                    delete STYLES['bottom'];
                } else {
                    STYLES['bottom'] = 0;
                    delete STYLES['top'];
                }
            } else {
                STYLES['right'] = 0;
                STYLES['bottom'] = 0;
            }
        }
    }, {
        key: 'fps',
        get: function get() {
            return this.FPS;
        },
        set: function set(value) {
            this.FPS = value;
        }
    }, {
        key: 'meter',
        get: function get() {
            return this._meter;
        },
        set: function set(value) {
            if (value) {
                this.divMeter();
            } else if (this.meterCanvas) {
                this.meterCanvas.style.display = 'none';
            }
        }
    }]);

    return FPS;
}();

},{"tinycolor2":9,"yy-counter":10}],12:[function(require,module,exports){
const Config = {

    /**
     * application menu container styles
     * @type {object}
     */
    ApplicationContainerStyle: {
        'z-index': 999999,
        'position': 'fixed',
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
        'position': 'fixed',
        'display': 'flex',
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
        'position': 'fixed',
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

module.exports = Config;

},{}],13:[function(require,module,exports){
module.exports = function (options) {
    options = options || {};
    const object = document.createElement(options.type || 'div');
    if (options.parent) {
        options.parent.appendChild(object);
    }
    if (options.styles) {
        for (let style in options.styles) {
            object.style[style] = options.styles[style];
        }
    }
    if (options.html) {
        object.innerHTML = options.html;
    }
    return object;
};

},{}],14:[function(require,module,exports){
/**
 * Handles all keyboard input for the menu and user-registered keys
 */
const LocalAccelerator = {

    init: function () {
        if (!LocalAccelerator.menuKeys) {
            LocalAccelerator.menuKeys = {};
            LocalAccelerator.keys = {};
            document.body.addEventListener('keydown', e => LocalAccelerator.keydown(LocalAccelerator, e));
            document.body.addEventListener('keyup', e => LocalAccelerator.keyup(LocalAccelerator, e));
        }
    },

    /**
     * clear all user-registered keys
     */
    clearKeys: function () {
        LocalAccelerator.keys = {};
    },

    /**
     * Register a shortcut key for use by an open menu
     * @param {KeyCodes} letter
     * @param {MenuItem} menuItem
     * @param {boolean} applicationMenu
     * @private
     */
    registerMenuShortcut: function (letter, menuItem) {
        if (letter) {
            const keyCode = (menuItem.menu.applicationMenu ? 'alt+' : '') + letter;
            LocalAccelerator.menuKeys[LocalAccelerator.prepareKey(keyCode)] = e => {
                menuItem.handleClick(e);
                e.stopPropagation();
                e.preventDefault();
            };
        }
    },

    /**
     * Register special shortcut keys for menu
     * @param {MenuItem} menuItem
     * @private
     */
    registerMenuSpecial: function (menu) {
        LocalAccelerator.menuKeys['escape'] = () => menu.closeAll();
        LocalAccelerator.menuKeys['enter'] = e => menu.enter(e);
        LocalAccelerator.menuKeys['space'] = e => menu.enter(e);
        LocalAccelerator.menuKeys['arrowright'] = e => menu.move(e, 'right');
        LocalAccelerator.menuKeys['arrowleft'] = e => menu.move(e, 'left');
        LocalAccelerator.menuKeys['arrowup'] = e => menu.move(e, 'up');
        LocalAccelerator.menuKeys['arrowdown'] = e => menu.move(e, 'down');
    },

    /**
     * special key registration for alt
     * @param {function} pressed
     * @param {function} released
     * @private
     */
    registerAlt: function (pressed, released) {
        LocalAccelerator.alt = { pressed, released };
    },

    /**
     * Removes menu shortcuts
     * @private
     */
    unregisterMenuShortcuts: function () {
        LocalAccelerator.menuKeys = {};
    },

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
     * @typedef {string} LocalAccelerator~KeyCodes
     */

    /**
     * translate a user-provided keycode
     * @param {KeyCodes} keyCode
     * @return {KeyCodes} formatted and sorted keyCode
     * @private
     */
    prepareKey: function (keyCode) {
        const keys = [];
        let split;
        keyCode += '';
        if (keyCode.length > 1 && keyCode.indexOf('|') !== -1) {
            split = keyCode.split('|');
        } else {
            split = [keyCode];
        }
        for (let code of split) {
            let key = '';
            let modifiers = [];
            code = code.toLowerCase().replace(' ', '');
            if (code.indexOf('+') !== -1) {
                const split = code.split('+');
                for (let i = 0; i < split.length - 1; i++) {
                    let modifier = split[i];
                    modifier = modifier.replace('commandorcontrol', 'ctrl');
                    modifier = modifier.replace('command', 'ctrl');
                    modifier = modifier.replace('control', 'ctrl');
                    modifiers.push(modifier);
                }
                modifiers = modifiers.sort((a, b) => {
                    return a[0] > b[0] ? 1 : a[0] < b[0] ? -1 : 0;
                });
                for (let part of modifiers) {
                    key += part + '+';
                }
                key += split[split.length - 1];
            } else {
                key = code;
            }
            keys.push(key);
        }
        return keys;
    },

    /**
     * Make the KeyCode pretty for printing on the menu
     * @param {KeyCode} keyCode
     * @return {string}
     * @private
     */
    prettifyKey: function (keyCode) {
        let key = '';
        const codes = LocalAccelerator.prepareKey(keyCode);
        for (let i = 0; i < codes.length; i++) {
            const keyCode = codes[i];
            if (keyCode.indexOf('+') !== -1) {
                const split = keyCode.toLowerCase().split('+');
                for (let i = 0; i < split.length - 1; i++) {
                    let modifier = split[i];
                    key += modifier[0].toUpperCase() + modifier.substr(1) + '+';
                }
                key += split[split.length - 1].toUpperCase();
            } else {
                key = keyCode.toUpperCase();
            }
            if (i !== codes.length - 1) {
                key += ' or ';
            }
        }
        return key;
    },

    /**
     * register a key as a global accelerator
     * @param {KeyCodes} keyCode (e.g., Ctrl+shift+E)
     * @param {function} callback
     */
    register: function (keyCode, callback) {
        const keys = LocalAccelerator.prepareKey(keyCode);
        for (let key of keys) {
            LocalAccelerator.keys[key] = e => {
                callback(e);
                e.preventDefault();
                e.stopPropagation();
            };
        }
    },

    keyup: function (accelerator, e) {
        if (LocalAccelerator.alt && (e.code === 'AltLeft' || e.code === 'AltRight')) {
            LocalAccelerator.alt.released();
            LocalAccelerator.alt.isPressed = false;
        }
    },

    keydown: function (accelerator, e) {
        if (LocalAccelerator.alt && !LocalAccelerator.alt.isPressed && (e.code === 'AltLeft' || e.code === 'AltRight')) {
            LocalAccelerator.alt.pressed();
            LocalAccelerator.alt.isPressed = true;
            e.preventDefault();
        }
        const modifiers = [];
        if (e.altKey) {
            modifiers.push('alt');
        }
        if (e.ctrlKey) {
            modifiers.push('ctrl');
        }
        if (e.metaKey) {
            modifiers.push('meta');
        }
        if (e.shiftKey) {
            modifiers.push('shift');
        }
        let keyCode = '';
        for (let modifier of modifiers) {
            keyCode += modifier + '+';
        }
        let translate = e.code.toLowerCase();
        translate = translate.replace('digit', '');
        translate = translate.replace('key', '');
        keyCode += translate;
        if (LocalAccelerator.menuKeys[keyCode]) {
            LocalAccelerator.menuKeys[keyCode](e, LocalAccelerator);
        } else if (LocalAccelerator.keys[keyCode]) {
            LocalAccelerator.keys[keyCode](e, LocalAccelerator);
        }
    }
};

module.exports = LocalAccelerator;

},{}],15:[function(require,module,exports){
const Config = require('./config');
const MenuItem = require('./menuItem');
const LocalAccelerator = require('./localAccelerator');
const html = require('./html');

let _application;

class Menu {
    /**
     * creates a menu bar
     * @param {object} [options]
     * @param {object} [options.styles] additional CSS styles for menu
     */
    constructor(options) {
        options = options || {};
        this.div = document.createElement('div');
        this.styles = options.styles;
        this.children = [];
        this.applyConfig(Config.MenuStyle);
        this.div.tabIndex = -1;
    }

    /**
     * append a MenuItem to the Menu
     * @param {MenuItem} menuItem
     */
    append(menuItem) {
        if (menuItem.submenu) {
            menuItem.submenu.menu = this;
        }
        menuItem.menu = this;
        this.div.appendChild(menuItem.div);
        if (menuItem.type !== 'separator') {
            this.children.push(menuItem);
        }
    }

    /**
     * inserts a MenuItem into the Menu
     * @param {number} pos
     * @param {MenuItem} menuItem
     */
    insert(pos, menuItem) {
        if (pos >= this.div.childNodes.length) {
            this.append(menuItem);
        } else {
            if (menuItem.submenu) {
                menuItem.submenu.menu = this;
            }
            menuItem.menu = this;
            this.div.insertBefore(menuItem.div, this.div.childNodes[pos]);
            if (menuItem.type !== 'separator') {
                this.children.splice(pos, 0, menuItem);
            }
        }
    }

    hide() {
        let current = this.menu.showing;
        while (current && current.submenu) {
            current.div.style.backgroundColor = 'transparent';
            current.submenu.div.remove();
            let next = current.submenu.showing;
            if (next) {
                current.submenu.showing.div.style.backgroundColor = 'transparent';
                current.submenu.showing = null;
            }
            current = next;
        }
    }

    show(menuItem) {
        Menu.LocalAccelerator.unregisterMenuShortcuts();
        if (this.menu && this.menu.showing === menuItem) {
            this.hide();
            this.menu.showing = null;
            this.div.remove();
            this.menu.showAccelerators();
        } else {
            if (this.menu) {
                if (this.menu.showing && this.menu.children.indexOf(menuItem) !== -1) {
                    this.hide();
                }
                this.menu.showing = menuItem;
                this.menu.hideAccelerators();
            }
            const div = menuItem.div;
            const parent = this.menu.div;
            if (this.menu.applicationMenu) {
                this.div.style.left = div.offsetLeft + 'px';
                this.div.style.top = div.offsetTop + div.offsetHeight + 'px';
            } else {
                this.div.style.left = parent.offsetLeft + parent.offsetWidth - Config.Overlap + 'px';
                this.div.style.top = parent.offsetTop + div.offsetTop - Config.Overlap + 'px';
            }
            this.attached = menuItem;
            this.showAccelerators();
            this.getApplicationDiv().appendChild(this.div);
            let label = 0,
                accelerator = 0,
                arrow = 0,
                checked = 0;
            for (let child of this.children) {
                child.check.style.width = 'auto';
                child.label.style.width = 'auto';
                child.accelerator.style.width = 'auto';
                child.arrow.style.width = 'auto';
                if (child.type === 'checkbox') {
                    checked = Config.MinimumColumnWidth;
                }
                if (child.submenu) {
                    arrow = Config.MinimumColumnWidth;
                }
            }
            for (let child of this.children) {
                const childLabel = child.label.offsetWidth * 2;
                label = childLabel > label ? childLabel : label;
                const childAccelerator = child.accelerator.offsetWidth;
                accelerator = childAccelerator > accelerator ? childAccelerator : accelerator;
                if (child.submenu) {
                    arrow = child.arrow.offsetWidth;
                }
            }
            for (let child of this.children) {
                child.check.style.width = checked + 'px';
                child.label.style.width = label + 'px';
                child.accelerator.style.width = accelerator + 'px';
                child.arrow.style.width = arrow + 'px';
            }
            if (this.div.offsetLeft + this.div.offsetWidth > window.innerWidth) {
                this.div.style.left = window.innerWidth - this.div.offsetWidth + 'px';
            }
            if (this.div.offsetTop + this.div.offsetHeight > window.innerHeight) {
                this.div.style.top = window.innerHeight - this.div.offsetHeight + 'px';
            }
            _application.menu.div.focus();
        }
    }

    applyConfig(base) {
        const styles = {};
        for (let style in base) {
            styles[style] = base[style];
        }
        if (this.styles) {
            for (let style in this.styles) {
                styles[style] = this.styles[style];
            }
        }
        for (let style in styles) {
            this.div.style[style] = styles[style];
        }
    }

    showAccelerators() {
        for (let child of this.children) {
            child.showShortcut();
            if (child.type !== 'separator') {
                const index = child.text.indexOf('&');
                if (index !== -1) {
                    Menu.LocalAccelerator.registerMenuShortcut(child.text[index + 1], child);
                }
            }
        }
        if (!this.applicationMenu) {
            Menu.LocalAccelerator.registerMenuSpecial(this);
        }
    }

    hideAccelerators() {
        for (let child of this.children) {
            child.hideShortcut();
        }
    }

    closeAll() {
        Menu.LocalAccelerator.unregisterMenuShortcuts();
        let application = _application.menu;
        if (application.showing) {
            let menu = application;
            while (menu.showing) {
                menu = menu.showing.submenu;
            }
            while (menu && !menu.applicationMenu) {
                if (menu.showing) {
                    menu.showing.div.style.backgroundColor = 'transparent';
                    menu.showing = null;
                }
                menu.div.remove();
                menu = menu.menu;
            }
            if (menu) {
                menu.showing.div.style.background = 'transparent';
                menu.showing = null;
                menu.hideAccelerators();
            }
        }
    }

    getApplicationDiv() {
        return _application;
    }

    /**
     * move selector to the next child pane
     * @param {string} direction (left or right)
     * @private
     */
    moveChild(direction) {
        let index;
        if (direction === 'left') {
            const parent = this.selector.menu.menu;
            index = parent.children.indexOf(parent.showing);
            index--;
            index = index < 0 ? parent.children.length - 1 : index;
            parent.children[index].handleClick();
        } else {
            let parent = this.selector.menu.menu;
            let selector = parent.showing;
            while (!parent.applicationMenu) {
                selector.handleClick();
                selector.div.style.backgroundColor = 'transparent';
                parent = parent.menu;
                selector = parent.showing;
            }
            index = parent.children.indexOf(selector);
            index++;
            index = index === parent.children.length ? 0 : index;
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
    horizontalSelector(e, direction) {
        if (direction === 'right') {
            if (this.selector.submenu) {
                this.selector.handleClick(e);
                this.selector.submenu.selector = this.selector.submenu.children[0];
                this.selector.submenu.selector.div.style.backgroundColor = Config.SelectedBackgroundStyle;
                this.selector = null;
            } else {
                this.moveChild(direction);
            }
        } else if (direction === 'left') {
            if (!this.selector.menu.menu.applicationMenu) {
                this.selector.menu.attached.handleClick(e);
                this.selector.menu.menu.selector = this.selector.menu.attached;
                this.selector = null;
            } else {
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
     * @private
     */
    move(e, direction) {
        if (this.selector) {
            this.selector.div.style.backgroundColor = 'transparent';
            let index = this.children.indexOf(this.selector);
            if (direction === 'down') {
                index++;
                index = index === this.children.length ? 0 : index;
            } else if (direction === 'up') {
                index--;
                index = index < 0 ? this.children.length - 1 : index;
            } else {
                return this.horizontalSelector(e, direction);
            }
            this.selector = this.children[index];
        } else {
            if (direction === 'up') {
                this.selector = this.children[this.children.length - 1];
            } else {
                this.selector = this.children[0];
            }
        }
        this.selector.div.style.backgroundColor = Config.SelectedBackgroundStyle;
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * click the selector with keyboard
     * @private
     */
    enter(e) {
        if (this.selector) {
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
    get items() {
        return this.children;
    }

    /**
     * show application menu accelerators when alt is pressed
     * @private
     */
    showApplicationAccelerators() {
        this.hideAccelerators();
        LocalAccelerator.registerAlt(() => {
            if (!this.showing) {
                this.showAccelerators();
            }
        }, () => {
            this.hideAccelerators();
        });
    }

    /**
     * sets active application Menu (and removes any existing application menus)
     * @param {Menu} menu
     */
    static setApplicationMenu(menu) {
        LocalAccelerator.init();
        if (_application) {
            _application.remove();
        }
        _application = html({ parent: document.body, styles: Config.ApplicationContainerStyle });
        _application.menu = menu;
        menu.applyConfig(Config.ApplicationMenuStyle);
        for (let child of menu.children) {
            child.applyConfig(Config.ApplicationMenuRowStyle);
            if (child.arrow) {
                child.arrow.style.display = 'none';
            }
            menu.div.appendChild(child.div);
        }

        _application.appendChild(menu.div);
        menu.applicationMenu = true;
        menu.div.tabIndex = -1;

        // don't let menu bar focus unless windows are open (this fixes a focus bug)
        menu.div.addEventListener('focus', () => {
            if (!menu.showing) {
                menu.div.blur();
            }
        });

        // close all windows if menu is no longer the focus
        menu.div.addEventListener('blur', () => {
            if (menu.showing) {
                menu.closeAll();
            }
        });
        menu.showApplicationAccelerators();
    }

    /**
     * localAccelerator definition
     * @type {Accelerator}
     */
    static get LocalAccelerator() {
        return LocalAccelerator;
    }

    /**
     * use this to change the default Config settings across all menus
     * @type {Config}
     */
    static get Config() {
        return Config;
    }

    /**
     * MenuItem definition
     * @type {MenuItem}
     */
    static get MenuItem() {
        return MenuItem;
    }
}

module.exports = Menu;

},{"./config":12,"./html":13,"./localAccelerator":14,"./menuItem":16}],16:[function(require,module,exports){
const html = require('./html');
const Config = require('./config');
const localAccelerator = require('./localAccelerator');

class MenuItem {
    /**
     * @param {object} options
     * @param {string} [options.label] label for menu entry may include accelerator by placing & before letter)
     * @param {string} [options.type] separator, checkbox, or undefined
     * @param {object} [options.styles] additional CSS styles to apply to this MenuItem
     * @param {string} [options.accelerator] see Accelerator for inputs (e.g., ctrl+shift+A)
     * @param {MenuItem} [options.submenu] attaches a submenu (and changes type to submenu)
     * @param {boolean} [options.checked] check the checkbox
     */
    constructor(options) {
        localAccelerator.init();
        options = options || {};
        this.styles = options.styles;
        this.div = html();
        this.type = options.type;
        this.click = options.click;
        if (this.type === 'separator') {
            this.applyConfig(Config.SeparatorStyle);
        } else {
            this._checked = options.checked;
            this.createChecked(options.checked);
            this.text = options.label || '&nbsp;&nbsp;&nbsp;';
            this.createShortcut();
            this.createAccelerator(options.accelerator);
            this.createSubmenu(options.submenu);
            if (options.submenu) {
                this.submenu = options.submenu;
                this.submenu.applyConfig(Config.MenuStyle);
            }
            this.applyConfig(Config.RowStyle);
            this.div.addEventListener('mousedown', e => this.handleClick(e));
            this.div.addEventListener('touchstart', e => this.handleClick(e));
            this.div.addEventListener('mouseenter', () => this.mouseenter());
            this.div.addEventListener('mouseleave', () => this.mouseleave());
        }
    }

    /**
     * The click callback
     * @callback MenuItem~ClickCallback
     * @param {InputEvent} e
     */

    mouseenter() {
        if (!this.submenu || this.menu.showing !== this) {
            this.div.style.backgroundColor = Config.SelectedBackgroundStyle;
            if (this.submenu && (!this.menu.applicationMenu || this.menu.showing)) {
                this.submenuTimeout = setTimeout(() => {
                    this.submenuTimeout = null;
                    this.submenu.show(this);
                }, this.menu.applicationMenu ? 0 : Config.SubmenuOpenDelay);
            }
        }
    }

    mouseleave() {
        if (!this.submenu || this.menu.showing !== this) {
            if (this.submenuTimeout) {
                clearTimeout(this.submenuTimeout);
                this.submenuTimeout = null;
            }
            this.div.style.backgroundColor = 'transparent';
        }
    }

    applyConfig(base) {
        const styles = {};
        for (let style in base) {
            styles[style] = base[style];
        }
        if (this.styles) {
            for (let style in this.styles) {
                styles[style] = this.styles[style];
            }
        }
        for (let style in styles) {
            this.div.style[style] = styles[style];
        }
    }

    createChecked(checked) {
        this.check = html({ parent: this.div, html: checked ? '&#10004;' : '' });
    }

    createShortcut() {
        if (this.type !== 'separator') {
            const text = this.text;
            this.label = html({ parent: this.div });
            let current = html({ parent: this.label, type: 'span' });
            if (text.indexOf('&') !== -1) {
                let i = 0;
                do {
                    const letter = text[i];
                    if (letter === '&') {
                        i++;
                        this.shortcutSpan = html({ parent: this.label, type: 'span', html: text[i], styles: Config.AcceleratorKeyStyle });
                        current = html({ parent: this.label, type: 'span' });
                    } else {
                        current.innerHTML += letter;
                    }
                    i++;
                } while (i < text.length);
            } else {
                this.label.innerHTML = text;
            }
        }
    }

    showShortcut() {
        if (this.shortcutSpan) {
            this.shortcutSpan.style.textDecoration = 'underline';
        }
    }

    hideShortcut() {
        if (this.shortcutSpan) {
            this.shortcutSpan.style.textDecoration = 'none';
        }
    }

    createAccelerator(accelerator) {
        this.accelerator = html({ parent: this.div, html: accelerator ? localAccelerator.prettifyKey(accelerator) : '', styles: Config.AcceleratorStyle });
        if (accelerator) {
            localAccelerator.register(accelerator, e => this.click(e));
        }
    }

    createSubmenu(submenu) {
        this.arrow = html({ parent: this.div, html: submenu ? '&#9658;' : '' });
    }

    closeAll() {
        let menu = this.menu;
        localAccelerator.unregisterMenuShortcuts();
        while (menu && !menu.applicationMenu) {
            if (menu.showing) {
                menu.showing.div.style.backgroundColor = 'transparent';
                menu.showing = null;
            }
            menu.div.remove();
            menu = menu.menu;
        }
        if (menu.showing) {
            menu.showing.div.style.background = 'transparent';
            menu.showing = null;
            menu.hideAccelerators();
        }
    }

    handleClick(e) {
        if (this.submenu) {
            if (this.submenuTimeout) {
                clearTimeout(this.submenuTimeout);
                this.submenuTimeout = null;
            }
            this.submenu.show(this);
            this.div.style.backgroundColor = Config.SelectedBackgroundStyle;
            if (typeof e.keyCode !== 'undefined' && this.menu.applicationMenu && document.activeElement !== this.menu.div) {
                this.menu.div.focus();
            }
            e.preventDefault();
        } else if (this.type === 'checkbox') {
            this.checked = !this.checked;
            this.closeAll();
        } else {
            this.closeAll();
        }

        if (this.click) {
            this.click(e, this);
        }
    }

    get checked() {
        return this._checked;
    }
    set checked(value) {
        this._checked = value;
        this.check.innerHTML = this._checked ? '&#10004;' : '';
    }
}

module.exports = MenuItem;

},{"./config":12,"./html":13,"./localAccelerator":14}],17:[function(require,module,exports){
module.exports = function (options)
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
},{}],18:[function(require,module,exports){
const exists = require('exists')

const html = require('./html')

const DEFAULT_COLOR = '#a8f0f4'
const DEFAULT_SIZE = 10

module.exports = class Snap
{
    /**
     * add edge snapping plugin
     * @param {WindowManager} wm
     * @param {object} options
     * @param {boolean} [options.screen=true] snap to screen edges
     * @param {boolean} [options.windows=true] snap to window edges
     * @param {number} [options.snap=20] distance to edge before snapping and width/height of snap bars
     * @param {string} [options.color=#a8f0f4] color for snap bars
     * @param {number} [options.spacing=5] spacing distance between window and edges
     * @private
     */
    constructor(wm, options)
    {
        options = !exists(options) || typeof options !== 'object' ? {} : options
        this.wm = wm
        this.snap = options.snap || 20
        this.screen = exists(options.screen) ? options.screen : true
        this.windows = exists(options.windows) ? options.windows : true
        const backgroundColor = options.color || DEFAULT_COLOR
        this.size = options.size || DEFAULT_SIZE
        this.spacing = options.spacing || 5
        this.highlights = html({ parent: this.wm.overlay, styles: { 'position': 'absolute' } })
        this.horizontal = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                height: this.size + 'px',
                borderRadius: this.size + 'px',
                backgroundColor
            }
        })
        this.vertical = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                width: this.size + 'px',
                borderRadius: this.size + 'px',
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
        if (rect.left - this.snap <= width && rect.right + this.snap >= 0)
        {
            if (Math.abs(rect.top - 0) <= this.snap)
            {
                horizontal.push({ distance: Math.abs(rect.top - 0), left: 0, width, top: 0, side: 'top' })
            }
            else if (Math.abs(rect.bottom - height) <= this.snap)
            {
                horizontal.push({ distance: Math.abs(rect.bottom - height), left: 0, width, top: height, side: 'bottom' })
            }
        }
        if (rect.top - this.snap <= height && rect.bottom + this.snap >= 0)
        {
            if (Math.abs(rect.left - 0) <= this.snap)
            {
                vertical.push({ distance: Math.abs(rect.left - 0), top: 0, height, left: 0, side: 'left' })
            }
            else if (Math.abs(rect.right - width) <= this.snap)
            {
                vertical.push({ distance: Math.abs(rect.right - width), top: 0, height, left: width, side: 'right' })
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
                        if (Math.abs(rect.left - rect2.left) <= this.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true })
                        }
                        else if (Math.abs(rect.right - rect2.right) <= this.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true })
                        }
                    }
                    else if (Math.abs(rect.bottom - rect2.top) <= this.snap)
                    {
                        horizontal.push({ distance: Math.abs(rect.bottom - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'bottom' })
                        if (Math.abs(rect.left - rect2.left) <= this.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true })
                        }
                        else if (Math.abs(rect.right - rect2.right) <= this.snap)
                        {
                            vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true })
                        }
                    }
                }
                if (rect.top - this.snap <= rect2.bottom && rect.bottom + this.snap >= rect2.top)
                {
                    if (Math.abs(rect.left - rect2.right) <= this.snap)
                    {
                        vertical.push({ distance: Math.abs(rect.left - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'left' })
                        if (Math.abs(rect.top - rect2.top) <= this.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true })
                        }
                        else if (Math.abs(rect.bottom - rect2.bottom) <= this.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true })
                        }
                    }
                    else if (Math.abs(rect.right - rect2.left) <= this.snap)
                    {
                        vertical.push({ distance: Math.abs(rect.right - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'right' })
                        if (Math.abs(rect.top - rect2.top) <= this.snap)
                        {
                            horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true })
                        }
                        else if (Math.abs(rect.bottom - rect2.bottom) <= this.snap)
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
            this.horizontal.noSpacing = find.noSpacing
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
            this.vertical.noSpacing = find.noSpacing
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
            const spacing = this.horizontal.noSpacing ? 0 : this.spacing
            const adjust = win.minimized ? (win.height - win.height * win.minimized.scaleY) / 2 : 0
            switch (this.horizontal.side)
            {
                case 'top':
                    win.y = this.horizontal.y - adjust + spacing
                    break

                case 'bottom':
                    win.bottom = this.horizontal.y + adjust - spacing
                    break
            }
        }
        if (this.vertical.style.display === 'block')
        {
            const spacing = this.vertical.noSpacing ? 0 : this.spacing
            const adjust = win.minimized ? (win.width - win.width * win.minimized.scaleX) / 2 : 0
            switch (this.vertical.side)
            {
                case 'left':
                    win.x = this.vertical.x - adjust + spacing
                    break

                case 'right':
                    win.right = this.vertical.x + adjust - spacing
                    break
            }
        }
        this.horizontal.style.display = this.vertical.style.display = 'none'
    }
}
},{"./html":17,"exists":7}],19:[function(require,module,exports){
const exists = require('exists')

const html = require('./html')
const Window = require('./window')
const WindowOptions = require('./window-options')
const Snap = require('./snap')

/**
 * Creates a windowing system to create and manage windows
 *
 * @extends EventEmitter
 * @example
 * var wm = new WindowManager();
 *
 * wm.createWindow({ x: 20, y: 20, width: 200 });
 * wm.content.innerHTML = 'Hello there!';
 */
class WindowManager
{
    /**
     * @param {Window~WindowOptions} [defaultOptions] default WindowOptions used when createWindow is called
     * @param {boolean} [defaultOptions.quiet] suppress the simple-window-manager console message
     * @param {object} [defaultOptions.snap] turn on edge snapping
     * @param {boolean} [defaultOptions.snap.screen=true] snap to edge of screen
     * @param {boolean} [defaultOptions.snap.windows=true] snap to windows
     * @param {number} [defaultOptions.snap.snap=20] distance to edge before snapping and width/height of snap bars
     * @param {string} [defaultOptions.snap.color=#a8f0f4] color for snap bars
     * @param {number} [defaultOptions.snap.spacing=5] spacing distance between window and edges
     */
    constructor(defaultOptions)
    {
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
        if (!defaultOptions || !defaultOptions.quiet)
        {
            console.log('%c ☕ simple-window-manager initialized ☕', 'color: #ff00ff')
        }
        this._createDom()
        this.plugins = []
        if (defaultOptions && defaultOptions['snap'])
        {
            this.snap(defaultOptions['snap'])
        }
    }

    /**
     * Create a window
     * @param {Window~WindowOptions} [options]
     * @param {string} [options.title]
     * @param {number} [options.x] position
     * @param {number} [options.y] position
     * @param {boolean} [options.modal]
     * @param {string|number} [options.id] if not provide, id will be assigned in order of creation (0, 1, 2...)
     * @returns {Window} the created window
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
        if (this.plugins['snap'] && !options.noSnap)
        {
            this.plugins['snap'].addWindow(win)
        }
        return win
    }

    /**
     * Attach an existing window to the WindowManager
     * Note: WindowManager.createWindow is the preferred way to create windows to ensure that all the global options
     * are applied to the Window. If you use this function, then Window needs to be initialized with WindowOptions.
     * @param {Window} win
     * @returns {Window} the window
     */
    attachWindow(win)
    {
        win.on('open', this._open, this)
        win.on('focus', this._focus, this)
        win.on('blur', this._blur, this)
        win.on('close', this._close, this)
        this.win.appendChild(win.win)
        win.wm = this
        win.ease.options.duration = this.options.animateTime
        win.ease.options.ease = this.options.ease
        win.win.addEventListener('mousemove', (e) => this._move(e))
        win.win.addEventListener('touchmove', (e) => this._move(e))
        win.win.addEventListener('mouseup', (e) => this._up(e))
        win.win.addEventListener('touchend', (e) => this._up(e))
        if (win.modal)
        {
            this.modal = win
        }
        if (this.plugins['snap'] && !this.options.noSnap)
        {
            this.plugins['snap'].addWindow(win)
        }
        return win
    }

    /**
     * add edge snapping plugin
     * @param {object} options
     * @param {boolean} [options.screen=true] snap to screen edges
     * @param {boolean} [options.windows=true] snap to window edges
     * @param {number} [options.snap=20] distance to edge before snapping
     * @param {string} [options.color=#a8f0f4] color for snap bars
     * @param {number} [options.spacing=0] spacing distance between window and edges
     */
    snap(options)
    {
        this.plugins['snap'] = new Snap(this, options)
        for (let win of this.windows)
        {
            if (!win.options.noSnap)
            {
                this.plugins['snap'].addWindow(win)
            }
        }
    }

    /**
     * remove plugin
     * @param {string} name of plugin
     */
    removePlugin(name)
    {
        if (this.plugins[name])
        {
            this.plugins[name].stop()
            delete this.plugins[name]
        }
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
     * close all windows
     */
    closeAll()
    {
        for (let win of this.windows)
        {
            win.close()
        }
        this.windows = []
        this.modalOverlay.remove()
        this.active = this.modal = null
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
        /**
         * This is the top-level DOM element
         * @type {HTMLElement}
         * @readonly
         */
        this.win = html({
            parent: document.body, styles: {
                'user-select': 'none',
                'width': '100%',
                'height': '100%',
                'overflow': 'hidden',
                'z-index': -1,
                'cursor': 'default'
            }
        })

        /**
         * This is the bottom DOM element. Use this to set a wallpaper or attach elements underneath the windows
         * @type {HTMLElement}
         * @readonly
         */
        this.overlay = html({
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

        this.modalOverlay = html({
            styles: {
                'user-select': 'none',
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'width': '100%',
                'height': '100%',
                'overflow': 'hidden',
                'background': this.options.modalBackground
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
        const index = this.windows.indexOf(win)
        if (index === -1)
        {
            this.windows.push(win)
        }
        if (win.options.modal)
        {
            this._focus(win)
            this.modal = win
            this.win.appendChild(this.modalOverlay)
            this.modalOverlay.style.zIndex = win.z - 1
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
            this.modalOverlay.remove()
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

WindowManager.Window = Window
WindowManager.WindowOptions = WindowOptions

module.exports = WindowManager
},{"./html":17,"./snap":18,"./window":21,"./window-options":20,"exists":7}],20:[function(require,module,exports){
/**
 * @typedef {object} Window~WindowOptions
 * @property {number} [x=0]
 * @property {number} [y=0]
 * @property {number} [width]
 * @property {number} [height]
 * @property {boolean} [movable=true]
 * @property {boolean} [resizable=true]
 * @property {boolean} [maximizable=true]
 * @property {boolean} [minimizable=true]
 * @property {boolean} [closable=true]
 * @property {boolean} [noSnap] don't snap this window or use this window as a snap target
 * @property {boolean} [titlebar=true]
 * @property {string} [titlebarHeight=36px]
 * @property {boolean} [titleCenter]
 * @property {string} [minWidth=200px]
 * @property {string} [minHeight=60px]
 * @property {string} [borderRadius=4px]
 * @property {number} [minimizeSize=50]
 * @property {string} [modalBackground=rgba(0,0,0,0.6)]
 * @property {string} [shadow='0 0 12px 1px rgba(0, 0, 0, 0.6)']
 * @property {number} [animateTime=250]
 * @property {(string|function)} [ease] easing name (see {@link https://www.npmjs.com/package/penner} for list or function)
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
    modalBackground: 'rgba(0, 0, 0, 0.6)',
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
},{}],21:[function(require,module,exports){
const Events = require('eventemitter3')
const clicked = require('clicked')
const Ease = require('dom-ease')
const exists = require('exists')

const html = require('./html')

let id = 0

/**
 * Window class returned by WindowManager.createWindow()
 * @extends EventEmitter
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
 * @fires move-x
 * @fires move-y
 * @fires resize-width
 * @fires resize-height
 */
class Window extends Events
{
    /**
     * @param {WindowManager} [wm]
     * @param {object} [options]
     */
    constructor(wm, options)
    {
        super()
        this.wm = wm

        this.options = options || {}

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
            else
            {
                this.win.style.transform = ''
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
            if (this.options.titlebar)
            {
                this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarActive
            }
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
            if (this.options.titlebar)
            {
                this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarInactive
            }
            this.emit('blur', this)
        }
    }

    /**
     * closes the window (can be reopened with open)
     */
    close(noAnimate)
    {
        if (!this._closed)
        {
            this._closed = true
            if (noAnimate)
            {
                this.win.style.transform = 'scale(0)'
                this.win.style.display = 'none'
            }
            else
            {
                const ease = this.ease.add(this.win, { scale: 0 })
                ease.on('complete', () =>
                {
                    this.win.style.display = 'none'
                    this.emit('close', this);
                })
            }
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
        this.options.x = value
        this.win.style.left = value + 'px'
        this.emit('move-x', this)
        if (this.minimized)
        {
            this._lastMinimized.left = value
        }
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
        this.emit('move-y', this)
        if (this.minimized)
        {
            this._lastMinimized.top = value
        }
    }

    /**
     * width of window
     * @type {number}
     */
    get width() { return this.options.width || this.win.offsetWidth }
    set width(value)
    {
        if (value)
        {
            this.win.style.width = value + 'px'
            this.options.width = this.win.offsetWidth
        }
        else
        {
            this.win.style.width = 'auto'
            this.options.width = ''
        }
        this.emit('resize-width', this)
    }

    /**
     * height of window
     * @type {number}
     */
    get height() { return this.options.height || this.win.offsetHeight }
    set height(value)
    {
        if (value)
        {
            this.win.style.height = value + 'px'
            this.options.height = this.win.offsetHeight
        }
        else
        {
            this.win.style.height = 'auto'
            this.options.height = ''
        }
        this.emit('resize-height', this)
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
                    this.win.style.transform = ''
                    const x = this.minimized.x, y = this.minimized.y
                    this.minimized = false
                    this.move(x, y)
                    this.emit('minimize-restore', this)
                    this.overlay.style.display = 'none'
                }
                else
                {
                    this.transitioning = true
                    const ease = this.ease.add(this.win, { scaleX: 1, scaleY: 1, left: this.minimized.x, top: this.minimized.y })
                    ease.on('complete', () =>
                    {
                        const x = this.minimized.x, y = this.minimized.y
                        this.minimized = false
                        this.move(x, y)
                        this.emit('minimize-restore', this)
                        this.transitioning = false
                        this.overlay.style.display = 'none'
                    })
                }
            }
            else
            {
                const x = this.x
                const y = this.y
                const left = this._lastMinimized ? this._lastMinimized.left : this.x
                const top = this._lastMinimized ? this._lastMinimized.top : this.y
                const desired = this.options.minimizeSize
                const scaleX = desired / this.width
                const scaleY = desired / this.height
                if (noAnimate)
                {
                    this.win.style.transform = 'scale(1) scaleX(' + scaleX + ') scaleY(' + scaleY + ')'
                    this.win.style.left = left + 'px'
                    this.win.style.top = top + 'px'
                    this.minimized = { x, y, scaleX, scaleY }
                    this.emit('minimize', this)
                    this.overlay.style.display = 'block'
                    this._lastMinimized = { left, top }
                }
                else
                {
                    this.transitioning = true
                    const ease = this.ease.add(this.win, { left, top, scaleX, scaleY })
                    ease.on('complete', () =>
                    {
                        this.minimized = { x, y, scaleX, scaleY }
                        this.emit('minimize', this)
                        this.transitioning = false
                        this.overlay.style.display = 'block'
                        this._lastMinimized = { left, top }
                        this.move(left, top)
                    })
                }
            }
        }
    }

    /**
     * maximize the window
     */
    maximize(noAnimate)
    {
        if (this.wm._checkModal(this) && this.options.maximizable && !this.transitioning)
        {
            if (this.maximized)
            {
                if (noAnimate)
                {
                    this.x = this.maximized.x
                    this.y = this.maximized.y
                    this.width = this.maximized.width
                    this.height = this.maximized.height
                    this.maximized = null
                    this.emit('restore', this)
                }
                else
                {
                    this.transitioning = true
                    const ease = this.ease.add(this.win, { left: this.maximized.x, top: this.maximized.y, width: this.maximized.width, height: this.maximized.height })
                    ease.on('complete', () =>
                    {
                        this.x = this.maximized.x
                        this.y = this.maximized.y
                        this.width = this.maximized.width
                        this.height = this.maximized.height
                        this.maximized = null
                        this.transitioning = false
                        this.emit('restore', this)
                    })
                }
                this.buttons.maximize.style.backgroundImage = this.options.backgroundMaximizeButton
            }
            else
            {
                const x = this.x, y = this.y, width = this.win.offsetWidth, height = this.win.offsetHeight
                if (noAnimate)
                {
                    this.maximized = { x, y, width, height }
                    this.x = 0
                    this.y = 0
                    this.width = this.wm.overlay.offsetWidth + 'px'
                    this.height = this.wm.overlay.offsetHeight + 'px'
                    this.emit('maximize', this)
                }
                else
                {
                    this.transitioning = true
                    const ease = this.ease.add(this.win, { left: 0, top: 0, width: this.wm.overlay.offsetWidth, height: this.wm.overlay.offsetHeight })
                    ease.on('complete', () =>
                    {
                        this.x = 0
                        this.y = 0
                        this.width = this.wm.overlay.offsetWidth + 'px'
                        this.height = this.wm.overlay.offsetHeight + 'px'
                        this.maximized = { x, y, width, height }
                        this.transitioning = false
                    })
                    this.emit('maximize', this)
                }
                this.buttons.maximize.style.backgroundImage = this.options.backgroundRestoreButton
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
            data.maximized = { left: maximized.left, top: maximized.top, width: maximized.width, height: maximized.height }
        }
        const minimized = this.minimized
        if (minimized)
        {
            data.minimized = { x: this.minimized.x, y: this.minimized.y, scaleX: this.minimized.scaleX, scaleY: this.minimized.scaleY }
        }
        const lastMinimized = this._lastMinimized
        if (lastMinimized)
        {
            data.lastMinimized = { left: lastMinimized.left, top: lastMinimized.top }
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
        data.closed = this._closed
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
        }
        else if (this.maximized)
        {
            this.maximize(true)
        }
        if (data.minimized)
        {
            if (!this.minimized)
            {
                this.minimize(true)
            }
            this.minimized = data.minimized
        }
        else if (this.minimized)
        {
            this.minimize(true)
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
        if (data.closed)
        {
            this.close(true)
        }
        else if (this.closed)
        {
            this.open(true, true)
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
        this.emit('title-change', this)
    }


    /**
     * right coordinate of window
     * @type {number}
     */
    get right() { return this.x + this.width }
    set right(value)
    {
        this.x = value - this.width
    }

    /**
     * bottom coordinate of window
     * @type {number}
     */
    get bottom() { return this.y + this.height }
    set bottom(value)
    {
        this.y = value - this.height
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
            )
        }
        else
        {
            this.move(
                window.innerWidth / 2 - this.width / 2,
                window.innerHeight / 2 - this.height / 2
            )
        }
    }

    /**
     * Fires when window is maximized
     * @event Window#maximize
     * @type {Window}
     */

    /**
     * Fires when window is restored to normal after being maximized
     * @event Window#maximize-restore
     * @type {Window}
     */

    /**
     * Fires when window is restored to normal after being minimized
     * @event Window#minimize-restore
     * @type {Window}
     */

    /**
     * Fires when window opens
     * @event Window#open
     * @type {Window}
     */

    /**
     * Fires when window gains focus
     * @event Window#focus
     * @type {Window}
     */
    /**
     * Fires when window loses focus
     * @event Window#blur
     * @type {Window}
     */
    /**
     * Fires when window closes
     * @event Window#close
     * @type {Window}
     */

    /**
     * Fires when resize starts
     * @event Window#resize-start
     * @type {Window}
     */

    /**
     * Fires after resize completes
     * @event Window#resize-end
     * @type {Window}
     */

    /**
     * Fires during resizing
     * @event Window#resize
     * @type {Window}
     */

    /**
     * Fires when move starts
     * @event Window#move-start
     * @type {Window}
     */

    /**
     * Fires after move completes
     * @event Window#move-end
     * @type {Window}
     */

    /**
     * Fires during move
     * @event Window#move
     * @type {Window}
     */

    /**
     * Fires when width is changed
     * @event Window#resize-width
     * @type {Window}
     */

    /**
     * Fires when height is changed
     * @event Window#resize-height
     * @type {Window}
     */

    /**
     * Fires when x position of window is changed
     * @event Window#move-x
     * @type {Window}
     */


    /**
     * Fires when y position of window is changed
     * @event Window#move-y
     * @type {Window}
     */

    _createWindow()
    {
        /**
         * This is the top-level DOM element
         * @type {HTMLElement}
         * @readonly
         */
        this.win = html({
            parent: (this.wm ? this.wm.win : null), styles: {
                'display': 'none',
                'border-radius': this.options.borderRadius,
                'user-select': 'none',
                'overflow': 'hidden',
                'position': 'absolute',
                'min-width': this.options.minWidth,
                'min-height': this.options.minHeight,
                'box-shadow': this.options.shadow,
                'background-color': this.options.backgroundColorWindow,
                'left': this.options.x + 'px',
                'top': this.options.y + 'px',
                'width': isNaN(this.options.width) ? this.options.width : this.options.width + 'px',
                'height': isNaN(this.options.height) ? this.options.height : this.options.height + 'px'
            }
        })

        this.winBox = html({
            parent: this.win, styles: {
                'display': 'flex',
                'flex-direction': 'column',
                'width': '100%',
                'height': '100%',
                'min-height': this.options.minHeight
            }
        })
        this._createTitlebar()

        /**
         * This is the content DOM element. Use this to add content to the Window.
         * @type {HTMLElement}
         * @readonly
         */
        this.content = html({
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

        this.overlay = html({
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
            this._moving = {
                x: event.pageX - this.x,
                y: event.pageY - this.y
            }
            this.emit('move-start', this)
            this._moved = false
        }
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
            })
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
                'color': this.options.foregroundColorTitle
            }
            if (this.options.titleCenter)
            {
                winTitleStyles['justify-content'] = 'center'
            }
            else
            {
                winTitleStyles['padding-left'] = '8px'

            }
            this.winTitle = html({ parent: this.winTitlebar, type: 'span', html: this.options.title, styles: winTitleStyles })
            this._createButtons()

            if (this.options.movable)
            {
                this.winTitlebar.addEventListener('mousedown', (e) => this._downTitlebar(e))
                this.winTitlebar.addEventListener('touchstart', (e) => this._downTitlebar(e))
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
            this.buttons.minimize = html({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.minimize, () => this.minimize())
        }
        if (this.options.maximizable)
        {
            button.backgroundImage = this.options.backgroundMaximizeButton
            this.buttons.maximize = html({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
            clicked(this.buttons.maximize, () => this.maximize())
        }
        if (this.options.closable)
        {
            button.backgroundImage = this.options.backgroundCloseButton
            this.buttons.close = html({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button })
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
        this.resizeEdge = html({
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
                if (this.minimized)
                {
                    this._moved = true
                }
                this.move(
                    event.pageX - this._moving.x,
                    event.pageY - this._moving.y
                )
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
        this.emit('move-end', this)
    }

    _stopResize()
    {
        this._restore = this._resizing = null
        this.emit('resize-end', this)
    }

    _isTouchEvent(e)
    {
        return !!window.TouchEvent && (e instanceof window.TouchEvent)
    }

    _convertMoveEvent(e)
    {
        return this._isTouchEvent(e) ? e.changedTouches[0] : e
    }

    get z() { return parseInt(this.win.style.zIndex) }
    set z(value) { this.win.style.zIndex = value }
}

module.exports = Window
},{"./html":17,"clicked":3,"dom-ease":4,"eventemitter3":6,"exists":7}]},{},[1]);
