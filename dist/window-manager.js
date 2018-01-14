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
     * @param {boolean} [defaultOptions.snap.screen] snap to edge of screen
     * @param {boolean} [defaultOptions.snap.windows] snap to windows
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
     * @param {Window} [options.center] center in the middle of an existing Window
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
            if (options.center) {
                win.move(options.center.x + options.center.width / 2 - (options.width ? options.width / 2 : 0), options.center.y + options.center.height / 2 - (options.height ? options.height / 2 : 0));
            }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3ctbWFuYWdlci5qcyJdLCJuYW1lcyI6WyJleGlzdHMiLCJyZXF1aXJlIiwiaHRtbCIsIldpbmRvdyIsIldpbmRvd09wdGlvbnMiLCJTbmFwIiwiV2luZG93TWFuYWdlciIsImRlZmF1bHRPcHRpb25zIiwiX2NyZWF0ZURvbSIsIndpbmRvd3MiLCJhY3RpdmUiLCJtb2RhbCIsIm9wdGlvbnMiLCJrZXkiLCJxdWlldCIsImNvbnNvbGUiLCJsb2ciLCJwbHVnaW5zIiwic25hcCIsIndpbiIsIm9uIiwiX29wZW4iLCJfZm9jdXMiLCJfYmx1ciIsIl9jbG9zZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX21vdmUiLCJfdXAiLCJjZW50ZXIiLCJtb3ZlIiwieCIsIndpZHRoIiwieSIsImhlaWdodCIsImFkZFdpbmRvdyIsIm5hbWUiLCJzdG9wIiwiaW5kZXgiLCJpbmRleE9mIiwibGVuZ3RoIiwic3BsaWNlIiwicHVzaCIsIl9yZW9yZGVyIiwidW5zaGlmdCIsImRhdGEiLCJpIiwiZW50cnkiLCJpZCIsInNhdmUiLCJvcmRlciIsImxvYWQiLCJ6IiwicGFyZW50IiwiZG9jdW1lbnQiLCJib2R5Iiwic3R5bGVzIiwib3ZlcmxheSIsImJsdXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFNQSxTQUFTQyxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNQyxPQUFPRCxRQUFRLFFBQVIsQ0FBYjtBQUNBLElBQU1FLFNBQVNGLFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBTUcsZ0JBQWdCSCxRQUFRLGtCQUFSLENBQXRCO0FBQ0EsSUFBTUksT0FBT0osUUFBUSxRQUFSLENBQWI7O0FBRUE7Ozs7Ozs7Ozs7O0lBVU1LLGE7QUFFRjs7Ozs7OztBQU9BLDJCQUFZQyxjQUFaLEVBQ0E7QUFBQTs7QUFDSSxhQUFLQyxVQUFMO0FBQ0EsYUFBS0MsT0FBTCxHQUFlLEVBQWY7QUFDQSxhQUFLQyxNQUFMLEdBQWMsSUFBZDtB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Sjs7OzRCQUVHQSxDLEVBQ0o7QUFDSSxpQkFBSyxJQUFJYixHQUFULElBQWdCLEtBQUtKLE9BQXJCLEVBQ0E7QUFDSSxxQkFBS0EsT0FBTCxDQUFhSSxHQUFiLEVBQWtCZSxHQUFsQixDQUFzQkYsQ0FBdEI7QUFDSDtBQUNKOzs7b0NBRVdQLEcsRUFDWjtBQUNJLG1CQUFPLENBQUMsS0FBS1IsS0FBTixJQUFlLEtBQUtBLEtBQUwsS0FBZVEsR0FBckM7QUFDSDs7Ozs7O0FBR0x3QyxPQUFPQyxPQUFQLEdBQWlCdEQsYUFBakIiLCJmaWxlIjoid2luZG93LW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBleGlzdHMgPSByZXF1aXJlKCdleGlzdHMnKVxyXG5cclxuY29uc3QgaHRtbCA9IHJlcXVpcmUoJy4vaHRtbCcpXHJcbmNvbnN0IFdpbmRvdyA9IHJlcXVpcmUoJy4vd2luZG93JylcclxuY29uc3QgV2luZG93T3B0aW9ucyA9IHJlcXVpcmUoJy4vd2luZG93LW9wdGlvbnMnKVxyXG5jb25zdCBTbmFwID0gcmVxdWlyZSgnLi9zbmFwJylcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgd2luZG93aW5nIHN5c3RlbSB0byBjcmVhdGUgYW5kIG1hbmFnZSB3aW5kb3dzXHJcbiAqXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgd20gPSBuZXcgV2luZG93TWFuYWdlcigpO1xyXG4gKlxyXG4gKiB3bS5jcmVhdGVXaW5kb3coeyB4OiAyMCwgeTogMjAsIHdpZHRoOiAyMDAgfSk7XHJcbiAqIHdtLmNvbnRlbnQuaW5uZXJIVE1MID0gJ0hlbGxvIHRoZXJlISc7XHJcbiAqL1xyXG5jbGFzcyBXaW5kb3dNYW5hZ2VyXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtXaW5kb3d+V2luZG93T3B0aW9uc30gW2RlZmF1bHRPcHRpb25zXSBkZWZhdWx0IFdpbmRvd09wdGlvbnMgdXNlZCB3aGVuIGNyZWF0ZVdpbmRvdyBpcyBjYWxsZWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2RlZmF1bHRPcHRpb25zLnF1aWV0XSBzdXBwcmVzcyB0aGUgc2ltcGxlLXdpbmRvdy1tYW5hZ2VyIGNvbnNvbGUgbWVzc2FnZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtkZWZhdWx0T3B0aW9ucy5zbmFwXSB0dXJuIG9uIGVkZ2Ugc25hcHBpbmdcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2RlZmF1bHRPcHRpb25zLnNuYXAuc2NyZWVuXSBzbmFwIHRvIGVkZ2Ugb2Ygc2NyZWVuXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtkZWZhdWx0T3B0aW9ucy5zbmFwLndpbmRvd3NdIHNuYXAgdG8gd2luZG93c1xyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihkZWZhdWx0T3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9jcmVhdGVEb20oKVxyXG4gICAgICAgIHRoaXMud2luZG93cyA9IFtdXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBudWxsXHJcbiAgICAgICAgdGhpcy5tb2RhbCA9IG51bGxcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBXaW5kb3dPcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV0gPSBXaW5kb3dPcHRpb25zW2tleV1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRlZmF1bHRPcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGRlZmF1bHRPcHRpb25zKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XSA9IGRlZmF1bHRPcHRpb25zW2tleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWRlZmF1bHRPcHRpb25zIHx8ICFkZWZhdWx0T3B0aW9ucy5xdWlldClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclYyDimJUgc2ltcGxlLXdpbmRvdy1tYW5hZ2VyIGluaXRpYWxpemVkIOKYlScsICdjb2xvcjogI2ZmMDBmZicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucGx1Z2lucyA9IFtdXHJcbiAgICAgICAgaWYgKGRlZmF1bHRPcHRpb25zICYmIGRlZmF1bHRPcHRpb25zWydzbmFwJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNuYXAoZGVmYXVsdE9wdGlvbnNbJ3NuYXAnXSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7V2luZG93fldpbmRvd09wdGlvbnN9IFtvcHRpb25zXVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRpdGxlXVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnhdIHBvc2l0aW9uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueV0gcG9zaXRpb25cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubW9kYWxdXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gW29wdGlvbnMuY2VudGVyXSBjZW50ZXIgaW4gdGhlIG1pZGRsZSBvZiBhbiBleGlzdGluZyBXaW5kb3dcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW29wdGlvbnMuaWRdIGlmIG5vdCBwcm92aWRlLCBpZCB3aWxsIGJlIGFzc2lnbmVkIGluIG9yZGVyIG9mIGNyZWF0aW9uICgwLCAxLCAyLi4uKVxyXG4gICAgICogQHJldHVybnMge1dpbmRvd30gdGhlIGNyZWF0ZWQgd2luZG93XHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZVdpbmRvdyhvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMub3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghZXhpc3RzKG9wdGlvbnNba2V5XSkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnNba2V5XSA9IHRoaXMub3B0aW9uc1trZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgd2luID0gbmV3IFdpbmRvdyh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICB3aW4ub24oJ29wZW4nLCB0aGlzLl9vcGVuLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignZm9jdXMnLCB0aGlzLl9mb2N1cywgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2JsdXInLCB0aGlzLl9ibHVyLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignY2xvc2UnLCB0aGlzLl9jbG9zZSwgdGhpcylcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2VudGVyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luLm1vdmUoXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNlbnRlci54ICsgb3B0aW9ucy5jZW50ZXIud2lkdGggLyAyIC0gKG9wdGlvbnMud2lkdGggPyBvcHRpb25zLndpZHRoIC8gMiA6IDApLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jZW50ZXIueSArIG9wdGlvbnMuY2VudGVyLmhlaWdodCAvIDIgLSAob3B0aW9ucy5oZWlnaHQgPyBvcHRpb25zLmhlaWdodCAvIDIgOiAwKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLm1vZGFsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RhbCA9IHdpblxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5wbHVnaW5zWydzbmFwJ10pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNbJ3NuYXAnXS5hZGRXaW5kb3cod2luKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gd2luXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGQgZWRnZSBzbmFwcGluZyBwbHVnaW5cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnNjcmVlbj10cnVlXSBzbmFwIHRvIHNjcmVlbiBlZGdlc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy53aW5kb3dzPXRydWVdIHNuYXAgdG8gd2luZG93IGVkZ2VzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc25hcD0yMF0gZGlzdGFuY2UgdG8gZWRnZSBiZWZvcmUgc25hcHBpbmdcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jb2xvcj0jYThmMGY0XSBjb2xvciBmb3Igc25hcCBiYXJzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc3BhY2luZz0wXSBzcGFjaW5nIGRpc3RhbmNlIGJldHdlZW4gd2luZG93IGFuZCBlZGdlc1xyXG4gICAgICovXHJcbiAgICBzbmFwKG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5wbHVnaW5zWydzbmFwJ10gPSBuZXcgU25hcCh0aGlzLCBvcHRpb25zKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVtb3ZlIHBsdWdpblxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgb2YgcGx1Z2luXHJcbiAgICAgKi9cclxuICAgIHJlbW92ZVBsdWdpbihuYW1lKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLnBsdWdpbnNbbmFtZV0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnBsdWdpbnNbbmFtZV0uc3RvcCgpXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnBsdWdpbnNbbmFtZV1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBmcm9udFxyXG4gICAgICogQHBhcmFtIHtXaW5kb3d9IHdpblxyXG4gICAgICovXHJcbiAgICBzZW5kVG9Gcm9udCh3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSB0aGlzLndpbmRvd3MubGVuZ3RoIC0gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5wdXNoKHdpbilcclxuICAgICAgICAgICAgdGhpcy5fcmVvcmRlcigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZCB3aW5kb3cgdG8gYmFja1xyXG4gICAgICogQHBhcmFtIHtXaW5kb3d9IHdpblxyXG4gICAgICovXHJcbiAgICBzZW5kVG9CYWNrKHdpbilcclxuICAgIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Muc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3MudW5zaGlmdCh3aW4pXHJcbiAgICAgICAgICAgIHRoaXMuX3Jlb3JkZXIoKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNhdmUgdGhlIHN0YXRlIG9mIGFsbCB0aGUgd2luZG93c1xyXG4gICAgICogQHJldHVybnMge29iamVjdH0gdXNlIHRoaXMgb2JqZWN0IGluIGxvYWQoKSB0byByZXN0b3JlIHRoZSBzdGF0ZSBvZiBhbGwgd2luZG93c1xyXG4gICAgICovXHJcbiAgICBzYXZlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBkYXRhID0ge31cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2luZG93cy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy53aW5kb3dzW2ldXHJcbiAgICAgICAgICAgIGRhdGFbZW50cnkuaWRdID0gZW50cnkuc2F2ZSgpXHJcbiAgICAgICAgICAgIGRhdGFbZW50cnkuaWRdLm9yZGVyID0gaVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVzdG9yZXMgdGhlIHN0YXRlIG9mIGFsbCB0aGUgd2luZG93c1xyXG4gICAgICogTk9URTogdGhpcyByZXF1aXJlcyB0aGF0IHRoZSB3aW5kb3dzIGhhdmUgdGhlIHNhbWUgaWQgYXMgd2hlbiBzYXZlKCkgd2FzIGNhbGxlZFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgY3JlYXRlZCBieSBzYXZlKClcclxuICAgICAqL1xyXG4gICAgbG9hZChkYXRhKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aW5kb3dzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLndpbmRvd3NbaV1cclxuICAgICAgICAgICAgaWYgKGRhdGFbZW50cnkuaWRdKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBlbnRyeS5sb2FkKGRhdGFbZW50cnkuaWRdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHJlb3JkZXIgd2luZG93c1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVvcmRlciB3aW5kb3dzXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICogQHJldHVybnMge251bWJlcn0gYXZhaWxhYmxlIHotaW5kZXggZm9yIHRvcCB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgX3Jlb3JkZXIoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBpID0gMFxyXG4gICAgICAgIGZvciAoOyBpIDwgdGhpcy53aW5kb3dzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzW2ldLnogPSBpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVEb20oKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogZG9jdW1lbnQuYm9keSwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICAnei1pbmRleCc6IC0xLFxyXG4gICAgICAgICAgICAgICAgJ2N1cnNvcic6ICdkZWZhdWx0J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLndpbiwgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICAndXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgJ3RvcCc6IDAsXHJcbiAgICAgICAgICAgICAgICAnbGVmdCc6IDAsXHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnaGVpZ2h0JzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbidcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCAoZSkgPT4gdGhpcy5fbW92ZShlKSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIChlKSA9PiB0aGlzLl91cChlKSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICB9XHJcblxyXG4gICAgX29wZW4od2luKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy53aW5kb3dzLmluZGV4T2Yod2luKVxyXG4gICAgICAgIGlmIChpbmRleCA9PT0gLTEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3MucHVzaCh3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9mb2N1cyh3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSB3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlLmJsdXIoKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSB0aGlzLndpbmRvd3MubGVuZ3RoIC0gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5wdXNoKHdpbilcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fcmVvcmRlcigpXHJcblxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gd2luXHJcbiAgICB9XHJcblxyXG4gICAgX2JsdXIod2luKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBudWxsXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jbG9zZSh3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMubW9kYWwgPT09IHdpbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kYWwgPSBudWxsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy53aW5kb3dzLmluZGV4T2Yod2luKVxyXG4gICAgICAgIGlmIChpbmRleCAhPT0gLTEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Muc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHdpbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuX2JsdXIod2luKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfbW92ZShlKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLndpbmRvd3MpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Nba2V5XS5fbW92ZShlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBfdXAoZSlcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy53aW5kb3dzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzW2tleV0uX3VwKGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jaGVja01vZGFsKHdpbilcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gIXRoaXMubW9kYWwgfHwgdGhpcy5tb2RhbCA9PT0gd2luXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2luZG93TWFuYWdlciJdfQ==