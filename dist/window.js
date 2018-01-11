'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Events = require('eventemitter3');
var clicked = require('clicked');
var Ease = require('../../dom-ease');
var exists = require('exists');

var html = require('./html');

var id = 0;

/**
 * Window class returned by WindowManager.createWindow()
 * @extends EventEmitter
 * @hideconstructor
 */

var Window = function (_Events) {
    _inherits(Window, _Events);

    /**
     * @param {WindowManager} wm
     * @param {object} options
     */
    function Window(wm, options) {
        _classCallCheck(this, Window);

        var _this = _possibleConstructorReturn(this, (Window.__proto__ || Object.getPrototypeOf(Window)).call(this));

        _this.wm = wm;

        _this.options = options;

        _this.id = exists(_this.options.id) ? _this.options.id : id++;

        _this._createWindow();
        _this._listeners();

        _this.active = false;
        _this.maximized = false;
        _this.minimized = false;

        _this._closed = true;
        _this._restore = null;
        _this._moving = null;
        _this._resizing = null;

        _this.ease = new Ease({ duration: _this.options.animateTime, ease: _this.options.ease });
        return _this;
    }

    /**
     * open the window
     * @param {boolean} [noFocus] do not focus window when opened
     * @param {boolean} [noAnimate] do not animate window when opened
     */


    _createClass(Window, [{
        key: 'open',
        value: function open(noFocus, noAnimate) {
            if (this._closed) {
                this.emit('open', this);
                this.win.style.display = 'block';
                if (!noAnimate) {
                    this.win.style.transform = 'scale(0)';
                    this.ease.add(this.win, { scale: 1 });
                }
                this._closed = false;
                if (!noFocus) {
                    this.focus();
                }
            }
        }

        /**
         * focus the window
         */

    }, {
        key: 'focus',
        value: function focus() {
            if (this.wm._checkModal(this)) {
                if (this.minimized) {
                    this.minimize();
                }
                this.active = true;
                this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarActive;
                this.emit('focus', this);
            }
        }

        /**
         * blur the window
         */

    }, {
        key: 'blur',
        value: function blur() {
            if (this.wm.modal !== this) {
                this.active = false;
                this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarInactive;
                this.emit('blur', this);
            }
        }

        /**
         * closes the window (can be reopened with open) if a reference is saved
         */

    }, {
        key: 'close',
        value: function close() {
            var _this2 = this;

            if (!this._closed) {
                this._closed = true;
                var ease = this.ease.add(this.win, { scale: 0 });
                ease.on('complete-scale', function () {
                    _this2.win.style.display = 'none';
                    _this2.emit('close', _this2);
                });
            }
        }

        /**
         * left coordinate
         * @type {number}
         */

    }, {
        key: 'resize',


        /**
         * resize the window
         * @param {number} width
         * @param {number} height
         */
        value: function resize(width, height) {
            this.width = width;
            this.height = height;
        }

        /**
         * move window
         * @param {number} x
         * @param {number} y
         */

    }, {
        key: 'move',
        value: function move(x, y) {
            this.x = x;
            this.y = y;
        }

        /**
         * minimize window
         * @param {boolean} noAnimate
         */

    }, {
        key: 'minimize',
        value: function minimize(noAnimate) {
            var _this3 = this;

            if (this.wm._checkModal(this) && this.options.minimizable && !this.transitioning) {
                if (this.minimized) {
                    if (noAnimate) {
                        this.win.style.transform = 'scaleX(1) scaleY(1)';
                        this.minimized = false;
                        this.emit('minimize-restore');
                        this.overlay.style.display = 'none';
                    } else {
                        this.transitioning = true;
                        var add = this.ease.add(this.win, { scaleX: 1, scaleY: 1, left: this.minimized.x, top: this.minimized.y });
                        add.on('complete-top', function () {
                            _this3.minimized = false;
                            _this3.emit('minimize-restore', _this3);
                            _this3.transitioning = false;
                            _this3.overlay.style.display = 'none';
                        });
                    }
                } else {
                    var x = this.x,
                        y = this.y;
                    var desired = this.options.minimizeSize;
                    var delta = void 0;
                    if (this._lastMinimized) {
                        delta = { left: this._lastMinimized.x, top: this._lastMinimized.y };
                    } else {
                        delta = { scaleX: desired / this.win.offsetWidth, scaleY: desired / this.win.offsetHeight };
                    }
                    if (noAnimate) {
                        this.win.style.transform = 'scale(1) scale(' + desired / this.win.offsetWidth + ',' + desired / this.win.offsetHeight + ')';
                        this.win.style.left = delta.left + 'px';
                        this.win.style.top = delta.top + 'px';
                        this.minimized = { x: x, y: y };
                        this.emit('minimize', this);
                        this.overlay.style.display = 'block';
                    } else {
                        this.transitioning = true;
                        var ease = this.ease.add(this.win, delta);
                        ease.on('complete-scaleY', function () {
                            _this3.minimized = { x: x, y: y };
                            _this3.emit('minimize', _this3);
                            _this3.transitioning = false;
                            _this3.overlay.style.display = 'block';
                        });
                    }
                }
            }
        }

        /**
         * maximize the window
         */

    }, {
        key: 'maximize',
        value: function maximize() {
            var _this4 = this;

            if (this.wm._checkModal(this) && this.options.maximizable && !this.transitioning) {
                this.transitioning = true;
                if (this.maximized) {
                    var ease = this.ease.add(this.win, { left: this.maximized.x, top: this.maximized.y, width: this.maximized.width, height: this.maximized.height });
                    ease.on('complete-height', function () {
                        _this4.options.x = _this4.maximized.x;
                        _this4.options.y = _this4.maximized.y;
                        _this4.options.width = _this4.maximized.width;
                        _this4.options.height = _this4.maximized.height;
                        _this4.maximized = null;
                        _this4.transitioning = false;
                    });
                    this.buttons.maximize.style.backgroundImage = this.options.backgroundMaximizeButton;
                    this.emit('restore', this);
                } else {
                    var x = this.x,
                        y = this.y,
                        width = this.win.offsetWidth,
                        height = this.win.offsetHeight;
                    var _ease = this.ease.add(this.win, { left: 0, top: 0, width: this.wm.overlay.offsetWidth, height: this.wm.overlay.offsetHeight });
                    _ease.on('complete-height', function () {
                        _this4.maximized = { x: x, y: y, width: width, height: height };
                        _this4.transitioning = false;
                    });
                    this.buttons.maximize.style.backgroundImage = this.options.backgroundRestoreButton;
                    this.emit('maximize', this);
                }
            }
        }

        /**
         * sends window to back of window-manager
         */

    }, {
        key: 'sendToBack',
        value: function sendToBack() {
            this.wm.sendToBack(this);
        }

        /**
         * send window to front of window-manager
         */

    }, {
        key: 'sendToFront',
        value: function sendToFront() {
            this.wm.sendToFront(this);
        }

        /**
         * save the state of the window
         * @return {object} data
         */

    }, {
        key: 'save',
        value: function save() {
            var data = {};
            var maximized = this.maximized;
            if (maximized) {
                data.maximized = { x: maximized.x, y: maximized.y, width: maximized.width, height: maximized.height };
            }
            var minimized = this.minimized;
            if (minimized) {
                data.minimized = { x: this.minimized.x, y: this.minimized.y };
            }
            var lastMinimized = this._lastMinimized;
            if (lastMinimized) {
                data.lastMinimized = { x: lastMinimized.x, y: lastMinimized.y };
            }
            data.x = this.x;
            data.y = this.y;
            if (exists(this.options.width)) {
                data.width = this.options.width;
            }
            if (exists(this.options.height)) {
                data.height = this.options.height;
            }
            return data;
        }

        /**
         * return the state of the window
         * @param {object} data from save()
         */

    }, {
        key: 'load',
        value: function load(data) {
            if (data.maximized) {
                if (!this.maximized) {
                    this.maximize(true);
                }
                this.maximized = data.maximized;
            }
            if (data.minimized) {
                if (!this.minimized) {
                    this.minimize(true);
                }
                this.minimized = data.minimized;
            }
            if (data.lastMinimized) {
                this._lastMinimized = data.lastMinimized;
            }
            this.x = data.x;
            this.y = data.y;
            if (exists(data.width)) {
                this.width = data.width;
            } else {
                this.win.style.width = 'auto';
            }
            if (exists(data.height)) {
                this.height = data.height;
            } else {
                this.win.style.height = 'auto';
            }
        }

        /**
         * change title
         * @type {string}
         */

    }, {
        key: '_createWindow',


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

        value: function _createWindow() {
            var _this5 = this;

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
            });

            this.winBox = html.create({
                parent: this.win, styles: {
                    'display': 'flex',
                    'flex-direction': 'column',
                    'width': '100%',
                    'height': '100%',
                    'min-height': this.options.minHeight
                }
            });
            this._createTitlebar();

            this.content = html.create({
                parent: this.winBox, type: 'section', styles: {
                    'display': 'block',
                    'flex': 1,
                    'min-height': this.minHeight,
                    'overflow-x': 'hidden',
                    'overflow-y': 'auto'
                }
            });

            if (this.options.resizable) {
                this._createResize();
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
            });
            this.overlay.addEventListener('mousedown', function (e) {
                _this5._downTitlebar(e);e.stopPropagation();
            });
            this.overlay.addEventListener('touchstart', function (e) {
                _this5._downTitlebar(e);e.stopPropagation();
            });
        }
    }, {
        key: '_downTitlebar',
        value: function _downTitlebar(e) {
            if (!this.transitioning) {
                var event = this._convertMoveEvent(e);
                this._moving = this._toLocal({
                    x: event.pageX,
                    y: event.pageY
                });
                this.emit('move-start', this);
                this._moved = false;
            }
        }
    }, {
        key: '_createTitlebar',
        value: function _createTitlebar() {
            var _styles,
                _this6 = this;

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
                    'overflow': 'hidden'
                }
            });
            this.winTitle = html.create({
                parent: this.winTitlebar, type: 'span', html: this.options.title, styles: (_styles = {
                    'user-select': 'none',
                    'flex': 1,
                    'display': 'flex',
                    'flex-direction': 'row',
                    'align-items': 'center'
                }, _defineProperty(_styles, 'user-select', 'none'), _defineProperty(_styles, 'cursor', 'default'), _defineProperty(_styles, 'padding', 0), _defineProperty(_styles, 'padding-left', '8px'), _defineProperty(_styles, 'margin', 0), _defineProperty(_styles, 'font-size', '16px'), _defineProperty(_styles, 'font-weight', 400), _defineProperty(_styles, 'color', this.options.foregroundColorTitle), _styles)
            });
            this._createButtons();

            if (this.options.movable) {
                this.winTitlebar.addEventListener('mousedown', function (e) {
                    return _this6._downTitlebar(e);
                });
                this.winTitlebar.addEventListener('touchstart', function (e) {
                    return _this6._downTitlebar(e);
                });
            }
        }
    }, {
        key: '_createButtons',
        value: function _createButtons() {
            var _this7 = this;

            this.winButtonGroup = html.create({
                parent: this.winTitlebar, styles: {
                    'display': 'flex',
                    'flex-direction': 'row',
                    'align-items': 'center',
                    'padding-left': '2px'
                }
            });
            var button = {
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
            };
            this.buttons = {};
            if (this.options.minimizable) {
                button.backgroundImage = this.options.backgroundMinimizeButton;
                this.buttons.minimize = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button });
                clicked(this.buttons.minimize, function () {
                    return _this7.minimize();
                });
            }
            if (this.options.maximizable) {
                button.backgroundImage = this.options.backgroundMaximizeButton;
                this.buttons.maximize = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button });
                clicked(this.buttons.maximize, function () {
                    return _this7.maximize();
                });
            }
            if (this.options.closable) {
                button.backgroundImage = this.options.backgroundCloseButton;
                this.buttons.close = html.create({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button });
                clicked(this.buttons.close, function () {
                    return _this7.close();
                });
            }

            var _loop = function _loop(key) {
                var button = _this7.buttons[key];
                button.addEventListener('mousemove', function () {
                    button.style.opacity = 1;
                });
                button.addEventListener('mouseout', function () {
                    button.style.opacity = 0.7;
                });
            };

            for (var key in this.buttons) {
                _loop(key);
            }
        }
    }, {
        key: '_createResize',
        value: function _createResize() {
            var _this8 = this;

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
            });
            var down = function down(e) {
                if (_this8.wm._checkModal(_this8)) {
                    var event = _this8._convertMoveEvent(e);
                    var width = _this8.width || _this8.win.offsetWidth;
                    var height = _this8.height || _this8.win.offsetHeight;
                    _this8._resizing = {
                        width: width - event.pageX,
                        height: height - event.pageY
                    };
                    _this8.emit('resize-start');
                    e.preventDefault();
                }
            };
            this.resizeEdge.addEventListener('mousedown', down);
            this.resizeEdge.addEventListener('touchstart', down);
        }
    }, {
        key: '_move',
        value: function _move(e) {
            if (this.wm._checkModal(this)) {
                var event = this._convertMoveEvent(e);

                if (!this._isTouchEvent(e) && e.which !== 1) {
                    this._moving && this._stopMove();
                    this._resizing && this._stopResize();
                }
                if (this._moving) {
                    this.move(event.pageX - this._moving.x, event.pageY - this._moving.y);
                    if (this.minimized) {
                        e.preventDefault();
                        this._lastMinimized = { x: this.win.offsetLeft, y: this.win.offsetTop };
                        this._moved = true;
                    }
                    this.emit('move', this);
                    e.preventDefault();
                }

                if (this._resizing) {
                    this.resize(event.pageX + this._resizing.width, event.pageY + this._resizing.height);
                    this.maximized = null;
                    this.emit('resize', this);
                    e.preventDefault();
                }
            }
        }
    }, {
        key: '_up',
        value: function _up() {
            if (this._moving) {
                if (this.minimized) {
                    if (!this._moved) {
                        this.minimize();
                    }
                }
                this._stopMove();
            }
            this._resizing && this._stopResize();
        }
    }, {
        key: '_listeners',
        value: function _listeners() {
            var _this9 = this;

            this.win.addEventListener('mousedown', function () {
                return _this9.focus();
            });
            this.win.addEventListener('touchstart', function () {
                return _this9.focus();
            });
        }
    }, {
        key: '_stopMove',
        value: function _stopMove() {
            this._moving = null;
            this.emit('move-end');
        }
    }, {
        key: '_stopResize',
        value: function _stopResize() {
            this._restore = this._resizing = null;
            this.emit('resize-end');
        }
    }, {
        key: '_isTouchEvent',
        value: function _isTouchEvent(e) {
            return !!window.TouchEvent && e instanceof window.TouchEvent;
        }
    }, {
        key: '_convertMoveEvent',
        value: function _convertMoveEvent(e) {
            return this._isTouchEvent(e) ? e.changedTouches[0] : e;
        }
    }, {
        key: '_toLocal',
        value: function _toLocal(coord) {
            return {
                x: coord.x - this.x,
                y: coord.y - this.y
            };
        }
    }, {
        key: 'x',
        get: function get() {
            return this.options.x;
        },
        set: function set(value) {
            this.options.x = value;
            this.win.style.left = value + 'px';
        }

        /**
         * top coordinate
         * @type {number}
         */

    }, {
        key: 'y',
        get: function get() {
            return this.options.y;
        },
        set: function set(value) {
            this.options.y = value;
            this.win.style.top = value + 'px';
        }

        /**
         * width of window
         * @type {number}
         */

    }, {
        key: 'width',
        get: function get() {
            return this.options.width || this.win.offsetWidth;
        },
        set: function set(value) {
            this.options.width = value;
            if (value) {
                this.win.style.width = value + 'px';
            } else {
                this.win.style.width = 'auto';
            }
        }

        /**
         * height of window
         * @type {number}
         */

    }, {
        key: 'height',
        get: function get() {
            return this.options.height || this.win.offsetHeight;
        },
        set: function set(value) {
            this.options.height = value;
            if (value) {
                this.win.style.height = value + 'px';
            } else {
                this.win.style.height = 'auto';
            }
        }
    }, {
        key: 'title',
        get: function get() {
            return this._title;
        },
        set: function set(value) {
            this.winTitle.innerText = value;
        }

        /**
         * right coordinate of window
         * @type {number}
         */

    }, {
        key: 'right',
        get: function get() {
            return this.x + this.width;
        },
        set: function set(value) {
            this.x = value - this.width;
        }

        /**
         * bottom coordinate of window
         * @type {number}
         */

    }, {
        key: 'bottom',
        get: function get() {
            return this.y + this.height;
        },
        set: function set(value) {
            this.y = value - this.height;
        }
    }, {
        key: 'z',
        get: function get() {
            return parseInt(this.win.style.zIndex);
        },
        set: function set(value) {
            this.win.style.zIndex = value;
        }
    }]);

    return Window;
}(Events);

module.exports = Window;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm92ZXJsYXkiLCJzY2FsZVgiLCJzY2FsZVkiLCJsZWZ0IiwidG9wIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsImRlbHRhIiwiX2xhc3RNaW5pbWl6ZWQiLCJvZmZzZXRXaWR0aCIsIm9mZnNldEhlaWdodCIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwiYmFja2dyb3VuZFJlc3RvcmVCdXR0b24iLCJzZW5kVG9CYWNrIiwic2VuZFRvRnJvbnQiLCJkYXRhIiwibGFzdE1pbmltaXplZCIsImNyZWF0ZSIsInBhcmVudCIsInN0eWxlcyIsImJvcmRlclJhZGl1cyIsIm1pbldpZHRoIiwibWluSGVpZ2h0Iiwic2hhZG93IiwiYmFja2dyb3VuZENvbG9yV2luZG93Iiwid2luQm94IiwiX2NyZWF0ZVRpdGxlYmFyIiwiY29udGVudCIsInR5cGUiLCJyZXNpemFibGUiLCJfY3JlYXRlUmVzaXplIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJfZG93blRpdGxlYmFyIiwic3RvcFByb3BhZ2F0aW9uIiwiZXZlbnQiLCJfY29udmVydE1vdmVFdmVudCIsIl90b0xvY2FsIiwicGFnZVgiLCJwYWdlWSIsIl9tb3ZlZCIsInRpdGxlYmFySGVpZ2h0Iiwid2luVGl0bGUiLCJ0aXRsZSIsImZvcmVncm91bmRDb2xvclRpdGxlIiwiX2NyZWF0ZUJ1dHRvbnMiLCJtb3ZhYmxlIiwid2luQnV0dG9uR3JvdXAiLCJidXR0b24iLCJmb3JlZ3JvdW5kQ29sb3JCdXR0b24iLCJiYWNrZ3JvdW5kTWluaW1pemVCdXR0b24iLCJjbG9zYWJsZSIsImJhY2tncm91bmRDbG9zZUJ1dHRvbiIsImNsb3NlIiwia2V5Iiwib3BhY2l0eSIsInJlc2l6ZUVkZ2UiLCJiYWNrZ3JvdW5kUmVzaXplIiwiZG93biIsInByZXZlbnREZWZhdWx0IiwiX2lzVG91Y2hFdmVudCIsIndoaWNoIiwiX3N0b3BNb3ZlIiwiX3N0b3BSZXNpemUiLCJtb3ZlIiwib2Zmc2V0TGVmdCIsIm9mZnNldFRvcCIsInJlc2l6ZSIsIndpbmRvdyIsIlRvdWNoRXZlbnQiLCJjaGFuZ2VkVG91Y2hlcyIsImNvb3JkIiwidmFsdWUiLCJfdGl0bGUiLCJpbm5lclRleHQiLCJwYXJzZUludCIsInpJbmRleCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLElBQU1BLFNBQVNDLFFBQVEsZUFBUixDQUFmO0FBQ0EsSUFBTUMsVUFBVUQsUUFBUSxTQUFSLENBQWhCO0FBQ0EsSUFBTUUsT0FBT0YsUUFBUSxnQkFBUixDQUFiO0FBQ0EsSUFBTUcsU0FBU0gsUUFBUSxRQUFSLENBQWY7O0FBRUEsSUFBTUksT0FBT0osUUFBUSxRQUFSLENBQWI7O0FBRUEsSUFBSUss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OztBQTR4QnJCK0gsT0FBT0MsT0FBUCxHQUFpQnpILE1BQWpCIiwiZmlsZSI6IndpbmRvdy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKVxyXG5jb25zdCBjbGlja2VkID0gcmVxdWlyZSgnY2xpY2tlZCcpXHJcbmNvbnN0IEVhc2UgPSByZXF1aXJlKCcuLi8uLi9kb20tZWFzZScpXHJcbmNvbnN0IGV4aXN0cyA9IHJlcXVpcmUoJ2V4aXN0cycpXHJcblxyXG5jb25zdCBodG1sID0gcmVxdWlyZSgnLi9odG1sJylcclxuXHJcbmxldCBpZCA9IDBcclxuXHJcbi8qKlxyXG4gKiBXaW5kb3cgY2xhc3MgcmV0dXJuZWQgYnkgV2luZG93TWFuYWdlci5jcmVhdGVXaW5kb3coKVxyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcclxuICogQGhpZGVjb25zdHJ1Y3RvclxyXG4gKi9cclxuY2xhc3MgV2luZG93IGV4dGVuZHMgRXZlbnRzXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtXaW5kb3dNYW5hZ2VyfSB3bVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iod20sIG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIHRoaXMud20gPSB3bVxyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zXHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBleGlzdHModGhpcy5vcHRpb25zLmlkKSA/IHRoaXMub3B0aW9ucy5pZCA6IGlkKytcclxuXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlV2luZG93KClcclxuICAgICAgICB0aGlzLl9saXN0ZW5lcnMoKVxyXG5cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuXHJcbiAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nID0gbnVsbFxyXG5cclxuICAgICAgICB0aGlzLmVhc2UgPSBuZXcgRWFzZSh7IGR1cmF0aW9uOiB0aGlzLm9wdGlvbnMuYW5pbWF0ZVRpbWUsIGVhc2U6IHRoaXMub3B0aW9ucy5lYXNlIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBvcGVuIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vRm9jdXNdIGRvIG5vdCBmb2N1cyB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vQW5pbWF0ZV0gZG8gbm90IGFuaW1hdGUgd2luZG93IHdoZW4gb3BlbmVkXHJcbiAgICAgKi9cclxuICAgIG9wZW4obm9Gb2N1cywgbm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ29wZW4nLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICBpZiAoIW5vQW5pbWF0ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDApJ1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZTogMSB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlXHJcbiAgICAgICAgICAgIGlmICghbm9Gb2N1cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mb2N1cygpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBmb2N1cyB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGZvY3VzKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvclRpdGxlYmFyQWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnZm9jdXMnLCB0aGlzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGJsdXIgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBibHVyKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5tb2RhbCAhPT0gdGhpcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2JsdXInLCB0aGlzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNsb3NlcyB0aGUgd2luZG93IChjYW4gYmUgcmVvcGVuZWQgd2l0aCBvcGVuKSBpZiBhIHJlZmVyZW5jZSBpcyBzYXZlZFxyXG4gICAgICovXHJcbiAgICBjbG9zZSgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAwIH0pXHJcbiAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlLXNjYWxlJywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjbG9zZScsIHRoaXMpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGxlZnQgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHgoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueCB9XHJcbiAgICBzZXQgeCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueCA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUubGVmdCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdG9wIGNvb3JkaW5hdGVcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB5KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLnkgfVxyXG4gICAgc2V0IHkodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnkgPSB2YWx1ZVxyXG4gICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogd2lkdGggb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgd2lkdGgoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMud2lkdGggfHwgdGhpcy53aW4ub2Zmc2V0V2lkdGggfVxyXG4gICAgc2V0IHdpZHRoKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9IHZhbHVlXHJcbiAgICAgICAgaWYgKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSB2YWx1ZSArICdweCdcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWlnaHQgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgaGVpZ2h0KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHQgfVxyXG4gICAgc2V0IGhlaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gdmFsdWVcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSB2YWx1ZSArICdweCdcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVzaXplIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxyXG4gICAgICovXHJcbiAgICByZXNpemUod2lkdGgsIGhlaWdodClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGhcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbW92ZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geVxyXG4gICAgICovXHJcbiAgICBtb3ZlKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy54ID0geFxyXG4gICAgICAgIHRoaXMueSA9IHlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1pbmltaXplIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBub0FuaW1hdGVcclxuICAgICAqL1xyXG4gICAgbWluaW1pemUobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZVgoMSkgc2NhbGVZKDEpJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFkZCA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGVYOiAxLCBzY2FsZVk6IDEsIGxlZnQ6IHRoaXMubWluaW1pemVkLngsIHRvcDogdGhpcy5taW5pbWl6ZWQueSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGFkZC5vbignY29tcGxldGUtdG9wJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZS1yZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueCwgeSA9IHRoaXMueVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVzaXJlZCA9IHRoaXMub3B0aW9ucy5taW5pbWl6ZVNpemVcclxuICAgICAgICAgICAgICAgIGxldCBkZWx0YVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2xhc3RNaW5pbWl6ZWQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSB7IGxlZnQ6IHRoaXMuX2xhc3RNaW5pbWl6ZWQueCwgdG9wOiB0aGlzLl9sYXN0TWluaW1pemVkLnkgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhID0geyBzY2FsZVg6IChkZXNpcmVkIC8gdGhpcy53aW4ub2Zmc2V0V2lkdGgpLCBzY2FsZVk6IChkZXNpcmVkIC8gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0KSB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgxKSBzY2FsZSgnICsgKGRlc2lyZWQgLyB0aGlzLndpbi5vZmZzZXRXaWR0aCkgKyAnLCcgKyAoZGVzaXJlZCAvIHRoaXMud2luLm9mZnNldEhlaWdodCkgKyAnKSdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gZGVsdGEubGVmdCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50b3AgPSBkZWx0YS50b3AgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHkgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgZGVsdGEpXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUtc2NhbGVZJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0geyB4LCB5IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtYXhpbWl6ZSB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIG1heGltaXplKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSAmJiB0aGlzLm9wdGlvbnMubWF4aW1pemFibGUgJiYgIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiB0aGlzLm1heGltaXplZC54LCB0b3A6IHRoaXMubWF4aW1pemVkLnksIHdpZHRoOiB0aGlzLm1heGltaXplZC53aWR0aCwgaGVpZ2h0OiB0aGlzLm1heGltaXplZC5oZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlLWhlaWdodCcsICgpID0+XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnggPSB0aGlzLm1heGltaXplZC54XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnkgPSB0aGlzLm1heGltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gdGhpcy5tYXhpbWl6ZWQud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNYXhpbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLngsIHkgPSB0aGlzLnksIHdpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGgsIGhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdDogMCwgdG9wOiAwLCB3aWR0aDogdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoLCBoZWlnaHQ6IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlLWhlaWdodCcsICgpID0+XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvblxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtYXhpbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kcyB3aW5kb3cgdG8gYmFjayBvZiB3aW5kb3ctbWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzZW5kVG9CYWNrKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndtLnNlbmRUb0JhY2sodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmQgd2luZG93IHRvIGZyb250IG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0Zyb250KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndtLnNlbmRUb0Zyb250KHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzYXZlIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IGRhdGFcclxuICAgICAqL1xyXG4gICAgc2F2ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHt9XHJcbiAgICAgICAgY29uc3QgbWF4aW1pemVkID0gdGhpcy5tYXhpbWl6ZWRcclxuICAgICAgICBpZiAobWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5tYXhpbWl6ZWQgPSB7IHg6IG1heGltaXplZC54LCB5OiBtYXhpbWl6ZWQueSwgd2lkdGg6IG1heGltaXplZC53aWR0aCwgaGVpZ2h0OiBtYXhpbWl6ZWQuaGVpZ2h0IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbWluaW1pemVkID0gdGhpcy5taW5pbWl6ZWRcclxuICAgICAgICBpZiAobWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5taW5pbWl6ZWQgPSB7IHg6IHRoaXMubWluaW1pemVkLngsIHk6IHRoaXMubWluaW1pemVkLnkgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXN0TWluaW1pemVkID0gdGhpcy5fbGFzdE1pbmltaXplZFxyXG4gICAgICAgIGlmIChsYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5sYXN0TWluaW1pemVkID0geyB4OiBsYXN0TWluaW1pemVkLngsIHk6IGxhc3RNaW5pbWl6ZWQueSB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEueCA9IHRoaXMueFxyXG4gICAgICAgIGRhdGEueSA9IHRoaXMueVxyXG4gICAgICAgIGlmIChleGlzdHModGhpcy5vcHRpb25zLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEud2lkdGggPSB0aGlzLm9wdGlvbnMud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMuaGVpZ2h0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEuaGVpZ2h0ID0gdGhpcy5vcHRpb25zLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJuIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBmcm9tIHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGRhdGEubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gZGF0YS5tYXhpbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZGF0YS5taW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSBkYXRhLmxhc3RNaW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy54ID0gZGF0YS54XHJcbiAgICAgICAgdGhpcy55ID0gZGF0YS55XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSBkYXRhLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHMoZGF0YS5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBkYXRhLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGFuZ2UgdGl0bGVcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldCB0aXRsZSgpIHsgcmV0dXJuIHRoaXMuX3RpdGxlIH1cclxuICAgIHNldCB0aXRsZSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlLmlubmVyVGV4dCA9IHZhbHVlXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmlnaHQgY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCByaWdodCgpIHsgcmV0dXJuIHRoaXMueCArIHRoaXMud2lkdGggfVxyXG4gICAgc2V0IHJpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHZhbHVlIC0gdGhpcy53aWR0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYm90dG9tIGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgYm90dG9tKCkgeyByZXR1cm4gdGhpcy55ICsgdGhpcy5oZWlnaHQgfVxyXG4gICAgc2V0IGJvdHRvbSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnkgPSB2YWx1ZSAtIHRoaXMuaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIHJlc3RvcmVkIHRvIG5vcm1hbCBhZnRlciBiZWluZyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemUtcmVzdG9yZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1pbmltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtaW5pbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBvcGVuc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNvcGVuXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBnYWlucyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNmb2N1c1xyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBsb3NlcyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNibHVyXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGNsb3Nlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNjbG9zZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiByZXNpemUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgcmVzaXplIGNvbXBsZXRlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgcmVzaXppbmdcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIG1vdmUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtc3RhcnRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGFmdGVyIG1vdmUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgbW92ZVxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgX2NyZWF0ZVdpbmRvdygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4gPSBodG1sLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53bS53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXJhZGl1cyc6IHRoaXMub3B0aW9ucy5ib3JkZXJSYWRpdXMsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbWluLXdpZHRoJzogdGhpcy5vcHRpb25zLm1pbldpZHRoLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ2JveC1zaGFkb3cnOiB0aGlzLm9wdGlvbnMuc2hhZG93LFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yV2luZG93LFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiB0aGlzLm9wdGlvbnMueCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiB0aGlzLm9wdGlvbnMueSxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IHRoaXMub3B0aW9ucy53aWR0aCxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiB0aGlzLm9wdGlvbnMuaGVpZ2h0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLndpbkJveCA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdjb2x1bW4nLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLm1pbkhlaWdodFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLl9jcmVhdGVUaXRsZWJhcigpXHJcblxyXG4gICAgICAgIHRoaXMuY29udGVudCA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ3NlY3Rpb24nLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2Jsb2NrJyxcclxuICAgICAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteCc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXknOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVzaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUmVzaXplKClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMub3ZlcmxheSA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IDAsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7IHRoaXMuX2Rvd25UaXRsZWJhcihlKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgX2Rvd25UaXRsZWJhcihlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmluZyA9IHRoaXMuX3RvTG9jYWwoe1xyXG4gICAgICAgICAgICAgICAgeDogZXZlbnQucGFnZVgsXHJcbiAgICAgICAgICAgICAgICB5OiBldmVudC5wYWdlWVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUtc3RhcnQnLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVUaXRsZWJhcigpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5UaXRsZWJhciA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2hlYWRlcicsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IHRoaXMub3B0aW9ucy50aXRsZWJhckhlaWdodCxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6ICcwIDhweCcsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy53aW5UaXRsZSA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpblRpdGxlYmFyLCB0eXBlOiAnc3BhbicsIGh0bWw6IHRoaXMub3B0aW9ucy50aXRsZSwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnY3Vyc29yJzogJ2RlZmF1bHQnLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICc4cHgnLFxyXG4gICAgICAgICAgICAgICAgJ21hcmdpbic6IDAsXHJcbiAgICAgICAgICAgICAgICAnZm9udC1zaXplJzogJzE2cHgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZvbnQtd2VpZ2h0JzogNDAwLFxyXG4gICAgICAgICAgICAgICAgJ2NvbG9yJzogdGhpcy5vcHRpb25zLmZvcmVncm91bmRDb2xvclRpdGxlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZUJ1dHRvbnMoKVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1vdmFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVCdXR0b25zKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbkJ1dHRvbkdyb3VwID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICcycHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHtcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnaW5saW5lLWJsb2NrJyxcclxuICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAnNXB4JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnd2lkdGgnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdoZWlnaHQnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtc2l6ZSc6ICdjb3ZlcicsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXJlcGVhdCc6ICduby1yZXBlYXQnLFxyXG4gICAgICAgICAgICAnb3BhY2l0eSc6IC43LFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yQnV0dG9uLFxyXG4gICAgICAgICAgICAnb3V0bGluZSc6IDBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idXR0b25zID0ge31cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pbmltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWluaW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1pbmltaXplID0gaHRtbC5jcmVhdGUoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWluaW1pemUsICgpID0+IHRoaXMubWluaW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSA9IGh0bWwuY3JlYXRlKHsgcGFyZW50OiB0aGlzLndpbkJ1dHRvbkdyb3VwLCBodG1sOiAnJm5ic3A7JywgdHlwZTogJ2J1dHRvbicsIHN0eWxlczogYnV0dG9uIH0pXHJcbiAgICAgICAgICAgIGNsaWNrZWQodGhpcy5idXR0b25zLm1heGltaXplLCAoKSA9PiB0aGlzLm1heGltaXplKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBidXR0b24uYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDbG9zZUJ1dHRvblxyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMuY2xvc2UgPSBodG1sLmNyZWF0ZSh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5jbG9zZSwgKCkgPT4gdGhpcy5jbG9zZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5idXR0b25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5idXR0b25zW2tleV1cclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDAuN1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UgPSBodG1sLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdidXR0b24nLCBodG1sOiAnJm5ic3AnLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnYm90dG9tJzogMCxcclxuICAgICAgICAgICAgICAgICdyaWdodCc6ICc0cHgnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnc2UtcmVzaXplJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXNpemUsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzE1cHgnLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGRvd24gPSAoZSkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemluZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggLSBldmVudC5wYWdlWCxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAtIGV2ZW50LnBhZ2VZXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1zdGFydCcpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZG93bilcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGRvd24pXHJcbiAgICB9XHJcblxyXG4gICAgX21vdmUoZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1RvdWNoRXZlbnQoZSkgJiYgZS53aGljaCAhPT0gMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW92aW5nICYmIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCAtIHRoaXMuX21vdmluZy54LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZIC0gdGhpcy5fbW92aW5nLnlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0geyB4OiB0aGlzLndpbi5vZmZzZXRMZWZ0LCB5OiB0aGlzLndpbi5vZmZzZXRUb3AgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdmVkID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtb3ZlJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fcmVzaXppbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYICsgdGhpcy5fcmVzaXppbmcud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgKyB0aGlzLl9yZXNpemluZy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3VwKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5fbW92aW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vdmVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICB9XHJcblxyXG4gICAgX2xpc3RlbmVycygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BNb3ZlKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLWVuZCcpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSB0aGlzLl9yZXNpemluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1lbmQnKVxyXG4gICAgfVxyXG5cclxuICAgIF9pc1RvdWNoRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuVG91Y2hFdmVudCAmJiAoZSBpbnN0YW5jZW9mIHdpbmRvdy5Ub3VjaEV2ZW50KVxyXG4gICAgfVxyXG5cclxuICAgIF9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVG91Y2hFdmVudChlKSA/IGUuY2hhbmdlZFRvdWNoZXNbMF0gOiBlXHJcbiAgICB9XHJcblxyXG4gICAgX3RvTG9jYWwoY29vcmQpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgeDogY29vcmQueCAtIHRoaXMueCxcclxuICAgICAgICAgICAgeTogY29vcmQueSAtIHRoaXMueVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgeigpIHsgcmV0dXJuIHBhcnNlSW50KHRoaXMud2luLnN0eWxlLnpJbmRleCkgfVxyXG4gICAgc2V0IHoodmFsdWUpIHsgdGhpcy53aW4uc3R5bGUuekluZGV4ID0gdmFsdWUgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdpbmRvdyJdfQ==