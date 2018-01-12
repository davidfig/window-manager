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
            if (value) {
                this.win.style.width = value + 'px';
                this.options.width = this.win.offsetWidth;
            } else {
                this.win.style.width = 'auto';
                this.options.width = '';
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
            if (value) {
                this.win.style.height = value + 'px';
                this.options.height = this.win.offsetHeight;
            } else {
                this.win.style.height = 'auto';
                this.options.height = '';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm92ZXJsYXkiLCJzY2FsZVgiLCJzY2FsZVkiLCJsZWZ0IiwidG9wIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsImRlbHRhIiwiX2xhc3RNaW5pbWl6ZWQiLCJvZmZzZXRXaWR0aCIsIm9mZnNldEhlaWdodCIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwiYmFja2dyb3VuZFJlc3RvcmVCdXR0b24iLCJzZW5kVG9CYWNrIiwic2VuZFRvRnJvbnQiLCJkYXRhIiwibGFzdE1pbmltaXplZCIsImNyZWF0ZSIsInBhcmVudCIsInN0eWxlcyIsImJvcmRlclJhZGl1cyIsIm1pbldpZHRoIiwibWluSGVpZ2h0Iiwic2hhZG93IiwiYmFja2dyb3VuZENvbG9yV2luZG93IiwiaXNOYU4iLCJ3aW5Cb3giLCJfY3JlYXRlVGl0bGViYXIiLCJjb250ZW50IiwidHlwZSIsInJlc2l6YWJsZSIsIl9jcmVhdGVSZXNpemUiLCJhZGRFdmVudExpc3RlbmVyIiwiZSIsIl9kb3duVGl0bGViYXIiLCJzdG9wUHJvcGFnYXRpb24iLCJldmVudCIsIl9jb252ZXJ0TW92ZUV2ZW50IiwiX3RvTG9jYWwiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZSIsInRpdGxlIiwiZm9yZWdyb3VuZENvbG9yVGl0bGUiLCJfY3JlYXRlQnV0dG9ucyIsIm1vdmFibGUiLCJ3aW5CdXR0b25Hcm91cCIsImJ1dHRvbiIsImZvcmVncm91bmRDb2xvckJ1dHRvbiIsImJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvbiIsImNsb3NhYmxlIiwiYmFja2dyb3VuZENsb3NlQnV0dG9uIiwiY2xvc2UiLCJrZXkiLCJvcGFjaXR5IiwicmVzaXplRWRnZSIsImJhY2tncm91bmRSZXNpemUiLCJkb3duIiwicHJldmVudERlZmF1bHQiLCJfaXNUb3VjaEV2ZW50Iiwid2hpY2giLCJfc3RvcE1vdmUiLCJfc3RvcFJlc2l6ZSIsIm1vdmUiLCJvZmZzZXRMZWZ0Iiwib2Zmc2V0VG9wIiwicmVzaXplIiwid2luZG93IiwiVG91Y2hFdmVudCIsImNoYW5nZWRUb3VjaGVzIiwiY29vcmQiLCJ2YWx1ZSIsIl90aXRsZSIsImlubmVyVGV4dCIsInBhcnNlSW50IiwiekluZGV4IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxlQUFSLENBQWY7QUFDQSxJQUFNQyxVQUFVRCxRQUFRLFNBQVIsQ0FBaEI7QUFDQSxJQUFNRSxPQUFPRixRQUFRLGdCQUFSLENBQWI7QUFDQSxJQUFNRyxTQUFTSCxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNSSxPQUFPSixRQUFRLFFBQVIsQ0FBYjs7QUFF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Ozs7Ozs0QkFJYTtBQUFFLG1CQUFPLEtBQUtHLENBQUwsR0FBUyxLQUFLRixNQUFyQjtBQUE2QixTOzBCQUNqQ2tGLEssRUFDWDtBQUNJLGlCQUFLaEYsQ0FBTCxHQUFTZ0YsUUFBUSxLQUFLbEYsTUFBdEI7QUFDSDs7OzRCQTJYTztBQUFFLG1CQUFPcUYsU0FBUyxLQUFLckcsR0FBTCxDQUFTQyxLQUFULENBQWVxRyxNQUF4QixDQUFQO0FBQXdDLFM7MEJBQzVDSixLLEVBQU87QUFBRSxpQkFBS2xHLEdBQUwsQ0FBU0MsS0FBVCxDQUFlcUcsTUFBZixHQUF3QkosS0FBeEI7QUFBK0I7Ozs7RUEzeEI3QjNILE07O0FBOHhCckJnSSxPQUFPQyxPQUFQLEdBQWlCMUgsTUFBakIiLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpXHJcbmNvbnN0IGNsaWNrZWQgPSByZXF1aXJlKCdjbGlja2VkJylcclxuY29uc3QgRWFzZSA9IHJlcXVpcmUoJy4uLy4uL2RvbS1lYXNlJylcclxuY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5cclxubGV0IGlkID0gMFxyXG5cclxuLyoqXHJcbiAqIFdpbmRvdyBjbGFzcyByZXR1cm5lZCBieSBXaW5kb3dNYW5hZ2VyLmNyZWF0ZVdpbmRvdygpXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAaGlkZWNvbnN0cnVjdG9yXHJcbiAqL1xyXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd01hbmFnZXJ9IHdtXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih3bSwgb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgdGhpcy53bSA9IHdtXHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGV4aXN0cyh0aGlzLm9wdGlvbnMuaWQpID8gdGhpcy5vcHRpb25zLmlkIDogaWQrK1xyXG5cclxuICAgICAgICB0aGlzLl9jcmVhdGVXaW5kb3coKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVycygpXHJcblxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICB0aGlzLm1heGltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG5cclxuICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IG51bGxcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcblxyXG4gICAgICAgIHRoaXMuZWFzZSA9IG5ldyBFYXNlKHsgZHVyYXRpb246IHRoaXMub3B0aW9ucy5hbmltYXRlVGltZSwgZWFzZTogdGhpcy5vcHRpb25zLmVhc2UgfSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG9wZW4gdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9Gb2N1c10gZG8gbm90IGZvY3VzIHdpbmRvdyB3aGVuIG9wZW5lZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9BbmltYXRlXSBkbyBub3QgYW5pbWF0ZSB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqL1xyXG4gICAgb3Blbihub0ZvY3VzLCBub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnb3BlbicsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgIGlmICghbm9BbmltYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMCknXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAxIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gZmFsc2VcclxuICAgICAgICAgICAgaWYgKCFub0ZvY3VzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvY3VzKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGZvY3VzIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgZm9jdXMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWVcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJBY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdmb2N1cycsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYmx1ciB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGJsdXIoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLm1vZGFsICE9PSB0aGlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckluYWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYmx1cicsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xvc2VzIHRoZSB3aW5kb3cgKGNhbiBiZSByZW9wZW5lZCB3aXRoIG9wZW4pIGlmIGEgcmVmZXJlbmNlIGlzIHNhdmVkXHJcbiAgICAgKi9cclxuICAgIGNsb3NlKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDAgfSlcclxuICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUtc2NhbGUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nsb3NlJywgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbGVmdCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy54IH1cclxuICAgIHNldCB4KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy54ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gdmFsdWUgKyAncHgnXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0b3AgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHkoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueSB9XHJcbiAgICBzZXQgeSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueSA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdmFsdWUgKyAncHgnXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB3aWR0aCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB3aWR0aCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aCB9XHJcbiAgICBzZXQgd2lkdGgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSB2YWx1ZSArICdweCdcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gJydcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWlnaHQgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgaGVpZ2h0KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHQgfVxyXG4gICAgc2V0IGhlaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSB2YWx1ZSArICdweCdcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9ICcnXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVzaXplIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxyXG4gICAgICovXHJcbiAgICByZXNpemUod2lkdGgsIGhlaWdodClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGhcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbW92ZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geVxyXG4gICAgICovXHJcbiAgICBtb3ZlKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy54ID0geFxyXG4gICAgICAgIHRoaXMueSA9IHlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1pbmltaXplIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBub0FuaW1hdGVcclxuICAgICAqL1xyXG4gICAgbWluaW1pemUobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZVgoMSkgc2NhbGVZKDEpJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFkZCA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGVYOiAxLCBzY2FsZVk6IDEsIGxlZnQ6IHRoaXMubWluaW1pemVkLngsIHRvcDogdGhpcy5taW5pbWl6ZWQueSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGFkZC5vbignY29tcGxldGUtdG9wJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZS1yZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueCwgeSA9IHRoaXMueVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVzaXJlZCA9IHRoaXMub3B0aW9ucy5taW5pbWl6ZVNpemVcclxuICAgICAgICAgICAgICAgIGxldCBkZWx0YVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2xhc3RNaW5pbWl6ZWQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVsdGEgPSB7IGxlZnQ6IHRoaXMuX2xhc3RNaW5pbWl6ZWQueCwgdG9wOiB0aGlzLl9sYXN0TWluaW1pemVkLnkgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlbHRhID0geyBzY2FsZVg6IChkZXNpcmVkIC8gdGhpcy53aW4ub2Zmc2V0V2lkdGgpLCBzY2FsZVk6IChkZXNpcmVkIC8gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0KSB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgxKSBzY2FsZSgnICsgKGRlc2lyZWQgLyB0aGlzLndpbi5vZmZzZXRXaWR0aCkgKyAnLCcgKyAoZGVzaXJlZCAvIHRoaXMud2luLm9mZnNldEhlaWdodCkgKyAnKSdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gZGVsdGEubGVmdCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50b3AgPSBkZWx0YS50b3AgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHkgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgZGVsdGEpXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUtc2NhbGVZJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0geyB4LCB5IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtYXhpbWl6ZSB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIG1heGltaXplKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSAmJiB0aGlzLm9wdGlvbnMubWF4aW1pemFibGUgJiYgIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiB0aGlzLm1heGltaXplZC54LCB0b3A6IHRoaXMubWF4aW1pemVkLnksIHdpZHRoOiB0aGlzLm1heGltaXplZC53aWR0aCwgaGVpZ2h0OiB0aGlzLm1heGltaXplZC5oZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlLWhlaWdodCcsICgpID0+XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnggPSB0aGlzLm1heGltaXplZC54XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnkgPSB0aGlzLm1heGltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gdGhpcy5tYXhpbWl6ZWQud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNYXhpbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLngsIHkgPSB0aGlzLnksIHdpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGgsIGhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdDogMCwgdG9wOiAwLCB3aWR0aDogdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoLCBoZWlnaHQ6IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlLWhlaWdodCcsICgpID0+XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvblxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtYXhpbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kcyB3aW5kb3cgdG8gYmFjayBvZiB3aW5kb3ctbWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzZW5kVG9CYWNrKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndtLnNlbmRUb0JhY2sodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmQgd2luZG93IHRvIGZyb250IG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0Zyb250KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndtLnNlbmRUb0Zyb250KHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzYXZlIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IGRhdGFcclxuICAgICAqL1xyXG4gICAgc2F2ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHt9XHJcbiAgICAgICAgY29uc3QgbWF4aW1pemVkID0gdGhpcy5tYXhpbWl6ZWRcclxuICAgICAgICBpZiAobWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5tYXhpbWl6ZWQgPSB7IHg6IG1heGltaXplZC54LCB5OiBtYXhpbWl6ZWQueSwgd2lkdGg6IG1heGltaXplZC53aWR0aCwgaGVpZ2h0OiBtYXhpbWl6ZWQuaGVpZ2h0IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbWluaW1pemVkID0gdGhpcy5taW5pbWl6ZWRcclxuICAgICAgICBpZiAobWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5taW5pbWl6ZWQgPSB7IHg6IHRoaXMubWluaW1pemVkLngsIHk6IHRoaXMubWluaW1pemVkLnkgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXN0TWluaW1pemVkID0gdGhpcy5fbGFzdE1pbmltaXplZFxyXG4gICAgICAgIGlmIChsYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5sYXN0TWluaW1pemVkID0geyB4OiBsYXN0TWluaW1pemVkLngsIHk6IGxhc3RNaW5pbWl6ZWQueSB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEueCA9IHRoaXMueFxyXG4gICAgICAgIGRhdGEueSA9IHRoaXMueVxyXG4gICAgICAgIGlmIChleGlzdHModGhpcy5vcHRpb25zLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEud2lkdGggPSB0aGlzLm9wdGlvbnMud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMuaGVpZ2h0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEuaGVpZ2h0ID0gdGhpcy5vcHRpb25zLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJuIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBmcm9tIHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGRhdGEubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gZGF0YS5tYXhpbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZGF0YS5taW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSBkYXRhLmxhc3RNaW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy54ID0gZGF0YS54XHJcbiAgICAgICAgdGhpcy55ID0gZGF0YS55XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSBkYXRhLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHMoZGF0YS5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBkYXRhLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGFuZ2UgdGl0bGVcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldCB0aXRsZSgpIHsgcmV0dXJuIHRoaXMuX3RpdGxlIH1cclxuICAgIHNldCB0aXRsZSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlLmlubmVyVGV4dCA9IHZhbHVlXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmlnaHQgY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCByaWdodCgpIHsgcmV0dXJuIHRoaXMueCArIHRoaXMud2lkdGggfVxyXG4gICAgc2V0IHJpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHZhbHVlIC0gdGhpcy53aWR0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYm90dG9tIGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgYm90dG9tKCkgeyByZXR1cm4gdGhpcy55ICsgdGhpcy5oZWlnaHQgfVxyXG4gICAgc2V0IGJvdHRvbSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnkgPSB2YWx1ZSAtIHRoaXMuaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIHJlc3RvcmVkIHRvIG5vcm1hbCBhZnRlciBiZWluZyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemUtcmVzdG9yZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1pbmltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtaW5pbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBvcGVuc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNvcGVuXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBnYWlucyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNmb2N1c1xyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBsb3NlcyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNibHVyXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGNsb3Nlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNjbG9zZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiByZXNpemUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgcmVzaXplIGNvbXBsZXRlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgcmVzaXppbmdcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIG1vdmUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtc3RhcnRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGFmdGVyIG1vdmUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgbW92ZVxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgX2NyZWF0ZVdpbmRvdygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4gPSBodG1sLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53bS53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXJhZGl1cyc6IHRoaXMub3B0aW9ucy5ib3JkZXJSYWRpdXMsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbWluLXdpZHRoJzogdGhpcy5vcHRpb25zLm1pbldpZHRoLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ2JveC1zaGFkb3cnOiB0aGlzLm9wdGlvbnMuc2hhZG93LFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yV2luZG93LFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiB0aGlzLm9wdGlvbnMueCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiB0aGlzLm9wdGlvbnMueSxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IGlzTmFOKHRoaXMub3B0aW9ucy53aWR0aCkgPyB0aGlzLm9wdGlvbnMud2lkdGggOiB0aGlzLm9wdGlvbnMud2lkdGggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IGlzTmFOKHRoaXMub3B0aW9ucy5oZWlnaHQpID8gdGhpcy5vcHRpb25zLmhlaWdodCA6IHRoaXMub3B0aW9ucy5oZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLndpbkJveCA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdjb2x1bW4nLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLm1pbkhlaWdodFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLl9jcmVhdGVUaXRsZWJhcigpXHJcblxyXG4gICAgICAgIHRoaXMuY29udGVudCA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ3NlY3Rpb24nLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2Jsb2NrJyxcclxuICAgICAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteCc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXknOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVzaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUmVzaXplKClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMub3ZlcmxheSA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IDAsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7IHRoaXMuX2Rvd25UaXRsZWJhcihlKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgX2Rvd25UaXRsZWJhcihlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmluZyA9IHRoaXMuX3RvTG9jYWwoe1xyXG4gICAgICAgICAgICAgICAgeDogZXZlbnQucGFnZVgsXHJcbiAgICAgICAgICAgICAgICB5OiBldmVudC5wYWdlWVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUtc3RhcnQnLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVUaXRsZWJhcigpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5UaXRsZWJhciA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2hlYWRlcicsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IHRoaXMub3B0aW9ucy50aXRsZWJhckhlaWdodCxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6ICcwIDhweCcsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy53aW5UaXRsZSA9IGh0bWwuY3JlYXRlKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpblRpdGxlYmFyLCB0eXBlOiAnc3BhbicsIGh0bWw6IHRoaXMub3B0aW9ucy50aXRsZSwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnY3Vyc29yJzogJ2RlZmF1bHQnLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICc4cHgnLFxyXG4gICAgICAgICAgICAgICAgJ21hcmdpbic6IDAsXHJcbiAgICAgICAgICAgICAgICAnZm9udC1zaXplJzogJzE2cHgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZvbnQtd2VpZ2h0JzogNDAwLFxyXG4gICAgICAgICAgICAgICAgJ2NvbG9yJzogdGhpcy5vcHRpb25zLmZvcmVncm91bmRDb2xvclRpdGxlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZUJ1dHRvbnMoKVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1vdmFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVCdXR0b25zKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbkJ1dHRvbkdyb3VwID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICcycHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHtcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnaW5saW5lLWJsb2NrJyxcclxuICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAnNXB4JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnd2lkdGgnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdoZWlnaHQnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtc2l6ZSc6ICdjb3ZlcicsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXJlcGVhdCc6ICduby1yZXBlYXQnLFxyXG4gICAgICAgICAgICAnb3BhY2l0eSc6IC43LFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yQnV0dG9uLFxyXG4gICAgICAgICAgICAnb3V0bGluZSc6IDBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idXR0b25zID0ge31cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pbmltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWluaW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1pbmltaXplID0gaHRtbC5jcmVhdGUoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWluaW1pemUsICgpID0+IHRoaXMubWluaW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSA9IGh0bWwuY3JlYXRlKHsgcGFyZW50OiB0aGlzLndpbkJ1dHRvbkdyb3VwLCBodG1sOiAnJm5ic3A7JywgdHlwZTogJ2J1dHRvbicsIHN0eWxlczogYnV0dG9uIH0pXHJcbiAgICAgICAgICAgIGNsaWNrZWQodGhpcy5idXR0b25zLm1heGltaXplLCAoKSA9PiB0aGlzLm1heGltaXplKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBidXR0b24uYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDbG9zZUJ1dHRvblxyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMuY2xvc2UgPSBodG1sLmNyZWF0ZSh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5jbG9zZSwgKCkgPT4gdGhpcy5jbG9zZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5idXR0b25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5idXR0b25zW2tleV1cclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDAuN1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UgPSBodG1sLmNyZWF0ZSh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdidXR0b24nLCBodG1sOiAnJm5ic3AnLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnYm90dG9tJzogMCxcclxuICAgICAgICAgICAgICAgICdyaWdodCc6ICc0cHgnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnc2UtcmVzaXplJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXNpemUsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzE1cHgnLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGRvd24gPSAoZSkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemluZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggLSBldmVudC5wYWdlWCxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAtIGV2ZW50LnBhZ2VZXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1zdGFydCcpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZG93bilcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGRvd24pXHJcbiAgICB9XHJcblxyXG4gICAgX21vdmUoZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1RvdWNoRXZlbnQoZSkgJiYgZS53aGljaCAhPT0gMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW92aW5nICYmIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCAtIHRoaXMuX21vdmluZy54LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZIC0gdGhpcy5fbW92aW5nLnlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0geyB4OiB0aGlzLndpbi5vZmZzZXRMZWZ0LCB5OiB0aGlzLndpbi5vZmZzZXRUb3AgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdmVkID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtb3ZlJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fcmVzaXppbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYICsgdGhpcy5fcmVzaXppbmcud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgKyB0aGlzLl9yZXNpemluZy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3VwKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5fbW92aW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vdmVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICB9XHJcblxyXG4gICAgX2xpc3RlbmVycygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BNb3ZlKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLWVuZCcpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSB0aGlzLl9yZXNpemluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1lbmQnKVxyXG4gICAgfVxyXG5cclxuICAgIF9pc1RvdWNoRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuVG91Y2hFdmVudCAmJiAoZSBpbnN0YW5jZW9mIHdpbmRvdy5Ub3VjaEV2ZW50KVxyXG4gICAgfVxyXG5cclxuICAgIF9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVG91Y2hFdmVudChlKSA/IGUuY2hhbmdlZFRvdWNoZXNbMF0gOiBlXHJcbiAgICB9XHJcblxyXG4gICAgX3RvTG9jYWwoY29vcmQpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgeDogY29vcmQueCAtIHRoaXMueCxcclxuICAgICAgICAgICAgeTogY29vcmQueSAtIHRoaXMueVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgeigpIHsgcmV0dXJuIHBhcnNlSW50KHRoaXMud2luLnN0eWxlLnpJbmRleCkgfVxyXG4gICAgc2V0IHoodmFsdWUpIHsgdGhpcy53aW4uc3R5bGUuekluZGV4ID0gdmFsdWUgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdpbmRvdyJdfQ==