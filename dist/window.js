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
                    'width': isNaN(this.options.width) ? this.options.width : this.options.width + 'px',
                    'height': isNaN(this.options.height) ? this.options.height : this.options.height + 'px'
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm92ZXJsYXkiLCJzY2FsZVgiLCJzY2FsZVkiLCJsZWZ0IiwidG9wIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsImRlbHRhIiwiX2xhc3RNaW5pbWl6ZWQiLCJvZmZzZXRXaWR0aCIsIm9mZnNldEhlaWdodCIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwiYmFja2dyb3VuZFJlc3RvcmVCdXR0b24iLCJzZW5kVG9CYWNrIiwic2VuZFRvRnJvbnQiLCJkYXRhIiwibGFzdE1pbmltaXplZCIsImNyZWF0ZSIsInBhcmVudCIsInN0eWxlcyIsImJvcmRlclJhZGl1cyIsIm1pbldpZHRoIiwibWluSGVpZ2h0Iiwic2hhZG93IiwiYmFja2dyb3VuZENvbG9yV2luZG93IiwiaXNOYU4iLCJ3aW5Cb3giLCJfY3JlYXRlVGl0bGViYXIiLCJjb250ZW50IiwidHlwZSIsInJlc2l6YWJsZSIsIl9jcmVhdGVSZXNpemUiLCJhZGRFdmVudExpc3RlbmVyIiwiZSIsIl9kb3duVGl0bGViYXIiLCJzdG9wUHJvcGFnYXRpb24iLCJldmVudCIsIl9jb252ZXJ0TW92ZUV2ZW50IiwiX3RvTG9jYWwiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZSIsInRpdGxlIiwiZm9yZWdyb3VuZENvbG9yVGl0bGUiLCJfY3JlYXRlQnV0dG9ucyIsIm1vdmFibGUiLCJ3aW5CdXR0b25Hcm91cCIsImJ1dHRvbiIsImZvcmVncm91bmRDb2xvckJ1dHRvbiIsImJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvbiIsImNsb3NhYmxlIiwiYmFja2dyb3VuZENsb3NlQnV0dG9uIiwiY2xvc2UiLCJrZXkiLCJvcGFjaXR5IiwicmVzaXplRWRnZSIsImJhY2tncm91bmRSZXNpemUiLCJkb3duIiwicHJldmVudERlZmF1bHQiLCJfaXNUb3VjaEV2ZW50Iiwid2hpY2giLCJfc3RvcE1vdmUiLCJfc3RvcFJlc2l6ZSIsIm1vdmUiLCJvZmZzZXRMZWZ0Iiwib2Zmc2V0VG9wIiwicmVzaXplIiwid2luZG93IiwiVG91Y2hFdmVudCIsImNoYW5nZWRUb3VjaGVzIiwiY29vcmQiLCJ2YWx1ZSIsIl90aXRsZSIsImlubmVyVGV4dCIsInBhcnNlSW50IiwiekluZGV4IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxlQUFSLENBQWY7QUFDQSxJQUFNQyxVQUFVRCxRQUFRLFNBQVIsQ0FBaEI7QUFDQSxJQUFNRSxPQUFPRixRQUFRLGdCQUFSLENBQWI7QUFDQSxJQUFNRyxTQUFTSCxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNSSxPQUFPSixRQUFRLFFBQVIsQ0FBYjs7QUFF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QUFDSDs7OzRCQTJYTztBQUFFLG1CQUFPcUYsU0FBUyxLQUFLckcsR0FBTCxDQUFTQyxLQUFULENBQWVxRyxNQUF4QixDQUFQO0FBQXdDLFM7MEJBQzVDSixLLEVBQU87QUFBRSxpQkFBS2xHLEdBQUwsQ0FBU0MsS0FBVCxDQUFlcUcsTUFBZixHQUF3QkosS0FBeEI7QUFBK0I7Ozs7RUF6eEI3QjNILE07O0FBNHhCckJnSSxPQUFPQyxPQUFQLEdBQWlCMUgsTUFBakIiLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpXHJcbmNvbnN0IGNsaWNrZWQgPSByZXF1aXJlKCdjbGlja2VkJylcclxuY29uc3QgRWFzZSA9IHJlcXVpcmUoJy4uLy4uL2RvbS1lYXNlJylcclxuY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5cclxubGV0IGlkID0gMFxyXG5cclxuLyoqXHJcbiAqIFdpbmRvdyBjbGFzcyByZXR1cm5lZCBieSBXaW5kb3dNYW5hZ2VyLmNyZWF0ZVdpbmRvdygpXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAaGlkZWNvbnN0cnVjdG9yXHJcbiAqL1xyXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd01hbmFnZXJ9IHdtXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih3bSwgb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgdGhpcy53bSA9IHdtXHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGV4aXN0cyh0aGlzLm9wdGlvbnMuaWQpID8gdGhpcy5vcHRpb25zLmlkIDogaWQrK1xyXG5cclxuICAgICAgICB0aGlzLl9jcmVhdGVXaW5kb3coKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVycygpXHJcblxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICB0aGlzLm1heGltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG5cclxuICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IG51bGxcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcblxyXG4gICAgICAgIHRoaXMuZWFzZSA9IG5ldyBFYXNlKHsgZHVyYXRpb246IHRoaXMub3B0aW9ucy5hbmltYXRlVGltZSwgZWFzZTogdGhpcy5vcHRpb25zLmVhc2UgfSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG9wZW4gdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9Gb2N1c10gZG8gbm90IGZvY3VzIHdpbmRvdyB3aGVuIG9wZW5lZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9BbmltYXRlXSBkbyBub3QgYW5pbWF0ZSB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqL1xyXG4gICAgb3Blbihub0ZvY3VzLCBub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnb3BlbicsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgIGlmICghbm9BbmltYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMCknXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAxIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gZmFsc2VcclxuICAgICAgICAgICAgaWYgKCFub0ZvY3VzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvY3VzKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGZvY3VzIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgZm9jdXMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWVcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJBY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdmb2N1cycsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYmx1ciB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGJsdXIoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLm1vZGFsICE9PSB0aGlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckluYWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYmx1cicsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xvc2VzIHRoZSB3aW5kb3cgKGNhbiBiZSByZW9wZW5lZCB3aXRoIG9wZW4pIGlmIGEgcmVmZXJlbmNlIGlzIHNhdmVkXHJcbiAgICAgKi9cclxuICAgIGNsb3NlKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDAgfSlcclxuICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUtc2NhbGUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nsb3NlJywgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbGVmdCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy54IH1cclxuICAgIHNldCB4KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy54ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gdmFsdWUgKyAncHgnXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0b3AgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHkoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueSB9XHJcbiAgICBzZXQgeSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueSA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdmFsdWUgKyAncHgnXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB3aWR0aCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB3aWR0aCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aCB9XHJcbiAgICBzZXQgd2lkdGgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gdmFsdWVcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlaWdodCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCBoZWlnaHQoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMuaGVpZ2h0IHx8IHRoaXMud2luLm9mZnNldEhlaWdodCB9XHJcbiAgICBzZXQgaGVpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSB2YWx1ZVxyXG4gICAgICAgIGlmICh2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXNpemUgdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XHJcbiAgICAgKi9cclxuICAgIHJlc2l6ZSh3aWR0aCwgaGVpZ2h0KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aFxyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtb3ZlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5XHJcbiAgICAgKi9cclxuICAgIG1vdmUoeCwgeSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB4XHJcbiAgICAgICAgdGhpcy55ID0geVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWluaW1pemUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG5vQW5pbWF0ZVxyXG4gICAgICovXHJcbiAgICBtaW5pbWl6ZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykgJiYgdGhpcy5vcHRpb25zLm1pbmltaXphYmxlICYmICF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlWCgxKSBzY2FsZVkoMSknXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUtcmVzdG9yZScpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWRkID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZVg6IDEsIHNjYWxlWTogMSwgbGVmdDogdGhpcy5taW5pbWl6ZWQueCwgdG9wOiB0aGlzLm1pbmltaXplZC55IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgYWRkLm9uKCdjb21wbGV0ZS10b3AnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy54LCB5ID0gdGhpcy55XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZXNpcmVkID0gdGhpcy5vcHRpb25zLm1pbmltaXplU2l6ZVxyXG4gICAgICAgICAgICAgICAgbGV0IGRlbHRhXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGFzdE1pbmltaXplZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWx0YSA9IHsgbGVmdDogdGhpcy5fbGFzdE1pbmltaXplZC54LCB0b3A6IHRoaXMuX2xhc3RNaW5pbWl6ZWQueSB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSB7IHNjYWxlWDogKGRlc2lyZWQgLyB0aGlzLndpbi5vZmZzZXRXaWR0aCksIHNjYWxlWTogKGRlc2lyZWQgLyB0aGlzLndpbi5vZmZzZXRIZWlnaHQpIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDEpIHNjYWxlKCcgKyAoZGVzaXJlZCAvIHRoaXMud2luLm9mZnNldFdpZHRoKSArICcsJyArIChkZXNpcmVkIC8gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0KSArICcpJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmxlZnQgPSBkZWx0YS5sZWZ0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IGRlbHRhLnRvcCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IHsgeCwgeSB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCBkZWx0YSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZS1zY2FsZVknLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHkgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1heGltaXplIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgbWF4aW1pemUoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICBpZiAodGhpcy5tYXhpbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQ6IHRoaXMubWF4aW1pemVkLngsIHRvcDogdGhpcy5tYXhpbWl6ZWQueSwgd2lkdGg6IHRoaXMubWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IHRoaXMubWF4aW1pemVkLmhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUtaGVpZ2h0JywgKCkgPT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMueCA9IHRoaXMubWF4aW1pemVkLnhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMueSA9IHRoaXMubWF4aW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSB0aGlzLm1heGltaXplZC53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSB0aGlzLm1heGltaXplZC5oZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgd2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aCwgaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiAwLCB0b3A6IDAsIHdpZHRoOiB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGgsIGhlaWdodDogdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUtaGVpZ2h0JywgKCkgPT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXN0b3JlQnV0dG9uXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21heGltaXplJywgdGhpcylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmRzIHdpbmRvdyB0byBiYWNrIG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0JhY2soKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvQmFjayh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZCB3aW5kb3cgdG8gZnJvbnQgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvRnJvbnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvRnJvbnQodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNhdmUgdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gZGF0YVxyXG4gICAgICovXHJcbiAgICBzYXZlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBkYXRhID0ge31cclxuICAgICAgICBjb25zdCBtYXhpbWl6ZWQgPSB0aGlzLm1heGltaXplZFxyXG4gICAgICAgIGlmIChtYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1heGltaXplZCA9IHsgeDogbWF4aW1pemVkLngsIHk6IG1heGltaXplZC55LCB3aWR0aDogbWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IG1heGltaXplZC5oZWlnaHQgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBtaW5pbWl6ZWQgPSB0aGlzLm1pbmltaXplZFxyXG4gICAgICAgIGlmIChtaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1pbmltaXplZCA9IHsgeDogdGhpcy5taW5pbWl6ZWQueCwgeTogdGhpcy5taW5pbWl6ZWQueSB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxhc3RNaW5pbWl6ZWQgPSB0aGlzLl9sYXN0TWluaW1pemVkXHJcbiAgICAgICAgaWYgKGxhc3RNaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmxhc3RNaW5pbWl6ZWQgPSB7IHg6IGxhc3RNaW5pbWl6ZWQueCwgeTogbGFzdE1pbmltaXplZC55IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS54ID0gdGhpcy54XHJcbiAgICAgICAgZGF0YS55ID0gdGhpcy55XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS53aWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXhpc3RzKHRoaXMub3B0aW9ucy5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm4gdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIGZyb20gc2F2ZSgpXHJcbiAgICAgKi9cclxuICAgIGxvYWQoZGF0YSlcclxuICAgIHtcclxuICAgICAgICBpZiAoZGF0YS5tYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBkYXRhLm1heGltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBkYXRhLm1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5sYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IGRhdGEubGFzdE1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnggPSBkYXRhLnhcclxuICAgICAgICB0aGlzLnkgPSBkYXRhLnlcclxuICAgICAgICBpZiAoZXhpc3RzKGRhdGEud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IGRhdGEud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLmhlaWdodCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGRhdGEuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoYW5nZSB0aXRsZVxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0IHRpdGxlKCkgeyByZXR1cm4gdGhpcy5fdGl0bGUgfVxyXG4gICAgc2V0IHRpdGxlKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luVGl0bGUuaW5uZXJUZXh0ID0gdmFsdWVcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByaWdodCBjb29yZGluYXRlIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHJpZ2h0KCkgeyByZXR1cm4gdGhpcy54ICsgdGhpcy53aWR0aCB9XHJcbiAgICBzZXQgcmlnaHQodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy54ID0gdmFsdWUgLSB0aGlzLndpZHRoXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBib3R0b20gY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCBib3R0b20oKSB7IHJldHVybiB0aGlzLnkgKyB0aGlzLmhlaWdodCB9XHJcbiAgICBzZXQgYm90dG9tKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueSA9IHZhbHVlIC0gdGhpcy5oZWlnaHRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyByZXN0b3JlZCB0byBub3JtYWwgYWZ0ZXIgYmVpbmcgbWluaW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21pbmltaXplLXJlc3RvcmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IG9wZW5zXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I29wZW5cclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGdhaW5zIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2ZvY3VzXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGxvc2VzIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2JsdXJcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgY2xvc2VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2Nsb3NlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHJlc2l6ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXN0YXJ0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBhZnRlciByZXNpemUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyByZXNpemluZ1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gbW92ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgbW92ZSBjb21wbGV0ZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyBtb3ZlXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICBfY3JlYXRlV2luZG93KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbiA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndtLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdib3JkZXItcmFkaXVzJzogdGhpcy5vcHRpb25zLmJvcmRlclJhZGl1cyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdtaW4td2lkdGgnOiB0aGlzLm9wdGlvbnMubWluV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm94LXNoYWRvdyc6IHRoaXMub3B0aW9ucy5zaGFkb3csXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JXaW5kb3csXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IHRoaXMub3B0aW9ucy54LFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IHRoaXMub3B0aW9ucy55LFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogaXNOYU4odGhpcy5vcHRpb25zLndpZHRoKSA/IHRoaXMub3B0aW9ucy53aWR0aCA6IHRoaXMub3B0aW9ucy53aWR0aCArICdweCcsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogaXNOYU4odGhpcy5vcHRpb25zLmhlaWdodCkgPyB0aGlzLm9wdGlvbnMuaGVpZ2h0IDogdGhpcy5vcHRpb25zLmhlaWdodCArICdweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMud2luQm94ID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ2NvbHVtbicsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVRpdGxlYmFyKClcclxuXHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnc2VjdGlvbicsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnYmxvY2snLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgnOiAxLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm1pbkhlaWdodCxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdy14JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteSc6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZXNpemFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVSZXNpemUoKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4geyB0aGlzLl9kb3duVGl0bGViYXIoZSk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgIH1cclxuXHJcbiAgICBfZG93blRpdGxlYmFyKGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgdGhpcy5fbW92aW5nID0gdGhpcy5fdG9Mb2NhbCh7XHJcbiAgICAgICAgICAgICAgICB4OiBldmVudC5wYWdlWCxcclxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LnBhZ2VZXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZS1zdGFydCcsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmVkID0gZmFsc2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVRpdGxlYmFyKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlYmFyID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnaGVhZGVyJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogJzAgOHB4JyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLndpblRpdGxlID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHR5cGU6ICdzcGFuJywgaHRtbDogdGhpcy5vcHRpb25zLnRpdGxlLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZy1sZWZ0JzogJzhweCcsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdmb250LXNpemUnOiAnMTZweCcsXHJcbiAgICAgICAgICAgICAgICAnZm9udC13ZWlnaHQnOiA0MDAsXHJcbiAgICAgICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yVGl0bGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlQnV0dG9ucygpXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubW92YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHRoaXMuX2Rvd25UaXRsZWJhcihlKSlcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHRoaXMuX2Rvd25UaXRsZWJhcihlKSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZUJ1dHRvbnMoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luQnV0dG9uR3JvdXAgPSBodG1sLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZy1sZWZ0JzogJzJweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgYnV0dG9uID0ge1xyXG4gICAgICAgICAgICAnZGlzcGxheSc6ICdpbmxpbmUtYmxvY2snLFxyXG4gICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgJ21hcmdpbic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4tbGVmdCc6ICc1cHgnLFxyXG4gICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICd3aWR0aCc6ICcxMnB4JyxcclxuICAgICAgICAgICAgJ2hlaWdodCc6ICcxMnB4JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1zaXplJzogJ2NvdmVyJyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtcmVwZWF0JzogJ25vLXJlcGVhdCcsXHJcbiAgICAgICAgICAgICdvcGFjaXR5JzogLjcsXHJcbiAgICAgICAgICAgICdjb2xvcic6IHRoaXMub3B0aW9ucy5mb3JlZ3JvdW5kQ29sb3JCdXR0b24sXHJcbiAgICAgICAgICAgICdvdXRsaW5lJzogMFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJ1dHRvbnMgPSB7fVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubWluaW1pemFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBidXR0b24uYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWluaW1pemUgPSBodG1sLmNyZWF0ZSh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5taW5pbWl6ZSwgKCkgPT4gdGhpcy5taW5pbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1heGltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWF4aW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplID0gaHRtbC5jcmVhdGUoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWF4aW1pemUsICgpID0+IHRoaXMubWF4aW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENsb3NlQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5jbG9zZSA9IGh0bWwuY3JlYXRlKHsgcGFyZW50OiB0aGlzLndpbkJ1dHRvbkdyb3VwLCBodG1sOiAnJm5ic3A7JywgdHlwZTogJ2J1dHRvbicsIHN0eWxlczogYnV0dG9uIH0pXHJcbiAgICAgICAgICAgIGNsaWNrZWQodGhpcy5idXR0b25zLmNsb3NlLCAoKSA9PiB0aGlzLmNsb3NlKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmJ1dHRvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBidXR0b24gPSB0aGlzLmJ1dHRvbnNba2V5XVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAxXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMC43XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZSA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2J1dHRvbicsIGh0bWw6ICcmbmJzcCcsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdib3R0b20nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3JpZ2h0JzogJzRweCcsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdzZS1yZXNpemUnLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc2l6ZSxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTVweCcsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTBweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgZG93biA9IChlKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIGV2ZW50LnBhZ2VYLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gZXZlbnQucGFnZVlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXN0YXJ0JylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBkb3duKVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZG93bilcclxuICAgIH1cclxuXHJcbiAgICBfbW92ZShlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2lzVG91Y2hFdmVudChlKSAmJiBlLndoaWNoICE9PSAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3ZpbmcgJiYgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYIC0gdGhpcy5fbW92aW5nLngsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgLSB0aGlzLl9tb3ZpbmcueVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSB7IHg6IHRoaXMud2luLm9mZnNldExlZnQsIHk6IHRoaXMud2luLm9mZnNldFRvcCB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW92ZWQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9yZXNpemluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemUoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVggKyB0aGlzLl9yZXNpemluZy53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWSArIHRoaXMuX3Jlc2l6aW5nLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfdXAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbW92ZWQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZXNpemluZyAmJiB0aGlzLl9zdG9wUmVzaXplKClcclxuICAgIH1cclxuXHJcbiAgICBfbGlzdGVuZXJzKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMuZm9jdXMoKSlcclxuICAgIH1cclxuXHJcbiAgICBfc3RvcE1vdmUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX21vdmluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUtZW5kJylcclxuICAgIH1cclxuXHJcbiAgICBfc3RvcFJlc2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IHRoaXMuX3Jlc2l6aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLWVuZCcpXHJcbiAgICB9XHJcblxyXG4gICAgX2lzVG91Y2hFdmVudChlKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5Ub3VjaEV2ZW50ICYmIChlIGluc3RhbmNlb2Ygd2luZG93LlRvdWNoRXZlbnQpXHJcbiAgICB9XHJcblxyXG4gICAgX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXNUb3VjaEV2ZW50KGUpID8gZS5jaGFuZ2VkVG91Y2hlc1swXSA6IGVcclxuICAgIH1cclxuXHJcbiAgICBfdG9Mb2NhbChjb29yZClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiBjb29yZC54IC0gdGhpcy54LFxyXG4gICAgICAgICAgICB5OiBjb29yZC55IC0gdGhpcy55XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB6KCkgeyByZXR1cm4gcGFyc2VJbnQodGhpcy53aW4uc3R5bGUuekluZGV4KSB9XHJcbiAgICBzZXQgeih2YWx1ZSkgeyB0aGlzLndpbi5zdHlsZS56SW5kZXggPSB2YWx1ZSB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2luZG93Il19