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
 */

var Window = function (_Events) {
    _inherits(Window, _Events);

    /**
     * @private
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm92ZXJsYXkiLCJzY2FsZVgiLCJzY2FsZVkiLCJsZWZ0IiwidG9wIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsImRlbHRhIiwiX2xhc3RNaW5pbWl6ZWQiLCJvZmZzZXRXaWR0aCIsIm9mZnNldEhlaWdodCIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwiYmFja2dyb3VuZFJlc3RvcmVCdXR0b24iLCJzZW5kVG9CYWNrIiwic2VuZFRvRnJvbnQiLCJkYXRhIiwibGFzdE1pbmltaXplZCIsImNyZWF0ZSIsInBhcmVudCIsInN0eWxlcyIsImJvcmRlclJhZGl1cyIsIm1pbldpZHRoIiwibWluSGVpZ2h0Iiwic2hhZG93IiwiYmFja2dyb3VuZENvbG9yV2luZG93Iiwid2luQm94IiwiX2NyZWF0ZVRpdGxlYmFyIiwiY29udGVudCIsInR5cGUiLCJyZXNpemFibGUiLCJfY3JlYXRlUmVzaXplIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJfZG93blRpdGxlYmFyIiwic3RvcFByb3BhZ2F0aW9uIiwiZXZlbnQiLCJfY29udmVydE1vdmVFdmVudCIsIl90b0xvY2FsIiwicGFnZVgiLCJwYWdlWSIsIl9tb3ZlZCIsInRpdGxlYmFySGVpZ2h0Iiwid2luVGl0bGUiLCJ0aXRsZSIsImZvcmVncm91bmRDb2xvclRpdGxlIiwiX2NyZWF0ZUJ1dHRvbnMiLCJtb3ZhYmxlIiwid2luQnV0dG9uR3JvdXAiLCJidXR0b24iLCJmb3JlZ3JvdW5kQ29sb3JCdXR0b24iLCJiYWNrZ3JvdW5kTWluaW1pemVCdXR0b24iLCJjbG9zYWJsZSIsImJhY2tncm91bmRDbG9zZUJ1dHRvbiIsImNsb3NlIiwia2V5Iiwib3BhY2l0eSIsInJlc2l6ZUVkZ2UiLCJiYWNrZ3JvdW5kUmVzaXplIiwiZG93biIsInByZXZlbnREZWZhdWx0IiwiX2lzVG91Y2hFdmVudCIsIndoaWNoIiwiX3N0b3BNb3ZlIiwiX3N0b3BSZXNpemUiLCJtb3ZlIiwib2Zmc2V0TGVmdCIsIm9mZnNldFRvcCIsInJlc2l6ZSIsIndpbmRvdyIsIlRvdWNoRXZlbnQiLCJjaGFuZ2VkVG91Y2hlcyIsImNvb3JkIiwidmFsdWUiLCJfdGl0bGUiLCJpbm5lclRleHQiLCJwYXJzZUludCIsInpJbmRleCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLElBQU1BLFNBQVNDLFFBQVEsZUFBUixDQUFmO0FBQ0EsSUFBTUMsVUFBVUQsUUFBUSxTQUFSLENBQWhCO0FBQ0EsSUFBTUUsT0FBT0YsUUFBUSxnQkFBUixDQUFiO0FBQ0EsSUFBTUcsU0FBU0gsUUFBUSxRQUFSLENBQWY7O0FBRUEsSUFBTUksT0FBT0osUUFBUSxRQUFSLENBQWI7O0FBRUEsSUFBSUss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OztBQTZ4QnJCK0gsT0FBT0MsT0FBUCxHQUFpQnpILE1BQWpCIiwiZmlsZSI6IndpbmRvdy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKVxyXG5jb25zdCBjbGlja2VkID0gcmVxdWlyZSgnY2xpY2tlZCcpXHJcbmNvbnN0IEVhc2UgPSByZXF1aXJlKCcuLi8uLi9kb20tZWFzZScpXHJcbmNvbnN0IGV4aXN0cyA9IHJlcXVpcmUoJ2V4aXN0cycpXHJcblxyXG5jb25zdCBodG1sID0gcmVxdWlyZSgnLi9odG1sJylcclxuXHJcbmxldCBpZCA9IDBcclxuXHJcbi8qKlxyXG4gKiBXaW5kb3cgY2xhc3MgcmV0dXJuZWQgYnkgV2luZG93TWFuYWdlci5jcmVhdGVXaW5kb3coKVxyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcclxuICovXHJcbmNsYXNzIFdpbmRvdyBleHRlbmRzIEV2ZW50c1xyXG57XHJcbiAgICAvKipcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd01hbmFnZXJ9IHdtXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih3bSwgb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgdGhpcy53bSA9IHdtXHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGV4aXN0cyh0aGlzLm9wdGlvbnMuaWQpID8gdGhpcy5vcHRpb25zLmlkIDogaWQrK1xyXG5cclxuICAgICAgICB0aGlzLl9jcmVhdGVXaW5kb3coKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVycygpXHJcblxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICB0aGlzLm1heGltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG5cclxuICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IG51bGxcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcblxyXG4gICAgICAgIHRoaXMuZWFzZSA9IG5ldyBFYXNlKHsgZHVyYXRpb246IHRoaXMub3B0aW9ucy5hbmltYXRlVGltZSwgZWFzZTogdGhpcy5vcHRpb25zLmVhc2UgfSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG9wZW4gdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9Gb2N1c10gZG8gbm90IGZvY3VzIHdpbmRvdyB3aGVuIG9wZW5lZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9BbmltYXRlXSBkbyBub3QgYW5pbWF0ZSB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqL1xyXG4gICAgb3Blbihub0ZvY3VzLCBub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnb3BlbicsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgIGlmICghbm9BbmltYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMCknXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAxIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gZmFsc2VcclxuICAgICAgICAgICAgaWYgKCFub0ZvY3VzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvY3VzKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGZvY3VzIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgZm9jdXMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWVcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJBY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdmb2N1cycsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYmx1ciB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGJsdXIoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLm1vZGFsICE9PSB0aGlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckluYWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYmx1cicsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xvc2VzIHRoZSB3aW5kb3cgKGNhbiBiZSByZW9wZW5lZCB3aXRoIG9wZW4pIGlmIGEgcmVmZXJlbmNlIGlzIHNhdmVkXHJcbiAgICAgKi9cclxuICAgIGNsb3NlKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDAgfSlcclxuICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUtc2NhbGUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nsb3NlJywgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbGVmdCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy54IH1cclxuICAgIHNldCB4KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy54ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gdmFsdWUgKyAncHgnXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0b3AgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHkoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueSB9XHJcbiAgICBzZXQgeSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueSA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdmFsdWUgKyAncHgnXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB3aWR0aCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB3aWR0aCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aCB9XHJcbiAgICBzZXQgd2lkdGgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gdmFsdWVcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlaWdodCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCBoZWlnaHQoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMuaGVpZ2h0IHx8IHRoaXMud2luLm9mZnNldEhlaWdodCB9XHJcbiAgICBzZXQgaGVpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSB2YWx1ZVxyXG4gICAgICAgIGlmICh2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXNpemUgdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XHJcbiAgICAgKi9cclxuICAgIHJlc2l6ZSh3aWR0aCwgaGVpZ2h0KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aFxyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtb3ZlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5XHJcbiAgICAgKi9cclxuICAgIG1vdmUoeCwgeSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB4XHJcbiAgICAgICAgdGhpcy55ID0geVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWluaW1pemUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG5vQW5pbWF0ZVxyXG4gICAgICovXHJcbiAgICBtaW5pbWl6ZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykgJiYgdGhpcy5vcHRpb25zLm1pbmltaXphYmxlICYmICF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlWCgxKSBzY2FsZVkoMSknXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUtcmVzdG9yZScpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRkID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZVg6IDEsIHNjYWxlWTogMSwgbGVmdDogdGhpcy5taW5pbWl6ZWQueCwgdG9wOiB0aGlzLm1pbmltaXplZC55IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgYWRkLm9uKCdjb21wbGV0ZS10b3AnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy54LCB5ID0gdGhpcy55XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZXNpcmVkID0gdGhpcy5vcHRpb25zLm1pbmltaXplU2l6ZVxyXG4gICAgICAgICAgICAgICAgbGV0IGRlbHRhXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGFzdE1pbmltaXplZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YSA9IHsgbGVmdDogdGhpcy5fbGFzdE1pbmltaXplZC54LCB0b3A6IHRoaXMuX2xhc3RNaW5pbWl6ZWQueSB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSB7IHNjYWxlWDogKGRlc2lyZWQgLyB0aGlzLndpbi5vZmZzZXRXaWR0aCksIHNjYWxlWTogKGRlc2lyZWQgLyB0aGlzLndpbi5vZmZzZXRIZWlnaHQpIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDEpIHNjYWxlKCcgKyAoZGVzaXJlZCAvIHRoaXMud2luLm9mZnNldFdpZHRoKSArICcsJyArIChkZXNpcmVkIC8gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0KSArICcpJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmxlZnQgPSBkZWx0YS5sZWZ0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IGRlbHRhLnRvcCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IHsgeCwgeSB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCBkZWx0YSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZS1zY2FsZVknLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHkgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1heGltaXplIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgbWF4aW1pemUoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICBpZiAodGhpcy5tYXhpbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQ6IHRoaXMubWF4aW1pemVkLngsIHRvcDogdGhpcy5tYXhpbWl6ZWQueSwgd2lkdGg6IHRoaXMubWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IHRoaXMubWF4aW1pemVkLmhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUtaGVpZ2h0JywgKCkgPT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMueCA9IHRoaXMubWF4aW1pemVkLnhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMueSA9IHRoaXMubWF4aW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSB0aGlzLm1heGltaXplZC53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSB0aGlzLm1heGltaXplZC5oZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgd2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aCwgaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiAwLCB0b3A6IDAsIHdpZHRoOiB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGgsIGhlaWdodDogdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUtaGVpZ2h0JywgKCkgPT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXN0b3JlQnV0dG9uXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21heGltaXplJywgdGhpcylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmRzIHdpbmRvdyB0byBiYWNrIG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0JhY2soKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvQmFjayh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZCB3aW5kb3cgdG8gZnJvbnQgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvRnJvbnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvRnJvbnQodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNhdmUgdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gZGF0YVxyXG4gICAgICovXHJcbiAgICBzYXZlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBkYXRhID0ge31cclxuICAgICAgICBjb25zdCBtYXhpbWl6ZWQgPSB0aGlzLm1heGltaXplZFxyXG4gICAgICAgIGlmIChtYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1heGltaXplZCA9IHsgeDogbWF4aW1pemVkLngsIHk6IG1heGltaXplZC55LCB3aWR0aDogbWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IG1heGltaXplZC5oZWlnaHQgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBtaW5pbWl6ZWQgPSB0aGlzLm1pbmltaXplZFxyXG4gICAgICAgIGlmIChtaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1pbmltaXplZCA9IHsgeDogdGhpcy5taW5pbWl6ZWQueCwgeTogdGhpcy5taW5pbWl6ZWQueSB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxhc3RNaW5pbWl6ZWQgPSB0aGlzLl9sYXN0TWluaW1pemVkXHJcbiAgICAgICAgaWYgKGxhc3RNaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmxhc3RNaW5pbWl6ZWQgPSB7IHg6IGxhc3RNaW5pbWl6ZWQueCwgeTogbGFzdE1pbmltaXplZC55IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS54ID0gdGhpcy54XHJcbiAgICAgICAgZGF0YS55ID0gdGhpcy55XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS53aWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXhpc3RzKHRoaXMub3B0aW9ucy5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm4gdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIGZyb20gc2F2ZSgpXHJcbiAgICAgKi9cclxuICAgIGxvYWQoZGF0YSlcclxuICAgIHtcclxuICAgICAgICBpZiAoZGF0YS5tYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBkYXRhLm1heGltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBkYXRhLm1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5sYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IGRhdGEubGFzdE1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnggPSBkYXRhLnhcclxuICAgICAgICB0aGlzLnkgPSBkYXRhLnlcclxuICAgICAgICBpZiAoZXhpc3RzKGRhdGEud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IGRhdGEud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLmhlaWdodCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGRhdGEuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoYW5nZSB0aXRsZVxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0IHRpdGxlKCkgeyByZXR1cm4gdGhpcy5fdGl0bGUgfVxyXG4gICAgc2V0IHRpdGxlKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luVGl0bGUuaW5uZXJUZXh0ID0gdmFsdWVcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByaWdodCBjb29yZGluYXRlIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHJpZ2h0KCkgeyByZXR1cm4gdGhpcy54ICsgdGhpcy53aWR0aCB9XHJcbiAgICBzZXQgcmlnaHQodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy54ID0gdmFsdWUgLSB0aGlzLndpZHRoXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBib3R0b20gY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCBib3R0b20oKSB7IHJldHVybiB0aGlzLnkgKyB0aGlzLmhlaWdodCB9XHJcbiAgICBzZXQgYm90dG9tKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueSA9IHZhbHVlIC0gdGhpcy5oZWlnaHRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyByZXN0b3JlZCB0byBub3JtYWwgYWZ0ZXIgYmVpbmcgbWluaW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21pbmltaXplLXJlc3RvcmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IG9wZW5zXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I29wZW5cclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGdhaW5zIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2ZvY3VzXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGxvc2VzIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2JsdXJcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgY2xvc2VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2Nsb3NlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHJlc2l6ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXN0YXJ0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBhZnRlciByZXNpemUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyByZXNpemluZ1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gbW92ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgbW92ZSBjb21wbGV0ZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyBtb3ZlXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICBfY3JlYXRlV2luZG93KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbiA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndtLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdib3JkZXItcmFkaXVzJzogdGhpcy5vcHRpb25zLmJvcmRlclJhZGl1cyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdtaW4td2lkdGgnOiB0aGlzLm9wdGlvbnMubWluV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm94LXNoYWRvdyc6IHRoaXMub3B0aW9ucy5zaGFkb3csXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JXaW5kb3csXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IHRoaXMub3B0aW9ucy54LFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IHRoaXMub3B0aW9ucy55LFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogdGhpcy5vcHRpb25zLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IHRoaXMub3B0aW9ucy5oZWlnaHRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMud2luQm94ID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ2NvbHVtbicsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVRpdGxlYmFyKClcclxuXHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnc2VjdGlvbicsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnYmxvY2snLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgnOiAxLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm1pbkhlaWdodCxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdy14JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteSc6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZXNpemFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVSZXNpemUoKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4geyB0aGlzLl9kb3duVGl0bGViYXIoZSk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgIH1cclxuXHJcbiAgICBfZG93blRpdGxlYmFyKGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgdGhpcy5fbW92aW5nID0gdGhpcy5fdG9Mb2NhbCh7XHJcbiAgICAgICAgICAgICAgICB4OiBldmVudC5wYWdlWCxcclxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LnBhZ2VZXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZS1zdGFydCcsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmVkID0gZmFsc2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVRpdGxlYmFyKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlYmFyID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnaGVhZGVyJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogJzAgOHB4JyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLndpblRpdGxlID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHR5cGU6ICdzcGFuJywgaHRtbDogdGhpcy5vcHRpb25zLnRpdGxlLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZy1sZWZ0JzogJzhweCcsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdmb250LXNpemUnOiAnMTZweCcsXHJcbiAgICAgICAgICAgICAgICAnZm9udC13ZWlnaHQnOiA0MDAsXHJcbiAgICAgICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yVGl0bGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlQnV0dG9ucygpXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubW92YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHRoaXMuX2Rvd25UaXRsZWJhcihlKSlcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHRoaXMuX2Rvd25UaXRsZWJhcihlKSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZUJ1dHRvbnMoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luQnV0dG9uR3JvdXAgPSBodG1sLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZy1sZWZ0JzogJzJweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgYnV0dG9uID0ge1xyXG4gICAgICAgICAgICAnZGlzcGxheSc6ICdpbmxpbmUtYmxvY2snLFxyXG4gICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgJ21hcmdpbic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4tbGVmdCc6ICc1cHgnLFxyXG4gICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICd3aWR0aCc6ICcxMnB4JyxcclxuICAgICAgICAgICAgJ2hlaWdodCc6ICcxMnB4JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1zaXplJzogJ2NvdmVyJyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtcmVwZWF0JzogJ25vLXJlcGVhdCcsXHJcbiAgICAgICAgICAgICdvcGFjaXR5JzogLjcsXHJcbiAgICAgICAgICAgICdjb2xvcic6IHRoaXMub3B0aW9ucy5mb3JlZ3JvdW5kQ29sb3JCdXR0b24sXHJcbiAgICAgICAgICAgICdvdXRsaW5lJzogMFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJ1dHRvbnMgPSB7fVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubWluaW1pemFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBidXR0b24uYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWluaW1pemUgPSBodG1sLmNyZWF0ZSh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5taW5pbWl6ZSwgKCkgPT4gdGhpcy5taW5pbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1heGltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWF4aW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplID0gaHRtbC5jcmVhdGUoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWF4aW1pemUsICgpID0+IHRoaXMubWF4aW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENsb3NlQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5jbG9zZSA9IGh0bWwuY3JlYXRlKHsgcGFyZW50OiB0aGlzLndpbkJ1dHRvbkdyb3VwLCBodG1sOiAnJm5ic3A7JywgdHlwZTogJ2J1dHRvbicsIHN0eWxlczogYnV0dG9uIH0pXHJcbiAgICAgICAgICAgIGNsaWNrZWQodGhpcy5idXR0b25zLmNsb3NlLCAoKSA9PiB0aGlzLmNsb3NlKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmJ1dHRvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBidXR0b24gPSB0aGlzLmJ1dHRvbnNba2V5XVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAxXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMC43XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZSA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2J1dHRvbicsIGh0bWw6ICcmbmJzcCcsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdib3R0b20nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3JpZ2h0JzogJzRweCcsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdzZS1yZXNpemUnLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc2l6ZSxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTVweCcsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTBweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgZG93biA9IChlKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIGV2ZW50LnBhZ2VYLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gZXZlbnQucGFnZVlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXN0YXJ0JylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBkb3duKVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZG93bilcclxuICAgIH1cclxuXHJcbiAgICBfbW92ZShlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2lzVG91Y2hFdmVudChlKSAmJiBlLndoaWNoICE9PSAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3ZpbmcgJiYgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYIC0gdGhpcy5fbW92aW5nLngsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgLSB0aGlzLl9tb3ZpbmcueVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSB7IHg6IHRoaXMud2luLm9mZnNldExlZnQsIHk6IHRoaXMud2luLm9mZnNldFRvcCB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW92ZWQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9yZXNpemluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemUoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVggKyB0aGlzLl9yZXNpemluZy53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWSArIHRoaXMuX3Jlc2l6aW5nLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfdXAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbW92ZWQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZXNpemluZyAmJiB0aGlzLl9zdG9wUmVzaXplKClcclxuICAgIH1cclxuXHJcbiAgICBfbGlzdGVuZXJzKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMuZm9jdXMoKSlcclxuICAgIH1cclxuXHJcbiAgICBfc3RvcE1vdmUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX21vdmluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUtZW5kJylcclxuICAgIH1cclxuXHJcbiAgICBfc3RvcFJlc2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IHRoaXMuX3Jlc2l6aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLWVuZCcpXHJcbiAgICB9XHJcblxyXG4gICAgX2lzVG91Y2hFdmVudChlKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5Ub3VjaEV2ZW50ICYmIChlIGluc3RhbmNlb2Ygd2luZG93LlRvdWNoRXZlbnQpXHJcbiAgICB9XHJcblxyXG4gICAgX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXNUb3VjaEV2ZW50KGUpID8gZS5jaGFuZ2VkVG91Y2hlc1swXSA6IGVcclxuICAgIH1cclxuXHJcbiAgICBfdG9Mb2NhbChjb29yZClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiBjb29yZC54IC0gdGhpcy54LFxyXG4gICAgICAgICAgICB5OiBjb29yZC55IC0gdGhpcy55XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB6KCkgeyByZXR1cm4gcGFyc2VJbnQodGhpcy53aW4uc3R5bGUuekluZGV4KSB9XHJcbiAgICBzZXQgeih2YWx1ZSkgeyB0aGlzLndpbi5zdHlsZS56SW5kZXggPSB2YWx1ZSB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2luZG93Il19