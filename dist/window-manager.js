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

        this._createDom();
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
            if (options.modal) {
                this.modal = win;
            }
            if (this.plugins['snap'] && !this.options.noSnap) {
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
        }
    }, {
        key: '_open',
        value: function _open(win) {
            var index = this.windows.indexOf(win);
            if (index === -1) {
                this.windows.push(win);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3ctbWFuYWdlci5qcyJdLCJuYW1lcyI6WyJleGlzdHMiLCJyZXF1aXJlIiwiaHRtbCIsIldpbmRvdyIsIldpbmRvd09wdGlvbnMiLCJTbmFwIiwiV2luZG93TWFuYWdlciIsImRlZmF1bHRPcHRpb25zIiwiX2NyZWF0ZURvbSIsIndpbmRvd3MiLCJhY3RpdmUiLCJtb2RhbCIsIm9wdGlvbnMiLCJrZXkiLCJxdWlldCIsImNvbnNvbGUiLCJsb2ciLCJwbHVnaW5zIiwic25hcCIsIndpbiIsIm9uIiwiX29wZW4iLCJfZm9jdXMiLCJfYmx1ciIsIl9jbG9zZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX21vdmUiLCJfdXAiLCJub1NuYXAiLCJhZGRXaW5kb3ciLCJhcHBlbmRDaGlsZCIsIndtIiwiZWFzZSIsImR1cmF0aW9uIiwiYW5pbWF0ZVRpbWUiLCJuYW1lIiwic3RvcCIsImluZGV4IiwiaW5kZXhPZiIsImxlbmd0aCIsInNwbGljZSIsInB1c2giLCJfcmVvcmRlciIsInVuc2hpZnQiLCJkYXRhIiwiaSIsImVudHJ5IiwiaWQiLCJzYXZlIiwib3JkZXIiLCJsb2FkIiwiY2xvc2UiLCJ6IiwicGFyZW50IiwiZG9jdW1lbnQiLCJib2R5Iiwic3R5bGVzIiwib3ZlcmxheSIsImJsdXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFNQSxTQUFTQyxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNQyxPQUFPRCxRQUFRLFFBQVIsQ0FBYjtBQUNBLElBQU1FLFNBQVNGLFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBTUcsZ0JBQWdCSCxRQUFRLGtCQUFSLENBQXRCO0FBQ0EsSUFBTUksT0FBT0osUUFBUSxRQUFSLENBQWI7O0FBRUE7Ozs7Ozs7Ozs7O0lBVU1LLGE7QUFFRjs7Ozs7Ozs7OztBQVVBLDJCQUFZQyxjQUFaLEVBQ0E7QUFBQTs7QUFDSSxhQUFLQyxVQUFMO0FBQ0EsYUFBS0MsT0FBTCxHQUFlLEVB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Q0E7QUFDSSxxQkFBS1QsTUFBTCxHQUFjLElBQWQ7QUFDSDtBQUNKOzs7K0JBRU1TLEcsRUFDUDtBQUNJLGdCQUFJLEtBQUtSLEtBQUwsS0FBZVEsR0FBbkIsRUFDQTtBQUNJLHFCQUFLUixLQUFMLEdBQWEsSUFBYjtBQUNIO0FBQ0QsZ0JBQU0yQixRQUFRLEtBQUs3QixPQUFMLENBQWE4QixPQUFiLENBQXFCcEIsR0FBckIsQ0FBZDtBQUNBLGdCQUFJbUIsVUFBVSxDQUFDLENBQWYsRUFDQTtBQUNJLHFCQUFLN0IsT0FBTCxDQUFhZ0MsTUFBYixDQUFvQkgsS0FBcEIsRUFBMkIsQ0FBM0I7QUFDSDtBQUNELGdCQUFJLEtBQUs1QixNQUFMLEtBQWdCUyxHQUFwQixFQUNBO0FBQ0kscUJBQUtJLEtBQUwsQ0FBV0osR0FBWDtBQUNIO0FBQ0o7Ozs4QkFFS08sQyxFQUNOO0FBQ0ksaUJBQUssSUFBSWIsR0FBVCxJQUFnQixLQUFLSixPQUFyQixFQUNBO0FBQ0kscUJBQUtBLE9BQUwsQ0FBYUksR0FBYixFQUFrQmMsS0FBbEIsQ0FBd0JELENBQXhCO0FBQ0g7QUFDSjs7OzRCQUVHQSxDLEVBQ0o7QUFDSSxpQkFBSyxJQUFJYixHQUFULElBQWdCLEtBQUtKLE9BQXJCLEVBQ0E7QUFDSSxxQkFBS0EsT0FBTCxDQUFhSSxHQUFiLEVBQWtCZSxHQUFsQixDQUFzQkYsQ0FBdEI7QUFDSDtBQUNKOzs7b0NBRVdQLEcsRUFDWjtBQUNJLG1CQUFPLENBQUMsS0FBS1IsS0FBTixJQUFlLEtBQUtBLEtBQUwsS0FBZVEsR0FBckM7QUFDSDs7Ozs7O0FBR0xiLGNBQWNILE1BQWQsR0FBdUJBLE1BQXZCO0FBQ0FHLGNBQWNGLGFBQWQsR0FBOEJBLGFBQTlCOztBQUVBd0QsT0FBT0MsT0FBUCxHQUFpQnZELGFBQWpCIiwiZmlsZSI6IndpbmRvdy1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5jb25zdCBXaW5kb3cgPSByZXF1aXJlKCcuL3dpbmRvdycpXHJcbmNvbnN0IFdpbmRvd09wdGlvbnMgPSByZXF1aXJlKCcuL3dpbmRvdy1vcHRpb25zJylcclxuY29uc3QgU25hcCA9IHJlcXVpcmUoJy4vc25hcCcpXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHdpbmRvd2luZyBzeXN0ZW0gdG8gY3JlYXRlIGFuZCBtYW5hZ2Ugd2luZG93c1xyXG4gKlxyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcclxuICogQGV4YW1wbGVcclxuICogdmFyIHdtID0gbmV3IFdpbmRvd01hbmFnZXIoKTtcclxuICpcclxuICogd20uY3JlYXRlV2luZG93KHsgeDogMjAsIHk6IDIwLCB3aWR0aDogMjAwIH0pO1xyXG4gKiB3bS5jb250ZW50LmlubmVySFRNTCA9ICdIZWxsbyB0aGVyZSEnO1xyXG4gKi9cclxuY2xhc3MgV2luZG93TWFuYWdlclxyXG57XHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7V2luZG93fldpbmRvd09wdGlvbnN9IFtkZWZhdWx0T3B0aW9uc10gZGVmYXVsdCBXaW5kb3dPcHRpb25zIHVzZWQgd2hlbiBjcmVhdGVXaW5kb3cgaXMgY2FsbGVkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtkZWZhdWx0T3B0aW9ucy5xdWlldF0gc3VwcHJlc3MgdGhlIHNpbXBsZS13aW5kb3ctbWFuYWdlciBjb25zb2xlIG1lc3NhZ2VcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZGVmYXVsdE9wdGlvbnMuc25hcF0gdHVybiBvbiBlZGdlIHNuYXBwaW5nXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtkZWZhdWx0T3B0aW9ucy5zbmFwLnNjcmVlbj10cnVlXSBzbmFwIHRvIGVkZ2Ugb2Ygc2NyZWVuXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtkZWZhdWx0T3B0aW9ucy5zbmFwLndpbmRvd3M9dHJ1ZV0gc25hcCB0byB3aW5kb3dzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2RlZmF1bHRPcHRpb25zLnNuYXAuc25hcD0yMF0gZGlzdGFuY2UgdG8gZWRnZSBiZWZvcmUgc25hcHBpbmcgYW5kIHdpZHRoL2hlaWdodCBvZiBzbmFwIGJhcnNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbZGVmYXVsdE9wdGlvbnMuc25hcC5jb2xvcj0jYThmMGY0XSBjb2xvciBmb3Igc25hcCBiYXJzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2RlZmF1bHRPcHRpb25zLnNuYXAuc3BhY2luZz01XSBzcGFjaW5nIGRpc3RhbmNlIGJldHdlZW4gd2luZG93IGFuZCBlZGdlc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihkZWZhdWx0T3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9jcmVhdGVEb20oKVxyXG4gICAgICAgIHRoaXMud2luZG93cyA9IFtdXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBudWxsXHJcbiAgICAgICAgdGhpcy5tb2RhbCA9IG51bGxcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBXaW5kb3dPcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV0gPSBXaW5kb3dPcHRpb25zW2tleV1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRlZmF1bHRPcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGRlZmF1bHRPcHRpb25zKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XSA9IGRlZmF1bHRPcHRpb25zW2tleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWRlZmF1bHRPcHRpb25zIHx8ICFkZWZhdWx0T3B0aW9ucy5xdWlldClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclYyDimJUgc2ltcGxlLXdpbmRvdy1tYW5hZ2VyIGluaXRpYWxpemVkIOKYlScsICdjb2xvcjogI2ZmMDBmZicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGx1Z2lucyA9IFtdXHJcbiAgICAgICAgaWYgKGRlZmF1bHRPcHRpb25zICYmIGRlZmF1bHRPcHRpb25zWydzbmFwJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNuYXAoZGVmYXVsdE9wdGlvbnNbJ3NuYXAnXSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7V2luZG93fldpbmRvd09wdGlvbnN9IFtvcHRpb25zXVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRpdGxlXVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnhdIHBvc2l0aW9uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueV0gcG9zaXRpb25cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubW9kYWxdXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtvcHRpb25zLmlkXSBpZiBub3QgcHJvdmlkZSwgaWQgd2lsbCBiZSBhc3NpZ25lZCBpbiBvcmRlciBvZiBjcmVhdGlvbiAoMCwgMSwgMi4uLilcclxuICAgICAqIEByZXR1cm5zIHtXaW5kb3d9IHRoZSBjcmVhdGVkIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBjcmVhdGVXaW5kb3cob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLm9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIWV4aXN0cyhvcHRpb25zW2tleV0pKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zW2tleV0gPSB0aGlzLm9wdGlvbnNba2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHdpbiA9IG5ldyBXaW5kb3codGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgd2luLm9uKCdvcGVuJywgdGhpcy5fb3BlbiwgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2ZvY3VzJywgdGhpcy5fZm9jdXMsIHRoaXMpXHJcbiAgICAgICAgd2luLm9uKCdibHVyJywgdGhpcy5fYmx1ciwgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2Nsb3NlJywgdGhpcy5fY2xvc2UsIHRoaXMpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4gdGhpcy5fbW92ZShlKSlcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIChlKSA9PiB0aGlzLl91cChlKSlcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIGlmIChvcHRpb25zLm1vZGFsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RhbCA9IHdpblxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5wbHVnaW5zWydzbmFwJ10gJiYgIXRoaXMub3B0aW9ucy5ub1NuYXApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNbJ3NuYXAnXS5hZGRXaW5kb3cod2luKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gd2luXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBdHRhY2ggYW4gZXhpc3Rpbmcgd2luZG93IHRvIHRoZSBXaW5kb3dNYW5hZ2VyXHJcbiAgICAgKiBOb3RlOiBXaW5kb3dNYW5hZ2VyLmNyZWF0ZVdpbmRvdyBpcyB0aGUgcHJlZmVycmVkIHdheSB0byBjcmVhdGUgd2luZG93cyB0byBlbnN1cmUgdGhhdCBhbGwgdGhlIGdsb2JhbCBvcHRpb25zXHJcbiAgICAgKiBhcmUgYXBwbGllZCB0byB0aGUgV2luZG93LiBJZiB5b3UgdXNlIHRoaXMgZnVuY3Rpb24sIHRoZW4gV2luZG93IG5lZWRzIHRvIGJlIGluaXRpYWxpemVkIHdpdGggV2luZG93T3B0aW9ucy5cclxuICAgICAqIEBwYXJhbSB7V2luZG93fSB3aW5cclxuICAgICAqIEByZXR1cm5zIHtXaW5kb3d9IHRoZSB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgYXR0YWNoV2luZG93KHdpbilcclxuICAgIHtcclxuICAgICAgICB3aW4ub24oJ29wZW4nLCB0aGlzLl9vcGVuLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignZm9jdXMnLCB0aGlzLl9mb2N1cywgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2JsdXInLCB0aGlzLl9ibHVyLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignY2xvc2UnLCB0aGlzLl9jbG9zZSwgdGhpcylcclxuICAgICAgICB0aGlzLndpbi5hcHBlbmRDaGlsZCh3aW4ud2luKVxyXG4gICAgICAgIHdpbi53bSA9IHRoaXNcclxuICAgICAgICB3aW4uZWFzZS5vcHRpb25zLmR1cmF0aW9uID0gdGhpcy5vcHRpb25zLmFuaW1hdGVUaW1lXHJcbiAgICAgICAgd2luLmVhc2Uub3B0aW9ucy5lYXNlID0gdGhpcy5vcHRpb25zLmVhc2VcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICAgICAgaWYgKHdpbi5tb2RhbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kYWwgPSB3aW5cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1snc25hcCddICYmICF0aGlzLm9wdGlvbnMubm9TbmFwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW5zWydzbmFwJ10uYWRkV2luZG93KHdpbilcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHdpblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkIGVkZ2Ugc25hcHBpbmcgcGx1Z2luXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5zY3JlZW49dHJ1ZV0gc25hcCB0byBzY3JlZW4gZWRnZXNcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMud2luZG93cz10cnVlXSBzbmFwIHRvIHdpbmRvdyBlZGdlc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNuYXA9MjBdIGRpc3RhbmNlIHRvIGVkZ2UgYmVmb3JlIHNuYXBwaW5nXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY29sb3I9I2E4ZjBmNF0gY29sb3IgZm9yIHNuYXAgYmFyc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNwYWNpbmc9MF0gc3BhY2luZyBkaXN0YW5jZSBiZXR3ZWVuIHdpbmRvdyBhbmQgZWRnZXNcclxuICAgICAqL1xyXG4gICAgc25hcChvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucGx1Z2luc1snc25hcCddID0gbmV3IFNuYXAodGhpcywgb3B0aW9ucylcclxuICAgICAgICBmb3IgKGxldCB3aW4gb2YgdGhpcy53aW5kb3dzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF3aW4ub3B0aW9ucy5ub1NuYXApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luc1snc25hcCddLmFkZFdpbmRvdyh3aW4pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgcGx1Z2luXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiBwbHVnaW5cclxuICAgICAqL1xyXG4gICAgcmVtb3ZlUGx1Z2luKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1tuYW1lXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1tuYW1lXS5zdG9wKClcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMucGx1Z2luc1tuYW1lXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmQgd2luZG93IHRvIGZyb250XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0Zyb250KHdpbilcclxuICAgIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMud2luZG93cy5sZW5ndGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgICAgICB0aGlzLl9yZW9yZGVyKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBiYWNrXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0JhY2sod2luKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy53aW5kb3dzLmluZGV4T2Yod2luKVxyXG4gICAgICAgIGlmIChpbmRleCAhPT0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy51bnNoaWZ0KHdpbilcclxuICAgICAgICAgICAgdGhpcy5fcmVvcmRlcigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2F2ZSB0aGUgc3RhdGUgb2YgYWxsIHRoZSB3aW5kb3dzXHJcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSB1c2UgdGhpcyBvYmplY3QgaW4gbG9hZCgpIHRvIHJlc3RvcmUgdGhlIHN0YXRlIG9mIGFsbCB3aW5kb3dzXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7fVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aW5kb3dzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLndpbmRvd3NbaV1cclxuICAgICAgICAgICAgZGF0YVtlbnRyeS5pZF0gPSBlbnRyeS5zYXZlKClcclxuICAgICAgICAgICAgZGF0YVtlbnRyeS5pZF0ub3JkZXIgPSBpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXN0b3JlcyB0aGUgc3RhdGUgb2YgYWxsIHRoZSB3aW5kb3dzXHJcbiAgICAgKiBOT1RFOiB0aGlzIHJlcXVpcmVzIHRoYXQgdGhlIHdpbmRvd3MgaGF2ZSB0aGUgc2FtZSBpZCBhcyB3aGVuIHNhdmUoKSB3YXMgY2FsbGVkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBjcmVhdGVkIGJ5IHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndpbmRvd3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMud2luZG93c1tpXVxyXG4gICAgICAgICAgICBpZiAoZGF0YVtlbnRyeS5pZF0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGVudHJ5LmxvYWQoZGF0YVtlbnRyeS5pZF0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcmVvcmRlciB3aW5kb3dzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjbG9zZSBhbGwgd2luZG93c1xyXG4gICAgICovXHJcbiAgICBjbG9zZUFsbCgpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgd2luIG9mIHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpbi5jbG9zZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMud2luZG93cyA9IFtdXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0aGlzLm1vZGFsID0gbnVsbFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVvcmRlciB3aW5kb3dzXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICogQHJldHVybnMge251bWJlcn0gYXZhaWxhYmxlIHotaW5kZXggZm9yIHRvcCB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgX3Jlb3JkZXIoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBpID0gMFxyXG4gICAgICAgIGZvciAoOyBpIDwgdGhpcy53aW5kb3dzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzW2ldLnogPSBpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVEb20oKVxyXG4gICAge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgaXMgdGhlIHRvcC1sZXZlbCBET00gZWxlbWVudFxyXG4gICAgICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAgICAgKiBAcmVhZG9ubHlcclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLndpbiA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IGRvY3VtZW50LmJvZHksIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ3otaW5kZXgnOiAtMSxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnZGVmYXVsdCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIFRoaXMgaXMgdGhlIGJvdHRvbSBET00gZWxlbWVudC4gVXNlIHRoaXMgdG8gc2V0IGEgd2FsbHBhcGVyIG9yIGF0dGFjaCBlbGVtZW50cyB1bmRlcm5lYXRoIHRoZSB3aW5kb3dzXHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqIEByZWFkb25seVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMub3ZlcmxheSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIChlKSA9PiB0aGlzLl91cChlKSlcclxuICAgIH1cclxuXHJcbiAgICBfb3Blbih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5wdXNoKHdpbilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2ZvY3VzKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHdpbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUuYmx1cigpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMud2luZG93cy5sZW5ndGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZW9yZGVyKClcclxuXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB3aW5cclxuICAgIH1cclxuXHJcbiAgICBfYmx1cih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSB3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2Nsb3NlKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5tb2RhbCA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RhbCA9IG51bGxcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fYmx1cih3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9tb3ZlKGUpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93c1trZXldLl9tb3ZlKGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF91cChlKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLndpbmRvd3MpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Nba2V5XS5fdXAoZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NoZWNrTW9kYWwod2luKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhdGhpcy5tb2RhbCB8fCB0aGlzLm1vZGFsID09PSB3aW5cclxuICAgIH1cclxufVxyXG5cclxuV2luZG93TWFuYWdlci5XaW5kb3cgPSBXaW5kb3dcclxuV2luZG93TWFuYWdlci5XaW5kb3dPcHRpb25zID0gV2luZG93T3B0aW9uc1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3dNYW5hZ2VyIl19