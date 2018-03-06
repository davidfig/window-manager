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
         * @type {boolean}
         * is window closed?
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

            /**
             * This is the top-level DOM element
             * @type {HTMLElement}
             * @readonly
             */
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
            var _winTitleStyles,
                _this6 = this;

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
                    'overflow': 'hidden'
                }
            });
            var winTitleStyles = (_winTitleStyles = {
                'user-select': 'none',
                'flex': 1,
                'display': 'flex',
                'flex-direction': 'row',
                'align-items': 'center'
            }, _defineProperty(_winTitleStyles, 'user-select', 'none'), _defineProperty(_winTitleStyles, 'cursor', 'default'), _defineProperty(_winTitleStyles, 'padding', 0), _defineProperty(_winTitleStyles, 'margin', 0), _defineProperty(_winTitleStyles, 'font-size', '16px'), _defineProperty(_winTitleStyles, 'font-weight', 400), _defineProperty(_winTitleStyles, 'color', this.options.foregroundColorTitle), _winTitleStyles);
            if (this.options.titleCenter) {
                winTitleStyles['justify-content'] = 'center';
            } else {
                winTitleStyles['padding-left'] = '8px';
            }
            this.winTitle = html({ parent: this.winTitlebar, type: 'span', html: this.options.title, styles: winTitleStyles });
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
                    'padding-left': '10px'
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
        key: 'closed',
        get: function get() {
            return this._closed;
        }

        /**
         * left coordinate
         * @type {number}
         */

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwicGFyZW50Iiwic3R5bGVzIiwiYm9yZGVyUmFkaXVzIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJzaGFkb3ciLCJiYWNrZ3JvdW5kQ29sb3JXaW5kb3ciLCJpc05hTiIsIndpbkJveCIsIl9jcmVhdGVUaXRsZWJhciIsImNvbnRlbnQiLCJ0eXBlIiwicmVzaXphYmxlIiwiX2NyZWF0ZVJlc2l6ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX2Rvd25UaXRsZWJhciIsInN0b3BQcm9wYWdhdGlvbiIsImV2ZW50IiwiX2NvbnZlcnRNb3ZlRXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZVN0eWxlcyIsImZvcmVncm91bmRDb2xvclRpdGxlIiwidGl0bGVDZW50ZXIiLCJ3aW5UaXRsZSIsInRpdGxlIiwiX2NyZWF0ZUJ1dHRvbnMiLCJtb3ZhYmxlIiwid2luQnV0dG9uR3JvdXAiLCJidXR0b24iLCJmb3JlZ3JvdW5kQ29sb3JCdXR0b24iLCJiYWNrZ3JvdW5kTWluaW1pemVCdXR0b24iLCJjbG9zYWJsZSIsImJhY2tncm91bmRDbG9zZUJ1dHRvbiIsImNsb3NlIiwia2V5Iiwib3BhY2l0eSIsInJlc2l6ZUVkZ2UiLCJiYWNrZ3JvdW5kUmVzaXplIiwiZG93biIsInByZXZlbnREZWZhdWx0IiwiX2lzVG91Y2hFdmVudCIsIndoaWNoIiwiX3N0b3BNb3ZlIiwiX3N0b3BSZXNpemUiLCJyZXNpemUiLCJ3aW5kb3ciLCJUb3VjaEV2ZW50IiwiY2hhbmdlZFRvdWNoZXMiLCJ2YWx1ZSIsIl90aXRsZSIsImlubmVyVGV4dCIsInBhcnNlSW50IiwiekluZGV4IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxlQUFSLENBQWY7QUFDQSxJQUFNQyxVQUFVRCxRQUFRLFNBQVIsQ0FBaEI7QUFDQSxJQUFNRSxPQUFPRixRQUFRLFVBQVIsQ0FBYjtBQUNBLElBQU1HLFNBQVNILFFBQVEsUUFBUixDQUFmOztBQUVBLElBQU1JLE9BQU9KLFFBQVEsUUFBUixDQUFiOztBQUVBLElBQUlLLEtBQUssQ0FBVDs7QUFFQTs7Ozs7Ozs7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Ozs7Ozs0QkFJYTtBQUFFLG1CQUFPLEtBQUtHLENBQUwsR0FBUyxLQUFLRixNQUFyQjtBQUE2QixTOzBCQUNqQzhFLEssRUFDWDtBQUNJLGlCQUFLNUUsQ0FBTCxHQUFTNEUsUUFBUSxLQUFLOUUsTUFBdEI7QUFDSDs7OzRCQXdhTztBQUFFLG1CQUFPaUYsU0FBUyxLQUFLakcsR0FBTCxDQUFTQyxLQUFULENBQWVpRyxNQUF4QixDQUFQO0FBQXdDLFM7MEJBQzVDSixLLEVBQU87QUFBRSxpQkFBSzlGLEdBQUwsQ0FBU0MsS0FBVCxDQUFlaUcsTUFBZixHQUF3QkosS0FBeEI7QUFBK0I7Ozs7RUFyNEI3QnZILE07O0FBdzRCckI0SCxPQUFPQyxPQUFQLEdBQWlCdEgsTUFBakIiLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpXHJcbmNvbnN0IGNsaWNrZWQgPSByZXF1aXJlKCdjbGlja2VkJylcclxuY29uc3QgRWFzZSA9IHJlcXVpcmUoJ2RvbS1lYXNlJylcclxuY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5cclxubGV0IGlkID0gMFxyXG5cclxuLyoqXHJcbiAqIFdpbmRvdyBjbGFzcyByZXR1cm5lZCBieSBXaW5kb3dNYW5hZ2VyLmNyZWF0ZVdpbmRvdygpXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAaGlkZWNvbnN0cnVjdG9yXHJcbiAqIEBmaXJlcyBvcGVuXHJcbiAqIEBmaXJlcyBmb2N1c1xyXG4gKiBAZmlyZXMgYmx1clxyXG4gKiBAZmlyZXMgY2xvc2VcclxuICogQGZpcmVzIG1heGltaXplXHJcbiAqIEBmaXJlcyBtYXhpbWl6ZS1yZXN0b3JlXHJcbiAqIEBmaXJlcyBtaW5pbWl6ZVxyXG4gKiBAZmlyZXMgbWluaW1pemUtcmVzdG9yZVxyXG4gKiBAZmlyZXMgbW92ZVxyXG4gKiBAZmlyZXMgbW92ZS1zdGFydFxyXG4gKiBAZmlyZXMgbW92ZS1lbmRcclxuICogQGZpcmVzIHJlc2l6ZVxyXG4gKiBAZmlyZXMgcmVzaXplLXN0YXJ0XHJcbiAqIEBmaXJlcyByZXNpemUtZW5kXHJcbiAqIEBmaXJlcyBtb3ZlLXhcclxuICogQGZpcmVzIG1vdmUteVxyXG4gKiBAZmlyZXMgcmVzaXplLXdpZHRoXHJcbiAqIEBmaXJlcyByZXNpemUtaGVpZ2h0XHJcbiAqL1xyXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd01hbmFnZXJ9IHdtXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih3bSwgb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgdGhpcy53bSA9IHdtXHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGV4aXN0cyh0aGlzLm9wdGlvbnMuaWQpID8gdGhpcy5vcHRpb25zLmlkIDogaWQrK1xyXG5cclxuICAgICAgICB0aGlzLl9jcmVhdGVXaW5kb3coKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVycygpXHJcblxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICB0aGlzLm1heGltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG5cclxuICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IG51bGxcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcblxyXG4gICAgICAgIHRoaXMuZWFzZSA9IG5ldyBFYXNlKHsgZHVyYXRpb246IHRoaXMub3B0aW9ucy5hbmltYXRlVGltZSwgZWFzZTogdGhpcy5vcHRpb25zLmVhc2UgfSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG9wZW4gdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9Gb2N1c10gZG8gbm90IGZvY3VzIHdpbmRvdyB3aGVuIG9wZW5lZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9BbmltYXRlXSBkbyBub3QgYW5pbWF0ZSB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqL1xyXG4gICAgb3Blbihub0ZvY3VzLCBub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnb3BlbicsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgIGlmICghbm9BbmltYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMCknXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAxIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gZmFsc2VcclxuICAgICAgICAgICAgaWYgKCFub0ZvY3VzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvY3VzKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGZvY3VzIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgZm9jdXMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWVcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJBY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdmb2N1cycsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYmx1ciB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGJsdXIoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLm1vZGFsICE9PSB0aGlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckluYWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYmx1cicsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xvc2VzIHRoZSB3aW5kb3cgKGNhbiBiZSByZW9wZW5lZCB3aXRoIG9wZW4pXHJcbiAgICAgKi9cclxuICAgIGNsb3NlKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDAgfSlcclxuICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nsb3NlJywgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKiBpcyB3aW5kb3cgY2xvc2VkP1xyXG4gICAgICovXHJcbiAgICBnZXQgY2xvc2VkKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY2xvc2VkXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBsZWZ0IGNvb3JkaW5hdGVcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB4KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLnggfVxyXG4gICAgc2V0IHgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnggPSB2YWx1ZVxyXG4gICAgICAgIHRoaXMud2luLnN0eWxlLmxlZnQgPSB2YWx1ZSArICdweCdcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUteCcsIHRoaXMpXHJcbiAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZC5sZWZ0ID0gdmFsdWVcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0b3AgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHkoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueSB9XHJcbiAgICBzZXQgeSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueSA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLXknLCB0aGlzKVxyXG4gICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQudG9wID0gdmFsdWVcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB3aWR0aCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB3aWR0aCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aCB9XHJcbiAgICBzZXQgd2lkdGgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSB2YWx1ZSArICdweCdcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gJydcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtd2lkdGgnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaGVpZ2h0IG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IGhlaWdodCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0IH1cclxuICAgIHNldCBoZWlnaHQodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1oZWlnaHQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVzaXplIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxyXG4gICAgICovXHJcbiAgICByZXNpemUod2lkdGgsIGhlaWdodClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGhcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbW92ZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geVxyXG4gICAgICovXHJcbiAgICBtb3ZlKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy54ID0geFxyXG4gICAgICAgIHRoaXMueSA9IHlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1pbmltaXplIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBub0FuaW1hdGVcclxuICAgICAqL1xyXG4gICAgbWluaW1pemUobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMubWluaW1pemVkLngsIHkgPSB0aGlzLm1pbmltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZSh4LCB5KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUtcmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGVYOiAxLCBzY2FsZVk6IDEsIGxlZnQ6IHRoaXMubWluaW1pemVkLngsIHRvcDogdGhpcy5taW5pbWl6ZWQueSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLm1pbmltaXplZC54LCB5ID0gdGhpcy5taW5pbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZSh4LCB5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy54XHJcbiAgICAgICAgICAgICAgICBjb25zdCB5ID0gdGhpcy55XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsZWZ0ID0gdGhpcy5fbGFzdE1pbmltaXplZCA/IHRoaXMuX2xhc3RNaW5pbWl6ZWQubGVmdCA6IHRoaXMueFxyXG4gICAgICAgICAgICAgICAgY29uc3QgdG9wID0gdGhpcy5fbGFzdE1pbmltaXplZCA/IHRoaXMuX2xhc3RNaW5pbWl6ZWQudG9wIDogdGhpcy55XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZXNpcmVkID0gdGhpcy5vcHRpb25zLm1pbmltaXplU2l6ZVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbGVYID0gZGVzaXJlZCAvIHRoaXMud2lkdGhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlWSA9IGRlc2lyZWQgLyB0aGlzLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMSkgc2NhbGVYKCcgKyBzY2FsZVggKyAnKSBzY2FsZVkoJyArIHNjYWxlWSArICcpJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IHRvcCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IHsgeCwgeSwgc2NhbGVYLCBzY2FsZVkgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSB7IGxlZnQsIHRvcCB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQsIHRvcCwgc2NhbGVYLCBzY2FsZVkgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IHsgeCwgeSwgc2NhbGVYLCBzY2FsZVkgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSB7IGxlZnQsIHRvcCB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZShsZWZ0LCB0b3ApXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1heGltaXplIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgbWF4aW1pemUobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IHRoaXMubWF4aW1pemVkLnhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSB0aGlzLm1heGltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMubWF4aW1pemVkLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLm1heGltaXplZC5oZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiB0aGlzLm1heGltaXplZC54LCB0b3A6IHRoaXMubWF4aW1pemVkLnksIHdpZHRoOiB0aGlzLm1heGltaXplZC53aWR0aCwgaGVpZ2h0OiB0aGlzLm1heGltaXplZC5oZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSB0aGlzLm1heGltaXplZC54XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IHRoaXMubWF4aW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMubWF4aW1pemVkLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNYXhpbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgd2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aCwgaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0geyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGggKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0SGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWF4aW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiAwLCB0b3A6IDAsIHdpZHRoOiB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGgsIGhlaWdodDogdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0geyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWF4aW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZHMgd2luZG93IHRvIGJhY2sgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvQmFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53bS5zZW5kVG9CYWNrKHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBmcm9udCBvZiB3aW5kb3ctbWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzZW5kVG9Gcm9udCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53bS5zZW5kVG9Gcm9udCh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2F2ZSB0aGUgc3RhdGUgb2YgdGhlIHdpbmRvd1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSBkYXRhXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7fVxyXG4gICAgICAgIGNvbnN0IG1heGltaXplZCA9IHRoaXMubWF4aW1pemVkXHJcbiAgICAgICAgaWYgKG1heGltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubWF4aW1pemVkID0geyBsZWZ0OiBtYXhpbWl6ZWQubGVmdCwgdG9wOiBtYXhpbWl6ZWQudG9wLCB3aWR0aDogbWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IG1heGltaXplZC5oZWlnaHQgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBtaW5pbWl6ZWQgPSB0aGlzLm1pbmltaXplZFxyXG4gICAgICAgIGlmIChtaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1pbmltaXplZCA9IHsgeDogdGhpcy5taW5pbWl6ZWQueCwgeTogdGhpcy5taW5pbWl6ZWQueSwgc2NhbGVYOiB0aGlzLm1pbmltaXplZC5zY2FsZVgsIHNjYWxlWTogdGhpcy5taW5pbWl6ZWQuc2NhbGVZIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGFzdE1pbmltaXplZCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWRcclxuICAgICAgICBpZiAobGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubGFzdE1pbmltaXplZCA9IHsgbGVmdDogbGFzdE1pbmltaXplZC5sZWZ0LCB0b3A6IGxhc3RNaW5pbWl6ZWQudG9wIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS54ID0gdGhpcy54XHJcbiAgICAgICAgZGF0YS55ID0gdGhpcy55XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS53aWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXhpc3RzKHRoaXMub3B0aW9ucy5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm4gdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIGZyb20gc2F2ZSgpXHJcbiAgICAgKi9cclxuICAgIGxvYWQoZGF0YSlcclxuICAgIHtcclxuICAgICAgICBpZiAoZGF0YS5tYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5tYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1heGltaXplKHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkYXRhLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUodHJ1ZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGRhdGEubWluaW1pemVkXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5sYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IGRhdGEubGFzdE1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnggPSBkYXRhLnhcclxuICAgICAgICB0aGlzLnkgPSBkYXRhLnlcclxuICAgICAgICBpZiAoZXhpc3RzKGRhdGEud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IGRhdGEud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLmhlaWdodCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGRhdGEuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoYW5nZSB0aXRsZVxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0IHRpdGxlKCkgeyByZXR1cm4gdGhpcy5fdGl0bGUgfVxyXG4gICAgc2V0IHRpdGxlKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luVGl0bGUuaW5uZXJUZXh0ID0gdmFsdWVcclxuICAgICAgICB0aGlzLmVtaXQoJ3RpdGxlLWNoYW5nZScsIHRoaXMpXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmlnaHQgY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCByaWdodCgpIHsgcmV0dXJuIHRoaXMueCArIHRoaXMud2lkdGggfVxyXG4gICAgc2V0IHJpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHZhbHVlIC0gdGhpcy53aWR0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYm90dG9tIGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgYm90dG9tKCkgeyByZXR1cm4gdGhpcy55ICsgdGhpcy5oZWlnaHQgfVxyXG4gICAgc2V0IGJvdHRvbSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnkgPSB2YWx1ZSAtIHRoaXMuaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjZW50ZXJzIHdpbmRvdyBpbiBtaWRkbGUgb2Ygb3RoZXIgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIGNlbnRlcih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICB3aW4ueCArIHdpbi53aWR0aCAvIDIgLSB0aGlzLndpZHRoIC8gMixcclxuICAgICAgICAgICAgd2luLnkgKyB3aW4uaGVpZ2h0IC8gMiAtIHRoaXMuaGVpZ2h0IC8gMlxyXG4gICAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyByZXN0b3JlZCB0byBub3JtYWwgYWZ0ZXIgYmVpbmcgbWluaW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21pbmltaXplLXJlc3RvcmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IG9wZW5zXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I29wZW5cclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGdhaW5zIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2ZvY3VzXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGxvc2VzIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2JsdXJcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgY2xvc2VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2Nsb3NlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHJlc2l6ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXN0YXJ0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBhZnRlciByZXNpemUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyByZXNpemluZ1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gbW92ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgbW92ZSBjb21wbGV0ZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyBtb3ZlXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2lkdGggaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtd2lkdGhcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gaGVpZ2h0IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLWhlaWdodFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB4IHBvc2l0aW9uIG9mIHdpbmRvdyBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUteFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4geSBwb3NpdGlvbiBvZiB3aW5kb3cgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXlcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICBfY3JlYXRlV2luZG93KClcclxuICAgIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIGlzIHRoZSB0b3AtbGV2ZWwgRE9NIGVsZW1lbnRcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy53aW4gPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndtLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdib3JkZXItcmFkaXVzJzogdGhpcy5vcHRpb25zLmJvcmRlclJhZGl1cyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdtaW4td2lkdGgnOiB0aGlzLm9wdGlvbnMubWluV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm94LXNoYWRvdyc6IHRoaXMub3B0aW9ucy5zaGFkb3csXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JXaW5kb3csXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IHRoaXMub3B0aW9ucy54LFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IHRoaXMub3B0aW9ucy55LFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogaXNOYU4odGhpcy5vcHRpb25zLndpZHRoKSA/IHRoaXMub3B0aW9ucy53aWR0aCA6IHRoaXMub3B0aW9ucy53aWR0aCArICdweCcsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogaXNOYU4odGhpcy5vcHRpb25zLmhlaWdodCkgPyB0aGlzLm9wdGlvbnMuaGVpZ2h0IDogdGhpcy5vcHRpb25zLmhlaWdodCArICdweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMud2luQm94ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAnY29sdW1uJyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy5taW5IZWlnaHRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlVGl0bGViYXIoKVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIGlzIHRoZSBjb250ZW50IERPTSBlbGVtZW50LiBVc2UgdGhpcyB0byBhZGQgY29udGVudCB0byB0aGUgV2luZG93LlxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKiBAcmVhZG9ubHlcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNvbnRlbnQgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ3NlY3Rpb24nLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2Jsb2NrJyxcclxuICAgICAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteCc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXknOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVzaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUmVzaXplKClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMub3ZlcmxheSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4geyB0aGlzLl9kb3duVGl0bGViYXIoZSk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgIH1cclxuXHJcbiAgICBfZG93blRpdGxlYmFyKGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgdGhpcy5fbW92aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgeDogZXZlbnQucGFnZVggLSB0aGlzLngsXHJcbiAgICAgICAgICAgICAgICB5OiBldmVudC5wYWdlWSAtIHRoaXMueVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZS1zdGFydCcsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmVkID0gZmFsc2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVRpdGxlYmFyKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlYmFyID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdoZWFkZXInLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICdqdXN0aWZ5LWNvbnRlbnQnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy50aXRsZWJhckhlaWdodCxcclxuICAgICAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAnMCA4cHgnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IHdpblRpdGxlU3R5bGVzID0ge1xyXG4gICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAnY3Vyc29yJzogJ2RlZmF1bHQnLFxyXG4gICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAnZm9udC1zaXplJzogJzE2cHgnLFxyXG4gICAgICAgICAgICAnZm9udC13ZWlnaHQnOiA0MDAsXHJcbiAgICAgICAgICAgICdjb2xvcic6IHRoaXMub3B0aW9ucy5mb3JlZ3JvdW5kQ29sb3JUaXRsZVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRpdGxlQ2VudGVyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luVGl0bGVTdHlsZXNbJ2p1c3RpZnktY29udGVudCddID0gJ2NlbnRlcidcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luVGl0bGVTdHlsZXNbJ3BhZGRpbmctbGVmdCddID0gJzhweCdcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMud2luVGl0bGUgPSBodG1sKHsgcGFyZW50OiB0aGlzLndpblRpdGxlYmFyLCB0eXBlOiAnc3BhbicsIGh0bWw6IHRoaXMub3B0aW9ucy50aXRsZSwgc3R5bGVzOiB3aW5UaXRsZVN0eWxlcyB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZUJ1dHRvbnMoKVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1vdmFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVCdXR0b25zKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbkJ1dHRvbkdyb3VwID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZy1sZWZ0JzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHtcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnaW5saW5lLWJsb2NrJyxcclxuICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAnNXB4JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnd2lkdGgnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdoZWlnaHQnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtc2l6ZSc6ICdjb3ZlcicsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXJlcGVhdCc6ICduby1yZXBlYXQnLFxyXG4gICAgICAgICAgICAnb3BhY2l0eSc6IC43LFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yQnV0dG9uLFxyXG4gICAgICAgICAgICAnb3V0bGluZSc6IDBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idXR0b25zID0ge31cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pbmltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWluaW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1pbmltaXplID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5taW5pbWl6ZSwgKCkgPT4gdGhpcy5taW5pbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1heGltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWF4aW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSwgKCkgPT4gdGhpcy5tYXhpbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ2xvc2VCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLmNsb3NlID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5jbG9zZSwgKCkgPT4gdGhpcy5jbG9zZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5idXR0b25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5idXR0b25zW2tleV1cclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDAuN1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2J1dHRvbicsIGh0bWw6ICcmbmJzcCcsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdib3R0b20nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3JpZ2h0JzogJzRweCcsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdzZS1yZXNpemUnLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc2l6ZSxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTVweCcsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTBweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgZG93biA9IChlKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIGV2ZW50LnBhZ2VYLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gZXZlbnQucGFnZVlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXN0YXJ0JylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBkb3duKVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZG93bilcclxuICAgIH1cclxuXHJcbiAgICBfbW92ZShlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2lzVG91Y2hFdmVudChlKSAmJiBlLndoaWNoICE9PSAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3ZpbmcgJiYgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdmVkID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYIC0gdGhpcy5fbW92aW5nLngsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgLSB0aGlzLl9tb3ZpbmcueVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtb3ZlJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fcmVzaXppbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYICsgdGhpcy5fcmVzaXppbmcud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgKyB0aGlzLl9yZXNpemluZy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3VwKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5fbW92aW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vdmVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICB9XHJcblxyXG4gICAgX2xpc3RlbmVycygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BNb3ZlKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLWVuZCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSB0aGlzLl9yZXNpemluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1lbmQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIF9pc1RvdWNoRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuVG91Y2hFdmVudCAmJiAoZSBpbnN0YW5jZW9mIHdpbmRvdy5Ub3VjaEV2ZW50KVxyXG4gICAgfVxyXG5cclxuICAgIF9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVG91Y2hFdmVudChlKSA/IGUuY2hhbmdlZFRvdWNoZXNbMF0gOiBlXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHooKSB7IHJldHVybiBwYXJzZUludCh0aGlzLndpbi5zdHlsZS56SW5kZXgpIH1cclxuICAgIHNldCB6KHZhbHVlKSB7IHRoaXMud2luLnN0eWxlLnpJbmRleCA9IHZhbHVlIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3ciXX0=