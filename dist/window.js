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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwiY2xvc2VkIiwiY2xvc2UiLCJvcGVuIiwid2luZG93IiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwicGFyZW50Iiwic3R5bGVzIiwiYm9yZGVyUmFkaXVzIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJzaGFkb3ciLCJiYWNrZ3JvdW5kQ29sb3JXaW5kb3ciLCJpc05hTiIsIndpbkJveCIsIl9jcmVhdGVUaXRsZWJhciIsImNvbnRlbnQiLCJ0eXBlIiwicmVzaXphYmxlIiwiX2NyZWF0ZVJlc2l6ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX2Rvd25UaXRsZWJhciIsInN0b3BQcm9wYWdhdGlvbiIsImV2ZW50IiwiX2NvbnZlcnRNb3ZlRXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZVN0eWxlcyIsImZvcmVncm91bmRDb2xvclRpdGxlIiwidGl0bGVDZW50ZXIiLCJ3aW5UaXRsZSIsInRpdGxlIiwiX2NyZWF0ZUJ1dHRvbnMiLCJtb3ZhYmxlIiwid2luQnV0dG9uR3JvdXAiLCJidXR0b24iLCJmb3JlZ3JvdW5kQ29sb3JCdXR0b24iLCJiYWNrZ3JvdW5kTWluaW1pemVCdXR0b24iLCJjbG9zYWJsZSIsImJhY2tncm91bmRDbG9zZUJ1dHRvbiIsImtleSIsIm9wYWNpdHkiLCJyZXNpemVFZGdlIiwiYmFja2dyb3VuZFJlc2l6ZSIsImRvd24iLCJwcmV2ZW50RGVmYXVsdCIsIl9pc1RvdWNoRXZlbnQiLCJ3aGljaCIsIl9zdG9wTW92ZSIsIl9zdG9wUmVzaXplIiwicmVzaXplIiwiVG91Y2hFdmVudCIsImNoYW5nZWRUb3VjaGVzIiwidmFsdWUiLCJfdGl0bGUiLCJpbm5lclRleHQiLCJwYXJzZUludCIsInpJbmRleCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLElBQU1BLFNBQVNDLFFBQVEsZUFBUixDQUFmO0FBQ0EsSUFBTUMsVUFBVUQsUUFBUSxTQUFSLENBQWhCO0FBQ0EsSUFBTUUsT0FBT0YsUUFBUSxVQUFSLENBQWI7QUFDQSxJQUFNRyxTQUFTSCxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNSSxPQUFPSixRQUFRLFFB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LENBQWVxRyxNQUFmLEdBQXdCSixLQUF4QjtBQUErQjs7OztFQXI2QjdCM0gsTTs7QUF3NkJyQmdJLE9BQU9DLE9BQVAsR0FBaUIxSCxNQUFqQiIsImZpbGUiOiJ3aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBFdmVudHMgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJylcclxuY29uc3QgY2xpY2tlZCA9IHJlcXVpcmUoJ2NsaWNrZWQnKVxyXG5jb25zdCBFYXNlID0gcmVxdWlyZSgnZG9tLWVhc2UnKVxyXG5jb25zdCBleGlzdHMgPSByZXF1aXJlKCdleGlzdHMnKVxyXG5cclxuY29uc3QgaHRtbCA9IHJlcXVpcmUoJy4vaHRtbCcpXHJcblxyXG5sZXQgaWQgPSAwXHJcblxyXG4vKipcclxuICogV2luZG93IGNsYXNzIHJldHVybmVkIGJ5IFdpbmRvd01hbmFnZXIuY3JlYXRlV2luZG93KClcclxuICogQGV4dGVuZHMgRXZlbnRFbWl0dGVyXHJcbiAqIEBmaXJlcyBvcGVuXHJcbiAqIEBmaXJlcyBmb2N1c1xyXG4gKiBAZmlyZXMgYmx1clxyXG4gKiBAZmlyZXMgY2xvc2VcclxuICogQGZpcmVzIG1heGltaXplXHJcbiAqIEBmaXJlcyBtYXhpbWl6ZS1yZXN0b3JlXHJcbiAqIEBmaXJlcyBtaW5pbWl6ZVxyXG4gKiBAZmlyZXMgbWluaW1pemUtcmVzdG9yZVxyXG4gKiBAZmlyZXMgbW92ZVxyXG4gKiBAZmlyZXMgbW92ZS1zdGFydFxyXG4gKiBAZmlyZXMgbW92ZS1lbmRcclxuICogQGZpcmVzIHJlc2l6ZVxyXG4gKiBAZmlyZXMgcmVzaXplLXN0YXJ0XHJcbiAqIEBmaXJlcyByZXNpemUtZW5kXHJcbiAqIEBmaXJlcyBtb3ZlLXhcclxuICogQGZpcmVzIG1vdmUteVxyXG4gKiBAZmlyZXMgcmVzaXplLXdpZHRoXHJcbiAqIEBmaXJlcyByZXNpemUtaGVpZ2h0XHJcbiAqL1xyXG5jbGFzcyBXaW5kb3cgZXh0ZW5kcyBFdmVudHNcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd01hbmFnZXJ9IFt3bV1cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iod20sIG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIHRoaXMud20gPSB3bVxyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBleGlzdHModGhpcy5vcHRpb25zLmlkKSA/IHRoaXMub3B0aW9ucy5pZCA6IGlkKytcclxuXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlV2luZG93KClcclxuICAgICAgICB0aGlzLl9saXN0ZW5lcnMoKVxyXG5cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuXHJcbiAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nID0gbnVsbFxyXG5cclxuICAgICAgICB0aGlzLmVhc2UgPSBuZXcgRWFzZSh7IGR1cmF0aW9uOiB0aGlzLm9wdGlvbnMuYW5pbWF0ZVRpbWUsIGVhc2U6IHRoaXMub3B0aW9ucy5lYXNlIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBvcGVuIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vRm9jdXNdIGRvIG5vdCBmb2N1cyB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vQW5pbWF0ZV0gZG8gbm90IGFuaW1hdGUgd2luZG93IHdoZW4gb3BlbmVkXHJcbiAgICAgKi9cclxuICAgIG9wZW4obm9Gb2N1cywgbm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ29wZW4nLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICBpZiAoIW5vQW5pbWF0ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDApJ1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZTogMSB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICBpZiAoIW5vRm9jdXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZm9jdXMgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBmb2N1cygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2ZvY3VzJywgdGhpcylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBibHVyIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgYmx1cigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20ubW9kYWwgIT09IHRoaXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvclRpdGxlYmFySW5hY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdibHVyJywgdGhpcylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjbG9zZXMgdGhlIHdpbmRvdyAoY2FuIGJlIHJlb3BlbmVkIHdpdGggb3BlbilcclxuICAgICAqL1xyXG4gICAgY2xvc2Uobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5fY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxyXG4gICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMCknXHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZTogMCB9KVxyXG4gICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nsb3NlJywgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaXMgd2luZG93IGNsb3NlZD9cclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICogQHJlYWRvbmx5XHJcbiAgICAgKi9cclxuICAgIGdldCBjbG9zZWQoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9jbG9zZWRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGxlZnQgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHgoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueCB9XHJcbiAgICBzZXQgeCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueCA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUubGVmdCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS14JywgdGhpcylcclxuICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkLmxlZnQgPSB2YWx1ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHRvcCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeSgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy55IH1cclxuICAgIHNldCB5KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy55ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS50b3AgPSB2YWx1ZSArICdweCdcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUteScsIHRoaXMpXHJcbiAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZC50b3AgPSB2YWx1ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHdpZHRoIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHdpZHRoKCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoIH1cclxuICAgIHNldCB3aWR0aCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS13aWR0aCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWlnaHQgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgaGVpZ2h0KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHQgfVxyXG4gICAgc2V0IGhlaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSB2YWx1ZSArICdweCdcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLWhlaWdodCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXNpemUgdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XHJcbiAgICAgKi9cclxuICAgIHJlc2l6ZSh3aWR0aCwgaGVpZ2h0KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aFxyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtb3ZlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5XHJcbiAgICAgKi9cclxuICAgIG1vdmUoeCwgeSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB4XHJcbiAgICAgICAgdGhpcy55ID0geVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWluaW1pemUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG5vQW5pbWF0ZVxyXG4gICAgICovXHJcbiAgICBtaW5pbWl6ZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykgJiYgdGhpcy5vcHRpb25zLm1pbmltaXphYmxlICYmICF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJydcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5taW5pbWl6ZWQueCwgeSA9IHRoaXMubWluaW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKHgsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZS1yZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZVg6IDEsIHNjYWxlWTogMSwgbGVmdDogdGhpcy5taW5pbWl6ZWQueCwgdG9wOiB0aGlzLm1pbmltaXplZC55IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMubWluaW1pemVkLngsIHkgPSB0aGlzLm1pbmltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKHgsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUtcmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLnhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHkgPSB0aGlzLnlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxlZnQgPSB0aGlzLl9sYXN0TWluaW1pemVkID8gdGhpcy5fbGFzdE1pbmltaXplZC5sZWZ0IDogdGhpcy54XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0b3AgPSB0aGlzLl9sYXN0TWluaW1pemVkID8gdGhpcy5fbGFzdE1pbmltaXplZC50b3AgOiB0aGlzLnlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlc2lyZWQgPSB0aGlzLm9wdGlvbnMubWluaW1pemVTaXplXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZVggPSBkZXNpcmVkIC8gdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbGVZID0gZGVzaXJlZCAvIHRoaXMuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgxKSBzY2FsZVgoJyArIHNjYWxlWCArICcpIHNjYWxlWSgnICsgc2NhbGVZICsgJyknXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdG9wICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0geyB4LCB5LCBzY2FsZVgsIHNjYWxlWSB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IHsgbGVmdCwgdG9wIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdCwgdG9wLCBzY2FsZVgsIHNjYWxlWSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0geyB4LCB5LCBzY2FsZVgsIHNjYWxlWSB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IHsgbGVmdCwgdG9wIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKGxlZnQsIHRvcClcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWF4aW1pemUgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBtYXhpbWl6ZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykgJiYgdGhpcy5vcHRpb25zLm1heGltaXphYmxlICYmICF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tYXhpbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gdGhpcy5tYXhpbWl6ZWQueFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IHRoaXMubWF4aW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy5tYXhpbWl6ZWQud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMubWF4aW1pemVkLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQ6IHRoaXMubWF4aW1pemVkLngsIHRvcDogdGhpcy5tYXhpbWl6ZWQueSwgd2lkdGg6IHRoaXMubWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IHRoaXMubWF4aW1pemVkLmhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IHRoaXMubWF4aW1pemVkLnhcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gdGhpcy5tYXhpbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy5tYXhpbWl6ZWQud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLm1heGltaXplZC5oZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy54LCB5ID0gdGhpcy55LCB3aWR0aCA9IHRoaXMud2luLm9mZnNldFdpZHRoLCBoZWlnaHQgPSB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IDBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRXaWR0aCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtYXhpbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQ6IDAsIHRvcDogMCwgd2lkdGg6IHRoaXMud20ub3ZlcmxheS5vZmZzZXRXaWR0aCwgaGVpZ2h0OiB0aGlzLndtLm92ZXJsYXkub2Zmc2V0SGVpZ2h0IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGggKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtYXhpbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXN0b3JlQnV0dG9uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kcyB3aW5kb3cgdG8gYmFjayBvZiB3aW5kb3ctbWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzZW5kVG9CYWNrKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndtLnNlbmRUb0JhY2sodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmQgd2luZG93IHRvIGZyb250IG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0Zyb250KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndtLnNlbmRUb0Zyb250KHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzYXZlIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IGRhdGFcclxuICAgICAqL1xyXG4gICAgc2F2ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHt9XHJcbiAgICAgICAgY29uc3QgbWF4aW1pemVkID0gdGhpcy5tYXhpbWl6ZWRcclxuICAgICAgICBpZiAobWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5tYXhpbWl6ZWQgPSB7IGxlZnQ6IG1heGltaXplZC5sZWZ0LCB0b3A6IG1heGltaXplZC50b3AsIHdpZHRoOiBtYXhpbWl6ZWQud2lkdGgsIGhlaWdodDogbWF4aW1pemVkLmhlaWdodCB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG1pbmltaXplZCA9IHRoaXMubWluaW1pemVkXHJcbiAgICAgICAgaWYgKG1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubWluaW1pemVkID0geyB4OiB0aGlzLm1pbmltaXplZC54LCB5OiB0aGlzLm1pbmltaXplZC55LCBzY2FsZVg6IHRoaXMubWluaW1pemVkLnNjYWxlWCwgc2NhbGVZOiB0aGlzLm1pbmltaXplZC5zY2FsZVkgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXN0TWluaW1pemVkID0gdGhpcy5fbGFzdE1pbmltaXplZFxyXG4gICAgICAgIGlmIChsYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5sYXN0TWluaW1pemVkID0geyBsZWZ0OiBsYXN0TWluaW1pemVkLmxlZnQsIHRvcDogbGFzdE1pbmltaXplZC50b3AgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkYXRhLnggPSB0aGlzLnhcclxuICAgICAgICBkYXRhLnkgPSB0aGlzLnlcclxuICAgICAgICBpZiAoZXhpc3RzKHRoaXMub3B0aW9ucy53aWR0aCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLndpZHRoID0gdGhpcy5vcHRpb25zLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHModGhpcy5vcHRpb25zLmhlaWdodCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmhlaWdodCA9IHRoaXMub3B0aW9ucy5oZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS5jbG9zZWQgPSB0aGlzLl9jbG9zZWRcclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJuIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBmcm9tIHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGRhdGEubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBkYXRhLm1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubWluaW1pemUodHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSBkYXRhLmxhc3RNaW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy54ID0gZGF0YS54XHJcbiAgICAgICAgdGhpcy55ID0gZGF0YS55XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSBkYXRhLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHMoZGF0YS5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBkYXRhLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEuY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLmNsb3NlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub3Blbih0cnVlLCB0cnVlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoYW5nZSB0aXRsZVxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0IHRpdGxlKCkgeyByZXR1cm4gdGhpcy5fdGl0bGUgfVxyXG4gICAgc2V0IHRpdGxlKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luVGl0bGUuaW5uZXJUZXh0ID0gdmFsdWVcclxuICAgICAgICB0aGlzLmVtaXQoJ3RpdGxlLWNoYW5nZScsIHRoaXMpXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmlnaHQgY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCByaWdodCgpIHsgcmV0dXJuIHRoaXMueCArIHRoaXMud2lkdGggfVxyXG4gICAgc2V0IHJpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHZhbHVlIC0gdGhpcy53aWR0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYm90dG9tIGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgYm90dG9tKCkgeyByZXR1cm4gdGhpcy55ICsgdGhpcy5oZWlnaHQgfVxyXG4gICAgc2V0IGJvdHRvbSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnkgPSB2YWx1ZSAtIHRoaXMuaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjZW50ZXJzIHdpbmRvdyBpbiBtaWRkbGUgb2Ygb3RoZXIgd2luZG93IG9yIGRvY3VtZW50LmJvZHlcclxuICAgICAqIEBwYXJhbSB7V2luZG93fSBbd2luXVxyXG4gICAgICovXHJcbiAgICBjZW50ZXIod2luKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1vdmUoXHJcbiAgICAgICAgICAgICAgICB3aW4ueCArIHdpbi53aWR0aCAvIDIgLSB0aGlzLndpZHRoIC8gMixcclxuICAgICAgICAgICAgICAgIHdpbi55ICsgd2luLmhlaWdodCAvIDIgLSB0aGlzLmhlaWdodCAvIDJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1vdmUoXHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuaW5uZXJXaWR0aCAvIDIgLSB0aGlzLndpZHRoIC8gMixcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5pbm5lckhlaWdodCAvIDIgLSB0aGlzLmhlaWdodCAvIDJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyByZXN0b3JlZCB0byBub3JtYWwgYWZ0ZXIgYmVpbmcgbWluaW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21pbmltaXplLXJlc3RvcmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IG9wZW5zXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I29wZW5cclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGdhaW5zIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2ZvY3VzXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGxvc2VzIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2JsdXJcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgY2xvc2VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2Nsb3NlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHJlc2l6ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXN0YXJ0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBhZnRlciByZXNpemUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyByZXNpemluZ1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gbW92ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgbW92ZSBjb21wbGV0ZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyBtb3ZlXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2lkdGggaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtd2lkdGhcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gaGVpZ2h0IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLWhlaWdodFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB4IHBvc2l0aW9uIG9mIHdpbmRvdyBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUteFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4geSBwb3NpdGlvbiBvZiB3aW5kb3cgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXlcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICBfY3JlYXRlV2luZG93KClcclxuICAgIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIGlzIHRoZSB0b3AtbGV2ZWwgRE9NIGVsZW1lbnRcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy53aW4gPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiAodGhpcy53bSA/IHRoaXMud20ud2luIDogbnVsbCksIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXJhZGl1cyc6IHRoaXMub3B0aW9ucy5ib3JkZXJSYWRpdXMsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbWluLXdpZHRoJzogdGhpcy5vcHRpb25zLm1pbldpZHRoLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ2JveC1zaGFkb3cnOiB0aGlzLm9wdGlvbnMuc2hhZG93LFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yV2luZG93LFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiB0aGlzLm9wdGlvbnMueCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiB0aGlzLm9wdGlvbnMueSxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IGlzTmFOKHRoaXMub3B0aW9ucy53aWR0aCkgPyB0aGlzLm9wdGlvbnMud2lkdGggOiB0aGlzLm9wdGlvbnMud2lkdGggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IGlzTmFOKHRoaXMub3B0aW9ucy5oZWlnaHQpID8gdGhpcy5vcHRpb25zLmhlaWdodCA6IHRoaXMub3B0aW9ucy5oZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLndpbkJveCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ2NvbHVtbicsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVRpdGxlYmFyKClcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgY29udGVudCBET00gZWxlbWVudC4gVXNlIHRoaXMgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIFdpbmRvdy5cclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdzZWN0aW9uJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdibG9jaycsXHJcbiAgICAgICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXgnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdy15JzogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlc2l6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm92ZXJsYXkgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IDAsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7IHRoaXMuX2Rvd25UaXRsZWJhcihlKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgX2Rvd25UaXRsZWJhcihlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmluZyA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gdGhpcy54LFxyXG4gICAgICAgICAgICAgICAgeTogZXZlbnQucGFnZVkgLSB0aGlzLnlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUtc3RhcnQnLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVUaXRsZWJhcigpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5UaXRsZWJhciA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnaGVhZGVyJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnanVzdGlmeS1jb250ZW50JzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogJzAgOHB4JyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCB3aW5UaXRsZVN0eWxlcyA9IHtcclxuICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgJ2N1cnNvcic6ICdkZWZhdWx0JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6ICcxNnB4JyxcclxuICAgICAgICAgICAgJ2ZvbnQtd2VpZ2h0JzogNDAwLFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yVGl0bGVcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50aXRsZUNlbnRlcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpblRpdGxlU3R5bGVzWydqdXN0aWZ5LWNvbnRlbnQnXSA9ICdjZW50ZXInXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpblRpdGxlU3R5bGVzWydwYWRkaW5nLWxlZnQnXSA9ICc4cHgnXHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpblRpdGxlID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgdHlwZTogJ3NwYW4nLCBodG1sOiB0aGlzLm9wdGlvbnMudGl0bGUsIHN0eWxlczogd2luVGl0bGVTdHlsZXMgfSlcclxuICAgICAgICB0aGlzLl9jcmVhdGVCdXR0b25zKClcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tb3ZhYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlQnV0dG9ucygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5CdXR0b25Hcm91cCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICcxMHB4J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBidXR0b24gPSB7XHJcbiAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogJzVweCcsXHJcbiAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgJ3dpZHRoJzogJzEycHgnLFxyXG4gICAgICAgICAgICAnaGVpZ2h0JzogJzEycHgnLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXNpemUnOiAnY292ZXInLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1yZXBlYXQnOiAnbm8tcmVwZWF0JyxcclxuICAgICAgICAgICAgJ29wYWNpdHknOiAuNyxcclxuICAgICAgICAgICAgJ2NvbG9yJzogdGhpcy5vcHRpb25zLmZvcmVncm91bmRDb2xvckJ1dHRvbixcclxuICAgICAgICAgICAgJ291dGxpbmUnOiAwXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnV0dG9ucyA9IHt9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1pbmltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5taW5pbWl6ZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWluaW1pemUsICgpID0+IHRoaXMubWluaW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWF4aW1pemUsICgpID0+IHRoaXMubWF4aW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENsb3NlQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5jbG9zZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMuY2xvc2UsICgpID0+IHRoaXMuY2xvc2UoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuYnV0dG9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuYnV0dG9uc1trZXldXHJcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDFcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAwLjdcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5yZXNpemVFZGdlID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdidXR0b24nLCBodG1sOiAnJm5ic3AnLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnYm90dG9tJzogMCxcclxuICAgICAgICAgICAgICAgICdyaWdodCc6ICc0cHgnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnc2UtcmVzaXplJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXNpemUsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzE1cHgnLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGRvd24gPSAoZSkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemluZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggLSBldmVudC5wYWdlWCxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAtIGV2ZW50LnBhZ2VZXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1zdGFydCcpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZG93bilcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGRvd24pXHJcbiAgICB9XHJcblxyXG4gICAgX21vdmUoZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1RvdWNoRXZlbnQoZSkgJiYgZS53aGljaCAhPT0gMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW92aW5nICYmIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IHRydWVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCAtIHRoaXMuX21vdmluZy54LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZIC0gdGhpcy5fbW92aW5nLnlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3Jlc2l6aW5nKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCArIHRoaXMuX3Jlc2l6aW5nLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZICsgdGhpcy5fcmVzaXppbmcuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF91cCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3ZlZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9zdG9wTW92ZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgfVxyXG5cclxuICAgIF9saXN0ZW5lcnMoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMuZm9jdXMoKSlcclxuICAgICAgICB0aGlzLndpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgfVxyXG5cclxuICAgIF9zdG9wTW92ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS1lbmQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIF9zdG9wUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9yZXN0b3JlID0gdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtZW5kJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICBfaXNUb3VjaEV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICEhd2luZG93LlRvdWNoRXZlbnQgJiYgKGUgaW5zdGFuY2VvZiB3aW5kb3cuVG91Y2hFdmVudClcclxuICAgIH1cclxuXHJcbiAgICBfY29udmVydE1vdmVFdmVudChlKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pc1RvdWNoRXZlbnQoZSkgPyBlLmNoYW5nZWRUb3VjaGVzWzBdIDogZVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB6KCkgeyByZXR1cm4gcGFyc2VJbnQodGhpcy53aW4uc3R5bGUuekluZGV4KSB9XHJcbiAgICBzZXQgeih2YWx1ZSkgeyB0aGlzLndpbi5zdHlsZS56SW5kZXggPSB2YWx1ZSB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2luZG93Il19