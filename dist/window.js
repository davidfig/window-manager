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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwicGFyZW50Iiwic3R5bGVzIiwiYm9yZGVyUmFkaXVzIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJzaGFkb3ciLCJiYWNrZ3JvdW5kQ29sb3JXaW5kb3ciLCJpc05hTiIsIndpbkJveCIsIl9jcmVhdGVUaXRsZWJhciIsImNvbnRlbnQiLCJ0eXBlIiwicmVzaXphYmxlIiwiX2NyZWF0ZVJlc2l6ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX2Rvd25UaXRsZWJhciIsInN0b3BQcm9wYWdhdGlvbiIsImV2ZW50IiwiX2NvbnZlcnRNb3ZlRXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZVN0eWxlcyIsImZvcmVncm91bmRDb2xvclRpdGxlIiwidGl0bGVDZW50ZXIiLCJ3aW5UaXRsZSIsInRpdGxlIiwiX2NyZWF0ZUJ1dHRvbnMiLCJtb3ZhYmxlIiwid2luQnV0dG9uR3JvdXAiLCJidXR0b24iLCJmb3JlZ3JvdW5kQ29sb3JCdXR0b24iLCJiYWNrZ3JvdW5kTWluaW1pemVCdXR0b24iLCJjbG9zYWJsZSIsImJhY2tncm91bmRDbG9zZUJ1dHRvbiIsImNsb3NlIiwia2V5Iiwib3BhY2l0eSIsInJlc2l6ZUVkZ2UiLCJiYWNrZ3JvdW5kUmVzaXplIiwiZG93biIsInByZXZlbnREZWZhdWx0IiwiX2lzVG91Y2hFdmVudCIsIndoaWNoIiwiX3N0b3BNb3ZlIiwiX3N0b3BSZXNpemUiLCJyZXNpemUiLCJ3aW5kb3ciLCJUb3VjaEV2ZW50IiwiY2hhbmdlZFRvdWNoZXMiLCJ2YWx1ZSIsIl90aXRsZSIsImlubmVyVGV4dCIsInBhcnNlSW50IiwiekluZGV4IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxlQUFSLENBQWY7QUFDQSxJQUFNQyxVQUFVRCxRQUFRLFNBQVIsQ0FBaEI7QUFDQSxJQUFNRSxPQUFPRixRQUFRLFVBQVIsQ0FBYjtBQUNBLElBQU1HLFNBQVNILFFBQVEsUUFBUixDQUFmOztBQUVBLElBQU1JLE9BQU9KLFFBQVEsUUFBUixDQUFiOztBQUVBLElBQUlLLEtBQUssQ0FBVDs7QUFFQTs7Ozs7Ozs7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QUFyQjtBQUE2QixTOzBCQUNqQzhFLEssRUFDWDtBQUNJLGlCQUFLNUUsQ0FBTCxHQUFTNEUsUUFBUSxLQUFLOUUsTUFBdEI7QUFDSDs7OzRCQXdhTztBQUFFLG1CQUFPaUYsU0FBUyxLQUFLakcsR0FBTCxDQUFTQyxLQUFULENBQWVpRyxNQUF4QixDQUFQO0FBQXdDLFM7MEJBQzVDSixLLEVBQU87QUFBRSxpQkFBSzlGLEdBQUwsQ0FBU0MsS0FBVCxDQUFlaUcsTUFBZixHQUF3QkosS0FBeEI7QUFBK0I7Ozs7RUE1M0I3QnZILE07O0FBKzNCckI0SCxPQUFPQyxPQUFQLEdBQWlCdEgsTUFBakIiLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpXHJcbmNvbnN0IGNsaWNrZWQgPSByZXF1aXJlKCdjbGlja2VkJylcclxuY29uc3QgRWFzZSA9IHJlcXVpcmUoJ2RvbS1lYXNlJylcclxuY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5cclxubGV0IGlkID0gMFxyXG5cclxuLyoqXHJcbiAqIFdpbmRvdyBjbGFzcyByZXR1cm5lZCBieSBXaW5kb3dNYW5hZ2VyLmNyZWF0ZVdpbmRvdygpXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAaGlkZWNvbnN0cnVjdG9yXHJcbiAqIEBmaXJlcyBvcGVuXHJcbiAqIEBmaXJlcyBmb2N1c1xyXG4gKiBAZmlyZXMgYmx1clxyXG4gKiBAZmlyZXMgY2xvc2VcclxuICogQGZpcmVzIG1heGltaXplXHJcbiAqIEBmaXJlcyBtYXhpbWl6ZS1yZXN0b3JlXHJcbiAqIEBmaXJlcyBtaW5pbWl6ZVxyXG4gKiBAZmlyZXMgbWluaW1pemUtcmVzdG9yZVxyXG4gKiBAZmlyZXMgbW92ZVxyXG4gKiBAZmlyZXMgbW92ZS1zdGFydFxyXG4gKiBAZmlyZXMgbW92ZS1lbmRcclxuICogQGZpcmVzIHJlc2l6ZVxyXG4gKiBAZmlyZXMgcmVzaXplLXN0YXJ0XHJcbiAqIEBmaXJlcyByZXNpemUtZW5kXHJcbiAqIEBmaXJlcyBtb3ZlLXhcclxuICogQGZpcmVzIG1vdmUteVxyXG4gKiBAZmlyZXMgcmVzaXplLXdpZHRoXHJcbiAqIEBmaXJlcyByZXNpemUtaGVpZ2h0XHJcbiAqL1xyXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd01hbmFnZXJ9IHdtXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih3bSwgb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgdGhpcy53bSA9IHdtXHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGV4aXN0cyh0aGlzLm9wdGlvbnMuaWQpID8gdGhpcy5vcHRpb25zLmlkIDogaWQrK1xyXG5cclxuICAgICAgICB0aGlzLl9jcmVhdGVXaW5kb3coKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVycygpXHJcblxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICB0aGlzLm1heGltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG5cclxuICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IG51bGxcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcblxyXG4gICAgICAgIHRoaXMuZWFzZSA9IG5ldyBFYXNlKHsgZHVyYXRpb246IHRoaXMub3B0aW9ucy5hbmltYXRlVGltZSwgZWFzZTogdGhpcy5vcHRpb25zLmVhc2UgfSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG9wZW4gdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9Gb2N1c10gZG8gbm90IGZvY3VzIHdpbmRvdyB3aGVuIG9wZW5lZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9BbmltYXRlXSBkbyBub3QgYW5pbWF0ZSB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqL1xyXG4gICAgb3Blbihub0ZvY3VzLCBub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnb3BlbicsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgIGlmICghbm9BbmltYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMCknXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAxIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gZmFsc2VcclxuICAgICAgICAgICAgaWYgKCFub0ZvY3VzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvY3VzKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGZvY3VzIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgZm9jdXMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWVcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJBY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdmb2N1cycsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYmx1ciB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGJsdXIoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLm1vZGFsICE9PSB0aGlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckluYWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYmx1cicsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xvc2VzIHRoZSB3aW5kb3cgKGNhbiBiZSByZW9wZW5lZCB3aXRoIG9wZW4pXHJcbiAgICAgKi9cclxuICAgIGNsb3NlKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDAgfSlcclxuICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nsb3NlJywgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbGVmdCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy54IH1cclxuICAgIHNldCB4KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy54ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLXgnLCB0aGlzKVxyXG4gICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQubGVmdCA9IHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdG9wIGNvb3JkaW5hdGVcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB5KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLnkgfVxyXG4gICAgc2V0IHkodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnkgPSB2YWx1ZVxyXG4gICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS15JywgdGhpcylcclxuICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkLnRvcCA9IHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogd2lkdGggb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgd2lkdGgoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMud2lkdGggfHwgdGhpcy53aW4ub2Zmc2V0V2lkdGggfVxyXG4gICAgc2V0IHdpZHRoKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXdpZHRoJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlaWdodCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCBoZWlnaHQoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMuaGVpZ2h0IHx8IHRoaXMud2luLm9mZnNldEhlaWdodCB9XHJcbiAgICBzZXQgaGVpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gJydcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtaGVpZ2h0JywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlc2l6ZSB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcclxuICAgICAqL1xyXG4gICAgcmVzaXplKHdpZHRoLCBoZWlnaHQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoXHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1vdmUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHlcclxuICAgICAqL1xyXG4gICAgbW92ZSh4LCB5KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHhcclxuICAgICAgICB0aGlzLnkgPSB5XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtaW5pbWl6ZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbm9BbmltYXRlXHJcbiAgICAgKi9cclxuICAgIG1pbmltaXplKG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSAmJiB0aGlzLm9wdGlvbnMubWluaW1pemFibGUgJiYgIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLm1pbmltaXplZC54LCB5ID0gdGhpcy5taW5pbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUoeCwgeSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlWDogMSwgc2NhbGVZOiAxLCBsZWZ0OiB0aGlzLm1pbmltaXplZC54LCB0b3A6IHRoaXMubWluaW1pemVkLnkgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5taW5pbWl6ZWQueCwgeSA9IHRoaXMubWluaW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUoeCwgeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZS1yZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueFxyXG4gICAgICAgICAgICAgICAgY29uc3QgeSA9IHRoaXMueVxyXG4gICAgICAgICAgICAgICAgY29uc3QgbGVmdCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWQgPyB0aGlzLl9sYXN0TWluaW1pemVkLmxlZnQgOiB0aGlzLnhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRvcCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWQgPyB0aGlzLl9sYXN0TWluaW1pemVkLnRvcCA6IHRoaXMueVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVzaXJlZCA9IHRoaXMub3B0aW9ucy5taW5pbWl6ZVNpemVcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlWCA9IGRlc2lyZWQgLyB0aGlzLndpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZVkgPSBkZXNpcmVkIC8gdGhpcy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDEpIHNjYWxlWCgnICsgc2NhbGVYICsgJykgc2NhbGVZKCcgKyBzY2FsZVkgKyAnKSdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50b3AgPSB0b3AgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHksIHNjYWxlWCwgc2NhbGVZIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0geyBsZWZ0LCB0b3AgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0LCB0b3AsIHNjYWxlWCwgc2NhbGVZIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHksIHNjYWxlWCwgc2NhbGVZIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0geyBsZWZ0LCB0b3AgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUobGVmdCwgdG9wKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtYXhpbWl6ZSB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIG1heGltaXplKG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSAmJiB0aGlzLm9wdGlvbnMubWF4aW1pemFibGUgJiYgIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSB0aGlzLm1heGltaXplZC54XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gdGhpcy5tYXhpbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLm1heGltaXplZC53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdDogdGhpcy5tYXhpbWl6ZWQueCwgdG9wOiB0aGlzLm1heGltaXplZC55LCB3aWR0aDogdGhpcy5tYXhpbWl6ZWQud2lkdGgsIGhlaWdodDogdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gdGhpcy5tYXhpbWl6ZWQueFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSB0aGlzLm1heGltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLm1heGltaXplZC53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMubWF4aW1pemVkLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWF4aW1pemVCdXR0b25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLngsIHkgPSB0aGlzLnksIHdpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGgsIGhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IDBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21heGltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdDogMCwgdG9wOiAwLCB3aWR0aDogdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoLCBoZWlnaHQ6IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRXaWR0aCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0SGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21heGltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc3RvcmVCdXR0b25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmRzIHdpbmRvdyB0byBiYWNrIG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0JhY2soKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvQmFjayh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZCB3aW5kb3cgdG8gZnJvbnQgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvRnJvbnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvRnJvbnQodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNhdmUgdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gZGF0YVxyXG4gICAgICovXHJcbiAgICBzYXZlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBkYXRhID0ge31cclxuICAgICAgICBjb25zdCBtYXhpbWl6ZWQgPSB0aGlzLm1heGltaXplZFxyXG4gICAgICAgIGlmIChtYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1heGltaXplZCA9IHsgbGVmdDogbWF4aW1pemVkLmxlZnQsIHRvcDogbWF4aW1pemVkLnRvcCwgd2lkdGg6IG1heGltaXplZC53aWR0aCwgaGVpZ2h0OiBtYXhpbWl6ZWQuaGVpZ2h0IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbWluaW1pemVkID0gdGhpcy5taW5pbWl6ZWRcclxuICAgICAgICBpZiAobWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5taW5pbWl6ZWQgPSB7IHg6IHRoaXMubWluaW1pemVkLngsIHk6IHRoaXMubWluaW1pemVkLnksIHNjYWxlWDogdGhpcy5taW5pbWl6ZWQuc2NhbGVYLCBzY2FsZVk6IHRoaXMubWluaW1pemVkLnNjYWxlWSB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxhc3RNaW5pbWl6ZWQgPSB0aGlzLl9sYXN0TWluaW1pemVkXHJcbiAgICAgICAgaWYgKGxhc3RNaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmxhc3RNaW5pbWl6ZWQgPSB7IGxlZnQ6IGxhc3RNaW5pbWl6ZWQubGVmdCwgdG9wOiBsYXN0TWluaW1pemVkLnRvcCB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEueCA9IHRoaXMueFxyXG4gICAgICAgIGRhdGEueSA9IHRoaXMueVxyXG4gICAgICAgIGlmIChleGlzdHModGhpcy5vcHRpb25zLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEud2lkdGggPSB0aGlzLm9wdGlvbnMud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMuaGVpZ2h0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEuaGVpZ2h0ID0gdGhpcy5vcHRpb25zLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJuIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBmcm9tIHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGRhdGEubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBkYXRhLm1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubWluaW1pemUodHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSBkYXRhLmxhc3RNaW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy54ID0gZGF0YS54XHJcbiAgICAgICAgdGhpcy55ID0gZGF0YS55XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSBkYXRhLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHMoZGF0YS5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBkYXRhLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGFuZ2UgdGl0bGVcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldCB0aXRsZSgpIHsgcmV0dXJuIHRoaXMuX3RpdGxlIH1cclxuICAgIHNldCB0aXRsZSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlLmlubmVyVGV4dCA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy5lbWl0KCd0aXRsZS1jaGFuZ2UnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJpZ2h0IGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgcmlnaHQoKSB7IHJldHVybiB0aGlzLnggKyB0aGlzLndpZHRoIH1cclxuICAgIHNldCByaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB2YWx1ZSAtIHRoaXMud2lkdGhcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGJvdHRvbSBjb29yZGluYXRlIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IGJvdHRvbSgpIHsgcmV0dXJuIHRoaXMueSArIHRoaXMuaGVpZ2h0IH1cclxuICAgIHNldCBib3R0b20odmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy55ID0gdmFsdWUgLSB0aGlzLmhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2VudGVycyB3aW5kb3cgaW4gbWlkZGxlIG9mIG90aGVyIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtXaW5kb3d9IHdpblxyXG4gICAgICovXHJcbiAgICBjZW50ZXIod2luKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgd2luLnggKyB3aW4ud2lkdGggLyAyIC0gdGhpcy53aWR0aCAvIDIsXHJcbiAgICAgICAgICAgIHdpbi55ICsgd2luLmhlaWdodCAvIDIgLSB0aGlzLmhlaWdodCAvIDJcclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIHJlc3RvcmVkIHRvIG5vcm1hbCBhZnRlciBiZWluZyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemUtcmVzdG9yZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1pbmltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtaW5pbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBvcGVuc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNvcGVuXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBnYWlucyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNmb2N1c1xyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBsb3NlcyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNibHVyXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGNsb3Nlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNjbG9zZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiByZXNpemUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgcmVzaXplIGNvbXBsZXRlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgcmVzaXppbmdcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIG1vdmUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtc3RhcnRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGFmdGVyIG1vdmUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgbW92ZVxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpZHRoIGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXdpZHRoXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIGhlaWdodCBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1oZWlnaHRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4geCBwb3NpdGlvbiBvZiB3aW5kb3cgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXhcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHkgcG9zaXRpb24gb2Ygd2luZG93IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS15XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgX2NyZWF0ZVdpbmRvdygpXHJcbiAgICB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgdG9wLWxldmVsIERPTSBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqIEByZWFkb25seVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMud2luID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53bS53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXJhZGl1cyc6IHRoaXMub3B0aW9ucy5ib3JkZXJSYWRpdXMsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbWluLXdpZHRoJzogdGhpcy5vcHRpb25zLm1pbldpZHRoLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ2JveC1zaGFkb3cnOiB0aGlzLm9wdGlvbnMuc2hhZG93LFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yV2luZG93LFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiB0aGlzLm9wdGlvbnMueCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiB0aGlzLm9wdGlvbnMueSxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IGlzTmFOKHRoaXMub3B0aW9ucy53aWR0aCkgPyB0aGlzLm9wdGlvbnMud2lkdGggOiB0aGlzLm9wdGlvbnMud2lkdGggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IGlzTmFOKHRoaXMub3B0aW9ucy5oZWlnaHQpID8gdGhpcy5vcHRpb25zLmhlaWdodCA6IHRoaXMub3B0aW9ucy5oZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLndpbkJveCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ2NvbHVtbicsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVRpdGxlYmFyKClcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgY29udGVudCBET00gZWxlbWVudC4gVXNlIHRoaXMgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIFdpbmRvdy5cclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdzZWN0aW9uJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdibG9jaycsXHJcbiAgICAgICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXgnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdy15JzogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlc2l6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm92ZXJsYXkgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IDAsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7IHRoaXMuX2Rvd25UaXRsZWJhcihlKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgX2Rvd25UaXRsZWJhcihlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmluZyA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gdGhpcy54LFxyXG4gICAgICAgICAgICAgICAgeTogZXZlbnQucGFnZVkgLSB0aGlzLnlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUtc3RhcnQnLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVUaXRsZWJhcigpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5UaXRsZWJhciA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnaGVhZGVyJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnanVzdGlmeS1jb250ZW50JzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogJzAgOHB4JyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCB3aW5UaXRsZVN0eWxlcyA9IHtcclxuICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgJ2N1cnNvcic6ICdkZWZhdWx0JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6ICcxNnB4JyxcclxuICAgICAgICAgICAgJ2ZvbnQtd2VpZ2h0JzogNDAwLFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yVGl0bGVcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50aXRsZUNlbnRlcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpblRpdGxlU3R5bGVzWydqdXN0aWZ5LWNvbnRlbnQnXSA9ICdjZW50ZXInXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpblRpdGxlU3R5bGVzWydwYWRkaW5nLWxlZnQnXSA9ICc4cHgnXHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpblRpdGxlID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgdHlwZTogJ3NwYW4nLCBodG1sOiB0aGlzLm9wdGlvbnMudGl0bGUsIHN0eWxlczogd2luVGl0bGVTdHlsZXMgfSlcclxuICAgICAgICB0aGlzLl9jcmVhdGVCdXR0b25zKClcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tb3ZhYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlQnV0dG9ucygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5CdXR0b25Hcm91cCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICcxMHB4J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBidXR0b24gPSB7XHJcbiAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogJzVweCcsXHJcbiAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgJ3dpZHRoJzogJzEycHgnLFxyXG4gICAgICAgICAgICAnaGVpZ2h0JzogJzEycHgnLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXNpemUnOiAnY292ZXInLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1yZXBlYXQnOiAnbm8tcmVwZWF0JyxcclxuICAgICAgICAgICAgJ29wYWNpdHknOiAuNyxcclxuICAgICAgICAgICAgJ2NvbG9yJzogdGhpcy5vcHRpb25zLmZvcmVncm91bmRDb2xvckJ1dHRvbixcclxuICAgICAgICAgICAgJ291dGxpbmUnOiAwXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnV0dG9ucyA9IHt9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1pbmltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5taW5pbWl6ZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWluaW1pemUsICgpID0+IHRoaXMubWluaW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWF4aW1pemUsICgpID0+IHRoaXMubWF4aW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENsb3NlQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5jbG9zZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMuY2xvc2UsICgpID0+IHRoaXMuY2xvc2UoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuYnV0dG9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuYnV0dG9uc1trZXldXHJcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDFcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAwLjdcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5yZXNpemVFZGdlID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdidXR0b24nLCBodG1sOiAnJm5ic3AnLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnYm90dG9tJzogMCxcclxuICAgICAgICAgICAgICAgICdyaWdodCc6ICc0cHgnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnc2UtcmVzaXplJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXNpemUsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzE1cHgnLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGRvd24gPSAoZSkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemluZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggLSBldmVudC5wYWdlWCxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAtIGV2ZW50LnBhZ2VZXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1zdGFydCcpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZG93bilcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGRvd24pXHJcbiAgICB9XHJcblxyXG4gICAgX21vdmUoZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1RvdWNoRXZlbnQoZSkgJiYgZS53aGljaCAhPT0gMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW92aW5nICYmIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IHRydWVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCAtIHRoaXMuX21vdmluZy54LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZIC0gdGhpcy5fbW92aW5nLnlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3Jlc2l6aW5nKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCArIHRoaXMuX3Jlc2l6aW5nLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZICsgdGhpcy5fcmVzaXppbmcuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF91cCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3ZlZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9zdG9wTW92ZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgfVxyXG5cclxuICAgIF9saXN0ZW5lcnMoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMuZm9jdXMoKSlcclxuICAgICAgICB0aGlzLndpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgfVxyXG5cclxuICAgIF9zdG9wTW92ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS1lbmQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIF9zdG9wUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9yZXN0b3JlID0gdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtZW5kJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICBfaXNUb3VjaEV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICEhd2luZG93LlRvdWNoRXZlbnQgJiYgKGUgaW5zdGFuY2VvZiB3aW5kb3cuVG91Y2hFdmVudClcclxuICAgIH1cclxuXHJcbiAgICBfY29udmVydE1vdmVFdmVudChlKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pc1RvdWNoRXZlbnQoZSkgPyBlLmNoYW5nZWRUb3VjaGVzWzBdIDogZVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB6KCkgeyByZXR1cm4gcGFyc2VJbnQodGhpcy53aW4uc3R5bGUuekluZGV4KSB9XHJcbiAgICBzZXQgeih2YWx1ZSkgeyB0aGlzLndpbi5zdHlsZS56SW5kZXggPSB2YWx1ZSB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2luZG93Il19