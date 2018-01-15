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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3ctbWFuYWdlci5qcyJdLCJuYW1lcyI6WyJleGlzdHMiLCJyZXF1aXJlIiwiaHRtbCIsIldpbmRvdyIsIldpbmRvd09wdGlvbnMiLCJTbmFwIiwiV2luZG93TWFuYWdlciIsImRlZmF1bHRPcHRpb25zIiwiX2NyZWF0ZURvbSIsIndpbmRvd3MiLCJhY3RpdmUiLCJtb2RhbCIsIm9wdGlvbnMiLCJrZXkiLCJxdWlldCIsImNvbnNvbGUiLCJsb2ciLCJwbHVnaW5zIiwic25hcCIsIndpbiIsIm9uIiwiX29wZW4iLCJfZm9jdXMiLCJfYmx1ciIsIl9jbG9zZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX21vdmUiLCJfdXAiLCJhZGRXaW5kb3ciLCJuYW1lIiwic3RvcCIsImluZGV4IiwiaW5kZXhPZiIsImxlbmd0aCIsInNwbGljZSIsInB1c2giLCJfcmVvcmRlciIsInVuc2hpZnQiLCJkYXRhIiwiaSIsImVudHJ5IiwiaWQiLCJzYXZlIiwib3JkZXIiLCJsb2FkIiwiY2xvc2UiLCJ6IiwicGFyZW50IiwiZG9jdW1lbnQiLCJib2R5Iiwic3R5bGVzIiwib3ZlcmxheSIsImJsdXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFNQSxTQUFTQyxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNQyxPQUFPRCxRQUFRLFFBQVIsQ0FBYjtBQUNBLElBQU1FLFNBQVNGLFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBTUcsZ0JBQWdCSCxRQUFRLGtCQUFSLENBQXRCO0FBQ0EsSUFBTUksT0FBT0osUUFBUSxRQUFSLENBQWI7O0FBRUE7Ozs7Ozs7Ozs7O0lBVU1LLGE7QUFFRjs7Ozs7Ozs7OztBQVVBLDJCQUFZQyxjQUFaLEVBQ0E7QUFBQTs7QUFDSSxhQUFLQyxVQUFMO0FBQ0EsYUFBS0MsT0FBTCxHQUFlLEVBQWY7QUFDQSxhQUFLQyxNQUFMLEdBQWMsSUFBZDtBQUNBLGFBQUtDLEtBQUwsR0FBYSxJQUFiO0FBQ0Es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QUNBO0FBQ0kscUJBQUtBLE9BQUwsQ0FBYUksR0FBYixFQUFrQmMsS0FBbEIsQ0FBd0JELENBQXhCO0FBQ0g7QUFDSjs7OzRCQUVHQSxDLEVBQ0o7QUFDSSxpQkFBSyxJQUFJYixHQUFULElBQWdCLEtBQUtKLE9BQXJCLEVBQ0E7QUFDSSxxQkFBS0EsT0FBTCxDQUFhSSxHQUFiLEVBQWtCZSxHQUFsQixDQUFzQkYsQ0FBdEI7QUFDSDtBQUNKOzs7b0NBRVdQLEcsRUFDWjtBQUNJLG1CQUFPLENBQUMsS0FBS1IsS0FBTixJQUFlLEtBQUtBLEtBQUwsS0FBZVEsR0FBckM7QUFDSDs7Ozs7O0FBR0xtQyxPQUFPQyxPQUFQLEdBQWlCakQsYUFBakIiLCJmaWxlIjoid2luZG93LW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBleGlzdHMgPSByZXF1aXJlKCdleGlzdHMnKVxyXG5cclxuY29uc3QgaHRtbCA9IHJlcXVpcmUoJy4vaHRtbCcpXHJcbmNvbnN0IFdpbmRvdyA9IHJlcXVpcmUoJy4vd2luZG93JylcclxuY29uc3QgV2luZG93T3B0aW9ucyA9IHJlcXVpcmUoJy4vd2luZG93LW9wdGlvbnMnKVxyXG5jb25zdCBTbmFwID0gcmVxdWlyZSgnLi9zbmFwJylcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgd2luZG93aW5nIHN5c3RlbSB0byBjcmVhdGUgYW5kIG1hbmFnZSB3aW5kb3dzXHJcbiAqXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgd20gPSBuZXcgV2luZG93TWFuYWdlcigpO1xyXG4gKlxyXG4gKiB3bS5jcmVhdGVXaW5kb3coeyB4OiAyMCwgeTogMjAsIHdpZHRoOiAyMDAgfSk7XHJcbiAqIHdtLmNvbnRlbnQuaW5uZXJIVE1MID0gJ0hlbGxvIHRoZXJlISc7XHJcbiAqL1xyXG5jbGFzcyBXaW5kb3dNYW5hZ2VyXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtXaW5kb3d+V2luZG93T3B0aW9uc30gW2RlZmF1bHRPcHRpb25zXSBkZWZhdWx0IFdpbmRvd09wdGlvbnMgdXNlZCB3aGVuIGNyZWF0ZVdpbmRvdyBpcyBjYWxsZWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2RlZmF1bHRPcHRpb25zLnF1aWV0XSBzdXBwcmVzcyB0aGUgc2ltcGxlLXdpbmRvdy1tYW5hZ2VyIGNvbnNvbGUgbWVzc2FnZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtkZWZhdWx0T3B0aW9ucy5zbmFwXSB0dXJuIG9uIGVkZ2Ugc25hcHBpbmdcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2RlZmF1bHRPcHRpb25zLnNuYXAuc2NyZWVuPXRydWVdIHNuYXAgdG8gZWRnZSBvZiBzY3JlZW5cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2RlZmF1bHRPcHRpb25zLnNuYXAud2luZG93cz10cnVlXSBzbmFwIHRvIHdpbmRvd3NcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZGVmYXVsdE9wdGlvbnMuc25hcC5zbmFwPTIwXSBkaXN0YW5jZSB0byBlZGdlIGJlZm9yZSBzbmFwcGluZyBhbmQgd2lkdGgvaGVpZ2h0IG9mIHNuYXAgYmFyc1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtkZWZhdWx0T3B0aW9ucy5zbmFwLmNvbG9yPSNhOGYwZjRdIGNvbG9yIGZvciBzbmFwIGJhcnNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZGVmYXVsdE9wdGlvbnMuc25hcC5zcGFjaW5nPTVdIHNwYWNpbmcgZGlzdGFuY2UgYmV0d2VlbiB3aW5kb3cgYW5kIGVkZ2VzXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGRlZmF1bHRPcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2NyZWF0ZURvbSgpXHJcbiAgICAgICAgdGhpcy53aW5kb3dzID0gW11cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGxcclxuICAgICAgICB0aGlzLm1vZGFsID0gbnVsbFxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHt9XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIFdpbmRvd09wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XSA9IFdpbmRvd09wdGlvbnNba2V5XVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGVmYXVsdE9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gZGVmYXVsdE9wdGlvbnMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1trZXldID0gZGVmYXVsdE9wdGlvbnNba2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghZGVmYXVsdE9wdGlvbnMgfHwgIWRlZmF1bHRPcHRpb25zLnF1aWV0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJyVjIOKYlSBzaW1wbGUtd2luZG93LW1hbmFnZXIgaW5pdGlhbGl6ZWQg4piVJywgJ2NvbG9yOiAjZmYwMGZmJylcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wbHVnaW5zID0gW11cclxuICAgICAgICBpZiAoZGVmYXVsdE9wdGlvbnMgJiYgZGVmYXVsdE9wdGlvbnNbJ3NuYXAnXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc25hcChkZWZhdWx0T3B0aW9uc1snc25hcCddKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtXaW5kb3d+V2luZG93T3B0aW9uc30gW29wdGlvbnNdXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGl0bGVdXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueF0gcG9zaXRpb25cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy55XSBwb3NpdGlvblxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5tb2RhbF1cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW29wdGlvbnMuaWRdIGlmIG5vdCBwcm92aWRlLCBpZCB3aWxsIGJlIGFzc2lnbmVkIGluIG9yZGVyIG9mIGNyZWF0aW9uICgwLCAxLCAyLi4uKVxyXG4gICAgICogQHJldHVybnMge1dpbmRvd30gdGhlIGNyZWF0ZWQgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZVdpbmRvdyhvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMub3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghZXhpc3RzKG9wdGlvbnNba2V5XSkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnNba2V5XSA9IHRoaXMub3B0aW9uc1trZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgd2luID0gbmV3IFdpbmRvdyh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICB3aW4ub24oJ29wZW4nLCB0aGlzLl9vcGVuLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignZm9jdXMnLCB0aGlzLl9mb2N1cywgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2JsdXInLCB0aGlzLl9ibHVyLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignY2xvc2UnLCB0aGlzLl9jbG9zZSwgdGhpcylcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICAgICAgaWYgKG9wdGlvbnMubW9kYWwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1vZGFsID0gd2luXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnBsdWdpbnNbJ3NuYXAnXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1snc25hcCddLmFkZFdpbmRvdyh3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB3aW5cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZCBlZGdlIHNuYXBwaW5nIHBsdWdpblxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc2NyZWVuPXRydWVdIHNuYXAgdG8gc2NyZWVuIGVkZ2VzXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLndpbmRvd3M9dHJ1ZV0gc25hcCB0byB3aW5kb3cgZWRnZXNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5zbmFwPTIwXSBkaXN0YW5jZSB0byBlZGdlIGJlZm9yZSBzbmFwcGluZ1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNvbG9yPSNhOGYwZjRdIGNvbG9yIGZvciBzbmFwIGJhcnNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5zcGFjaW5nPTBdIHNwYWNpbmcgZGlzdGFuY2UgYmV0d2VlbiB3aW5kb3cgYW5kIGVkZ2VzXHJcbiAgICAgKi9cclxuICAgIHNuYXAob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBsdWdpbnNbJ3NuYXAnXSA9IG5ldyBTbmFwKHRoaXMsIG9wdGlvbnMpXHJcbiAgICAgICAgZm9yIChsZXQgd2luIG9mIHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1snc25hcCddLmFkZFdpbmRvdyh3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVtb3ZlIHBsdWdpblxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgcGx1Z2luXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZVBsdWdpbihuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLnBsdWdpbnNbbmFtZV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNbbmFtZV0uc3RvcCgpXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnBsdWdpbnNbbmFtZV1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBmcm9udFxyXG4gICAgICogQHBhcmFtIHtXaW5kb3d9IHdpblxyXG4gICAgICovXHJcbiAgICBzZW5kVG9Gcm9udCh3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSB0aGlzLndpbmRvd3MubGVuZ3RoIC0gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5wdXNoKHdpbilcclxuICAgICAgICAgICAgdGhpcy5fcmVvcmRlcigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZCB3aW5kb3cgdG8gYmFja1xyXG4gICAgICogQHBhcmFtIHtXaW5kb3d9IHdpblxyXG4gICAgICovXHJcbiAgICBzZW5kVG9CYWNrKHdpbilcclxuICAgIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Muc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3MudW5zaGlmdCh3aW4pXHJcbiAgICAgICAgICAgIHRoaXMuX3Jlb3JkZXIoKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNhdmUgdGhlIHN0YXRlIG9mIGFsbCB0aGUgd2luZG93c1xyXG4gICAgICogQHJldHVybnMge29iamVjdH0gdXNlIHRoaXMgb2JqZWN0IGluIGxvYWQoKSB0byByZXN0b3JlIHRoZSBzdGF0ZSBvZiBhbGwgd2luZG93c1xyXG4gICAgICovXHJcbiAgICBzYXZlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBkYXRhID0ge31cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2luZG93cy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy53aW5kb3dzW2ldXHJcbiAgICAgICAgICAgIGRhdGFbZW50cnkuaWRdID0gZW50cnkuc2F2ZSgpXHJcbiAgICAgICAgICAgIGRhdGFbZW50cnkuaWRdLm9yZGVyID0gaVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVzdG9yZXMgdGhlIHN0YXRlIG9mIGFsbCB0aGUgd2luZG93c1xyXG4gICAgICogTk9URTogdGhpcyByZXF1aXJlcyB0aGF0IHRoZSB3aW5kb3dzIGhhdmUgdGhlIHNhbWUgaWQgYXMgd2hlbiBzYXZlKCkgd2FzIGNhbGxlZFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgY3JlYXRlZCBieSBzYXZlKClcclxuICAgICAqL1xyXG4gICAgbG9hZChkYXRhKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aW5kb3dzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLndpbmRvd3NbaV1cclxuICAgICAgICAgICAgaWYgKGRhdGFbZW50cnkuaWRdKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBlbnRyeS5sb2FkKGRhdGFbZW50cnkuaWRdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHJlb3JkZXIgd2luZG93c1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xvc2UgYWxsIHdpbmRvd3NcclxuICAgICAqL1xyXG4gICAgY2xvc2VBbGwoKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IHdpbiBvZiB0aGlzLndpbmRvd3MpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aW4uY2xvc2UoKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpbmRvd3MgPSBbXVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdGhpcy5tb2RhbCA9IG51bGxcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlb3JkZXIgd2luZG93c1xyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IGF2YWlsYWJsZSB6LWluZGV4IGZvciB0b3Agd2luZG93XHJcbiAgICAgKi9cclxuICAgIF9yZW9yZGVyKClcclxuICAgIHtcclxuICAgICAgICBsZXQgaSA9IDBcclxuICAgICAgICBmb3IgKDsgaSA8IHRoaXMud2luZG93cy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93c1tpXS56ID0gaVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY3JlYXRlRG9tKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLndpbiA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IGRvY3VtZW50LmJvZHksIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ3otaW5kZXgnOiAtMSxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnZGVmYXVsdCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy53aW4sIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3Bvc2l0aW9uJzogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgICd0b3AnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ2xlZnQnOiAwLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZSkgPT4gdGhpcy5fbW92ZShlKSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgfVxyXG5cclxuICAgIF9vcGVuKHdpbilcclxuICAgIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggPT09IC0xKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfZm9jdXMod2luKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5hY3RpdmUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZS5ibHVyKClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy53aW5kb3dzLmluZGV4T2Yod2luKVxyXG4gICAgICAgIGlmIChpbmRleCAhPT0gdGhpcy53aW5kb3dzLmxlbmd0aCAtIDEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Muc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3MucHVzaCh3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX3Jlb3JkZXIoKVxyXG5cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IHdpblxyXG4gICAgfVxyXG5cclxuICAgIF9ibHVyKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHdpbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gbnVsbFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY2xvc2Uod2luKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLm1vZGFsID09PSB3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1vZGFsID0gbnVsbFxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSB3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLl9ibHVyKHdpbilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX21vdmUoZSlcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy53aW5kb3dzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzW2tleV0uX21vdmUoZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX3VwKGUpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93c1trZXldLl91cChlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfY2hlY2tNb2RhbCh3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICF0aGlzLm1vZGFsIHx8IHRoaXMubW9kYWwgPT09IHdpblxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdpbmRvd01hbmFnZXIiXX0=