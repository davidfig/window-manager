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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwicGFyZW50Iiwic3R5bGVzIiwiYm9yZGVyUmFkaXVzIiwibWluV2lkdGgiLCJtaW5IZWlnaHQiLCJzaGFkb3ciLCJiYWNrZ3JvdW5kQ29sb3JXaW5kb3ciLCJpc05hTiIsIndpbkJveCIsIl9jcmVhdGVUaXRsZWJhciIsImNvbnRlbnQiLCJ0eXBlIiwicmVzaXphYmxlIiwiX2NyZWF0ZVJlc2l6ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX2Rvd25UaXRsZWJhciIsInN0b3BQcm9wYWdhdGlvbiIsImV2ZW50IiwiX2NvbnZlcnRNb3ZlRXZlbnQiLCJwYWdlWCIsInBhZ2VZIiwiX21vdmVkIiwidGl0bGViYXJIZWlnaHQiLCJ3aW5UaXRsZVN0eWxlcyIsImZvcmVncm91bmRDb2xvclRpdGxlIiwidGl0bGVDZW50ZXIiLCJ3aW5UaXRsZSIsInRpdGxlIiwiX2NyZWF0ZUJ1dHRvbnMiLCJtb3ZhYmxlIiwid2luQnV0dG9uR3JvdXAiLCJidXR0b24iLCJmb3JlZ3JvdW5kQ29sb3JCdXR0b24iLCJiYWNrZ3JvdW5kTWluaW1pemVCdXR0b24iLCJjbG9zYWJsZSIsImJhY2tncm91bmRDbG9zZUJ1dHRvbiIsImNsb3NlIiwia2V5Iiwib3BhY2l0eSIsInJlc2l6ZUVkZ2UiLCJiYWNrZ3JvdW5kUmVzaXplIiwiZG93biIsInByZXZlbnREZWZhdWx0IiwiX2lzVG91Y2hFdmVudCIsIndoaWNoIiwiX3N0b3BNb3ZlIiwiX3N0b3BSZXNpemUiLCJyZXNpemUiLCJ3aW5kb3ciLCJUb3VjaEV2ZW50IiwiY2hhbmdlZFRvdWNoZXMiLCJ2YWx1ZSIsIl90aXRsZSIsImlubmVyVGV4dCIsInBhcnNlSW50IiwiekluZGV4IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxlQUFSLENBQWY7QUFDQSxJQUFNQyxVQUFVRCxRQUFRLFNBQVIsQ0FBaEI7QUFDQSxJQUFNRSxPQUFPRixRQUFRLFVBQVIsQ0FBYjtBQUNBLElBQU1HLFNBQVNILFFBQVEsUUFBUixDQUFmOztBQUVBLElBQU1JLE9BQU9KLFFBQVEsUUFBUixDQUFiOztBQUVBLElBQUlLLEtBQUssQ0FBVDs7QUFFQTs7Ozs7Ozs7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RUFBMEIsSUFBMUI7QUFDSDs7QUFHRDs7Ozs7Ozs0QkFJWTtBQUFFLG1CQUFPLEtBQUtrQixDQUFMLEdBQVMsS0FBS0YsS0FBckI7QUFBNEIsUzswQkFDaEMrRSxLLEVBQ1Y7QUFDSSxpQkFBSzdFLENBQUwsR0FBUzZFLFFBQVEsS0FBSy9FLEtBQXRCO0FBQ0g7O0FBRUQ7Ozs7Ozs7NEJBSWE7QUFBRSxtQkFBTyxLQUFLRyxDQUFMLEdBQVMsS0FBS0YsTUFBckI7QUFBNkIsUzswQkFDakM4RSxLLEVBQ1g7QUFDSSxpQkFBSzVFLENBQUwsR0FBUzRFLFFBQVEsS0FBSzlFLE1BQXRCO0FBQ0g7Ozs0QkF3YU87QUFBRSxtQkFBT2lGLFNBQVMsS0FBS2pHLEdBQUwsQ0FBU0MsS0FBVCxDQUFlaUcsTUFBeEIsQ0FBUDtBQUF3QyxTOzBCQUM1Q0osSyxFQUFPO0FBQUUsaUJBQUs5RixHQUFMLENBQVNDLEtBQVQsQ0FBZWlHLE1BQWYsR0FBd0JKLEtBQXhCO0FBQStCOzs7O0VBOTRCN0J2SCxNOztBQWk1QnJCNEgsT0FBT0MsT0FBUCxHQUFpQnRILE1BQWpCIiwiZmlsZSI6IndpbmRvdy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IEV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjMnKVxyXG5jb25zdCBjbGlja2VkID0gcmVxdWlyZSgnY2xpY2tlZCcpXHJcbmNvbnN0IEVhc2UgPSByZXF1aXJlKCdkb20tZWFzZScpXHJcbmNvbnN0IGV4aXN0cyA9IHJlcXVpcmUoJ2V4aXN0cycpXHJcblxyXG5jb25zdCBodG1sID0gcmVxdWlyZSgnLi9odG1sJylcclxuXHJcbmxldCBpZCA9IDBcclxuXHJcbi8qKlxyXG4gKiBXaW5kb3cgY2xhc3MgcmV0dXJuZWQgYnkgV2luZG93TWFuYWdlci5jcmVhdGVXaW5kb3coKVxyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcclxuICogQGhpZGVjb25zdHJ1Y3RvclxyXG4gKiBAZmlyZXMgb3BlblxyXG4gKiBAZmlyZXMgZm9jdXNcclxuICogQGZpcmVzIGJsdXJcclxuICogQGZpcmVzIGNsb3NlXHJcbiAqIEBmaXJlcyBtYXhpbWl6ZVxyXG4gKiBAZmlyZXMgbWF4aW1pemUtcmVzdG9yZVxyXG4gKiBAZmlyZXMgbWluaW1pemVcclxuICogQGZpcmVzIG1pbmltaXplLXJlc3RvcmVcclxuICogQGZpcmVzIG1vdmVcclxuICogQGZpcmVzIG1vdmUtc3RhcnRcclxuICogQGZpcmVzIG1vdmUtZW5kXHJcbiAqIEBmaXJlcyByZXNpemVcclxuICogQGZpcmVzIHJlc2l6ZS1zdGFydFxyXG4gKiBAZmlyZXMgcmVzaXplLWVuZFxyXG4gKiBAZmlyZXMgbW92ZS14XHJcbiAqIEBmaXJlcyBtb3ZlLXlcclxuICogQGZpcmVzIHJlc2l6ZS13aWR0aFxyXG4gKiBAZmlyZXMgcmVzaXplLWhlaWdodFxyXG4gKi9cclxuY2xhc3MgV2luZG93IGV4dGVuZHMgRXZlbnRzXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtXaW5kb3dNYW5hZ2VyfSB3bVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iod20sIG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIHRoaXMud20gPSB3bVxyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zXHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBleGlzdHModGhpcy5vcHRpb25zLmlkKSA/IHRoaXMub3B0aW9ucy5pZCA6IGlkKytcclxuXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlV2luZG93KClcclxuICAgICAgICB0aGlzLl9saXN0ZW5lcnMoKVxyXG5cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuXHJcbiAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSBudWxsXHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nID0gbnVsbFxyXG5cclxuICAgICAgICB0aGlzLmVhc2UgPSBuZXcgRWFzZSh7IGR1cmF0aW9uOiB0aGlzLm9wdGlvbnMuYW5pbWF0ZVRpbWUsIGVhc2U6IHRoaXMub3B0aW9ucy5lYXNlIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBvcGVuIHRoZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vRm9jdXNdIGRvIG5vdCBmb2N1cyB3aW5kb3cgd2hlbiBvcGVuZWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25vQW5pbWF0ZV0gZG8gbm90IGFuaW1hdGUgd2luZG93IHdoZW4gb3BlbmVkXHJcbiAgICAgKi9cclxuICAgIG9wZW4obm9Gb2N1cywgbm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLl9jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ29wZW4nLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICBpZiAoIW5vQW5pbWF0ZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDApJ1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZTogMSB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlXHJcbiAgICAgICAgICAgIGlmICghbm9Gb2N1cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mb2N1cygpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBmb2N1cyB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGZvY3VzKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvclRpdGxlYmFyQWN0aXZlXHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnZm9jdXMnLCB0aGlzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGJsdXIgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBibHVyKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5tb2RhbCAhPT0gdGhpcylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2JsdXInLCB0aGlzKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNsb3NlcyB0aGUgd2luZG93IChjYW4gYmUgcmVvcGVuZWQgd2l0aCBvcGVuKVxyXG4gICAgICovXHJcbiAgICBjbG9zZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlXHJcbiAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgwKSdcclxuICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlOiAwIH0pXHJcbiAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnY2xvc2UnLCB0aGlzKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBpcyB3aW5kb3cgY2xvc2VkP1xyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKiBAcmVhZG9ubHlcclxuICAgICAqL1xyXG4gICAgZ2V0IGNsb3NlZCgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nsb3NlZFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbGVmdCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeCgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy54IH1cclxuICAgIHNldCB4KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy54ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLXgnLCB0aGlzKVxyXG4gICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQubGVmdCA9IHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdG9wIGNvb3JkaW5hdGVcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCB5KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLnkgfVxyXG4gICAgc2V0IHkodmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLnkgPSB2YWx1ZVxyXG4gICAgICAgIHRoaXMud2luLnN0eWxlLnRvcCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS15JywgdGhpcylcclxuICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkLnRvcCA9IHZhbHVlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogd2lkdGggb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgd2lkdGgoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMud2lkdGggfHwgdGhpcy53aW4ub2Zmc2V0V2lkdGggfVxyXG4gICAgc2V0IHdpZHRoKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gdmFsdWUgKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy53aWR0aCA9ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXdpZHRoJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGhlaWdodCBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCBoZWlnaHQoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMuaGVpZ2h0IHx8IHRoaXMud2luLm9mZnNldEhlaWdodCB9XHJcbiAgICBzZXQgaGVpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmhlaWdodCA9ICdhdXRvJ1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuaGVpZ2h0ID0gJydcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtaGVpZ2h0JywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlc2l6ZSB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcclxuICAgICAqL1xyXG4gICAgcmVzaXplKHdpZHRoLCBoZWlnaHQpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoXHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIG1vdmUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHlcclxuICAgICAqL1xyXG4gICAgbW92ZSh4LCB5KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHhcclxuICAgICAgICB0aGlzLnkgPSB5XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtaW5pbWl6ZSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbm9BbmltYXRlXHJcbiAgICAgKi9cclxuICAgIG1pbmltaXplKG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSAmJiB0aGlzLm9wdGlvbnMubWluaW1pemFibGUgJiYgIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLm1pbmltaXplZC54LCB5ID0gdGhpcy5taW5pbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUoeCwgeSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplLXJlc3RvcmUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IHNjYWxlWDogMSwgc2NhbGVZOiAxLCBsZWZ0OiB0aGlzLm1pbmltaXplZC54LCB0b3A6IHRoaXMubWluaW1pemVkLnkgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5taW5pbWl6ZWQueCwgeSA9IHRoaXMubWluaW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUoeCwgeSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZS1yZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMueFxyXG4gICAgICAgICAgICAgICAgY29uc3QgeSA9IHRoaXMueVxyXG4gICAgICAgICAgICAgICAgY29uc3QgbGVmdCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWQgPyB0aGlzLl9sYXN0TWluaW1pemVkLmxlZnQgOiB0aGlzLnhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRvcCA9IHRoaXMuX2xhc3RNaW5pbWl6ZWQgPyB0aGlzLl9sYXN0TWluaW1pemVkLnRvcCA6IHRoaXMueVxyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVzaXJlZCA9IHRoaXMub3B0aW9ucy5taW5pbWl6ZVNpemVcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlWCA9IGRlc2lyZWQgLyB0aGlzLndpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZVkgPSBkZXNpcmVkIC8gdGhpcy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJ3NjYWxlKDEpIHNjYWxlWCgnICsgc2NhbGVYICsgJykgc2NhbGVZKCcgKyBzY2FsZVkgKyAnKSdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50b3AgPSB0b3AgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHksIHNjYWxlWCwgc2NhbGVZIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21pbmltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0geyBsZWZ0LCB0b3AgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBsZWZ0LCB0b3AsIHNjYWxlWCwgc2NhbGVZIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSB7IHgsIHksIHNjYWxlWCwgc2NhbGVZIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkID0geyBsZWZ0LCB0b3AgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmUobGVmdCwgdG9wKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtYXhpbWl6ZSB0aGUgd2luZG93XHJcbiAgICAgKi9cclxuICAgIG1heGltaXplKG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSAmJiB0aGlzLm9wdGlvbnMubWF4aW1pemFibGUgJiYgIXRoaXMudHJhbnNpdGlvbmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSB0aGlzLm1heGltaXplZC54XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gdGhpcy5tYXhpbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLm1heGltaXplZC53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdDogdGhpcy5tYXhpbWl6ZWQueCwgdG9wOiB0aGlzLm1heGltaXplZC55LCB3aWR0aDogdGhpcy5tYXhpbWl6ZWQud2lkdGgsIGhlaWdodDogdGhpcy5tYXhpbWl6ZWQuaGVpZ2h0IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gdGhpcy5tYXhpbWl6ZWQueFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSB0aGlzLm1heGltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLm1heGltaXplZC53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMubWF4aW1pemVkLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWF4aW1pemVCdXR0b25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLngsIHkgPSB0aGlzLnksIHdpZHRoID0gdGhpcy53aW4ub2Zmc2V0V2lkdGgsIGhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgICAgICAgICAgaWYgKG5vQW5pbWF0ZSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IDBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21heGltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdDogMCwgdG9wOiAwLCB3aWR0aDogdGhpcy53bS5vdmVybGF5Lm9mZnNldFdpZHRoLCBoZWlnaHQ6IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgfSlcclxuICAgICAgICAgICAgICAgICAgICBlYXNlLm9uKCdjb21wbGV0ZScsICgpID0+XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnggPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRXaWR0aCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0SGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ21heGltaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc3RvcmVCdXR0b25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmRzIHdpbmRvdyB0byBiYWNrIG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0JhY2soKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvQmFjayh0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZCB3aW5kb3cgdG8gZnJvbnQgb2Ygd2luZG93LW1hbmFnZXJcclxuICAgICAqL1xyXG4gICAgc2VuZFRvRnJvbnQoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud20uc2VuZFRvRnJvbnQodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNhdmUgdGhlIHN0YXRlIG9mIHRoZSB3aW5kb3dcclxuICAgICAqIEByZXR1cm4ge29iamVjdH0gZGF0YVxyXG4gICAgICovXHJcbiAgICBzYXZlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBkYXRhID0ge31cclxuICAgICAgICBjb25zdCBtYXhpbWl6ZWQgPSB0aGlzLm1heGltaXplZFxyXG4gICAgICAgIGlmIChtYXhpbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm1heGltaXplZCA9IHsgbGVmdDogbWF4aW1pemVkLmxlZnQsIHRvcDogbWF4aW1pemVkLnRvcCwgd2lkdGg6IG1heGltaXplZC53aWR0aCwgaGVpZ2h0OiBtYXhpbWl6ZWQuaGVpZ2h0IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgbWluaW1pemVkID0gdGhpcy5taW5pbWl6ZWRcclxuICAgICAgICBpZiAobWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5taW5pbWl6ZWQgPSB7IHg6IHRoaXMubWluaW1pemVkLngsIHk6IHRoaXMubWluaW1pemVkLnksIHNjYWxlWDogdGhpcy5taW5pbWl6ZWQuc2NhbGVYLCBzY2FsZVk6IHRoaXMubWluaW1pemVkLnNjYWxlWSB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGxhc3RNaW5pbWl6ZWQgPSB0aGlzLl9sYXN0TWluaW1pemVkXHJcbiAgICAgICAgaWYgKGxhc3RNaW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmxhc3RNaW5pbWl6ZWQgPSB7IGxlZnQ6IGxhc3RNaW5pbWl6ZWQubGVmdCwgdG9wOiBsYXN0TWluaW1pemVkLnRvcCB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEueCA9IHRoaXMueFxyXG4gICAgICAgIGRhdGEueSA9IHRoaXMueVxyXG4gICAgICAgIGlmIChleGlzdHModGhpcy5vcHRpb25zLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEud2lkdGggPSB0aGlzLm9wdGlvbnMud2lkdGhcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGV4aXN0cyh0aGlzLm9wdGlvbnMuaGVpZ2h0KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEuaGVpZ2h0ID0gdGhpcy5vcHRpb25zLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJuIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBmcm9tIHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGRhdGEubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBkYXRhLm1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubWluaW1pemUodHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSBkYXRhLmxhc3RNaW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy54ID0gZGF0YS54XHJcbiAgICAgICAgdGhpcy55ID0gZGF0YS55XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSBkYXRhLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHMoZGF0YS5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBkYXRhLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGFuZ2UgdGl0bGVcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldCB0aXRsZSgpIHsgcmV0dXJuIHRoaXMuX3RpdGxlIH1cclxuICAgIHNldCB0aXRsZSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlLmlubmVyVGV4dCA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy5lbWl0KCd0aXRsZS1jaGFuZ2UnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJpZ2h0IGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgcmlnaHQoKSB7IHJldHVybiB0aGlzLnggKyB0aGlzLndpZHRoIH1cclxuICAgIHNldCByaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB2YWx1ZSAtIHRoaXMud2lkdGhcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGJvdHRvbSBjb29yZGluYXRlIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IGJvdHRvbSgpIHsgcmV0dXJuIHRoaXMueSArIHRoaXMuaGVpZ2h0IH1cclxuICAgIHNldCBib3R0b20odmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy55ID0gdmFsdWUgLSB0aGlzLmhlaWdodFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2VudGVycyB3aW5kb3cgaW4gbWlkZGxlIG9mIG90aGVyIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtXaW5kb3d9IHdpblxyXG4gICAgICovXHJcbiAgICBjZW50ZXIod2luKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgd2luLnggKyB3aW4ud2lkdGggLyAyIC0gdGhpcy53aWR0aCAvIDIsXHJcbiAgICAgICAgICAgIHdpbi55ICsgd2luLmhlaWdodCAvIDIgLSB0aGlzLmhlaWdodCAvIDJcclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIHJlc3RvcmVkIHRvIG5vcm1hbCBhZnRlciBiZWluZyBtYXhpbWl6ZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbWF4aW1pemUtcmVzdG9yZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1pbmltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtaW5pbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBvcGVuc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNvcGVuXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBnYWlucyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNmb2N1c1xyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBsb3NlcyBmb2N1c1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNibHVyXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGNsb3Nlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNjbG9zZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiByZXNpemUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgcmVzaXplIGNvbXBsZXRlc1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgcmVzaXppbmdcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIG1vdmUgc3RhcnRzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtc3RhcnRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGFmdGVyIG1vdmUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUtZW5kXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBkdXJpbmcgbW92ZVxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpZHRoIGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXdpZHRoXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIGhlaWdodCBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1oZWlnaHRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4geCBwb3NpdGlvbiBvZiB3aW5kb3cgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXhcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHkgcG9zaXRpb24gb2Ygd2luZG93IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS15XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgX2NyZWF0ZVdpbmRvdygpXHJcbiAgICB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgdG9wLWxldmVsIERPTSBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqIEByZWFkb25seVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMud2luID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53bS53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXJhZGl1cyc6IHRoaXMub3B0aW9ucy5ib3JkZXJSYWRpdXMsXHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbWluLXdpZHRoJzogdGhpcy5vcHRpb25zLm1pbldpZHRoLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ2JveC1zaGFkb3cnOiB0aGlzLm9wdGlvbnMuc2hhZG93LFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENvbG9yV2luZG93LFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiB0aGlzLm9wdGlvbnMueCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiB0aGlzLm9wdGlvbnMueSxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IGlzTmFOKHRoaXMub3B0aW9ucy53aWR0aCkgPyB0aGlzLm9wdGlvbnMud2lkdGggOiB0aGlzLm9wdGlvbnMud2lkdGggKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6IGlzTmFOKHRoaXMub3B0aW9ucy5oZWlnaHQpID8gdGhpcy5vcHRpb25zLmhlaWdodCA6IHRoaXMub3B0aW9ucy5oZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLndpbkJveCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ2NvbHVtbicsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVRpdGxlYmFyKClcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgY29udGVudCBET00gZWxlbWVudC4gVXNlIHRoaXMgdG8gYWRkIGNvbnRlbnQgdG8gdGhlIFdpbmRvdy5cclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdzZWN0aW9uJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdibG9jaycsXHJcbiAgICAgICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMubWluSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXgnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdy15JzogJ2F1dG8nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnJlc2l6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm92ZXJsYXkgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IDAsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7IHRoaXMuX2Rvd25UaXRsZWJhcihlKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgX2Rvd25UaXRsZWJhcihlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy50cmFuc2l0aW9uaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmluZyA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGV2ZW50LnBhZ2VYIC0gdGhpcy54LFxyXG4gICAgICAgICAgICAgICAgeTogZXZlbnQucGFnZVkgLSB0aGlzLnlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ21vdmUtc3RhcnQnLCB0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IGZhbHNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVUaXRsZWJhcigpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5UaXRsZWJhciA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luQm94LCB0eXBlOiAnaGVhZGVyJywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnanVzdGlmeS1jb250ZW50JzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogdGhpcy5vcHRpb25zLnRpdGxlYmFySGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogJzAgOHB4JyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCB3aW5UaXRsZVN0eWxlcyA9IHtcclxuICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAnZmxleCc6IDEsXHJcbiAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgJ2N1cnNvcic6ICdkZWZhdWx0JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6ICcxNnB4JyxcclxuICAgICAgICAgICAgJ2ZvbnQtd2VpZ2h0JzogNDAwLFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yVGl0bGVcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy50aXRsZUNlbnRlcilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpblRpdGxlU3R5bGVzWydqdXN0aWZ5LWNvbnRlbnQnXSA9ICdjZW50ZXInXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpblRpdGxlU3R5bGVzWydwYWRkaW5nLWxlZnQnXSA9ICc4cHgnXHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpblRpdGxlID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgdHlwZTogJ3NwYW4nLCBodG1sOiB0aGlzLm9wdGlvbnMudGl0bGUsIHN0eWxlczogd2luVGl0bGVTdHlsZXMgfSlcclxuICAgICAgICB0aGlzLl9jcmVhdGVCdXR0b25zKClcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tb3ZhYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5UaXRsZWJhci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4gdGhpcy5fZG93blRpdGxlYmFyKGUpKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlQnV0dG9ucygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW5CdXR0b25Hcm91cCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luVGl0bGViYXIsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcclxuICAgICAgICAgICAgICAgICdhbGlnbi1pdGVtcyc6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmctbGVmdCc6ICcxMHB4J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBjb25zdCBidXR0b24gPSB7XHJcbiAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaycsXHJcbiAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogJzVweCcsXHJcbiAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgJ3dpZHRoJzogJzEycHgnLFxyXG4gICAgICAgICAgICAnaGVpZ2h0JzogJzEycHgnLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICd0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXNpemUnOiAnY292ZXInLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1yZXBlYXQnOiAnbm8tcmVwZWF0JyxcclxuICAgICAgICAgICAgJ29wYWNpdHknOiAuNyxcclxuICAgICAgICAgICAgJ2NvbG9yJzogdGhpcy5vcHRpb25zLmZvcmVncm91bmRDb2xvckJ1dHRvbixcclxuICAgICAgICAgICAgJ291dGxpbmUnOiAwXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnV0dG9ucyA9IHt9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5taW5pbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1pbmltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5taW5pbWl6ZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWluaW1pemUsICgpID0+IHRoaXMubWluaW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5tYXhpbWl6YWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMubWF4aW1pemUsICgpID0+IHRoaXMubWF4aW1pemUoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGJ1dHRvbi5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZENsb3NlQnV0dG9uXHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5jbG9zZSA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud2luQnV0dG9uR3JvdXAsIGh0bWw6ICcmbmJzcDsnLCB0eXBlOiAnYnV0dG9uJywgc3R5bGVzOiBidXR0b24gfSlcclxuICAgICAgICAgICAgY2xpY2tlZCh0aGlzLmJ1dHRvbnMuY2xvc2UsICgpID0+IHRoaXMuY2xvc2UoKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuYnV0dG9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IHRoaXMuYnV0dG9uc1trZXldXHJcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDFcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgKCkgPT5cclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnV0dG9uLnN0eWxlLm9wYWNpdHkgPSAwLjdcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVJlc2l6ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5yZXNpemVFZGdlID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdidXR0b24nLCBodG1sOiAnJm5ic3AnLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAnYm90dG9tJzogMCxcclxuICAgICAgICAgICAgICAgICdyaWdodCc6ICc0cHgnLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICAgICAnbWFyZ2luJzogMCxcclxuICAgICAgICAgICAgICAgICdwYWRkaW5nJzogMCxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnc2UtcmVzaXplJyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXNpemUsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzE1cHgnLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGRvd24gPSAoZSkgPT5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy53aWR0aCB8fCB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gdGhpcy5oZWlnaHQgfHwgdGhpcy53aW4ub2Zmc2V0SGVpZ2h0XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9yZXNpemluZyA9IHtcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGggLSBldmVudC5wYWdlWCxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAtIGV2ZW50LnBhZ2VZXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1zdGFydCcpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgZG93bilcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIGRvd24pXHJcbiAgICB9XHJcblxyXG4gICAgX21vdmUoZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy53bS5fY2hlY2tNb2RhbCh0aGlzKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLl9pc1RvdWNoRXZlbnQoZSkgJiYgZS53aGljaCAhPT0gMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fbW92aW5nICYmIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9tb3ZpbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9tb3ZlZCA9IHRydWVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubW92ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCAtIHRoaXMuX21vdmluZy54LFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZIC0gdGhpcy5fbW92aW5nLnlcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX3Jlc2l6aW5nKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZShcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wYWdlWCArIHRoaXMuX3Jlc2l6aW5nLndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VZICsgdGhpcy5fcmVzaXppbmcuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1heGltaXplZCA9IG51bGxcclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF91cCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9tb3ZlZClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9zdG9wTW92ZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3Jlc2l6aW5nICYmIHRoaXMuX3N0b3BSZXNpemUoKVxyXG4gICAgfVxyXG5cclxuICAgIF9saXN0ZW5lcnMoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+IHRoaXMuZm9jdXMoKSlcclxuICAgICAgICB0aGlzLndpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgfVxyXG5cclxuICAgIF9zdG9wTW92ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fbW92aW5nID0gbnVsbFxyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS1lbmQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIF9zdG9wUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9yZXN0b3JlID0gdGhpcy5fcmVzaXppbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUtZW5kJywgdGhpcylcclxuICAgIH1cclxuXHJcbiAgICBfaXNUb3VjaEV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICEhd2luZG93LlRvdWNoRXZlbnQgJiYgKGUgaW5zdGFuY2VvZiB3aW5kb3cuVG91Y2hFdmVudClcclxuICAgIH1cclxuXHJcbiAgICBfY29udmVydE1vdmVFdmVudChlKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9pc1RvdWNoRXZlbnQoZSkgPyBlLmNoYW5nZWRUb3VjaGVzWzBdIDogZVxyXG4gICAgfVxyXG5cclxuICAgIGdldCB6KCkgeyByZXR1cm4gcGFyc2VJbnQodGhpcy53aW4uc3R5bGUuekluZGV4KSB9XHJcbiAgICBzZXQgeih2YWx1ZSkgeyB0aGlzLndpbi5zdHlsZS56SW5kZXggPSB2YWx1ZSB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2luZG93Il19