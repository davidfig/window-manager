'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var exists = require('exists');

var html = require('./html');
var Window = require('./window');
var WindowOptions = require('./window-options');
var Snap = require('./snap');

/**
 * Creates a windowing system to create and manage windows
 *
 * @extends EventEmitter
 * @example
 * var wm = new WindowManager();
 *
 * wm.createWindow({ x: 20, y: 20, width: 200 });
 * wm.content.innerHTML = 'Hello there!';
 */

var WindowManager = function () {
    /**
     * @param {Window~WindowOptions} [defaultOptions] default WindowOptions used when createWindow is called
     * @param {boolean} [defaultOptions.quiet] suppress the simple-window-manager console message
     * @param {object} [defaultOptions.snap] turn on edge snapping
     * @param {boolean} [defaultOptions.snap.screen=true] snap to edge of screen
     * @param {boolean} [defaultOptions.snap.windows=true] snap to windows
     * @param {number} [defaultOptions.snap.snap=20] distance to edge before snapping and width/height of snap bars
     * @param {string} [defaultOptions.snap.color=#a8f0f4] color for snap bars
     * @param {number} [defaultOptions.snap.spacing=5] spacing distance between window and edges
     */
    function WindowManager(defaultOptions) {
        _classCallCheck(this, WindowManager);

        this.windows = [];
        this.active = null;
        this.modal = null;
        this.options = {};
        for (var key in WindowOptions) {
            this.options[key] = WindowOptions[key];
        }
        if (defaultOptions) {
            for (var _key in defaultOptions) {
                this.options[_key] = defaultOptions[_key];
            }
        }
        if (!defaultOptions || !defaultOptions.quiet) {
            console.log('%c ☕ simple-window-manager initialized ☕', 'color: #ff00ff');
        }
        this._createDom();
        this.plugins = [];
        if (defaultOptions && defaultOptions['snap']) {
            this.snap(defaultOptions['snap']);
        }
    }

    /**
     * Create a window
     * @param {Window~WindowOptions} [options]
     * @param {string} [options.title]
     * @param {number} [options.x] position
     * @param {number} [options.y] position
     * @param {boolean} [options.modal]
     * @param {string|number} [options.id] if not provide, id will be assigned in order of creation (0, 1, 2...)
     * @returns {Window} the created window
     */


    _createClass(WindowManager, [{
        key: 'createWindow',
        value: function createWindow(options) {
            var _this = this;

            options = options || {};
            for (var key in this.options) {
                if (!exists(options[key])) {
                    options[key] = this.options[key];
                }
            }
            var win = new Window(this, options);
            win.on('open', this._open, this);
            win.on('focus', this._focus, this);
            win.on('blur', this._blur, this);
            win.on('close', this._close, this);
            win.win.addEventListener('mousemove', function (e) {
                return _this._move(e);
            });
            win.win.addEventListener('touchmove', function (e) {
                return _this._move(e);
            });
            win.win.addEventListener('mouseup', function (e) {
                return _this._up(e);
            });
            win.win.addEventListener('touchend', function (e) {
                return _this._up(e);
            });
            if (this.plugins['snap'] && !options.noSnap) {
                this.plugins['snap'].addWindow(win);
            }
            return win;
        }

        /**
         * Attach an existing window to the WindowManager
         * Note: WindowManager.createWindow is the preferred way to create windows to ensure that all the global options
         * are applied to the Window. If you use this function, then Window needs to be initialized with WindowOptions.
         * @param {Window} win
         * @returns {Window} the window
         */

    }, {
        key: 'attachWindow',
        value: function attachWindow(win) {
            var _this2 = this;

            win.on('open', this._open, this);
            win.on('focus', this._focus, this);
            win.on('blur', this._blur, this);
            win.on('close', this._close, this);
            this.win.appendChild(win.win);
            win.wm = this;
            win.ease.options.duration = this.options.animateTime;
            win.ease.options.ease = this.options.ease;
            win.win.addEventListener('mousemove', function (e) {
                return _this2._move(e);
            });
            win.win.addEventListener('touchmove', function (e) {
                return _this2._move(e);
            });
            win.win.addEventListener('mouseup', function (e) {
                return _this2._up(e);
            });
            win.win.addEventListener('touchend', function (e) {
                return _this2._up(e);
            });
            if (win.modal) {
                this.modal = win;
            }
            if (this.plugins['snap'] && !this.options.noSnap) {
                this.plugins['snap'].addWindow(win);
            }
            return win;
        }

        /**
         * add edge snapping plugin
         * @param {object} options
         * @param {boolean} [options.screen=true] snap to screen edges
         * @param {boolean} [options.windows=true] snap to window edges
         * @param {number} [options.snap=20] distance to edge before snapping
         * @param {string} [options.color=#a8f0f4] color for snap bars
         * @param {number} [options.spacing=0] spacing distance between window and edges
         */

    }, {
        key: 'snap',
        value: function snap(options) {
            this.plugins['snap'] = new Snap(this, options);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.windows[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var win = _step.value;

                    if (!win.options.noSnap) {
                        this.plugins['snap'].addWindow(win);
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }

        /**
         * remove plugin
         * @param {string} name of plugin
         */

    }, {
        key: 'removePlugin',
        value: function removePlugin(name) {
            if (this.plugins[name]) {
                this.plugins[name].stop();
                delete this.plugins[name];
            }
        }

        /**
         * send window to front
         * @param {Window} win
         */

    }, {
        key: 'sendToFront',
        value: function sendToFront(win) {
            var index = this.windows.indexOf(win);
            if (index !== this.windows.length - 1) {
                this.windows.splice(index, 1);
                this.windows.push(win);
                this._reorder();
            }
        }

        /**
         * send window to back
         * @param {Window} win
         */

    }, {
        key: 'sendToBack',
        value: function sendToBack(win) {
            var index = this.windows.indexOf(win);
            if (index !== 0) {
                this.windows.splice(index, 1);
                this.windows.unshift(win);
                this._reorder();
            }
        }

        /**
         * save the state of all the windows
         * @returns {object} use this object in load() to restore the state of all windows
         */

    }, {
        key: 'save',
        value: function save() {
            var data = {};
            for (var i = 0; i < this.windows.length; i++) {
                var entry = this.windows[i];
                data[entry.id] = entry.save();
                data[entry.id].order = i;
            }
            return data;
        }

        /**
         * restores the state of all the windows
         * NOTE: this requires that the windows have the same id as when save() was called
         * @param {object} data created by save()
         */

    }, {
        key: 'load',
        value: function load(data) {
            for (var i = 0; i < this.windows.length; i++) {
                var entry = this.windows[i];
                if (data[entry.id]) {
                    entry.load(data[entry.id]);
                }
            }
            // reorder windows
        }

        /**
         * close all windows
         */

    }, {
        key: 'closeAll',
        value: function closeAll() {
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.windows[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var win = _step2.value;

                    win.close();
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            this.windows = [];
            this.modalOverlay.remove();
            this.active = this.modal = null;
        }

        /**
         * reorder windows
         * @private
         * @returns {number} available z-index for top window
         */

    }, {
        key: '_reorder',
        value: function _reorder() {
            var i = 0;
            for (; i < this.windows.length; i++) {
                this.windows[i].z = i;
            }
        }
    }, {
        key: '_createDom',
        value: function _createDom() {
            var _this3 = this;

            /**
             * This is the top-level DOM element
             * @type {HTMLElement}
             * @readonly
             */
            this.win = html({
                parent: document.body, styles: {
                    'user-select': 'none',
                    'width': '100%',
                    'height': '100%',
                    'overflow': 'hidden',
                    'z-index': -1,
                    'cursor': 'default'
                }
            });

            /**
             * This is the bottom DOM element. Use this to set a wallpaper or attach elements underneath the windows
             * @type {HTMLElement}
             * @readonly
             */
            this.overlay = html({
                parent: this.win, styles: {
                    'user-select': 'none',
                    'position': 'absolute',
                    'top': 0,
                    'left': 0,
                    'width': '100%',
                    'height': '100%',
                    'overflow': 'hidden'
                }
            });
            this.overlay.addEventListener('mousemove', function (e) {
                return _this3._move(e);
            });
            this.overlay.addEventListener('touchmove', function (e) {
                return _this3._move(e);
            });
            this.overlay.addEventListener('mouseup', function (e) {
                return _this3._up(e);
            });
            this.overlay.addEventListener('touchend', function (e) {
                return _this3._up(e);
            });

            this.modalOverlay = html({
                styles: {
                    'user-select': 'none',
                    'position': 'absolute',
                    'top': 0,
                    'left': 0,
                    'width': '100%',
                    'height': '100%',
                    'overflow': 'hidden',
                    'background': this.options.modalBackground
                }
            });
            this.modalOverlay.addEventListener('mousemove', function (e) {
                _this3._move(e);e.preventDefault();e.stopPropagation();
            });
            this.modalOverlay.addEventListener('touchmove', function (e) {
                _this3._move(e);e.preventDefault();e.stopPropagation();
            });
            this.modalOverlay.addEventListener('mouseup', function (e) {
                _this3._up(e);e.preventDefault();e.stopPropagation();
            });
            this.modalOverlay.addEventListener('touchend', function (e) {
                _this3._up(e);e.preventDefault();e.stopPropagation();
            });
            this.modalOverlay.addEventListener('mousedown', function (e) {
                e.preventDefault();e.stopPropagation();
            });
            this.modalOverlay.addEventListener('touchstart', function (e) {
                e.preventDefault();e.stopPropagation();
            });
        }
    }, {
        key: '_open',
        value: function _open(win) {
            var index = this.windows.indexOf(win);
            if (index === -1) {
                this.windows.push(win);
            }
            if (win.options.modal) {
                this._focus(win);
                this.modal = win;
                this.win.appendChild(this.modalOverlay);
                this.modalOverlay.style.zIndex = win.z - 1;
            }
        }
    }, {
        key: '_focus',
        value: function _focus(win) {
            if (this.active === win) {
                return;
            }

            if (this.active) {
                this.active.blur();
            }

            var index = this.windows.indexOf(win);
            if (index !== this.windows.length - 1) {
                this.windows.splice(index, 1);
                this.windows.push(win);
            }
            this._reorder();

            this.active = win;
        }
    }, {
        key: '_blur',
        value: function _blur(win) {
            if (this.active === win) {
                this.active = null;
            }
        }
    }, {
        key: '_close',
        value: function _close(win) {
            if (this.modal === win) {
                this.modalOverlay.remove();
                this.modal = null;
            }
            var index = this.windows.indexOf(win);
            if (index !== -1) {
                this.windows.splice(index, 1);
            }
            if (this.active === win) {
                this._blur(win);
            }
        }
    }, {
        key: '_move',
        value: function _move(e) {
            for (var key in this.windows) {
                this.windows[key]._move(e);
            }
        }
    }, {
        key: '_up',
        value: function _up(e) {
            for (var key in this.windows) {
                this.windows[key]._up(e);
            }
        }
    }, {
        key: '_checkModal',
        value: function _checkModal(win) {
            return !this.modal || this.modal === win;
        }
    }]);

    return WindowManager;
}();

WindowManager.Window = Window;
WindowManager.WindowOptions = WindowOptions;

module.exports = WindowManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3ctbWFuYWdlci5qcyJdLCJuYW1lcyI6WyJleGlzdHMiLCJyZXF1aXJlIiwiaHRtbCIsIldpbmRvdyIsIldpbmRvd09wdGlvbnMiLCJTbmFwIiwiV2luZG93TWFuYWdlciIsImRlZmF1bHRPcHRpb25zIiwid2luZG93cyIsImFjdGl2ZSIsIm1vZGFsIiwib3B0aW9ucyIsImtleSIsInF1aWV0IiwiY29uc29sZSIsImxvZyIsIl9jcmVhdGVEb20iLCJwbHVnaW5zIiwic25hcCIsIndpbiIsIm9uIiwiX29wZW4iLCJfZm9jdXMiLCJfYmx1ciIsIl9jbG9zZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX21vdmUiLCJfdXAiLCJub1NuYXAiLCJhZGRXaW5kb3ciLCJhcHBlbmRDaGlsZCIsIndtIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJuYW1lIiwic3RvcCIsImluZGV4IiwiaW5kZXhPZiIsImxlbmd0aCIsInNwbGljZSIsInB1c2giLCJfcmVvcmRlciIsInVuc2hpZnQiLCJkYXRhIiwiaSIsImVudHJ5IiwiaWQiLCJzYXZlIiwib3JkZXIiLCJsb2FkIiwiY2xvc2UiLCJtb2RhbE92ZXJsYXkiLCJyZW1vdmUiLCJ6IiwicGFyZW50IiwiZG9jdW1lbnQiLCJib2R5Iiwic3R5bGVzIiwib3ZlcmxheSIsIm1vZGFsQmFja2dyb3VuZCIsInByZXZlbnREZWZhdWx0Iiwic3RvcFByb3BhZ2F0aW9uIiwic3R5bGUiLCJ6SW5kZXgiLCJibHVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxRQUFSLENBQWY7O0FBRUEsSUFBTUMsT0FBT0QsUUFBUSxRQUFSLENBQWI7QUFDQSxJQUFNRSxTQUFTRixRQUFRLFVBQVIsQ0FBZjtBQUNBLElBQU1HLGdCQUFnQkgsUUFBUSxrQkFBUixDQUF0QjtBQUNBLElBQU1JLE9BQU9KLFFBQVEsUUFBUixDQUFiOztBQUVBOzs7Ozs7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Q0FBeEI7QUFDSDtBQUNKOzs7NEJBRUdBLEMsRUFDSjtBQUNJLGlCQUFLLElBQUlkLEdBQVQsSUFBZ0IsS0FBS0osT0FBckIsRUFDQTtBQUNJLHFCQUFLQSxPQUFMLENBQWFJLEdBQWIsRUFBa0JnQixHQUFsQixDQUFzQkYsQ0FBdEI7QUFDSDtBQUNKOzs7b0NBRVdQLEcsRUFDWjtBQUNJLG1CQUFPLENBQUMsS0FBS1QsS0FBTixJQUFlLEtBQUtBLEtBQUwsS0FBZVMsR0FBckM7QUFDSDs7Ozs7O0FBR0xiLGNBQWNILE1BQWQsR0FBdUJBLE1BQXZCO0FBQ0FHLGNBQWNGLGFBQWQsR0FBOEJBLGFBQTlCOztBQUVBK0QsT0FBT0MsT0FBUCxHQUFpQjlELGFBQWpCIiwiZmlsZSI6IndpbmRvdy1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5jb25zdCBXaW5kb3cgPSByZXF1aXJlKCcuL3dpbmRvdycpXHJcbmNvbnN0IFdpbmRvd09wdGlvbnMgPSByZXF1aXJlKCcuL3dpbmRvdy1vcHRpb25zJylcclxuY29uc3QgU25hcCA9IHJlcXVpcmUoJy4vc25hcCcpXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHdpbmRvd2luZyBzeXN0ZW0gdG8gY3JlYXRlIGFuZCBtYW5hZ2Ugd2luZG93c1xyXG4gKlxyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcclxuICogQGV4YW1wbGVcclxuICogdmFyIHdtID0gbmV3IFdpbmRvd01hbmFnZXIoKTtcclxuICpcclxuICogd20uY3JlYXRlV2luZG93KHsgeDogMjAsIHk6IDIwLCB3aWR0aDogMjAwIH0pO1xyXG4gKiB3bS5jb250ZW50LmlubmVySFRNTCA9ICdIZWxsbyB0aGVyZSEnO1xyXG4gKi9cclxuY2xhc3MgV2luZG93TWFuYWdlclxyXG57XHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7V2luZG93fldpbmRvd09wdGlvbnN9IFtkZWZhdWx0T3B0aW9uc10gZGVmYXVsdCBXaW5kb3dPcHRpb25zIHVzZWQgd2hlbiBjcmVhdGVXaW5kb3cgaXMgY2FsbGVkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtkZWZhdWx0T3B0aW9ucy5xdWlldF0gc3VwcHJlc3MgdGhlIHNpbXBsZS13aW5kb3ctbWFuYWdlciBjb25zb2xlIG1lc3NhZ2VcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZGVmYXVsdE9wdGlvbnMuc25hcF0gdHVybiBvbiBlZGdlIHNuYXBwaW5nXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtkZWZhdWx0T3B0aW9ucy5zbmFwLnNjcmVlbj10cnVlXSBzbmFwIHRvIGVkZ2Ugb2Ygc2NyZWVuXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtkZWZhdWx0T3B0aW9ucy5zbmFwLndpbmRvd3M9dHJ1ZV0gc25hcCB0byB3aW5kb3dzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2RlZmF1bHRPcHRpb25zLnNuYXAuc25hcD0yMF0gZGlzdGFuY2UgdG8gZWRnZSBiZWZvcmUgc25hcHBpbmcgYW5kIHdpZHRoL2hlaWdodCBvZiBzbmFwIGJhcnNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbZGVmYXVsdE9wdGlvbnMuc25hcC5jb2xvcj0jYThmMGY0XSBjb2xvciBmb3Igc25hcCBiYXJzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2RlZmF1bHRPcHRpb25zLnNuYXAuc3BhY2luZz01XSBzcGFjaW5nIGRpc3RhbmNlIGJldHdlZW4gd2luZG93IGFuZCBlZGdlc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihkZWZhdWx0T3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbmRvd3MgPSBbXVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gbnVsbFxyXG4gICAgICAgIHRoaXMubW9kYWwgPSBudWxsXHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0ge31cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gV2luZG93T3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc1trZXldID0gV2luZG93T3B0aW9uc1trZXldXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZWZhdWx0T3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBkZWZhdWx0T3B0aW9ucylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV0gPSBkZWZhdWx0T3B0aW9uc1trZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFkZWZhdWx0T3B0aW9ucyB8fCAhZGVmYXVsdE9wdGlvbnMucXVpZXQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJWMg4piVIHNpbXBsZS13aW5kb3ctbWFuYWdlciBpbml0aWFsaXplZCDimJUnLCAnY29sb3I6ICNmZjAwZmYnKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9jcmVhdGVEb20oKVxyXG4gICAgICAgIHRoaXMucGx1Z2lucyA9IFtdXHJcbiAgICAgICAgaWYgKGRlZmF1bHRPcHRpb25zICYmIGRlZmF1bHRPcHRpb25zWydzbmFwJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNuYXAoZGVmYXVsdE9wdGlvbnNbJ3NuYXAnXSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7V2luZG93fldpbmRvd09wdGlvbnN9IFtvcHRpb25zXVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRpdGxlXVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnhdIHBvc2l0aW9uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueV0gcG9zaXRpb25cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubW9kYWxdXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtvcHRpb25zLmlkXSBpZiBub3QgcHJvdmlkZSwgaWQgd2lsbCBiZSBhc3NpZ25lZCBpbiBvcmRlciBvZiBjcmVhdGlvbiAoMCwgMSwgMi4uLilcclxuICAgICAqIEByZXR1cm5zIHtXaW5kb3d9IHRoZSBjcmVhdGVkIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBjcmVhdGVXaW5kb3cob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLm9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIWV4aXN0cyhvcHRpb25zW2tleV0pKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zW2tleV0gPSB0aGlzLm9wdGlvbnNba2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHdpbiA9IG5ldyBXaW5kb3codGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgd2luLm9uKCdvcGVuJywgdGhpcy5fb3BlbiwgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2ZvY3VzJywgdGhpcy5fZm9jdXMsIHRoaXMpXHJcbiAgICAgICAgd2luLm9uKCdibHVyJywgdGhpcy5fYmx1ciwgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2Nsb3NlJywgdGhpcy5fY2xvc2UsIHRoaXMpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4gdGhpcy5fbW92ZShlKSlcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIChlKSA9PiB0aGlzLl91cChlKSlcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIGlmICh0aGlzLnBsdWdpbnNbJ3NuYXAnXSAmJiAhb3B0aW9ucy5ub1NuYXApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNbJ3NuYXAnXS5hZGRXaW5kb3cod2luKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gd2luXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBdHRhY2ggYW4gZXhpc3Rpbmcgd2luZG93IHRvIHRoZSBXaW5kb3dNYW5hZ2VyXHJcbiAgICAgKiBOb3RlOiBXaW5kb3dNYW5hZ2VyLmNyZWF0ZVdpbmRvdyBpcyB0aGUgcHJlZmVycmVkIHdheSB0byBjcmVhdGUgd2luZG93cyB0byBlbnN1cmUgdGhhdCBhbGwgdGhlIGdsb2JhbCBvcHRpb25zXHJcbiAgICAgKiBhcmUgYXBwbGllZCB0byB0aGUgV2luZG93LiBJZiB5b3UgdXNlIHRoaXMgZnVuY3Rpb24sIHRoZW4gV2luZG93IG5lZWRzIHRvIGJlIGluaXRpYWxpemVkIHdpdGggV2luZG93T3B0aW9ucy5cclxuICAgICAqIEBwYXJhbSB7V2luZG93fSB3aW5cclxuICAgICAqIEByZXR1cm5zIHtXaW5kb3d9IHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgYXR0YWNoV2luZG93KHdpbilcclxuICAgIHtcclxuICAgICAgICB3aW4ub24oJ29wZW4nLCB0aGlzLl9vcGVuLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignZm9jdXMnLCB0aGlzLl9mb2N1cywgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2JsdXInLCB0aGlzLl9ibHVyLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignY2xvc2UnLCB0aGlzLl9jbG9zZSwgdGhpcylcclxuICAgICAgICB0aGlzLndpbi5hcHBlbmRDaGlsZCh3aW4ud2luKVxyXG4gICAgICAgIHdpbi53bSA9IHRoaXNcclxuICAgICAgICB3aW4uZWFzZS5vcHRpb25zLmR1cmF0aW9uID0gdGhpcy5vcHRpb25zLmFuaW1hdGVUaW1lXHJcbiAgICAgICAgd2luLmVhc2Uub3B0aW9ucy5lYXNlID0gdGhpcy5vcHRpb25zLmVhc2VcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICAgICAgaWYgKHdpbi5tb2RhbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kYWwgPSB3aW5cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1snc25hcCddICYmICF0aGlzLm9wdGlvbnMubm9TbmFwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW5zWydzbmFwJ10uYWRkV2luZG93KHdpbilcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHdpblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkIGVkZ2Ugc25hcHBpbmcgcGx1Z2luXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5zY3JlZW49dHJ1ZV0gc25hcCB0byBzY3JlZW4gZWRnZXNcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMud2luZG93cz10cnVlXSBzbmFwIHRvIHdpbmRvdyBlZGdlc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNuYXA9MjBdIGRpc3RhbmNlIHRvIGVkZ2UgYmVmb3JlIHNuYXBwaW5nXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY29sb3I9I2E4ZjBmNF0gY29sb3IgZm9yIHNuYXAgYmFyc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNwYWNpbmc9MF0gc3BhY2luZyBkaXN0YW5jZSBiZXR3ZWVuIHdpbmRvdyBhbmQgZWRnZXNcclxuICAgICAqL1xyXG4gICAgc25hcChvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucGx1Z2luc1snc25hcCddID0gbmV3IFNuYXAodGhpcywgb3B0aW9ucylcclxuICAgICAgICBmb3IgKGxldCB3aW4gb2YgdGhpcy53aW5kb3dzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF3aW4ub3B0aW9ucy5ub1NuYXApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luc1snc25hcCddLmFkZFdpbmRvdyh3aW4pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgcGx1Z2luXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiBwbHVnaW5cclxuICAgICAqL1xyXG4gICAgcmVtb3ZlUGx1Z2luKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1tuYW1lXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1tuYW1lXS5zdG9wKClcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMucGx1Z2luc1tuYW1lXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmQgd2luZG93IHRvIGZyb250XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0Zyb250KHdpbilcclxuICAgIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMud2luZG93cy5sZW5ndGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgICAgICB0aGlzLl9yZW9yZGVyKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBiYWNrXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0JhY2sod2luKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy53aW5kb3dzLmluZGV4T2Yod2luKVxyXG4gICAgICAgIGlmIChpbmRleCAhPT0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy51bnNoaWZ0KHdpbilcclxuICAgICAgICAgICAgdGhpcy5fcmVvcmRlcigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2F2ZSB0aGUgc3RhdGUgb2YgYWxsIHRoZSB3aW5kb3dzXHJcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSB1c2UgdGhpcyBvYmplY3QgaW4gbG9hZCgpIHRvIHJlc3RvcmUgdGhlIHN0YXRlIG9mIGFsbCB3aW5kb3dzXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7fVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aW5kb3dzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLndpbmRvd3NbaV1cclxuICAgICAgICAgICAgZGF0YVtlbnRyeS5pZF0gPSBlbnRyeS5zYXZlKClcclxuICAgICAgICAgICAgZGF0YVtlbnRyeS5pZF0ub3JkZXIgPSBpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXN0b3JlcyB0aGUgc3RhdGUgb2YgYWxsIHRoZSB3aW5kb3dzXHJcbiAgICAgKiBOT1RFOiB0aGlzIHJlcXVpcmVzIHRoYXQgdGhlIHdpbmRvd3MgaGF2ZSB0aGUgc2FtZSBpZCBhcyB3aGVuIHNhdmUoKSB3YXMgY2FsbGVkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBjcmVhdGVkIGJ5IHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndpbmRvd3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMud2luZG93c1tpXVxyXG4gICAgICAgICAgICBpZiAoZGF0YVtlbnRyeS5pZF0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGVudHJ5LmxvYWQoZGF0YVtlbnRyeS5pZF0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcmVvcmRlciB3aW5kb3dzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjbG9zZSBhbGwgd2luZG93c1xyXG4gICAgICovXHJcbiAgICBjbG9zZUFsbCgpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgd2luIG9mIHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpbi5jbG9zZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMud2luZG93cyA9IFtdXHJcbiAgICAgICAgdGhpcy5tb2RhbE92ZXJsYXkucmVtb3ZlKClcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRoaXMubW9kYWwgPSBudWxsXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW9yZGVyIHdpbmRvd3NcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBhdmFpbGFibGUgei1pbmRleCBmb3IgdG9wIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBfcmVvcmRlcigpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGkgPSAwXHJcbiAgICAgICAgZm9yICg7IGkgPCB0aGlzLndpbmRvd3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3NbaV0ueiA9IGlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZURvbSgpXHJcbiAgICB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgdG9wLWxldmVsIERPTSBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqIEByZWFkb25seVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMud2luID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogZG9jdW1lbnQuYm9keSwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAnei1pbmRleCc6IC0xLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdkZWZhdWx0J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgYm90dG9tIERPTSBlbGVtZW50LiBVc2UgdGhpcyB0byBzZXQgYSB3YWxscGFwZXIgb3IgYXR0YWNoIGVsZW1lbnRzIHVuZGVybmVhdGggdGhlIHdpbmRvd3NcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICd0b3AnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4gdGhpcy5fbW92ZShlKSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG5cclxuICAgICAgICB0aGlzLm1vZGFsT3ZlcmxheSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kJzogdGhpcy5vcHRpb25zLm1vZGFsQmFja2dyb3VuZFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm1vZGFsT3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4geyB0aGlzLl9tb3ZlKGUpOyBlLnByZXZlbnREZWZhdWx0KCk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgICAgICB0aGlzLm1vZGFsT3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCAoZSkgPT4geyB0aGlzLl9tb3ZlKGUpOyBlLnByZXZlbnREZWZhdWx0KCk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgICAgICB0aGlzLm1vZGFsT3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHsgdGhpcy5fdXAoZSk7IGUucHJldmVudERlZmF1bHQoKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMubW9kYWxPdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgKGUpID0+IHsgdGhpcy5fdXAoZSk7IGUucHJldmVudERlZmF1bHQoKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMubW9kYWxPdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiB7IGUucHJldmVudERlZmF1bHQoKTsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG4gICAgICAgIHRoaXMubW9kYWxPdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCAoZSkgPT4geyBlLnByZXZlbnREZWZhdWx0KCk7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuICAgIH1cclxuXHJcbiAgICBfb3Blbih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5wdXNoKHdpbilcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHdpbi5vcHRpb25zLm1vZGFsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fZm9jdXMod2luKVxyXG4gICAgICAgICAgICB0aGlzLm1vZGFsID0gd2luXHJcbiAgICAgICAgICAgIHRoaXMud2luLmFwcGVuZENoaWxkKHRoaXMubW9kYWxPdmVybGF5KVxyXG4gICAgICAgICAgICB0aGlzLm1vZGFsT3ZlcmxheS5zdHlsZS56SW5kZXggPSB3aW4ueiAtIDFcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2ZvY3VzKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHdpbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUuYmx1cigpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMud2luZG93cy5sZW5ndGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZW9yZGVyKClcclxuXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB3aW5cclxuICAgIH1cclxuXHJcbiAgICBfYmx1cih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSB3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2Nsb3NlKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5tb2RhbCA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RhbE92ZXJsYXkucmVtb3ZlKClcclxuICAgICAgICAgICAgdGhpcy5tb2RhbCA9IG51bGxcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fYmx1cih3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9tb3ZlKGUpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93c1trZXldLl9tb3ZlKGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF91cChlKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLndpbmRvd3MpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Nba2V5XS5fdXAoZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NoZWNrTW9kYWwod2luKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhdGhpcy5tb2RhbCB8fCB0aGlzLm1vZGFsID09PSB3aW5cclxuICAgIH1cclxufVxyXG5cclxuV2luZG93TWFuYWdlci5XaW5kb3cgPSBXaW5kb3dcclxuV2luZG93TWFuYWdlci5XaW5kb3dPcHRpb25zID0gV2luZG93T3B0aW9uc1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3dNYW5hZ2VyIl19