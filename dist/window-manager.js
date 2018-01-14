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
     * @param {number} [defaultOptions.snap.spacing=0] spacing distance between window and edges
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3ctbWFuYWdlci5qcyJdLCJuYW1lcyI6WyJleGlzdHMiLCJyZXF1aXJlIiwiaHRtbCIsIldpbmRvdyIsIldpbmRvd09wdGlvbnMiLCJTbmFwIiwiV2luZG93TWFuYWdlciIsImRlZmF1bHRPcHRpb25zIiwiX2NyZWF0ZURvbSIsIndpbmRvd3MiLCJhY3RpdmUiLCJtb2RhbCIsIm9wdGlvbnMiLCJrZXkiLCJxdWlldCIsImNvbnNvbGUiLCJsb2ciLCJwbHVnaW5zIiwic25hcCIsIndpbiIsIm9uIiwiX29wZW4iLCJfZm9jdXMiLCJfYmx1ciIsIl9jbG9zZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX21vdmUiLCJfdXAiLCJjZW50ZXIiLCJtb3ZlIiwieCIsIndpZHRoIiwieSIsImhlaWdodCIsImFkZFdpbmRvdyIsIm5hbWUiLCJzdG9wIiwiaW5kZXgiLCJpbmRleE9mIiwibGVuZ3RoIiwic3BsaWNlIiwicHVzaCIsIl9yZW9yZGVyIiwidW5zaGlmdCIsImRhdGEiLCJpIiwiZW50cnkiLCJpZCIsInNhdmUiLCJvcmRlciIsImxvYWQiLCJ6IiwicGFyZW50IiwiZG9jdW1lbnQiLCJib2R5Iiwic3R5bGVzIiwib3ZlcmxheSIsImJsdXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFNQSxTQUFTQyxRQUFRLFFBQVIsQ0FBZjs7QUFFQSxJQUFNQyxPQUFPRCxRQUFRLFFBQVIsQ0FBYjtBQUNBLElBQU1FLFNBQVNGLFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBTUcsZ0JBQWdCSCxRQUFRLGtCQUFSLENBQXRCO0FBQ0EsSUFBTUksT0FBT0osUUFBUSxRQUFSLENBQWI7O0FBRUE7Ozs7Ozs7Ozs7O0lBVU1LLGE7QUFFRjs7Ozs7Ozs7OztBQVVBLDJCQUFZQyxjQUFaLEVBQ0E7QUFBQTs7QUFDSSxhQUFLQyxVQUFMO0FBQ0EsYUFBS0MsT0FBTCxHQUFlLEVBQWY7QUFDQSxhQUFLQyxNQUFMLEdBQWMsSUFB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QUFDSjs7OzRCQUVHQSxDLEVBQ0o7QUFDSSxpQkFBSyxJQUFJYixHQUFULElBQWdCLEtBQUtKLE9BQXJCLEVBQ0E7QUFDSSxxQkFBS0EsT0FBTCxDQUFhSSxHQUFiLEVBQWtCZSxHQUFsQixDQUFzQkYsQ0FBdEI7QUFDSDtBQUNKOzs7b0NBRVdQLEcsRUFDWjtBQUNJLG1CQUFPLENBQUMsS0FBS1IsS0FBTixJQUFlLEtBQUtBLEtBQUwsS0FBZVEsR0FBckM7QUFDSDs7Ozs7O0FBR0x3QyxPQUFPQyxPQUFQLEdBQWlCdEQsYUFBakIiLCJmaWxlIjoid2luZG93LW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBleGlzdHMgPSByZXF1aXJlKCdleGlzdHMnKVxyXG5cclxuY29uc3QgaHRtbCA9IHJlcXVpcmUoJy4vaHRtbCcpXHJcbmNvbnN0IFdpbmRvdyA9IHJlcXVpcmUoJy4vd2luZG93JylcclxuY29uc3QgV2luZG93T3B0aW9ucyA9IHJlcXVpcmUoJy4vd2luZG93LW9wdGlvbnMnKVxyXG5jb25zdCBTbmFwID0gcmVxdWlyZSgnLi9zbmFwJylcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgd2luZG93aW5nIHN5c3RlbSB0byBjcmVhdGUgYW5kIG1hbmFnZSB3aW5kb3dzXHJcbiAqXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgd20gPSBuZXcgV2luZG93TWFuYWdlcigpO1xyXG4gKlxyXG4gKiB3bS5jcmVhdGVXaW5kb3coeyB4OiAyMCwgeTogMjAsIHdpZHRoOiAyMDAgfSk7XHJcbiAqIHdtLmNvbnRlbnQuaW5uZXJIVE1MID0gJ0hlbGxvIHRoZXJlISc7XHJcbiAqL1xyXG5jbGFzcyBXaW5kb3dNYW5hZ2VyXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtXaW5kb3d+V2luZG93T3B0aW9uc30gW2RlZmF1bHRPcHRpb25zXSBkZWZhdWx0IFdpbmRvd09wdGlvbnMgdXNlZCB3aGVuIGNyZWF0ZVdpbmRvdyBpcyBjYWxsZWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2RlZmF1bHRPcHRpb25zLnF1aWV0XSBzdXBwcmVzcyB0aGUgc2ltcGxlLXdpbmRvdy1tYW5hZ2VyIGNvbnNvbGUgbWVzc2FnZVxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtkZWZhdWx0T3B0aW9ucy5zbmFwXSB0dXJuIG9uIGVkZ2Ugc25hcHBpbmdcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2RlZmF1bHRPcHRpb25zLnNuYXAuc2NyZWVuPXRydWVdIHNuYXAgdG8gZWRnZSBvZiBzY3JlZW5cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2RlZmF1bHRPcHRpb25zLnNuYXAud2luZG93cz10cnVlXSBzbmFwIHRvIHdpbmRvd3NcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZGVmYXVsdE9wdGlvbnMuc25hcC5zbmFwPTIwXSBkaXN0YW5jZSB0byBlZGdlIGJlZm9yZSBzbmFwcGluZyBhbmQgd2lkdGgvaGVpZ2h0IG9mIHNuYXAgYmFyc1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtkZWZhdWx0T3B0aW9ucy5zbmFwLmNvbG9yPSNhOGYwZjRdIGNvbG9yIGZvciBzbmFwIGJhcnNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbZGVmYXVsdE9wdGlvbnMuc25hcC5zcGFjaW5nPTBdIHNwYWNpbmcgZGlzdGFuY2UgYmV0d2VlbiB3aW5kb3cgYW5kIGVkZ2VzXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGRlZmF1bHRPcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuX2NyZWF0ZURvbSgpXHJcbiAgICAgICAgdGhpcy53aW5kb3dzID0gW11cclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGxcclxuICAgICAgICB0aGlzLm1vZGFsID0gbnVsbFxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHt9XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIFdpbmRvd09wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XSA9IFdpbmRvd09wdGlvbnNba2V5XVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZGVmYXVsdE9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gZGVmYXVsdE9wdGlvbnMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uc1trZXldID0gZGVmYXVsdE9wdGlvbnNba2V5XVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghZGVmYXVsdE9wdGlvbnMgfHwgIWRlZmF1bHRPcHRpb25zLnF1aWV0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJyVjIOKYlSBzaW1wbGUtd2luZG93LW1hbmFnZXIgaW5pdGlhbGl6ZWQg4piVJywgJ2NvbG9yOiAjZmYwMGZmJylcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wbHVnaW5zID0gW11cclxuICAgICAgICBpZiAoZGVmYXVsdE9wdGlvbnMgJiYgZGVmYXVsdE9wdGlvbnNbJ3NuYXAnXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc25hcChkZWZhdWx0T3B0aW9uc1snc25hcCddKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhIHdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtXaW5kb3d+V2luZG93T3B0aW9uc30gW29wdGlvbnNdXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMudGl0bGVdXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueF0gcG9zaXRpb25cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy55XSBwb3NpdGlvblxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5tb2RhbF1cclxuICAgICAqIEBwYXJhbSB7V2luZG93fSBbb3B0aW9ucy5jZW50ZXJdIGNlbnRlciBpbiB0aGUgbWlkZGxlIG9mIGFuIGV4aXN0aW5nIFdpbmRvd1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbb3B0aW9ucy5pZF0gaWYgbm90IHByb3ZpZGUsIGlkIHdpbGwgYmUgYXNzaWduZWQgaW4gb3JkZXIgb2YgY3JlYXRpb24gKDAsIDEsIDIuLi4pXHJcbiAgICAgKiBAcmV0dXJucyB7V2luZG93fSB0aGUgY3JlYXRlZCB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgY3JlYXRlV2luZG93KG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5vcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMob3B0aW9uc1trZXldKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uc1trZXldID0gdGhpcy5vcHRpb25zW2tleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB3aW4gPSBuZXcgV2luZG93KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgIHdpbi5vbignb3BlbicsIHRoaXMuX29wZW4sIHRoaXMpXHJcbiAgICAgICAgd2luLm9uKCdmb2N1cycsIHRoaXMuX2ZvY3VzLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignYmx1cicsIHRoaXMuX2JsdXIsIHRoaXMpXHJcbiAgICAgICAgd2luLm9uKCdjbG9zZScsIHRoaXMuX2Nsb3NlLCB0aGlzKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCAoZSkgPT4gdGhpcy5fbW92ZShlKSlcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIChlKSA9PiB0aGlzLl91cChlKSlcclxuICAgICAgICBpZiAob3B0aW9ucy5jZW50ZXIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aW4ubW92ZShcclxuICAgICAgICAgICAgICAgIG9wdGlvbnMuY2VudGVyLnggKyBvcHRpb25zLmNlbnRlci53aWR0aCAvIDIgLSAob3B0aW9ucy53aWR0aCA/IG9wdGlvbnMud2lkdGggLyAyIDogMCksXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNlbnRlci55ICsgb3B0aW9ucy5jZW50ZXIuaGVpZ2h0IC8gMiAtIChvcHRpb25zLmhlaWdodCA/IG9wdGlvbnMuaGVpZ2h0IC8gMiA6IDApXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMubW9kYWwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLm1vZGFsID0gd2luXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnBsdWdpbnNbJ3NuYXAnXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1snc25hcCddLmFkZFdpbmRvdyh3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB3aW5cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZCBlZGdlIHNuYXBwaW5nIHBsdWdpblxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuc2NyZWVuPXRydWVdIHNuYXAgdG8gc2NyZWVuIGVkZ2VzXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLndpbmRvd3M9dHJ1ZV0gc25hcCB0byB3aW5kb3cgZWRnZXNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5zbmFwPTIwXSBkaXN0YW5jZSB0byBlZGdlIGJlZm9yZSBzbmFwcGluZ1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLmNvbG9yPSNhOGYwZjRdIGNvbG9yIGZvciBzbmFwIGJhcnNcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5zcGFjaW5nPTBdIHNwYWNpbmcgZGlzdGFuY2UgYmV0d2VlbiB3aW5kb3cgYW5kIGVkZ2VzXHJcbiAgICAgKi9cclxuICAgIHNuYXAob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICB0aGlzLnBsdWdpbnNbJ3NuYXAnXSA9IG5ldyBTbmFwKHRoaXMsIG9wdGlvbnMpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgcGx1Z2luXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiBwbHVnaW5cclxuICAgICAqL1xyXG4gICAgcmVtb3ZlUGx1Z2luKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1tuYW1lXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1tuYW1lXS5zdG9wKClcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMucGx1Z2luc1tuYW1lXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmQgd2luZG93IHRvIGZyb250XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0Zyb250KHdpbilcclxuICAgIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMud2luZG93cy5sZW5ndGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgICAgICB0aGlzLl9yZW9yZGVyKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBiYWNrXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0JhY2sod2luKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy53aW5kb3dzLmluZGV4T2Yod2luKVxyXG4gICAgICAgIGlmIChpbmRleCAhPT0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy51bnNoaWZ0KHdpbilcclxuICAgICAgICAgICAgdGhpcy5fcmVvcmRlcigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2F2ZSB0aGUgc3RhdGUgb2YgYWxsIHRoZSB3aW5kb3dzXHJcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSB1c2UgdGhpcyBvYmplY3QgaW4gbG9hZCgpIHRvIHJlc3RvcmUgdGhlIHN0YXRlIG9mIGFsbCB3aW5kb3dzXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7fVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aW5kb3dzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLndpbmRvd3NbaV1cclxuICAgICAgICAgICAgZGF0YVtlbnRyeS5pZF0gPSBlbnRyeS5zYXZlKClcclxuICAgICAgICAgICAgZGF0YVtlbnRyeS5pZF0ub3JkZXIgPSBpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXN0b3JlcyB0aGUgc3RhdGUgb2YgYWxsIHRoZSB3aW5kb3dzXHJcbiAgICAgKiBOT1RFOiB0aGlzIHJlcXVpcmVzIHRoYXQgdGhlIHdpbmRvd3MgaGF2ZSB0aGUgc2FtZSBpZCBhcyB3aGVuIHNhdmUoKSB3YXMgY2FsbGVkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBjcmVhdGVkIGJ5IHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndpbmRvd3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMud2luZG93c1tpXVxyXG4gICAgICAgICAgICBpZiAoZGF0YVtlbnRyeS5pZF0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGVudHJ5LmxvYWQoZGF0YVtlbnRyeS5pZF0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcmVvcmRlciB3aW5kb3dzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW9yZGVyIHdpbmRvd3NcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBhdmFpbGFibGUgei1pbmRleCBmb3IgdG9wIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBfcmVvcmRlcigpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGkgPSAwXHJcbiAgICAgICAgZm9yICg7IGkgPCB0aGlzLndpbmRvd3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3NbaV0ueiA9IGlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZURvbSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4gPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiBkb2N1bWVudC5ib2R5LCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICd6LWluZGV4JzogLTEsXHJcbiAgICAgICAgICAgICAgICAnY3Vyc29yJzogJ2RlZmF1bHQnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIChlKSA9PiB0aGlzLl91cChlKSlcclxuICAgIH1cclxuXHJcbiAgICBfb3Blbih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5wdXNoKHdpbilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2ZvY3VzKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHdpbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUuYmx1cigpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMud2luZG93cy5sZW5ndGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZW9yZGVyKClcclxuXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB3aW5cclxuICAgIH1cclxuXHJcbiAgICBfYmx1cih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSB3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2Nsb3NlKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5tb2RhbCA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RhbCA9IG51bGxcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fYmx1cih3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9tb3ZlKGUpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93c1trZXldLl9tb3ZlKGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF91cChlKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLndpbmRvd3MpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Nba2V5XS5fdXAoZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NoZWNrTW9kYWwod2luKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhdGhpcy5tb2RhbCB8fCB0aGlzLm1vZGFsID09PSB3aW5cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3dNYW5hZ2VyIl19