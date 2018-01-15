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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3ctbWFuYWdlci5qcyJdLCJuYW1lcyI6WyJleGlzdHMiLCJyZXF1aXJlIiwiaHRtbCIsIldpbmRvdyIsIldpbmRvd09wdGlvbnMiLCJTbmFwIiwiV2luZG93TWFuYWdlciIsImRlZmF1bHRPcHRpb25zIiwiX2NyZWF0ZURvbSIsIndpbmRvd3MiLCJhY3RpdmUiLCJtb2RhbCIsIm9wdGlvbnMiLCJrZXkiLCJxdWlldCIsImNvbnNvbGUiLCJsb2ciLCJwbHVnaW5zIiwic25hcCIsIndpbiIsIm9uIiwiX29wZW4iLCJfZm9jdXMiLCJfYmx1ciIsIl9jbG9zZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX21vdmUiLCJfdXAiLCJhZGRXaW5kb3ciLCJuYW1lIiwic3RvcCIsImluZGV4IiwiaW5kZXhPZiIsImxlbmd0aCIsInNwbGljZSIsInB1c2giLCJfcmVvcmRlciIsInVuc2hpZnQiLCJkYXRhIiwiaSIsImVudHJ5IiwiaWQiLCJzYXZlIiwib3JkZXIiLCJsb2FkIiwieiIsInBhcmVudCIsImRvY3VtZW50IiwiYm9keSIsInN0eWxlcyIsIm92ZXJsYXkiLCJibHVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxRQUFSLENBQWY7O0FBRUEsSUFBTUMsT0FBT0QsUUFBUSxRQUFSLENBQWI7QUFDQSxJQUFNRSxTQUFTRixRQUFRLFVBQVIsQ0FBZjtBQUNBLElBQU1HLGdCQUFnQkgsUUFBUSxrQkFBUixDQUF0QjtBQUNBLElBQU1JLE9BQU9KLFFBQVEsUUFBUixDQUFiOztBQUVBOzs7Ozs7Ozs7OztJQVVNSyxhO0FBRUY7Ozs7Ozs7Ozs7QUFVQSwyQkFBWUMsY0FBWixFQUNBO0FBQUE7O0FBQ0ksYUFBS0MsVUFBTDtBQUNBLGFBQUtDLE9BQUwsR0FBZSxFQUFmO0FBQ0EsYUFBS0MsTUFBTCxHQUFjLElBQWQ7QUFDQSxhQUFLQyxLQUFMLEdBQWEsSUFBYjtBQUNBLGFBQUtDLE9B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Ozs7Ozs7QUFHTGtDLE9BQU9DLE9BQVAsR0FBaUJoRCxhQUFqQiIsImZpbGUiOiJ3aW5kb3ctbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IGV4aXN0cyA9IHJlcXVpcmUoJ2V4aXN0cycpXHJcblxyXG5jb25zdCBodG1sID0gcmVxdWlyZSgnLi9odG1sJylcclxuY29uc3QgV2luZG93ID0gcmVxdWlyZSgnLi93aW5kb3cnKVxyXG5jb25zdCBXaW5kb3dPcHRpb25zID0gcmVxdWlyZSgnLi93aW5kb3ctb3B0aW9ucycpXHJcbmNvbnN0IFNuYXAgPSByZXF1aXJlKCcuL3NuYXAnKVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSB3aW5kb3dpbmcgc3lzdGVtIHRvIGNyZWF0ZSBhbmQgbWFuYWdlIHdpbmRvd3NcclxuICpcclxuICogQGV4dGVuZHMgRXZlbnRFbWl0dGVyXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciB3bSA9IG5ldyBXaW5kb3dNYW5hZ2VyKCk7XHJcbiAqXHJcbiAqIHdtLmNyZWF0ZVdpbmRvdyh7IHg6IDIwLCB5OiAyMCwgd2lkdGg6IDIwMCB9KTtcclxuICogd20uY29udGVudC5pbm5lckhUTUwgPSAnSGVsbG8gdGhlcmUhJztcclxuICovXHJcbmNsYXNzIFdpbmRvd01hbmFnZXJcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd35XaW5kb3dPcHRpb25zfSBbZGVmYXVsdE9wdGlvbnNdIGRlZmF1bHQgV2luZG93T3B0aW9ucyB1c2VkIHdoZW4gY3JlYXRlV2luZG93IGlzIGNhbGxlZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbZGVmYXVsdE9wdGlvbnMucXVpZXRdIHN1cHByZXNzIHRoZSBzaW1wbGUtd2luZG93LW1hbmFnZXIgY29uc29sZSBtZXNzYWdlXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW2RlZmF1bHRPcHRpb25zLnNuYXBdIHR1cm4gb24gZWRnZSBzbmFwcGluZ1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbZGVmYXVsdE9wdGlvbnMuc25hcC5zY3JlZW49dHJ1ZV0gc25hcCB0byBlZGdlIG9mIHNjcmVlblxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbZGVmYXVsdE9wdGlvbnMuc25hcC53aW5kb3dzPXRydWVdIHNuYXAgdG8gd2luZG93c1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtkZWZhdWx0T3B0aW9ucy5zbmFwLnNuYXA9MjBdIGRpc3RhbmNlIHRvIGVkZ2UgYmVmb3JlIHNuYXBwaW5nIGFuZCB3aWR0aC9oZWlnaHQgb2Ygc25hcCBiYXJzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW2RlZmF1bHRPcHRpb25zLnNuYXAuY29sb3I9I2E4ZjBmNF0gY29sb3IgZm9yIHNuYXAgYmFyc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtkZWZhdWx0T3B0aW9ucy5zbmFwLnNwYWNpbmc9NV0gc3BhY2luZyBkaXN0YW5jZSBiZXR3ZWVuIHdpbmRvdyBhbmQgZWRnZXNcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoZGVmYXVsdE9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5fY3JlYXRlRG9tKClcclxuICAgICAgICB0aGlzLndpbmRvd3MgPSBbXVxyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gbnVsbFxyXG4gICAgICAgIHRoaXMubW9kYWwgPSBudWxsXHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0ge31cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gV2luZG93T3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc1trZXldID0gV2luZG93T3B0aW9uc1trZXldXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZWZhdWx0T3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBkZWZhdWx0T3B0aW9ucylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV0gPSBkZWZhdWx0T3B0aW9uc1trZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFkZWZhdWx0T3B0aW9ucyB8fCAhZGVmYXVsdE9wdGlvbnMucXVpZXQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJWMg4piVIHNpbXBsZS13aW5kb3ctbWFuYWdlciBpbml0aWFsaXplZCDimJUnLCAnY29sb3I6ICNmZjAwZmYnKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBsdWdpbnMgPSBbXVxyXG4gICAgICAgIGlmIChkZWZhdWx0T3B0aW9ucyAmJiBkZWZhdWx0T3B0aW9uc1snc25hcCddKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zbmFwKGRlZmF1bHRPcHRpb25zWydzbmFwJ10pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIGEgd2luZG93XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd35XaW5kb3dPcHRpb25zfSBbb3B0aW9uc11cclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy50aXRsZV1cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy54XSBwb3NpdGlvblxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnldIHBvc2l0aW9uXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLm1vZGFsXVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbb3B0aW9ucy5pZF0gaWYgbm90IHByb3ZpZGUsIGlkIHdpbGwgYmUgYXNzaWduZWQgaW4gb3JkZXIgb2YgY3JlYXRpb24gKDAsIDEsIDIuLi4pXHJcbiAgICAgKiBAcmV0dXJucyB7V2luZG93fSB0aGUgY3JlYXRlZCB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgY3JlYXRlV2luZG93KG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5vcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCFleGlzdHMob3B0aW9uc1trZXldKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uc1trZXldID0gdGhpcy5vcHRpb25zW2tleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB3aW4gPSBuZXcgV2luZG93KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgIHdpbi5vbignb3BlbicsIHRoaXMuX29wZW4sIHRoaXMpXHJcbiAgICAgICAgd2luLm9uKCdmb2N1cycsIHRoaXMuX2ZvY3VzLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignYmx1cicsIHRoaXMuX2JsdXIsIHRoaXMpXHJcbiAgICAgICAgd2luLm9uKCdjbG9zZScsIHRoaXMuX2Nsb3NlLCB0aGlzKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCAoZSkgPT4gdGhpcy5fbW92ZShlKSlcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIChlKSA9PiB0aGlzLl91cChlKSlcclxuICAgICAgICBpZiAob3B0aW9ucy5tb2RhbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubW9kYWwgPSB3aW5cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1snc25hcCddKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW5zWydzbmFwJ10uYWRkV2luZG93KHdpbilcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHdpblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkIGVkZ2Ugc25hcHBpbmcgcGx1Z2luXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5zY3JlZW49dHJ1ZV0gc25hcCB0byBzY3JlZW4gZWRnZXNcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMud2luZG93cz10cnVlXSBzbmFwIHRvIHdpbmRvdyBlZGdlc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNuYXA9MjBdIGRpc3RhbmNlIHRvIGVkZ2UgYmVmb3JlIHNuYXBwaW5nXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY29sb3I9I2E4ZjBmNF0gY29sb3IgZm9yIHNuYXAgYmFyc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNwYWNpbmc9MF0gc3BhY2luZyBkaXN0YW5jZSBiZXR3ZWVuIHdpbmRvdyBhbmQgZWRnZXNcclxuICAgICAqL1xyXG4gICAgc25hcChvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMucGx1Z2luc1snc25hcCddID0gbmV3IFNuYXAodGhpcywgb3B0aW9ucylcclxuICAgICAgICBmb3IgKGxldCB3aW4gb2YgdGhpcy53aW5kb3dzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5wbHVnaW5zWydzbmFwJ10uYWRkV2luZG93KHdpbilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW1vdmUgcGx1Z2luXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBvZiBwbHVnaW5cclxuICAgICAqL1xyXG4gICAgcmVtb3ZlUGx1Z2luKG5hbWUpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMucGx1Z2luc1tuYW1lXSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucGx1Z2luc1tuYW1lXS5zdG9wKClcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMucGx1Z2luc1tuYW1lXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNlbmQgd2luZG93IHRvIGZyb250XHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0Zyb250KHdpbilcclxuICAgIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMud2luZG93cy5sZW5ndGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgICAgICB0aGlzLl9yZW9yZGVyKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBiYWNrXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gd2luXHJcbiAgICAgKi9cclxuICAgIHNlbmRUb0JhY2sod2luKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy53aW5kb3dzLmluZGV4T2Yod2luKVxyXG4gICAgICAgIGlmIChpbmRleCAhPT0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy51bnNoaWZ0KHdpbilcclxuICAgICAgICAgICAgdGhpcy5fcmVvcmRlcigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2F2ZSB0aGUgc3RhdGUgb2YgYWxsIHRoZSB3aW5kb3dzXHJcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSB1c2UgdGhpcyBvYmplY3QgaW4gbG9hZCgpIHRvIHJlc3RvcmUgdGhlIHN0YXRlIG9mIGFsbCB3aW5kb3dzXHJcbiAgICAgKi9cclxuICAgIHNhdmUoKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB7fVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aW5kb3dzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLndpbmRvd3NbaV1cclxuICAgICAgICAgICAgZGF0YVtlbnRyeS5pZF0gPSBlbnRyeS5zYXZlKClcclxuICAgICAgICAgICAgZGF0YVtlbnRyeS5pZF0ub3JkZXIgPSBpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBkYXRhXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXN0b3JlcyB0aGUgc3RhdGUgb2YgYWxsIHRoZSB3aW5kb3dzXHJcbiAgICAgKiBOT1RFOiB0aGlzIHJlcXVpcmVzIHRoYXQgdGhlIHdpbmRvd3MgaGF2ZSB0aGUgc2FtZSBpZCBhcyB3aGVuIHNhdmUoKSB3YXMgY2FsbGVkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBjcmVhdGVkIGJ5IHNhdmUoKVxyXG4gICAgICovXHJcbiAgICBsb2FkKGRhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndpbmRvd3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBlbnRyeSA9IHRoaXMud2luZG93c1tpXVxyXG4gICAgICAgICAgICBpZiAoZGF0YVtlbnRyeS5pZF0pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGVudHJ5LmxvYWQoZGF0YVtlbnRyeS5pZF0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcmVvcmRlciB3aW5kb3dzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZW9yZGVyIHdpbmRvd3NcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBhdmFpbGFibGUgei1pbmRleCBmb3IgdG9wIHdpbmRvd1xyXG4gICAgICovXHJcbiAgICBfcmVvcmRlcigpXHJcbiAgICB7XHJcbiAgICAgICAgbGV0IGkgPSAwXHJcbiAgICAgICAgZm9yICg7IGkgPCB0aGlzLndpbmRvd3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3NbaV0ueiA9IGlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NyZWF0ZURvbSgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy53aW4gPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiBkb2N1bWVudC5ib2R5LCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgICAgICd6LWluZGV4JzogLTEsXHJcbiAgICAgICAgICAgICAgICAnY3Vyc29yJzogJ2RlZmF1bHQnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMub3ZlcmxheSA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIChlKSA9PiB0aGlzLl91cChlKSlcclxuICAgIH1cclxuXHJcbiAgICBfb3Blbih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5wdXNoKHdpbilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2ZvY3VzKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHdpbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUuYmx1cigpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMud2luZG93cy5sZW5ndGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZW9yZGVyKClcclxuXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB3aW5cclxuICAgIH1cclxuXHJcbiAgICBfYmx1cih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSB3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2Nsb3NlKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5tb2RhbCA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RhbCA9IG51bGxcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fYmx1cih3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9tb3ZlKGUpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93c1trZXldLl9tb3ZlKGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF91cChlKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLndpbmRvd3MpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Nba2V5XS5fdXAoZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NoZWNrTW9kYWwod2luKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhdGhpcy5tb2RhbCB8fCB0aGlzLm1vZGFsID09PSB3aW5cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3dNYW5hZ2VyIl19