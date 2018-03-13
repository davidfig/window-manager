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
         * centers window in middle of other window or document.body
         * @param {Window} [win]
         */
        value: function center(win) {
            if (win) {
                this.move(win.x + win.width / 2 - this.width / 2, win.y + win.height / 2 - this.height / 2);
            } else {
                this.move(window.innerWidth / 2 - this.width / 2, window.innerHeight / 2 - this.height / 2);
            }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwiY2xvc2VkIiwiY2xvc2UiLCJvcGVuIiwid2luZG93IiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwicGFyZW50Iiwic3R5bGVzIiwiYm9yZGVyUmFkaXVzIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJzaGFkb3ciLCJiYWNrZ3JvdW5kQ29sb3JXaW5kb3ciLCJpc05hTiIsIndpbkJveCIsIl9jcmVhdGVUaXRsZWJhciIsImNvbnRlbnQiLCJ0eXBlIiwicmVzaXphYmxlIiwiX2NyZWF0ZVJlc2l6ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX2Rvd25UaXRsZWJhciIsInN0b3BQcm9wYWdhdGlvbiIsImV2ZW50IiwiX2NvbnZlcnRNb3ZlRXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZVN0eWxlcyIsImZvcmVncm91bmRDb2xvclRpdGxlIiwidGl0bGVDZW50ZXIiLCJ3aW5UaXRsZSIsInRpdGxlIiwiX2NyZWF0ZUJ1dHRvbnMiLCJtb3ZhYmxlIiwid2luQnV0dG9uR3JvdXAiLCJidXR0b24iLCJmb3JlZ3JvdW5kQ29sb3JCdXR0b24iLCJiYWNrZ3JvdW5kTWluaW1pemVCdXR0b24iLCJjbG9zYWJsZSIsImJhY2tncm91bmRDbG9zZUJ1dHRvbiIsImtleSIsIm9wYWNpdHkiLCJyZXNpemVFZGdlIiwiYmFja2dyb3VuZFJlc2l6ZSIsImRvd24iLCJwcmV2ZW50RGVmYXVsdCIsIl9pc1RvdWNoRXZlbnQiLCJ3aGljaCIsIl9zdG9wTW92ZSIsIl9zdG9wUmVzaXplIiwicmVzaXplIiwiVG91Y2hFdmVudCIsImNoYW5nZWRUb3VjaGVzIiwidmFsdWUiLCJfdGl0bGUiLCJpbm5lclRleHQiLCJwYXJzZUludCIsInpJbmRleCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLElBQU1BLFNBQVNDLFFBQVEsZUFBUixDQUFmO0FBQ0EsSUFBTUMsVUFBVUQsUUFBUSxTQUFSLENBQWhCO0FBQ0EsSUFBTUUsT0FBT0YsUUFBUSxVQUFSLENBQWI7QUFDQSxJQUFNRyxTQUFTSCxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNSSxPQUFPSixRQUFRLFFB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LE07O0FBdzZCckJnSSxPQUFPQyxPQUFQLEdBQWlCMUgsTUFBakIiLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpXHJcbmNvbnN0IGNsaWNrZWQgPSByZXF1aXJlKCdjbGlja2VkJylcclxuY29uc3QgRWFzZSA9IHJlcXVpcmUoJ2RvbS1lYXNlJylcclxuY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5cclxubGV0IGlkID0gMFxyXG5cclxuLyoqXHJcbiAqIFdpbmRvdyBjbGFzcyByZXR1cm5lZCBieSBXaW5kb3dNYW5hZ2VyLmNyZWF0ZVdpbmRvdygpXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAaGlkZWNvbnN0cnVjdG9yXHJcbiAqIEBmaXJlcyBvcGVuXHJcbiAqIEBmaXJlcyBmb2N1c1xyXG4gKiBAZmlyZXMgYmx1clxyXG4gKiBAZmlyZXMgY2xvc2VcclxuICogQGZpcmVzIG1heGltaXplXHJcbiAqIEBmaXJlcyBtYXhpbWl6ZS1yZXN0b3JlXHJcbiAqIEBmaXJlcyBtaW5pbWl6ZVxyXG4gKiBAZmlyZXMgbWluaW1pemUtcmVzdG9yZVxyXG4gKiBAZmlyZXMgbW92ZVxyXG4gKiBAZmlyZXMgbW92ZS1zdGFydFxyXG4gKiBAZmlyZXMgbW92ZS1lbmRcclxuICogQGZpcmVzIHJlc2l6ZVxyXG4gKiBAZmlyZXMgcmVzaXplLXN0YXJ0XHJcbiAqIEBmaXJlcyByZXNpemUtZW5kXHJcbiAqIEBmaXJlcyBtb3ZlLXhcclxuICogQGZpcmVzIG1vdmUteVxyXG4gKiBAZmlyZXMgcmVzaXplLXdpZHRoXHJcbiAqIEBmaXJlcyByZXNpemUtaGVpZ2h0XHJcbiAqL1xyXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd01hbmFnZXJ9IHdtXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih3bSwgb3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgdGhpcy53bSA9IHdtXHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnNcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGV4aXN0cyh0aGlzLm9wdGlvbnMuaWQpID8gdGhpcy5vcHRpb25zLmlkIDogaWQrK1xyXG5cclxuICAgICAgICB0aGlzLl9jcmVhdGVXaW5kb3coKVxyXG4gICAgICAgIHRoaXMuX2xpc3RlbmVycygpXHJcblxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICB0aGlzLm1heGltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG5cclxuICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IG51bGxcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcblxyXG4gICAgICAgIHRoaXMuZWFzZSA9IG5ldyBFYXNlKHsgZHVyYXRpb246IHRoaXMub3B0aW9ucy5hbmltYXRlVGltZSwgZWFzZTogdGhpcy5vcHRpb25zLmVhc2UgfSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG9wZW4gdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9Gb2N1c10gZG8gbm90IGZvY3VzIHdpbmRvdyB3aGVuIG9wZW5lZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbbm9BbmltYXRlXSBkbyBub3QgYW5pbWF0ZSB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqL1xyXG4gICAgb3Blbihub0ZvY3VzLCBub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnb3BlbicsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgIGlmICghbm9BbmltYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMCknXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAxIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlXHJcbiAgICAgICAgICAgIGlmICghbm9Gb2N1cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mb2N1cygpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBmb2N1cyB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGZvY3VzKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvclRpdGxlYmFyQWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnZm9jdXMnLCB0aGlzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGJsdXIgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBibHVyKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5tb2RhbCAhPT0gdGhpcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2JsdXInLCB0aGlzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNsb3NlcyB0aGUgd2luZG93IChjYW4gYmUgcmVvcGVuZWQgd2l0aCBvcGVuKVxyXG4gICAgICovXHJcbiAgICBjbG9zZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgwKSdcclxuICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAwIH0pXHJcbiAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnY2xvc2UnLCB0aGlzKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBpcyB3aW5kb3cgY2xvc2VkP1xyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKiBAcmVhZG9ubHlcclxuICAgICAqL1xyXG4gICAgZ2V0IGNsb3NlZCgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nsb3NlZFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbGVmdCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy54IH1cclxuICAgIHNldCB4KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy54ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLXgnLCB0aGlzKVxyXG4gICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQubGVmdCA9IHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdG9wIGNvb3JkaW5hdGVcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB5KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLnkgfVxyXG4gICAgc2V0IHkodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnkgPSB2YWx1ZVxyXG4gICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS15JywgdGhpcylcclxuICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkLnRvcCA9IHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogd2lkdGggb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgd2lkdGgoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMud2lkdGggfHwgdGhpcy53aW4ub2Zmc2V0V2lkdGggfVxyXG4gICAgc2V0IHdpZHRoKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXdpZHRoJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlaWdodCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCBoZWlnaHQoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMuaGVpZ2h0IHx8IHRoaXMud2luLm9mZnNldEhlaWdodCB9XHJcbiAgICBzZXQgaGVpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gJydcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtaGVpZ2h0JywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlc2l6ZSB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcclxuICAgICAqL1xyXG4gICAgcmVzaXplKHdpZHRoLCBoZWlnaHQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoXHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1vdmUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHlcclxuICAgICAqL1xyXG4gICAgbW92ZSh4LCB5KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHhcclxuICAgICAgICB0aGlzLnkgPSB5XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtaW5pbWl6ZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbm9BbmltYXRlXHJcbiAgICAgKi9cclxuICAgIG1pbmltaXplKG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSAmJiB0aGlzLm9wdGlvbnMubWluaW1pemFibGUgJiYgIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLm1pbmltaXplZC54LCB5ID0gdGhpcy5taW5pbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUoeCwgeSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlWDogMSwgc2NhbGVZOiAxLCBsZWZ0OiB0aGlzLm1pbmltaXplZC54LCB0b3A6IHRoaXMubWluaW1pemVkLnkgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5taW5pbWl6ZWQueCwgeSA9IHRoaXMubWluaW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUoeCwgeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZS1yZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueFxyXG4gICAgICAgICAgICAgICAgY29uc3QgeSA9IHRoaXMueVxyXG4gICAgICAgICAgICAgICAgY29uc3QgbGVmdCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWQgPyB0aGlzLl9sYXN0TWluaW1pemVkLmxlZnQgOiB0aGlzLnhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRvcCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWQgPyB0aGlzLl9sYXN0TWluaW1pemVkLnRvcCA6IHRoaXMueVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVzaXJlZCA9IHRoaXMub3B0aW9ucy5taW5pbWl6ZVNpemVcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlWCA9IGRlc2lyZWQgLyB0aGlzLndpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZVkgPSBkZXNpcmVkIC8gdGhpcy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDEpIHNjYWxlWCgnICsgc2NhbGVYICsgJykgc2NhbGVZKCcgKyBzY2FsZVkgKyAnKSdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50b3AgPSB0b3AgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHksIHNjYWxlWCwgc2NhbGVZIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0geyBsZWZ0LCB0b3AgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0LCB0b3AsIHNjYWxlWCwgc2NhbGVZIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHksIHNjYWxlWCwgc2NhbGVZIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0geyBsZWZ0LCB0b3AgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUobGVmdCwgdG9wKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtYXhpbWl6ZSB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIG1heGltaXplKG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSAmJiB0aGlzLm9wdGlvbnMubWF4aW1pemFibGUgJiYgIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSB0aGlzLm1heGltaXplZC54XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gdGhpcy5tYXhpbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLm1heGltaXplZC53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdDogdGhpcy5tYXhpbWl6ZWQueCwgdG9wOiB0aGlzLm1heGltaXplZC55LCB3aWR0aDogdGhpcy5tYXhpbWl6ZWQud2lkdGgsIGhlaWdodDogdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gdGhpcy5tYXhpbWl6ZWQueFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSB0aGlzLm1heGltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLm1heGltaXplZC53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMubWF4aW1pemVkLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWF4aW1pemVCdXR0b25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLngsIHkgPSB0aGlzLnksIHdpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGgsIGhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IDBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21heGltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdDogMCwgdG9wOiAwLCB3aWR0aDogdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoLCBoZWlnaHQ6IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRXaWR0aCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0SGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21heGltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc3RvcmVCdXR0b25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmRzIHdpbmRvdyB0byBiYWNrIG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0JhY2soKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvQmFjayh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZCB3aW5kb3cgdG8gZnJvbnQgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvRnJvbnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvRnJvbnQodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNhdmUgdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gZGF0YVxyXG4gICAgICovXHJcbiAgICBzYXZlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBkYXRhID0ge31cclxuICAgICAgICBjb25zdCBtYXhpbWl6ZWQgPSB0aGlzLm1heGltaXplZFxyXG4gICAgICAgIGlmIChtYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1heGltaXplZCA9IHsgbGVmdDogbWF4aW1pemVkLmxlZnQsIHRvcDogbWF4aW1pemVkLnRvcCwgd2lkdGg6IG1heGltaXplZC53aWR0aCwgaGVpZ2h0OiBtYXhpbWl6ZWQuaGVpZ2h0IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbWluaW1pemVkID0gdGhpcy5taW5pbWl6ZWRcclxuICAgICAgICBpZiAobWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5taW5pbWl6ZWQgPSB7IHg6IHRoaXMubWluaW1pemVkLngsIHk6IHRoaXMubWluaW1pemVkLnksIHNjYWxlWDogdGhpcy5taW5pbWl6ZWQuc2NhbGVYLCBzY2FsZVk6IHRoaXMubWluaW1pemVkLnNjYWxlWSB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxhc3RNaW5pbWl6ZWQgPSB0aGlzLl9sYXN0TWluaW1pemVkXHJcbiAgICAgICAgaWYgKGxhc3RNaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmxhc3RNaW5pbWl6ZWQgPSB7IGxlZnQ6IGxhc3RNaW5pbWl6ZWQubGVmdCwgdG9wOiBsYXN0TWluaW1pemVkLnRvcCB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEueCA9IHRoaXMueFxyXG4gICAgICAgIGRhdGEueSA9IHRoaXMueVxyXG4gICAgICAgIGlmIChleGlzdHModGhpcy5vcHRpb25zLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEud2lkdGggPSB0aGlzLm9wdGlvbnMud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMuaGVpZ2h0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEuaGVpZ2h0ID0gdGhpcy5vcHRpb25zLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBkYXRhLmNsb3NlZCA9IHRoaXMuX2Nsb3NlZFxyXG4gICAgICAgIHJldHVybiBkYXRhXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm4gdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIGZyb20gc2F2ZSgpXHJcbiAgICAgKi9cclxuICAgIGxvYWQoZGF0YSlcclxuICAgIHtcclxuICAgICAgICBpZiAoZGF0YS5tYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5tYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1heGltaXplKHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkYXRhLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUodHJ1ZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGRhdGEubWluaW1pemVkXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5sYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IGRhdGEubGFzdE1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnggPSBkYXRhLnhcclxuICAgICAgICB0aGlzLnkgPSBkYXRhLnlcclxuICAgICAgICBpZiAoZXhpc3RzKGRhdGEud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IGRhdGEud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLmhlaWdodCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGRhdGEuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vcGVuKHRydWUsIHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2hhbmdlIHRpdGxlXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXQgdGl0bGUoKSB7IHJldHVybiB0aGlzLl90aXRsZSB9XHJcbiAgICBzZXQgdGl0bGUodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5UaXRsZS5pbm5lclRleHQgPSB2YWx1ZVxyXG4gICAgICAgIHRoaXMuZW1pdCgndGl0bGUtY2hhbmdlJywgdGhpcylcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByaWdodCBjb29yZGluYXRlIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHJpZ2h0KCkgeyByZXR1cm4gdGhpcy54ICsgdGhpcy53aWR0aCB9XHJcbiAgICBzZXQgcmlnaHQodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy54ID0gdmFsdWUgLSB0aGlzLndpZHRoXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBib3R0b20gY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCBib3R0b20oKSB7IHJldHVybiB0aGlzLnkgKyB0aGlzLmhlaWdodCB9XHJcbiAgICBzZXQgYm90dG9tKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueSA9IHZhbHVlIC0gdGhpcy5oZWlnaHRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNlbnRlcnMgd2luZG93IGluIG1pZGRsZSBvZiBvdGhlciB3aW5kb3cgb3IgZG9jdW1lbnQuYm9keVxyXG4gICAgICogQHBhcmFtIHtXaW5kb3d9IFt3aW5dXHJcbiAgICAgKi9cclxuICAgIGNlbnRlcih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHdpbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgICAgIHdpbi54ICsgd2luLndpZHRoIC8gMiAtIHRoaXMud2lkdGggLyAyLFxyXG4gICAgICAgICAgICAgICAgd2luLnkgKyB3aW4uaGVpZ2h0IC8gMiAtIHRoaXMuaGVpZ2h0IC8gMlxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5pbm5lcldpZHRoIC8gMiAtIHRoaXMud2lkdGggLyAyLFxyXG4gICAgICAgICAgICAgICAgd2luZG93LmlubmVySGVpZ2h0IC8gMiAtIHRoaXMuaGVpZ2h0IC8gMlxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgbWF4aW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21heGltaXplXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyByZXN0b3JlZCB0byBub3JtYWwgYWZ0ZXIgYmVpbmcgbWF4aW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21heGltaXplLXJlc3RvcmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIHJlc3RvcmVkIHRvIG5vcm1hbCBhZnRlciBiZWluZyBtaW5pbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWluaW1pemUtcmVzdG9yZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgb3BlbnNcclxuICAgICAqIEBldmVudCBXaW5kb3cjb3BlblxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgZ2FpbnMgZm9jdXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjZm9jdXNcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgbG9zZXMgZm9jdXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjYmx1clxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBjbG9zZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjY2xvc2VcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gcmVzaXplIHN0YXJ0c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtc3RhcnRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGFmdGVyIHJlc2l6ZSBjb21wbGV0ZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLWVuZFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgZHVyaW5nIHJlc2l6aW5nXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiBtb3ZlIHN0YXJ0c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXN0YXJ0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBhZnRlciBtb3ZlIGNvbXBsZXRlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLWVuZFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgZHVyaW5nIG1vdmVcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aWR0aCBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS13aWR0aFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiBoZWlnaHQgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtaGVpZ2h0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHggcG9zaXRpb24gb2Ygd2luZG93IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS14XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB5IHBvc2l0aW9uIG9mIHdpbmRvdyBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUteVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIF9jcmVhdGVXaW5kb3coKVxyXG4gICAge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgaXMgdGhlIHRvcC1sZXZlbCBET00gZWxlbWVudFxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKiBAcmVhZG9ubHlcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLndpbiA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud20ud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci1yYWRpdXMnOiB0aGlzLm9wdGlvbnMuYm9yZGVyUmFkaXVzLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi13aWR0aCc6IHRoaXMub3B0aW9ucy5taW5XaWR0aCxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLm1pbkhlaWdodCxcclxuICAgICAgICAgICAgICAgICdib3gtc2hhZG93JzogdGhpcy5vcHRpb25zLnNoYWRvdyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvcldpbmRvdyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogdGhpcy5vcHRpb25zLngsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogdGhpcy5vcHRpb25zLnksXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiBpc05hTih0aGlzLm9wdGlvbnMud2lkdGgpID8gdGhpcy5vcHRpb25zLndpZHRoIDogdGhpcy5vcHRpb25zLndpZHRoICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiBpc05hTih0aGlzLm9wdGlvbnMuaGVpZ2h0KSA/IHRoaXMub3B0aW9ucy5oZWlnaHQgOiB0aGlzLm9wdGlvbnMuaGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy53aW5Cb3ggPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdjb2x1bW4nLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLm1pbkhlaWdodFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLl9jcmVhdGVUaXRsZWJhcigpXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgaXMgdGhlIGNvbnRlbnQgRE9NIGVsZW1lbnQuIFVzZSB0aGlzIHRvIGFkZCBjb250ZW50IHRvIHRoZSBXaW5kb3cuXHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqIEByZWFkb25seVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuY29udGVudCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnc2VjdGlvbicsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnYmxvY2snLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgnOiAxLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm1pbkhlaWdodCxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdy14JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteSc6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZXNpemFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9jcmVhdGVSZXNpemUoKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IDAsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4geyB0aGlzLl9kb3duVGl0bGViYXIoZSk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChlKSA9PiB7IHRoaXMuX2Rvd25UaXRsZWJhcihlKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgfVxyXG5cclxuICAgIF9kb3duVGl0bGViYXIoZSlcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG4gICAgICAgICAgICB0aGlzLl9tb3ZpbmcgPSB7XHJcbiAgICAgICAgICAgICAgICB4OiBldmVudC5wYWdlWCAtIHRoaXMueCxcclxuICAgICAgICAgICAgICAgIHk6IGV2ZW50LnBhZ2VZIC0gdGhpcy55XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLXN0YXJ0JywgdGhpcylcclxuICAgICAgICAgICAgdGhpcy5fbW92ZWQgPSBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlVGl0bGViYXIoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luVGl0bGViYXIgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2hlYWRlcicsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ2p1c3RpZnktY29udGVudCc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IHRoaXMub3B0aW9ucy50aXRsZWJhckhlaWdodCxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6ICcwIDhweCcsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3Qgd2luVGl0bGVTdHlsZXMgPSB7XHJcbiAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgJ2ZsZXgnOiAxLFxyXG4gICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICdjdXJzb3InOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgJ21hcmdpbic6IDAsXHJcbiAgICAgICAgICAgICdmb250LXNpemUnOiAnMTZweCcsXHJcbiAgICAgICAgICAgICdmb250LXdlaWdodCc6IDQwMCxcclxuICAgICAgICAgICAgJ2NvbG9yJzogdGhpcy5vcHRpb25zLmZvcmVncm91bmRDb2xvclRpdGxlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudGl0bGVDZW50ZXIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aW5UaXRsZVN0eWxlc1snanVzdGlmeS1jb250ZW50J10gPSAnY2VudGVyJ1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aW5UaXRsZVN0eWxlc1sncGFkZGluZy1sZWZ0J10gPSAnOHB4J1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy53aW5UaXRsZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHR5cGU6ICdzcGFuJywgaHRtbDogdGhpcy5vcHRpb25zLnRpdGxlLCBzdHlsZXM6IHdpblRpdGxlU3R5bGVzIH0pXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlQnV0dG9ucygpXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubW92YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHRoaXMuX2Rvd25UaXRsZWJhcihlKSlcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHRoaXMuX2Rvd25UaXRsZWJhcihlKSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZUJ1dHRvbnMoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luQnV0dG9uR3JvdXAgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpblRpdGxlYmFyLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nLWxlZnQnOiAnMTBweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgYnV0dG9uID0ge1xyXG4gICAgICAgICAgICAnZGlzcGxheSc6ICdpbmxpbmUtYmxvY2snLFxyXG4gICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgJ21hcmdpbic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4tbGVmdCc6ICc1cHgnLFxyXG4gICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICd3aWR0aCc6ICcxMnB4JyxcclxuICAgICAgICAgICAgJ2hlaWdodCc6ICcxMnB4JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAndHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1zaXplJzogJ2NvdmVyJyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtcmVwZWF0JzogJ25vLXJlcGVhdCcsXHJcbiAgICAgICAgICAgICdvcGFjaXR5JzogLjcsXHJcbiAgICAgICAgICAgICdjb2xvcic6IHRoaXMub3B0aW9ucy5mb3JlZ3JvdW5kQ29sb3JCdXR0b24sXHJcbiAgICAgICAgICAgICdvdXRsaW5lJzogMFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJ1dHRvbnMgPSB7fVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubWluaW1pemFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBidXR0b24uYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWluaW1pemUgPSBodG1sKHsgcGFyZW50OiB0aGlzLndpbkJ1dHRvbkdyb3VwLCBodG1sOiAnJm5ic3A7JywgdHlwZTogJ2J1dHRvbicsIHN0eWxlczogYnV0dG9uIH0pXHJcbiAgICAgICAgICAgIGNsaWNrZWQodGhpcy5idXR0b25zLm1pbmltaXplLCAoKSA9PiB0aGlzLm1pbmltaXplKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubWF4aW1pemFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBidXR0b24uYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNYXhpbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUgPSBodG1sKHsgcGFyZW50OiB0aGlzLndpbkJ1dHRvbkdyb3VwLCBodG1sOiAnJm5ic3A7JywgdHlwZTogJ2J1dHRvbicsIHN0eWxlczogYnV0dG9uIH0pXHJcbiAgICAgICAgICAgIGNsaWNrZWQodGhpcy5idXR0b25zLm1heGltaXplLCAoKSA9PiB0aGlzLm1heGltaXplKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBidXR0b24uYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDbG9zZUJ1dHRvblxyXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMuY2xvc2UgPSBodG1sKHsgcGFyZW50OiB0aGlzLndpbkJ1dHRvbkdyb3VwLCBodG1sOiAnJm5ic3A7JywgdHlwZTogJ2J1dHRvbicsIHN0eWxlczogYnV0dG9uIH0pXHJcbiAgICAgICAgICAgIGNsaWNrZWQodGhpcy5idXR0b25zLmNsb3NlLCAoKSA9PiB0aGlzLmNsb3NlKCkpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLmJ1dHRvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBidXR0b24gPSB0aGlzLmJ1dHRvbnNba2V5XVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAxXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMC43XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnYnV0dG9uJywgaHRtbDogJyZuYnNwJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgJ2JvdHRvbSc6IDAsXHJcbiAgICAgICAgICAgICAgICAncmlnaHQnOiAnNHB4JyxcclxuICAgICAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAgICAgJ21hcmdpbic6IDAsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICAgICAnY3Vyc29yJzogJ3NlLXJlc2l6ZScsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZCc6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kUmVzaXplLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxNXB4JyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMHB4J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBkb3duID0gKGUpID0+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICAgICAgICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMud2lkdGggfHwgdGhpcy53aW4ub2Zmc2V0V2lkdGhcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IHRoaXMuaGVpZ2h0IHx8IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXppbmcgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHdpZHRoIC0gZXZlbnQucGFnZVgsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgLSBldmVudC5wYWdlWVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtc3RhcnQnKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5yZXNpemVFZGdlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGRvd24pXHJcbiAgICAgICAgdGhpcy5yZXNpemVFZGdlLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBkb3duKVxyXG4gICAgfVxyXG5cclxuICAgIF9tb3ZlKGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5faXNUb3VjaEV2ZW50KGUpICYmIGUud2hpY2ggIT09IDEpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX21vdmluZyAmJiB0aGlzLl9zdG9wTW92ZSgpXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemluZyAmJiB0aGlzLl9zdG9wUmVzaXplKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5fbW92aW5nKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbW92ZWQgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vdmUoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVggLSB0aGlzLl9tb3ZpbmcueCxcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWSAtIHRoaXMuX21vdmluZy55XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9yZXNpemluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXNpemUoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVggKyB0aGlzLl9yZXNpemluZy53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWSArIHRoaXMuX3Jlc2l6aW5nLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfdXAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbW92ZWQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZXNpemluZyAmJiB0aGlzLl9zdG9wUmVzaXplKClcclxuICAgIH1cclxuXHJcbiAgICBfbGlzdGVuZXJzKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsICgpID0+IHRoaXMuZm9jdXMoKSlcclxuICAgIH1cclxuXHJcbiAgICBfc3RvcE1vdmUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX21vdmluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUtZW5kJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICBfc3RvcFJlc2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fcmVzdG9yZSA9IHRoaXMuX3Jlc2l6aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLWVuZCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgX2lzVG91Y2hFdmVudChlKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5Ub3VjaEV2ZW50ICYmIChlIGluc3RhbmNlb2Ygd2luZG93LlRvdWNoRXZlbnQpXHJcbiAgICB9XHJcblxyXG4gICAgX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5faXNUb3VjaEV2ZW50KGUpID8gZS5jaGFuZ2VkVG91Y2hlc1swXSA6IGVcclxuICAgIH1cclxuXHJcbiAgICBnZXQgeigpIHsgcmV0dXJuIHBhcnNlSW50KHRoaXMud2luLnN0eWxlLnpJbmRleCkgfVxyXG4gICAgc2V0IHoodmFsdWUpIHsgdGhpcy53aW4uc3R5bGUuekluZGV4ID0gdmFsdWUgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdpbmRvdyJdfQ==