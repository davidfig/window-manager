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
                } else {
                    this.win.style.transform = '';
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
        value: function close(noAnimate) {
            var _this2 = this;

            if (!this._closed) {
                this._closed = true;
                if (noAnimate) {
                    this.win.style.transform = 'scale(0)';
                    this.win.style.display = 'none';
                } else {
                    var ease = this.ease.add(this.win, { scale: 0 });
                    ease.on('complete', function () {
                        _this2.win.style.display = 'none';
                        _this2.emit('close', _this2);
                    });
                }
            }
        }

        /**
         * is window closed?
         * @type {boolean}
         * @readonly
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
            data.closed = this._closed;
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
            if (data.closed) {
                this.close(true);
            } else if (this.closed) {
                this.open(true, true);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwiY2xvc2VkIiwiY2xvc2UiLCJvcGVuIiwicGFyZW50Iiwic3R5bGVzIiwiYm9yZGVyUmFkaXVzIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJzaGFkb3ciLCJiYWNrZ3JvdW5kQ29sb3JXaW5kb3ciLCJpc05hTiIsIndpbkJveCIsIl9jcmVhdGVUaXRsZWJhciIsImNvbnRlbnQiLCJ0eXBlIiwicmVzaXphYmxlIiwiX2NyZWF0ZVJlc2l6ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX2Rvd25UaXRsZWJhciIsInN0b3BQcm9wYWdhdGlvbiIsImV2ZW50IiwiX2NvbnZlcnRNb3ZlRXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZVN0eWxlcyIsImZvcmVncm91bmRDb2xvclRpdGxlIiwidGl0bGVDZW50ZXIiLCJ3aW5UaXRsZSIsInRpdGxlIiwiX2NyZWF0ZUJ1dHRvbnMiLCJtb3ZhYmxlIiwid2luQnV0dG9uR3JvdXAiLCJidXR0b24iLCJmb3JlZ3JvdW5kQ29sb3JCdXR0b24iLCJiYWNrZ3JvdW5kTWluaW1pemVCdXR0b24iLCJjbG9zYWJsZSIsImJhY2tncm91bmRDbG9zZUJ1dHRvbiIsImtleSIsIm9wYWNpdHkiLCJyZXNpemVFZGdlIiwiYmFja2dyb3VuZFJlc2l6ZSIsImRvd24iLCJwcmV2ZW50RGVmYXVsdCIsIl9pc1RvdWNoRXZlbnQiLCJ3aGljaCIsIl9zdG9wTW92ZSIsIl9zdG9wUmVzaXplIiwicmVzaXplIiwid2luZG93IiwiVG91Y2hFdmVudCIsImNoYW5nZWRUb3VjaGVzIiwidmFsdWUiLCJfdGl0bGUiLCJpbm5lclRleHQiLCJwYXJzZUludCIsInpJbmRleCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLElBQU1BLFNBQVNDLFFBQVEsZUFBUixDQUFmO0FBQ0EsSUFBTUMsVUFBVUQsUUFBUSxTQUFSLENBQWhCO0FBQ0EsSUFBTUUsT0FBT0YsUUFBUSxVQUFSLENBQWI7QUFDQSxJQUFNRyxTQUFTSCxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNSSxPQUFPSixRQUFRLFFBQVIsQ0FBYjs7QUFFQSxJQUFJSyxLQUFLLENB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QUwsQ0FBU0MsS0FBVCxDQUFlZSxNQUFmLEdBQXdCLE1BQXhCO0FBQ0EscUJBQUtoQyxPQUFMLENBQWFnQyxNQUFiLEdBQXNCLEVBQXRCO0FBQ0g7QUFDRCxpQkFBS2pCLElBQUwsQ0FBVSxlQUFWLEVBQTJCLElBQTNCO0FBQ0g7Ozs0QkF1Ulc7QUFBRSxtQkFBTyxLQUFLa0csTUFBWjtBQUFvQixTOzBCQUN4QkQsSyxFQUNWO0FBQ0ksaUJBQUt4QixRQUFMLENBQWMwQixTQUFkLEdBQTBCRixLQUExQjtBQUNBLGlCQUFLakcsSUFBTCxDQUFVLGNBQVYsRUFBMEIsSUFBMUI7QUFDSDs7QUFHRDs7Ozs7Ozs0QkFJWTtBQUFFLG1CQUFPLEtBQUtrQixDQUFMLEdBQVMsS0FBS0YsS0FBckI7QUFBNEIsUzswQkFDaENpRixLLEVBQ1Y7QUFDSSxpQkFBSy9FLENBQUwsR0FBUytFLFFBQVEsS0FBS2pGLEtBQXRCO0FBQ0g7O0FBRUQ7Ozs7Ozs7NEJBSWE7QUFBRSxtQkFBTyxLQUFLRyxDQUFMLEdBQVMsS0FBS0YsTUFBckI7QUFBNkIsUzswQkFDakNnRixLLEVBQ1g7QUFDSSxpQkFBSzlFLENBQUwsR0FBUzhFLFFBQVEsS0FBS2hGLE1BQXRCO0FBQ0g7Ozs0QkF3YU87QUFBRSxtQkFBT21GLFNBQVMsS0FBS25HLEdBQUwsQ0FBU0MsS0FBVCxDQUFlbUcsTUFBeEIsQ0FBUDtBQUF3QyxTOzBCQUM1Q0osSyxFQUFPO0FBQUUsaUJBQUtoRyxHQUFMLENBQVNDLEtBQVQsQ0FBZW1HLE1BQWYsR0FBd0JKLEtBQXhCO0FBQStCOzs7O0VBMzVCN0J6SCxNOztBQTg1QnJCOEgsT0FBT0MsT0FBUCxHQUFpQnhILE1BQWpCIiwiZmlsZSI6IndpbmRvdy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKVxyXG5jb25zdCBjbGlja2VkID0gcmVxdWlyZSgnY2xpY2tlZCcpXHJcbmNvbnN0IEVhc2UgPSByZXF1aXJlKCdkb20tZWFzZScpXHJcbmNvbnN0IGV4aXN0cyA9IHJlcXVpcmUoJ2V4aXN0cycpXHJcblxyXG5jb25zdCBodG1sID0gcmVxdWlyZSgnLi9odG1sJylcclxuXHJcbmxldCBpZCA9IDBcclxuXHJcbi8qKlxyXG4gKiBXaW5kb3cgY2xhc3MgcmV0dXJuZWQgYnkgV2luZG93TWFuYWdlci5jcmVhdGVXaW5kb3coKVxyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcclxuICogQGhpZGVjb25zdHJ1Y3RvclxyXG4gKiBAZmlyZXMgb3BlblxyXG4gKiBAZmlyZXMgZm9jdXNcclxuICogQGZpcmVzIGJsdXJcclxuICogQGZpcmVzIGNsb3NlXHJcbiAqIEBmaXJlcyBtYXhpbWl6ZVxyXG4gKiBAZmlyZXMgbWF4aW1pemUtcmVzdG9yZVxyXG4gKiBAZmlyZXMgbWluaW1pemVcclxuICogQGZpcmVzIG1pbmltaXplLXJlc3RvcmVcclxuICogQGZpcmVzIG1vdmVcclxuICogQGZpcmVzIG1vdmUtc3RhcnRcclxuICogQGZpcmVzIG1vdmUtZW5kXHJcbiAqIEBmaXJlcyByZXNpemVcclxuICogQGZpcmVzIHJlc2l6ZS1zdGFydFxyXG4gKiBAZmlyZXMgcmVzaXplLWVuZFxyXG4gKiBAZmlyZXMgbW92ZS14XHJcbiAqIEBmaXJlcyBtb3ZlLXlcclxuICogQGZpcmVzIHJlc2l6ZS13aWR0aFxyXG4gKiBAZmlyZXMgcmVzaXplLWhlaWdodFxyXG4gKi9cclxuY2xhc3MgV2luZG93IGV4dGVuZHMgRXZlbnRzXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtXaW5kb3dNYW5hZ2VyfSB3bVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iod20sIG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIHRoaXMud20gPSB3bVxyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zXHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBleGlzdHModGhpcy5vcHRpb25zLmlkKSA/IHRoaXMub3B0aW9ucy5pZCA6IGlkKytcclxuXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlV2luZG93KClcclxuICAgICAgICB0aGlzLl9saXN0ZW5lcnMoKVxyXG5cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuXHJcbiAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nID0gbnVsbFxyXG5cclxuICAgICAgICB0aGlzLmVhc2UgPSBuZXcgRWFzZSh7IGR1cmF0aW9uOiB0aGlzLm9wdGlvbnMuYW5pbWF0ZVRpbWUsIGVhc2U6IHRoaXMub3B0aW9ucy5lYXNlIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBvcGVuIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vRm9jdXNdIGRvIG5vdCBmb2N1cyB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vQW5pbWF0ZV0gZG8gbm90IGFuaW1hdGUgd2luZG93IHdoZW4gb3BlbmVkXHJcbiAgICAgKi9cclxuICAgIG9wZW4obm9Gb2N1cywgbm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ29wZW4nLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICBpZiAoIW5vQW5pbWF0ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDApJ1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZTogMSB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICBpZiAoIW5vRm9jdXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZm9jdXMgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBmb2N1cygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2ZvY3VzJywgdGhpcylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBibHVyIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgYmx1cigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20ubW9kYWwgIT09IHRoaXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvclRpdGxlYmFySW5hY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdibHVyJywgdGhpcylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjbG9zZXMgdGhlIHdpbmRvdyAoY2FuIGJlIHJlb3BlbmVkIHdpdGggb3BlbilcclxuICAgICAqL1xyXG4gICAgY2xvc2Uobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5fY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxyXG4gICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMCknXHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZTogMCB9KVxyXG4gICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nsb3NlJywgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaXMgd2luZG93IGNsb3NlZD9cclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICogQHJlYWRvbmx5XHJcbiAgICAgKi9cclxuICAgIGdldCBjbG9zZWQoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9jbG9zZWRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGxlZnQgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHgoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueCB9XHJcbiAgICBzZXQgeCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueCA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUubGVmdCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS14JywgdGhpcylcclxuICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkLmxlZnQgPSB2YWx1ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHRvcCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeSgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy55IH1cclxuICAgIHNldCB5KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy55ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS50b3AgPSB2YWx1ZSArICdweCdcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUteScsIHRoaXMpXHJcbiAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZC50b3AgPSB2YWx1ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHdpZHRoIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHdpZHRoKCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoIH1cclxuICAgIHNldCB3aWR0aCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS13aWR0aCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWlnaHQgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgaGVpZ2h0KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHQgfVxyXG4gICAgc2V0IGhlaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSB2YWx1ZSArICdweCdcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLWhlaWdodCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXNpemUgdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XHJcbiAgICAgKi9cclxuICAgIHJlc2l6ZSh3aWR0aCwgaGVpZ2h0KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aFxyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtb3ZlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5XHJcbiAgICAgKi9cclxuICAgIG1vdmUoeCwgeSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB4XHJcbiAgICAgICAgdGhpcy55ID0geVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWluaW1pemUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG5vQW5pbWF0ZVxyXG4gICAgICovXHJcbiAgICBtaW5pbWl6ZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykgJiYgdGhpcy5vcHRpb25zLm1pbmltaXphYmxlICYmICF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJydcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5taW5pbWl6ZWQueCwgeSA9IHRoaXMubWluaW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKHgsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZS1yZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZVg6IDEsIHNjYWxlWTogMSwgbGVmdDogdGhpcy5taW5pbWl6ZWQueCwgdG9wOiB0aGlzLm1pbmltaXplZC55IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMubWluaW1pemVkLngsIHkgPSB0aGlzLm1pbmltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKHgsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUtcmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLnhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHkgPSB0aGlzLnlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxlZnQgPSB0aGlzLl9sYXN0TWluaW1pemVkID8gdGhpcy5fbGFzdE1pbmltaXplZC5sZWZ0IDogdGhpcy54XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0b3AgPSB0aGlzLl9sYXN0TWluaW1pemVkID8gdGhpcy5fbGFzdE1pbmltaXplZC50b3AgOiB0aGlzLnlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlc2lyZWQgPSB0aGlzLm9wdGlvbnMubWluaW1pemVTaXplXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZVggPSBkZXNpcmVkIC8gdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbGVZID0gZGVzaXJlZCAvIHRoaXMuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgxKSBzY2FsZVgoJyArIHNjYWxlWCArICcpIHNjYWxlWSgnICsgc2NhbGVZICsgJyknXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdG9wICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0geyB4LCB5LCBzY2FsZVgsIHNjYWxlWSB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IHsgbGVmdCwgdG9wIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdCwgdG9wLCBzY2FsZVgsIHNjYWxlWSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0geyB4LCB5LCBzY2FsZVgsIHNjYWxlWSB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IHsgbGVmdCwgdG9wIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKGxlZnQsIHRvcClcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWF4aW1pemUgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBtYXhpbWl6ZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykgJiYgdGhpcy5vcHRpb25zLm1heGltaXphYmxlICYmICF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tYXhpbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gdGhpcy5tYXhpbWl6ZWQueFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IHRoaXMubWF4aW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy5tYXhpbWl6ZWQud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMubWF4aW1pemVkLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQ6IHRoaXMubWF4aW1pemVkLngsIHRvcDogdGhpcy5tYXhpbWl6ZWQueSwgd2lkdGg6IHRoaXMubWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IHRoaXMubWF4aW1pemVkLmhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IHRoaXMubWF4aW1pemVkLnhcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gdGhpcy5tYXhpbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy5tYXhpbWl6ZWQud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLm1heGltaXplZC5oZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy54LCB5ID0gdGhpcy55LCB3aWR0aCA9IHRoaXMud2luLm9mZnNldFdpZHRoLCBoZWlnaHQgPSB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IDBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRXaWR0aCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtYXhpbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQ6IDAsIHRvcDogMCwgd2lkdGg6IHRoaXMud20ub3ZlcmxheS5vZmZzZXRXaWR0aCwgaGVpZ2h0OiB0aGlzLndtLm92ZXJsYXkub2Zmc2V0SGVpZ2h0IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGggKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtYXhpbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXN0b3JlQnV0dG9uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kcyB3aW5kb3cgdG8gYmFjayBvZiB3aW5kb3ctbWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzZW5kVG9CYWNrKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndtLnNlbmRUb0JhY2sodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmQgd2luZG93IHRvIGZyb250IG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0Zyb250KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndtLnNlbmRUb0Zyb250KHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzYXZlIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IGRhdGFcclxuICAgICAqL1xyXG4gICAgc2F2ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHt9XHJcbiAgICAgICAgY29uc3QgbWF4aW1pemVkID0gdGhpcy5tYXhpbWl6ZWRcclxuICAgICAgICBpZiAobWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5tYXhpbWl6ZWQgPSB7IGxlZnQ6IG1heGltaXplZC5sZWZ0LCB0b3A6IG1heGltaXplZC50b3AsIHdpZHRoOiBtYXhpbWl6ZWQud2lkdGgsIGhlaWdodDogbWF4aW1pemVkLmhlaWdodCB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG1pbmltaXplZCA9IHRoaXMubWluaW1pemVkXHJcbiAgICAgICAgaWYgKG1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubWluaW1pemVkID0geyB4OiB0aGlzLm1pbmltaXplZC54LCB5OiB0aGlzLm1pbmltaXplZC55LCBzY2FsZVg6IHRoaXMubWluaW1pemVkLnNjYWxlWCwgc2NhbGVZOiB0aGlzLm1pbmltaXplZC5zY2FsZVkgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXN0TWluaW1pemVkID0gdGhpcy5fbGFzdE1pbmltaXplZFxyXG4gICAgICAgIGlmIChsYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5sYXN0TWluaW1pemVkID0geyBsZWZ0OiBsYXN0TWluaW1pemVkLmxlZnQsIHRvcDogbGFzdE1pbmltaXplZC50b3AgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkYXRhLnggPSB0aGlzLnhcclxuICAgICAgICBkYXRhLnkgPSB0aGlzLnlcclxuICAgICAgICBpZiAoZXhpc3RzKHRoaXMub3B0aW9ucy53aWR0aCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLndpZHRoID0gdGhpcy5vcHRpb25zLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHModGhpcy5vcHRpb25zLmhlaWdodCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmhlaWdodCA9IHRoaXMub3B0aW9ucy5oZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS5jbG9zZWQgPSB0aGlzLl9jbG9zZWRcclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJuIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBmcm9tIHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGRhdGEubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBkYXRhLm1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubWluaW1pemUodHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSBkYXRhLmxhc3RNaW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy54ID0gZGF0YS54XHJcbiAgICAgICAgdGhpcy55ID0gZGF0YS55XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSBkYXRhLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHMoZGF0YS5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBkYXRhLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEuY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLmNsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub3Blbih0cnVlLCB0cnVlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoYW5nZSB0aXRsZVxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0IHRpdGxlKCkgeyByZXR1cm4gdGhpcy5fdGl0bGUgfVxyXG4gICAgc2V0IHRpdGxlKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luVGl0bGUuaW5uZXJUZXh0ID0gdmFsdWVcclxuICAgICAgICB0aGlzLmVtaXQoJ3RpdGxlLWNoYW5nZScsIHRoaXMpXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmlnaHQgY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCByaWdodCgpIHsgcmV0dXJuIHRoaXMueCArIHRoaXMud2lkdGggfVxyXG4gICAgc2V0IHJpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHZhbHVlIC0gdGhpcy53aWR0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYm90dG9tIGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgYm90dG9tKCkgeyByZXR1cm4gdGhpcy55ICsgdGhpcy5oZWlnaHQgfVxyXG4gICAgc2V0IGJvdHRvbSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnkgPSB2YWx1ZSAtIHRoaXMuaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjZW50ZXJzIHdpbmRvdyBpbiBtaWRkbGUgb2Ygb3RoZXIgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIGNlbnRlcih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICB3aW4ueCArIHdpbi53aWR0aCAvIDIgLSB0aGlzLndpZHRoIC8gMixcclxuICAgICAgICAgICAgd2luLnkgKyB3aW4uaGVpZ2h0IC8gMiAtIHRoaXMuaGVpZ2h0IC8gMlxyXG4gICAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyByZXN0b3JlZCB0byBub3JtYWwgYWZ0ZXIgYmVpbmcgbWluaW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21pbmltaXplLXJlc3RvcmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IG9wZW5zXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I29wZW5cclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGdhaW5zIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2ZvY3VzXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGxvc2VzIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2JsdXJcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgY2xvc2VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2Nsb3NlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHJlc2l6ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXN0YXJ0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBhZnRlciByZXNpemUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyByZXNpemluZ1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gbW92ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgbW92ZSBjb21wbGV0ZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyBtb3ZlXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2lkdGggaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtd2lkdGhcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gaGVpZ2h0IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLWhlaWdodFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB4IHBvc2l0aW9uIG9mIHdpbmRvdyBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUteFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4geSBwb3NpdGlvbiBvZiB3aW5kb3cgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXlcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICBfY3JlYXRlV2luZG93KClcclxuICAgIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIGlzIHRoZSB0b3AtbGV2ZWwgRE9NIGVsZW1lbnRcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy53aW4gPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndtLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdib3JkZXItcmFkaXVzJzogdGhpcy5vcHRpb25zLmJvcmRlclJhZGl1cyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdtaW4td2lkdGgnOiB0aGlzLm9wdGlvbnMubWluV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm94LXNoYWRvdyc6IHRoaXMub3B0aW9ucy5zaGFkb3csXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JXaW5kb3csXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IHRoaXMub3B0aW9ucy54LFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IHRoaXMub3B0aW9ucy55LFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogaXNOYU4odGhpcy5vcHRpb25zLndpZHRoKSA/IHRoaXMub3B0aW9ucy53aWR0aCA6IHRoaXMub3B0aW9ucy53aWR0aCArICdweCcsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogaXNOYU4odGhpcy5vcHRpb25zLmhlaWdodCkgPyB0aGlzLm9wdGlvbnMuaGVpZ2h0IDogdGhpcy5vcHRpb25zLmhlaWdodCArICdweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMud2luQm94ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAnY29sdW1uJyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy5taW5IZWlnaHRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlVGl0bGViYXIoKVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIGlzIHRoZSBjb250ZW50IERPTSBlbGVtZW50LiBVc2UgdGhpcyB0byBhZGQgY29udGVudCB0byB0aGUgV2luZG93LlxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKiBAcmVhZG9ubHlcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNvbnRlbnQgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ3NlY3Rpb24nLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2Jsb2NrJyxcclxuICAgICAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteCc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXknOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVzaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUmVzaXplKClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMub3ZlcmxheSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4geyB0aGlzLl9kb3duVGl0bGViYXIoZSk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgIH1cclxuXHJcbiAgICBfZG93blRpdGxlYmFyKGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgdGhpcy5fbW92aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgeDogZXZlbnQucGFnZVggLSB0aGlzLngsXHJcbiAgICAgICAgICAgICAgICB5OiBldmVudC5wYWdlWSAtIHRoaXMueVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZS1zdGFydCcsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmVkID0gZmFsc2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVRpdGxlYmFyKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlYmFyID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdoZWFkZXInLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICdqdXN0aWZ5LWNvbnRlbnQnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy50aXRsZWJhckhlaWdodCxcclxuICAgICAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAnMCA4cHgnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IHdpblRpdGxlU3R5bGVzID0ge1xyXG4gICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAnY3Vyc29yJzogJ2RlZmF1bHQnLFxyXG4gICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAnZm9udC1zaXplJzogJzE2cHgnLFxyXG4gICAgICAgICAgICAnZm9udC13ZWlnaHQnOiA0MDAsXHJcbiAgICAgICAgICAgICdjb2xvcic6IHRoaXMub3B0aW9ucy5mb3JlZ3JvdW5kQ29sb3JUaXRsZVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRpdGxlQ2VudGVyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luVGl0bGVTdHlsZXNbJ2p1c3RpZnktY29udGVudCddID0gJ2NlbnRlcidcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luVGl0bGVTdHlsZXNbJ3BhZGRpbmctbGVmdCddID0gJzhweCdcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMud2luVGl0bGUgPSBodG1sKHsgcGFyZW50OiB0aGlzLndpblRpdGxlYmFyLCB0eXBlOiAnc3BhbicsIGh0bWw6IHRoaXMub3B0aW9ucy50aXRsZSwgc3R5bGVzOiB3aW5UaXRsZVN0eWxlcyB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZUJ1dHRvbnMoKVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1vdmFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVCdXR0b25zKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbkJ1dHRvbkdyb3VwID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZy1sZWZ0JzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHtcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnaW5saW5lLWJsb2NrJyxcclxuICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAnNXB4JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnd2lkdGgnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdoZWlnaHQnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtc2l6ZSc6ICdjb3ZlcicsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXJlcGVhdCc6ICduby1yZXBlYXQnLFxyXG4gICAgICAgICAgICAnb3BhY2l0eSc6IC43LFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yQnV0dG9uLFxyXG4gICAgICAgICAgICAnb3V0bGluZSc6IDBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idXR0b25zID0ge31cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pbmltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWluaW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1pbmltaXplID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5taW5pbWl6ZSwgKCkgPT4gdGhpcy5taW5pbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1heGltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWF4aW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSwgKCkgPT4gdGhpcy5tYXhpbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ2xvc2VCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLmNsb3NlID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5jbG9zZSwgKCkgPT4gdGhpcy5jbG9zZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5idXR0b25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5idXR0b25zW2tleV1cclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDAuN1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2J1dHRvbicsIGh0bWw6ICcmbmJzcCcsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdib3R0b20nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3JpZ2h0JzogJzRweCcsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdzZS1yZXNpemUnLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc2l6ZSxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTVweCcsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTBweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgZG93biA9IChlKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIGV2ZW50LnBhZ2VYLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gZXZlbnQucGFnZVlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXN0YXJ0JylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBkb3duKVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZG93bilcclxuICAgIH1cclxuXHJcbiAgICBfbW92ZShlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2lzVG91Y2hFdmVudChlKSAmJiBlLndoaWNoICE9PSAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3ZpbmcgJiYgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdmVkID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYIC0gdGhpcy5fbW92aW5nLngsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgLSB0aGlzLl9tb3ZpbmcueVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtb3ZlJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fcmVzaXppbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYICsgdGhpcy5fcmVzaXppbmcud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgKyB0aGlzLl9yZXNpemluZy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3VwKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5fbW92aW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vdmVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICB9XHJcblxyXG4gICAgX2xpc3RlbmVycygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BNb3ZlKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLWVuZCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSB0aGlzLl9yZXNpemluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1lbmQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIF9pc1RvdWNoRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuVG91Y2hFdmVudCAmJiAoZSBpbnN0YW5jZW9mIHdpbmRvdy5Ub3VjaEV2ZW50KVxyXG4gICAgfVxyXG5cclxuICAgIF9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVG91Y2hFdmVudChlKSA/IGUuY2hhbmdlZFRvdWNoZXNbMF0gOiBlXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHooKSB7IHJldHVybiBwYXJzZUludCh0aGlzLndpbi5zdHlsZS56SW5kZXgpIH1cclxuICAgIHNldCB6KHZhbHVlKSB7IHRoaXMud2luLnN0eWxlLnpJbmRleCA9IHZhbHVlIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3ciXX0=