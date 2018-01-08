'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var exists = require('exists');

var html = require('./html');
var Window = require('./window');
var WindowOptions = require('./window-options');

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
        if (!defaultOptions.quiet) {
            console.log('%c ☕ simple-window-manager initialized ☕', 'color: #ff00ff');
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
            return win;
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

            this.win = html.create({
                parent: document.body, styles: {
                    'user-select': 'none',
                    'width': '100%',
                    'height': '100%',
                    'overflow': 'hidden',
                    'z-index': -1,
                    'cursor': 'default'
                }
            });
            this.overlay = html.create({
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3ctbWFuYWdlci5qcyJdLCJuYW1lcyI6WyJleGlzdHMiLCJyZXF1aXJlIiwiaHRtbCIsIldpbmRvdyIsIldpbmRvd09wdGlvbnMiLCJXaW5kb3dNYW5hZ2VyIiwiZGVmYXVsdE9wdGlvbnMiLCJfY3JlYXRlRG9tIiwid2luZG93cyIsImFjdGl2ZSIsIm1vZGFsIiwib3B0aW9ucyIsImtleSIsInF1aWV0IiwiY29uc29sZSIsImxvZyIsIndpbiIsIm9uIiwiX29wZW4iLCJfZm9jdXMiLCJfYmx1ciIsIl9jbG9zZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJlIiwiX21vdmUiLCJfdXAiLCJjZW50ZXIiLCJtb3ZlIiwieCIsIndpZHRoIiwieSIsImhlaWdodCIsImluZGV4IiwiaW5kZXhPZiIsImxlbmd0aCIsInNwbGljZSIsInB1c2giLCJfcmVvcmRlciIsInVuc2hpZnQiLCJkYXRhIiwiaSIsImVudHJ5IiwiaWQiLCJzYXZlIiwib3JkZXIiLCJsb2FkIiwieiIsImNyZWF0ZSIsInBhcmVudCIsImRvY3VtZW50IiwiYm9keSIsInN0eWxlcyIsIm92ZXJsYXkiLCJibHVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxRQUFSLENBQWY7O0FBRUEsSUFBTUMsT0FBT0QsUUFBUSxRQUFSLENBQWI7QUFDQSxJQUFNRSxTQUFTRixRQUFRLFVBQVIsQ0FBZjtBQUNBLElBQU1HLGdCQUFnQkgsUUFBUSxrQkFBUixDQUF0Qjs7QUFFQTs7Ozs7Ozs7Ozs7SUFVTUksYTtBQUVGOzs7O0FBSUEsMkJBQVlDLGNBQVosRUFDQTtBQUFBOztBQUNJLGFBQUtDLFVBQUw7QUFDQSxhQUFLQyxPQUFMLEdBQWUsRUFBZjtBQUNBLGFBQUtDLE1BQUwsR0FBYyxJQUFkO0FBQ0EsYUFBS0MsS0FBTCxHQUFhLElBQWI7QUFDQSxhQUFLQyxPQUFMLEdBQWUsRUFBZjtBQUNBLGFBQUssSUFBSUMsR0FBVCxJQUFn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LGdCQUFNc0IsUUFBUSxLQUFLeEIsT0FBTCxDQUFheUIsT0FBYixDQUFxQmpCLEdBQXJCLENBQWQ7QUFDQSxnQkFBSWdCLFVBQVUsQ0FBQyxDQUFmLEVBQ0E7QUFDSSxxQkFBS3hCLE9BQUwsQ0FBYTJCLE1BQWIsQ0FBb0JILEtBQXBCLEVBQTJCLENBQTNCO0FBQ0g7QUFDRCxnQkFBSSxLQUFLdkIsTUFBTCxLQUFnQk8sR0FBcEIsRUFDQTtBQUNJLHFCQUFLSSxLQUFMLENBQVdKLEdBQVg7QUFDSDtBQUNKOzs7OEJBRUtPLEMsRUFDTjtBQUNJLGlCQUFLLElBQUlYLEdBQVQsSUFBZ0IsS0FBS0osT0FBckIsRUFDQTtBQUNJLHFCQUFLQSxPQUFMLENBQWFJLEdBQWIsRUFBa0JZLEtBQWxCLENBQXdCRCxDQUF4QjtBQUNIO0FBQ0o7Ozs0QkFFR0EsQyxFQUNKO0FBQ0ksaUJBQUssSUFBSVgsR0FBVCxJQUFnQixLQUFLSixPQUFyQixFQUNBO0FBQ0kscUJBQUtBLE9BQUwsQ0FBYUksR0FBYixFQUFrQmEsR0FBbEIsQ0FBc0JGLENBQXRCO0FBQ0g7QUFDSjs7O29DQUVXUCxHLEVBQ1o7QUFDSSxtQkFBTyxDQUFDLEtBQUtOLEtBQU4sSUFBZSxLQUFLQSxLQUFMLEtBQWVNLEdBQXJDO0FBQ0g7Ozs7OztBQUdMc0MsT0FBT0MsT0FBUCxHQUFpQmxELGFBQWpCIiwiZmlsZSI6IndpbmRvdy1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5jb25zdCBXaW5kb3cgPSByZXF1aXJlKCcuL3dpbmRvdycpXHJcbmNvbnN0IFdpbmRvd09wdGlvbnMgPSByZXF1aXJlKCcuL3dpbmRvdy1vcHRpb25zJylcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgd2luZG93aW5nIHN5c3RlbSB0byBjcmVhdGUgYW5kIG1hbmFnZSB3aW5kb3dzXHJcbiAqXHJcbiAqIEBleHRlbmRzIEV2ZW50RW1pdHRlclxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgd20gPSBuZXcgV2luZG93TWFuYWdlcigpO1xyXG4gKlxyXG4gKiB3bS5jcmVhdGVXaW5kb3coeyB4OiAyMCwgeTogMjAsIHdpZHRoOiAyMDAgfSk7XHJcbiAqIHdtLmNvbnRlbnQuaW5uZXJIVE1MID0gJ0hlbGxvIHRoZXJlISc7XHJcbiAqL1xyXG5jbGFzcyBXaW5kb3dNYW5hZ2VyXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtXaW5kb3d+V2luZG93T3B0aW9uc30gW2RlZmF1bHRPcHRpb25zXSBkZWZhdWx0IFdpbmRvd09wdGlvbnMgdXNlZCB3aGVuIGNyZWF0ZVdpbmRvdyBpcyBjYWxsZWRcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2RlZmF1bHRPcHRpb25zLnF1aWV0XSBzdXBwcmVzcyB0aGUgc2ltcGxlLXdpbmRvdy1tYW5hZ2VyIGNvbnNvbGUgbWVzc2FnZVxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihkZWZhdWx0T3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICB0aGlzLl9jcmVhdGVEb20oKVxyXG4gICAgICAgIHRoaXMud2luZG93cyA9IFtdXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBudWxsXHJcbiAgICAgICAgdGhpcy5tb2RhbCA9IG51bGxcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB7fVxyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBXaW5kb3dPcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zW2tleV0gPSBXaW5kb3dPcHRpb25zW2tleV1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGRlZmF1bHRPcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGRlZmF1bHRPcHRpb25zKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnNba2V5XSA9IGRlZmF1bHRPcHRpb25zW2tleV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIWRlZmF1bHRPcHRpb25zLnF1aWV0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJyVjIOKYlSBzaW1wbGUtd2luZG93LW1hbmFnZXIgaW5pdGlhbGl6ZWQg4piVJywgJ2NvbG9yOiAjZmYwMGZmJylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgYSB3aW5kb3dcclxuICAgICAqIEBwYXJhbSB7V2luZG93fldpbmRvd09wdGlvbnN9IFtvcHRpb25zXVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnRpdGxlXVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnhdIHBvc2l0aW9uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMueV0gcG9zaXRpb25cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubW9kYWxdXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd30gW29wdGlvbnMuY2VudGVyXSBjZW50ZXIgaW4gdGhlIG1pZGRsZSBvZiBhbiBleGlzdGluZyBXaW5kb3dcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW29wdGlvbnMuaWRdIGlmIG5vdCBwcm92aWRlLCBpZCB3aWxsIGJlIGFzc2lnbmVkIGluIG9yZGVyIG9mIGNyZWF0aW9uICgwLCAxLCAyLi4uKVxyXG4gICAgICogQGZpcmVzIG9wZW5cclxuICAgICAqIEBmaXJlcyBmb2N1c1xyXG4gICAgICogQGZpcmVzIGJsdXJcclxuICAgICAqIEBmaXJlcyBjbG9zZVxyXG4gICAgICogQGZpcmVzIG1heGltaXplXHJcbiAgICAgKiBAZmlyZXMgbWF4aW1pemUtcmVzdG9yZVxyXG4gICAgICogQGZpcmVzIG1pbmltaXplXHJcbiAgICAgKiBAZmlyZXMgbWluaW1pemUtcmVzdG9yZVxyXG4gICAgICogQGZpcmVzIG1vdmVcclxuICAgICAqIEBmaXJlcyBtb3ZlLXN0YXJ0XHJcbiAgICAgKiBAZmlyZXMgbW92ZS1lbmRcclxuICAgICAqIEBmaXJlcyByZXNpemVcclxuICAgICAqIEBmaXJlcyByZXNpemUtc3RhcnRcclxuICAgICAqIEBmaXJlcyByZXNpemUtZW5kXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZVdpbmRvdyhvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMub3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghZXhpc3RzKG9wdGlvbnNba2V5XSkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnNba2V5XSA9IHRoaXMub3B0aW9uc1trZXldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgd2luID0gbmV3IFdpbmRvdyh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICB3aW4ub24oJ29wZW4nLCB0aGlzLl9vcGVuLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignZm9jdXMnLCB0aGlzLl9mb2N1cywgdGhpcylcclxuICAgICAgICB3aW4ub24oJ2JsdXInLCB0aGlzLl9ibHVyLCB0aGlzKVxyXG4gICAgICAgIHdpbi5vbignY2xvc2UnLCB0aGlzLl9jbG9zZSwgdGhpcylcclxuICAgICAgICB3aW4ud2luLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgd2luLndpbi5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIHdpbi53aW4uYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCAoZSkgPT4gdGhpcy5fdXAoZSkpXHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2VudGVyKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgd2luLm1vdmUoXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zLmNlbnRlci54ICsgb3B0aW9ucy5jZW50ZXIud2lkdGggLyAyIC0gKG9wdGlvbnMud2lkdGggPyBvcHRpb25zLndpZHRoIC8gMiA6IDApLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5jZW50ZXIueSArIG9wdGlvbnMuY2VudGVyLmhlaWdodCAvIDIgLSAob3B0aW9ucy5oZWlnaHQgPyBvcHRpb25zLmhlaWdodCAvIDIgOiAwKVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLm1vZGFsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RhbCA9IHdpblxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gd2luXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZW5kIHdpbmRvdyB0byBmcm9udFxyXG4gICAgICogQHBhcmFtIHtXaW5kb3d9IHdpblxyXG4gICAgICovXHJcbiAgICBzZW5kVG9Gcm9udCh3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSB0aGlzLndpbmRvd3MubGVuZ3RoIC0gMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5wdXNoKHdpbilcclxuICAgICAgICAgICAgdGhpcy5fcmVvcmRlcigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2VuZCB3aW5kb3cgdG8gYmFja1xyXG4gICAgICogQHBhcmFtIHtXaW5kb3d9IHdpblxyXG4gICAgICovXHJcbiAgICBzZW5kVG9CYWNrKHdpbilcclxuICAgIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Muc3BsaWNlKGluZGV4LCAxKVxyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3MudW5zaGlmdCh3aW4pXHJcbiAgICAgICAgICAgIHRoaXMuX3Jlb3JkZXIoKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNhdmUgdGhlIHN0YXRlIG9mIGFsbCB0aGUgd2luZG93c1xyXG4gICAgICogQHJldHVybnMge29iamVjdH0gdXNlIHRoaXMgb2JqZWN0IGluIGxvYWQoKSB0byByZXN0b3JlIHRoZSBzdGF0ZSBvZiBhbGwgd2luZG93c1xyXG4gICAgICovXHJcbiAgICBzYXZlKClcclxuICAgIHtcclxuICAgICAgICBjb25zdCBkYXRhID0ge31cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2luZG93cy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy53aW5kb3dzW2ldXHJcbiAgICAgICAgICAgIGRhdGFbZW50cnkuaWRdID0gZW50cnkuc2F2ZSgpXHJcbiAgICAgICAgICAgIGRhdGFbZW50cnkuaWRdLm9yZGVyID0gaVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZGF0YVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVzdG9yZXMgdGhlIHN0YXRlIG9mIGFsbCB0aGUgd2luZG93c1xyXG4gICAgICogTk9URTogdGhpcyByZXF1aXJlcyB0aGF0IHRoZSB3aW5kb3dzIGhhdmUgdGhlIHNhbWUgaWQgYXMgd2hlbiBzYXZlKCkgd2FzIGNhbGxlZFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgY3JlYXRlZCBieSBzYXZlKClcclxuICAgICAqL1xyXG4gICAgbG9hZChkYXRhKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aW5kb3dzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3QgZW50cnkgPSB0aGlzLndpbmRvd3NbaV1cclxuICAgICAgICAgICAgaWYgKGRhdGFbZW50cnkuaWRdKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBlbnRyeS5sb2FkKGRhdGFbZW50cnkuaWRdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHJlb3JkZXIgd2luZG93c1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVvcmRlciB3aW5kb3dzXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICogQHJldHVybnMge251bWJlcn0gYXZhaWxhYmxlIHotaW5kZXggZm9yIHRvcCB3aW5kb3dcclxuICAgICAqL1xyXG4gICAgX3Jlb3JkZXIoKVxyXG4gICAge1xyXG4gICAgICAgIGxldCBpID0gMFxyXG4gICAgICAgIGZvciAoOyBpIDwgdGhpcy53aW5kb3dzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzW2ldLnogPSBpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9jcmVhdGVEb20oKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMud2luID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IGRvY3VtZW50LmJvZHksIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgJ3otaW5kZXgnOiAtMSxcclxuICAgICAgICAgICAgICAgICdjdXJzb3InOiAnZGVmYXVsdCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5vdmVybGF5ID0gaHRtbC5jcmVhdGUoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMud2luLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgICd1c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICAgICAgICAgICAgICdwb3NpdGlvbic6ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgICAgICdsZWZ0JzogMCxcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLm92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKGUpID0+IHRoaXMuX21vdmUoZSkpXHJcbiAgICAgICAgdGhpcy5vdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIChlKSA9PiB0aGlzLl9tb3ZlKGUpKVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKGUpID0+IHRoaXMuX3VwKGUpKVxyXG4gICAgICAgIHRoaXMub3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIChlKSA9PiB0aGlzLl91cChlKSlcclxuICAgIH1cclxuXHJcbiAgICBfb3Blbih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ID09PSAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5wdXNoKHdpbilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2ZvY3VzKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5hY3RpdmUgPT09IHdpbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmUuYmx1cigpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMud2luZG93cy5pbmRleE9mKHdpbilcclxuICAgICAgICBpZiAoaW5kZXggIT09IHRoaXMud2luZG93cy5sZW5ndGggLSAxKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnNwbGljZShpbmRleCwgMSlcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzLnB1c2god2luKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZW9yZGVyKClcclxuXHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB3aW5cclxuICAgIH1cclxuXHJcbiAgICBfYmx1cih3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlID09PSB3aW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IG51bGxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2Nsb3NlKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5tb2RhbCA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5tb2RhbCA9IG51bGxcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLndpbmRvd3MuaW5kZXhPZih3aW4pXHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSAtMSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93cy5zcGxpY2UoaW5kZXgsIDEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZSA9PT0gd2luKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5fYmx1cih3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF9tb3ZlKGUpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93c1trZXldLl9tb3ZlKGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIF91cChlKVxyXG4gICAge1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLndpbmRvd3MpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLndpbmRvd3Nba2V5XS5fdXAoZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgX2NoZWNrTW9kYWwod2luKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAhdGhpcy5tb2RhbCB8fCB0aGlzLm1vZGFsID09PSB3aW5cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXaW5kb3dNYW5hZ2VyIl19