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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwiY2xvc2VkIiwiY2xvc2UiLCJvcGVuIiwid2luZG93IiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwicGFyZW50Iiwic3R5bGVzIiwiYm9yZGVyUmFkaXVzIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJzaGFkb3ciLCJiYWNrZ3JvdW5kQ29sb3JXaW5kb3ciLCJpc05hTiIsIndpbkJveCIsIl9jcmVhdGVUaXRsZWJhciIsImNvbnRlbnQiLCJ0eXBlIiwicmVzaXphYmxlIiwiX2NyZWF0ZVJlc2l6ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX2Rvd25UaXRsZWJhciIsInN0b3BQcm9wYWdhdGlvbiIsImV2ZW50IiwiX2NvbnZlcnRNb3ZlRXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZVN0eWxlcyIsImZvcmVncm91bmRDb2xvclRpdGxlIiwidGl0bGVDZW50ZXIiLCJ3aW5UaXRsZSIsInRpdGxlIiwiX2NyZWF0ZUJ1dHRvbnMiLCJtb3ZhYmxlIiwid2luQnV0dG9uR3JvdXAiLCJidXR0b24iLCJmb3JlZ3JvdW5kQ29sb3JCdXR0b24iLCJiYWNrZ3JvdW5kTWluaW1pemVCdXR0b24iLCJjbG9zYWJsZSIsImJhY2tncm91bmRDbG9zZUJ1dHRvbiIsImtleSIsIm9wYWNpdHkiLCJyZXNpemVFZGdlIiwiYmFja2dyb3VuZFJlc2l6ZSIsImRvd24iLCJwcmV2ZW50RGVmYXVsdCIsIl9pc1RvdWNoRXZlbnQiLCJ3aGljaCIsIl9zdG9wTW92ZSIsIl9zdG9wUmVzaXplIiwicmVzaXplIiwiVG91Y2hFdmVudCIsImNoYW5nZWRUb3VjaGVzIiwidmFsdWUiLCJfdGl0bGUiLCJpbm5lclRleHQiLCJwYXJzZUludCIsInpJbmRleCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLElBQU1BLFNBQVNDLFFBQVEsZUFBUixDQUFmO0FBQ0EsSUFBTUMsVUFBVUQsUUFBUSxTQUFSLENBQWhCO0FBQ0EsSUFBTUUsT0FBT0YsUUFBUSxVQUFSLENBQWI7QUFDQSxJQUFNRyxTQUFTSCxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNSSxPQUFPSixRQUFRLFFBQVIsQ0FBYjs7QUFFQSxJQUFJSyxLQUFLLENBQVQ7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBc0JNQyxNOzs7QUFFRjs7OztBQUlBLG9CQUFZQyxFQUFaLEVBQWdCQyxPQUFoQixFQUNBO0FBQUE7O0FBQUE7O0FBRUksY0FBS0QsRUFBTCxHQUFVQSxFQUFWOztBQUVBLGNBQUtDLE9BQUwsR0FBZUEsV0FBVyxFQUExQjs7QUFFQSxjQUFLSCxFQUFMLEdBQVVGLE9BQU8sTUFBS0ssT0FBTCxDQUFhSCxFQUFwQixJQUEwQixNQUFLRyxPQUFMLENBQWFILEVBQXZDLEdBQTRDQSxJQUF0RDs7QUFFQSxjQUFLSSxhQUFMO0FBQ0EsY0FBS0MsVUFBTDs7QUFFQSxjQUFLQyxNQUFMLEdBQWMsS0FBZDtBQUNBLGNBQUtDLFNBQUwsR0FBaUIsS0FBakI7QUFDQSxjQUFLQyxTQUFMLEdBQWlCLEtBQWpCOztBQUVBLGNBQUtDLE9BQUwsR0FBZSxJQUFmO0FBQ0EsY0FBS0MsUUFBTCxHQUFnQixJQUFoQjtBQUNBLGNBQUtDLE9BQUwsR0FBZSxJQUFmO0FBQ0EsY0FBS0MsU0FBTCxHQUFpQixJQUFqQjs7QUFFQSxjQUFLQyxJQUFMLEdBQVksSUFBSWhCLElBQUosQ0FBUyxFQUFFaUIsVUFBVSxNQUFLWCxPQUFMLENBQWFZLFdBQXpCLEVBQXNDRixNQUFNLE1BQUtWLE9BQUwsQ0FBYVUsSUFBekQsRUFBVCxDQUFaO0FBcEJKO0FBcUJDOztBQUVEOzs7Ozs7Ozs7NkJBS0tHLE8sRUFBU0MsUyxFQUNkO0FBQ0ksZ0JBQUksS0FBS1IsT0FBVCxFQUNBO0FBQ0kscUJBQUtTLElBQUwsQ0FBVSxNQUFWLEVBQWtCLElBQWxCO0FBQ0EscUJBQUtDLEdBQUwsQ0FBU0MsS0FBVCxDQUFlQyxPQUFmLEdBQXlCLE9BQXpCO0FBQ0Esb0JBQUksQ0FBQ0osU0FBTCxFQUNBO0FBQ0kseUJBQUtFLEdBQUwsQ0FBU0MsS0FBVCxDQUFlRSxTQUFmLEdBQTJCLFVBQTNCO0FBQ0EseUJBQUtULElBQUwsQ0FBVVUsR0FBVixDQUFjLEtBQUtKLEdBQW5CLEVBQXdCLEVBQUVLLE9BQU8sQ0FBVCxFQUF4QjtBQUNILGlCQUpELE1BTUE7QUFDSSx5QkFBS0wsR0FBTCxDQUFTQyxLQUFULENBQWVFLFNBQWYsR0FBMkIsRUFBM0I7QUFDSDtBQUNELHFCQUFLYixPQUFMLEdBQWUsS0FBZjtBQUNBLG9CQUFJLENBQUNPLE9BQUwsRUFDQTtBQUNJLHlCQUFLUyxLQUFMO0FBQ0g7QUFDSjtBQUNKOztBQUVEOzs7Ozs7Z0NBSUE7QUFDSSxnQkFBSSxLQUFLdkIsRUFBTCxDQUFRd0IsV0FBUixDQUFvQixJQUFwQixDQUFKLEVBQ0E7QUFDSSxvQkFBSSxLQUFLbEIsU0FBVCxFQUNBO0FBQ0kseUJBQUttQixRQUFMO0FBQ0g7QUFDRCxxQkFBS3JCLE1BQUwsR0FBYyxJQUFkO0FBQ0EscUJBQUtzQixXQUFMLENBQWlCUixLQUFqQixDQUF1QlMsZUFBdkIsR0FBeUMsS0FBSzFCLE9BQUwsQ0FBYTJCLDZCQUF0RDtBQUNBLHFCQUFLWixJQUFMLENBQVUsT0FBVixFQUFtQixJQUFuQjtBQUNIO0FBQ0o7O0FBRUQ7Ozs7OzsrQkFJQTtBQUNJLGdCQUFJLEtBQUtoQixFQUFMLENBQVE2QixLQUFSLEtBQWtCLElBQXRCLEVBQ0E7QUFDSSxxQkFBS3pCLE1BQUwsR0FBYyxLQUFkO0FBQ0EscUJBQUtzQixXQUFMLENBQWlCUixLQUFqQixDQUF1QlMsZUFBdkIsR0FBeUMsS0FBSzFCLE9BQUwsQ0FBYTZCLCtCQUF0RDtBQUNBLHFCQUFLZCxJQUFMLENBQVUsTUFBVixFQUFrQixJQUFsQjtBQUNIO0FBQ0o7O0FBRUQ7Ozs7Ozs4QkFHTUQsUyxFQUNOO0FBQUE7O0FBQ0ksZ0JBQUksQ0FBQyxLQUFLUixPQUFWLEVBQ0E7QUFDSSxxQkFBS0EsT0FBTCxHQUFlLElBQWY7QUFDQSxvQkFBSVEsU0FBSixFQUNBO0FBQ0kseUJBQUtFLEdBQUwsQ0FBU0MsS0FBVCxDQUFlRSxTQUFmLEdBQTJCLFVBQTNCO0FBQ0EseUJBQUtILEdBQUwsQ0FBU0MsS0FBVCxDQUFlQyxPQUFmLEdBQXlCLE1BQXpCO0FBQ0gsaUJBSkQsTUFNQTtBQUNJLHdCQUFNUixPQUFPLEtBQUtBLElBQUwsQ0FBVVUsR0FBVixDQUFjLEtBQUtKLEdBQW5CLEVBQXdCLEVBQUVLLE9BQU8sQ0FBVCxFQUF4QixDQUFiO0FBQ0FYLHlCQUFLb0IsRUFBTCxDQUFRLFVBQVIsRUFBb0IsWUFDcEI7QUFDSSwrQkFBS2QsR0FBTCxDQUFTQyxLQUFULENBQWVDLE9BQWYsR0FBeUIsTUFBekI7QUFDQSwrQkFBS0gsSUFBTCxDQUFVLE9BQVYsRUFBbUIsTUFBbkI7QUFDSCxxQkFKRDtBQUtIO0FBQ0o7QUFDSjs7QUFFRDs7Ozs7Ozs7OztBQWtGQTs7Ozs7K0JBS09nQixLLEVBQU9DLE0sRUFDZDtBQUNJLGlCQUFLRCxLQUFMLEdBQWFBLEtBQWI7QUFDQSxpQkFBS0MsTUFBTCxHQUFjQSxNQUFkO0FBQ0g7O0FBRUQ7Ozs7Ozs7OzZCQUtLQyxDLEVBQUdDLEMsRUFDUjtBQUNJLGlCQUFLRCxDQUFMLEdBQVNBLENBQVQ7QUFDQSxpQkFBS0MsQ0FBTCxHQUFTQSxDQUFUO0FBQ0g7O0FBRUQ7Ozs7Ozs7aUNBSVNwQixTLEVBQ1Q7QUFBQTs7QUFDSSxnQkFBSSxLQUFLZixFQUFMLENBQVF3QixXQUFSLENBQW9CLElBQXBCLEtBQTZCLEtBQUt2QixPQUFMLENBQWFtQyxXQUExQyxJQUF5RCxDQUFDLEtBQUtDLGFBQW5FLEVBQ0E7QUFDSSxvQkFBSSxLQUFLL0IsU0FBVCxFQUNBO0FBQ0ksd0JBQUlTLFNBQUosRUFDQTtBQUNJLDZCQUFLRSxHQUFMLENBQVNDLEtBQVQsQ0FBZUUsU0FBZixHQUEyQixFQUEzQjtBQUNBLDRCQUFNYyxJQUFJLEtBQUs1QixTQUFMLENBQWU0QixDQUF6QjtBQUFBLDRCQUE0QkMsSUFBSSxLQUFLN0IsU0FBTCxDQUFlNkIsQ0FBL0M7QUFDQSw2QkFBSzdCLFNBQUwsR0FBaUIsS0FBakI7QUFDQSw2QkFBS2dDLElBQUwsQ0FBVUosQ0FBVixFQUFhQyxDQUFiO0FBQ0EsNkJBQUtuQixJQUFMLENBQVUsa0JBQVYsRUFBOEIsSUFBOUI7QUFDQSw2QkFBS3VCLE9BQUwsQ0FBYXJCLEtBQWIsQ0FBbUJDLE9BQW5CLEdBQTZCLE1BQTdCO0FBQ0gscUJBUkQsTUFVQTtBQUNJLDZCQUFLa0IsYUFBTCxHQUFxQixJQUFyQjtBQUNBLDRCQUFNMUIsT0FBTyxLQUFLQSxJQUFMLENBQVVVLEdBQVYsQ0FBYyxLQUFLSixHQUFuQixFQUF3QixFQUFFdUIsUUFBUSxDQUFWLEVBQWFDLFFBQVEsQ0FBckIsRUFBd0JDLE1BQU0sS0FBS3BDLFNBQUwsQ0FBZTRCLENBQTdDLEVBQWdEUyxLQUFLLEtBQUtyQyxTQUFMLENBQWU2QixDQUFwRSxFQUF4QixDQUFiO0FBQ0F4Qiw2QkFBS29CLEVBQUwsQ0FBUSxVQUFSLEVBQW9CLFlBQ3BCO0FBQ0ksZ0NBQU1HLElBQUksT0FBSzVCLFNBQUwsQ0FBZTRCLENBQXpCO0FBQUEsZ0NBQTRCQyxJQUFJLE9BQUs3QixTQUFMLENBQWU2QixDQUEvQztBQUNBLG1DQUFLN0IsU0FBTCxHQUFpQixLQUFqQjtBQUNBLG1DQUFLZ0MsSUFBTCxDQUFVSixDQUFWLEVBQWFDLENBQWI7QUFDQSxtQ0FBS25CLElBQUwsQ0FBVSxrQkFBVixFQUE4QixNQUE5QjtBQUNBLG1DQUFLcUIsYUFBTCxHQUFxQixLQUFyQjtBQUNBLG1DQUFLRSxPQUFMLENBQWFyQixLQUFiLENBQW1CQyxPQUFuQixHQUE2QixNQUE3QjtBQUNILHlCQVJEO0FBU0g7QUFDSixpQkF6QkQsTUEyQkE7QUFDSSx3QkFBTWUsS0FBSSxLQUFLQSxDQUFmO0FBQ0Esd0JBQU1DLEtBQUksS0FBS0EsQ0FBZjtBQUNBLHdCQUFNTyxPQUFPLEtBQUtFLGNBQUwsR0FBc0IsS0FBS0EsY0FBTCxDQUFvQkYsSUFBMUMsR0FBaUQsS0FBS1IsQ0FBbkU7QUFDQSx3QkFBTVMsTUFBTSxLQUFLQyxjQUFMLEdBQXNCLEtBQUtBLGNBQUwsQ0FBb0JELEdBQTFDLEdBQWdELEtBQUtSLENBQWpFO0FBQ0Esd0JBQU1VLFVBQVUsS0FBSzVDLE9BQUwsQ0FBYTZDLFlBQTdCO0FBQ0Esd0JBQU1OLFNBQVNLLFVBQVUsS0FBS2IsS0FBOUI7QUFDQSx3QkFBTVMsU0FBU0ksVUFBVSxLQUFLWixNQUE5QjtBQUNBLHdCQUFJbEIsU0FBSixFQUNBO0FBQ0ksNkJBQUtFLEdBQUwsQ0FBU0MsS0FBVCxDQUFlRSxTQUFmLEdBQTJCLHFCQUFxQm9CLE1BQXJCLEdBQThCLFdBQTlCLEdBQTRDQyxNQUE1QyxHQUFxRCxHQUFoRjtBQUNBLDZCQUFLeEIsR0FBTCxDQUFTQyxLQUFULENBQWV3QixJQUFmLEdBQXNCQSxPQUFPLElBQTdCO0FBQ0EsNkJBQUt6QixHQUFMLENBQVNDLEtBQVQsQ0FBZXlCLEdBQWYsR0FBcUJBLE1BQU0sSUFBM0I7QUFDQSw2QkFBS3JDLFNBQUwsR0FBaUIsRUFBRTRCLEtBQUYsRUFBS0MsS0FBTCxFQUFRSyxjQUFSLEVBQWdCQyxjQUFoQixFQUFqQjtBQUNBLDZCQUFLekIsSUFBTCxDQUFVLFVBQVYsRUFBc0IsSUFBdEI7QUFDQSw2QkFBS3VCLE9BQUwsQ0FBYXJCLEtBQWIsQ0FBbUJDLE9BQW5CLEdBQTZCLE9BQTdCO0FBQ0EsNkJBQUt5QixjQUFMLEdBQXNCLEVBQUVGLFVBQUYsRUFBUUMsUUFBUixFQUF0QjtBQUNILHFCQVRELE1BV0E7QUFDSSw2QkFBS04sYUFBTCxHQUFxQixJQUFyQjtBQUNBLDRCQUFNMUIsUUFBTyxLQUFLQSxJQUFMLENBQVVVLEdBQVYsQ0FBYyxLQUFLSixHQUFuQixFQUF3QixFQUFFeUIsVUFBRixFQUFRQyxRQUFSLEVBQWFILGNBQWIsRUFBcUJDLGNBQXJCLEVBQXhCLENBQWI7QUFDQTlCLDhCQUFLb0IsRUFBTCxDQUFRLFVBQVIsRUFBb0IsWUFDcEI7QUFDSSxtQ0FBS3pCLFNBQUwsR0FBaUIsRUFBRTRCLEtBQUYsRUFBS0MsS0FBTCxFQUFRSyxjQUFSLEVBQWdCQyxjQUFoQixFQUFqQjtBQUNBLG1DQUFLekIsSUFBTCxDQUFVLFVBQVYsRUFBc0IsTUFBdEI7QUFDQSxtQ0FBS3FCLGFBQUwsR0FBcUIsS0FBckI7QUFDQSxtQ0FBS0UsT0FBTCxDQUFhckIsS0FBYixDQUFtQkMsT0FBbkIsR0FBNkIsT0FBN0I7QUFDQSxtQ0FBS3lCLGNBQUwsR0FBc0IsRUFBRUYsVUFBRixFQUFRQyxRQUFSLEVBQXRCO0FBQ0EsbUNBQUtMLElBQUwsQ0FBVUksSUFBVixFQUFnQkMsR0FBaEI7QUFDSCx5QkFSRDtBQVNIO0FBQ0o7QUFDSjtBQUNKOztBQUVEOzs7Ozs7aUNBR1M1QixTLEVBQ1Q7QUFBQTs7QUFDSSxnQkFBSSxLQUFLZixFQUFMLENBQVF3QixXQUFSLENBQW9CLElBQXBCLEtBQTZCLEtBQUt2QixPQUFMLENBQWE4QyxXQUExQyxJQUF5RCxDQUFDLEtBQUtWLGFBQW5FLEVBQ0E7QUFDSSxvQkFBSSxLQUFLaEMsU0FBVCxFQUNBO0FBQ0ksd0JBQUlVLFNBQUosRUFDQTtBQUNJLDZCQUFLbUIsQ0FBTCxHQUFTLEtBQUs3QixTQUFMLENBQWU2QixDQUF4QjtBQUNBLDZCQUFLQyxDQUFMLEdBQVMsS0FBSzlCLFNBQUwsQ0FBZThCLENBQXhCO0FBQ0EsNkJBQUtILEtBQUwsR0FBYSxLQUFLM0IsU0FBTCxDQUFlMkIsS0FBNUI7QUFDQSw2QkFBS0MsTUFBTCxHQUFjLEtBQUs1QixTQUFMLENBQWU0QixNQUE3QjtBQUNBLDZCQUFLNUIsU0FBTCxHQUFpQixJQUFqQjtBQUNBLDZCQUFLVyxJQUFMLENBQVUsU0FBVixFQUFxQixJQUFyQjtBQUNILHFCQVJELE1BVUE7QUFDSSw2QkFBS3FCLGFBQUwsR0FBcUIsSUFBckI7QUFDQSw0QkFBTTFCLE9BQU8sS0FBS0EsSUFBTCxDQUFVVSxHQUFWLENBQWMsS0FBS0osR0FBbkIsRUFBd0IsRUFBRXlCLE1BQU0sS0FBS3JDLFNBQUwsQ0FBZTZCLENBQXZCLEVBQTBCUyxLQUFLLEtBQUt0QyxTQUFMLENBQWU4QixDQUE5QyxFQUFpREgsT0FBTyxLQUFLM0IsU0FBTCxDQUFlMkIsS0FBdkUsRUFBOEVDLFFBQVEsS0FBSzVCLFNBQUwsQ0FBZTRCLE1BQXJHLEVBQXhCLENBQWI7QUFDQXRCLDZCQUFLb0IsRUFBTCxDQUFRLFVBQVIsRUFBb0IsWUFDcEI7QUFDSSxtQ0FBS0csQ0FBTCxHQUFTLE9BQUs3QixTQUFMLENBQWU2QixDQUF4QjtBQUNBLG1DQUFLQyxDQUFMLEdBQVMsT0FBSzlCLFNBQUwsQ0FBZThCLENBQXhCO0FBQ0EsbUNBQUtILEtBQUwsR0FBYSxPQUFLM0IsU0FBTCxDQUFlMkIsS0FBNUI7QUFDQSxtQ0FBS0MsTUFBTCxHQUFjLE9BQUs1QixTQUFMLENBQWU0QixNQUE3QjtBQUNBLG1DQUFLNUIsU0FBTCxHQUFpQixJQUFqQjtBQUNBLG1DQUFLZ0MsYUFBTCxHQUFxQixLQUFyQjtBQUNBLG1DQUFLckIsSUFBTCxDQUFVLFNBQVYsRUFBcUIsTUFBckI7QUFDSCx5QkFURDtBQVVIO0FBQ0QseUJBQUtnQyxPQUFMLENBQWFDLFFBQWIsQ0FBc0IvQixLQUF0QixDQUE0QmdDLGVBQTVCLEdBQThDLEtBQUtqRCxPQUFMLENBQWFrRCx3QkFBM0Q7QUFDSCxpQkEzQkQsTUE2QkE7QUFDSSx3QkFBTWpCLElBQUksS0FBS0EsQ0FBZjtBQUFBLHdCQUFrQkMsSUFBSSxLQUFLQSxDQUEzQjtBQUFBLHdCQUE4QkgsUUFBUSxLQUFLZixHQUFMLENBQVNtQyxXQUEvQztBQUFBLHdCQUE0RG5CLFNBQVMsS0FBS2hCLEdBQUwsQ0FBU29DLFlBQTlFO0FBQ0Esd0JBQUl0QyxTQUFKLEVBQ0E7QUFDSSw2QkFBS1YsU0FBTCxHQUFpQixFQUFFNkIsSUFBRixFQUFLQyxJQUFMLEVBQVFILFlBQVIsRUFBZUMsY0FBZixFQUFqQjtBQUNBLDZCQUFLQyxDQUFMLEdBQVMsQ0FBVDtBQUNBLDZCQUFLQyxDQUFMLEdBQVMsQ0FBVDtBQUNBLDZCQUFLSCxLQUFMLEdBQWEsS0FBS2hDLEVBQUwsQ0FBUXVDLE9BQVIsQ0FBZ0JhLFdBQWhCLEdBQThCLElBQTNDO0FBQ0EsNkJBQUtuQixNQUFMLEdBQWMsS0FBS2pDLEVBQUwsQ0FBUXVDLE9BQVIsQ0FBZ0JjLFlBQWhCLEdBQStCLElBQTdDO0FBQ0EsNkJBQUtyQyxJQUFMLENBQVUsVUFBVixFQUFzQixJQUF0QjtBQUNILHFCQVJELE1BVUE7QUFDSSw2QkFBS3FCLGFBQUwsR0FBcUIsSUFBckI7QUFDQSw0QkFBTTFCLFNBQU8sS0FBS0EsSUFBTCxDQUFVVSxHQUFWLENBQWMsS0FBS0osR0FBbkIsRUFBd0IsRUFBRXlCLE1BQU0sQ0FBUixFQUFXQyxLQUFLLENBQWhCLEVBQW1CWCxPQUFPLEtBQUtoQyxFQUFMLENBQVF1QyxPQUFSLENBQWdCYSxXQUExQyxFQUF1RG5CLFFBQVEsS0FBS2pDLEVBQUwsQ0FBUXVDLE9BQVIsQ0FBZ0JjLFlBQS9FLEVBQXhCLENBQWI7QUFDQTFDLCtCQUFLb0IsRUFBTCxDQUFRLFVBQVIsRUFBb0IsWUFDcEI7QUFDSSxtQ0FBS0csQ0FBTCxHQUFTLENBQVQ7QUFDQSxtQ0FBS0MsQ0FBTCxHQUFTLENBQVQ7QUFDQSxtQ0FBS0gsS0FBTCxHQUFhLE9BQUtoQyxFQUFMLENBQVF1QyxPQUFSLENBQWdCYSxXQUFoQixHQUE4QixJQUEzQztBQUNBLG1DQUFLbkIsTUFBTCxHQUFjLE9BQUtqQyxFQUFMLENBQVF1QyxPQUFSLENBQWdCYyxZQUFoQixHQUErQixJQUE3QztBQUNBLG1DQUFLaEQsU0FBTCxHQUFpQixFQUFFNkIsSUFBRixFQUFLQyxJQUFMLEVBQVFILFlBQVIsRUFBZUMsY0FBZixFQUFqQjtBQUNBLG1DQUFLSSxhQUFMLEdBQXFCLEtBQXJCO0FBQ0gseUJBUkQ7QUFTQSw2QkFBS3JCLElBQUwsQ0FBVSxVQUFWLEVBQXNCLElBQXRCO0FBQ0g7QUFDRCx5QkFBS2dDLE9BQUwsQ0FBYUMsUUFBYixDQUFzQi9CLEtBQXRCLENBQTRCZ0MsZUFBNUIsR0FBOEMsS0FBS2pELE9BQUwsQ0FBYXFELHVCQUEzRDtBQUNIO0FBQ0o7QUFDSjs7QUFFRDs7Ozs7O3FDQUlBO0FBQ0ksaUJBQUt0RCxFQUFMLENBQVF1RCxVQUFSLENBQW1CLElBQW5CO0FBQ0g7O0FBRUQ7Ozs7OztzQ0FJQTtBQUNJLGlCQUFLdkQsRUFBTCxDQUFRd0QsV0FBUixDQUFvQixJQUFwQjtBQUNIOztBQUVEOzs7Ozs7OytCQUtBO0FBQ0ksZ0JBQU1DLE9BQU8sRUFBYjtBQUNBLGdCQUFNcEQsWUFBWSxLQUFLQSxTQUF2QjtBQUNBLGdCQUFJQSxTQUFKLEVBQ0E7QUFDSW9ELHFCQUFLcEQsU0FBTCxHQUFpQixFQUFFcUMsTUFBTXJDLFVBQVVxQyxJQUFsQixFQUF3QkMsS0FBS3RDLFVBQVVzQyxHQUF2QyxFQUE0Q1gsT0FBTzNCLFVBQVUyQixLQUE3RCxFQUFvRUMsUUFBUTVCLFVBQVU0QixNQUF0RixFQUFqQjtBQUNIO0FBQ0QsZ0JBQU0zQixZQUFZLEtBQUtBLFNBQXZCO0FBQ0EsZ0JBQUlBLFNBQUosRUFDQTtBQUNJbUQscUJBQUtuRCxTQUFMLEdBQWlCLEVBQUU0QixHQUFHLEtBQUs1QixTQUFMLENBQWU0QixDQUFwQixFQUF1QkMsR0FBRyxLQUFLN0IsU0FBTCxDQUFlNkIsQ0FBekMsRUFBNENLLFFBQVEsS0FBS2xDLFNBQUwsQ0FBZWtDLE1BQW5FLEVBQTJFQyxRQUFRLEtBQUtuQyxTQUFMLENBQWVtQyxNQUFsRyxFQUFqQjtBQUNIO0FBQ0QsZ0JBQU1pQixnQkFBZ0IsS0FBS2QsY0FBM0I7QUFDQSxnQkFBSWMsYUFBSixFQUNBO0FBQ0lELHFCQUFLQyxhQUFMLEdBQXFCLEVBQUVoQixNQUFNZ0IsY0FBY2hCLElBQXRCLEVBQTRCQyxLQUFLZSxjQUFjZixHQUEvQyxFQUFyQjtBQUNIO0FBQ0RjLGlCQUFLdkIsQ0FBTCxHQUFTLEtBQUtBLENBQWQ7QUFDQXVCLGlCQUFLdEIsQ0FBTCxHQUFTLEtBQUtBLENBQWQ7QUFDQSxnQkFBSXZDLE9BQU8sS0FBS0ssT0FBTCxDQUFhK0IsS0FBcEIsQ0FBSixFQUNBO0FBQ0l5QixxQkFBS3pCLEtBQUwsR0FBYSxLQUFLL0IsT0FBTCxDQUFhK0IsS0FBMUI7QUFDSDtBQUNELGdCQUFJcEMsT0FBTyxLQUFLSyxPQUFMLENBQWFnQyxNQUFwQixDQUFKLEVBQ0E7QUFDSXdCLHFCQUFLeEIsTUFBTCxHQUFjLEtBQUtoQyxPQUFMLENBQWFnQyxNQUEzQjtBQUNIO0FBQ0R3QixpQkFBS0UsTUFBTCxHQUFjLEtBQUtwRCxPQUFuQjtBQUNBLG1CQUFPa0QsSUFBUDtBQUNIOztBQUVEOzs7Ozs7OzZCQUlLQSxJLEVBQ0w7QUFDSSxnQkFBSUEsS0FBS3BELFNBQVQsRUFDQTtBQUNJLG9CQUFJLENBQUMsS0FBS0EsU0FBVixFQUNBO0FBQ0kseUJBQUs0QyxRQUFMLENBQWMsSUFBZDtBQUNIO0FBQ0osYUFORCxNQU9LLElBQUksS0FBSzVDLFNBQVQsRUFDTDtBQUNJLHFCQUFLNEMsUUFBTCxDQUFjLElBQWQ7QUFDSDtBQUNELGdCQUFJUSxLQUFLbkQsU0FBVCxFQUNBO0FBQ0ksb0JBQUksQ0FBQyxLQUFLQSxTQUFWLEVBQ0E7QUFDSSx5QkFBS21CLFFBQUwsQ0FBYyxJQUFkO0FBQ0g7QUFDRCxxQkFBS25CLFNBQUwsR0FBaUJtRCxLQUFLbkQsU0FBdEI7QUFDSCxhQVBELE1BUUssSUFBSSxLQUFLQSxTQUFULEVBQ0w7QUFDSSxxQkFBS21CLFFBQUwsQ0FBYyxJQUFkO0FBQ0g7QUFDRCxnQkFBSWdDLEtBQUtDLGFBQVQsRUFDQTtBQUNJLHFCQUFLZCxjQUFMLEdBQXNCYSxLQUFLQyxhQUEzQjtBQUNIO0FBQ0QsaUJBQUt4QixDQUFMLEdBQVN1QixLQUFLdkIsQ0FBZDtBQUNBLGlCQUFLQyxDQUFMLEdBQVNzQixLQUFLdEIsQ0FBZDtBQUNBLGdCQUFJdkMsT0FBTzZELEtBQUt6QixLQUFaLENBQUosRUFDQTtBQUNJLHFCQUFLQSxLQUFMLEdBQWF5QixLQUFLekIsS0FBbEI7QUFDSCxhQUhELE1BS0E7QUFDSSxxQkFBS2YsR0FBTCxDQUFTQyxLQUFULENBQWVjLEtBQWYsR0FBdUIsTUFBdkI7QUFDSDtBQUNELGdCQUFJcEMsT0FBTzZELEtBQUt4QixNQUFaLENBQUosRUFDQTtBQUNJLHFCQUFLQSxNQUFMLEdBQWN3QixLQUFLeEIsTUFBbkI7QUFDSCxhQUhELE1BS0E7QUFDSSxxQkFBS2hCLEdBQUwsQ0FBU0MsS0FBVCxDQUFlZSxNQUFmLEdBQXdCLE1BQXhCO0FBQ0g7QUFDRCxnQkFBSXdCLEtBQUtFLE1BQVQsRUFDQTtBQUNJLHFCQUFLQyxLQUFMLENBQVcsSUFBWDtBQUNILGFBSEQsTUFJSyxJQUFJLEtBQUtELE1BQVQsRUFDTDtBQUNJLHFCQUFLRSxJQUFMLENBQVUsSUFBVixFQUFnQixJQUFoQjtBQUNIO0FBQ0o7O0FBRUQ7Ozs7Ozs7OztBQWdDQTs7OzsrQkFJTzVDLEcsRUFDUDtBQUNJLGdCQUFJQSxHQUFKLEVBQ0E7QUFDSSxxQkFBS3FCLElBQUwsQ0FDSXJCLElBQUlpQixDQUFKLEdBQVFqQixJQUFJZSxLQUFKLEdBQVksQ0FBcEIsR0FBd0IsS0FBS0EsS0FBTCxHQUFhLENBRHpDLEVBRUlmLElBQUlrQixDQUFKLEdBQVFsQixJQUFJZ0IsTUFBSixHQUFhLENBQXJCLEdBQXlCLEtBQUtBLE1BQUwsR0FBYyxDQUYzQztBQUlILGFBTkQsTUFRQTtBQUNJLHFCQUFLSyxJQUFMLENBQ0l3QixPQUFPQyxVQUFQLEdBQW9CLENBQXBCLEdBQXdCLEtBQUsvQixLQUFMLEdBQWEsQ0FEekMsRUFFSThCLE9BQU9FLFdBQVAsR0FBcUIsQ0FBckIsR0FBeUIsS0FBSy9CLE1BQUwsR0FBYyxDQUYzQztBQUlIO0FBQ0o7O0FBRUQ7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7OztBQUtBOzs7OztBQUtBOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7Ozs7QUFNQTs7Ozs7O0FBTUE7Ozs7OztBQU1BOzs7Ozs7QUFPQTs7Ozs7Ozs7d0NBT0E7QUFBQTs7QUFDSTs7Ozs7QUFLQSxpQkFBS2hCLEdBQUwsR0FBV3BCLEtBQUs7QUFDWm9FLHdCQUFTLEtBQUtqRSxFQUFMLEdBQVUsS0FBS0EsRUFBTCxDQUFRaUIsR0FBbEIsR0FBd0IsSUFEckIsRUFDNEJpRCxRQUFRO0FBQzVDLCtCQUFXLE1BRGlDO0FBRTVDLHFDQUFpQixLQUFLakUsT0FBTCxDQUFha0UsWUFGYztBQUc1QyxtQ0FBZSxNQUg2QjtBQUk1QyxnQ0FBWSxRQUpnQztBQUs1QyxnQ0FBWSxVQUxnQztBQU01QyxpQ0FBYSxLQUFLbEUsT0FBTCxDQUFhbUUsUUFOa0I7QUFPNUMsa0NBQWMsS0FBS25FLE9BQUwsQ0FBYW9FLFNBUGlCO0FBUTVDLGtDQUFjLEtBQUtwRSxPQUFMLENBQWFxRSxNQVJpQjtBQVM1Qyx3Q0FBb0IsS0FBS3JFLE9BQUwsQ0FBYXNFLHFCQVRXO0FBVTVDLDRCQUFRLEtBQUt0RSxPQUFMLENBQWFpQyxDQUFiLEdBQWlCLElBVm1CO0FBVzVDLDJCQUFPLEtBQUtqQyxPQUFMLENBQWFrQyxDQUFiLEdBQWlCLElBWG9CO0FBWTVDLDZCQUFTcUMsTUFBTSxLQUFLdkUsT0FBTCxDQUFhK0IsS0FBbkIsSUFBNEIsS0FBSy9CLE9BQUwsQ0FBYStCLEtBQXpDLEdBQWlELEtBQUsvQixPQUFMLENBQWErQixLQUFiLEdBQXFCLElBWm5DO0FBYTVDLDhCQUFVd0MsTUFBTSxLQUFLdkUsT0FBTCxDQUFhZ0MsTUFBbkIsSUFBNkIsS0FBS2hDLE9BQUwsQ0FBYWdDLE1BQTFDLEdBQW1ELEtBQUtoQyxPQUFMLENBQWFnQyxNQUFiLEdBQXNCO0FBYnZDO0FBRHBDLGFBQUwsQ0FBWDs7QUFrQkEsaUJBQUt3QyxNQUFMLEdBQWM1RSxLQUFLO0FBQ2ZvRSx3QkFBUSxLQUFLaEQsR0FERSxFQUNHaUQsUUFBUTtBQUN0QiwrQkFBVyxNQURXO0FBRXRCLHNDQUFrQixRQUZJO0FBR3RCLDZCQUFTLE1BSGE7QUFJdEIsOEJBQVUsTUFKWTtBQUt0QixrQ0FBYyxLQUFLakUsT0FBTCxDQUFhb0U7QUFMTDtBQURYLGFBQUwsQ0FBZDtBQVNBLGlCQUFLSyxlQUFMOztBQUVBOzs7OztBQUtBLGlCQUFLQyxPQUFMLEdBQWU5RSxLQUFLO0FBQ2hCb0Usd0JBQVEsS0FBS1EsTUFERyxFQUNLRyxNQUFNLFNBRFgsRUFDc0JWLFFBQVE7QUFDMUMsK0JBQVcsT0FEK0I7QUFFMUMsNEJBQVEsQ0FGa0M7QUFHMUMsa0NBQWMsS0FBS0csU0FIdUI7QUFJMUMsa0NBQWMsUUFKNEI7QUFLMUMsa0NBQWM7QUFMNEI7QUFEOUIsYUFBTCxDQUFmOztBQVVBLGdCQUFJLEtBQUtwRSxPQUFMLENBQWE0RSxTQUFqQixFQUNBO0FBQ0kscUJBQUtDLGFBQUw7QUFDSDs7QUFFRCxpQkFBS3ZDLE9BQUwsR0FBZTFDLEtBQUs7QUFDaEJvRSx3QkFBUSxLQUFLaEQsR0FERyxFQUNFaUQsUUFBUTtBQUN0QiwrQkFBVyxNQURXO0FBRXRCLGdDQUFZLFVBRlU7QUFHdEIsNEJBQVEsQ0FIYztBQUl0QiwyQkFBTyxDQUplO0FBS3RCLDZCQUFTLE1BTGE7QUFNdEIsOEJBQVU7QUFOWTtBQURWLGFBQUwsQ0FBZjtBQVVBLGlCQUFLM0IsT0FBTCxDQUFhd0MsZ0JBQWIsQ0FBOEIsV0FBOUIsRUFBMkMsVUFBQ0MsQ0FBRCxFQUFPO0FBQUUsdUJBQUtDLGFBQUwsQ0FBbUJELENBQW5CLEVBQXVCQSxFQUFFRSxlQUFGO0FBQXFCLGFBQWhHO0FBQ0EsaUJBQUszQyxPQUFMLENBQWF3QyxnQkFBYixDQUE4QixZQUE5QixFQUE0QyxVQUFDQyxDQUFELEVBQU87QUFBRSx1QkFBS0MsYUFBTCxDQUFtQkQsQ0FBbkIsRUFBdUJBLEVBQUVFLGVBQUY7QUFBcUIsYUFBakc7QUFDSDs7O3NDQUVhRixDLEVBQ2Q7QUFDSSxnQkFBSSxDQUFDLEtBQUszQyxhQUFWLEVBQ0E7QUFDSSxvQkFBTThDLFFBQVEsS0FBS0MsaUJBQUwsQ0FBdUJKLENBQXZCLENBQWQ7QUFDQSxxQkFBS3ZFLE9BQUwsR0FBZTtBQUNYeUIsdUJBQUdpRCxNQUFNRSxLQUFOLEdBQWMsS0FBS25ELENBRFg7QUFFWEMsdUJBQUdnRCxNQUFNRyxLQUFOLEdBQWMsS0FBS25EO0FBRlgsaUJBQWY7QUFJQSxxQkFBS25CLElBQUwsQ0FBVSxZQUFWLEVBQXdCLElBQXhCO0FBQ0EscUJBQUt1RSxNQUFMLEdBQWMsS0FBZDtBQUNIO0FBQ0o7OzswQ0FHRDtBQUFBO0FBQUE7O0FBQ0ksaUJBQUs3RCxXQUFMLEdBQW1CN0IsS0FBSztBQUNwQm9FLHdCQUFRLEtBQUtRLE1BRE8sRUFDQ0csTUFBTSxRQURQLEVBQ2lCVixRQUFRO0FBQ3pDLG1DQUFlLE1BRDBCO0FBRXpDLCtCQUFXLE1BRjhCO0FBR3pDLHNDQUFrQixLQUh1QjtBQUl6QyxtQ0FBZSxRQUowQjtBQUt6Qyx1Q0FBbUIsUUFMc0I7QUFNekMsOEJBQVUsS0FBS2pFLE9BQUwsQ0FBYXVGLGNBTmtCO0FBT3pDLGtDQUFjLEtBQUt2RixPQUFMLENBQWF1RixjQVBjO0FBUXpDLDhCQUFVLENBUitCO0FBU3pDLCtCQUFXLE9BVDhCO0FBVXpDLGdDQUFZO0FBVjZCO0FBRHpCLGFBQUwsQ0FBbkI7QUFjQSxnQkFBTUM7QUFDRiwrQkFBZSxNQURiO0FBRUYsd0JBQVEsQ0FGTjtBQUdGLDJCQUFXLE1BSFQ7QUFJRixrQ0FBa0IsS0FKaEI7QUFLRiwrQkFBZTtBQUxiLCtEQU1hLE1BTmIsb0NBT0YsUUFQRSxFQU9RLFNBUFIsb0NBUUYsU0FSRSxFQVFTLENBUlQsb0NBU0YsUUFURSxFQVNRLENBVFIsb0NBVUYsV0FWRSxFQVVXLE1BVlgsb0NBV0YsYUFYRSxFQVdhLEdBWGIsb0NBWUYsT0FaRSxFQVlPLEtBQUt4RixPQUFMLENBQWF5RixvQkFacEIsbUJBQU47QUFjQSxnQkFBSSxLQUFLekYsT0FBTCxDQUFhMEYsV0FBakIsRUFDQTtBQUNJRiwrQkFBZSxpQkFBZixJQUFvQyxRQUFwQztBQUNILGFBSEQsTUFLQTtBQUNJQSwrQkFBZSxjQUFmLElBQWlDLEtBQWpDO0FBRUg7QUFDRCxpQkFBS0csUUFBTCxHQUFnQi9GLEtBQUssRUFBRW9FLFFBQVEsS0FBS3ZDLFdBQWYsRUFBNEJrRCxNQUFNLE1BQWxDLEVBQTBDL0UsTUFBTSxLQUFLSSxPQUFMLENBQWE0RixLQUE3RCxFQUFvRTNCLFFBQVF1QixjQUE1RSxFQUFMLENBQWhCO0FBQ0EsaUJBQUtLLGNBQUw7O0FBRUEsZ0JBQUksS0FBSzdGLE9BQUwsQ0FBYThGLE9BQWpCLEVBQ0E7QUFDSSxxQkFBS3JFLFdBQUwsQ0FBaUJxRCxnQkFBakIsQ0FBa0MsV0FBbEMsRUFBK0MsVUFBQ0MsQ0FBRDtBQUFBLDJCQUFPLE9BQUtDLGFBQUwsQ0FBbUJELENBQW5CLENBQVA7QUFBQSxpQkFBL0M7QUFDQSxxQkFBS3RELFdBQUwsQ0FBaUJxRCxnQkFBakIsQ0FBa0MsWUFBbEMsRUFBZ0QsVUFBQ0MsQ0FBRDtBQUFBLDJCQUFPLE9BQUtDLGFBQUwsQ0FBbUJELENBQW5CLENBQVA7QUFBQSxpQkFBaEQ7QUFDSDtBQUNKOzs7eUNBR0Q7QUFBQTs7QUFDSSxpQkFBS2dCLGNBQUwsR0FBc0JuRyxLQUFLO0FBQ3ZCb0Usd0JBQVEsS0FBS3ZDLFdBRFUsRUFDR3dDLFFBQVE7QUFDOUIsK0JBQVcsTUFEbUI7QUFFOUIsc0NBQWtCLEtBRlk7QUFHOUIsbUNBQWUsUUFIZTtBQUk5QixvQ0FBZ0I7QUFKYztBQURYLGFBQUwsQ0FBdEI7QUFRQSxnQkFBTStCLFNBQVM7QUFDWCwyQkFBVyxjQURBO0FBRVgsMEJBQVUsQ0FGQztBQUdYLDBCQUFVLENBSEM7QUFJWCwrQkFBZSxLQUpKO0FBS1gsMkJBQVcsQ0FMQTtBQU1YLHlCQUFTLE1BTkU7QUFPWCwwQkFBVSxNQVBDO0FBUVgsb0NBQW9CLGFBUlQ7QUFTWCxtQ0FBbUIsT0FUUjtBQVVYLHFDQUFxQixXQVZWO0FBV1gsMkJBQVcsRUFYQTtBQVlYLHlCQUFTLEtBQUtoRyxPQUFMLENBQWFpRyxxQkFaWDtBQWFYLDJCQUFXO0FBYkEsYUFBZjtBQWVBLGlCQUFLbEQsT0FBTCxHQUFlLEVBQWY7QUFDQSxnQkFBSSxLQUFLL0MsT0FBTCxDQUFhbUMsV0FBakIsRUFDQTtBQUNJNkQsdUJBQU8vQyxlQUFQLEdBQXlCLEtBQUtqRCxPQUFMLENBQWFrRyx3QkFBdEM7QUFDQSxxQkFBS25ELE9BQUwsQ0FBYXZCLFFBQWIsR0FBd0I1QixLQUFLLEVBQUVvRSxRQUFRLEtBQUsrQixjQUFmLEVBQStCbkcsTUFBTSxRQUFyQyxFQUErQytFLE1BQU0sUUFBckQsRUFBK0RWLFFBQVErQixNQUF2RSxFQUFMLENBQXhCO0FBQ0F2Ryx3QkFBUSxLQUFLc0QsT0FBTCxDQUFhdkIsUUFBckIsRUFBK0I7QUFBQSwyQkFBTSxPQUFLQSxRQUFMLEVBQU47QUFBQSxpQkFBL0I7QUFDSDtBQUNELGdCQUFJLEtBQUt4QixPQUFMLENBQWE4QyxXQUFqQixFQUNBO0FBQ0lrRCx1QkFBTy9DLGVBQVAsR0FBeUIsS0FBS2pELE9BQUwsQ0FBYWtELHdCQUF0QztBQUNBLHFCQUFLSCxPQUFMLENBQWFDLFFBQWIsR0FBd0JwRCxLQUFLLEVBQUVvRSxRQUFRLEtBQUsrQixjQUFmLEVBQStCbkcsTUFBTSxRQUFyQyxFQUErQytFLE1BQU0sUUFBckQsRUFBK0RWLFFBQVErQixNQUF2RSxFQUFMLENBQXhCO0FBQ0F2Ryx3QkFBUSxLQUFLc0QsT0FBTCxDQUFhQyxRQUFyQixFQUErQjtBQUFBLDJCQUFNLE9BQUtBLFFBQUwsRUFBTjtBQUFBLGlCQUEvQjtBQUNIO0FBQ0QsZ0JBQUksS0FBS2hELE9BQUwsQ0FBYW1HLFFBQWpCLEVBQ0E7QUFDSUgsdUJBQU8vQyxlQUFQLEdBQXlCLEtBQUtqRCxPQUFMLENBQWFvRyxxQkFBdEM7QUFDQSxxQkFBS3JELE9BQUwsQ0FBYVksS0FBYixHQUFxQi9ELEtBQUssRUFBRW9FLFFBQVEsS0FBSytCLGNBQWYsRUFBK0JuRyxNQUFNLFFBQXJDLEVBQStDK0UsTUFBTSxRQUFyRCxFQUErRFYsUUFBUStCLE1BQXZFLEVBQUwsQ0FBckI7QUFDQXZHLHdCQUFRLEtBQUtzRCxPQUFMLENBQWFZLEtBQXJCLEVBQTRCO0FBQUEsMkJBQU0sT0FBS0EsS0FBTCxFQUFOO0FBQUEsaUJBQTVCO0FBQ0g7O0FBMUNMLHVDQTJDYTBDLEdBM0NiO0FBNkNRLG9CQUFNTCxTQUFTLE9BQUtqRCxPQUFMLENBQWFzRCxHQUFiLENBQWY7QUFDQUwsdUJBQU9sQixnQkFBUCxDQUF3QixXQUF4QixFQUFxQyxZQUNyQztBQUNJa0IsMkJBQU8vRSxLQUFQLENBQWFxRixPQUFiLEdBQXVCLENBQXZCO0FBQ0gsaUJBSEQ7QUFJQU4sdUJBQU9sQixnQkFBUCxDQUF3QixVQUF4QixFQUFvQyxZQUNwQztBQUNJa0IsMkJBQU8vRSxLQUFQLENBQWFxRixPQUFiLEdBQXVCLEdBQXZCO0FBQ0gsaUJBSEQ7QUFsRFI7O0FBMkNJLGlCQUFLLElBQUlELEdBQVQsSUFBZ0IsS0FBS3RELE9BQXJCLEVBQ0E7QUFBQSxzQkFEU3NELEdBQ1Q7QUFVQztBQUNKOzs7d0NBR0Q7QUFBQTs7QUFDSSxpQkFBS0UsVUFBTCxHQUFrQjNHLEtBQUs7QUFDbkJvRSx3QkFBUSxLQUFLUSxNQURNLEVBQ0VHLE1BQU0sUUFEUixFQUNrQi9FLE1BQU0sT0FEeEIsRUFDaUNxRSxRQUFRO0FBQ3hELGdDQUFZLFVBRDRDO0FBRXhELDhCQUFVLENBRjhDO0FBR3hELDZCQUFTLEtBSCtDO0FBSXhELDhCQUFVLENBSjhDO0FBS3hELDhCQUFVLENBTDhDO0FBTXhELCtCQUFXLENBTjZDO0FBT3hELDhCQUFVLFdBUDhDO0FBUXhELG1DQUFlLE1BUnlDO0FBU3hELGtDQUFjLEtBQUtqRSxPQUFMLENBQWF3RyxnQkFUNkI7QUFVeEQsOEJBQVUsTUFWOEM7QUFXeEQsNkJBQVM7QUFYK0M7QUFEekMsYUFBTCxDQUFsQjtBQWVBLGdCQUFNQyxPQUFPLFNBQVBBLElBQU8sQ0FBQzFCLENBQUQsRUFDYjtBQUNJLG9CQUFJLE9BQUtoRixFQUFMLENBQVF3QixXQUFSLENBQW9CLE1BQXBCLENBQUosRUFDQTtBQUNJLHdCQUFNMkQsUUFBUSxPQUFLQyxpQkFBTCxDQUF1QkosQ0FBdkIsQ0FBZDtBQUNBLHdCQUFNaEQsUUFBUSxPQUFLQSxLQUFMLElBQWMsT0FBS2YsR0FBTCxDQUFTbUMsV0FBckM7QUFDQSx3QkFBTW5CLFNBQVMsT0FBS0EsTUFBTCxJQUFlLE9BQUtoQixHQUFMLENBQVNvQyxZQUF2QztBQUNBLDJCQUFLM0MsU0FBTCxHQUFpQjtBQUNic0IsK0JBQU9BLFFBQVFtRCxNQUFNRSxLQURSO0FBRWJwRCxnQ0FBUUEsU0FBU2tELE1BQU1HO0FBRlYscUJBQWpCO0FBSUEsMkJBQUt0RSxJQUFMLENBQVUsY0FBVjtBQUNBZ0Usc0JBQUUyQixjQUFGO0FBQ0g7QUFDSixhQWREO0FBZUEsaUJBQUtILFVBQUwsQ0FBZ0J6QixnQkFBaEIsQ0FBaUMsV0FBakMsRUFBOEMyQixJQUE5QztBQUNBLGlCQUFLRixVQUFMLENBQWdCekIsZ0JBQWhCLENBQWlDLFlBQWpDLEVBQStDMkIsSUFBL0M7QUFDSDs7OzhCQUVLMUIsQyxFQUNOO0FBQ0ksZ0JBQUksS0FBS2hGLEVBQUwsQ0FBUXdCLFdBQVIsQ0FBb0IsSUFBcEIsQ0FBSixFQUNBO0FBQ0ksb0JBQU0yRCxRQUFRLEtBQUtDLGlCQUFMLENBQXVCSixDQUF2QixDQUFkOztBQUVBLG9CQUFJLENBQUMsS0FBSzRCLGFBQUwsQ0FBbUI1QixDQUFuQixDQUFELElBQTBCQSxFQUFFNkIsS0FBRixLQUFZLENBQTFDLEVBQ0E7QUFDSSx5QkFBS3BHLE9BQUwsSUFBZ0IsS0FBS3FHLFNBQUwsRUFBaEI7QUFDQSx5QkFBS3BHLFNBQUwsSUFBa0IsS0FBS3FHLFdBQUwsRUFBbEI7QUFDSDtBQUNELG9CQUFJLEtBQUt0RyxPQUFULEVBQ0E7QUFDSSx3QkFBSSxLQUFLSCxTQUFULEVBQ0E7QUFDSSw2QkFBS2lGLE1BQUwsR0FBYyxJQUFkO0FBQ0g7QUFDRCx5QkFBS2pELElBQUwsQ0FDSTZDLE1BQU1FLEtBQU4sR0FBYyxLQUFLNUUsT0FBTCxDQUFheUIsQ0FEL0IsRUFFSWlELE1BQU1HLEtBQU4sR0FBYyxLQUFLN0UsT0FBTCxDQUFhMEIsQ0FGL0I7QUFJQSx5QkFBS25CLElBQUwsQ0FBVSxNQUFWLEVBQWtCLElBQWxCO0FBQ0FnRSxzQkFBRTJCLGNBQUY7QUFDSDs7QUFFRCxvQkFBSSxLQUFLakcsU0FBVCxFQUNBO0FBQ0kseUJBQUtzRyxNQUFMLENBQ0k3QixNQUFNRSxLQUFOLEdBQWMsS0FBSzNFLFNBQUwsQ0FBZXNCLEtBRGpDLEVBRUltRCxNQUFNRyxLQUFOLEdBQWMsS0FBSzVFLFNBQUwsQ0FBZXVCLE1BRmpDO0FBSUEseUJBQUs1QixTQUFMLEdBQWlCLElBQWpCO0FBQ0EseUJBQUtXLElBQUwsQ0FBVSxRQUFWLEVBQW9CLElBQXBCO0FBQ0FnRSxzQkFBRTJCLGNBQUY7QUFDSDtBQUNKO0FBQ0o7Ozs4QkFHRDtBQUNJLGdCQUFJLEtBQUtsRyxPQUFULEVBQ0E7QUFDSSxvQkFBSSxLQUFLSCxTQUFULEVBQ0E7QUFDSSx3QkFBSSxDQUFDLEtBQUtpRixNQUFWLEVBQ0E7QUFDSSw2QkFBSzlELFFBQUw7QUFDSDtBQUNKO0FBQ0QscUJBQUtxRixTQUFMO0FBQ0g7QUFDRCxpQkFBS3BHLFNBQUwsSUFBa0IsS0FBS3FHLFdBQUwsRUFBbEI7QUFDSDs7O3FDQUdEO0FBQUE7O0FBQ0ksaUJBQUs5RixHQUFMLENBQVM4RCxnQkFBVCxDQUEwQixXQUExQixFQUF1QztBQUFBLHVCQUFNLE9BQUt4RCxLQUFMLEVBQU47QUFBQSxhQUF2QztBQUNBLGlCQUFLTixHQUFMLENBQVM4RCxnQkFBVCxDQUEwQixZQUExQixFQUF3QztBQUFBLHVCQUFNLE9BQUt4RCxLQUFMLEVBQU47QUFBQSxhQUF4QztBQUNIOzs7b0NBR0Q7QUFDSSxpQkFBS2QsT0FBTCxHQUFlLElBQWY7QUFDQSxpQkFBS08sSUFBTCxDQUFVLFVBQVYsRUFBc0IsSUFBdEI7QUFDSDs7O3NDQUdEO0FBQ0ksaUJBQUtSLFFBQUwsR0FBZ0IsS0FBS0UsU0FBTCxHQUFpQixJQUFqQztBQUNBLGlCQUFLTSxJQUFMLENBQVUsWUFBVixFQUF3QixJQUF4QjtBQUNIOzs7c0NBRWFnRSxDLEVBQ2Q7QUFDSSxtQkFBTyxDQUFDLENBQUNsQixPQUFPbUQsVUFBVCxJQUF3QmpDLGFBQWFsQixPQUFPbUQsVUFBbkQ7QUFDSDs7OzBDQUVpQmpDLEMsRUFDbEI7QUFDSSxtQkFBTyxLQUFLNEIsYUFBTCxDQUFtQjVCLENBQW5CLElBQXdCQSxFQUFFa0MsY0FBRixDQUFpQixDQUFqQixDQUF4QixHQUE4Q2xDLENBQXJEO0FBQ0g7Ozs0QkEzeUJEO0FBQ0ksbUJBQU8sS0FBS3pFLE9BQVo7QUFDSDs7QUFFRDs7Ozs7Ozs0QkFJUTtBQUFFLG1CQUFPLEtBQUtOLE9BQUwsQ0FBYWlDLENBQXBCO0FBQXVCLFM7MEJBQzNCaUYsSyxFQUNOO0FBQ0ksaUJBQUtsSCxPQUFMLENBQWFpQyxDQUFiLEdBQWlCaUYsS0FBakI7QUFDQSxpQkFBS2xHLEdBQUwsQ0FBU0MsS0FBVCxDQUFld0IsSUFBZixHQUFzQnlFLFFBQVEsSUFBOUI7QUFDQSxpQkFBS25HLElBQUwsQ0FBVSxRQUFWLEVBQW9CLElBQXBCO0FBQ0EsZ0JBQUksS0FBS1YsU0FBVCxFQUNBO0FBQ0kscUJBQUtzQyxjQUFMLENBQW9CRixJQUFwQixHQUEyQnlFLEtBQTNCO0FBQ0g7QUFDSjs7QUFFRDs7Ozs7Ozs0QkFJUTtBQUFFLG1CQUFPLEtBQUtsSCxPQUFMLENBQWFrQyxDQUFwQjtBQUF1QixTOzBCQUMzQmdGLEssRUFDTjtBQUNJLGlCQUFLbEgsT0FBTCxDQUFha0MsQ0FBYixHQUFpQmdGLEtBQWpCO0FBQ0EsaUJBQUtsRyxHQUFMLENBQVNDLEtBQVQsQ0FBZXlCLEdBQWYsR0FBcUJ3RSxRQUFRLElBQTdCO0FBQ0EsaUJBQUtuRyxJQUFMLENBQVUsUUFBVixFQUFvQixJQUFwQjtBQUNBLGdCQUFJLEtBQUtWLFNBQVQsRUFDQTtBQUNJLHFCQUFLc0MsY0FBTCxDQUFvQkQsR0FBcEIsR0FBMEJ3RSxLQUExQjtBQUNIO0FBQ0o7O0FBRUQ7Ozs7Ozs7NEJBSVk7QUFBRSxtQkFBTyxLQUFLbEgsT0FBTCxDQUFhK0IsS0FBYixJQUFzQixLQUFLZixHQUFMLENBQVNtQyxXQUF0QztBQUFtRCxTOzBCQUN2RCtELEssRUFDVjtBQUNJLGdCQUFJQSxLQUFKLEVBQ0E7QUFDSSxxQkFBS2xHLEdBQUwsQ0FBU0MsS0FBVCxDQUFlYyxLQUFmLEdBQXVCbUYsUUFBUSxJQUEvQjtBQUNBLHFCQUFLbEgsT0FBTCxDQUFhK0IsS0FBYixHQUFxQixLQUFLZixHQUFMLENBQVNtQyxXQUE5QjtBQUNILGFBSkQsTUFNQTtBQUNJLHFCQUFLbkMsR0FBTCxDQUFTQyxLQUFULENBQWVjLEtBQWYsR0FBdUIsTUFBdkI7QUFDQSxxQkFBSy9CLE9BQUwsQ0FBYStCLEtBQWIsR0FBcUIsRUFBckI7QUFDSDtBQUNELGlCQUFLaEIsSUFBTCxDQUFVLGNBQVYsRUFBMEIsSUFBMUI7QUFDSDs7QUFFRDs7Ozs7Ozs0QkFJYTtBQUFFLG1CQUFPLEtBQUtmLE9BQUwsQ0FBYWdDLE1BQWIsSUFBdUIsS0FBS2hCLEdBQUwsQ0FBU29DLFlBQXZDO0FBQXFELFM7MEJBQ3pEOEQsSyxFQUNYO0FBQ0ksZ0JBQUlBLEtBQUosRUFDQTtBQUNJLHFCQUFLbEcsR0FBTCxDQUFTQyxLQUFULENBQWVlLE1BQWYsR0FBd0JrRixRQUFRLElBQWhDO0FBQ0EscUJBQUtsSCxPQUFMLENBQWFnQyxNQUFiLEdBQXNCLEtBQUtoQixHQUFMLENBQVNvQyxZQUEvQjtBQUNILGFBSkQsTUFNQTtBQUNJLHFCQUFLcEMsR0FBTCxDQUFTQyxLQUFULENBQWVlLE1BQWYsR0FBd0IsTUFBeEI7QUFDQSxxQkFBS2hDLE9BQUwsQ0FBYWdDLE1BQWIsR0FBc0IsRUFBdEI7QUFDSDtBQUNELGlCQUFLakIsSUFBTCxDQUFVLGVBQVYsRUFBMkIsSUFBM0I7QUFDSDs7OzRCQXVSVztBQUFFLG1CQUFPLEtBQUtvRyxNQUFaO0FBQW9CLFM7MEJBQ3hCRCxLLEVBQ1Y7QUFDSSxpQkFBS3ZCLFFBQUwsQ0FBY3lCLFNBQWQsR0FBMEJGLEtBQTFCO0FBQ0EsaUJBQUtuRyxJQUFMLENBQVUsY0FBVixFQUEwQixJQUExQjtBQUNIOztBQUdEOzs7Ozs7OzRCQUlZO0FBQUUsbUJBQU8sS0FBS2tCLENBQUwsR0FBUyxLQUFLRixLQUFyQjtBQUE0QixTOzBCQUNoQ21GLEssRUFDVjtBQUNJLGlCQUFLakYsQ0FBTCxHQUFTaUYsUUFBUSxLQUFLbkYsS0FBdEI7QUFDSDs7QUFFRDs7Ozs7Ozs0QkFJYTtBQUFFLG1CQUFPLEtBQUtHLENBQUwsR0FBUyxLQUFLRixNQUFyQjtBQUE2QixTOzBCQUNqQ2tGLEssRUFDWDtBQUNJLGlCQUFLaEYsQ0FBTCxHQUFTZ0YsUUFBUSxLQUFLbEYsTUFBdEI7QUFDSDs7OzRCQWtiTztBQUFFLG1CQUFPcUYsU0FBUyxLQUFLckcsR0FBTCxDQUFTQyxLQUFULENBQWVxRyxNQUF4QixDQUFQO0FBQXdDLFM7MEJBQzVDSixLLEVBQU87QUFBRSxpQkFBS2xHLEdBQUwsQ0FBU0MsS0FBVCxDQUFlcUcsTUFBZixHQUF3QkosS0FBeEI7QUFBK0I7Ozs7RUFyNkI3QjNILE07O0FBdzZCckJnSSxPQUFPQyxPQUFQLEdBQWlCMUgsTUFBakIiLCJmaWxlIjoid2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgRXZlbnRzID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMycpXHJcbmNvbnN0IGNsaWNrZWQgPSByZXF1aXJlKCdjbGlja2VkJylcclxuY29uc3QgRWFzZSA9IHJlcXVpcmUoJ2RvbS1lYXNlJylcclxuY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5cclxubGV0IGlkID0gMFxyXG5cclxuLyoqXHJcbiAqIFdpbmRvdyBjbGFzcyByZXR1cm5lZCBieSBXaW5kb3dNYW5hZ2VyLmNyZWF0ZVdpbmRvdygpXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAZmlyZXMgb3BlblxyXG4gKiBAZmlyZXMgZm9jdXNcclxuICogQGZpcmVzIGJsdXJcclxuICogQGZpcmVzIGNsb3NlXHJcbiAqIEBmaXJlcyBtYXhpbWl6ZVxyXG4gKiBAZmlyZXMgbWF4aW1pemUtcmVzdG9yZVxyXG4gKiBAZmlyZXMgbWluaW1pemVcclxuICogQGZpcmVzIG1pbmltaXplLXJlc3RvcmVcclxuICogQGZpcmVzIG1vdmVcclxuICogQGZpcmVzIG1vdmUtc3RhcnRcclxuICogQGZpcmVzIG1vdmUtZW5kXHJcbiAqIEBmaXJlcyByZXNpemVcclxuICogQGZpcmVzIHJlc2l6ZS1zdGFydFxyXG4gKiBAZmlyZXMgcmVzaXplLWVuZFxyXG4gKiBAZmlyZXMgbW92ZS14XHJcbiAqIEBmaXJlcyBtb3ZlLXlcclxuICogQGZpcmVzIHJlc2l6ZS13aWR0aFxyXG4gKiBAZmlyZXMgcmVzaXplLWhlaWdodFxyXG4gKi9cclxuY2xhc3MgV2luZG93IGV4dGVuZHMgRXZlbnRzXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtXaW5kb3dNYW5hZ2VyfSBbd21dXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHdtLCBvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKClcclxuICAgICAgICB0aGlzLndtID0gd21cclxuXHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fVxyXG5cclxuICAgICAgICB0aGlzLmlkID0gZXhpc3RzKHRoaXMub3B0aW9ucy5pZCkgPyB0aGlzLm9wdGlvbnMuaWQgOiBpZCsrXHJcblxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVdpbmRvdygpXHJcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJzKClcclxuXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMubWF4aW1pemVkID0gZmFsc2VcclxuICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcblxyXG4gICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICB0aGlzLl9yZXN0b3JlID0gbnVsbFxyXG4gICAgICAgIHRoaXMuX21vdmluZyA9IG51bGxcclxuICAgICAgICB0aGlzLl9yZXNpemluZyA9IG51bGxcclxuXHJcbiAgICAgICAgdGhpcy5lYXNlID0gbmV3IEVhc2UoeyBkdXJhdGlvbjogdGhpcy5vcHRpb25zLmFuaW1hdGVUaW1lLCBlYXNlOiB0aGlzLm9wdGlvbnMuZWFzZSB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogb3BlbiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtub0ZvY3VzXSBkbyBub3QgZm9jdXMgd2luZG93IHdoZW4gb3BlbmVkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtub0FuaW1hdGVdIGRvIG5vdCBhbmltYXRlIHdpbmRvdyB3aGVuIG9wZW5lZFxyXG4gICAgICovXHJcbiAgICBvcGVuKG5vRm9jdXMsIG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5fY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdvcGVuJywgdGhpcylcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgaWYgKCFub0FuaW1hdGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgwKSdcclxuICAgICAgICAgICAgICAgIHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDEgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICcnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gZmFsc2VcclxuICAgICAgICAgICAgaWYgKCFub0ZvY3VzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZvY3VzKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGZvY3VzIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgZm9jdXMoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWVcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJBY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdmb2N1cycsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYmx1ciB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGJsdXIoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLm1vZGFsICE9PSB0aGlzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckluYWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnYmx1cicsIHRoaXMpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xvc2VzIHRoZSB3aW5kb3cgKGNhbiBiZSByZW9wZW5lZCB3aXRoIG9wZW4pXHJcbiAgICAgKi9cclxuICAgIGNsb3NlKG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAoIXRoaXMuX2Nsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDApJ1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDAgfSlcclxuICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdjbG9zZScsIHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGlzIHdpbmRvdyBjbG9zZWQ/XHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqIEByZWFkb25seVxyXG4gICAgICovXHJcbiAgICBnZXQgY2xvc2VkKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fY2xvc2VkXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBsZWZ0IGNvb3JkaW5hdGVcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB4KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLnggfVxyXG4gICAgc2V0IHgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnggPSB2YWx1ZVxyXG4gICAgICAgIHRoaXMud2luLnN0eWxlLmxlZnQgPSB2YWx1ZSArICdweCdcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUteCcsIHRoaXMpXHJcbiAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZC5sZWZ0ID0gdmFsdWVcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0b3AgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHkoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueSB9XHJcbiAgICBzZXQgeSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueSA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLXknLCB0aGlzKVxyXG4gICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQudG9wID0gdmFsdWVcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB3aWR0aCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB3aWR0aCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aCB9XHJcbiAgICBzZXQgd2lkdGgodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSB2YWx1ZSArICdweCdcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUud2lkdGggPSAnYXV0bydcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndpZHRoID0gJydcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtd2lkdGgnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaGVpZ2h0IG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IGhlaWdodCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0IH1cclxuICAgIHNldCBoZWlnaHQodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5oZWlnaHQgPSAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1oZWlnaHQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVzaXplIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodFxyXG4gICAgICovXHJcbiAgICByZXNpemUod2lkdGgsIGhlaWdodClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGhcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbW92ZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geVxyXG4gICAgICovXHJcbiAgICBtb3ZlKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy54ID0geFxyXG4gICAgICAgIHRoaXMueSA9IHlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1pbmltaXplIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBub0FuaW1hdGVcclxuICAgICAqL1xyXG4gICAgbWluaW1pemUobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMubWluaW1pemVkLngsIHkgPSB0aGlzLm1pbmltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZSh4LCB5KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUtcmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGVYOiAxLCBzY2FsZVk6IDEsIGxlZnQ6IHRoaXMubWluaW1pemVkLngsIHRvcDogdGhpcy5taW5pbWl6ZWQueSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLm1pbmltaXplZC54LCB5ID0gdGhpcy5taW5pbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZSh4LCB5KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy54XHJcbiAgICAgICAgICAgICAgICBjb25zdCB5ID0gdGhpcy55XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsZWZ0ID0gdGhpcy5fbGFzdE1pbmltaXplZCA/IHRoaXMuX2xhc3RNaW5pbWl6ZWQubGVmdCA6IHRoaXMueFxyXG4gICAgICAgICAgICAgICAgY29uc3QgdG9wID0gdGhpcy5fbGFzdE1pbmltaXplZCA/IHRoaXMuX2xhc3RNaW5pbWl6ZWQudG9wIDogdGhpcy55XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZXNpcmVkID0gdGhpcy5vcHRpb25zLm1pbmltaXplU2l6ZVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbGVYID0gZGVzaXJlZCAvIHRoaXMud2lkdGhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlWSA9IGRlc2lyZWQgLyB0aGlzLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMSkgc2NhbGVYKCcgKyBzY2FsZVggKyAnKSBzY2FsZVkoJyArIHNjYWxlWSArICcpJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IHRvcCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IHsgeCwgeSwgc2NhbGVYLCBzY2FsZVkgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSB7IGxlZnQsIHRvcCB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQsIHRvcCwgc2NhbGVYLCBzY2FsZVkgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IHsgeCwgeSwgc2NhbGVYLCBzY2FsZVkgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSB7IGxlZnQsIHRvcCB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZShsZWZ0LCB0b3ApXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1heGltaXplIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgbWF4aW1pemUobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpICYmIHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSAmJiAhdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IHRoaXMubWF4aW1pemVkLnhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSB0aGlzLm1heGltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMubWF4aW1pemVkLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLm1heGltaXplZC5oZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiB0aGlzLm1heGltaXplZC54LCB0b3A6IHRoaXMubWF4aW1pemVkLnksIHdpZHRoOiB0aGlzLm1heGltaXplZC53aWR0aCwgaGVpZ2h0OiB0aGlzLm1heGltaXplZC5oZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSB0aGlzLm1heGltaXplZC54XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IHRoaXMubWF4aW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMubWF4aW1pemVkLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRNYXhpbWl6ZUJ1dHRvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgd2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aCwgaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0geyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGggKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0SGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWF4aW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0OiAwLCB0b3A6IDAsIHdpZHRoOiB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGgsIGhlaWdodDogdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0geyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWF4aW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZHMgd2luZG93IHRvIGJhY2sgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvQmFjaygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53bS5zZW5kVG9CYWNrKHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBmcm9udCBvZiB3aW5kb3ctbWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzZW5kVG9Gcm9udCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53bS5zZW5kVG9Gcm9udCh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2F2ZSB0aGUgc3RhdGUgb2YgdGhlIHdpbmRvd1xyXG4gICAgICogQHJldHVybiB7b2JqZWN0fSBkYXRhXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7fVxyXG4gICAgICAgIGNvbnN0IG1heGltaXplZCA9IHRoaXMubWF4aW1pemVkXHJcbiAgICAgICAgaWYgKG1heGltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubWF4aW1pemVkID0geyBsZWZ0OiBtYXhpbWl6ZWQubGVmdCwgdG9wOiBtYXhpbWl6ZWQudG9wLCB3aWR0aDogbWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IG1heGltaXplZC5oZWlnaHQgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBtaW5pbWl6ZWQgPSB0aGlzLm1pbmltaXplZFxyXG4gICAgICAgIGlmIChtaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1pbmltaXplZCA9IHsgeDogdGhpcy5taW5pbWl6ZWQueCwgeTogdGhpcy5taW5pbWl6ZWQueSwgc2NhbGVYOiB0aGlzLm1pbmltaXplZC5zY2FsZVgsIHNjYWxlWTogdGhpcy5taW5pbWl6ZWQuc2NhbGVZIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbGFzdE1pbmltaXplZCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWRcclxuICAgICAgICBpZiAobGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubGFzdE1pbmltaXplZCA9IHsgbGVmdDogbGFzdE1pbmltaXplZC5sZWZ0LCB0b3A6IGxhc3RNaW5pbWl6ZWQudG9wIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS54ID0gdGhpcy54XHJcbiAgICAgICAgZGF0YS55ID0gdGhpcy55XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMud2lkdGgpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS53aWR0aCA9IHRoaXMub3B0aW9ucy53aWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXhpc3RzKHRoaXMub3B0aW9ucy5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5oZWlnaHQgPSB0aGlzLm9wdGlvbnMuaGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEuY2xvc2VkID0gdGhpcy5fY2xvc2VkXHJcbiAgICAgICAgcmV0dXJuIGRhdGFcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJldHVybiB0aGUgc3RhdGUgb2YgdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgZnJvbSBzYXZlKClcclxuICAgICAqL1xyXG4gICAgbG9hZChkYXRhKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChkYXRhLm1heGltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5tYXhpbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemUodHJ1ZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLm1heGltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubWF4aW1pemUodHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZGF0YS5taW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1pbmltaXplKHRydWUpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkYXRhLmxhc3RNaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0gZGF0YS5sYXN0TWluaW1pemVkXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMueCA9IGRhdGEueFxyXG4gICAgICAgIHRoaXMueSA9IGRhdGEueVxyXG4gICAgICAgIGlmIChleGlzdHMoZGF0YS53aWR0aCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpZHRoID0gZGF0YS53aWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZXhpc3RzKGRhdGEuaGVpZ2h0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gZGF0YS5oZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuaGVpZ2h0ID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkYXRhLmNsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UodHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9wZW4odHJ1ZSwgdHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGFuZ2UgdGl0bGVcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldCB0aXRsZSgpIHsgcmV0dXJuIHRoaXMuX3RpdGxlIH1cclxuICAgIHNldCB0aXRsZSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlLmlubmVyVGV4dCA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy5lbWl0KCd0aXRsZS1jaGFuZ2UnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJpZ2h0IGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgcmlnaHQoKSB7IHJldHVybiB0aGlzLnggKyB0aGlzLndpZHRoIH1cclxuICAgIHNldCByaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB2YWx1ZSAtIHRoaXMud2lkdGhcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGJvdHRvbSBjb29yZGluYXRlIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IGJvdHRvbSgpIHsgcmV0dXJuIHRoaXMueSArIHRoaXMuaGVpZ2h0IH1cclxuICAgIHNldCBib3R0b20odmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy55ID0gdmFsdWUgLSB0aGlzLmhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2VudGVycyB3aW5kb3cgaW4gbWlkZGxlIG9mIG90aGVyIHdpbmRvdyBvciBkb2N1bWVudC5ib2R5XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gW3dpbl1cclxuICAgICAqL1xyXG4gICAgY2VudGVyKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAod2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgd2luLnggKyB3aW4ud2lkdGggLyAyIC0gdGhpcy53aWR0aCAvIDIsXHJcbiAgICAgICAgICAgICAgICB3aW4ueSArIHdpbi5oZWlnaHQgLyAyIC0gdGhpcy5oZWlnaHQgLyAyXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgd2luZG93LmlubmVyV2lkdGggLyAyIC0gdGhpcy53aWR0aCAvIDIsXHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuaW5uZXJIZWlnaHQgLyAyIC0gdGhpcy5oZWlnaHQgLyAyXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIHJlc3RvcmVkIHRvIG5vcm1hbCBhZnRlciBiZWluZyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemUtcmVzdG9yZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1pbmltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtaW5pbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBvcGVuc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNvcGVuXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBnYWlucyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNmb2N1c1xyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBsb3NlcyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNibHVyXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGNsb3Nlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNjbG9zZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiByZXNpemUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgcmVzaXplIGNvbXBsZXRlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgcmVzaXppbmdcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIG1vdmUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtc3RhcnRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGFmdGVyIG1vdmUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgbW92ZVxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpZHRoIGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXdpZHRoXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIGhlaWdodCBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1oZWlnaHRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4geCBwb3NpdGlvbiBvZiB3aW5kb3cgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXhcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHkgcG9zaXRpb24gb2Ygd2luZG93IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS15XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgX2NyZWF0ZVdpbmRvdygpXHJcbiAgICB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgdG9wLWxldmVsIERPTSBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqIEByZWFkb25seVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMud2luID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogKHRoaXMud20gPyB0aGlzLndtLndpbiA6IG51bGwpLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci1yYWRpdXMnOiB0aGlzLm9wdGlvbnMuYm9yZGVyUmFkaXVzLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi13aWR0aCc6IHRoaXMub3B0aW9ucy5taW5XaWR0aCxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5vcHRpb25zLm1pbkhlaWdodCxcclxuICAgICAgICAgICAgICAgICdib3gtc2hhZG93JzogdGhpcy5vcHRpb25zLnNoYWRvdyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvcldpbmRvdyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogdGhpcy5vcHRpb25zLnggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IHRoaXMub3B0aW9ucy55ICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IGlzTmFOKHRoaXMub3B0aW9ucy53aWR0aCkgPyB0aGlzLm9wdGlvbnMud2lkdGggOiB0aGlzLm9wdGlvbnMud2lkdGggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IGlzTmFOKHRoaXMub3B0aW9ucy5oZWlnaHQpID8gdGhpcy5vcHRpb25zLmhlaWdodCA6IHRoaXMub3B0aW9ucy5oZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLndpbkJveCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ2NvbHVtbicsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVRpdGxlYmFyKClcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgY29udGVudCBET00gZWxlbWVudC4gVXNlIHRoaXMgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIFdpbmRvdy5cclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdzZWN0aW9uJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdibG9jaycsXHJcbiAgICAgICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXgnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdy15JzogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlc2l6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm92ZXJsYXkgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IDAsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7IHRoaXMuX2Rvd25UaXRsZWJhcihlKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgX2Rvd25UaXRsZWJhcihlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmluZyA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gdGhpcy54LFxyXG4gICAgICAgICAgICAgICAgeTogZXZlbnQucGFnZVkgLSB0aGlzLnlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUtc3RhcnQnLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVUaXRsZWJhcigpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5UaXRsZWJhciA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnaGVhZGVyJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnanVzdGlmeS1jb250ZW50JzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogJzAgOHB4JyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCB3aW5UaXRsZVN0eWxlcyA9IHtcclxuICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgJ2N1cnNvcic6ICdkZWZhdWx0JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6ICcxNnB4JyxcclxuICAgICAgICAgICAgJ2ZvbnQtd2VpZ2h0JzogNDAwLFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yVGl0bGVcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50aXRsZUNlbnRlcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpblRpdGxlU3R5bGVzWydqdXN0aWZ5LWNvbnRlbnQnXSA9ICdjZW50ZXInXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpblRpdGxlU3R5bGVzWydwYWRkaW5nLWxlZnQnXSA9ICc4cHgnXHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpblRpdGxlID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgdHlwZTogJ3NwYW4nLCBodG1sOiB0aGlzLm9wdGlvbnMudGl0bGUsIHN0eWxlczogd2luVGl0bGVTdHlsZXMgfSlcclxuICAgICAgICB0aGlzLl9jcmVhdGVCdXR0b25zKClcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tb3ZhYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlQnV0dG9ucygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5CdXR0b25Hcm91cCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICcxMHB4J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBidXR0b24gPSB7XHJcbiAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogJzVweCcsXHJcbiAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgJ3dpZHRoJzogJzEycHgnLFxyXG4gICAgICAgICAgICAnaGVpZ2h0JzogJzEycHgnLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXNpemUnOiAnY292ZXInLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1yZXBlYXQnOiAnbm8tcmVwZWF0JyxcclxuICAgICAgICAgICAgJ29wYWNpdHknOiAuNyxcclxuICAgICAgICAgICAgJ2NvbG9yJzogdGhpcy5vcHRpb25zLmZvcmVncm91bmRDb2xvckJ1dHRvbixcclxuICAgICAgICAgICAgJ291dGxpbmUnOiAwXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnV0dG9ucyA9IHt9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1pbmltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5taW5pbWl6ZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWluaW1pemUsICgpID0+IHRoaXMubWluaW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWF4aW1pemUsICgpID0+IHRoaXMubWF4aW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENsb3NlQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5jbG9zZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMuY2xvc2UsICgpID0+IHRoaXMuY2xvc2UoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuYnV0dG9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuYnV0dG9uc1trZXldXHJcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDFcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAwLjdcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5yZXNpemVFZGdlID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdidXR0b24nLCBodG1sOiAnJm5ic3AnLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnYm90dG9tJzogMCxcclxuICAgICAgICAgICAgICAgICdyaWdodCc6ICc0cHgnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnc2UtcmVzaXplJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXNpemUsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzE1cHgnLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGRvd24gPSAoZSkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemluZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggLSBldmVudC5wYWdlWCxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAtIGV2ZW50LnBhZ2VZXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1zdGFydCcpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZG93bilcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGRvd24pXHJcbiAgICB9XHJcblxyXG4gICAgX21vdmUoZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1RvdWNoRXZlbnQoZSkgJiYgZS53aGljaCAhPT0gMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW92aW5nICYmIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IHRydWVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCAtIHRoaXMuX21vdmluZy54LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZIC0gdGhpcy5fbW92aW5nLnlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3Jlc2l6aW5nKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCArIHRoaXMuX3Jlc2l6aW5nLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZICsgdGhpcy5fcmVzaXppbmcuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF91cCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3ZlZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9zdG9wTW92ZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgfVxyXG5cclxuICAgIF9saXN0ZW5lcnMoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMuZm9jdXMoKSlcclxuICAgICAgICB0aGlzLndpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgfVxyXG5cclxuICAgIF9zdG9wTW92ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS1lbmQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIF9zdG9wUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9yZXN0b3JlID0gdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtZW5kJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICBfaXNUb3VjaEV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICEhd2luZG93LlRvdWNoRXZlbnQgJiYgKGUgaW5zdGFuY2VvZiB3aW5kb3cuVG91Y2hFdmVudClcclxuICAgIH1cclxuXHJcbiAgICBfY29udmVydE1vdmVFdmVudChlKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pc1RvdWNoRXZlbnQoZSkgPyBlLmNoYW5nZWRUb3VjaGVzWzBdIDogZVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB6KCkgeyByZXR1cm4gcGFyc2VJbnQodGhpcy53aW4uc3R5bGUuekluZGV4KSB9XHJcbiAgICBzZXQgeih2YWx1ZSkgeyB0aGlzLndpbi5zdHlsZS56SW5kZXggPSB2YWx1ZSB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2luZG93Il19