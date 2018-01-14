'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var exists = require('exists');

var html = require('./html');

var DEFAULT_COLOR = '#a8f0f4';
var DEFAULT_SIZE = 10;

module.exports = function () {
    /**
     * add edge snapping plugin
     * @param {object} options
     * @param {boolean} [options.screen=true] snap to screen edges
     * @param {boolean} [options.windows=true] snap to window edges
     * @param {number} [options.snap=20] distance to edge before snapping and width/height of snap bars
     * @param {string} [options.color=#a8f0f4] color for snap bars
     * @param {number} [options.spacing=0] spacing distance between window and edges
     * @private
     */
    function Snap(wm, options) {
        _classCallCheck(this, Snap);

        options = options || {};
        this.wm = wm;
        this.snap = options.snap || 20;
        this.screen = exists(options.screen) ? options.screen : true;
        this.windows = exists(options.windows) ? options.windows : true;
        var backgroundColor = options.color || DEFAULT_COLOR;
        this.size = options.size || DEFAULT_SIZE;
        this.spacing = options.spacing || 0;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zbmFwLmpzIl0sIm5hbWVzIjpbImV4aXN0cyIsInJlcXVpcmUiLCJodG1sIiwiREVGQVVMVF9DT0xPUiIsIkRFRkFVTFRfU0laRSIsIm1vZHVsZSIsImV4cG9ydHMiLCJ3bSIsIm9wdGlvbnMiLCJzbmFwIiwic2NyZWVuIiwid2luZG93cyIsImJhY2tncm91bmRDb2xvciIsImNvbG9yIiwic2l6ZSIsInNwYWNpbmciLCJoaWdobGlnaHRzIiwicGFyZW50Iiwib3ZlcmxheSIsInN0eWxlcyIsImhvcml6b250YWwiLCJkaXNwbGF5IiwicG9zaXRpb24iLCJoZWlnaHQiLCJib3JkZXJSYWRpdXMiLCJ2ZXJ0aWNhbCIsIndpZHRoIiwic2hvd2luZyIsInJlbW92ZSIsInN0b3BwZWQiLCJ3aW4iLCJvbiIsIm1vdmUiLCJtb3ZlRW5kIiwicmVjdCIsImRvY3VtZW50IiwiYm9keSIsImNsaWVudFdpZHRoIiwiY2xpZW50SGVpZ2h0IiwibGVmdCIsInJpZ2h0IiwiTWF0aCIsImFicyIsInRvcCIsInB1c2giLCJkaXN0YW5jZSIsInNpZGUiLCJib3R0b20iLCJvcmlnaW5hbCIsIm5vU25hcCIsInJlY3QyIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwibm9TcGFjaW5nIiwic3R5bGUiLCJzY3JlZW5Nb3ZlIiwid2luZG93c01vdmUiLCJsZW5ndGgiLCJzb3J0IiwiYSIsImIiLCJmaW5kIiwieSIsIngiLCJhZGp1c3QiLCJtaW5pbWl6ZWQiLCJzY2FsZVkiLCJzY2FsZVgiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQU1BLFNBQVNDLFFBQVEsUUFBUixDQUFmOztBQUVBLElBQU1DLE9BQU9ELFFBQVEsUUFBUixDQUFiOztBQUVBLElBQU1FLGdCQUFnQixTQUF0QjtBQUNBLElBQU1DLGVBQWUsRUFBckI7O0FBRUFDLE9BQU9DLE9BQVA7QUFFSTs7Ozs7Ozs7OztBQVVBLGtCQUFZQyxFQUFaLEVBQWdCQyxPQUFoQixFQUNBO0FBQUE7O0FBQ0lBLGtCQUFV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TUFBcEIsR0FBNkJoRCxPQUExQztBQUNBO0FBUlI7QUFVSDtBQUNELGdCQUFJLEtBQUtVLFFBQUwsQ0FBYzRCLEtBQWQsQ0FBb0JoQyxPQUFwQixLQUFnQyxPQUFwQyxFQUNBO0FBQ0ksb0JBQU1OLFdBQVUsS0FBS1UsUUFBTCxDQUFjMkIsU0FBZCxHQUEwQixDQUExQixHQUE4QixLQUFLckMsT0FBbkQ7QUFDQSxvQkFBTWdELFVBQVNqQyxJQUFJa0MsU0FBSixHQUFnQixDQUFDbEMsSUFBSUosS0FBSixHQUFZSSxJQUFJSixLQUFKLEdBQVlJLElBQUlrQyxTQUFKLENBQWNFLE1BQXZDLElBQWlELENBQWpFLEdBQXFFLENBQXBGO0FBQ0Esd0JBQVEsS0FBS3pDLFFBQUwsQ0FBY3FCLElBQXRCO0FBRUkseUJBQUssTUFBTDtBQUNJaEIsNEJBQUlnQyxDQUFKLEdBQVEsS0FBS3JDLFFBQUwsQ0FBY3FDLENBQWQsR0FBa0JDLE9BQWxCLEdBQTJCaEQsUUFBbkM7QUFDQTs7QUFFSix5QkFBSyxPQUFMO0FBQ0llLDRCQUFJVSxLQUFKLEdBQVksS0FBS2YsUUFBTCxDQUFjcUMsQ0FBZCxHQUFrQkMsT0FBbEIsR0FBMkJoRCxRQUF2QztBQUNBO0FBUlI7QUFVSDtBQUNELGlCQUFLSyxVQUFMLENBQWdCaUMsS0FBaEIsQ0FBc0JoQyxPQUF0QixHQUFnQyxLQUFLSSxRQUFMLENBQWM0QixLQUFkLENBQW9CaEMsT0FBcEIsR0FBOEIsTUFBOUQ7QUFDSDtBQXhPTDs7QUFBQTtBQUFBIiwiZmlsZSI6InNuYXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBleGlzdHMgPSByZXF1aXJlKCdleGlzdHMnKVxyXG5cclxuY29uc3QgaHRtbCA9IHJlcXVpcmUoJy4vaHRtbCcpXHJcblxyXG5jb25zdCBERUZBVUxUX0NPTE9SID0gJyNhOGYwZjQnXHJcbmNvbnN0IERFRkFVTFRfU0laRSA9IDEwXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFNuYXBcclxue1xyXG4gICAgLyoqXHJcbiAgICAgKiBhZGQgZWRnZSBzbmFwcGluZyBwbHVnaW5cclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnNjcmVlbj10cnVlXSBzbmFwIHRvIHNjcmVlbiBlZGdlc1xyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy53aW5kb3dzPXRydWVdIHNuYXAgdG8gd2luZG93IGVkZ2VzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc25hcD0yMF0gZGlzdGFuY2UgdG8gZWRnZSBiZWZvcmUgc25hcHBpbmcgYW5kIHdpZHRoL2hlaWdodCBvZiBzbmFwIGJhcnNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5jb2xvcj0jYThmMGY0XSBjb2xvciBmb3Igc25hcCBiYXJzXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuc3BhY2luZz0wXSBzcGFjaW5nIGRpc3RhbmNlIGJldHdlZW4gd2luZG93IGFuZCBlZGdlc1xyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iod20sIG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cclxuICAgICAgICB0aGlzLndtID0gd21cclxuICAgICAgICB0aGlzLnNuYXAgPSBvcHRpb25zLnNuYXAgfHwgMjBcclxuICAgICAgICB0aGlzLnNjcmVlbiA9IGV4aXN0cyhvcHRpb25zLnNjcmVlbikgPyBvcHRpb25zLnNjcmVlbiA6IHRydWVcclxuICAgICAgICB0aGlzLndpbmRvd3MgPSBleGlzdHMob3B0aW9ucy53aW5kb3dzKSA/IG9wdGlvbnMud2luZG93cyA6IHRydWVcclxuICAgICAgICBjb25zdCBiYWNrZ3JvdW5kQ29sb3IgPSBvcHRpb25zLmNvbG9yIHx8IERFRkFVTFRfQ09MT1JcclxuICAgICAgICB0aGlzLnNpemUgPSBvcHRpb25zLnNpemUgfHwgREVGQVVMVF9TSVpFXHJcbiAgICAgICAgdGhpcy5zcGFjaW5nID0gb3B0aW9ucy5zcGFjaW5nIHx8IDBcclxuICAgICAgICB0aGlzLmhpZ2hsaWdodHMgPSBodG1sKHsgcGFyZW50OiB0aGlzLndtLm92ZXJsYXksIHN0eWxlczogeyAncG9zaXRpb24nOiAnYWJzb2x1dGUnIH0gfSlcclxuICAgICAgICB0aGlzLmhvcml6b250YWwgPSBodG1sKHtcclxuICAgICAgICAgICAgcGFyZW50OiB0aGlzLmhpZ2hsaWdodHMsIHN0eWxlczoge1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuc2l6ZSArICdweCcsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJSYWRpdXM6IHRoaXMuc2l6ZSArICdweCcsXHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3JcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy52ZXJ0aWNhbCA9IGh0bWwoe1xyXG4gICAgICAgICAgICBwYXJlbnQ6IHRoaXMuaGlnaGxpZ2h0cywgc3R5bGVzOiB7XHJcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnbm9uZScsXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLnNpemUgKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLnNpemUgKyAncHgnLFxyXG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuaG9yaXpvbnRhbFxyXG4gICAgICAgIHRoaXMuc2hvd2luZyA9IFtdXHJcbiAgICB9XHJcblxyXG4gICAgc3RvcCgpXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5oaWdobGlnaHRzLnJlbW92ZSgpXHJcbiAgICAgICAgdGhpcy5zdG9wcGVkID0gdHJ1ZVxyXG4gICAgfVxyXG5cclxuICAgIGFkZFdpbmRvdyh3aW4pXHJcbiAgICB7XHJcbiAgICAgICAgd2luLm9uKCdtb3ZlJywgKCkgPT4gdGhpcy5tb3ZlKHdpbikpXHJcbiAgICAgICAgd2luLm9uKCdtb3ZlLWVuZCcsICgpID0+IHRoaXMubW92ZUVuZCh3aW4pKVxyXG4gICAgfVxyXG5cclxuICAgIHNjcmVlbk1vdmUocmVjdCwgaG9yaXpvbnRhbCwgdmVydGljYWwpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc3Qgd2lkdGggPSBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoXHJcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5jbGllbnRIZWlnaHRcclxuICAgICAgICBpZiAocmVjdC5sZWZ0IC0gdGhpcy5zbmFwIDw9IHdpZHRoICYmIHJlY3QucmlnaHQgKyB0aGlzLnNuYXAgPj0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhyZWN0LnRvcCAtIDApIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaG9yaXpvbnRhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QudG9wIC0gMCksIGxlZnQ6IDAsIHdpZHRoLCB0b3A6IDAsIHNpZGU6ICd0b3AnIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoTWF0aC5hYnMocmVjdC5ib3R0b20gLSBoZWlnaHQpIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaG9yaXpvbnRhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QuYm90dG9tIC0gaGVpZ2h0KSwgbGVmdDogMCwgd2lkdGgsIHRvcDogaGVpZ2h0LCBzaWRlOiAnYm90dG9tJyB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyZWN0LnRvcCAtIHRoaXMuc25hcCA8PSBoZWlnaHQgJiYgcmVjdC5ib3R0b20gKyB0aGlzLnNuYXAgPj0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChNYXRoLmFicyhyZWN0LmxlZnQgLSAwKSA8PSB0aGlzLnNuYXApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZlcnRpY2FsLnB1c2goeyBkaXN0YW5jZTogTWF0aC5hYnMocmVjdC5sZWZ0IC0gMCksIHRvcDogMCwgaGVpZ2h0LCBsZWZ0OiAwLCBzaWRlOiAnbGVmdCcgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChNYXRoLmFicyhyZWN0LnJpZ2h0IC0gd2lkdGgpIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmVydGljYWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LnJpZ2h0IC0gd2lkdGgpLCB0b3A6IDAsIGhlaWdodCwgbGVmdDogd2lkdGgsIHNpZGU6ICdyaWdodCcgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB3aW5kb3dzTW92ZShvcmlnaW5hbCwgcmVjdCwgaG9yaXpvbnRhbCwgdmVydGljYWwpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yIChsZXQgd2luIG9mIHRoaXMud20ud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghd2luLm9wdGlvbnMubm9TbmFwICYmIHdpbiAhPT0gb3JpZ2luYWwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlY3QyID0gd2luLndpbi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxyXG4gICAgICAgICAgICAgICAgaWYgKHJlY3QubGVmdCAtIHRoaXMuc25hcCA8PSByZWN0Mi5yaWdodCAmJiByZWN0LnJpZ2h0ICsgdGhpcy5zbmFwID49IHJlY3QyLmxlZnQpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKHJlY3QudG9wIC0gcmVjdDIuYm90dG9tKSA8PSB0aGlzLnNuYXApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBob3Jpem9udGFsLnB1c2goeyBkaXN0YW5jZTogTWF0aC5hYnMocmVjdC50b3AgLSByZWN0Mi5ib3R0b20pLCBsZWZ0OiByZWN0Mi5sZWZ0LCB3aWR0aDogcmVjdDIud2lkdGgsIHRvcDogcmVjdDIuYm90dG9tLCBzaWRlOiAndG9wJyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMocmVjdC5sZWZ0IC0gcmVjdDIubGVmdCkgPD0gdGhpcy5zbmFwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJ0aWNhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QubGVmdCAtIHJlY3QyLmxlZnQpLCB0b3A6IHJlY3QyLnRvcCwgaGVpZ2h0OiByZWN0Mi5oZWlnaHQsIGxlZnQ6IHJlY3QyLmxlZnQsIHNpZGU6ICdsZWZ0Jywgbm9TcGFjaW5nOiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoTWF0aC5hYnMocmVjdC5yaWdodCAtIHJlY3QyLnJpZ2h0KSA8PSB0aGlzLnNuYXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsLnB1c2goeyBkaXN0YW5jZTogTWF0aC5hYnMocmVjdC5yaWdodCAtIHJlY3QyLnJpZ2h0KSwgdG9wOiByZWN0Mi50b3AsIGhlaWdodDogcmVjdDIuaGVpZ2h0LCBsZWZ0OiByZWN0Mi5yaWdodCwgc2lkZTogJ3JpZ2h0Jywgbm9TcGFjaW5nOiB0cnVlIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoTWF0aC5hYnMocmVjdC5ib3R0b20gLSByZWN0Mi50b3ApIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhvcml6b250YWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LmJvdHRvbSAtIHJlY3QyLnRvcCksIGxlZnQ6IHJlY3QyLmxlZnQsIHdpZHRoOiByZWN0Mi53aWR0aCwgdG9wOiByZWN0Mi50b3AsIHNpZGU6ICdib3R0b20nIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhyZWN0LmxlZnQgLSByZWN0Mi5sZWZ0KSA8PSB0aGlzLnNuYXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnRpY2FsLnB1c2goeyBkaXN0YW5jZTogTWF0aC5hYnMocmVjdC5sZWZ0IC0gcmVjdDIubGVmdCksIHRvcDogcmVjdDIudG9wLCBoZWlnaHQ6IHJlY3QyLmhlaWdodCwgbGVmdDogcmVjdDIubGVmdCwgc2lkZTogJ2xlZnQnLCBub1NwYWNpbmc6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChNYXRoLmFicyhyZWN0LnJpZ2h0IC0gcmVjdDIucmlnaHQpIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmVydGljYWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LnJpZ2h0IC0gcmVjdDIucmlnaHQpLCB0b3A6IHJlY3QyLnRvcCwgaGVpZ2h0OiByZWN0Mi5oZWlnaHQsIGxlZnQ6IHJlY3QyLnJpZ2h0LCBzaWRlOiAncmlnaHQnLCBub1NwYWNpbmc6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChyZWN0LnRvcCAtIHRoaXMuc25hcCA8PSByZWN0Mi5ib3R0b20gJiYgcmVjdC5ib3R0b20gKyB0aGlzLnNuYXAgPj0gcmVjdDIudG9wKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhyZWN0LmxlZnQgLSByZWN0Mi5yaWdodCkgPD0gdGhpcy5zbmFwKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmVydGljYWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LmxlZnQgLSByZWN0Mi5yaWdodCksIHRvcDogcmVjdDIudG9wLCBoZWlnaHQ6IHJlY3QyLmhlaWdodCwgbGVmdDogcmVjdDIucmlnaHQsIHNpZGU6ICdsZWZ0JyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMocmVjdC50b3AgLSByZWN0Mi50b3ApIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9yaXpvbnRhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QudG9wIC0gcmVjdDIudG9wKSwgbGVmdDogcmVjdDIubGVmdCwgd2lkdGg6IHJlY3QyLndpZHRoLCB0b3A6IHJlY3QyLnRvcCwgc2lkZTogJ3RvcCcsIG5vU3BhY2luZzogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKE1hdGguYWJzKHJlY3QuYm90dG9tIC0gcmVjdDIuYm90dG9tKSA8PSB0aGlzLnNuYXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvcml6b250YWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LmJvdHRvbSAtIHJlY3QyLmJvdHRvbSksIGxlZnQ6IHJlY3QyLmxlZnQsIHdpZHRoOiByZWN0Mi53aWR0aCwgdG9wOiByZWN0Mi5ib3R0b20sIHNpZGU6ICdib3R0b20nLCBub1NwYWNpbmc6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChNYXRoLmFicyhyZWN0LnJpZ2h0IC0gcmVjdDIubGVmdCkgPD0gdGhpcy5zbmFwKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmVydGljYWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LnJpZ2h0IC0gcmVjdDIubGVmdCksIHRvcDogcmVjdDIudG9wLCBoZWlnaHQ6IHJlY3QyLmhlaWdodCwgbGVmdDogcmVjdDIubGVmdCwgc2lkZTogJ3JpZ2h0JyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMocmVjdC50b3AgLSByZWN0Mi50b3ApIDw9IHRoaXMuc25hcClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9yaXpvbnRhbC5wdXNoKHsgZGlzdGFuY2U6IE1hdGguYWJzKHJlY3QudG9wIC0gcmVjdDIudG9wKSwgbGVmdDogcmVjdDIubGVmdCwgd2lkdGg6IHJlY3QyLndpZHRoLCB0b3A6IHJlY3QyLnRvcCwgc2lkZTogJ3RvcCcsIG5vU3BhY2luZzogdHJ1ZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKE1hdGguYWJzKHJlY3QuYm90dG9tIC0gcmVjdDIuYm90dG9tKSA8PSB0aGlzLnNuYXApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvcml6b250YWwucHVzaCh7IGRpc3RhbmNlOiBNYXRoLmFicyhyZWN0LmJvdHRvbSAtIHJlY3QyLmJvdHRvbSksIGxlZnQ6IHJlY3QyLmxlZnQsIHdpZHRoOiByZWN0Mi53aWR0aCwgdG9wOiByZWN0Mi5ib3R0b20sIHNpZGU6ICdib3R0b20nLCBub1NwYWNpbmc6IHRydWUgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtb3ZlKHdpbilcclxuICAgIHtcclxuICAgICAgICBpZiAodGhpcy5zdG9wcGVkIHx8IHdpbi5vcHRpb25zLm5vU25hcClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmhvcml6b250YWwuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgIHRoaXMudmVydGljYWwuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xyXG4gICAgICAgIGNvbnN0IGhvcml6b250YWwgPSBbXVxyXG4gICAgICAgIGNvbnN0IHZlcnRpY2FsID0gW11cclxuICAgICAgICBjb25zdCByZWN0ID0gd2luLndpbi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxyXG4gICAgICAgIGlmICh0aGlzLnNjcmVlbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2NyZWVuTW92ZShyZWN0LCBob3Jpem9udGFsLCB2ZXJ0aWNhbClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMud2luZG93cylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMud2luZG93c01vdmUod2luLCByZWN0LCBob3Jpem9udGFsLCB2ZXJ0aWNhbClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGhvcml6b250YWwubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaG9yaXpvbnRhbC5zb3J0KChhLCBiKSA9PiB7IHJldHVybiBhLmRpc3RhbmNlIC0gYi5kaXN0YW5jZSB9KVxyXG4gICAgICAgICAgICBjb25zdCBmaW5kID0gaG9yaXpvbnRhbFswXVxyXG4gICAgICAgICAgICB0aGlzLmhvcml6b250YWwuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcclxuICAgICAgICAgICAgdGhpcy5ob3Jpem9udGFsLnN0eWxlLmxlZnQgPSBmaW5kLmxlZnQgKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMuaG9yaXpvbnRhbC5zdHlsZS53aWR0aCA9IGZpbmQud2lkdGggKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMuaG9yaXpvbnRhbC5zdHlsZS50b3AgPSBmaW5kLnRvcCAtIHRoaXMuc2l6ZSAvIDIgKyAncHgnXHJcbiAgICAgICAgICAgIHRoaXMuaG9yaXpvbnRhbC55ID0gZmluZC50b3BcclxuICAgICAgICAgICAgdGhpcy5ob3Jpem9udGFsLnNpZGUgPSBmaW5kLnNpZGVcclxuICAgICAgICAgICAgdGhpcy5ob3Jpem9udGFsLm5vU3BhY2luZyA9IGZpbmQubm9TcGFjaW5nXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh2ZXJ0aWNhbC5sZW5ndGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2ZXJ0aWNhbC5zb3J0KChhLCBiKSA9PiB7IHJldHVybiBhLmRpc3RhbmNlIC0gYi5kaXN0YW5jZSB9KVxyXG4gICAgICAgICAgICBjb25zdCBmaW5kID0gdmVydGljYWxbMF1cclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNhbC5zdHlsZS5kaXNwbGF5ICA9ICdibG9jaydcclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNhbC5zdHlsZS50b3AgPSBmaW5kLnRvcCArICdweCdcclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNhbC5zdHlsZS5oZWlnaHQgPSBmaW5kLmhlaWdodCArICdweCdcclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNhbC5zdHlsZS5sZWZ0ID0gZmluZC5sZWZ0IC0gdGhpcy5zaXplIC8gMiArICdweCdcclxuICAgICAgICAgICAgdGhpcy52ZXJ0aWNhbC54ID0gZmluZC5sZWZ0XHJcbiAgICAgICAgICAgIHRoaXMudmVydGljYWwuc2lkZSA9IGZpbmQuc2lkZVxyXG4gICAgICAgICAgICB0aGlzLnZlcnRpY2FsLm5vU3BhY2luZyA9IGZpbmQubm9TcGFjaW5nXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1vdmVFbmQod2luKVxyXG4gICAge1xyXG4gICAgICAgIGlmICh0aGlzLnN0b3BwZWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuaG9yaXpvbnRhbC5zdHlsZS5kaXNwbGF5ID09PSAnYmxvY2snKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc3Qgc3BhY2luZyA9IHRoaXMuaG9yaXpvbnRhbC5ub1NwYWNpbmcgPyAwIDogdGhpcy5zcGFjaW5nXHJcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdCA9IHdpbi5taW5pbWl6ZWQgPyAod2luLmhlaWdodCAtIHdpbi5oZWlnaHQgKiB3aW4ubWluaW1pemVkLnNjYWxlWSkgLyAyIDogMFxyXG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMuaG9yaXpvbnRhbC5zaWRlKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd0b3AnOlxyXG4gICAgICAgICAgICAgICAgICAgIHdpbi55ID0gdGhpcy5ob3Jpem9udGFsLnkgLSBhZGp1c3QgKyBzcGFjaW5nXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdib3R0b20nOlxyXG4gICAgICAgICAgICAgICAgICAgIHdpbi5ib3R0b20gPSB0aGlzLmhvcml6b250YWwueSArIGFkanVzdCAtIHNwYWNpbmdcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnZlcnRpY2FsLnN0eWxlLmRpc3BsYXkgPT09ICdibG9jaycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zdCBzcGFjaW5nID0gdGhpcy52ZXJ0aWNhbC5ub1NwYWNpbmcgPyAwIDogdGhpcy5zcGFjaW5nXHJcbiAgICAgICAgICAgIGNvbnN0IGFkanVzdCA9IHdpbi5taW5pbWl6ZWQgPyAod2luLndpZHRoIC0gd2luLndpZHRoICogd2luLm1pbmltaXplZC5zY2FsZVgpIC8gMiA6IDBcclxuICAgICAgICAgICAgc3dpdGNoICh0aGlzLnZlcnRpY2FsLnNpZGUpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xlZnQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHdpbi54ID0gdGhpcy52ZXJ0aWNhbC54IC0gYWRqdXN0ICsgc3BhY2luZ1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncmlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHdpbi5yaWdodCA9IHRoaXMudmVydGljYWwueCArIGFkanVzdCAtIHNwYWNpbmdcclxuICAgICAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaG9yaXpvbnRhbC5zdHlsZS5kaXNwbGF5ID0gdGhpcy52ZXJ0aWNhbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXHJcbiAgICB9XHJcbn0iXX0=