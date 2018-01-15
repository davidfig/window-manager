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
        value: function maximize(noAnimate) {
            var _this4 = this;

            if (this.wm._checkModal(this) && this.options.maximizable && !this.transitioning) {
                if (this.maximized) {
                    if (noAnimate) {
                        this.x = this.maximized.x;
                        this.y = this.maximized.y;
                        this.width = this.maximized.width;
                        this.height = this.maximized.height;
                        this.maximized = null;
                        this.emit('restore', this);
                    } else {
                        this.transitioning = true;
                        var ease = this.ease.add(this.win, { left: this.maximized.x, top: this.maximized.y, width: this.maximized.width, height: this.maximized.height });
                        ease.on('complete', function () {
                            _this4.x = _this4.maximized.x;
                            _this4.y = _this4.maximized.y;
                            _this4.width = _this4.maximized.width;
                            _this4.height = _this4.maximized.height;
                            _this4.maximized = null;
                            _this4.transitioning = false;
                            _this4.emit('restore', _this4);
                        });
                    }
                    this.buttons.maximize.style.backgroundImage = this.options.backgroundMaximizeButton;
                } else {
                    var x = this.x,
                        y = this.y,
                        width = this.win.offsetWidth,
                        height = this.win.offsetHeight;
                    if (noAnimate) {
                        this.maximized = { x: x, y: y, width: width, height: height };
                        this.x = 0;
                        this.y = 0;
                        this.width = this.wm.overlay.offsetWidth + 'px';
                        this.height = this.wm.overlay.offsetHeight + 'px';
                        this.emit('maximize', this);
                    } else {
                        this.transitioning = true;
                        var _ease2 = this.ease.add(this.win, { left: 0, top: 0, width: this.wm.overlay.offsetWidth, height: this.wm.overlay.offsetHeight });
                        _ease2.on('complete', function () {
                            _this4.x = 0;
                            _this4.y = 0;
                            _this4.width = _this4.wm.overlay.offsetWidth + 'px';
                            _this4.height = _this4.wm.overlay.offsetHeight + 'px';
                            _this4.maximized = { x: x, y: y, width: width, height: height };
                            _this4.transitioning = false;
                        });
                        this.emit('maximize', this);
                    }
                    this.buttons.maximize.style.backgroundImage = this.options.backgroundRestoreButton;
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
            } else if (this.maximized) {
                this.maximize(true);
            }
            if (data.minimized) {
                if (!this.minimized) {
                    this.minimize(true);
                }
                this.minimized = data.minimized;
            } else if (this.minimized) {
                this.minimize(true);
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
        key: 'center',


        /**
         * centers window in middle of other window
         * @param {Window} win
         */
        value: function center(win) {
            this.move(win.x + win.width / 2 - this.width / 2, win.y + win.height / 2 - this.height / 2);
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

    }, {
        key: '_createWindow',
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwicGFyZW50Iiwic3R5bGVzIiwiYm9yZGVyUmFkaXVzIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJzaGFkb3ciLCJiYWNrZ3JvdW5kQ29sb3JXaW5kb3ciLCJpc05hTiIsIndpbkJveCIsIl9jcmVhdGVUaXRsZWJhciIsImNvbnRlbnQiLCJ0eXBlIiwicmVzaXphYmxlIiwiX2NyZWF0ZVJlc2l6ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX2Rvd25UaXRsZWJhciIsInN0b3BQcm9wYWdhdGlvbiIsImV2ZW50IiwiX2NvbnZlcnRNb3ZlRXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZSIsInRpdGxlIiwiZm9yZWdyb3VuZENvbG9yVGl0bGUiLCJfY3JlYXRlQnV0dG9ucyIsIm1vdmFibGUiLCJ3aW5CdXR0b25Hcm91cCIsImJ1dHRvbiIsImZvcmVncm91bmRDb2xvckJ1dHRvbiIsImJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvbiIsImNsb3NhYmxlIiwiYmFja2dyb3VuZENsb3NlQnV0dG9uIiwiY2xvc2UiLCJrZXkiLCJvcGFjaXR5IiwicmVzaXplRWRnZSIsImJhY2tncm91bmRSZXNpemUiLCJkb3duIiwicHJldmVudERlZmF1bHQiLCJfaXNUb3VjaEV2ZW50Iiwid2hpY2giLCJfc3RvcE1vdmUiLCJfc3RvcFJlc2l6ZSIsInJlc2l6ZSIsIndpbmRvdyIsIlRvdWNoRXZlbnQiLCJjaGFuZ2VkVG91Y2hlcyIsInZhbHVlIiwiX3RpdGxlIiwiaW5uZXJUZXh0IiwicGFyc2VJbnQiLCJ6SW5kZXgiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxJQUFNQSxTQUFTQyxRQUFRLGVBQVIsQ0FBZjtBQUNBLElBQU1DLFVBQVVELFFBQVEsU0FBUixDQUFoQjtBQUNBLElBQU1FLE9BQU9GLFFBQVEsVUFBUixDQUFiO0FBQ0EsSUFBTUcsU0FBU0gsUUFBUSxRQUFSLENBQWY7O0FBRUEsSUFBTUksT0FBT0osUUFBUSxRQUFSLENBQWI7O0FBRUEsSUFBSUssS0FBSyxDQUFUOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF1Qk1DLE07OztBQUVG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QkFDNUNKLEssRUFBTztBQUFFLGlCQUFLNUYsR0FBTCxDQUFTQyxLQUFULENBQWUrRixNQUFmLEdBQXdCSixLQUF4QjtBQUErQjs7OztFQTEyQjdCckgsTTs7QUE2MkJyQjBILE9BQU9DLE9BQVAsR0FBaUJwSCxNQUFqQiIsImZpbGUiOiJ3aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBFdmVudHMgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJylcclxuY29uc3QgY2xpY2tlZCA9IHJlcXVpcmUoJ2NsaWNrZWQnKVxyXG5jb25zdCBFYXNlID0gcmVxdWlyZSgnZG9tLWVhc2UnKVxyXG5jb25zdCBleGlzdHMgPSByZXF1aXJlKCdleGlzdHMnKVxyXG5cclxuY29uc3QgaHRtbCA9IHJlcXVpcmUoJy4vaHRtbCcpXHJcblxyXG5sZXQgaWQgPSAwXHJcblxyXG4vKipcclxuICogV2luZG93IGNsYXNzIHJldHVybmVkIGJ5IFdpbmRvd01hbmFnZXIuY3JlYXRlV2luZG93KClcclxuICogQGV4dGVuZHMgRXZlbnRFbWl0dGVyXHJcbiAqIEBoaWRlY29uc3RydWN0b3JcclxuICogQGZpcmVzIG9wZW5cclxuICogQGZpcmVzIGZvY3VzXHJcbiAqIEBmaXJlcyBibHVyXHJcbiAqIEBmaXJlcyBjbG9zZVxyXG4gKiBAZmlyZXMgbWF4aW1pemVcclxuICogQGZpcmVzIG1heGltaXplLXJlc3RvcmVcclxuICogQGZpcmVzIG1pbmltaXplXHJcbiAqIEBmaXJlcyBtaW5pbWl6ZS1yZXN0b3JlXHJcbiAqIEBmaXJlcyBtb3ZlXHJcbiAqIEBmaXJlcyBtb3ZlLXN0YXJ0XHJcbiAqIEBmaXJlcyBtb3ZlLWVuZFxyXG4gKiBAZmlyZXMgcmVzaXplXHJcbiAqIEBmaXJlcyByZXNpemUtc3RhcnRcclxuICogQGZpcmVzIHJlc2l6ZS1lbmRcclxuICogQGZpcmVzIG1vdmUteFxyXG4gKiBAZmlyZXMgbW92ZS15XHJcbiAqIEBmaXJlcyByZXNpemUtd2lkdGhcclxuICogQGZpcmVzIHJlc2l6ZS1oZWlnaHRcclxuICovXHJcbmNsYXNzIFdpbmRvdyBleHRlbmRzIEV2ZW50c1xyXG57XHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7V2luZG93TWFuYWdlcn0gd21cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHdtLCBvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKClcclxuICAgICAgICB0aGlzLndtID0gd21cclxuXHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gZXhpc3RzKHRoaXMub3B0aW9ucy5pZCkgPyB0aGlzLm9wdGlvbnMuaWQgOiBpZCsrXHJcblxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVdpbmRvdygpXHJcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJzKClcclxuXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMubWF4aW1pemVkID0gZmFsc2VcclxuICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcblxyXG4gICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICB0aGlzLl9yZXN0b3JlID0gbnVsbFxyXG4gICAgICAgIHRoaXMuX21vdmluZyA9IG51bGxcclxuICAgICAgICB0aGlzLl9yZXNpemluZyA9IG51bGxcclxuXHJcbiAgICAgICAgdGhpcy5lYXNlID0gbmV3IEVhc2UoeyBkdXJhdGlvbjogdGhpcy5vcHRpb25zLmFuaW1hdGVUaW1lLCBlYXNlOiB0aGlzLm9wdGlvbnMuZWFzZSB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogb3BlbiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtub0ZvY3VzXSBkbyBub3QgZm9jdXMgd2luZG93IHdoZW4gb3BlbmVkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtub0FuaW1hdGVdIGRvIG5vdCBhbmltYXRlIHdpbmRvdyB3aGVuIG9wZW5lZFxyXG4gICAgICovXHJcbiAgICBvcGVuKG5vRm9jdXMsIG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5fY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdvcGVuJywgdGhpcylcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgaWYgKCFub0FuaW1hdGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgwKSdcclxuICAgICAgICAgICAgICAgIHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDEgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICBpZiAoIW5vRm9jdXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZm9jdXMgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBmb2N1cygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2ZvY3VzJywgdGhpcylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBibHVyIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgYmx1cigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20ubW9kYWwgIT09IHRoaXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvclRpdGxlYmFySW5hY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdibHVyJywgdGhpcylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjbG9zZXMgdGhlIHdpbmRvdyAoY2FuIGJlIHJlb3BlbmVkIHdpdGggb3BlbilcclxuICAgICAqL1xyXG4gICAgY2xvc2UoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5fY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxyXG4gICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZTogMCB9KVxyXG4gICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnY2xvc2UnLCB0aGlzKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBsZWZ0IGNvb3JkaW5hdGVcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB4KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLnggfVxyXG4gICAgc2V0IHgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnggPSB2YWx1ZVxyXG4gICAgICAgIHRoaXMud2luLnN0eWxlLmxlZnQgPSB2YWx1ZSArICdweCdcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUteCcsIHRoaXMpXHJcbiAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZC5sZWZ0ID0gdmFsdWVcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0b3AgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHkoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueSB9XHJcbiAgICBzZXQgeSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueSA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLXknLCB0aGlzKVxyXG4gICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQudG9wID0gdmFsdWVcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB3aWR0aCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB3aWR0aCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aCB9XHJcbiAgICBzZXQgd2lkdGgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSB2YWx1ZSArICdweCdcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gJydcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtd2lkdGgnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaGVpZ2h0IG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IGhlaWdodCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0IH1cclxuICAgIHNldCBoZWlnaHQodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1oZWlnaHQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVzaXplIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxyXG4gICAgICovXHJcbiAgICByZXNpemUod2lkdGgsIGhlaWdodClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGhcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbW92ZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geVxyXG4gICAgICovXHJcbiAgICBtb3ZlKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy54ID0geFxyXG4gICAgICAgIHRoaXMueSA9IHlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1pbmltaXplIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBub0FuaW1hdGVcclxuICAgICAqL1xyXG4gICAgbWluaW1pemUobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMubWluaW1pemVkLngsIHkgPSB0aGlzLm1pbmltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZSh4LCB5KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUtcmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGVYOiAxLCBzY2FsZVk6IDEsIGxlZnQ6IHRoaXMubWluaW1pemVkLngsIHRvcDogdGhpcy5taW5pbWl6ZWQueSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLm1pbmltaXplZC54LCB5ID0gdGhpcy5taW5pbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZSh4LCB5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy54XHJcbiAgICAgICAgICAgICAgICBjb25zdCB5ID0gdGhpcy55XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsZWZ0ID0gdGhpcy5fbGFzdE1pbmltaXplZCA/IHRoaXMuX2xhc3RNaW5pbWl6ZWQubGVmdCA6IHRoaXMueFxyXG4gICAgICAgICAgICAgICAgY29uc3QgdG9wID0gdGhpcy5fbGFzdE1pbmltaXplZCA/IHRoaXMuX2xhc3RNaW5pbWl6ZWQudG9wIDogdGhpcy55XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZXNpcmVkID0gdGhpcy5vcHRpb25zLm1pbmltaXplU2l6ZVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbGVYID0gZGVzaXJlZCAvIHRoaXMud2lkdGhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlWSA9IGRlc2lyZWQgLyB0aGlzLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMSkgc2NhbGVYKCcgKyBzY2FsZVggKyAnKSBzY2FsZVkoJyArIHNjYWxlWSArICcpJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IHRvcCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IHsgeCwgeSwgc2NhbGVYLCBzY2FsZVkgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSB7IGxlZnQsIHRvcCB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQsIHRvcCwgc2NhbGVYLCBzY2FsZVkgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IHsgeCwgeSwgc2NhbGVYLCBzY2FsZVkgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSB7IGxlZnQsIHRvcCB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZShsZWZ0LCB0b3ApXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1heGltaXplIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgbWF4aW1pemUobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IHRoaXMubWF4aW1pemVkLnhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSB0aGlzLm1heGltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMubWF4aW1pemVkLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLm1heGltaXplZC5oZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiB0aGlzLm1heGltaXplZC54LCB0b3A6IHRoaXMubWF4aW1pemVkLnksIHdpZHRoOiB0aGlzLm1heGltaXplZC53aWR0aCwgaGVpZ2h0OiB0aGlzLm1heGltaXplZC5oZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSB0aGlzLm1heGltaXplZC54XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IHRoaXMubWF4aW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMubWF4aW1pemVkLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNYXhpbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgd2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aCwgaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0geyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGggKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0SGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWF4aW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiAwLCB0b3A6IDAsIHdpZHRoOiB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGgsIGhlaWdodDogdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0geyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWF4aW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZHMgd2luZG93IHRvIGJhY2sgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvQmFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53bS5zZW5kVG9CYWNrKHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBmcm9udCBvZiB3aW5kb3ctbWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzZW5kVG9Gcm9udCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53bS5zZW5kVG9Gcm9udCh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2F2ZSB0aGUgc3RhdGUgb2YgdGhlIHdpbmRvd1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSBkYXRhXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7fVxyXG4gICAgICAgIGNvbnN0IG1heGltaXplZCA9IHRoaXMubWF4aW1pemVkXHJcbiAgICAgICAgaWYgKG1heGltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubWF4aW1pemVkID0geyBsZWZ0OiBtYXhpbWl6ZWQubGVmdCwgdG9wOiBtYXhpbWl6ZWQudG9wLCB3aWR0aDogbWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IG1heGltaXplZC5oZWlnaHQgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBtaW5pbWl6ZWQgPSB0aGlzLm1pbmltaXplZFxyXG4gICAgICAgIGlmIChtaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1pbmltaXplZCA9IHsgeDogdGhpcy5taW5pbWl6ZWQueCwgeTogdGhpcy5taW5pbWl6ZWQueSwgc2NhbGVYOiB0aGlzLm1pbmltaXplZC5zY2FsZVgsIHNjYWxlWTogdGhpcy5taW5pbWl6ZWQuc2NhbGVZIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGFzdE1pbmltaXplZCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWRcclxuICAgICAgICBpZiAobGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubGFzdE1pbmltaXplZCA9IHsgbGVmdDogbGFzdE1pbmltaXplZC5sZWZ0LCB0b3A6IGxhc3RNaW5pbWl6ZWQudG9wIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS54ID0gdGhpcy54XHJcbiAgICAgICAgZGF0YS55ID0gdGhpcy55XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS53aWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXhpc3RzKHRoaXMub3B0aW9ucy5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm4gdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIGZyb20gc2F2ZSgpXHJcbiAgICAgKi9cclxuICAgIGxvYWQoZGF0YSlcclxuICAgIHtcclxuICAgICAgICBpZiAoZGF0YS5tYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5tYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1heGltaXplKHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkYXRhLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUodHJ1ZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGRhdGEubWluaW1pemVkXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5sYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IGRhdGEubGFzdE1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnggPSBkYXRhLnhcclxuICAgICAgICB0aGlzLnkgPSBkYXRhLnlcclxuICAgICAgICBpZiAoZXhpc3RzKGRhdGEud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IGRhdGEud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLmhlaWdodCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGRhdGEuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoYW5nZSB0aXRsZVxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0IHRpdGxlKCkgeyByZXR1cm4gdGhpcy5fdGl0bGUgfVxyXG4gICAgc2V0IHRpdGxlKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luVGl0bGUuaW5uZXJUZXh0ID0gdmFsdWVcclxuICAgICAgICB0aGlzLmVtaXQoJ3RpdGxlLWNoYW5nZScsIHRoaXMpXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmlnaHQgY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCByaWdodCgpIHsgcmV0dXJuIHRoaXMueCArIHRoaXMud2lkdGggfVxyXG4gICAgc2V0IHJpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHZhbHVlIC0gdGhpcy53aWR0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYm90dG9tIGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgYm90dG9tKCkgeyByZXR1cm4gdGhpcy55ICsgdGhpcy5oZWlnaHQgfVxyXG4gICAgc2V0IGJvdHRvbSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnkgPSB2YWx1ZSAtIHRoaXMuaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjZW50ZXJzIHdpbmRvdyBpbiBtaWRkbGUgb2Ygb3RoZXIgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIGNlbnRlcih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICB3aW4ueCArIHdpbi53aWR0aCAvIDIgLSB0aGlzLndpZHRoIC8gMixcclxuICAgICAgICAgICAgd2luLnkgKyB3aW4uaGVpZ2h0IC8gMiAtIHRoaXMuaGVpZ2h0IC8gMlxyXG4gICAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyByZXN0b3JlZCB0byBub3JtYWwgYWZ0ZXIgYmVpbmcgbWluaW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21pbmltaXplLXJlc3RvcmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IG9wZW5zXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I29wZW5cclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGdhaW5zIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2ZvY3VzXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGxvc2VzIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2JsdXJcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgY2xvc2VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2Nsb3NlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHJlc2l6ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXN0YXJ0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBhZnRlciByZXNpemUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyByZXNpemluZ1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gbW92ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgbW92ZSBjb21wbGV0ZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyBtb3ZlXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2lkdGggaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtd2lkdGhcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gaGVpZ2h0IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLWhlaWdodFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB4IHBvc2l0aW9uIG9mIHdpbmRvdyBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUteFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4geSBwb3NpdGlvbiBvZiB3aW5kb3cgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXlcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICBfY3JlYXRlV2luZG93KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbiA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud20ud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci1yYWRpdXMnOiB0aGlzLm9wdGlvbnMuYm9yZGVyUmFkaXVzLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi13aWR0aCc6IHRoaXMub3B0aW9ucy5taW5XaWR0aCxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLm1pbkhlaWdodCxcclxuICAgICAgICAgICAgICAgICdib3gtc2hhZG93JzogdGhpcy5vcHRpb25zLnNoYWRvdyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvcldpbmRvdyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogdGhpcy5vcHRpb25zLngsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogdGhpcy5vcHRpb25zLnksXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiBpc05hTih0aGlzLm9wdGlvbnMud2lkdGgpID8gdGhpcy5vcHRpb25zLndpZHRoIDogdGhpcy5vcHRpb25zLndpZHRoICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiBpc05hTih0aGlzLm9wdGlvbnMuaGVpZ2h0KSA/IHRoaXMub3B0aW9ucy5oZWlnaHQgOiB0aGlzLm9wdGlvbnMuaGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy53aW5Cb3ggPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdjb2x1bW4nLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLm1pbkhlaWdodFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLl9jcmVhdGVUaXRsZWJhcigpXHJcblxyXG4gICAgICAgIHRoaXMuY29udGVudCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnc2VjdGlvbicsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnYmxvY2snLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgnOiAxLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm1pbkhlaWdodCxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdy14JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteSc6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZXNpemFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVSZXNpemUoKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IDAsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4geyB0aGlzLl9kb3duVGl0bGViYXIoZSk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChlKSA9PiB7IHRoaXMuX2Rvd25UaXRsZWJhcihlKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgfVxyXG5cclxuICAgIF9kb3duVGl0bGViYXIoZSlcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG4gICAgICAgICAgICB0aGlzLl9tb3ZpbmcgPSB7XHJcbiAgICAgICAgICAgICAgICB4OiBldmVudC5wYWdlWCAtIHRoaXMueCxcclxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LnBhZ2VZIC0gdGhpcy55XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLXN0YXJ0JywgdGhpcylcclxuICAgICAgICAgICAgdGhpcy5fbW92ZWQgPSBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlVGl0bGViYXIoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luVGl0bGViYXIgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2hlYWRlcicsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IHRoaXMub3B0aW9ucy50aXRsZWJhckhlaWdodCxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6ICcwIDhweCcsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy53aW5UaXRsZSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHR5cGU6ICdzcGFuJywgaHRtbDogdGhpcy5vcHRpb25zLnRpdGxlLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZy1sZWZ0JzogJzhweCcsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdmb250LXNpemUnOiAnMTZweCcsXHJcbiAgICAgICAgICAgICAgICAnZm9udC13ZWlnaHQnOiA0MDAsXHJcbiAgICAgICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yVGl0bGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlQnV0dG9ucygpXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubW92YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHRoaXMuX2Rvd25UaXRsZWJhcihlKSlcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHRoaXMuX2Rvd25UaXRsZWJhcihlKSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZUJ1dHRvbnMoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luQnV0dG9uR3JvdXAgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpblRpdGxlYmFyLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nLWxlZnQnOiAnMnB4J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBidXR0b24gPSB7XHJcbiAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogJzVweCcsXHJcbiAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgJ3dpZHRoJzogJzEycHgnLFxyXG4gICAgICAgICAgICAnaGVpZ2h0JzogJzEycHgnLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXNpemUnOiAnY292ZXInLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1yZXBlYXQnOiAnbm8tcmVwZWF0JyxcclxuICAgICAgICAgICAgJ29wYWNpdHknOiAuNyxcclxuICAgICAgICAgICAgJ2NvbG9yJzogdGhpcy5vcHRpb25zLmZvcmVncm91bmRDb2xvckJ1dHRvbixcclxuICAgICAgICAgICAgJ291dGxpbmUnOiAwXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnV0dG9ucyA9IHt9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1pbmltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5taW5pbWl6ZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWluaW1pemUsICgpID0+IHRoaXMubWluaW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWF4aW1pemUsICgpID0+IHRoaXMubWF4aW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENsb3NlQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5jbG9zZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMuY2xvc2UsICgpID0+IHRoaXMuY2xvc2UoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuYnV0dG9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuYnV0dG9uc1trZXldXHJcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDFcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAwLjdcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5yZXNpemVFZGdlID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdidXR0b24nLCBodG1sOiAnJm5ic3AnLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnYm90dG9tJzogMCxcclxuICAgICAgICAgICAgICAgICdyaWdodCc6ICc0cHgnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnc2UtcmVzaXplJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXNpemUsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzE1cHgnLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGRvd24gPSAoZSkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemluZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggLSBldmVudC5wYWdlWCxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAtIGV2ZW50LnBhZ2VZXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1zdGFydCcpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZG93bilcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGRvd24pXHJcbiAgICB9XHJcblxyXG4gICAgX21vdmUoZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1RvdWNoRXZlbnQoZSkgJiYgZS53aGljaCAhPT0gMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW92aW5nICYmIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IHRydWVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCAtIHRoaXMuX21vdmluZy54LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZIC0gdGhpcy5fbW92aW5nLnlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3Jlc2l6aW5nKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCArIHRoaXMuX3Jlc2l6aW5nLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZICsgdGhpcy5fcmVzaXppbmcuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF91cCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3ZlZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9zdG9wTW92ZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgfVxyXG5cclxuICAgIF9saXN0ZW5lcnMoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMuZm9jdXMoKSlcclxuICAgICAgICB0aGlzLndpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgfVxyXG5cclxuICAgIF9zdG9wTW92ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS1lbmQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIF9zdG9wUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9yZXN0b3JlID0gdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtZW5kJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICBfaXNUb3VjaEV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICEhd2luZG93LlRvdWNoRXZlbnQgJiYgKGUgaW5zdGFuY2VvZiB3aW5kb3cuVG91Y2hFdmVudClcclxuICAgIH1cclxuXHJcbiAgICBfY29udmVydE1vdmVFdmVudChlKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pc1RvdWNoRXZlbnQoZSkgPyBlLmNoYW5nZWRUb3VjaGVzWzBdIDogZVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB6KCkgeyByZXR1cm4gcGFyc2VJbnQodGhpcy53aW4uc3R5bGUuekluZGV4KSB9XHJcbiAgICBzZXQgeih2YWx1ZSkgeyB0aGlzLndpbi5zdHlsZS56SW5kZXggPSB2YWx1ZSB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2luZG93Il19