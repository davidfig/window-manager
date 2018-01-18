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
            if (this.plugins['snap']) {
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

                    this.plugins['snap'].addWindow(win);
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
            var _this2 = this;

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
                return _this2._move(e);
            });
            this.overlay.addEventListener('touchmove', function (e) {
                return _this2._move(e);
            });
            this.overlay.addEventListener('mouseup', function (e) {
                return _this2._up(e);
            });
            this.overlay.addEventListener('touchend', function (e) {
                return _this2._up(e);
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

module.exports = WindowManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3ctbWFuYWdlci5qcyJdLCJuYW1lcyI6WyJleGlzdHMiLCJyZXF1aXJlIiwiaHRtbCIsIldpbmRvdyIsIldpbmRvd09wdGlvbnMiLCJTbmFwIiwiV2luZG93TWFuYWdlciIsImRlZmF1bHRPcHRpb25zIiwiX2NyZWF0ZURvbSIsIndpbmRvd3MiLCJhY3RpdmUiLCJtb2RhbCIsIm9wdGlvbnMiLCJrZXkiLCJxdWlldCIsImNvbnNvbGUiLCJsb2ciLCJwbHVnaW5zIiwic25hcCIsIndpbiIsIm9uIiwiX29wZW4iLCJfZm9jdXMiLCJfYmx1ciIsIl9jbG9zZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX21vdmUiLCJfdXAiLCJhZGRXaW5kb3ciLCJuYW1lIiwic3RvcCIsImluZGV4IiwiaW5kZXhPZiIsImxlbmd0aCIsInNwbGljZSIsInB1c2giLCJfcmVvcmRlciIsInVuc2hpZnQiLCJkYXRhIiwiaSIsImVudHJ5IiwiaWQiLCJzYXZlIiwib3JkZXIiLCJsb2FkIiwiY2xvc2UiLCJ6IiwicGFyZW50IiwiZG9jdW1lbnQiLCJib2R5Iiwic3R5bGVzIiwib3ZlcmxheSIsImJsdXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFNQSxTQUFTQyxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNQyxPQUFPRCxRQUFRLFFBQVIsQ0FBYjtBQUNBLElBQU1FLFNBQVNGLFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBTUcsZ0JBQWdCSCxRQUFRLGtCQUFSLENBQXRCO0FBQ0EsSUFBTUksT0FBT0osUUFBUSxRQUFSLENBQWI7O0FBRUE7Ozs7Ozs7Ozs7O0lBVU1LLGE7QUFFRjs7Ozs7Ozs7OztBQVVBLDJCQUFZQyxjQUFaLEVBQ0E7QUFBQTs7QUFDSSxhQUFLQyxVQUFMO0FBQ0EsYUFBS0MsT0FBTCxHQUFlLEVBQWY7QUFDQSxhQUFLQyxNQUFMLEdBQWMsSUFBZDtBQUNBLGFBQUtDLEtBQUwsR0FBYSxJQUFiO0FBQ0Es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SUFBZ0IsS0FBS0osT0FBckIsRUFDQTtBQUNJLHFCQUFLQSxPQUFMLENBQWFJLEdBQWIsRUFBa0JjLEtBQWxCLENBQXdCRCxDQUF4QjtBQUNIO0FBQ0o7Ozs0QkFFR0EsQyxFQUNKO0FBQ0ksaUJBQUssSUFBSWIsR0FBVCxJQUFnQixLQUFLSixPQUFyQixFQUNBO0FBQ0kscUJBQUtBLE9BQUwsQ0FBYUksR0FBYixFQUFrQmUsR0FBbEIsQ0FBc0JGLENBQXRCO0FBQ0g7QUFDSjs7O29DQUVXUCxHLEVBQ1o7QUFDSSxtQkFBTyxDQUFDLEtBQUtSLEtBQU4sSUFBZSxLQUFLQSxLQUFMLEtBQWVRLEdBQXJDO0FBQ0g7Ozs7OztBQUdMbUMsT0FBT0MsT0FBUCxHQUFpQmpELGFBQWpCIiwiZmlsZSI6IndpbmRvdy1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5jb25zdCBXaW5kb3cgPSByZXF1aXJlKCcuL3dpbmRvdycpXHJcbmNvbnN0IFdpbmRvd09wdGlvbnMgPSByZXF1aXJlKCcuL3dpbmRvdy1vcHRpb25zJylcclxuY29uc3QgU25hcCA9IHJlcXVpcmUoJy4vc25hcCcpXHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHdpbmRvd2luZyBzeXN0ZW0gdG8gY3JlYXRlIGFuZCBtYW5hZ2Ugd2luZG93c1xyXG4gKlxyXG4gKiBAZXh0ZW5kcyBFdmVudEVtaXR0ZXJcclxuICogQGV4YW1wbGVcclxuICogdmFyIHdtID0gbmV3IFdpbmRvd01hbmFnZXIoKTtcclxuICpcclxuICogd20uY3JlYXRlV2luZG93KHsgeDogMjAsIHk6IDIwLCB3aWR0aDogMjAwIH0pO1xyXG4gKiB3bS5jb250ZW50LmlubmVySFRNTCA9ICdIZWxsbyB0aGVyZSEnO1xyXG4gKi9cclxuY2xhc3MgV2luZG93TWFuYWdlclxyXG57XHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7V2luZG93fldpbmRvd09wdGlvbnN9IFtkZWZhdWx0T3B0aW9uc10gZGVmYXVsdCBXaW5kb3dPcHRpb25zIHVzZWQgd2hlbiBjcmVhdGVXaW5kb3cgaXMgY2FsbGVkXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtkZWZhdWx0T3B0aW9ucy5xdWlldF0gc3VwcHJlc3MgdGhlIHNpbXBsZS13aW5kb3ctbWFuYWdlciBjb25zb2xlIG1lc3NhZ2VcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbZGVmYXVsdE9wdGlvbnMuc25hcF0gdHVybiBvbiBlZGdlIHNuYXBwaW5nXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtkZWZhdWx0T3B0aW9ucy5zbmFwLnNjcmVlbj10cnVlXSBzbmFwIHRvIGVkZ2Ugb2Ygc2NyZWVuXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtkZWZhdWx0T3B0aW9ucy5zbmFwLndpbmRvd3M9dHJ1ZV0gc25hcCB0byB3aW5kb3dzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2RlZmF1bHRPcHRpb25zLnNuYXAuc25hcD0yMF0gZGlzdGFuY2UgdG8gZWRnZSBiZWZvcmUgc25hcHBpbmcgYW5kIHdpZHRoL2hlaWdodCBvZiBzbmFwIGJhcnNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbZGVmYXVsdE9wdGlvbnMuc25hcC5jb2xvcj0jYThmMGY0XSBjb2xvciBmb3Igc25hcCBiYXJzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2RlZmF1bHRPcHRpb25zLnNuYXAuc3BhY2luZz01XSBzcGFjaW5nIGRpc3RhbmNlIGJldHdlZW4gd2luZG93IGFuZCBlZGdlc1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihkZWZhdWx0T3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9jcmVhdGVEb20oKVxyXG4gICAgICAgIHRoaXMud2luZG93cyA9IFtdXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBudWxsXHJcbiAgICAgICAgdGhpcy5tb2RhbCA9IG51bGxcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBXaW5kb3dPcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV0gPSBXaW5kb3dPcHRpb25zW2tleV1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRlZmF1bHRPcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGRlZmF1bHRPcHRpb25zKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XSA9IGRlZmF1bHRPcHRpb25zW2tleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWRlZmF1bHRPcHRpb25zIHx8ICFkZWZhdWx0T3B0aW9ucy5xdWlldClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclYyDimJUgc2ltcGxlLXdpbmRvdy1tYW5hZ2VyIGluaXRpYWxpemVkIOKYlScsICdjb2xvcjogI2ZmMDBmZicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGx1Z2lucyA9IFtdXHJcbiAgICAgICAgaWYgKGRlZmF1bHRPcHRpb25zICYmIGRlZmF1bHRPcHRpb25zWydzbmFwJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNuYXAoZGVmYXVsdE9wdGlvbnNbJ3NuYXAnXSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7V2luZG93fldpbmRvd09wdGlvbnN9IFtvcHRpb25zXVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRpdGxlXVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnhdIHBvc2l0aW9uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueV0gcG9zaXRpb25cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubW9kYWxdXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtvcHRpb25zLmlkXSBpZiBub3QgcHJvdmlkZSwgaWQgd2lsbCBiZSBhc3NpZ25lZCBpbiBvcmRlciBvZiBjcmVhdGlvbiAoMCwgMSwgMi4uLilcclxuICAgICAqIEByZXR1cm5zIHtXaW5kb3d9IHRoZSBjcmVhdGVkIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBjcmVhdGVXaW5kb3cob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLm9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIWV4aXN0cyhvcHRpb25zW2tleV0pKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zW2tleV0gPSB0aGlzLm9wdGlvbnNba2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHdpbiA9IG5ldyBXaW5kb3codGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgd2luLm9uKCdvcGVuJywgdGhpcy5fb3BlbiwgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2ZvY3VzJywgdGhpcy5fZm9jdXMsIHRoaXMpXHJcbiAgICAgICAgd2luLm9uKCdibHVyJywgdGhpcy5fYmx1ciwgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2Nsb3NlJywgdGhpcy5fY2xvc2UsIHRoaXMpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4gdGhpcy5fbW92ZShlKSlcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIChlKSA9PiB0aGlzLl91cChlKSlcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIGlmIChvcHRpb25zLm1vZGFsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RhbCA9IHdpblxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5wbHVnaW5zWydzbmFwJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNbJ3NuYXAnXS5hZGRXaW5kb3cod2luKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gd2luXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGQgZWRnZSBzbmFwcGluZyBwbHVnaW5cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnNjcmVlbj10cnVlXSBzbmFwIHRvIHNjcmVlbiBlZGdlc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy53aW5kb3dzPXRydWVdIHNuYXAgdG8gd2luZG93IGVkZ2VzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc25hcD0yMF0gZGlzdGFuY2UgdG8gZWRnZSBiZWZvcmUgc25hcHBpbmdcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jb2xvcj0jYThmMGY0XSBjb2xvciBmb3Igc25hcCBiYXJzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc3BhY2luZz0wXSBzcGFjaW5nIGRpc3RhbmNlIGJldHdlZW4gd2luZG93IGFuZCBlZGdlc1xyXG4gICAgICovXHJcbiAgICBzbmFwKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wbHVnaW5zWydzbmFwJ10gPSBuZXcgU25hcCh0aGlzLCBvcHRpb25zKVxyXG4gICAgICAgIGZvciAobGV0IHdpbiBvZiB0aGlzLndpbmRvd3MpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNbJ3NuYXAnXS5hZGRXaW5kb3cod2luKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlbW92ZSBwbHVnaW5cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHBsdWdpblxyXG4gICAgICovXHJcbiAgICByZW1vdmVQbHVnaW4obmFtZSlcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5wbHVnaW5zW25hbWVdKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW5zW25hbWVdLnN0b3AoKVxyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5wbHVnaW5zW25hbWVdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZCB3aW5kb3cgdG8gZnJvbnRcclxuICAgICAqIEBwYXJhbSB7V2luZG93fSB3aW5cclxuICAgICAqL1xyXG4gICAgc2VuZFRvRnJvbnQod2luKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy53aW5kb3dzLmluZGV4T2Yod2luKVxyXG4gICAgICAgIGlmIChpbmRleCAhPT0gdGhpcy53aW5kb3dzLmxlbmd0aCAtIDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Muc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3MucHVzaCh3aW4pXHJcbiAgICAgICAgICAgIHRoaXMuX3Jlb3JkZXIoKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmQgd2luZG93IHRvIGJhY2tcclxuICAgICAqIEBwYXJhbSB7V2luZG93fSB3aW5cclxuICAgICAqL1xyXG4gICAgc2VuZFRvQmFjayh3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnVuc2hpZnQod2luKVxyXG4gICAgICAgICAgICB0aGlzLl9yZW9yZGVyKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzYXZlIHRoZSBzdGF0ZSBvZiBhbGwgdGhlIHdpbmRvd3NcclxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IHVzZSB0aGlzIG9iamVjdCBpbiBsb2FkKCkgdG8gcmVzdG9yZSB0aGUgc3RhdGUgb2YgYWxsIHdpbmRvd3NcclxuICAgICAqL1xyXG4gICAgc2F2ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgZGF0YSA9IHt9XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndpbmRvd3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMud2luZG93c1tpXVxyXG4gICAgICAgICAgICBkYXRhW2VudHJ5LmlkXSA9IGVudHJ5LnNhdmUoKVxyXG4gICAgICAgICAgICBkYXRhW2VudHJ5LmlkXS5vcmRlciA9IGlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRhdGFcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlc3RvcmVzIHRoZSBzdGF0ZSBvZiBhbGwgdGhlIHdpbmRvd3NcclxuICAgICAqIE5PVEU6IHRoaXMgcmVxdWlyZXMgdGhhdCB0aGUgd2luZG93cyBoYXZlIHRoZSBzYW1lIGlkIGFzIHdoZW4gc2F2ZSgpIHdhcyBjYWxsZWRcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIGNyZWF0ZWQgYnkgc2F2ZSgpXHJcbiAgICAgKi9cclxuICAgIGxvYWQoZGF0YSlcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2luZG93cy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy53aW5kb3dzW2ldXHJcbiAgICAgICAgICAgIGlmIChkYXRhW2VudHJ5LmlkXSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZW50cnkubG9hZChkYXRhW2VudHJ5LmlkXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyByZW9yZGVyIHdpbmRvd3NcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNsb3NlIGFsbCB3aW5kb3dzXHJcbiAgICAgKi9cclxuICAgIGNsb3NlQWxsKClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCB3aW4gb2YgdGhpcy53aW5kb3dzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luLmNsb3NlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy53aW5kb3dzID0gW11cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHRoaXMubW9kYWwgPSBudWxsXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW9yZGVyIHdpbmRvd3NcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBhdmFpbGFibGUgei1pbmRleCBmb3IgdG9wIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBfcmVvcmRlcigpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGkgPSAwXHJcbiAgICAgICAgZm9yICg7IGkgPCB0aGlzLndpbmRvd3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3NbaV0ueiA9IGlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZURvbSgpXHJcbiAgICB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgdG9wLWxldmVsIERPTSBlbGVtZW50XHJcbiAgICAgICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICAgICAqIEByZWFkb25seVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMud2luID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogZG9jdW1lbnQuYm9keSwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAnei1pbmRleCc6IC0xLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdkZWZhdWx0J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogVGhpcyBpcyB0aGUgYm90dG9tIERPTSBlbGVtZW50LiBVc2UgdGhpcyB0byBzZXQgYSB3YWxscGFwZXIgb3IgYXR0YWNoIGVsZW1lbnRzIHVuZGVybmVhdGggdGhlIHdpbmRvd3NcclxuICAgICAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgICAgICogQHJlYWRvbmx5XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICd0b3AnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4gdGhpcy5fbW92ZShlKSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgfVxyXG5cclxuICAgIF9vcGVuKHdpbilcclxuICAgIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfZm9jdXMod2luKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5hY3RpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZS5ibHVyKClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy53aW5kb3dzLmluZGV4T2Yod2luKVxyXG4gICAgICAgIGlmIChpbmRleCAhPT0gdGhpcy53aW5kb3dzLmxlbmd0aCAtIDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Muc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3MucHVzaCh3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3Jlb3JkZXIoKVxyXG5cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHdpblxyXG4gICAgfVxyXG5cclxuICAgIF9ibHVyKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHdpbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gbnVsbFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY2xvc2Uod2luKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm1vZGFsID09PSB3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1vZGFsID0gbnVsbFxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSB3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9ibHVyKHdpbilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX21vdmUoZSlcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy53aW5kb3dzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzW2tleV0uX21vdmUoZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3VwKGUpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93c1trZXldLl91cChlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY2hlY2tNb2RhbCh3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICF0aGlzLm1vZGFsIHx8IHRoaXMubW9kYWwgPT09IHdpblxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdpbmRvd01hbmFnZXIiXX0=