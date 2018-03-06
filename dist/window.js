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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cuanMiXSwibmFtZXMiOlsiRXZlbnRzIiwicmVxdWlyZSIsImNsaWNrZWQiLCJFYXNlIiwiZXhpc3RzIiwiaHRtbCIsImlkIiwiV2luZG93Iiwid20iLCJvcHRpb25zIiwiX2NyZWF0ZVdpbmRvdyIsIl9saXN0ZW5lcnMiLCJhY3RpdmUiLCJtYXhpbWl6ZWQiLCJtaW5pbWl6ZWQiLCJfY2xvc2VkIiwiX3Jlc3RvcmUiLCJfbW92aW5nIiwiX3Jlc2l6aW5nIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJub0ZvY3VzIiwibm9BbmltYXRlIiwiZW1pdCIsIndpbiIsInN0eWxlIiwiZGlzcGxheSIsInRyYW5zZm9ybSIsImFkZCIsInNjYWxlIiwiZm9jdXMiLCJfY2hlY2tNb2RhbCIsIm1pbmltaXplIiwid2luVGl0bGViYXIiLCJiYWNrZ3JvdW5kQ29sb3IiLCJiYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZSIsIm1vZGFsIiwiYmFja2dyb3VuZENvbG9yVGl0bGViYXJJbmFjdGl2ZSIsIm9uIiwid2lkdGgiLCJoZWlnaHQiLCJ4IiwieSIsIm1pbmltaXphYmxlIiwidHJhbnNpdGlvbmluZyIsIm1vdmUiLCJvdmVybGF5Iiwic2NhbGVYIiwic2NhbGVZIiwibGVmdCIsInRvcCIsIl9sYXN0TWluaW1pemVkIiwiZGVzaXJlZCIsIm1pbmltaXplU2l6ZSIsIm1heGltaXphYmxlIiwiYnV0dG9ucyIsIm1heGltaXplIiwiYmFja2dyb3VuZEltYWdlIiwiYmFja2dyb3VuZE1heGltaXplQnV0dG9uIiwib2Zmc2V0V2lkdGgiLCJvZmZzZXRIZWlnaHQiLCJiYWNrZ3JvdW5kUmVzdG9yZUJ1dHRvbiIsInNlbmRUb0JhY2siLCJzZW5kVG9Gcm9udCIsImRhdGEiLCJsYXN0TWluaW1pemVkIiwiY2xvc2VkIiwiY2xvc2UiLCJwYXJlbnQiLCJzdHlsZXMiLCJib3JkZXJSYWRpdXMiLCJtaW5XaWR0aCIsIm1pbkhlaWdodCIsInNoYWRvdyIsImJhY2tncm91bmRDb2xvcldpbmRvdyIsImlzTmFOIiwid2luQm94IiwiX2NyZWF0ZVRpdGxlYmFyIiwiY29udGVudCIsInR5cGUiLCJyZXNpemFibGUiLCJfY3JlYXRlUmVzaXplIiwiYWRkRXZlbnRMaXN0ZW5lciIsImUiLCJfZG93blRpdGxlYmFyIiwic3RvcFByb3BhZ2F0aW9uIiwiZXZlbnQiLCJfY29udmVydE1vdmVFdmVudCIsInBhZ2VYIiwicGFnZVkiLCJfbW92ZWQiLCJ0aXRsZWJhckhlaWdodCIsIndpblRpdGxlU3R5bGVzIiwiZm9yZWdyb3VuZENvbG9yVGl0bGUiLCJ0aXRsZUNlbnRlciIsIndpblRpdGxlIiwidGl0bGUiLCJfY3JlYXRlQnV0dG9ucyIsIm1vdmFibGUiLCJ3aW5CdXR0b25Hcm91cCIsImJ1dHRvbiIsImZvcmVncm91bmRDb2xvckJ1dHRvbiIsImJhY2tncm91bmRNaW5pbWl6ZUJ1dHRvbiIsImNsb3NhYmxlIiwiYmFja2dyb3VuZENsb3NlQnV0dG9uIiwia2V5Iiwib3BhY2l0eSIsInJlc2l6ZUVkZ2UiLCJiYWNrZ3JvdW5kUmVzaXplIiwiZG93biIsInByZXZlbnREZWZhdWx0IiwiX2lzVG91Y2hFdmVudCIsIndoaWNoIiwiX3N0b3BNb3ZlIiwiX3N0b3BSZXNpemUiLCJyZXNpemUiLCJ3aW5kb3ciLCJUb3VjaEV2ZW50IiwiY2hhbmdlZFRvdWNoZXMiLCJ2YWx1ZSIsIl90aXRsZSIsImlubmVyVGV4dCIsInBhcnNlSW50IiwiekluZGV4IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxlQUFSLENBQWY7QUFDQSxJQUFNQyxVQUFVRCxRQUFRLFNBQVIsQ0FBaEI7QUFDQSxJQUFNRSxPQUFPRixRQUFRLFVBQVIsQ0FBYjtBQUNBLElBQU1HLFNBQVNILFFBQVEsUUFBUixDQUFmOztBQUVBLElBQU1JLE9BQU9KLFFBQVEsUUFBUixDQUFiOztBQUVBLElBQUlLLEtBQUssQ0FBVDs7QUFF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S0FBS2lHLE1BQVo7QUFBb0IsUzswQkFDeEJELEssRUFDVjtBQUNJLGlCQUFLeEIsUUFBTCxDQUFjMEIsU0FBZCxHQUEwQkYsS0FBMUI7QUFDQSxpQkFBS2hHLElBQUwsQ0FBVSxjQUFWLEVBQTBCLElBQTFCO0FBQ0g7O0FBR0Q7Ozs7Ozs7NEJBSVk7QUFBRSxtQkFBTyxLQUFLa0IsQ0FBTCxHQUFTLEtBQUtGLEtBQXJCO0FBQTRCLFM7MEJBQ2hDZ0YsSyxFQUNWO0FBQ0ksaUJBQUs5RSxDQUFMLEdBQVM4RSxRQUFRLEtBQUtoRixLQUF0QjtBQUNIOztBQUVEOzs7Ozs7OzRCQUlhO0FBQUUsbUJBQU8sS0FBS0csQ0FBTCxHQUFTLEtBQUtGLE1BQXJCO0FBQTZCLFM7MEJBQ2pDK0UsSyxFQUNYO0FBQ0ksaUJBQUs3RSxDQUFMLEdBQVM2RSxRQUFRLEtBQUsvRSxNQUF0QjtBQUNIOzs7NEJBd2FPO0FBQUUsbUJBQU9rRixTQUFTLEtBQUtsRyxHQUFMLENBQVNDLEtBQVQsQ0FBZWtHLE1BQXhCLENBQVA7QUFBd0MsUzswQkFDNUNKLEssRUFBTztBQUFFLGlCQUFLL0YsR0FBTCxDQUFTQyxLQUFULENBQWVrRyxNQUFmLEdBQXdCSixLQUF4QjtBQUErQjs7OztFQW41QjdCeEgsTTs7QUFzNUJyQjZILE9BQU9DLE9BQVAsR0FBaUJ2SCxNQUFqQiIsImZpbGUiOiJ3aW5kb3cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBFdmVudHMgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJylcclxuY29uc3QgY2xpY2tlZCA9IHJlcXVpcmUoJ2NsaWNrZWQnKVxyXG5jb25zdCBFYXNlID0gcmVxdWlyZSgnZG9tLWVhc2UnKVxyXG5jb25zdCBleGlzdHMgPSByZXF1aXJlKCdleGlzdHMnKVxyXG5cclxuY29uc3QgaHRtbCA9IHJlcXVpcmUoJy4vaHRtbCcpXHJcblxyXG5sZXQgaWQgPSAwXHJcblxyXG4vKipcclxuICogV2luZG93IGNsYXNzIHJldHVybmVkIGJ5IFdpbmRvd01hbmFnZXIuY3JlYXRlV2luZG93KClcclxuICogQGV4dGVuZHMgRXZlbnRFbWl0dGVyXHJcbiAqIEBoaWRlY29uc3RydWN0b3JcclxuICogQGZpcmVzIG9wZW5cclxuICogQGZpcmVzIGZvY3VzXHJcbiAqIEBmaXJlcyBibHVyXHJcbiAqIEBmaXJlcyBjbG9zZVxyXG4gKiBAZmlyZXMgbWF4aW1pemVcclxuICogQGZpcmVzIG1heGltaXplLXJlc3RvcmVcclxuICogQGZpcmVzIG1pbmltaXplXHJcbiAqIEBmaXJlcyBtaW5pbWl6ZS1yZXN0b3JlXHJcbiAqIEBmaXJlcyBtb3ZlXHJcbiAqIEBmaXJlcyBtb3ZlLXN0YXJ0XHJcbiAqIEBmaXJlcyBtb3ZlLWVuZFxyXG4gKiBAZmlyZXMgcmVzaXplXHJcbiAqIEBmaXJlcyByZXNpemUtc3RhcnRcclxuICogQGZpcmVzIHJlc2l6ZS1lbmRcclxuICogQGZpcmVzIG1vdmUteFxyXG4gKiBAZmlyZXMgbW92ZS15XHJcbiAqIEBmaXJlcyByZXNpemUtd2lkdGhcclxuICogQGZpcmVzIHJlc2l6ZS1oZWlnaHRcclxuICovXHJcbmNsYXNzIFdpbmRvdyBleHRlbmRzIEV2ZW50c1xyXG57XHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7V2luZG93TWFuYWdlcn0gd21cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHdtLCBvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHN1cGVyKClcclxuICAgICAgICB0aGlzLndtID0gd21cclxuXHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9uc1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gZXhpc3RzKHRoaXMub3B0aW9ucy5pZCkgPyB0aGlzLm9wdGlvbnMuaWQgOiBpZCsrXHJcblxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZVdpbmRvdygpXHJcbiAgICAgICAgdGhpcy5fbGlzdGVuZXJzKClcclxuXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgICAgIHRoaXMubWF4aW1pemVkID0gZmFsc2VcclxuICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcblxyXG4gICAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWVcclxuICAgICAgICB0aGlzLl9yZXN0b3JlID0gbnVsbFxyXG4gICAgICAgIHRoaXMuX21vdmluZyA9IG51bGxcclxuICAgICAgICB0aGlzLl9yZXNpemluZyA9IG51bGxcclxuXHJcbiAgICAgICAgdGhpcy5lYXNlID0gbmV3IEVhc2UoeyBkdXJhdGlvbjogdGhpcy5vcHRpb25zLmFuaW1hdGVUaW1lLCBlYXNlOiB0aGlzLm9wdGlvbnMuZWFzZSB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogb3BlbiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtub0ZvY3VzXSBkbyBub3QgZm9jdXMgd2luZG93IHdoZW4gb3BlbmVkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtub0FuaW1hdGVdIGRvIG5vdCBhbmltYXRlIHdpbmRvdyB3aGVuIG9wZW5lZFxyXG4gICAgICovXHJcbiAgICBvcGVuKG5vRm9jdXMsIG5vQW5pbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5fY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdvcGVuJywgdGhpcylcclxuICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgaWYgKCFub0FuaW1hdGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgwKSdcclxuICAgICAgICAgICAgICAgIHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgc2NhbGU6IDEgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl9jbG9zZWQgPSBmYWxzZVxyXG4gICAgICAgICAgICBpZiAoIW5vRm9jdXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogZm9jdXMgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBmb2N1cygpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZVxyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JUaXRsZWJhckFjdGl2ZVxyXG4gICAgICAgICAgICB0aGlzLmVtaXQoJ2ZvY3VzJywgdGhpcylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBibHVyIHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgYmx1cigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20ubW9kYWwgIT09IHRoaXMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRDb2xvclRpdGxlYmFySW5hY3RpdmVcclxuICAgICAgICAgICAgdGhpcy5lbWl0KCdibHVyJywgdGhpcylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjbG9zZXMgdGhlIHdpbmRvdyAoY2FuIGJlIHJlb3BlbmVkIHdpdGggb3BlbilcclxuICAgICAqL1xyXG4gICAgY2xvc2Uobm9BbmltYXRlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghdGhpcy5fY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fY2xvc2VkID0gdHJ1ZVxyXG4gICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS50cmFuc2Zvcm0gPSAnc2NhbGUoMCknXHJcbiAgICAgICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZTogMCB9KVxyXG4gICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2Nsb3NlJywgdGhpcyk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogaXMgd2luZG93IGNsb3NlZD9cclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICogQHJlYWRvbmx5XHJcbiAgICAgKi9cclxuICAgIGdldCBjbG9zZWQoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9jbG9zZWRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGxlZnQgY29vcmRpbmF0ZVxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHgoKSB7IHJldHVybiB0aGlzLm9wdGlvbnMueCB9XHJcbiAgICBzZXQgeCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMueCA9IHZhbHVlXHJcbiAgICAgICAgdGhpcy53aW4uc3R5bGUubGVmdCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgIHRoaXMuZW1pdCgnbW92ZS14JywgdGhpcylcclxuICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9sYXN0TWluaW1pemVkLmxlZnQgPSB2YWx1ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHRvcCBjb29yZGluYXRlXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgeSgpIHsgcmV0dXJuIHRoaXMub3B0aW9ucy55IH1cclxuICAgIHNldCB5KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucy55ID0gdmFsdWVcclxuICAgICAgICB0aGlzLndpbi5zdHlsZS50b3AgPSB2YWx1ZSArICdweCdcclxuICAgICAgICB0aGlzLmVtaXQoJ21vdmUteScsIHRoaXMpXHJcbiAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZC50b3AgPSB2YWx1ZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHdpZHRoIG9mIHdpbmRvd1xyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0IHdpZHRoKCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoIH1cclxuICAgIHNldCB3aWR0aCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9IHZhbHVlICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSB0aGlzLndpbi5vZmZzZXRXaWR0aFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS53aWR0aCA9ICdhdXRvJ1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMud2lkdGggPSAnJ1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS13aWR0aCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBoZWlnaHQgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgaGVpZ2h0KCkgeyByZXR1cm4gdGhpcy5vcHRpb25zLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHQgfVxyXG4gICAgc2V0IGhlaWdodCh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSB2YWx1ZSArICdweCdcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9IHRoaXMud2luLm9mZnNldEhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmhlaWdodCA9ICcnXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuZW1pdCgncmVzaXplLWhlaWdodCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXNpemUgdGhlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0XHJcbiAgICAgKi9cclxuICAgIHJlc2l6ZSh3aWR0aCwgaGVpZ2h0KVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aFxyXG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBtb3ZlIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHhcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5XHJcbiAgICAgKi9cclxuICAgIG1vdmUoeCwgeSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnggPSB4XHJcbiAgICAgICAgdGhpcy55ID0geVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWluaW1pemUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IG5vQW5pbWF0ZVxyXG4gICAgICovXHJcbiAgICBtaW5pbWl6ZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykgJiYgdGhpcy5vcHRpb25zLm1pbmltaXphYmxlICYmICF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5taW5pbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudHJhbnNmb3JtID0gJydcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy5taW5pbWl6ZWQueCwgeSA9IHRoaXMubWluaW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplZCA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKHgsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZS1yZXN0b3JlJywgdGhpcylcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWVcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlYXNlID0gdGhpcy5lYXNlLmFkZCh0aGlzLndpbiwgeyBzY2FsZVg6IDEsIHNjYWxlWTogMSwgbGVmdDogdGhpcy5taW5pbWl6ZWQueCwgdG9wOiB0aGlzLm1pbmltaXplZC55IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMubWluaW1pemVkLngsIHkgPSB0aGlzLm1pbmltaXplZC55XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKHgsIHkpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUtcmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3ZlcmxheS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSB0aGlzLnhcclxuICAgICAgICAgICAgICAgIGNvbnN0IHkgPSB0aGlzLnlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxlZnQgPSB0aGlzLl9sYXN0TWluaW1pemVkID8gdGhpcy5fbGFzdE1pbmltaXplZC5sZWZ0IDogdGhpcy54XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0b3AgPSB0aGlzLl9sYXN0TWluaW1pemVkID8gdGhpcy5fbGFzdE1pbmltaXplZC50b3AgOiB0aGlzLnlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlc2lyZWQgPSB0aGlzLm9wdGlvbnMubWluaW1pemVTaXplXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsZVggPSBkZXNpcmVkIC8gdGhpcy53aWR0aFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2NhbGVZID0gZGVzaXJlZCAvIHRoaXMuaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICBpZiAobm9BbmltYXRlKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLnRyYW5zZm9ybSA9ICdzY2FsZSgxKSBzY2FsZVgoJyArIHNjYWxlWCArICcpIHNjYWxlWSgnICsgc2NhbGVZICsgJyknXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aW4uc3R5bGUudG9wID0gdG9wICsgJ3B4J1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0geyB4LCB5LCBzY2FsZVgsIHNjYWxlWSB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtaW5pbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IHsgbGVmdCwgdG9wIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZWFzZSA9IHRoaXMuZWFzZS5hZGQodGhpcy53aW4sIHsgbGVmdCwgdG9wLCBzY2FsZVgsIHNjYWxlWSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemVkID0geyB4LCB5LCBzY2FsZVgsIHNjYWxlWSB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgnbWluaW1pemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fbGFzdE1pbmltaXplZCA9IHsgbGVmdCwgdG9wIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlKGxlZnQsIHRvcClcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogbWF4aW1pemUgdGhlIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBtYXhpbWl6ZShub0FuaW1hdGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykgJiYgdGhpcy5vcHRpb25zLm1heGltaXphYmxlICYmICF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tYXhpbWl6ZWQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gdGhpcy5tYXhpbWl6ZWQueFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueSA9IHRoaXMubWF4aW1pemVkLnlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy5tYXhpbWl6ZWQud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMubWF4aW1pemVkLmhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQ6IHRoaXMubWF4aW1pemVkLngsIHRvcDogdGhpcy5tYXhpbWl6ZWQueSwgd2lkdGg6IHRoaXMubWF4aW1pemVkLndpZHRoLCBoZWlnaHQ6IHRoaXMubWF4aW1pemVkLmhlaWdodCB9KVxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2Uub24oJ2NvbXBsZXRlJywgKCkgPT5cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IHRoaXMubWF4aW1pemVkLnhcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy55ID0gdGhpcy5tYXhpbWl6ZWQueVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndpZHRoID0gdGhpcy5tYXhpbWl6ZWQud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLm1heGltaXplZC5oZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzdG9yZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5tYXhpbWl6ZS5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZE1heGltaXplQnV0dG9uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdGhpcy54LCB5ID0gdGhpcy55LCB3aWR0aCA9IHRoaXMud2luLm9mZnNldFdpZHRoLCBoZWlnaHQgPSB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICAgICAgICAgIGlmIChub0FuaW1hdGUpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMueCA9IDBcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRXaWR0aCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMud20ub3ZlcmxheS5vZmZzZXRIZWlnaHQgKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtYXhpbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVhc2UgPSB0aGlzLmVhc2UuYWRkKHRoaXMud2luLCB7IGxlZnQ6IDAsIHRvcDogMCwgd2lkdGg6IHRoaXMud20ub3ZlcmxheS5vZmZzZXRXaWR0aCwgaGVpZ2h0OiB0aGlzLndtLm92ZXJsYXkub2Zmc2V0SGVpZ2h0IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZS5vbignY29tcGxldGUnLCAoKSA9PlxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy54ID0gMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnkgPSAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud2lkdGggPSB0aGlzLndtLm92ZXJsYXkub2Zmc2V0V2lkdGggKyAncHgnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy53bS5vdmVybGF5Lm9mZnNldEhlaWdodCArICdweCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZWQgPSB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSBmYWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtYXhpbWl6ZScsIHRoaXMpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMubWF4aW1pemUuc3R5bGUuYmFja2dyb3VuZEltYWdlID0gdGhpcy5vcHRpb25zLmJhY2tncm91bmRSZXN0b3JlQnV0dG9uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kcyB3aW5kb3cgdG8gYmFjayBvZiB3aW5kb3ctbWFuYWdlclxyXG4gICAgICovXHJcbiAgICBzZW5kVG9CYWNrKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndtLnNlbmRUb0JhY2sodGhpcylcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmQgd2luZG93IHRvIGZyb250IG9mIHdpbmRvdy1tYW5hZ2VyXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0Zyb250KClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndtLnNlbmRUb0Zyb250KHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzYXZlIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IGRhdGFcclxuICAgICAqL1xyXG4gICAgc2F2ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHt9XHJcbiAgICAgICAgY29uc3QgbWF4aW1pemVkID0gdGhpcy5tYXhpbWl6ZWRcclxuICAgICAgICBpZiAobWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5tYXhpbWl6ZWQgPSB7IGxlZnQ6IG1heGltaXplZC5sZWZ0LCB0b3A6IG1heGltaXplZC50b3AsIHdpZHRoOiBtYXhpbWl6ZWQud2lkdGgsIGhlaWdodDogbWF4aW1pemVkLmhlaWdodCB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG1pbmltaXplZCA9IHRoaXMubWluaW1pemVkXHJcbiAgICAgICAgaWYgKG1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubWluaW1pemVkID0geyB4OiB0aGlzLm1pbmltaXplZC54LCB5OiB0aGlzLm1pbmltaXplZC55LCBzY2FsZVg6IHRoaXMubWluaW1pemVkLnNjYWxlWCwgc2NhbGVZOiB0aGlzLm1pbmltaXplZC5zY2FsZVkgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBsYXN0TWluaW1pemVkID0gdGhpcy5fbGFzdE1pbmltaXplZFxyXG4gICAgICAgIGlmIChsYXN0TWluaW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5sYXN0TWluaW1pemVkID0geyBsZWZ0OiBsYXN0TWluaW1pemVkLmxlZnQsIHRvcDogbGFzdE1pbmltaXplZC50b3AgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkYXRhLnggPSB0aGlzLnhcclxuICAgICAgICBkYXRhLnkgPSB0aGlzLnlcclxuICAgICAgICBpZiAoZXhpc3RzKHRoaXMub3B0aW9ucy53aWR0aCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLndpZHRoID0gdGhpcy5vcHRpb25zLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHModGhpcy5vcHRpb25zLmhlaWdodCkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmhlaWdodCA9IHRoaXMub3B0aW9ucy5oZWlnaHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS5jbG9zZWQgPSB0aGlzLl9jbG9zZWRcclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJuIHRoZSBzdGF0ZSBvZiB0aGUgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBmcm9tIHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGRhdGEubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLm1heGltaXplZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMubWF4aW1pemVkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tYXhpbWl6ZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGF0YS5taW5pbWl6ZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmltaXplKHRydWUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZWQgPSBkYXRhLm1pbmltaXplZFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICh0aGlzLm1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubWluaW1pemUodHJ1ZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEubGFzdE1pbmltaXplZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2xhc3RNaW5pbWl6ZWQgPSBkYXRhLmxhc3RNaW5pbWl6ZWRcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy54ID0gZGF0YS54XHJcbiAgICAgICAgdGhpcy55ID0gZGF0YS55XHJcbiAgICAgICAgaWYgKGV4aXN0cyhkYXRhLndpZHRoKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSBkYXRhLndpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luLnN0eWxlLndpZHRoID0gJ2F1dG8nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChleGlzdHMoZGF0YS5oZWlnaHQpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBkYXRhLmhlaWdodFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbi5zdHlsZS5oZWlnaHQgPSAnYXV0bydcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRhdGEuY2xvc2VkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSh0cnVlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoYW5nZSB0aXRsZVxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0IHRpdGxlKCkgeyByZXR1cm4gdGhpcy5fdGl0bGUgfVxyXG4gICAgc2V0IHRpdGxlKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luVGl0bGUuaW5uZXJUZXh0ID0gdmFsdWVcclxuICAgICAgICB0aGlzLmVtaXQoJ3RpdGxlLWNoYW5nZScsIHRoaXMpXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmlnaHQgY29vcmRpbmF0ZSBvZiB3aW5kb3dcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGdldCByaWdodCgpIHsgcmV0dXJuIHRoaXMueCArIHRoaXMud2lkdGggfVxyXG4gICAgc2V0IHJpZ2h0KHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMueCA9IHZhbHVlIC0gdGhpcy53aWR0aFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYm90dG9tIGNvb3JkaW5hdGUgb2Ygd2luZG93XHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBnZXQgYm90dG9tKCkgeyByZXR1cm4gdGhpcy55ICsgdGhpcy5oZWlnaHQgfVxyXG4gICAgc2V0IGJvdHRvbSh2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICB0aGlzLnkgPSB2YWx1ZSAtIHRoaXMuaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjZW50ZXJzIHdpbmRvdyBpbiBtaWRkbGUgb2Ygb3RoZXIgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIGNlbnRlcih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICB3aW4ueCArIHdpbi53aWR0aCAvIDIgLSB0aGlzLndpZHRoIC8gMixcclxuICAgICAgICAgICAgd2luLnkgKyB3aW4uaGVpZ2h0IC8gMiAtIHRoaXMuaGVpZ2h0IC8gMlxyXG4gICAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGlzIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZVxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgaXMgcmVzdG9yZWQgdG8gbm9ybWFsIGFmdGVyIGJlaW5nIG1heGltaXplZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtYXhpbWl6ZS1yZXN0b3JlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHdpbmRvdyBpcyByZXN0b3JlZCB0byBub3JtYWwgYWZ0ZXIgYmVpbmcgbWluaW1pemVkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21pbmltaXplLXJlc3RvcmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IG9wZW5zXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I29wZW5cclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGdhaW5zIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2ZvY3VzXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2luZG93IGxvc2VzIGZvY3VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2JsdXJcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB3aW5kb3cgY2xvc2VzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I2Nsb3NlXHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHJlc2l6ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLXN0YXJ0XHJcbiAgICAgKiBAdHlwZSB7V2luZG93fVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBhZnRlciByZXNpemUgY29tcGxldGVzXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I3Jlc2l6ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyByZXNpemluZ1xyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gbW92ZSBzdGFydHNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1zdGFydFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgYWZ0ZXIgbW92ZSBjb21wbGV0ZXNcclxuICAgICAqIEBldmVudCBXaW5kb3cjbW92ZS1lbmRcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGR1cmluZyBtb3ZlXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmVcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gd2lkdGggaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNyZXNpemUtd2lkdGhcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gaGVpZ2h0IGlzIGNoYW5nZWRcclxuICAgICAqIEBldmVudCBXaW5kb3cjcmVzaXplLWhlaWdodFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB4IHBvc2l0aW9uIG9mIHdpbmRvdyBpcyBjaGFuZ2VkXHJcbiAgICAgKiBAZXZlbnQgV2luZG93I21vdmUteFxyXG4gICAgICogQHR5cGUge1dpbmRvd31cclxuICAgICAqL1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4geSBwb3NpdGlvbiBvZiB3aW5kb3cgaXMgY2hhbmdlZFxyXG4gICAgICogQGV2ZW50IFdpbmRvdyNtb3ZlLXlcclxuICAgICAqIEB0eXBlIHtXaW5kb3d9XHJcbiAgICAgKi9cclxuXHJcbiAgICBfY3JlYXRlV2luZG93KClcclxuICAgIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIGlzIHRoZSB0b3AtbGV2ZWwgRE9NIGVsZW1lbnRcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy53aW4gPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndtLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdib3JkZXItcmFkaXVzJzogdGhpcy5vcHRpb25zLmJvcmRlclJhZGl1cyxcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdtaW4td2lkdGgnOiB0aGlzLm9wdGlvbnMubWluV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnYm94LXNoYWRvdyc6IHRoaXMub3B0aW9ucy5zaGFkb3csXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ29sb3JXaW5kb3csXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IHRoaXMub3B0aW9ucy54LFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IHRoaXMub3B0aW9ucy55LFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogaXNOYU4odGhpcy5vcHRpb25zLndpZHRoKSA/IHRoaXMub3B0aW9ucy53aWR0aCA6IHRoaXMub3B0aW9ucy53aWR0aCArICdweCcsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogaXNOYU4odGhpcy5vcHRpb25zLmhlaWdodCkgPyB0aGlzLm9wdGlvbnMuaGVpZ2h0IDogdGhpcy5vcHRpb25zLmhlaWdodCArICdweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMud2luQm94ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAnY29sdW1uJyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy5taW5IZWlnaHRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5fY3JlYXRlVGl0bGViYXIoKVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBUaGlzIGlzIHRoZSBjb250ZW50IERPTSBlbGVtZW50LiBVc2UgdGhpcyB0byBhZGQgY29udGVudCB0byB0aGUgV2luZG93LlxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKiBAcmVhZG9ubHlcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmNvbnRlbnQgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ3NlY3Rpb24nLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2Jsb2NrJyxcclxuICAgICAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgICAgICdtaW4taGVpZ2h0JzogdGhpcy5taW5IZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cteCc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93LXknOiAnYXV0bydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMucmVzaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fY3JlYXRlUmVzaXplKClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMub3ZlcmxheSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd0b3AnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IHsgdGhpcy5fZG93blRpdGxlYmFyKGUpOyBlLnN0b3BQcm9wYWdhdGlvbigpIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4geyB0aGlzLl9kb3duVGl0bGViYXIoZSk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgIH1cclxuXHJcbiAgICBfZG93blRpdGxlYmFyKGUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnRyYW5zaXRpb25pbmcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudCA9IHRoaXMuX2NvbnZlcnRNb3ZlRXZlbnQoZSlcclxuICAgICAgICAgICAgdGhpcy5fbW92aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgeDogZXZlbnQucGFnZVggLSB0aGlzLngsXHJcbiAgICAgICAgICAgICAgICB5OiBldmVudC5wYWdlWSAtIHRoaXMueVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZW1pdCgnbW92ZS1zdGFydCcsIHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMuX21vdmVkID0gZmFsc2VcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZVRpdGxlYmFyKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpblRpdGxlYmFyID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5Cb3gsIHR5cGU6ICdoZWFkZXInLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXHJcbiAgICAgICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICdqdXN0aWZ5LWNvbnRlbnQnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiB0aGlzLm9wdGlvbnMudGl0bGViYXJIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHRoaXMub3B0aW9ucy50aXRsZWJhckhlaWdodCxcclxuICAgICAgICAgICAgICAgICdib3JkZXInOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAnMCA4cHgnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IHdpblRpdGxlU3R5bGVzID0ge1xyXG4gICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICdmbGV4JzogMSxcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnZmxleCcsXHJcbiAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAnYWxpZ24taXRlbXMnOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAnY3Vyc29yJzogJ2RlZmF1bHQnLFxyXG4gICAgICAgICAgICAncGFkZGluZyc6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAnZm9udC1zaXplJzogJzE2cHgnLFxyXG4gICAgICAgICAgICAnZm9udC13ZWlnaHQnOiA0MDAsXHJcbiAgICAgICAgICAgICdjb2xvcic6IHRoaXMub3B0aW9ucy5mb3JlZ3JvdW5kQ29sb3JUaXRsZVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRpdGxlQ2VudGVyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luVGl0bGVTdHlsZXNbJ2p1c3RpZnktY29udGVudCddID0gJ2NlbnRlcidcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luVGl0bGVTdHlsZXNbJ3BhZGRpbmctbGVmdCddID0gJzhweCdcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMud2luVGl0bGUgPSBodG1sKHsgcGFyZW50OiB0aGlzLndpblRpdGxlYmFyLCB0eXBlOiAnc3BhbicsIGh0bWw6IHRoaXMub3B0aW9ucy50aXRsZSwgc3R5bGVzOiB3aW5UaXRsZVN0eWxlcyB9KVxyXG4gICAgICAgIHRoaXMuX2NyZWF0ZUJ1dHRvbnMoKVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1vdmFibGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpblRpdGxlYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgICAgIHRoaXMud2luVGl0bGViYXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIChlKSA9PiB0aGlzLl9kb3duVGl0bGViYXIoZSkpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVCdXR0b25zKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbkJ1dHRvbkdyb3VwID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW5UaXRsZWJhciwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAnZGlzcGxheSc6ICdmbGV4JyxcclxuICAgICAgICAgICAgICAgICdmbGV4LWRpcmVjdGlvbic6ICdyb3cnLFxyXG4gICAgICAgICAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAncGFkZGluZy1sZWZ0JzogJzEwcHgnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbnN0IGJ1dHRvbiA9IHtcclxuICAgICAgICAgICAgJ2Rpc3BsYXknOiAnaW5saW5lLWJsb2NrJyxcclxuICAgICAgICAgICAgJ2JvcmRlcic6IDAsXHJcbiAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAnNXB4JyxcclxuICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAnd2lkdGgnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdoZWlnaHQnOiAnMTJweCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ3RyYW5zcGFyZW50JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtc2l6ZSc6ICdjb3ZlcicsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLXJlcGVhdCc6ICduby1yZXBlYXQnLFxyXG4gICAgICAgICAgICAnb3BhY2l0eSc6IC43LFxyXG4gICAgICAgICAgICAnY29sb3InOiB0aGlzLm9wdGlvbnMuZm9yZWdyb3VuZENvbG9yQnV0dG9uLFxyXG4gICAgICAgICAgICAnb3V0bGluZSc6IDBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5idXR0b25zID0ge31cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1pbmltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWluaW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1pbmltaXplID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5taW5pbWl6ZSwgKCkgPT4gdGhpcy5taW5pbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm1heGltaXphYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kTWF4aW1pemVCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLm1heGltaXplID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5tYXhpbWl6ZSwgKCkgPT4gdGhpcy5tYXhpbWl6ZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYnV0dG9uLmJhY2tncm91bmRJbWFnZSA9IHRoaXMub3B0aW9ucy5iYWNrZ3JvdW5kQ2xvc2VCdXR0b25cclxuICAgICAgICAgICAgdGhpcy5idXR0b25zLmNsb3NlID0gaHRtbCh7IHBhcmVudDogdGhpcy53aW5CdXR0b25Hcm91cCwgaHRtbDogJyZuYnNwOycsIHR5cGU6ICdidXR0b24nLCBzdHlsZXM6IGJ1dHRvbiB9KVxyXG4gICAgICAgICAgICBjbGlja2VkKHRoaXMuYnV0dG9ucy5jbG9zZSwgKCkgPT4gdGhpcy5jbG9zZSgpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5idXR0b25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgYnV0dG9uID0gdGhpcy5idXR0b25zW2tleV1cclxuICAgICAgICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsICgpID0+XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zdHlsZS5vcGFjaXR5ID0gMVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCAoKSA9PlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBidXR0b24uc3R5bGUub3BhY2l0eSA9IDAuN1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlUmVzaXplKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLnJlc2l6ZUVkZ2UgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbkJveCwgdHlwZTogJ2J1dHRvbicsIGh0bWw6ICcmbmJzcCcsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICdib3R0b20nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3JpZ2h0JzogJzRweCcsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyJzogMCxcclxuICAgICAgICAgICAgICAgICdtYXJnaW4nOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3BhZGRpbmcnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdzZS1yZXNpemUnLFxyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQnOiB0aGlzLm9wdGlvbnMuYmFja2dyb3VuZFJlc2l6ZSxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTVweCcsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTBweCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uc3QgZG93biA9IChlKSA9PlxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMud20uX2NoZWNrTW9kYWwodGhpcykpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fY29udmVydE1vdmVFdmVudChlKVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLndpZHRoIHx8IHRoaXMud2luLm9mZnNldFdpZHRoXHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSB0aGlzLmhlaWdodCB8fCB0aGlzLndpbi5vZmZzZXRIZWlnaHRcclxuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc2l6aW5nID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCAtIGV2ZW50LnBhZ2VYLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0IC0gZXZlbnQucGFnZVlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZW1pdCgncmVzaXplLXN0YXJ0JylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBkb3duKVxyXG4gICAgICAgIHRoaXMucmVzaXplRWRnZS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgZG93bilcclxuICAgIH1cclxuXHJcbiAgICBfbW92ZShlKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLndtLl9jaGVja01vZGFsKHRoaXMpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuX2lzVG91Y2hFdmVudChlKSAmJiBlLndoaWNoICE9PSAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9tb3ZpbmcgJiYgdGhpcy5fc3RvcE1vdmUoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuX21vdmluZylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21vdmVkID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3ZlKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYIC0gdGhpcy5fbW92aW5nLngsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgLSB0aGlzLl9tb3ZpbmcueVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdtb3ZlJywgdGhpcylcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fcmVzaXppbmcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnBhZ2VYICsgdGhpcy5fcmVzaXppbmcud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucGFnZVkgKyB0aGlzLl9yZXNpemluZy5oZWlnaHRcclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIHRoaXMubWF4aW1pemVkID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0KCdyZXNpemUnLCB0aGlzKVxyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3VwKClcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5fbW92aW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWluaW1pemVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX21vdmVkKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluaW1pemUoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3N0b3BNb3ZlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcmVzaXppbmcgJiYgdGhpcy5fc3RvcFJlc2l6ZSgpXHJcbiAgICB9XHJcblxyXG4gICAgX2xpc3RlbmVycygpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKCkgPT4gdGhpcy5mb2N1cygpKVxyXG4gICAgICAgIHRoaXMud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoKSA9PiB0aGlzLmZvY3VzKCkpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BNb3ZlKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9tb3ZpbmcgPSBudWxsXHJcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlLWVuZCcsIHRoaXMpXHJcbiAgICB9XHJcblxyXG4gICAgX3N0b3BSZXNpemUoKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX3Jlc3RvcmUgPSB0aGlzLl9yZXNpemluZyA9IG51bGxcclxuICAgICAgICB0aGlzLmVtaXQoJ3Jlc2l6ZS1lbmQnLCB0aGlzKVxyXG4gICAgfVxyXG5cclxuICAgIF9pc1RvdWNoRXZlbnQoZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuVG91Y2hFdmVudCAmJiAoZSBpbnN0YW5jZW9mIHdpbmRvdy5Ub3VjaEV2ZW50KVxyXG4gICAgfVxyXG5cclxuICAgIF9jb252ZXJ0TW92ZUV2ZW50KGUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2lzVG91Y2hFdmVudChlKSA/IGUuY2hhbmdlZFRvdWNoZXNbMF0gOiBlXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHooKSB7IHJldHVybiBwYXJzZUludCh0aGlzLndpbi5zdHlsZS56SW5kZXgpIH1cclxuICAgIHNldCB6KHZhbHVlKSB7IHRoaXMud2luLnN0eWxlLnpJbmRleCA9IHZhbHVlIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3ciXX0=