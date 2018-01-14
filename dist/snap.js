'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var exists = require('exists');

var html = require('./html');

var DEFAULT_COLOR = '#a8f0f4';
var DEFAULT_SIZE = 10;

module.exports = function () {
    /**
     * add edge snapping plugin
     * @param {WindowManager} wm
     * @param {object} options
     * @param {boolean} [options.screen=true] snap to screen edges
     * @param {boolean} [options.windows=true] snap to window edges
     * @param {number} [options.snap=20] distance to edge before snapping and width/height of snap bars
     * @param {string} [options.color=#a8f0f4] color for snap bars
     * @param {number} [options.spacing=5] spacing distance between window and edges
     * @private
     */
    function Snap(wm, options) {
        _classCallCheck(this, Snap);

        options = !exists(options) || (typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' ? {} : options;
        this.wm = wm;
        this.snap = options.snap || 20;
        this.screen = exists(options.screen) ? options.screen : true;
        this.windows = exists(options.windows) ? options.windows : true;
        var backgroundColor = options.color || DEFAULT_COLOR;
        this.size = options.size || DEFAULT_SIZE;
        this.spacing = options.spacing || 5;
        this.highlights = html({ parent: this.wm.overlay, styles: { 'position': 'absolute' } });
        this.horizontal = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                height: this.size + 'px',
                borderRadius: this.size + 'px',
                backgroundColor: backgroundColor
            }
        });
        this.vertical = html({
            parent: this.highlights, styles: {
                display: 'none',
                position: 'absolute',
                width: this.size + 'px',
                borderRadius: this.size + 'px',
                backgroundColor: backgroundColor
            }
        });
        this.horizontal;
        this.showing = [];
    }

    _createClass(Snap, [{
        key: 'stop',
        value: function stop() {
            this.highlights.remove();
            this.stopped = true;
        }
    }, {
        key: 'addWindow',
        value: function addWindow(win) {
            var _this = this;

            win.on('move', function () {
                return _this.move(win);
            });
            win.on('move-end', function () {
                return _this.moveEnd(win);
            });
        }
    }, {
        key: 'screenMove',
        value: function screenMove(rect, horizontal, vertical) {
            var width = document.body.clientWidth;
            var height = document.body.clientHeight;
            if (rect.left - this.snap <= width && rect.right + this.snap >= 0) {
                if (Math.abs(rect.top - 0) <= this.snap) {
                    horizontal.push({ distance: Math.abs(rect.top - 0), left: 0, width: width, top: 0, side: 'top' });
                } else if (Math.abs(rect.bottom - height) <= this.snap) {
                    horizontal.push({ distance: Math.abs(rect.bottom - height), left: 0, width: width, top: height, side: 'bottom' });
                }
            }
            if (rect.top - this.snap <= height && rect.bottom + this.snap >= 0) {
                if (Math.abs(rect.left - 0) <= this.snap) {
                    vertical.push({ distance: Math.abs(rect.left - 0), top: 0, height: height, left: 0, side: 'left' });
                } else if (Math.abs(rect.right - width) <= this.snap) {
                    vertical.push({ distance: Math.abs(rect.right - width), top: 0, height: height, left: width, side: 'right' });
                }
            }
        }
    }, {
        key: 'windowsMove',
        value: function windowsMove(original, rect, horizontal, vertical) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.wm.windows[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var win = _step.value;

                    if (!win.options.noSnap && win !== original) {
                        var rect2 = win.win.getBoundingClientRect();
                        if (rect.left - this.snap <= rect2.right && rect.right + this.snap >= rect2.left) {
                            if (Math.abs(rect.top - rect2.bottom) <= this.snap) {
                                horizontal.push({ distance: Math.abs(rect.top - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'top' });
                                if (Math.abs(rect.left - rect2.left) <= this.snap) {
                                    vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true });
                                } else if (Math.abs(rect.right - rect2.right) <= this.snap) {
                                    vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true });
                                }
                            } else if (Math.abs(rect.bottom - rect2.top) <= this.snap) {
                                horizontal.push({ distance: Math.abs(rect.bottom - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'bottom' });
                                if (Math.abs(rect.left - rect2.left) <= this.snap) {
                                    vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true });
                                } else if (Math.abs(rect.right - rect2.right) <= this.snap) {
                                    vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true });
                                }
                            }
                        }
                        if (rect.top - this.snap <= rect2.bottom && rect.bottom + this.snap >= rect2.top) {
                            if (Math.abs(rect.left - rect2.right) <= this.snap) {
                                vertical.push({ distance: Math.abs(rect.left - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'left' });
                                if (Math.abs(rect.top - rect2.top) <= this.snap) {
                                    horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true });
                                } else if (Math.abs(rect.bottom - rect2.bottom) <= this.snap) {
                                    horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true });
                                }
                            } else if (Math.abs(rect.right - rect2.left) <= this.snap) {
                                vertical.push({ distance: Math.abs(rect.right - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'right' });
                                if (Math.abs(rect.top - rect2.top) <= this.snap) {
                                    horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true });
                                } else if (Math.abs(rect.bottom - rect2.bottom) <= this.snap) {
                                    horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true });
                                }
                            }
                        }
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
    }, {
        key: 'move',
        value: function move(win) {
            if (this.stopped || win.options.noSnap) {
                return;
            }
            this.horizontal.style.display = 'none';
            this.vertical.style.display = 'none';
            var horizontal = [];
            var vertical = [];
            var rect = win.win.getBoundingClientRect();
            if (this.screen) {
                this.screenMove(rect, horizontal, vertical);
            }
            if (this.windows) {
                this.windowsMove(win, rect, horizontal, vertical);
            }
            if (horizontal.length) {
                horizontal.sort(function (a, b) {
                    return a.distance - b.distance;
                });
                var find = horizontal[0];
                this.horizontal.style.display = 'block';
                this.horizontal.style.left = find.left + 'px';
                this.horizontal.style.width = find.width + 'px';
                this.horizontal.style.top = find.top - this.size / 2 + 'px';
                this.horizontal.y = find.top;
                this.horizontal.side = find.side;
                this.horizontal.noSpacing = find.noSpacing;
            }
            if (vertical.length) {
                vertical.sort(function (a, b) {
                    return a.distance - b.distance;
                });
                var _find = vertical[0];
                this.vertical.style.display = 'block';
                this.vertical.style.top = _find.top + 'px';
                this.vertical.style.height = _find.height + 'px';
                this.vertical.style.left = _find.left - this.size / 2 + 'px';
                this.vertical.x = _find.left;
                this.vertical.side = _find.side;
                this.vertical.noSpacing = _find.noSpacing;
            }
        }
    }, {
        key: 'moveEnd',
        value: function moveEnd(win) {
            if (this.stopped) {
                return;
            }
            if (this.horizontal.style.display === 'block') {
                var spacing = this.horizontal.noSpacing ? 0 : this.spacing;
                var adjust = win.minimized ? (win.height - win.height * win.minimized.scaleY) / 2 : 0;
                switch (this.horizontal.side) {
                    case 'top':
                        win.y = this.horizontal.y - adjust + spacing;
                        break;

                    case 'bottom':
                        win.bottom = this.horizontal.y + adjust - spacing;
                        break;
                }
            }
            if (this.vertical.style.display === 'block') {
                var _spacing = this.vertical.noSpacing ? 0 : this.spacing;
                var _adjust = win.minimized ? (win.width - win.width * win.minimized.scaleX) / 2 : 0;
                switch (this.vertical.side) {
                    case 'left':
                        win.x = this.vertical.x - _adjust + _spacing;
                        break;

                    case 'right':
                        win.right = this.vertical.x + _adjust - _spacing;
                        break;
                }
            }
            this.horizontal.style.display = this.vertical.style.display = 'none';
        }
    }]);

    return Snap;
}();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zbmFwLmpzIl0sIm5hbWVzIjpbImV4aXN0cyIsInJlcXVpcmUiLCJodG1sIiwiREVGQVVMVF9DT0xPUiIsIkRFRkFVTFRfU0laRSIsIm1vZHVsZSIsImV4cG9ydHMiLCJ3bSIsIm9wdGlvbnMiLCJzbmFwIiwic2NyZWVuIiwid2luZG93cyIsImJhY2tncm91bmRDb2xvciIsImNvbG9yIiwic2l6ZSIsInNwYWNpbmciLCJoaWdobGlnaHRzIiwicGFyZW50Iiwib3ZlcmxheSIsInN0eWxlcyIsImhvcml6b250YWwiLCJkaXNwbGF5IiwicG9zaXRpb24iLCJoZWlnaHQiLCJib3JkZXJSYWRpdXMiLCJ2ZXJ0aWNhbCIsIndpZHRoIiwic2hvd2luZyIsInJlbW92ZSIsInN0b3BwZWQiLCJ3aW4iLCJvbiIsIm1vdmUiLCJtb3ZlRW5kIiwicmVjdCIsImRvY3VtZW50IiwiYm9keSIsImNsaWVudFdpZHRoIiwiY2xpZW50SGVpZ2h0IiwibGVmdCIsInJpZ2h0IiwiTWF0aCIsImFicyIsInRvcCIsInB1c2giLCJkaXN0YW5jZSIsInNpZGUiLCJib3R0b20iLCJvcmlnaW5hbCIsIm5vU25hcCIsInJlY3QyIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwibm9TcGFjaW5nIiwic3R5bGUiLCJzY3JlZW5Nb3ZlIiwid2luZG93c01vdmUiLCJsZW5ndGgiLCJzb3J0IiwiYSIsImIiLCJmaW5kIiwieSIsIngiLCJhZGp1c3QiLCJtaW5pbWl6ZWQiLCJzY2FsZVkiLCJzY2FsZVgiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEsSUFBTUEsU0FBU0MsUUFBUSxRQUFSLENBQWY7O0FBRUEsSUFBTUMsT0FBT0QsUUFBUSxRQUFSLENBQWI7O0FBRUEsSUFBTUUsZ0JBQWdCLFNBQXRCO0FBQ0EsSUFBTUMsZUFBZSxFQUFyQjs7QUFFQUMsT0FBT0MsT0FBUDtBQUVJOzs7Ozs7Ozs7OztBQVdBLGtCQUFZQyxFQUFaLEVBQWdCQyxPQUFoQixFQUNBO0FBQUE7O0FBQ0lBLGtC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QUFDQTs7QUFFSix5QkFBSyxRQUFMO0FBQ0llLDRCQUFJaUIsTUFBSixHQUFhLEtBQUszQixVQUFMLENBQWdCeUMsQ0FBaEIsR0FBb0JFLE1BQXBCLEdBQTZCaEQsT0FBMUM7QUFDQTtBQVJSO0FBVUg7QUFDRCxnQkFBSSxLQUFLVSxRQUFMLENBQWM0QixLQUFkLENBQW9CaEMsT0FBcEIsS0FBZ0MsT0FBcEMsRUFDQTtBQUNJLG9CQUFNTixXQUFVLEtBQUtVLFFBQUwsQ0FBYzJCLFNBQWQsR0FBMEIsQ0FBMUIsR0FBOEIsS0FBS3JDLE9BQW5EO0FBQ0Esb0JBQU1nRCxVQUFTakMsSUFBSWtDLFNBQUosR0FBZ0IsQ0FBQ2xDLElBQUlKLEtBQUosR0FBWUksSUFBSUosS0FBSixHQUFZSSxJQUFJa0MsU0FBSixDQUFjRSxNQUF2QyxJQUFpRCxDQUFqRSxHQUFxRSxDQUFwRjtBQUNBLHdCQUFRLEtBQUt6QyxRQUFMLENBQWNxQixJQUF0QjtBQUVJLHlCQUFLLE1BQUw7QUFDSWhCLDRCQUFJZ0MsQ0FBSixHQUFRLEtBQUtyQyxRQUFMLENBQWNxQyxDQUFkLEdBQWtCQyxPQUFsQixHQUEyQmhELFFBQW5DO0FBQ0E7O0FBRUoseUJBQUssT0FBTDtBQUNJZSw0QkFBSVUsS0FBSixHQUFZLEtBQUtmLFFBQUwsQ0FBY3FDLENBQWQsR0FBa0JDLE9BQWxCLEdBQTJCaEQsUUFBdkM7QUFDQTtBQVJSO0FBVUg7QUFDRCxpQkFBS0ssVUFBTCxDQUFnQmlDLEtBQWhCLENBQXNCaEMsT0FBdEIsR0FBZ0MsS0FBS0ksUUFBTCxDQUFjNEIsS0FBZCxDQUFvQmhDLE9BQXBCLEdBQThCLE1BQTlEO0FBQ0g7QUF6T0w7O0FBQUE7QUFBQSIsImZpbGUiOiJzbmFwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZXhpc3RzID0gcmVxdWlyZSgnZXhpc3RzJylcclxuXHJcbmNvbnN0IGh0bWwgPSByZXF1aXJlKCcuL2h0bWwnKVxyXG5cclxuY29uc3QgREVGQVVMVF9DT0xPUiA9ICcjYThmMGY0J1xyXG5jb25zdCBERUZBVUxUX1NJWkUgPSAxMFxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBTbmFwXHJcbntcclxuICAgIC8qKlxyXG4gICAgICogYWRkIGVkZ2Ugc25hcHBpbmcgcGx1Z2luXHJcbiAgICAgKiBAcGFyYW0ge1dpbmRvd01hbmFnZXJ9IHdtXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9uc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5zY3JlZW49dHJ1ZV0gc25hcCB0byBzY3JlZW4gZWRnZXNcclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMud2luZG93cz10cnVlXSBzbmFwIHRvIHdpbmRvdyBlZGdlc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNuYXA9MjBdIGRpc3RhbmNlIHRvIGVkZ2UgYmVmb3JlIHNuYXBwaW5nIGFuZCB3aWR0aC9oZWlnaHQgb2Ygc25hcCBiYXJzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuY29sb3I9I2E4ZjBmNF0gY29sb3IgZm9yIHNuYXAgYmFyc1xyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLnNwYWNpbmc9NV0gc3BhY2luZyBkaXN0YW5jZSBiZXR3ZWVuIHdpbmRvdyBhbmQgZWRnZXNcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHdtLCBvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIG9wdGlvbnMgPSAhZXhpc3RzKG9wdGlvbnMpIHx8IHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JyA/IHt9IDogb3B0aW9uc1xyXG4gICAgICAgIHRoaXMud20gPSB3bVxyXG4gICAgICAgIHRoaXMuc25hcCA9IG9wdGlvbnMuc25hcCB8fCAyMFxyXG4gICAgICAgIHRoaXMuc2NyZWVuID0gZXhpc3RzKG9wdGlvbnMuc2NyZWVuKSA/IG9wdGlvbnMuc2NyZWVuIDogdHJ1ZVxyXG4gICAgICAgIHRoaXMud2luZG93cyA9IGV4aXN0cyhvcHRpb25zLndpbmRvd3MpID8gb3B0aW9ucy53aW5kb3dzIDogdHJ1ZVxyXG4gICAgICAgIGNvbnN0IGJhY2tncm91bmRDb2xvciA9IG9wdGlvbnMuY29sb3IgfHwgREVGQVVMVF9DT0xPUlxyXG4gICAgICAgIHRoaXMuc2l6ZSA9IG9wdGlvbnMuc2l6ZSB8fCBERUZBVUxUX1NJWkVcclxuICAgICAgICB0aGlzLnNwYWNpbmcgPSBvcHRpb25zLnNwYWNpbmcgfHwgNVxyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0cyA9IGh0bWwoeyBwYXJlbnQ6IHRoaXMud20ub3ZlcmxheSwgc3R5bGVzOiB7ICdwb3NpdGlvbic6ICdhYnNvbHV0ZScgfSB9KVxyXG4gICAgICAgIHRoaXMuaG9yaXpvbnRhbCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMuaGlnaGxpZ2h0cywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5zaXplICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogdGhpcy5zaXplICsgJ3B4JyxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvclxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLnZlcnRpY2FsID0gaHRtbCh7XHJcbiAgICAgICAgICAgIHBhcmVudDogdGhpcy5oaWdobGlnaHRzLCBzdHlsZXM6IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMuc2l6ZSArICdweCcsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IHRoaXMuc2l6ZSArICdweCcsXHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3JcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5ob3Jpem9udGFsXHJcbiAgICAgICAgdGhpcy5zaG93aW5nID0gW11cclxuICAgIH1cclxuXHJcbiAgICBzdG9wKClcclxuICAgIHtcclxuICAgICAgICB0aGlzLmhpZ2hsaWdodHMucmVtb3ZlKClcclxuICAgICAgICB0aGlzLnN0b3BwZWQgPSB0cnVlXHJcbiAgICB9XHJcblxyXG4gICAgYWRkV2luZG93KHdpbilcclxuICAgIHtcclxuICAgICAgICB3aW4ub24oJ21vdmUnLCAoKSA9PiB0aGlzLm1vdmUod2luKSlcclxuICAgICAgICB3aW4ub24oJ21vdmUtZW5kJywgKCkgPT4gdGhpcy5tb3ZlRW5kKHdpbikpXHJcbiAgICB9XHJcblxyXG4gICAgc2NyZWVuTW92ZShyZWN0LCBob3Jpem9udGFsLCB2ZXJ0aWNhbClcclxuICAgIHtcclxuICAgICAgICBjb25zdCB3aWR0aCA9IGRvY3VtZW50LmJvZHkuY2xpZW50V2lkdGhcclxuICAgICAgICBjb25zdCBoZWlnaHQgPSBkb2N1bWVudC5ib2R5LmNsaWVudEhlaWdodFxyXG4gICAgICAgIGlmIChyZWN0LmxlZnQgLSB0aGlzLnNuYXAgPD0gd2lkdGggJiYgcmVjdC5yaWdodCArIHRoaXMuc25hcCA+PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHJlY3QudG9wIC0gMCkgPD0gdGhpcy5zbmFwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBob3Jpem9udGFsLnB1c2goeyBkaXN0YW5jZTogTWF0aC5hYnMocmVjdC50b3AgLSAwKSwgbGVmdDogMCwgd2lkdGgsIHRvcDogMCwgc2lkZTogJ3RvcCcgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChNYXRoLmFicyhyZWN0LmJvdHRvbSAtIGhlaWdodCkgPD0gdGhpcy5zbmFwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBob3Jpem9udGFsLnB1c2goeyBkaXN0YW5jZTogTWF0aC5hYnMocmVjdC5ib3R0b20gLSBoZWlnaHQpLCBsZWZ0OiAwLCB3aWR0aCwgdG9wOiBoZWlnaHQsIHNpZGU6ICdib3R0b20nIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHJlY3QudG9wIC0gdGhpcy5zbmFwIDw9IGhlaWdodCAmJiByZWN0LmJvdHRvbSArIHRoaXMuc25hcCA+PSAwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKE1hdGguYWJzKHJlY3QubGVmdCAtIDApIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmVydGljYWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LmxlZnQgLSAwKSwgdG9wOiAwLCBoZWlnaHQsIGxlZnQ6IDAsIHNpZGU6ICdsZWZ0JyB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKE1hdGguYWJzKHJlY3QucmlnaHQgLSB3aWR0aCkgPD0gdGhpcy5zbmFwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2ZXJ0aWNhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QucmlnaHQgLSB3aWR0aCksIHRvcDogMCwgaGVpZ2h0LCBsZWZ0OiB3aWR0aCwgc2lkZTogJ3JpZ2h0JyB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHdpbmRvd3NNb3ZlKG9yaWdpbmFsLCByZWN0LCBob3Jpem9udGFsLCB2ZXJ0aWNhbClcclxuICAgIHtcclxuICAgICAgICBmb3IgKGxldCB3aW4gb2YgdGhpcy53bS53aW5kb3dzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCF3aW4ub3B0aW9ucy5ub1NuYXAgJiYgd2luICE9PSBvcmlnaW5hbClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVjdDIgPSB3aW4ud2luLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXHJcbiAgICAgICAgICAgICAgICBpZiAocmVjdC5sZWZ0IC0gdGhpcy5zbmFwIDw9IHJlY3QyLnJpZ2h0ICYmIHJlY3QucmlnaHQgKyB0aGlzLnNuYXAgPj0gcmVjdDIubGVmdClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMocmVjdC50b3AgLSByZWN0Mi5ib3R0b20pIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvcml6b250YWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LnRvcCAtIHJlY3QyLmJvdHRvbSksIGxlZnQ6IHJlY3QyLmxlZnQsIHdpZHRoOiByZWN0Mi53aWR0aCwgdG9wOiByZWN0Mi5ib3R0b20sIHNpZGU6ICd0b3AnIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhyZWN0LmxlZnQgLSByZWN0Mi5sZWZ0KSA8PSB0aGlzLnNuYXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsLnB1c2goeyBkaXN0YW5jZTogTWF0aC5hYnMocmVjdC5sZWZ0IC0gcmVjdDIubGVmdCksIHRvcDogcmVjdDIudG9wLCBoZWlnaHQ6IHJlY3QyLmhlaWdodCwgbGVmdDogcmVjdDIubGVmdCwgc2lkZTogJ2xlZnQnLCBub1NwYWNpbmc6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChNYXRoLmFicyhyZWN0LnJpZ2h0IC0gcmVjdDIucmlnaHQpIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVydGljYWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LnJpZ2h0IC0gcmVjdDIucmlnaHQpLCB0b3A6IHJlY3QyLnRvcCwgaGVpZ2h0OiByZWN0Mi5oZWlnaHQsIGxlZnQ6IHJlY3QyLnJpZ2h0LCBzaWRlOiAncmlnaHQnLCBub1NwYWNpbmc6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChNYXRoLmFicyhyZWN0LmJvdHRvbSAtIHJlY3QyLnRvcCkgPD0gdGhpcy5zbmFwKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaG9yaXpvbnRhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QuYm90dG9tIC0gcmVjdDIudG9wKSwgbGVmdDogcmVjdDIubGVmdCwgd2lkdGg6IHJlY3QyLndpZHRoLCB0b3A6IHJlY3QyLnRvcCwgc2lkZTogJ2JvdHRvbScgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKHJlY3QubGVmdCAtIHJlY3QyLmxlZnQpIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVydGljYWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LmxlZnQgLSByZWN0Mi5sZWZ0KSwgdG9wOiByZWN0Mi50b3AsIGhlaWdodDogcmVjdDIuaGVpZ2h0LCBsZWZ0OiByZWN0Mi5sZWZ0LCBzaWRlOiAnbGVmdCcsIG5vU3BhY2luZzogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKE1hdGguYWJzKHJlY3QucmlnaHQgLSByZWN0Mi5yaWdodCkgPD0gdGhpcy5zbmFwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QucmlnaHQgLSByZWN0Mi5yaWdodCksIHRvcDogcmVjdDIudG9wLCBoZWlnaHQ6IHJlY3QyLmhlaWdodCwgbGVmdDogcmVjdDIucmlnaHQsIHNpZGU6ICdyaWdodCcsIG5vU3BhY2luZzogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHJlY3QudG9wIC0gdGhpcy5zbmFwIDw9IHJlY3QyLmJvdHRvbSAmJiByZWN0LmJvdHRvbSArIHRoaXMuc25hcCA+PSByZWN0Mi50b3ApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKHJlY3QubGVmdCAtIHJlY3QyLnJpZ2h0KSA8PSB0aGlzLnNuYXApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QubGVmdCAtIHJlY3QyLnJpZ2h0KSwgdG9wOiByZWN0Mi50b3AsIGhlaWdodDogcmVjdDIuaGVpZ2h0LCBsZWZ0OiByZWN0Mi5yaWdodCwgc2lkZTogJ2xlZnQnIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhyZWN0LnRvcCAtIHJlY3QyLnRvcCkgPD0gdGhpcy5zbmFwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3Jpem9udGFsLnB1c2goeyBkaXN0YW5jZTogTWF0aC5hYnMocmVjdC50b3AgLSByZWN0Mi50b3ApLCBsZWZ0OiByZWN0Mi5sZWZ0LCB3aWR0aDogcmVjdDIud2lkdGgsIHRvcDogcmVjdDIudG9wLCBzaWRlOiAndG9wJywgbm9TcGFjaW5nOiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoTWF0aC5hYnMocmVjdC5ib3R0b20gLSByZWN0Mi5ib3R0b20pIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9yaXpvbnRhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QuYm90dG9tIC0gcmVjdDIuYm90dG9tKSwgbGVmdDogcmVjdDIubGVmdCwgd2lkdGg6IHJlY3QyLndpZHRoLCB0b3A6IHJlY3QyLmJvdHRvbSwgc2lkZTogJ2JvdHRvbScsIG5vU3BhY2luZzogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKE1hdGguYWJzKHJlY3QucmlnaHQgLSByZWN0Mi5sZWZ0KSA8PSB0aGlzLnNuYXApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QucmlnaHQgLSByZWN0Mi5sZWZ0KSwgdG9wOiByZWN0Mi50b3AsIGhlaWdodDogcmVjdDIuaGVpZ2h0LCBsZWZ0OiByZWN0Mi5sZWZ0LCBzaWRlOiAncmlnaHQnIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhyZWN0LnRvcCAtIHJlY3QyLnRvcCkgPD0gdGhpcy5zbmFwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3Jpem9udGFsLnB1c2goeyBkaXN0YW5jZTogTWF0aC5hYnMocmVjdC50b3AgLSByZWN0Mi50b3ApLCBsZWZ0OiByZWN0Mi5sZWZ0LCB3aWR0aDogcmVjdDIud2lkdGgsIHRvcDogcmVjdDIudG9wLCBzaWRlOiAndG9wJywgbm9TcGFjaW5nOiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoTWF0aC5hYnMocmVjdC5ib3R0b20gLSByZWN0Mi5ib3R0b20pIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9yaXpvbnRhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QuYm90dG9tIC0gcmVjdDIuYm90dG9tKSwgbGVmdDogcmVjdDIubGVmdCwgd2lkdGg6IHJlY3QyLndpZHRoLCB0b3A6IHJlY3QyLmJvdHRvbSwgc2lkZTogJ2JvdHRvbScsIG5vU3BhY2luZzogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1vdmUod2luKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLnN0b3BwZWQgfHwgd2luLm9wdGlvbnMubm9TbmFwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaG9yaXpvbnRhbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgdGhpcy52ZXJ0aWNhbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICAgICAgY29uc3QgaG9yaXpvbnRhbCA9IFtdXHJcbiAgICAgICAgY29uc3QgdmVydGljYWwgPSBbXVxyXG4gICAgICAgIGNvbnN0IHJlY3QgPSB3aW4ud2luLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXHJcbiAgICAgICAgaWYgKHRoaXMuc2NyZWVuKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zY3JlZW5Nb3ZlKHJlY3QsIGhvcml6b250YWwsIHZlcnRpY2FsKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy53aW5kb3dzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy53aW5kb3dzTW92ZSh3aW4sIHJlY3QsIGhvcml6b250YWwsIHZlcnRpY2FsKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoaG9yaXpvbnRhbC5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBob3Jpem9udGFsLnNvcnQoKGEsIGIpID0+IHsgcmV0dXJuIGEuZGlzdGFuY2UgLSBiLmRpc3RhbmNlIH0pXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbmQgPSBob3Jpem9udGFsWzBdXHJcbiAgICAgICAgICAgIHRoaXMuaG9yaXpvbnRhbC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICB0aGlzLmhvcml6b250YWwuc3R5bGUubGVmdCA9IGZpbmQubGVmdCArICdweCdcclxuICAgICAgICAgICAgdGhpcy5ob3Jpem9udGFsLnN0eWxlLndpZHRoID0gZmluZC53aWR0aCArICdweCdcclxuICAgICAgICAgICAgdGhpcy5ob3Jpem9udGFsLnN0eWxlLnRvcCA9IGZpbmQudG9wIC0gdGhpcy5zaXplIC8gMiArICdweCdcclxuICAgICAgICAgICAgdGhpcy5ob3Jpem9udGFsLnkgPSBmaW5kLnRvcFxyXG4gICAgICAgICAgICB0aGlzLmhvcml6b250YWwuc2lkZSA9IGZpbmQuc2lkZVxyXG4gICAgICAgICAgICB0aGlzLmhvcml6b250YWwubm9TcGFjaW5nID0gZmluZC5ub1NwYWNpbmdcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZlcnRpY2FsLmxlbmd0aClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZlcnRpY2FsLnNvcnQoKGEsIGIpID0+IHsgcmV0dXJuIGEuZGlzdGFuY2UgLSBiLmRpc3RhbmNlIH0pXHJcbiAgICAgICAgICAgIGNvbnN0IGZpbmQgPSB2ZXJ0aWNhbFswXVxyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2FsLnN0eWxlLmRpc3BsYXkgID0gJ2Jsb2NrJ1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2FsLnN0eWxlLnRvcCA9IGZpbmQudG9wICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2FsLnN0eWxlLmhlaWdodCA9IGZpbmQuaGVpZ2h0ICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2FsLnN0eWxlLmxlZnQgPSBmaW5kLmxlZnQgLSB0aGlzLnNpemUgLyAyICsgJ3B4J1xyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2FsLnggPSBmaW5kLmxlZnRcclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNhbC5zaWRlID0gZmluZC5zaWRlXHJcbiAgICAgICAgICAgIHRoaXMudmVydGljYWwubm9TcGFjaW5nID0gZmluZC5ub1NwYWNpbmdcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZUVuZCh3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RvcHBlZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5ob3Jpem9udGFsLnN0eWxlLmRpc3BsYXkgPT09ICdibG9jaycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBzcGFjaW5nID0gdGhpcy5ob3Jpem9udGFsLm5vU3BhY2luZyA/IDAgOiB0aGlzLnNwYWNpbmdcclxuICAgICAgICAgICAgY29uc3QgYWRqdXN0ID0gd2luLm1pbmltaXplZCA/ICh3aW4uaGVpZ2h0IC0gd2luLmhlaWdodCAqIHdpbi5taW5pbWl6ZWQuc2NhbGVZKSAvIDIgOiAwXHJcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5ob3Jpem9udGFsLnNpZGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RvcCc6XHJcbiAgICAgICAgICAgICAgICAgICAgd2luLnkgPSB0aGlzLmhvcml6b250YWwueSAtIGFkanVzdCArIHNwYWNpbmdcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2JvdHRvbSc6XHJcbiAgICAgICAgICAgICAgICAgICAgd2luLmJvdHRvbSA9IHRoaXMuaG9yaXpvbnRhbC55ICsgYWRqdXN0IC0gc3BhY2luZ1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMudmVydGljYWwuc3R5bGUuZGlzcGxheSA9PT0gJ2Jsb2NrJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnN0IHNwYWNpbmcgPSB0aGlzLnZlcnRpY2FsLm5vU3BhY2luZyA/IDAgOiB0aGlzLnNwYWNpbmdcclxuICAgICAgICAgICAgY29uc3QgYWRqdXN0ID0gd2luLm1pbmltaXplZCA/ICh3aW4ud2lkdGggLSB3aW4ud2lkdGggKiB3aW4ubWluaW1pemVkLnNjYWxlWCkgLyAyIDogMFxyXG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMudmVydGljYWwuc2lkZSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbGVmdCc6XHJcbiAgICAgICAgICAgICAgICAgICAgd2luLnggPSB0aGlzLnZlcnRpY2FsLnggLSBhZGp1c3QgKyBzcGFjaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdyaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgd2luLnJpZ2h0ID0gdGhpcy52ZXJ0aWNhbC54ICsgYWRqdXN0IC0gc3BhY2luZ1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5ob3Jpem9udGFsLnN0eWxlLmRpc3BsYXkgPSB0aGlzLnZlcnRpY2FsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcclxuICAgIH1cclxufSJdfQ==