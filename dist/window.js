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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwicGFyZW50Iiwic3R5bGVzIiwiYm9yZGVyUmFkaXVzIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJzaGFkb3ciLCJiYWNrZ3JvdW5kQ29sb3JXaW5kb3ciLCJpc05hTiIsIndpbkJveCIsIl9jcmVhdGVUaXRsZWJhciIsImNvbnRlbnQiLCJ0eXBlIiwicmVzaXphYmxlIiwiX2NyZWF0ZVJlc2l6ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX2Rvd25UaXRsZWJhciIsInN0b3BQcm9wYWdhdGlvbiIsImV2ZW50IiwiX2NvbnZlcnRNb3ZlRXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZSIsInRpdGxlIiwiZm9yZWdyb3VuZENvbG9yVGl0bGUiLCJfY3JlYXRlQnV0dG9ucyIsIm1vdmFibGUiLCJ3aW5CdXR0b25Hcm91cCIsImJ1dHRvbiIsImZvcmVncm91bmRDb2xvckJ1dHRvbiIsImJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvbiIsImNsb3NhYmxlIiwiYmFja2dyb3VuZENsb3NlQnV0dG9uIiwiY2xvc2UiLCJrZXkiLCJvcGFjaXR5IiwicmVzaXplRWRnZSIsImJhY2tncm91bmRSZXNpemUiLCJkb3duIiwicHJldmVudERlZmF1bHQiLCJfaXNUb3VjaEV2ZW50Iiwid2hpY2giLCJfc3RvcE1vdmUiLCJfc3RvcFJlc2l6ZSIsInJlc2l6ZSIsIndpbmRvdyIsIlRvdWNoRXZlbnQiLCJjaGFuZ2VkVG91Y2hlcyIsInZhbHVlIiwiX3RpdGxlIiwiaW5uZXJUZXh0IiwicGFyc2VJbnQiLCJ6SW5kZXgiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxJQUFNQSxTQUFTQyxRQUFRLGVBQVIsQ0FBZjtBQUNBLElBQU1DLFVBQVVELFFBQVEsU0FBUixDQUFoQjtBQUNBLElBQU1FLE9BQU9GLFFBQVEsVUFBUixDQUFiO0FBQ0EsSUFBTUcsU0FBU0gsUUFBUSxRQUFSLENBQWY7O0FBRUEsSUFBTUksT0FBT0osUUFBUSxRQUFSLENBQWI7O0FBRUEsSUFBSUssS0FBSyxDQUFUOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF1Qk1DLE07OztBQUVGOzs7O0FBSUEsb0JBQVlDLEVBQVosRUFBZ0JDLE9BQWhCLEVBQ0E7QUFBQTs7QUFBQTs7QUFFSSxjQUFLRCxFQUFMLEdBQVVBLEVBQVY7O0FBRUEsY0FBS0MsT0FBTCxHQUFlQSxPQUFmOztBQUVBLGNBQUtILEVBQUwsR0FBVUYsT0FBTyxNQUFLSyxPQUFMLENBQWFILEVBQXBCLElBQTBCLE1BQUtHLE9BQUwsQ0FBYUgsRUFBdkMsR0FBNENBLElBQXREOztBQUVBLGNBQUtJLGFBQUw7QUFDQSxjQUFLQyxVQUFMOztBQUVBLGNBQUtDLE1BQUwsR0FBYyxLQUFkO0FBQ0EsY0FBS0MsU0FBTCxHQUFpQixLQUFqQjtBQUNBLGNBQUtDLFNBQUwsR0FBaUIsS0FBakI7O0FBRUEsY0FBS0MsT0FBTCxHQUFlLElBQWY7QUFDQSxjQUFLQyxRQUFMLEdBQWdCLElBQWhCO0FBQ0EsY0FBS0MsT0FBTCxHQUFlLElBQWY7QUFDQSxjQUFLQyxTQUFMLEdBQWlCLElBQWpCOztBQUVBLGNBQUtDLElBQUwsR0FBWSxJQUFJaEIsSUFBSixDQUFTLEVBQUVpQixVQUFVLE1BQUtYLE9BQUwsQ0FBYVksV0FBekIsRUFBc0NGLE1BQU0sTUFBS1YsT0FBTCxDQUFhVSxJQUF6RCxFQUFULENBQVo7QUFwQko7QUFxQkM7O0FBRUQ7Ozs7Ozs7Ozs2QkFLS0csTyxFQUFTQyxTLEVBQ2Q7QUFDSSxnQkFBSSxLQUFLUixPQUFULEVBQ0E7QUFDSSxxQkFBS1MsSUFBTCxDQUFVLE1BQVYsRUFBa0IsSUFBbEI7QUFDQSxxQkFBS0MsR0FBTCxDQUFTQyxLQUFULENBQWVDLE9BQWYsR0FBeUIsT0FBekI7QUFDQSxvQkFBSSxDQUFDSixTQUFMLEVBQ0E7QUFDSSx5QkFBS0UsR0FBTCxDQUFTQyxLQUFULENBQWVFLFNBQWYsR0FBMkIsVUFBM0I7QUFDQSx5QkFBS1QsSUFBTCxDQUFVVSxHQUFWLENBQWMsS0FBS0osR0FBbkIsRUFBd0IsRUFBRUssT0FBTyxDQUFULEVBQXhCO0FBQ0g7QUFDRCxxQkFBS2YsT0FBTCxHQUFlLEtBQWY7QUFDQSxvQkFBSSxDQUFDTyxPQUFMLEVBQ0E7QUFDSSx5QkFBS1MsS0FBTDtBQUNIO0FBQ0o7QUFDSjs7QUFFRDs7Ozs7O2dDQUlBO0FBQ0ksZ0JBQUksS0FBS3ZCLEVBQUwsQ0FBUXdCLFdBQVIsQ0FBb0IsSUFBcEIsQ0FBSixFQUNBO0FBQ0ksb0JBQUksS0FBS2xCLFNBQVQsRUFDQTtBQUNJLHlCQUFLbUIsUUFBTDtBQUNIO0FBQ0QscUJBQUtyQixNQUFMLEdBQWMsSUFBZDtBQUNBLHFCQUFLc0IsV0FBTCxDQUFpQlIsS0FBakIsQ0FBdUJTLGVBQXZCLEdBQXlDLEtBQUsxQixPQUFMLENBQWEyQiw2QkFBdEQ7QUFDQSxxQkFBS1osSUFBTCxDQUFVLE9BQVYsRUFBbUIsSUFBbkI7QUFDSDtBQUNKOztBQUVEOzs7Ozs7K0JBSUE7QUFDSSxnQkFBSSxLQUFLaEIsRUFBTCxDQUFRNkIsS0FBUixLQUFrQixJQUF0QixFQUNBO0FBQ0kscUJBQUt6QixNQUFMLEdBQWMsS0FBZDtBQUNBLHFCQUFLc0IsV0FBTCxDQUFpQlIsS0FBakIsQ0FBdUJTLGVBQXZCLEdBQXlDLEtBQUsxQixPQUFMLENBQWE2QiwrQkFBdEQ7QUFDQSxxQkFBS2QsSUFBTCxDQUFVLE1BQVYsRUFBa0IsSUFBbEI7QUFDSDtBQUNKOztBQUVEOzs7Ozs7Z0NBSUE7QUFBQTs7QUFDSSxnQkFBSSxDQUFDLEtBQUtULE9BQVYsRUFDQTtBQUNJLHFCQUFLQSxPQUFMLEdBQWUsSUFBZjtBQUNBLG9CQUFNSSxPQUFPLEtBQUtBLElBQUwsQ0FBVVUsR0FBVixDQUFjLEtBQUtKLEdBQW5CLEVBQXdCLEVBQUVLLE9BQU8sQ0FBVCxFQUF4QixDQUFiO0FBQ0FYLHFCQUFLb0IsRUFBTCxDQUFRLFVBQVIsRUFBb0IsWUFDcEI7QUFDSSwyQkFBS2QsR0FBTCxDQUFTQyxLQUFULENBQWVDLE9BQWYsR0FBeUIsTUFBekI7QUFDQSwyQkFBS0gsSUFBTCxDQUFVLE9BQVY7QUFDSCxpQkFKRDtBQUtIO0FBQ0o7O0FBRUQ7Ozs7Ozs7OztBQXdFQTs7Ozs7K0JBS09nQixLLEVBQU9DLE0sRUFDZDtBQUNJLGlCQUFLRCxLQUFMLEdBQWFBLEtBQWI7QUFDQSxpQkFBS0MsTUFBTCxHQUFjQSxNQUFkO0FBQ0g7O0FBRUQ7Ozs7Ozs7OzZCQUtLQyxDLEVBQUdDLEMsRUFDUjtBQUNJLGlCQUFLRCxDQUFMLEdBQVNBLENBQVQ7QUFDQSxpQkFBS0MsQ0FBTCxHQUFTQSxDQUFUO0FBQ0g7O0FBRUQ7Ozs7Ozs7aUNBSVNwQixTLEVBQ1Q7QUFBQTs7QUFDSSxnQkFBSSxLQUFLZixFQUFMLENBQVF3QixXQUFSLENBQW9CLElBQXBCLEtBQTZCLEtBQUt2QixPQUFMLENBQWFtQyxXQUExQyxJQUF5RCxDQUFDLEtBQUtDLGFBQW5FLEVBQ0E7QUFDSSxvQkFBSSxLQUFLL0IsU0FBVCxFQUNBO0FBQ0ksd0JBQUlTLFNBQUosRUFDQTtBQUNJLDZCQUFLRSxHQUFMLENBQVNDLEtBQVQsQ0FBZUUsU0FBZixHQUEyQixFQUEzQjtBQUNBLDRCQUFNYyxJQUFJLEtBQUs1QixTQUFMLENBQWU0QixDQUF6QjtBQUFBLDRCQUE0QkMsSUFBSSxLQUFLN0IsU0FBTCxDQUFlNkIsQ0FBL0M7QUFDQSw2QkFBSzdCLFNBQUwsR0FBaUIsS0FBakI7QUFDQSw2QkFBS2dDLElBQUwsQ0FBVUosQ0FBVixFQUFhQyxDQUFiO0FBQ0EsNkJBQUtuQixJQUFMLENBQVUsa0JBQVYsRUFBOEIsSUFBOUI7QUFDQSw2QkFBS3VCLE9BQUwsQ0FBYXJCLEtBQWIsQ0FBbUJDLE9BQW5CLEdBQTZCLE1BQTdCO0FBQ0gscUJBUkQsTUFVQTtBQUNJLDZCQUFLa0IsYUFBTCxHQUFxQixJQUFyQjtBQUNBLDRCQUFNMUIsT0FBTyxLQUFLQSxJQUFMLENBQVVVLEdBQVYsQ0FBYyxLQUFLSixHQUFuQixFQUF3QixFQUFFdUIsUUFBUSxDQUFWLEVBQWFDLFFBQVEsQ0FBckIsRUFBd0JDLE1BQU0sS0FBS3BDLFNBQUwsQ0FBZTRCLENBQTdDLEVBQWdEUyxLQUFLLEtBQUtyQyxTQUFMLENBQWU2QixDQUFwRSxFQUF4QixDQUFiO0FBQ0F4Qiw2QkFBS29CLEVBQUwsQ0FBUSxVQUFSLEVBQW9CLFlBQ3BCO0FBQ0ksZ0NBQU1HLElBQUksT0FBSzVCLFNBQUwsQ0FBZTRCLENBQXpCO0FBQUEsZ0NBQTRCQyxJQUFJLE9BQUs3QixTQUFMLENBQWU2QixDQUEvQztBQUNBLG1DQUFLN0IsU0FBTCxHQUFpQixLQUFqQjtBQUNBLG1DQUFLZ0MsSUFBTCxDQUFVSixDQUFWLEVBQWFDLENBQWI7QUFDQSxtQ0FBS25CLElBQUwsQ0FBVSxrQkFBVjtBQUNBLG1DQUFLcUIsYUFBTCxHQUFxQixLQUFyQjtBQUNBLG1DQUFLRSxPQUFMLENBQWFyQixLQUFiLENBQW1CQyxPQUFuQixHQUE2QixNQUE3QjtBQUNILHlCQVJEO0FBU0g7QUFDSixpQkF6QkQsTUEyQkE7QUFDSSx3QkFBTWUsS0FBSSxLQUFLQSxDQUFmO0FBQ0Esd0JBQU1DLEtBQUksS0FBS0EsQ0FBZjtBQUNBLHdCQUFNTyxPQUFPLEtBQUtFLGNBQUwsR0FBc0IsS0FBS0EsY0FBTCxDQUFvQkYsSUFBMUMsR0FBaUQsS0FBS1IsQ0FBbkU7QUFDQSx3QkFBTVMsTUFBTSxLQUFLQyxjQUFMLEdBQXNCLEtBQUtBLGNBQUwsQ0FBb0JELEdBQTFDLEdBQWdELEtBQUtSLENBQWpFO0FBQ0Esd0JBQU1VLFVBQVUsS0FBSzVDLE9BQUwsQ0FBYTZDLFlBQTdCO0FBQ0Esd0JBQU1OLFNBQVNLLFVBQVUsS0FBS2IsS0FBOUI7QUFDQSx3QkFBTVMsU0FBU0ksVUFBVSxLQUFLWixNQUE5QjtBQUNBLHdCQUFJbEIsU0FBSixFQUNBO0FBQ0ksNkJBQUtFLEdBQUwsQ0FBU0MsS0FBVCxDQUFlRSxTQUFmLEdBQTJCLHFCQUFxQm9CLE1BQXJCLEdBQThCLFdBQTlCLEdBQTRDQyxNQUE1QyxHQUFxRCxHQUFoRjtBQUNBLDZCQUFLeEIsR0FBTCxDQUFTQyxLQUFULENBQWV3QixJQUFmLEdBQXNCQSxPQUFPLElBQTdCO0FBQ0EsNkJBQUt6QixHQUFMLENBQVNDLEtBQVQsQ0FBZXlCLEdBQWYsR0FBcUJBLE1BQU0sSUFBM0I7QUFDQSw2QkFBS3JDLFNBQUwsR0FBaUIsRUFBRTRCLEtBQUYsRUFBS0MsS0FBTCxFQUFRSyxjQUFSLEVBQWdCQyxjQUFoQixFQUFqQjtBQUNBLDZCQUFLekIsSUFBTCxDQUFVLFVBQVYsRUFBc0IsSUFBdEI7QUFDQSw2QkFBS3VCLE9BQUwsQ0FBYXJCLEtBQWIsQ0FBbUJDLE9BQW5CLEdBQTZCLE9BQTdCO0FBQ0EsNkJBQUt5QixjQUFMLEdBQXNCLEVBQUVGLFVBQUYsRUFBUUMsUUFBUixFQUF0QjtBQUNILHFCQVRELE1BV0E7QUFDSSw2QkFBS04sYUFBTCxHQUFxQixJQUFyQjtBQUNBLDRCQUFNMUIsUUFBTyxLQUFLQSxJQUFMLENBQVVVLEdBQVYsQ0FBYyxLQUFLSixHQUFuQixFQUF3QixFQUFFeUIsVUFBRixFQUFRQyxRQUFSLEVBQWFILGNBQWIsRUFBcUJDLGNBQXJCLEVBQXhCLENBQWI7QUFDQTlCLDhCQUFLb0IsRUFBTCxDQUFRLFVBQVIsRUFBb0IsWUFDcEI7QUFDSSxtQ0FBS3pCLFNBQUwsR0FBaUIsRUFBRTRCLEtBQUYsRUFBS0MsS0FBTCxFQUFRSyxjQUFSLEVBQWdCQyxjQUFoQixFQUFqQjtBQUNBLG1DQUFLekIsSUFBTCxDQUFVLFVBQVY7QUFDQSxtQ0FBS3FCLGFBQUwsR0FBcUIsS0FBckI7QUFDQSxtQ0FBS0UsT0FBTCxDQUFhckIsS0FBYixDQUFtQkMsT0FBbkIsR0FBNkIsT0FBN0I7QUFDQSxtQ0FBS3lCLGNBQUwsR0FBc0IsRUFBRUYsVUFBRixFQUFRQyxRQUFSLEVBQXRCO0FBQ0gseUJBUEQ7QUFRSDtBQUNKO0FBQ0o7QUFDSjs7QUFFRDs7Ozs7O21DQUlBO0FBQUE7O0FBQ0ksZ0JBQUksS0FBSzNDLEVBQUwsQ0FBUXdCLFdBQVIsQ0FBb0IsSUFBcEIsS0FBNkIsS0FBS3ZCLE9BQUwsQ0FBYThDLFdBQTFDLElBQXlELENBQUMsS0FBS1YsYUFBbkUsRUFDQTtBQUNJLHFCQUFLQSxhQUFMLEdBQXFCLElBQXJCO0FBQ0Esb0JBQUksS0FBS2hDLFNBQVQsRUFDQTtBQUNJLHdCQUFNTSxPQUFPLEtBQUtBLElBQUwsQ0FBVVUsR0FBVixDQUFjLEtBQUtKLEdBQW5CLEVBQXdCLEVBQUV5QixNQUFNLEtBQUtyQyxTQUFMLENBQWU2QixDQUF2QixFQUEwQlMsS0FBSyxLQUFLdEMsU0FBTCxDQUFlOEIsQ0FBOUMsRUFBaURILE9BQU8sS0FBSzNCLFNBQUwsQ0FBZTJCLEtBQXZFLEVBQThFQyxRQUFRLEtBQUs1QixTQUFMLENBQWU0QixNQUFyRyxFQUF4QixDQUFiO0FBQ0F0Qix5QkFBS29CLEVBQUwsQ0FBUSxVQUFSLEVBQW9CLFlBQ3BCO0FBQ0ksK0JBQUs5QixPQUFMLENBQWFpQyxDQUFiLEdBQWlCLE9BQUs3QixTQUFMLENBQWU2QixDQUFoQztBQUNBLCtCQUFLakMsT0FBTCxDQUFha0MsQ0FBYixHQUFpQixPQUFLOUIsU0FBTCxDQUFlOEIsQ0FBaEM7QUFDQSwrQkFBS2xDLE9BQUwsQ0FBYStCLEtBQWIsR0FBcUIsT0FBSzNCLFNBQUwsQ0FBZTJCLEtBQXBDO0FBQ0EsK0JBQUsvQixPQUFMLENBQWFnQyxNQUFiLEdBQXNCLE9BQUs1QixTQUFMLENBQWU0QixNQUFyQztBQUNBLCtCQUFLNUIsU0FBTCxHQUFpQixJQUFqQjtBQUNBLCtCQUFLZ0MsYUFBTCxHQUFxQixLQUFyQjtBQUNILHFCQVJEO0FBU0EseUJBQUtXLE9BQUwsQ0FBYUMsUUFBYixDQUFzQi9CLEtBQXRCLENBQTRCZ0MsZUFBNUIsR0FBOEMsS0FBS2pELE9BQUwsQ0FBYWtELHdCQUEzRDtBQUNBLHlCQUFLbkMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsSUFBckI7QUFDSCxpQkFkRCxNQWdCQTtBQUNJLHdCQUFNa0IsSUFBSSxLQUFLQSxDQUFmO0FBQUEsd0JBQWtCQyxJQUFJLEtBQUtBLENBQTNCO0FBQUEsd0JBQThCSCxRQUFRLEtBQUtmLEdBQUwsQ0FBU21DLFdBQS9DO0FBQUEsd0JBQTREbkIsU0FBUyxLQUFLaEIsR0FBTCxDQUFTb0MsWUFBOUU7QUFDQSx3QkFBTTFDLFNBQU8sS0FBS0EsSUFBTCxDQUFVVSxHQUFWLENBQWMsS0FBS0osR0FBbkIsRUFBd0IsRUFBRXlCLE1BQU0sQ0FBUixFQUFXQyxLQUFLLENBQWhCLEVBQW1CWCxPQUFPLEtBQUtoQyxFQUFMLENBQVF1QyxPQUFSLENBQWdCYSxXQUExQyxFQUF1RG5CLFFBQVEsS0FBS2pDLEVBQUwsQ0FBUXVDLE9BQVIsQ0FBZ0JjLFlBQS9FLEVBQXhCLENBQWI7QUFDQTFDLDJCQUFLb0IsRUFBTCxDQUFRLFVBQVIsRUFBb0IsWUFDcEI7QUFDSSwrQkFBSzFCLFNBQUwsR0FBaUIsRUFBRTZCLElBQUYsRUFBS0MsSUFBTCxFQUFRSCxZQUFSLEVBQWVDLGNBQWYsRUFBakI7QUFDQSwrQkFBS0ksYUFBTCxHQUFxQixLQUFyQjtBQUNILHFCQUpEO0FBS0EseUJBQUtXLE9BQUwsQ0FBYUMsUUFBYixDQUFzQi9CLEtBQXRCLENBQTRCZ0MsZUFBNUIsR0FBOEMsS0FBS2pELE9BQUwsQ0FBYXFELHVCQUEzRDtBQUNBLHlCQUFLdEMsSUFBTCxDQUFVLFVBQVYsRUFBc0IsSUFBdEI7QUFDSDtBQUNKO0FBQ0o7O0FBRUQ7Ozs7OztxQ0FJQTtBQUNJLGlCQUFLaEIsRUFBTCxDQUFRdUQsVUFBUixDQUFtQixJQUFuQjtBQUNIOztBQUVEOzs7Ozs7c0NBSUE7QUFDSSxpQkFBS3ZELEVBQUwsQ0FBUXdELFdBQVIsQ0FBb0IsSUFBcEI7QUFDSDs7QUFFRDs7Ozs7OzsrQkFLQTtBQUNJLGdCQUFNQyxPQUFPLEVBQWI7QUFDQSxnQkFBTXBELFlBQVksS0FBS0EsU0FBdkI7QUFDQSxnQkFBSUEsU0FBSixFQUNBO0FBQ0lvRCxxQkFBS3BELFNBQUwsR0FBaUIsRUFBRXFDLE1BQU1yQyxVQUFVcUMsSUFBbEIsRUFBd0JDLEtBQUt0QyxVQUFVc0MsR0FBdkMsRUFBNENYLE9BQU8zQixVQUFVMkIsS0FBN0QsRUFBb0VDLFFBQVE1QixVQUFVNEIsTUFBdEYsRUFBakI7QUFDSDtBQUNELGdCQUFNM0IsWUFBWSxLQUFLQSxTQUF2QjtBQUNBLGdCQUFJQSxTQUFKLEVBQ0E7QUFDSW1ELHFCQUFLbkQsU0FBTCxHQUFpQixFQUFFNEIsR0FBRyxLQUFLNUIsU0FBTCxDQUFlNEIsQ0FBcEIsRUFBdUJDLEdBQUcsS0FBSzdCLFNBQUwsQ0FBZTZCLENBQXpDLEVBQTRDSyxRQUFRLEtBQUtsQyxTQUFMLENBQWVrQyxNQUFuRSxFQUEyRUMsUUFBUSxLQUFLbkMsU0FBTCxDQUFlbUMsTUFBbEcsRUFBakI7QUFDSDtBQUNELGdCQUFNaUIsZ0JBQWdCLEtBQUtkLGNBQTNCO0FBQ0EsZ0JBQUljLGFBQUosRUFDQTtBQUNJRCxxQkFBS0MsYUFBTCxHQUFxQixFQUFFaEIsTUFBTWdCLGNBQWNoQixJQUF0QixFQUE0QkMsS0FBS2UsY0FBY2YsR0FBL0MsRUFBckI7QUFDSDtBQUNEYyxpQkFBS3ZCLENBQUwsR0FBUyxLQUFLQSxDQUFkO0FBQ0F1QixpQkFBS3RCLENBQUwsR0FBUyxLQUFLQSxDQUFkO0FBQ0EsZ0JBQUl2QyxPQUFPLEtBQUtLLE9BQUwsQ0FBYStCLEtBQXBCLENBQUosRUFDQTtBQUNJeUIscUJBQUt6QixLQUFMLEdBQWEsS0FBSy9CLE9BQUwsQ0FBYStCLEtBQTFCO0FBQ0g7QUFDRCxnQkFBSXBDLE9BQU8sS0FBS0ssT0FBTCxDQUFhZ0MsTUFBcEIsQ0FBSixFQUNBO0FBQ0l3QixxQkFBS3hCLE1BQUwsR0FBYyxLQUFLaEMsT0FBTCxDQUFhZ0MsTUFBM0I7QUFDSDtBQUNELG1CQUFPd0IsSUFBUDtBQUNIOztBQUVEOzs7Ozs7OzZCQUlLQSxJLEVBQ0w7QUFDSSxnQkFBSUEsS0FBS3BELFNBQVQsRUFDQTtBQUNJLG9CQUFJLENBQUMsS0FBS0EsU0FBVixFQUNBO0FBQ0kseUJBQUs0QyxRQUFMLENBQWMsSUFBZDtBQUNIO0FBQ0QscUJBQUs1QyxTQUFMLEdBQWlCb0QsS0FBS3BELFNBQXRCO0FBQ0g7QUFDRCxnQkFBSW9ELEtBQUtuRCxTQUFULEVBQ0E7QUFDSSxvQkFBSSxDQUFDLEtBQUtBLFNBQVYsRUFDQTtBQUNJLHlCQUFLbUIsUUFBTCxDQUFjLElBQWQ7QUFDSDtBQUNELHFCQUFLbkIsU0FBTCxHQUFpQm1ELEtBQUtuRCxTQUF0QjtBQUNIO0FBQ0QsZ0JBQUltRCxLQUFLQyxhQUFULEVBQ0E7QUFDSSxxQkFBS2QsY0FBTCxHQUFzQmEsS0FBS0MsYUFBM0I7QUFDSDtBQUNELGlCQUFLeEIsQ0FBTCxHQUFTdUIsS0FBS3ZCLENBQWQ7QUFDQSxpQkFBS0MsQ0FBTCxHQUFTc0IsS0FBS3RCLENBQWQ7QUFDQSxnQkFBSXZDLE9BQU82RCxLQUFLekIsS0FBWixDQUFKLEVBQ0E7QUFDSSxxQkFBS0EsS0FBTCxHQUFheUIsS0FBS3pCLEtBQWxCO0FBQ0gsYUFIRCxNQUtBO0FBQ0kscUJBQUtmLEdBQUwsQ0FBU0MsS0FBVCxDQUFlYyxLQUFmLEdBQXVCLE1BQXZCO0FBQ0g7QUFDRCxnQkFBSXBDLE9BQU82RCxLQUFLeEIsTUFBWixDQUFKLEVBQ0E7QUFDSSxxQkFBS0EsTUFBTCxHQUFjd0IsS0FBS3hCLE1BQW5CO0FBQ0gsYUFIRCxNQUtBO0FBQ0kscUJBQUtoQixHQUFMLENBQVNDLEtBQVQsQ0FBZWUsTUFBZixHQUF3QixNQUF4QjtBQUNIO0FBQ0o7O0FBRUQ7Ozs7Ozs7OztBQWdDQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7O0FBS0E7Ozs7O0FBS0E7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU9BOzs7Ozs7d0NBT0E7QUFBQTs7QUFDSSxpQkFBS2hCLEdBQUwsR0FBV3BCLEtBQUs7QUFDWjhELHdCQUFRLEtBQUszRCxFQUFMLENBQVFpQixHQURKLEVBQ1MyQyxRQUFRO0FBQ3pCLCtCQUFXLE1BRGM7QUFFekIscUNBQWlCLEtBQUszRCxPQUFMLENBQWE0RCxZQUZMO0FBR3pCLG1DQUFlLE1BSFU7QUFJekIsZ0NBQVksUUFKYTtBQUt6QixnQ0FBWSxVQUxhO0FBTXpCLGlDQUFhLEtBQUs1RCxPQUFMLENBQWE2RCxRQU5EO0FBT3pCLGtDQUFjLEtBQUs3RCxPQUFMLENBQWE4RCxTQVBGO0FBUXpCLGtDQUFjLEtBQUs5RCxPQUFMLENBQWErRCxNQVJGO0FBU3pCLHdDQUFvQixLQUFLL0QsT0FBTCxDQUFhZ0UscUJBVFI7QUFVekIsNEJBQVEsS0FBS2hFLE9BQUwsQ0FBYWlDLENBVkk7QUFXekIsMkJBQU8sS0FBS2pDLE9BQUwsQ0FBYWtDLENBWEs7QUFZekIsNkJBQVMrQixNQUFNLEtBQUtqRSxPQUFMLENBQWErQixLQUFuQixJQUE0QixLQUFLL0IsT0FBTCxDQUFhK0IsS0FBekMsR0FBaUQsS0FBSy9CLE9BQUwsQ0FBYStCLEtBQWIsR0FBcUIsSUFadEQ7QUFhekIsOEJBQVVrQyxNQUFNLEtBQUtqRSxPQUFMLENBQWFnQyxNQUFuQixJQUE2QixLQUFLaEMsT0FBTCxDQUFhZ0MsTUFBMUMsR0FBbUQsS0FBS2hDLE9BQUwsQ0FBYWdDLE1BQWIsR0FBc0I7QUFiMUQ7QUFEakIsYUFBTCxDQUFYOztBQWtCQSxpQkFBS2tDLE1BQUwsR0FBY3RFLEtBQUs7QUFDZjhELHdCQUFRLEtBQUsxQyxHQURFLEVBQ0cyQyxRQUFRO0FBQ3RCLCtCQUFXLE1BRFc7QUFFdEIsc0NBQWtCLFFBRkk7QUFHdEIsNkJBQVMsTUFIYTtBQUl0Qiw4QkFBVSxNQUpZO0FBS3RCLGtDQUFjLEtBQUszRCxPQUFMLENBQWE4RDtBQUxMO0FBRFgsYUFBTCxDQUFkO0FBU0EsaUJBQUtLLGVBQUw7O0FBRUEsaUJBQUtDLE9BQUwsR0FBZXhFLEtBQUs7QUFDaEI4RCx3QkFBUSxLQUFLUSxNQURHLEVBQ0tHLE1BQU0sU0FEWCxFQUNzQlYsUUFBUTtBQUMxQywrQkFBVyxPQUQrQjtBQUUxQyw0QkFBUSxDQUZrQztBQUcxQyxrQ0FBYyxLQUFLRyxTQUh1QjtBQUkxQyxrQ0FBYyxRQUo0QjtBQUsxQyxrQ0FBYztBQUw0QjtBQUQ5QixhQUFMLENBQWY7O0FBVUEsZ0JBQUksS0FBSzlELE9BQUwsQ0FBYXNFLFNBQWpCLEVBQ0E7QUFDSSxxQkFBS0MsYUFBTDtBQUNIOztBQUVELGlCQUFLakMsT0FBTCxHQUFlMUMsS0FBSztBQUNoQjhELHdCQUFRLEtBQUsxQyxHQURHLEVBQ0UyQyxRQUFRO0FBQ3RCLCtCQUFXLE1BRFc7QUFFdEIsZ0NBQVksVUFGVTtBQUd0Qiw0QkFBUSxDQUhjO0FBSXRCLDJCQUFPLENBSmU7QUFLdEIsNkJBQVMsTUFMYTtBQU10Qiw4QkFBVTtBQU5ZO0FBRFYsYUFBTCxDQUFmO0FBVUEsaUJBQUtyQixPQUFMLENBQWFrQyxnQkFBYixDQUE4QixXQUE5QixFQUEyQyxVQUFDQyxDQUFELEVBQU87QUFBRSx1QkFBS0MsYUFBTCxDQUFtQkQsQ0FBbkIsRUFBdUJBLEVBQUVFLGVBQUY7QUFBcUIsYUFBaEc7QUFDQSxpQkFBS3JDLE9BQUwsQ0FBYWtDLGdCQUFiLENBQThCLFlBQTlCLEVBQTRDLFVBQUNDLENBQUQsRUFBTztBQUFFLHVCQUFLQyxhQUFMLENBQW1CRCxDQUFuQixFQUF1QkEsRUFBRUUsZUFBRjtBQUFxQixhQUFqRztBQUNIOzs7c0NBRWFGLEMsRUFDZDtBQUNJLGdCQUFJLENBQUMsS0FBS3JDLGFBQVYsRUFDQTtBQUNJLG9CQUFNd0MsUUFBUSxLQUFLQyxpQkFBTCxDQUF1QkosQ0FBdkIsQ0FBZDtBQUNBLHFCQUFLakUsT0FBTCxHQUFlO0FBQ1h5Qix1QkFBRzJDLE1BQU1FLEtBQU4sR0FBYyxLQUFLN0MsQ0FEWDtBQUVYQyx1QkFBRzBDLE1BQU1HLEtBQU4sR0FBYyxLQUFLN0M7QUFGWCxpQkFBZjtBQUlBLHFCQUFLbkIsSUFBTCxDQUFVLFlBQVYsRUFBd0IsSUFBeEI7QUFDQSxxQkFBS2lFLE1BQUwsR0FBYyxLQUFkO0FBQ0g7QUFDSjs7OzBDQUdEO0FBQUE7QUFBQTs7QUFDSSxpQkFBS3ZELFdBQUwsR0FBbUI3QixLQUFLO0FBQ3BCOEQsd0JBQVEsS0FBS1EsTUFETyxFQUNDRyxNQUFNLFFBRFAsRUFDaUJWLFFBQVE7QUFDekMsbUNBQWUsTUFEMEI7QUFFekMsK0JBQVcsTUFGOEI7QUFHekMsc0NBQWtCLEtBSHVCO0FBSXpDLG1DQUFlLFFBSjBCO0FBS3pDLDhCQUFVLEtBQUszRCxPQUFMLENBQWFpRixjQUxrQjtBQU16QyxrQ0FBYyxLQUFLakYsT0FBTCxDQUFhaUYsY0FOYztBQU96Qyw4QkFBVSxDQVArQjtBQVF6QywrQkFBVyxPQVI4QjtBQVN6QyxnQ0FBWTtBQVQ2QjtBQUR6QixhQUFMLENBQW5CO0FBYUEsaUJBQUtDLFFBQUwsR0FBZ0J0RixLQUFLO0FBQ2pCOEQsd0JBQVEsS0FBS2pDLFdBREksRUFDUzRDLE1BQU0sTUFEZixFQUN1QnpFLE1BQU0sS0FBS0ksT0FBTCxDQUFhbUYsS0FEMUMsRUFDaUR4QjtBQUM5RCxtQ0FBZSxNQUQrQztBQUU5RCw0QkFBUSxDQUZzRDtBQUc5RCwrQkFBVyxNQUhtRDtBQUk5RCxzQ0FBa0IsS0FKNEM7QUFLOUQsbUNBQWU7QUFMK0MsMkRBTS9DLE1BTitDLDRCQU85RCxRQVA4RCxFQU9wRCxTQVBvRCw0QkFROUQsU0FSOEQsRUFRbkQsQ0FSbUQsNEJBUzlELGNBVDhELEVBUzlDLEtBVDhDLDRCQVU5RCxRQVY4RCxFQVVwRCxDQVZvRCw0QkFXOUQsV0FYOEQsRUFXakQsTUFYaUQsNEJBWTlELGFBWjhELEVBWS9DLEdBWitDLDRCQWE5RCxPQWI4RCxFQWFyRCxLQUFLM0QsT0FBTCxDQUFhb0Ysb0JBYndDO0FBRGpELGFBQUwsQ0FBaEI7QUFpQkEsaUJBQUtDLGNBQUw7O0FBRUEsZ0JBQUksS0FBS3JGLE9BQUwsQ0FBYXNGLE9BQWpCLEVBQ0E7QUFDSSxxQkFBSzdELFdBQUwsQ0FBaUIrQyxnQkFBakIsQ0FBa0MsV0FBbEMsRUFBK0MsVUFBQ0MsQ0FBRDtBQUFBLDJCQUFPLE9BQUtDLGFBQUwsQ0FBbUJELENBQW5CLENBQVA7QUFBQSxpQkFBL0M7QUFDQSxxQkFBS2hELFdBQUwsQ0FBaUIrQyxnQkFBakIsQ0FBa0MsWUFBbEMsRUFBZ0QsVUFBQ0MsQ0FBRDtBQUFBLDJCQUFPLE9BQUtDLGFBQUwsQ0FBbUJELENBQW5CLENBQVA7QUFBQSxpQkFBaEQ7QUFDSDtBQUNKOzs7eUNBR0Q7QUFBQTs7QUFDSSxpQkFBS2MsY0FBTCxHQUFzQjNGLEtBQUs7QUFDdkI4RCx3QkFBUSxLQUFLakMsV0FEVSxFQUNHa0MsUUFBUTtBQUM5QiwrQkFBVyxNQURtQjtBQUU5QixzQ0FBa0IsS0FGWTtBQUc5QixtQ0FBZSxRQUhlO0FBSTlCLG9DQUFnQjtBQUpjO0FBRFgsYUFBTCxDQUF0QjtBQVFBLGdCQUFNNkIsU0FBUztBQUNYLDJCQUFXLGNBREE7QUFFWCwwQkFBVSxDQUZDO0FBR1gsMEJBQVUsQ0FIQztBQUlYLCtCQUFlLEtBSko7QUFLWCwyQkFBVyxDQUxBO0FBTVgseUJBQVMsTUFORTtBQU9YLDBCQUFVLE1BUEM7QUFRWCxvQ0FBb0IsYUFSVDtBQVNYLG1DQUFtQixPQVRSO0FBVVgscUNBQXFCLFdBVlY7QUFXWCwyQkFBVyxFQVhBO0FBWVgseUJBQVMsS0FBS3hGLE9BQUwsQ0FBYXlGLHFCQVpYO0FBYVgsMkJBQVc7QUFiQSxhQUFmO0FBZUEsaUJBQUsxQyxPQUFMLEdBQWUsRUFBZjtBQUNBLGdCQUFJLEtBQUsvQyxPQUFMLENBQWFtQyxXQUFqQixFQUNBO0FBQ0lxRCx1QkFBT3ZDLGVBQVAsR0FBeUIsS0FBS2pELE9BQUwsQ0FBYTBGLHdCQUF0QztBQUNBLHFCQUFLM0MsT0FBTCxDQUFhdkIsUUFBYixHQUF3QjVCLEtBQUssRUFBRThELFFBQVEsS0FBSzZCLGNBQWYsRUFBK0IzRixNQUFNLFFBQXJDLEVBQStDeUUsTUFBTSxRQUFyRCxFQUErRFYsUUFBUTZCLE1BQXZFLEVBQUwsQ0FBeEI7QUFDQS9GLHdCQUFRLEtBQUtzRCxPQUFMLENBQWF2QixRQUFyQixFQUErQjtBQUFBLDJCQUFNLE9BQUtBLFFBQUwsRUFBTjtBQUFBLGlCQUEvQjtBQUNIO0FBQ0QsZ0JBQUksS0FBS3hCLE9BQUwsQ0FBYThDLFdBQWpCLEVBQ0E7QUFDSTBDLHVCQUFPdkMsZUFBUCxHQUF5QixLQUFLakQsT0FBTCxDQUFha0Qsd0JBQXRDO0FBQ0EscUJBQUtILE9BQUwsQ0FBYUMsUUFBYixHQUF3QnBELEtBQUssRUFBRThELFFBQVEsS0FBSzZCLGNBQWYsRUFBK0IzRixNQUFNLFFBQXJDLEVBQStDeUUsTUFBTSxRQUFyRCxFQUErRFYsUUFBUTZCLE1BQXZFLEVBQUwsQ0FBeEI7QUFDQS9GLHdCQUFRLEtBQUtzRCxPQUFMLENBQWFDLFFBQXJCLEVBQStCO0FBQUEsMkJBQU0sT0FBS0EsUUFBTCxFQUFOO0FBQUEsaUJBQS9CO0FBQ0g7QUFDRCxnQkFBSSxLQUFLaEQsT0FBTCxDQUFhMkYsUUFBakIsRUFDQTtBQUNJSCx1QkFBT3ZDLGVBQVAsR0FBeUIsS0FBS2pELE9BQUwsQ0FBYTRGLHFCQUF0QztBQUNBLHFCQUFLN0MsT0FBTCxDQUFhOEMsS0FBYixHQUFxQmpHLEtBQUssRUFBRThELFFBQVEsS0FBSzZCLGNBQWYsRUFBK0IzRixNQUFNLFFBQXJDLEVBQStDeUUsTUFBTSxRQUFyRCxFQUErRFYsUUFBUTZCLE1BQXZFLEVBQUwsQ0FBckI7QUFDQS9GLHdCQUFRLEtBQUtzRCxPQUFMLENBQWE4QyxLQUFyQixFQUE0QjtBQUFBLDJCQUFNLE9BQUtBLEtBQUwsRUFBTjtBQUFBLGlCQUE1QjtBQUNIOztBQTFDTCx1Q0EyQ2FDLEdBM0NiO0FBNkNRLG9CQUFNTixTQUFTLE9BQUt6QyxPQUFMLENBQWErQyxHQUFiLENBQWY7QUFDQU4sdUJBQU9oQixnQkFBUCxDQUF3QixXQUF4QixFQUFxQyxZQUNyQztBQUNJZ0IsMkJBQU92RSxLQUFQLENBQWE4RSxPQUFiLEdBQXVCLENBQXZCO0FBQ0gsaUJBSEQ7QUFJQVAsdUJBQU9oQixnQkFBUCxDQUF3QixVQUF4QixFQUFvQyxZQUNwQztBQUNJZ0IsMkJBQU92RSxLQUFQLENBQWE4RSxPQUFiLEdBQXVCLEdBQXZCO0FBQ0gsaUJBSEQ7QUFsRFI7O0FBMkNJLGlCQUFLLElBQUlELEdBQVQsSUFBZ0IsS0FBSy9DLE9BQXJCLEVBQ0E7QUFBQSxzQkFEUytDLEdBQ1Q7QUFVQztBQUNKOzs7d0NBR0Q7QUFBQTs7QUFDSSxpQkFBS0UsVUFBTCxHQUFrQnBHLEtBQUs7QUFDbkI4RCx3QkFBUSxLQUFLUSxNQURNLEVBQ0VHLE1BQU0sUUFEUixFQUNrQnpFLE1BQU0sT0FEeEIsRUFDaUMrRCxRQUFRO0FBQ3hELGdDQUFZLFVBRDRDO0FBRXhELDhCQUFVLENBRjhDO0FBR3hELDZCQUFTLEtBSCtDO0FBSXhELDhCQUFVLENBSjhDO0FBS3hELDhCQUFVLENBTDhDO0FBTXhELCtCQUFXLENBTjZDO0FBT3hELDhCQUFVLFdBUDhDO0FBUXhELG1DQUFlLE1BUnlDO0FBU3hELGtDQUFjLEtBQUszRCxPQUFMLENBQWFpRyxnQkFUNkI7QUFVeEQsOEJBQVUsTUFWOEM7QUFXeEQsNkJBQVM7QUFYK0M7QUFEekMsYUFBTCxDQUFsQjtBQWVBLGdCQUFNQyxPQUFPLFNBQVBBLElBQU8sQ0FBQ3pCLENBQUQsRUFDYjtBQUNJLG9CQUFJLE9BQUsxRSxFQUFMLENBQVF3QixXQUFSLFFBQUosRUFDQTtBQUNJLHdCQUFNcUQsUUFBUSxPQUFLQyxpQkFBTCxDQUF1QkosQ0FBdkIsQ0FBZDtBQUNBLHdCQUFNMUMsUUFBUSxPQUFLQSxLQUFMLElBQWMsT0FBS2YsR0FBTCxDQUFTbUMsV0FBckM7QUFDQSx3QkFBTW5CLFNBQVMsT0FBS0EsTUFBTCxJQUFlLE9BQUtoQixHQUFMLENBQVNvQyxZQUF2QztBQUNBLDJCQUFLM0MsU0FBTCxHQUFpQjtBQUNic0IsK0JBQU9BLFFBQVE2QyxNQUFNRSxLQURSO0FBRWI5QyxnQ0FBUUEsU0FBUzRDLE1BQU1HO0FBRlYscUJBQWpCO0FBSUEsMkJBQUtoRSxJQUFMLENBQVUsY0FBVjtBQUNBMEQsc0JBQUUwQixjQUFGO0FBQ0g7QUFDSixhQWREO0FBZUEsaUJBQUtILFVBQUwsQ0FBZ0J4QixnQkFBaEIsQ0FBaUMsV0FBakMsRUFBOEMwQixJQUE5QztBQUNBLGlCQUFLRixVQUFMLENBQWdCeEIsZ0JBQWhCLENBQWlDLFlBQWpDLEVBQStDMEIsSUFBL0M7QUFDSDs7OzhCQUVLekIsQyxFQUNOO0FBQ0ksZ0JBQUksS0FBSzFFLEVBQUwsQ0FBUXdCLFdBQVIsQ0FBb0IsSUFBcEIsQ0FBSixFQUNBO0FBQ0ksb0JBQU1xRCxRQUFRLEtBQUtDLGlCQUFMLENBQXVCSixDQUF2QixDQUFkOztBQUVBLG9CQUFJLENBQUMsS0FBSzJCLGFBQUwsQ0FBbUIzQixDQUFuQixDQUFELElBQTBCQSxFQUFFNEIsS0FBRixLQUFZLENBQTFDLEVBQ0E7QUFDSSx5QkFBSzdGLE9BQUwsSUFBZ0IsS0FBSzhGLFNBQUwsRUFBaEI7QUFDQSx5QkFBSzdGLFNBQUwsSUFBa0IsS0FBSzhGLFdBQUwsRUFBbEI7QUFDSDtBQUNELG9CQUFJLEtBQUsvRixPQUFULEVBQ0E7QUFDSSx3QkFBSSxLQUFLSCxTQUFULEVBQ0E7QUFDSSw2QkFBSzJFLE1BQUwsR0FBYyxJQUFkO0FBQ0g7QUFDRCx5QkFBSzNDLElBQUwsQ0FDSXVDLE1BQU1FLEtBQU4sR0FBYyxLQUFLdEUsT0FBTCxDQUFheUIsQ0FEL0IsRUFFSTJDLE1BQU1HLEtBQU4sR0FBYyxLQUFLdkUsT0FBTCxDQUFhMEIsQ0FGL0I7QUFJQSx5QkFBS25CLElBQUwsQ0FBVSxNQUFWLEVBQWtCLElBQWxCO0FBQ0EwRCxzQkFBRTBCLGNBQUY7QUFDSDs7QUFFRCxvQkFBSSxLQUFLMUYsU0FBVCxFQUNBO0FBQ0kseUJBQUsrRixNQUFMLENBQ0k1QixNQUFNRSxLQUFOLEdBQWMsS0FBS3JFLFNBQUwsQ0FBZXNCLEtBRGpDLEVBRUk2QyxNQUFNRyxLQUFOLEdBQWMsS0FBS3RFLFNBQUwsQ0FBZXVCLE1BRmpDO0FBSUEseUJBQUs1QixTQUFMLEdBQWlCLElBQWpCO0FBQ0EseUJBQUtXLElBQUwsQ0FBVSxRQUFWLEVBQW9CLElBQXBCO0FBQ0EwRCxzQkFBRTBCLGNBQUY7QUFDSDtBQUNKO0FBQ0o7Ozs4QkFHRDtBQUNJLGdCQUFJLEtBQUszRixPQUFULEVBQ0E7QUFDSSxvQkFBSSxLQUFLSCxTQUFULEVBQ0E7QUFDSSx3QkFBSSxDQUFDLEtBQUsyRSxNQUFWLEVBQ0E7QUFDSSw2QkFBS3hELFFBQUw7QUFDSDtBQUNKO0FBQ0QscUJBQUs4RSxTQUFMO0FBQ0g7QUFDRCxpQkFBSzdGLFNBQUwsSUFBa0IsS0FBSzhGLFdBQUwsRUFBbEI7QUFDSDs7O3FDQUdEO0FBQUE7O0FBQ0ksaUJBQUt2RixHQUFMLENBQVN3RCxnQkFBVCxDQUEwQixXQUExQixFQUF1QztBQUFBLHVCQUFNLE9BQUtsRCxLQUFMLEVBQU47QUFBQSxhQUF2QztBQUNBLGlCQUFLTixHQUFMLENBQVN3RCxnQkFBVCxDQUEwQixZQUExQixFQUF3QztBQUFBLHVCQUFNLE9BQUtsRCxLQUFMLEVBQU47QUFBQSxhQUF4QztBQUNIOzs7b0NBR0Q7QUFDSSxpQkFBS2QsT0FBTCxHQUFlLElBQWY7QUFDQSxpQkFBS08sSUFBTCxDQUFVLFVBQVYsRUFBc0IsSUFBdEI7QUFDSDs7O3NDQUdEO0FBQ0ksaUJBQUtSLFFBQUwsR0FBZ0IsS0FBS0UsU0FBTCxHQUFpQixJQUFqQztBQUNBLGlCQUFLTSxJQUFMLENBQVUsWUFBVixFQUF3QixJQUF4QjtBQUNIOzs7c0NBRWEwRCxDLEVBQ2Q7QUFDSSxtQkFBTyxDQUFDLENBQUNnQyxPQUFPQyxVQUFULElBQXdCakMsYUFBYWdDLE9BQU9DLFVBQW5EO0FBQ0g7OzswQ0FFaUJqQyxDLEVBQ2xCO0FBQ0ksbUJBQU8sS0FBSzJCLGFBQUwsQ0FBbUIzQixDQUFuQixJQUF3QkEsRUFBRWtDLGNBQUYsQ0FBaUIsQ0FBakIsQ0FBeEIsR0FBOENsQyxDQUFyRDtBQUNIOzs7NEJBN3NCTztBQUFFLG1CQUFPLEtBQUt6RSxPQUFMLENBQWFpQyxDQUFwQjtBQUF1QixTOzBCQUMzQjJFLEssRUFDTjtBQUNJLGlCQUFLNUcsT0FBTCxDQUFhaUMsQ0FBYixHQUFpQjJFLEtBQWpCO0FBQ0EsaUJBQUs1RixHQUFMLENBQVNDLEtBQVQsQ0FBZXdCLElBQWYsR0FBc0JtRSxRQUFRLElBQTlCO0FBQ0EsaUJBQUs3RixJQUFMLENBQVUsUUFBVixFQUFvQixJQUFwQjtBQUNBLGdCQUFJLEtBQUtWLFNBQVQsRUFDQTtBQUNJLHFCQUFLc0MsY0FBTCxDQUFvQkYsSUFBcEIsR0FBMkJtRSxLQUEzQjtBQUNIO0FBQ0o7O0FBRUQ7Ozs7Ozs7NEJBSVE7QUFBRSxtQkFBTyxLQUFLNUcsT0FBTCxDQUFha0MsQ0FBcEI7QUFBdUIsUzswQkFDM0IwRSxLLEVBQ047QUFDSSxpQkFBSzVHLE9BQUwsQ0FBYWtDLENBQWIsR0FBaUIwRSxLQUFqQjtBQUNBLGlCQUFLNUYsR0FBTCxDQUFTQyxLQUFULENBQWV5QixHQUFmLEdBQXFCa0UsUUFBUSxJQUE3QjtBQUNBLGlCQUFLN0YsSUFBTCxDQUFVLFFBQVYsRUFBb0IsSUFBcEI7QUFDQSxnQkFBSSxLQUFLVixTQUFULEVBQ0E7QUFDSSxxQkFBS3NDLGNBQUwsQ0FBb0JELEdBQXBCLEdBQTBCa0UsS0FBMUI7QUFDSDtBQUNKOztBQUVEOzs7Ozs7OzRCQUlZO0FBQUUsbUJBQU8sS0FBSzVHLE9BQUwsQ0FBYStCLEtBQWIsSUFBc0IsS0FBS2YsR0FBTCxDQUFTbUMsV0FBdEM7QUFBbUQsUzswQkFDdkR5RCxLLEVBQ1Y7QUFDSSxnQkFBSUEsS0FBSixFQUNBO0FBQ0kscUJBQUs1RixHQUFMLENBQVNDLEtBQVQsQ0FBZWMsS0FBZixHQUF1QjZFLFFBQVEsSUFBL0I7QUFDQSxxQkFBSzVHLE9BQUwsQ0FBYStCLEtBQWIsR0FBcUIsS0FBS2YsR0FBTCxDQUFTbUMsV0FBOUI7QUFDSCxhQUpELE1BTUE7QUFDSSxxQkFBS25DLEdBQUwsQ0FBU0MsS0FBVCxDQUFlYyxLQUFmLEdBQXVCLE1BQXZCO0FBQ0EscUJBQUsvQixPQUFMLENBQWErQixLQUFiLEdBQXFCLEVBQXJCO0FBQ0g7QUFDRCxpQkFBS2hCLElBQUwsQ0FBVSxjQUFWLEVBQTBCLElBQTFCO0FBQ0g7O0FBRUQ7Ozs7Ozs7NEJBSWE7QUFBRSxtQkFBTyxLQUFLZixPQUFMLENBQWFnQyxNQUFiLElBQXVCLEtBQUtoQixHQUFMLENBQVNvQyxZQUF2QztBQUFxRCxTOzBCQUN6RHdELEssRUFDWDtBQUNJLGdCQUFJQSxLQUFKLEVBQ0E7QUFDSSxxQkFBSzVGLEdBQUwsQ0FBU0MsS0FBVCxDQUFlZSxNQUFmLEdBQXdCNEUsUUFBUSxJQUFoQztBQUNBLHFCQUFLNUcsT0FBTCxDQUFhZ0MsTUFBYixHQUFzQixLQUFLaEIsR0FBTCxDQUFTb0MsWUFBL0I7QUFDSCxhQUpELE1BTUE7QUFDSSxxQkFBS3BDLEdBQUwsQ0FBU0MsS0FBVCxDQUFlZSxNQUFmLEdBQXdCLE1BQXhCO0FBQ0EscUJBQUtoQyxPQUFMLENBQWFnQyxNQUFiLEdBQXNCLEVBQXRCO0FBQ0g7QUFDRCxpQkFBS2pCLElBQUwsQ0FBVSxlQUFWLEVBQTJCLElBQTNCO0FBQ0g7Ozs0QkF5T1c7QUFBRSxtQkFBTyxLQUFLOEYsTUFBWjtBQUFvQixTOzBCQUN4QkQsSyxFQUNWO0FBQ0ksaUJBQUsxQixRQUFMLENBQWM0QixTQUFkLEdBQTBCRixLQUExQjtBQUNBLGlCQUFLN0YsSUFBTCxDQUFVLGNBQVYsRUFBMEIsSUFBMUI7QUFDSDs7QUFHRDs7Ozs7Ozs0QkFJWTtBQUFFLG1CQUFPLEtBQUtrQixDQUFMLEdBQVMsS0FBS0YsS0FBckI7QUFBNEIsUzswQkFDaEM2RSxLLEVBQ1Y7QUFDSSxpQkFBSzNFLENBQUwsR0FBUzJFLFFBQVEsS0FBSzdFLEtBQXRCO0FBQ0g7O0FBRUQ7Ozs7Ozs7NEJBSWE7QUFBRSxtQkFBTyxLQUFLRyxDQUFMLEdBQVMsS0FBS0YsTUFBckI7QUFBNkIsUzswQkFDakM0RSxLLEVBQ1g7QUFDSSxpQkFBSzFFLENBQUwsR0FBUzBFLFFBQVEsS0FBSzVFLE1BQXRCO0FBQ0g7Ozs0QkEwWU87QUFBRSxtQkFBTytFLFNBQVMsS0FBSy9GLEdBQUwsQ0FBU0MsS0FBVCxDQUFlK0YsTUFBeEIsQ0FBUDtBQUF3QyxTOzBCQUM1Q0osSyxFQUFPO0FBQUUsaUJBQUs1RixHQUFMLENBQVNDLEtBQVQsQ0FBZStGLE1BQWYsR0FBd0JKLEtBQXhCO0FBQStCOzs7O0VBenpCN0JySCxNOztBQTR6QnJCMEgsT0FBT0MsT0FBUCxHQUFpQnBILE1BQWpCIiwiZmlsZSI6IndpbmRvdy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKVxyXG5jb25zdCBjbGlja2VkID0gcmVxdWlyZSgnY2xpY2tlZCcpXHJcbmNvbnN0IEVhc2UgPSByZXF1aXJlKCdkb20tZWFzZScpXHJcbmNvbnN0IGV4aXN0cyA9IHJlcXVpcmUoJ2V4aXN0cycpXHJcblxyXG5jb25zdCBodG1sID0gcmVxdWlyZSgnLi9odG1sJylcclxuXHJcbmxldCBpZCA9IDBcclxuXHJcbi8qKlxyXG4gKiBXaW5kb3cgY2xhc3MgcmV0dXJuZWQgYnkgV2luZG93TWFuYWdlci5jcmVhdGVXaW5kb3coKVxyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcclxuICogQGhpZGVjb25zdHJ1Y3RvclxyXG4gKiBAZmlyZXMgb3BlblxyXG4gKiBAZmlyZXMgZm9jdXNcclxuICogQGZpcmVzIGJsdXJcclxuICogQGZpcmVzIGNsb3NlXHJcbiAqIEBmaXJlcyBtYXhpbWl6ZVxyXG4gKiBAZmlyZXMgbWF4aW1pemUtcmVzdG9yZVxyXG4gKiBAZmlyZXMgbWluaW1pemVcclxuICogQGZpcmVzIG1pbmltaXplLXJlc3RvcmVcclxuICogQGZpcmVzIG1vdmVcclxuICogQGZpcmVzIG1vdmUtc3RhcnRcclxuICogQGZpcmVzIG1vdmUtZW5kXHJcbiAqIEBmaXJlcyByZXNpemVcclxuICogQGZpcmVzIHJlc2l6ZS1zdGFydFxyXG4gKiBAZmlyZXMgcmVzaXplLWVuZFxyXG4gKiBAZmlyZXMgbW92ZS14XHJcbiAqIEBmaXJlcyBtb3ZlLXlcclxuICogQGZpcmVzIHJlc2l6ZS13aWR0aFxyXG4gKiBAZmlyZXMgcmVzaXplLWhlaWdodFxyXG4gKi9cclxuY2xhc3MgV2luZG93IGV4dGVuZHMgRXZlbnRzXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtXaW5kb3dNYW5hZ2VyfSB3bVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iod20sIG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIHRoaXMud20gPSB3bVxyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zXHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBleGlzdHModGhpcy5vcHRpb25zLmlkKSA/IHRoaXMub3B0aW9ucy5pZCA6IGlkKytcclxuXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlV2luZG93KClcclxuICAgICAgICB0aGlzLl9saXN0ZW5lcnMoKVxyXG5cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuXHJcbiAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nID0gbnVsbFxyXG5cclxuICAgICAgICB0aGlzLmVhc2UgPSBuZXcgRWFzZSh7IGR1cmF0aW9uOiB0aGlzLm9wdGlvbnMuYW5pbWF0ZVRpbWUsIGVhc2U6IHRoaXMub3B0aW9ucy5lYXNlIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBvcGVuIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vRm9jdXNdIGRvIG5vdCBmb2N1cyB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vQW5pbWF0ZV0gZG8gbm90IGFuaW1hdGUgd2luZG93IHdoZW4gb3BlbmVkXHJcbiAgICAgKi9cclxuICAgIG9wZW4obm9Gb2N1cywgbm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ29wZW4nLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICBpZiAoIW5vQW5pbWF0ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDApJ1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZTogMSB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlXHJcbiAgICAgICAgICAgIGlmICghbm9Gb2N1cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mb2N1cygpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBmb2N1cyB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGZvY3VzKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvclRpdGxlYmFyQWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnZm9jdXMnLCB0aGlzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGJsdXIgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBibHVyKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5tb2RhbCAhPT0gdGhpcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2JsdXInLCB0aGlzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNsb3NlcyB0aGUgd2luZG93IChjYW4gYmUgcmVvcGVuZWQgd2l0aCBvcGVuKVxyXG4gICAgICovXHJcbiAgICBjbG9zZSgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAwIH0pXHJcbiAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjbG9zZScsIHRoaXMpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGxlZnQgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHgoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueCB9XHJcbiAgICBzZXQgeCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueCA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUubGVmdCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS14JywgdGhpcylcclxuICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkLmxlZnQgPSB2YWx1ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHRvcCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeSgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy55IH1cclxuICAgIHNldCB5KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy55ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS50b3AgPSB2YWx1ZSArICdweCdcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUteScsIHRoaXMpXHJcbiAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZC50b3AgPSB2YWx1ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHdpZHRoIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHdpZHRoKCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoIH1cclxuICAgIHNldCB3aWR0aCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS13aWR0aCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWlnaHQgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgaGVpZ2h0KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHQgfVxyXG4gICAgc2V0IGhlaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSB2YWx1ZSArICdweCdcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLWhlaWdodCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXNpemUgdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XHJcbiAgICAgKi9cclxuICAgIHJlc2l6ZSh3aWR0aCwgaGVpZ2h0KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aFxyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtb3ZlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5XHJcbiAgICAgKi9cclxuICAgIG1vdmUoeCwgeSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB4XHJcbiAgICAgICAgdGhpcy55ID0geVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWluaW1pemUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG5vQW5pbWF0ZVxyXG4gICAgICovXHJcbiAgICBtaW5pbWl6ZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykgJiYgdGhpcy5vcHRpb25zLm1pbmltaXphYmxlICYmICF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJydcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5taW5pbWl6ZWQueCwgeSA9IHRoaXMubWluaW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKHgsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZS1yZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZVg6IDEsIHNjYWxlWTogMSwgbGVmdDogdGhpcy5taW5pbWl6ZWQueCwgdG9wOiB0aGlzLm1pbmltaXplZC55IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMubWluaW1pemVkLngsIHkgPSB0aGlzLm1pbmltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKHgsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUtcmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLnhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHkgPSB0aGlzLnlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxlZnQgPSB0aGlzLl9sYXN0TWluaW1pemVkID8gdGhpcy5fbGFzdE1pbmltaXplZC5sZWZ0IDogdGhpcy54XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0b3AgPSB0aGlzLl9sYXN0TWluaW1pemVkID8gdGhpcy5fbGFzdE1pbmltaXplZC50b3AgOiB0aGlzLnlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlc2lyZWQgPSB0aGlzLm9wdGlvbnMubWluaW1pemVTaXplXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZVggPSBkZXNpcmVkIC8gdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbGVZID0gZGVzaXJlZCAvIHRoaXMuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgxKSBzY2FsZVgoJyArIHNjYWxlWCArICcpIHNjYWxlWSgnICsgc2NhbGVZICsgJyknXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdG9wICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0geyB4LCB5LCBzY2FsZVgsIHNjYWxlWSB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IHsgbGVmdCwgdG9wIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdCwgdG9wLCBzY2FsZVgsIHNjYWxlWSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0geyB4LCB5LCBzY2FsZVgsIHNjYWxlWSB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IHsgbGVmdCwgdG9wIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWF4aW1pemUgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBtYXhpbWl6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykgJiYgdGhpcy5vcHRpb25zLm1heGltaXphYmxlICYmICF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdDogdGhpcy5tYXhpbWl6ZWQueCwgdG9wOiB0aGlzLm1heGltaXplZC55LCB3aWR0aDogdGhpcy5tYXhpbWl6ZWQud2lkdGgsIGhlaWdodDogdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0IH0pXHJcbiAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnggPSB0aGlzLm1heGltaXplZC54XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnkgPSB0aGlzLm1heGltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gdGhpcy5tYXhpbWl6ZWQud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNYXhpbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLngsIHkgPSB0aGlzLnksIHdpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGgsIGhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdDogMCwgdG9wOiAwLCB3aWR0aDogdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoLCBoZWlnaHQ6IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXN0b3JlQnV0dG9uXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21heGltaXplJywgdGhpcylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmRzIHdpbmRvdyB0byBiYWNrIG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0JhY2soKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvQmFjayh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZCB3aW5kb3cgdG8gZnJvbnQgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvRnJvbnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvRnJvbnQodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNhdmUgdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gZGF0YVxyXG4gICAgICovXHJcbiAgICBzYXZlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBkYXRhID0ge31cclxuICAgICAgICBjb25zdCBtYXhpbWl6ZWQgPSB0aGlzLm1heGltaXplZFxyXG4gICAgICAgIGlmIChtYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1heGltaXplZCA9IHsgbGVmdDogbWF4aW1pemVkLmxlZnQsIHRvcDogbWF4aW1pemVkLnRvcCwgd2lkdGg6IG1heGltaXplZC53aWR0aCwgaGVpZ2h0OiBtYXhpbWl6ZWQuaGVpZ2h0IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbWluaW1pemVkID0gdGhpcy5taW5pbWl6ZWRcclxuICAgICAgICBpZiAobWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5taW5pbWl6ZWQgPSB7IHg6IHRoaXMubWluaW1pemVkLngsIHk6IHRoaXMubWluaW1pemVkLnksIHNjYWxlWDogdGhpcy5taW5pbWl6ZWQuc2NhbGVYLCBzY2FsZVk6IHRoaXMubWluaW1pemVkLnNjYWxlWSB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxhc3RNaW5pbWl6ZWQgPSB0aGlzLl9sYXN0TWluaW1pemVkXHJcbiAgICAgICAgaWYgKGxhc3RNaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmxhc3RNaW5pbWl6ZWQgPSB7IGxlZnQ6IGxhc3RNaW5pbWl6ZWQubGVmdCwgdG9wOiBsYXN0TWluaW1pemVkLnRvcCB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEueCA9IHRoaXMueFxyXG4gICAgICAgIGRhdGEueSA9IHRoaXMueVxyXG4gICAgICAgIGlmIChleGlzdHModGhpcy5vcHRpb25zLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEud2lkdGggPSB0aGlzLm9wdGlvbnMud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMuaGVpZ2h0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEuaGVpZ2h0ID0gdGhpcy5vcHRpb25zLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJuIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBmcm9tIHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGRhdGEubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gZGF0YS5tYXhpbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZGF0YS5taW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSBkYXRhLmxhc3RNaW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy54ID0gZGF0YS54XHJcbiAgICAgICAgdGhpcy55ID0gZGF0YS55XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSBkYXRhLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHMoZGF0YS5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBkYXRhLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGFuZ2UgdGl0bGVcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldCB0aXRsZSgpIHsgcmV0dXJuIHRoaXMuX3RpdGxlIH1cclxuICAgIHNldCB0aXRsZSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlLmlubmVyVGV4dCA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy5lbWl0KCd0aXRsZS1jaGFuZ2UnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJpZ2h0IGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgcmlnaHQoKSB7IHJldHVybiB0aGlzLnggKyB0aGlzLndpZHRoIH1cclxuICAgIHNldCByaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB2YWx1ZSAtIHRoaXMud2lkdGhcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGJvdHRvbSBjb29yZGluYXRlIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IGJvdHRvbSgpIHsgcmV0dXJuIHRoaXMueSArIHRoaXMuaGVpZ2h0IH1cclxuICAgIHNldCBib3R0b20odmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy55ID0gdmFsdWUgLSB0aGlzLmhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgbWF4aW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21heGltaXplXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyByZXN0b3JlZCB0byBub3JtYWwgYWZ0ZXIgYmVpbmcgbWF4aW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21heGltaXplLXJlc3RvcmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIHJlc3RvcmVkIHRvIG5vcm1hbCBhZnRlciBiZWluZyBtaW5pbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWluaW1pemUtcmVzdG9yZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgb3BlbnNcclxuICAgICAqIEBldmVudCBXaW5kb3cjb3BlblxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgZ2FpbnMgZm9jdXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjZm9jdXNcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgbG9zZXMgZm9jdXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjYmx1clxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBjbG9zZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjY2xvc2VcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gcmVzaXplIHN0YXJ0c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtc3RhcnRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGFmdGVyIHJlc2l6ZSBjb21wbGV0ZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLWVuZFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgZHVyaW5nIHJlc2l6aW5nXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiBtb3ZlIHN0YXJ0c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXN0YXJ0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBhZnRlciBtb3ZlIGNvbXBsZXRlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLWVuZFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgZHVyaW5nIG1vdmVcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aWR0aCBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS13aWR0aFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiBoZWlnaHQgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtaGVpZ2h0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHggcG9zaXRpb24gb2Ygd2luZG93IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS14XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB5IHBvc2l0aW9uIG9mIHdpbmRvdyBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUteVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIF9jcmVhdGVXaW5kb3coKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53bS53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXJhZGl1cyc6IHRoaXMub3B0aW9ucy5ib3JkZXJSYWRpdXMsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbWluLXdpZHRoJzogdGhpcy5vcHRpb25zLm1pbldpZHRoLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ2JveC1zaGFkb3cnOiB0aGlzLm9wdGlvbnMuc2hhZG93LFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yV2luZG93LFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiB0aGlzLm9wdGlvbnMueCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiB0aGlzLm9wdGlvbnMueSxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IGlzTmFOKHRoaXMub3B0aW9ucy53aWR0aCkgPyB0aGlzLm9wdGlvbnMud2lkdGggOiB0aGlzLm9wdGlvbnMud2lkdGggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IGlzTmFOKHRoaXMub3B0aW9ucy5oZWlnaHQpID8gdGhpcy5vcHRpb25zLmhlaWdodCA6IHRoaXMub3B0aW9ucy5oZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLndpbkJveCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ2NvbHVtbicsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVRpdGxlYmFyKClcclxuXHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdzZWN0aW9uJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdibG9jaycsXHJcbiAgICAgICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXgnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdy15JzogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlc2l6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm92ZXJsYXkgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IDAsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7IHRoaXMuX2Rvd25UaXRsZWJhcihlKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgX2Rvd25UaXRsZWJhcihlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmluZyA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gdGhpcy54LFxyXG4gICAgICAgICAgICAgICAgeTogZXZlbnQucGFnZVkgLSB0aGlzLnlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUtc3RhcnQnLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVUaXRsZWJhcigpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5UaXRsZWJhciA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnaGVhZGVyJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogJzAgOHB4JyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLndpblRpdGxlID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgdHlwZTogJ3NwYW4nLCBodG1sOiB0aGlzLm9wdGlvbnMudGl0bGUsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgnOiAxLFxyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdkZWZhdWx0JyxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nLWxlZnQnOiAnOHB4JyxcclxuICAgICAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6ICcxNnB4JyxcclxuICAgICAgICAgICAgICAgICdmb250LXdlaWdodCc6IDQwMCxcclxuICAgICAgICAgICAgICAgICdjb2xvcic6IHRoaXMub3B0aW9ucy5mb3JlZ3JvdW5kQ29sb3JUaXRsZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLl9jcmVhdGVCdXR0b25zKClcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tb3ZhYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlQnV0dG9ucygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5CdXR0b25Hcm91cCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICcycHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHtcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnaW5saW5lLWJsb2NrJyxcclxuICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAnNXB4JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnd2lkdGgnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdoZWlnaHQnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtc2l6ZSc6ICdjb3ZlcicsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXJlcGVhdCc6ICduby1yZXBlYXQnLFxyXG4gICAgICAgICAgICAnb3BhY2l0eSc6IC43LFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yQnV0dG9uLFxyXG4gICAgICAgICAgICAnb3V0bGluZSc6IDBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idXR0b25zID0ge31cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pbmltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWluaW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1pbmltaXplID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5taW5pbWl6ZSwgKCkgPT4gdGhpcy5taW5pbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1heGltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWF4aW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSwgKCkgPT4gdGhpcy5tYXhpbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ2xvc2VCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLmNsb3NlID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5jbG9zZSwgKCkgPT4gdGhpcy5jbG9zZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5idXR0b25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5idXR0b25zW2tleV1cclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDAuN1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2J1dHRvbicsIGh0bWw6ICcmbmJzcCcsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdib3R0b20nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3JpZ2h0JzogJzRweCcsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdzZS1yZXNpemUnLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc2l6ZSxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTVweCcsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTBweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgZG93biA9IChlKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIGV2ZW50LnBhZ2VYLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gZXZlbnQucGFnZVlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXN0YXJ0JylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBkb3duKVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZG93bilcclxuICAgIH1cclxuXHJcbiAgICBfbW92ZShlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2lzVG91Y2hFdmVudChlKSAmJiBlLndoaWNoICE9PSAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3ZpbmcgJiYgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdmVkID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYIC0gdGhpcy5fbW92aW5nLngsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgLSB0aGlzLl9tb3ZpbmcueVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtb3ZlJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fcmVzaXppbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYICsgdGhpcy5fcmVzaXppbmcud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgKyB0aGlzLl9yZXNpemluZy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3VwKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5fbW92aW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vdmVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICB9XHJcblxyXG4gICAgX2xpc3RlbmVycygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BNb3ZlKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLWVuZCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSB0aGlzLl9yZXNpemluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1lbmQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIF9pc1RvdWNoRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuVG91Y2hFdmVudCAmJiAoZSBpbnN0YW5jZW9mIHdpbmRvdy5Ub3VjaEV2ZW50KVxyXG4gICAgfVxyXG5cclxuICAgIF9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVG91Y2hFdmVudChlKSA/IGUuY2hhbmdlZFRvdWNoZXNbMF0gOiBlXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHooKSB7IHJldHVybiBwYXJzZUludCh0aGlzLndpbi5zdHlsZS56SW5kZXgpIH1cclxuICAgIHNldCB6KHZhbHVlKSB7IHRoaXMud2luLnN0eWxlLnpJbmRleCA9IHZhbHVlIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3ciXX0=