'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Events = require('eventemitter3');
var clicked = require('clicked');
var Ease = require('dom-ease');
var exists = require('exists');

var html = require('./html');

var id = 0;

/**
 * Window class returned by WindowManager.createWindow()
 * @extends EventEmitter
 * @hideconstructor
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
         * closes the window (can be reopened with open)
         */

    }, {
        key: 'close',
        value: function close() {
            var _this2 = this;

            if (!this._closed) {
                this._closed = true;
                var ease = this.ease.add(this.win, { scale: 0 });
                ease.on('complete', function () {
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
                        this.win.style.transform = '';
                        var x = this.minimized.x,
                            y = this.minimized.y;
                        this.minimized = false;
                        this.move(x, y);
                        this.emit('minimize-restore', this);
                        this.overlay.style.display = 'none';
                    } else {
                        this.transitioning = true;
                        var ease = this.ease.add(this.win, { scaleX: 1, scaleY: 1, left: this.minimized.x, top: this.minimized.y });
                        ease.on('complete', function () {
                            var x = _this3.minimized.x,
                                y = _this3.minimized.y;
                            _this3.minimized = false;
                            _this3.move(x, y);
                            _this3.emit('minimize-restore', _this3);
                            _this3.transitioning = false;
                            _this3.overlay.style.display = 'none';
                        });
                    }
                } else {
                    var _x = this.x;
                    var _y = this.y;
                    var left = this._lastMinimized ? this._lastMinimized.left : this.x;
                    var top = this._lastMinimized ? this._lastMinimized.top : this.y;
                    var desired = this.options.minimizeSize;
                    var scaleX = desired / this.width;
                    var scaleY = desired / this.height;
                    if (noAnimate) {
                        this.win.style.transform = 'scale(1) scaleX(' + scaleX + ') scaleY(' + scaleY + ')';
                        this.win.style.left = left + 'px';
                        this.win.style.top = top + 'px';
                        this.minimized = { x: _x, y: _y, scaleX: scaleX, scaleY: scaleY };
                        this.emit('minimize', this);
                        this.overlay.style.display = 'block';
                        this._lastMinimized = { left: left, top: top };
                    } else {
                        this.transitioning = true;
                        var _ease = this.ease.add(this.win, { left: left, top: top, scaleX: scaleX, scaleY: scaleY });
                        _ease.on('complete', function () {
                            _this3.minimized = { x: _x, y: _y, scaleX: scaleX, scaleY: scaleY };
                            _this3.emit('minimize', _this3);
                            _this3.transitioning = false;
                            _this3.overlay.style.display = 'block';
                            _this3._lastMinimized = { left: left, top: top };
                            _this3.move(left, top);
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
                    ease.on('complete', function () {
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
                    var _ease2 = this.ease.add(this.win, { left: 0, top: 0, width: this.wm.overlay.offsetWidth, height: this.wm.overlay.offsetHeight });
                    _ease2.on('complete', function () {
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
                data.maximized = { left: maximized.left, top: maximized.top, width: maximized.width, height: maximized.height };
            }
            var minimized = this.minimized;
            if (minimized) {
                data.minimized = { x: this.minimized.x, y: this.minimized.y, scaleX: this.minimized.scaleX, scaleY: this.minimized.scaleY };
            }
            var lastMinimized = this._lastMinimized;
            if (lastMinimized) {
                data.lastMinimized = { left: lastMinimized.left, top: lastMinimized.top };
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

        value: function _createWindow() {
            var _this5 = this;

            this.win = html({
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

            this.winBox = html({
                parent: this.win, styles: {
                    'display': 'flex',
                    'flex-direction': 'column',
                    'width': '100%',
                    'height': '100%',
                    'min-height': this.options.minHeight
                }
            });
            this._createTitlebar();

            this.content = html({
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

            this.overlay = html({
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
                this._moving = {
                    x: event.pageX - this.x,
                    y: event.pageY - this.y
                };
                this.emit('move-start', this);
                this._moved = false;
            }
        }
    }, {
        key: '_createTitlebar',
        value: function _createTitlebar() {
            var _styles,
                _this6 = this;

            this.winTitlebar = html({
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
            this.winTitle = html({
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

            this.winButtonGroup = html({
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
                this.buttons.minimize = html({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button });
                clicked(this.buttons.minimize, function () {
                    return _this7.minimize();
                });
            }
            if (this.options.maximizable) {
                button.backgroundImage = this.options.backgroundMaximizeButton;
                this.buttons.maximize = html({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button });
                clicked(this.buttons.maximize, function () {
                    return _this7.maximize();
                });
            }
            if (this.options.closable) {
                button.backgroundImage = this.options.backgroundCloseButton;
                this.buttons.close = html({ parent: this.winButtonGroup, html: '&nbsp;', type: 'button', styles: button });
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
                    if (this.minimized) {
                        this._moved = true;
                    }
                    this.move(event.pageX - this._moving.x, event.pageY - this._moving.y);
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
            this.emit('move-end', this);
        }
    }, {
        key: '_stopResize',
        value: function _stopResize() {
            this._restore = this._resizing = null;
            this.emit('resize-end', this);
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
        key: 'x',
        get: function get() {
            return this.options.x;
        },
        set: function set(value) {
            this.options.x = value;
            this.win.style.left = value + 'px';
            this.emit('move-x', this);
            if (this.minimized) {
                this._lastMinimized.left = value;
            }
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
            this.emit('move-y', this);
            if (this.minimized) {
                this._lastMinimized.top = value;
            }
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
            this.emit('resize-width', this);
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
            this.emit('resize-height', this);
        }
    }, {
        key: 'title',
        get: function get() {
            return this._title;
        },
        set: function set(value) {
            this.winTitle.innerText = value;
            this.emit('title-change', this);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwicGFyZW50Iiwic3R5bGVzIiwiYm9yZGVyUmFkaXVzIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJzaGFkb3ciLCJiYWNrZ3JvdW5kQ29sb3JXaW5kb3ciLCJpc05hTiIsIndpbkJveCIsIl9jcmVhdGVUaXRsZWJhciIsImNvbnRlbnQiLCJ0eXBlIiwicmVzaXphYmxlIiwiX2NyZWF0ZVJlc2l6ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX2Rvd25UaXRsZWJhciIsInN0b3BQcm9wYWdhdGlvbiIsImV2ZW50IiwiX2NvbnZlcnRNb3ZlRXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZSIsInRpdGxlIiwiZm9yZWdyb3VuZENvbG9yVGl0bGUiLCJfY3JlYXRlQnV0dG9ucyIsIm1vdmFibGUiLCJ3aW5CdXR0b25Hcm91cCIsImJ1dHRvbiIsImZvcmVncm91bmRDb2xvckJ1dHRvbiIsImJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvbiIsImNsb3NhYmxlIiwiYmFja2dyb3VuZENsb3NlQnV0dG9uIiwiY2xvc2UiLCJrZXkiLCJvcGFjaXR5IiwicmVzaXplRWRnZSIsImJhY2tncm91bmRSZXNpemUiLCJkb3duIiwicHJldmVudERlZmF1bHQiLCJfaXNUb3VjaEV2ZW50Iiwid2hpY2giLCJfc3RvcE1vdmUiLCJfc3RvcFJlc2l6ZSIsInJlc2l6ZSIsIndpbmRvdyIsIlRvdWNoRXZlbnQiLCJjaGFuZ2VkVG91Y2hlcyIsInZhbHVlIiwiX3RpdGxlIiwiaW5uZXJUZXh0IiwicGFyc2VJbnQiLCJ6SW5kZXgiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxJQUFNQSxTQUFTQyxRQUFRLGVBQVIsQ0FBZjtBQUNBLElBQU1DLFVBQVVELFFBQVEsU0FBUixDQUFoQjtBQUNBLElBQU1FLE9BQU9GLFFBQVEsVUFBUixDQUFiO0FBQ0EsSUFBTUcsU0FBU0gsUUFBUSxRQUFSLENBQWY7O0FBRUEsSUFBTUksT0FBT0osUUFBUSxRQUFSLENBQWI7O0FBRUEsSUFBSUssS0FBSyxDQUFUOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF1Qk1DLE07OztBQUVG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LENBQWFnQyxNQUFiLEdBQXNCLEtBQUtoQixHQUFMLENBQVNvQyxZQUEvQjtBQUNILGFBSkQsTUFNQTtBQUNJLHFCQUFLcEMsR0FBTCxDQUFTQyxLQUFULENBQWVlLE1BQWYsR0FBd0IsTUFBeEI7QUFDQSxxQkFBS2hDLE9BQUwsQ0FBYWdDLE1BQWIsR0FBc0IsRUFBdEI7QUFDSDtBQUNELGlCQUFLakIsSUFBTCxDQUFVLGVBQVYsRUFBMkIsSUFBM0I7QUFDSDs7OzRCQTBPVztBQUFFLG1CQUFPLEtBQUs4RixNQUFaO0FBQW9CLFM7MEJBQ3hCRCxLLEVBQ1Y7QUFDSSxpQkFBSzFCLFFBQUwsQ0FBYzRCLFNBQWQsR0FBMEJGLEtBQTFCO0FBQ0EsaUJBQUs3RixJQUFMLENBQVUsY0FBVixFQUEwQixJQUExQjtBQUNIOztBQUdEOzs7Ozs7OzRCQUlZO0FBQUUsbUJBQU8sS0FBS2tCLENBQUwsR0FBUyxLQUFLRixLQUFyQjtBQUE0QixTOzBCQUNoQzZFLEssRUFDVjtBQUNJLGlCQUFLM0UsQ0FBTCxHQUFTMkUsUUFBUSxLQUFLN0UsS0FBdEI7QUFDSDs7QUFFRDs7Ozs7Ozs0QkFJYTtBQUFFLG1CQUFPLEtBQUtHLENBQUwsR0FBUyxLQUFLRixNQUFyQjtBQUE2QixTOzBCQUNqQzRFLEssRUFDWDtBQUNJLGlCQUFLMUUsQ0FBTCxHQUFTMEUsUUFBUSxLQUFLNUUsTUFBdEI7QUFDSDs7OzRCQTBZTztBQUFFLG1CQUFPK0UsU0FBUyxLQUFLL0YsR0FBTCxDQUFTQyxLQUFULENBQWUrRixNQUF4QixDQUFQO0FBQXdDLFM7MEJBQzVDSixLLEVBQU87QUFBRSxpQkFBSzVGLEdBQUwsQ0FBU0MsS0FBVCxDQUFlK0YsTUFBZixHQUF3QkosS0FBeEI7QUFBK0I7Ozs7RUExekI3QnJILE07O0FBNnpCckIwSCxPQUFPQyxPQUFQLEdBQWlCcEgsTUFBakIiLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpXHJcbmNvbnN0IGNsaWNrZWQgPSByZXF1aXJlKCdjbGlja2VkJylcclxuY29uc3QgRWFzZSA9IHJlcXVpcmUoJ2RvbS1lYXNlJylcclxuY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5cclxubGV0IGlkID0gMFxyXG5cclxuLyoqXHJcbiAqIFdpbmRvdyBjbGFzcyByZXR1cm5lZCBieSBXaW5kb3dNYW5hZ2VyLmNyZWF0ZVdpbmRvdygpXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAaGlkZWNvbnN0cnVjdG9yXHJcbiAqIEBmaXJlcyBvcGVuXHJcbiAqIEBmaXJlcyBmb2N1c1xyXG4gKiBAZmlyZXMgYmx1clxyXG4gKiBAZmlyZXMgY2xvc2VcclxuICogQGZpcmVzIG1heGltaXplXHJcbiAqIEBmaXJlcyBtYXhpbWl6ZS1yZXN0b3JlXHJcbiAqIEBmaXJlcyBtaW5pbWl6ZVxyXG4gKiBAZmlyZXMgbWluaW1pemUtcmVzdG9yZVxyXG4gKiBAZmlyZXMgbW92ZVxyXG4gKiBAZmlyZXMgbW92ZS1zdGFydFxyXG4gKiBAZmlyZXMgbW92ZS1lbmRcclxuICogQGZpcmVzIHJlc2l6ZVxyXG4gKiBAZmlyZXMgcmVzaXplLXN0YXJ0XHJcbiAqIEBmaXJlcyByZXNpemUtZW5kXHJcbiAqIEBmaXJlcyBtb3ZlLXhcclxuICogQGZpcmVzIG1vdmUteVxyXG4gKiBAZmlyZXMgcmVzaXplLXdpZHRoXHJcbiAqIEBmaXJlcyByZXNpemUtaGVpZ2h0XHJcbiAqL1xyXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd01hbmFnZXJ9IHdtXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih3bSwgb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgdGhpcy53bSA9IHdtXHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGV4aXN0cyh0aGlzLm9wdGlvbnMuaWQpID8gdGhpcy5vcHRpb25zLmlkIDogaWQrK1xyXG5cclxuICAgICAgICB0aGlzLl9jcmVhdGVXaW5kb3coKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVycygpXHJcblxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICB0aGlzLm1heGltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG5cclxuICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IG51bGxcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcblxyXG4gICAgICAgIHRoaXMuZWFzZSA9IG5ldyBFYXNlKHsgZHVyYXRpb246IHRoaXMub3B0aW9ucy5hbmltYXRlVGltZSwgZWFzZTogdGhpcy5vcHRpb25zLmVhc2UgfSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG9wZW4gdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9Gb2N1c10gZG8gbm90IGZvY3VzIHdpbmRvdyB3aGVuIG9wZW5lZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9BbmltYXRlXSBkbyBub3QgYW5pbWF0ZSB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqL1xyXG4gICAgb3Blbihub0ZvY3VzLCBub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnb3BlbicsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgIGlmICghbm9BbmltYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMCknXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAxIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gZmFsc2VcclxuICAgICAgICAgICAgaWYgKCFub0ZvY3VzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvY3VzKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGZvY3VzIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgZm9jdXMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWVcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJBY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdmb2N1cycsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYmx1ciB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGJsdXIoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLm1vZGFsICE9PSB0aGlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckluYWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYmx1cicsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xvc2VzIHRoZSB3aW5kb3cgKGNhbiBiZSByZW9wZW5lZCB3aXRoIG9wZW4pXHJcbiAgICAgKi9cclxuICAgIGNsb3NlKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDAgfSlcclxuICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nsb3NlJywgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbGVmdCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy54IH1cclxuICAgIHNldCB4KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy54ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLXgnLCB0aGlzKVxyXG4gICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQubGVmdCA9IHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdG9wIGNvb3JkaW5hdGVcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB5KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLnkgfVxyXG4gICAgc2V0IHkodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnkgPSB2YWx1ZVxyXG4gICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS15JywgdGhpcylcclxuICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkLnRvcCA9IHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogd2lkdGggb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgd2lkdGgoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMud2lkdGggfHwgdGhpcy53aW4ub2Zmc2V0V2lkdGggfVxyXG4gICAgc2V0IHdpZHRoKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXdpZHRoJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlaWdodCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCBoZWlnaHQoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMuaGVpZ2h0IHx8IHRoaXMud2luLm9mZnNldEhlaWdodCB9XHJcbiAgICBzZXQgaGVpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gJydcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtaGVpZ2h0JywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlc2l6ZSB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcclxuICAgICAqL1xyXG4gICAgcmVzaXplKHdpZHRoLCBoZWlnaHQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoXHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1vdmUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHlcclxuICAgICAqL1xyXG4gICAgbW92ZSh4LCB5KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHhcclxuICAgICAgICB0aGlzLnkgPSB5XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtaW5pbWl6ZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbm9BbmltYXRlXHJcbiAgICAgKi9cclxuICAgIG1pbmltaXplKG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSAmJiB0aGlzLm9wdGlvbnMubWluaW1pemFibGUgJiYgIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLm1pbmltaXplZC54LCB5ID0gdGhpcy5taW5pbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUoeCwgeSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlWDogMSwgc2NhbGVZOiAxLCBsZWZ0OiB0aGlzLm1pbmltaXplZC54LCB0b3A6IHRoaXMubWluaW1pemVkLnkgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5taW5pbWl6ZWQueCwgeSA9IHRoaXMubWluaW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUoeCwgeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZS1yZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueFxyXG4gICAgICAgICAgICAgICAgY29uc3QgeSA9IHRoaXMueVxyXG4gICAgICAgICAgICAgICAgY29uc3QgbGVmdCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWQgPyB0aGlzLl9sYXN0TWluaW1pemVkLmxlZnQgOiB0aGlzLnhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRvcCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWQgPyB0aGlzLl9sYXN0TWluaW1pemVkLnRvcCA6IHRoaXMueVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVzaXJlZCA9IHRoaXMub3B0aW9ucy5taW5pbWl6ZVNpemVcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlWCA9IGRlc2lyZWQgLyB0aGlzLndpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZVkgPSBkZXNpcmVkIC8gdGhpcy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDEpIHNjYWxlWCgnICsgc2NhbGVYICsgJykgc2NhbGVZKCcgKyBzY2FsZVkgKyAnKSdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50b3AgPSB0b3AgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHksIHNjYWxlWCwgc2NhbGVZIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0geyBsZWZ0LCB0b3AgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0LCB0b3AsIHNjYWxlWCwgc2NhbGVZIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHksIHNjYWxlWCwgc2NhbGVZIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0geyBsZWZ0LCB0b3AgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUobGVmdCwgdG9wKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtYXhpbWl6ZSB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIG1heGltaXplKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSAmJiB0aGlzLm9wdGlvbnMubWF4aW1pemFibGUgJiYgIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiB0aGlzLm1heGltaXplZC54LCB0b3A6IHRoaXMubWF4aW1pemVkLnksIHdpZHRoOiB0aGlzLm1heGltaXplZC53aWR0aCwgaGVpZ2h0OiB0aGlzLm1heGltaXplZC5oZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMueCA9IHRoaXMubWF4aW1pemVkLnhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMueSA9IHRoaXMubWF4aW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSB0aGlzLm1heGltaXplZC53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSB0aGlzLm1heGltaXplZC5oZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgd2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aCwgaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiAwLCB0b3A6IDAsIHdpZHRoOiB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGgsIGhlaWdodDogdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0geyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc3RvcmVCdXR0b25cclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWF4aW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZHMgd2luZG93IHRvIGJhY2sgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvQmFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53bS5zZW5kVG9CYWNrKHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBmcm9udCBvZiB3aW5kb3ctbWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzZW5kVG9Gcm9udCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53bS5zZW5kVG9Gcm9udCh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2F2ZSB0aGUgc3RhdGUgb2YgdGhlIHdpbmRvd1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSBkYXRhXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7fVxyXG4gICAgICAgIGNvbnN0IG1heGltaXplZCA9IHRoaXMubWF4aW1pemVkXHJcbiAgICAgICAgaWYgKG1heGltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubWF4aW1pemVkID0geyBsZWZ0OiBtYXhpbWl6ZWQubGVmdCwgdG9wOiBtYXhpbWl6ZWQudG9wLCB3aWR0aDogbWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IG1heGltaXplZC5oZWlnaHQgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBtaW5pbWl6ZWQgPSB0aGlzLm1pbmltaXplZFxyXG4gICAgICAgIGlmIChtaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1pbmltaXplZCA9IHsgeDogdGhpcy5taW5pbWl6ZWQueCwgeTogdGhpcy5taW5pbWl6ZWQueSwgc2NhbGVYOiB0aGlzLm1pbmltaXplZC5zY2FsZVgsIHNjYWxlWTogdGhpcy5taW5pbWl6ZWQuc2NhbGVZIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGFzdE1pbmltaXplZCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWRcclxuICAgICAgICBpZiAobGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubGFzdE1pbmltaXplZCA9IHsgbGVmdDogbGFzdE1pbmltaXplZC5sZWZ0LCB0b3A6IGxhc3RNaW5pbWl6ZWQudG9wIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS54ID0gdGhpcy54XHJcbiAgICAgICAgZGF0YS55ID0gdGhpcy55XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS53aWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXhpc3RzKHRoaXMub3B0aW9ucy5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm4gdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIGZyb20gc2F2ZSgpXHJcbiAgICAgKi9cclxuICAgIGxvYWQoZGF0YSlcclxuICAgIHtcclxuICAgICAgICBpZiAoZGF0YS5tYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBkYXRhLm1heGltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBkYXRhLm1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5sYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IGRhdGEubGFzdE1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnggPSBkYXRhLnhcclxuICAgICAgICB0aGlzLnkgPSBkYXRhLnlcclxuICAgICAgICBpZiAoZXhpc3RzKGRhdGEud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IGRhdGEud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLmhlaWdodCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGRhdGEuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoYW5nZSB0aXRsZVxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0IHRpdGxlKCkgeyByZXR1cm4gdGhpcy5fdGl0bGUgfVxyXG4gICAgc2V0IHRpdGxlKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luVGl0bGUuaW5uZXJUZXh0ID0gdmFsdWVcclxuICAgICAgICB0aGlzLmVtaXQoJ3RpdGxlLWNoYW5nZScsIHRoaXMpXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmlnaHQgY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCByaWdodCgpIHsgcmV0dXJuIHRoaXMueCArIHRoaXMud2lkdGggfVxyXG4gICAgc2V0IHJpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHZhbHVlIC0gdGhpcy53aWR0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYm90dG9tIGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgYm90dG9tKCkgeyByZXR1cm4gdGhpcy55ICsgdGhpcy5oZWlnaHQgfVxyXG4gICAgc2V0IGJvdHRvbSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnkgPSB2YWx1ZSAtIHRoaXMuaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIHJlc3RvcmVkIHRvIG5vcm1hbCBhZnRlciBiZWluZyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemUtcmVzdG9yZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1pbmltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtaW5pbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBvcGVuc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNvcGVuXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBnYWlucyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNmb2N1c1xyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBsb3NlcyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNibHVyXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGNsb3Nlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNjbG9zZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiByZXNpemUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgcmVzaXplIGNvbXBsZXRlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgcmVzaXppbmdcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIG1vdmUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtc3RhcnRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGFmdGVyIG1vdmUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgbW92ZVxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpZHRoIGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXdpZHRoXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIGhlaWdodCBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1oZWlnaHRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4geCBwb3NpdGlvbiBvZiB3aW5kb3cgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXhcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHkgcG9zaXRpb24gb2Ygd2luZG93IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS15XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgX2NyZWF0ZVdpbmRvdygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4gPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndtLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdib3JkZXItcmFkaXVzJzogdGhpcy5vcHRpb25zLmJvcmRlclJhZGl1cyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdtaW4td2lkdGgnOiB0aGlzLm9wdGlvbnMubWluV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm94LXNoYWRvdyc6IHRoaXMub3B0aW9ucy5zaGFkb3csXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JXaW5kb3csXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IHRoaXMub3B0aW9ucy54LFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IHRoaXMub3B0aW9ucy55LFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogaXNOYU4odGhpcy5vcHRpb25zLndpZHRoKSA/IHRoaXMub3B0aW9ucy53aWR0aCA6IHRoaXMub3B0aW9ucy53aWR0aCArICdweCcsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogaXNOYU4odGhpcy5vcHRpb25zLmhlaWdodCkgPyB0aGlzLm9wdGlvbnMuaGVpZ2h0IDogdGhpcy5vcHRpb25zLmhlaWdodCArICdweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMud2luQm94ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAnY29sdW1uJyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy5taW5IZWlnaHRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlVGl0bGViYXIoKVxyXG5cclxuICAgICAgICB0aGlzLmNvbnRlbnQgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ3NlY3Rpb24nLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2Jsb2NrJyxcclxuICAgICAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteCc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXknOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVzaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUmVzaXplKClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMub3ZlcmxheSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4geyB0aGlzLl9kb3duVGl0bGViYXIoZSk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgIH1cclxuXHJcbiAgICBfZG93blRpdGxlYmFyKGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgdGhpcy5fbW92aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgeDogZXZlbnQucGFnZVggLSB0aGlzLngsXHJcbiAgICAgICAgICAgICAgICB5OiBldmVudC5wYWdlWSAtIHRoaXMueVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZS1zdGFydCcsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmVkID0gZmFsc2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVRpdGxlYmFyKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlYmFyID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdoZWFkZXInLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy50aXRsZWJhckhlaWdodCxcclxuICAgICAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAnMCA4cHgnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMud2luVGl0bGUgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpblRpdGxlYmFyLCB0eXBlOiAnc3BhbicsIGh0bWw6IHRoaXMub3B0aW9ucy50aXRsZSwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnY3Vyc29yJzogJ2RlZmF1bHQnLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICc4cHgnLFxyXG4gICAgICAgICAgICAgICAgJ21hcmdpbic6IDAsXHJcbiAgICAgICAgICAgICAgICAnZm9udC1zaXplJzogJzE2cHgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZvbnQtd2VpZ2h0JzogNDAwLFxyXG4gICAgICAgICAgICAgICAgJ2NvbG9yJzogdGhpcy5vcHRpb25zLmZvcmVncm91bmRDb2xvclRpdGxlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZUJ1dHRvbnMoKVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1vdmFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVCdXR0b25zKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbkJ1dHRvbkdyb3VwID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZy1sZWZ0JzogJzJweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgYnV0dG9uID0ge1xyXG4gICAgICAgICAgICAnZGlzcGxheSc6ICdpbmxpbmUtYmxvY2snLFxyXG4gICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgJ21hcmdpbic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4tbGVmdCc6ICc1cHgnLFxyXG4gICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICd3aWR0aCc6ICcxMnB4JyxcclxuICAgICAgICAgICAgJ2hlaWdodCc6ICcxMnB4JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1zaXplJzogJ2NvdmVyJyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtcmVwZWF0JzogJ25vLXJlcGVhdCcsXHJcbiAgICAgICAgICAgICdvcGFjaXR5JzogLjcsXHJcbiAgICAgICAgICAgICdjb2xvcic6IHRoaXMub3B0aW9ucy5mb3JlZ3JvdW5kQ29sb3JCdXR0b24sXHJcbiAgICAgICAgICAgICdvdXRsaW5lJzogMFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJ1dHRvbnMgPSB7fVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubWluaW1pemFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBidXR0b24uYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWluaW1pemUgPSBodG1sKHsgcGFyZW50OiB0aGlzLndpbkJ1dHRvbkdyb3VwLCBodG1sOiAnJm5ic3A7JywgdHlwZTogJ2J1dHRvbicsIHN0eWxlczogYnV0dG9uIH0pXHJcbiAgICAgICAgICAgIGNsaWNrZWQodGhpcy5idXR0b25zLm1pbmltaXplLCAoKSA9PiB0aGlzLm1pbmltaXplKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubWF4aW1pemFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBidXR0b24uYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNYXhpbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUgPSBodG1sKHsgcGFyZW50OiB0aGlzLndpbkJ1dHRvbkdyb3VwLCBodG1sOiAnJm5ic3A7JywgdHlwZTogJ2J1dHRvbicsIHN0eWxlczogYnV0dG9uIH0pXHJcbiAgICAgICAgICAgIGNsaWNrZWQodGhpcy5idXR0b25zLm1heGltaXplLCAoKSA9PiB0aGlzLm1heGltaXplKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBidXR0b24uYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDbG9zZUJ1dHRvblxyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMuY2xvc2UgPSBodG1sKHsgcGFyZW50OiB0aGlzLndpbkJ1dHRvbkdyb3VwLCBodG1sOiAnJm5ic3A7JywgdHlwZTogJ2J1dHRvbicsIHN0eWxlczogYnV0dG9uIH0pXHJcbiAgICAgICAgICAgIGNsaWNrZWQodGhpcy5idXR0b25zLmNsb3NlLCAoKSA9PiB0aGlzLmNsb3NlKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmJ1dHRvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBidXR0b24gPSB0aGlzLmJ1dHRvbnNba2V5XVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAxXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMC43XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnYnV0dG9uJywgaHRtbDogJyZuYnNwJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgJ2JvdHRvbSc6IDAsXHJcbiAgICAgICAgICAgICAgICAncmlnaHQnOiAnNHB4JyxcclxuICAgICAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAgICAgJ21hcmdpbic6IDAsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICAgICAnY3Vyc29yJzogJ3NlLXJlc2l6ZScsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZCc6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kUmVzaXplLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxNXB4JyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMHB4J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBkb3duID0gKGUpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICAgICAgICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMud2lkdGggfHwgdGhpcy53aW4ub2Zmc2V0V2lkdGhcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IHRoaXMuaGVpZ2h0IHx8IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXppbmcgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoIC0gZXZlbnQucGFnZVgsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgLSBldmVudC5wYWdlWVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtc3RhcnQnKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5yZXNpemVFZGdlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGRvd24pXHJcbiAgICAgICAgdGhpcy5yZXNpemVFZGdlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBkb3duKVxyXG4gICAgfVxyXG5cclxuICAgIF9tb3ZlKGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5faXNUb3VjaEV2ZW50KGUpICYmIGUud2hpY2ggIT09IDEpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX21vdmluZyAmJiB0aGlzLl9zdG9wTW92ZSgpXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemluZyAmJiB0aGlzLl9zdG9wUmVzaXplKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5fbW92aW5nKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW92ZWQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmUoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVggLSB0aGlzLl9tb3ZpbmcueCxcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWSAtIHRoaXMuX21vdmluZy55XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9yZXNpemluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemUoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVggKyB0aGlzLl9yZXNpemluZy53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWSArIHRoaXMuX3Jlc2l6aW5nLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfdXAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbW92ZWQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZXNpemluZyAmJiB0aGlzLl9zdG9wUmVzaXplKClcclxuICAgIH1cclxuXHJcbiAgICBfbGlzdGVuZXJzKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMuZm9jdXMoKSlcclxuICAgIH1cclxuXHJcbiAgICBfc3RvcE1vdmUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX21vdmluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUtZW5kJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICBfc3RvcFJlc2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IHRoaXMuX3Jlc2l6aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLWVuZCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgX2lzVG91Y2hFdmVudChlKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5Ub3VjaEV2ZW50ICYmIChlIGluc3RhbmNlb2Ygd2luZG93LlRvdWNoRXZlbnQpXHJcbiAgICB9XHJcblxyXG4gICAgX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXNUb3VjaEV2ZW50KGUpID8gZS5jaGFuZ2VkVG91Y2hlc1swXSA6IGVcclxuICAgIH1cclxuXHJcbiAgICBnZXQgeigpIHsgcmV0dXJuIHBhcnNlSW50KHRoaXMud2luLnN0eWxlLnpJbmRleCkgfVxyXG4gICAgc2V0IHoodmFsdWUpIHsgdGhpcy53aW4uc3R5bGUuekluZGV4ID0gdmFsdWUgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdpbmRvdyJdfQ==