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
     * @param {WindowManager} [wm]
     * @param {object} [options]
     */
    function Window(wm, options) {
        _classCallCheck(this, Window);

        var _this = _possibleConstructorReturn(this, (Window.__proto__ || Object.getPrototypeOf(Window)).call(this));

        _this.wm = wm;

        _this.options = options || {};

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
                if (this.options.titlebar) {
                    this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarActive;
                }
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
                if (this.options.titlebar) {
                    this.winTitlebar.style.backgroundColor = this.options.backgroundColorTitlebarInactive;
                }
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
                parent: this.wm ? this.wm.win : null, styles: {
                    'display': 'none',
                    'border-radius': this.options.borderRadius,
                    'user-select': 'none',
                    'overflow': 'hidden',
                    'position': 'absolute',
                    'min-width': this.options.minWidth,
                    'min-height': this.options.minHeight,
                    'box-shadow': this.options.shadow,
                    'background-color': this.options.backgroundColorWindow,
                    'left': this.options.x + 'px',
                    'top': this.options.y + 'px',
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
            var _this6 = this;

            if (this.options.titlebar) {
                var _winTitleStyles;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwidGl0bGViYXIiLCJ3aW5UaXRsZWJhciIsImJhY2tncm91bmRDb2xvciIsImJhY2tncm91bmRDb2xvclRpdGxlYmFyQWN0aXZlIiwibW9kYWwiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckluYWN0aXZlIiwib24iLCJ3aWR0aCIsImhlaWdodCIsIngiLCJ5IiwibWluaW1pemFibGUiLCJ0cmFuc2l0aW9uaW5nIiwibW92ZSIsIm92ZXJsYXkiLCJzY2FsZVgiLCJzY2FsZVkiLCJsZWZ0IiwidG9wIiwiX2xhc3RNaW5pbWl6ZWQiLCJkZXNpcmVkIiwibWluaW1pemVTaXplIiwibWF4aW1pemFibGUiLCJidXR0b25zIiwibWF4aW1pemUiLCJiYWNrZ3JvdW5kSW1hZ2UiLCJiYWNrZ3JvdW5kTWF4aW1pemVCdXR0b24iLCJvZmZzZXRXaWR0aCIsIm9mZnNldEhlaWdodCIsImJhY2tncm91bmRSZXN0b3JlQnV0dG9uIiwic2VuZFRvQmFjayIsInNlbmRUb0Zyb250IiwiZGF0YSIsImxhc3RNaW5pbWl6ZWQiLCJjbG9zZWQiLCJjbG9zZSIsIm9wZW4iLCJ3aW5kb3ciLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJwYXJlbnQiLCJzdHlsZXMiLCJib3JkZXJSYWRpdXMiLCJtaW5XaWR0aCIsIm1pbkhlaWdodCIsInNoYWRvdyIsImJhY2tncm91bmRDb2xvcldpbmRvdyIsImlzTmFOIiwid2luQm94IiwiX2NyZWF0ZVRpdGxlYmFyIiwiY29udGVudCIsInR5cGUiLCJyZXNpemFibGUiLCJfY3JlYXRlUmVzaXplIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJfZG93blRpdGxlYmFyIiwic3RvcFByb3BhZ2F0aW9uIiwiZXZlbnQiLCJfY29udmVydE1vdmVFdmVudCIsInBhZ2VYIiwicGFnZVkiLCJfbW92ZWQiLCJ0aXRsZWJhckhlaWdodCIsIndpblRpdGxlU3R5bGVzIiwiZm9yZWdyb3VuZENvbG9yVGl0bGUiLCJ0aXRsZUNlbnRlciIsIndpblRpdGxlIiwidGl0bGUiLCJfY3JlYXRlQnV0dG9ucyIsIm1vdmFibGUiLCJ3aW5CdXR0b25Hcm91cCIsImJ1dHRvbiIsImZvcmVncm91bmRDb2xvckJ1dHRvbiIsImJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvbiIsImNsb3NhYmxlIiwiYmFja2dyb3VuZENsb3NlQnV0dG9uIiwia2V5Iiwib3BhY2l0eSIsInJlc2l6ZUVkZ2UiLCJiYWNrZ3JvdW5kUmVzaXplIiwiZG93biIsInByZXZlbnREZWZhdWx0IiwiX2lzVG91Y2hFdmVudCIsIndoaWNoIiwiX3N0b3BNb3ZlIiwiX3N0b3BSZXNpemUiLCJyZXNpemUiLCJUb3VjaEV2ZW50IiwiY2hhbmdlZFRvdWNoZXMiLCJ2YWx1ZSIsIl90aXRsZSIsImlubmVyVGV4dCIsInBhcnNlSW50IiwiekluZGV4IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxlQUFSLENBQWY7QUFDQSxJQUFNQyxVQUFVRCxRQUFRLFNBQVIsQ0FBaEI7QUFDQSxJQUFNRSxPQUFPRixRQUFRLFVBQVIsQ0FBYjtBQUNBLElBQU1HLFNBQVNILFFBQVEsUUFBUixDQUFmOztBQUVBLElBQU1JLE9B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Ozs7OzRCQUlhO0FBQUUsbUJBQU8sS0FBS0csQ0FBTCxHQUFTLEtBQUtGLE1BQXJCO0FBQTZCLFM7MEJBQ2pDa0YsSyxFQUNYO0FBQ0ksaUJBQUtoRixDQUFMLEdBQVNnRixRQUFRLEtBQUtsRixNQUF0QjtBQUNIOzs7NEJBcWJPO0FBQUUsbUJBQU9xRixTQUFTLEtBQUt0RyxHQUFMLENBQVNDLEtBQVQsQ0FBZXNHLE1BQXhCLENBQVA7QUFBd0MsUzswQkFDNUNKLEssRUFBTztBQUFFLGlCQUFLbkcsR0FBTCxDQUFTQyxLQUFULENBQWVzRyxNQUFmLEdBQXdCSixLQUF4QjtBQUErQjs7OztFQTk2QjdCNUgsTTs7QUFpN0JyQmlJLE9BQU9DLE9BQVAsR0FBaUIzSCxNQUFqQiIsImZpbGUiOiJ3aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBFdmVudHMgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJylcclxuY29uc3QgY2xpY2tlZCA9IHJlcXVpcmUoJ2NsaWNrZWQnKVxyXG5jb25zdCBFYXNlID0gcmVxdWlyZSgnZG9tLWVhc2UnKVxyXG5jb25zdCBleGlzdHMgPSByZXF1aXJlKCdleGlzdHMnKVxyXG5cclxuY29uc3QgaHRtbCA9IHJlcXVpcmUoJy4vaHRtbCcpXHJcblxyXG5sZXQgaWQgPSAwXHJcblxyXG4vKipcclxuICogV2luZG93IGNsYXNzIHJldHVybmVkIGJ5IFdpbmRvd01hbmFnZXIuY3JlYXRlV2luZG93KClcclxuICogQGV4dGVuZHMgRXZlbnRFbWl0dGVyXHJcbiAqIEBmaXJlcyBvcGVuXHJcbiAqIEBmaXJlcyBmb2N1c1xyXG4gKiBAZmlyZXMgYmx1clxyXG4gKiBAZmlyZXMgY2xvc2VcclxuICogQGZpcmVzIG1heGltaXplXHJcbiAqIEBmaXJlcyBtYXhpbWl6ZS1yZXN0b3JlXHJcbiAqIEBmaXJlcyBtaW5pbWl6ZVxyXG4gKiBAZmlyZXMgbWluaW1pemUtcmVzdG9yZVxyXG4gKiBAZmlyZXMgbW92ZVxyXG4gKiBAZmlyZXMgbW92ZS1zdGFydFxyXG4gKiBAZmlyZXMgbW92ZS1lbmRcclxuICogQGZpcmVzIHJlc2l6ZVxyXG4gKiBAZmlyZXMgcmVzaXplLXN0YXJ0XHJcbiAqIEBmaXJlcyByZXNpemUtZW5kXHJcbiAqIEBmaXJlcyBtb3ZlLXhcclxuICogQGZpcmVzIG1vdmUteVxyXG4gKiBAZmlyZXMgcmVzaXplLXdpZHRoXHJcbiAqIEBmaXJlcyByZXNpemUtaGVpZ2h0XHJcbiAqL1xyXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd01hbmFnZXJ9IFt3bV1cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iod20sIG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIHRoaXMud20gPSB3bVxyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBleGlzdHModGhpcy5vcHRpb25zLmlkKSA/IHRoaXMub3B0aW9ucy5pZCA6IGlkKytcclxuXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlV2luZG93KClcclxuICAgICAgICB0aGlzLl9saXN0ZW5lcnMoKVxyXG5cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuXHJcbiAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nID0gbnVsbFxyXG5cclxuICAgICAgICB0aGlzLmVhc2UgPSBuZXcgRWFzZSh7IGR1cmF0aW9uOiB0aGlzLm9wdGlvbnMuYW5pbWF0ZVRpbWUsIGVhc2U6IHRoaXMub3B0aW9ucy5lYXNlIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBvcGVuIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vRm9jdXNdIGRvIG5vdCBmb2N1cyB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vQW5pbWF0ZV0gZG8gbm90IGFuaW1hdGUgd2luZG93IHdoZW4gb3BlbmVkXHJcbiAgICAgKi9cclxuICAgIG9wZW4obm9Gb2N1cywgbm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ29wZW4nLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICBpZiAoIW5vQW5pbWF0ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDApJ1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZTogMSB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICBpZiAoIW5vRm9jdXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZm9jdXMgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBmb2N1cygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZVxyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRpdGxlYmFyKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnZm9jdXMnLCB0aGlzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGJsdXIgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBibHVyKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5tb2RhbCAhPT0gdGhpcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50aXRsZWJhcilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYmx1cicsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xvc2VzIHRoZSB3aW5kb3cgKGNhbiBiZSByZW9wZW5lZCB3aXRoIG9wZW4pXHJcbiAgICAgKi9cclxuICAgIGNsb3NlKG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDApJ1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDAgfSlcclxuICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjbG9zZScsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGlzIHdpbmRvdyBjbG9zZWQ/XHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqIEByZWFkb25seVxyXG4gICAgICovXHJcbiAgICBnZXQgY2xvc2VkKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY2xvc2VkXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBsZWZ0IGNvb3JkaW5hdGVcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB4KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLnggfVxyXG4gICAgc2V0IHgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnggPSB2YWx1ZVxyXG4gICAgICAgIHRoaXMud2luLnN0eWxlLmxlZnQgPSB2YWx1ZSArICdweCdcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUteCcsIHRoaXMpXHJcbiAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZC5sZWZ0ID0gdmFsdWVcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0b3AgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHkoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueSB9XHJcbiAgICBzZXQgeSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueSA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLXknLCB0aGlzKVxyXG4gICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQudG9wID0gdmFsdWVcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB3aWR0aCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB3aWR0aCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aCB9XHJcbiAgICBzZXQgd2lkdGgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSB2YWx1ZSArICdweCdcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gJydcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtd2lkdGgnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaGVpZ2h0IG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IGhlaWdodCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0IH1cclxuICAgIHNldCBoZWlnaHQodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1oZWlnaHQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVzaXplIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxyXG4gICAgICovXHJcbiAgICByZXNpemUod2lkdGgsIGhlaWdodClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGhcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbW92ZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geVxyXG4gICAgICovXHJcbiAgICBtb3ZlKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy54ID0geFxyXG4gICAgICAgIHRoaXMueSA9IHlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1pbmltaXplIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBub0FuaW1hdGVcclxuICAgICAqL1xyXG4gICAgbWluaW1pemUobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMubWluaW1pemVkLngsIHkgPSB0aGlzLm1pbmltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZSh4LCB5KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUtcmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGVYOiAxLCBzY2FsZVk6IDEsIGxlZnQ6IHRoaXMubWluaW1pemVkLngsIHRvcDogdGhpcy5taW5pbWl6ZWQueSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLm1pbmltaXplZC54LCB5ID0gdGhpcy5taW5pbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZSh4LCB5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy54XHJcbiAgICAgICAgICAgICAgICBjb25zdCB5ID0gdGhpcy55XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsZWZ0ID0gdGhpcy5fbGFzdE1pbmltaXplZCA/IHRoaXMuX2xhc3RNaW5pbWl6ZWQubGVmdCA6IHRoaXMueFxyXG4gICAgICAgICAgICAgICAgY29uc3QgdG9wID0gdGhpcy5fbGFzdE1pbmltaXplZCA/IHRoaXMuX2xhc3RNaW5pbWl6ZWQudG9wIDogdGhpcy55XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZXNpcmVkID0gdGhpcy5vcHRpb25zLm1pbmltaXplU2l6ZVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbGVYID0gZGVzaXJlZCAvIHRoaXMud2lkdGhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlWSA9IGRlc2lyZWQgLyB0aGlzLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMSkgc2NhbGVYKCcgKyBzY2FsZVggKyAnKSBzY2FsZVkoJyArIHNjYWxlWSArICcpJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IHRvcCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IHsgeCwgeSwgc2NhbGVYLCBzY2FsZVkgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSB7IGxlZnQsIHRvcCB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQsIHRvcCwgc2NhbGVYLCBzY2FsZVkgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IHsgeCwgeSwgc2NhbGVYLCBzY2FsZVkgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSB7IGxlZnQsIHRvcCB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZShsZWZ0LCB0b3ApXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1heGltaXplIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgbWF4aW1pemUobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IHRoaXMubWF4aW1pemVkLnhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSB0aGlzLm1heGltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMubWF4aW1pemVkLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLm1heGltaXplZC5oZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiB0aGlzLm1heGltaXplZC54LCB0b3A6IHRoaXMubWF4aW1pemVkLnksIHdpZHRoOiB0aGlzLm1heGltaXplZC53aWR0aCwgaGVpZ2h0OiB0aGlzLm1heGltaXplZC5oZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSB0aGlzLm1heGltaXplZC54XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IHRoaXMubWF4aW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMubWF4aW1pemVkLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNYXhpbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgd2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aCwgaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0geyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGggKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0SGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWF4aW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiAwLCB0b3A6IDAsIHdpZHRoOiB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGgsIGhlaWdodDogdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0geyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWF4aW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZHMgd2luZG93IHRvIGJhY2sgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvQmFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53bS5zZW5kVG9CYWNrKHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBmcm9udCBvZiB3aW5kb3ctbWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzZW5kVG9Gcm9udCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53bS5zZW5kVG9Gcm9udCh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2F2ZSB0aGUgc3RhdGUgb2YgdGhlIHdpbmRvd1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSBkYXRhXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7fVxyXG4gICAgICAgIGNvbnN0IG1heGltaXplZCA9IHRoaXMubWF4aW1pemVkXHJcbiAgICAgICAgaWYgKG1heGltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubWF4aW1pemVkID0geyBsZWZ0OiBtYXhpbWl6ZWQubGVmdCwgdG9wOiBtYXhpbWl6ZWQudG9wLCB3aWR0aDogbWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IG1heGltaXplZC5oZWlnaHQgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBtaW5pbWl6ZWQgPSB0aGlzLm1pbmltaXplZFxyXG4gICAgICAgIGlmIChtaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1pbmltaXplZCA9IHsgeDogdGhpcy5taW5pbWl6ZWQueCwgeTogdGhpcy5taW5pbWl6ZWQueSwgc2NhbGVYOiB0aGlzLm1pbmltaXplZC5zY2FsZVgsIHNjYWxlWTogdGhpcy5taW5pbWl6ZWQuc2NhbGVZIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGFzdE1pbmltaXplZCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWRcclxuICAgICAgICBpZiAobGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubGFzdE1pbmltaXplZCA9IHsgbGVmdDogbGFzdE1pbmltaXplZC5sZWZ0LCB0b3A6IGxhc3RNaW5pbWl6ZWQudG9wIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS54ID0gdGhpcy54XHJcbiAgICAgICAgZGF0YS55ID0gdGhpcy55XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS53aWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXhpc3RzKHRoaXMub3B0aW9ucy5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEuY2xvc2VkID0gdGhpcy5fY2xvc2VkXHJcbiAgICAgICAgcmV0dXJuIGRhdGFcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybiB0aGUgc3RhdGUgb2YgdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgZnJvbSBzYXZlKClcclxuICAgICAqL1xyXG4gICAgbG9hZChkYXRhKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChkYXRhLm1heGltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5tYXhpbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemUodHJ1ZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLm1heGltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubWF4aW1pemUodHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZGF0YS5taW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1pbmltaXplKHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkYXRhLmxhc3RNaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0gZGF0YS5sYXN0TWluaW1pemVkXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMueCA9IGRhdGEueFxyXG4gICAgICAgIHRoaXMueSA9IGRhdGEueVxyXG4gICAgICAgIGlmIChleGlzdHMoZGF0YS53aWR0aCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpZHRoID0gZGF0YS53aWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXhpc3RzKGRhdGEuaGVpZ2h0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gZGF0YS5oZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkYXRhLmNsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UodHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9wZW4odHJ1ZSwgdHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGFuZ2UgdGl0bGVcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldCB0aXRsZSgpIHsgcmV0dXJuIHRoaXMuX3RpdGxlIH1cclxuICAgIHNldCB0aXRsZSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlLmlubmVyVGV4dCA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy5lbWl0KCd0aXRsZS1jaGFuZ2UnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJpZ2h0IGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgcmlnaHQoKSB7IHJldHVybiB0aGlzLnggKyB0aGlzLndpZHRoIH1cclxuICAgIHNldCByaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB2YWx1ZSAtIHRoaXMud2lkdGhcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGJvdHRvbSBjb29yZGluYXRlIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IGJvdHRvbSgpIHsgcmV0dXJuIHRoaXMueSArIHRoaXMuaGVpZ2h0IH1cclxuICAgIHNldCBib3R0b20odmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy55ID0gdmFsdWUgLSB0aGlzLmhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2VudGVycyB3aW5kb3cgaW4gbWlkZGxlIG9mIG90aGVyIHdpbmRvdyBvciBkb2N1bWVudC5ib2R5XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gW3dpbl1cclxuICAgICAqL1xyXG4gICAgY2VudGVyKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAod2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgd2luLnggKyB3aW4ud2lkdGggLyAyIC0gdGhpcy53aWR0aCAvIDIsXHJcbiAgICAgICAgICAgICAgICB3aW4ueSArIHdpbi5oZWlnaHQgLyAyIC0gdGhpcy5oZWlnaHQgLyAyXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgd2luZG93LmlubmVyV2lkdGggLyAyIC0gdGhpcy53aWR0aCAvIDIsXHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyIC0gdGhpcy5oZWlnaHQgLyAyXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIHJlc3RvcmVkIHRvIG5vcm1hbCBhZnRlciBiZWluZyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemUtcmVzdG9yZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1pbmltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtaW5pbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBvcGVuc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNvcGVuXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBnYWlucyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNmb2N1c1xyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBsb3NlcyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNibHVyXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGNsb3Nlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNjbG9zZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiByZXNpemUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgcmVzaXplIGNvbXBsZXRlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgcmVzaXppbmdcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIG1vdmUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtc3RhcnRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGFmdGVyIG1vdmUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgbW92ZVxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpZHRoIGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXdpZHRoXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIGhlaWdodCBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1oZWlnaHRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4geCBwb3NpdGlvbiBvZiB3aW5kb3cgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXhcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHkgcG9zaXRpb24gb2Ygd2luZG93IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS15XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgX2NyZWF0ZVdpbmRvdygpXHJcbiAgICB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgdG9wLWxldmVsIERPTSBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqIEByZWFkb25seVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMud2luID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogKHRoaXMud20gPyB0aGlzLndtLndpbiA6IG51bGwpLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci1yYWRpdXMnOiB0aGlzLm9wdGlvbnMuYm9yZGVyUmFkaXVzLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi13aWR0aCc6IHRoaXMub3B0aW9ucy5taW5XaWR0aCxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLm1pbkhlaWdodCxcclxuICAgICAgICAgICAgICAgICdib3gtc2hhZG93JzogdGhpcy5vcHRpb25zLnNoYWRvdyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvcldpbmRvdyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogdGhpcy5vcHRpb25zLnggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IHRoaXMub3B0aW9ucy55ICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IGlzTmFOKHRoaXMub3B0aW9ucy53aWR0aCkgPyB0aGlzLm9wdGlvbnMud2lkdGggOiB0aGlzLm9wdGlvbnMud2lkdGggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IGlzTmFOKHRoaXMub3B0aW9ucy5oZWlnaHQpID8gdGhpcy5vcHRpb25zLmhlaWdodCA6IHRoaXMub3B0aW9ucy5oZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLndpbkJveCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ2NvbHVtbicsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVRpdGxlYmFyKClcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgY29udGVudCBET00gZWxlbWVudC4gVXNlIHRoaXMgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIFdpbmRvdy5cclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdzZWN0aW9uJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdibG9jaycsXHJcbiAgICAgICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXgnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdy15JzogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlc2l6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm92ZXJsYXkgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IDAsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7IHRoaXMuX2Rvd25UaXRsZWJhcihlKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgX2Rvd25UaXRsZWJhcihlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmluZyA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gdGhpcy54LFxyXG4gICAgICAgICAgICAgICAgeTogZXZlbnQucGFnZVkgLSB0aGlzLnlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUtc3RhcnQnLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVUaXRsZWJhcigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50aXRsZWJhcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIgPSBodG1sKHtcclxuICAgICAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdoZWFkZXInLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2p1c3RpZnktY29udGVudCc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICdoZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAnMCA4cHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBjb25zdCB3aW5UaXRsZVN0eWxlcyA9IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdmb250LXNpemUnOiAnMTZweCcsXHJcbiAgICAgICAgICAgICAgICAnZm9udC13ZWlnaHQnOiA0MDAsXHJcbiAgICAgICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yVGl0bGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRpdGxlQ2VudGVyKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB3aW5UaXRsZVN0eWxlc1snanVzdGlmeS1jb250ZW50J10gPSAnY2VudGVyJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgd2luVGl0bGVTdHlsZXNbJ3BhZGRpbmctbGVmdCddID0gJzhweCdcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHR5cGU6ICdzcGFuJywgaHRtbDogdGhpcy5vcHRpb25zLnRpdGxlLCBzdHlsZXM6IHdpblRpdGxlU3R5bGVzIH0pXHJcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZUJ1dHRvbnMoKVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tb3ZhYmxlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVCdXR0b25zKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbkJ1dHRvbkdyb3VwID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZy1sZWZ0JzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHtcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnaW5saW5lLWJsb2NrJyxcclxuICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAnNXB4JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnd2lkdGgnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdoZWlnaHQnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtc2l6ZSc6ICdjb3ZlcicsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXJlcGVhdCc6ICduby1yZXBlYXQnLFxyXG4gICAgICAgICAgICAnb3BhY2l0eSc6IC43LFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yQnV0dG9uLFxyXG4gICAgICAgICAgICAnb3V0bGluZSc6IDBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idXR0b25zID0ge31cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pbmltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWluaW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1pbmltaXplID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5taW5pbWl6ZSwgKCkgPT4gdGhpcy5taW5pbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1heGltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWF4aW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSwgKCkgPT4gdGhpcy5tYXhpbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ2xvc2VCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLmNsb3NlID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5jbG9zZSwgKCkgPT4gdGhpcy5jbG9zZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5idXR0b25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5idXR0b25zW2tleV1cclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDAuN1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2J1dHRvbicsIGh0bWw6ICcmbmJzcCcsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdib3R0b20nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3JpZ2h0JzogJzRweCcsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdzZS1yZXNpemUnLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc2l6ZSxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTVweCcsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTBweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgZG93biA9IChlKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIGV2ZW50LnBhZ2VYLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gZXZlbnQucGFnZVlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXN0YXJ0JylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBkb3duKVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZG93bilcclxuICAgIH1cclxuXHJcbiAgICBfbW92ZShlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2lzVG91Y2hFdmVudChlKSAmJiBlLndoaWNoICE9PSAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3ZpbmcgJiYgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdmVkID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYIC0gdGhpcy5fbW92aW5nLngsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgLSB0aGlzLl9tb3ZpbmcueVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtb3ZlJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fcmVzaXppbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYICsgdGhpcy5fcmVzaXppbmcud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgKyB0aGlzLl9yZXNpemluZy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3VwKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5fbW92aW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vdmVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICB9XHJcblxyXG4gICAgX2xpc3RlbmVycygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BNb3ZlKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLWVuZCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSB0aGlzLl9yZXNpemluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1lbmQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIF9pc1RvdWNoRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuVG91Y2hFdmVudCAmJiAoZSBpbnN0YW5jZW9mIHdpbmRvdy5Ub3VjaEV2ZW50KVxyXG4gICAgfVxyXG5cclxuICAgIF9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVG91Y2hFdmVudChlKSA/IGUuY2hhbmdlZFRvdWNoZXNbMF0gOiBlXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHooKSB7IHJldHVybiBwYXJzZUludCh0aGlzLndpbi5zdHlsZS56SW5kZXgpIH1cclxuICAgIHNldCB6KHZhbHVlKSB7IHRoaXMud2luLnN0eWxlLnpJbmRleCA9IHZhbHVlIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3ciXX0=