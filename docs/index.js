
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
	'use strict';

	function createCommonjsModule(fn, basedir, module) {
		return module = {
		  path: basedir,
		  exports: {},
		  require: function (path, base) {
	      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
	    }
		}, fn(module, module.exports), module.exports;
	}

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
	}

	var tinycolor = createCommonjsModule(function (module) {
	// TinyColor v1.4.1
	// https://github.com/bgrins/TinyColor
	// Brian Grinstead, MIT License

	(function(Math) {

	var trimLeft = /^\s+/,
	    trimRight = /\s+$/,
	    tinyCounter = 0,
	    mathRound = Math.round,
	    mathMin = Math.min,
	    mathMax = Math.max,
	    mathRandom = Math.random;

	function tinycolor (color, opts) {

	    color = (color) ? color : '';
	    opts = opts || { };

	    // If input is already a tinycolor, return itself
	    if (color instanceof tinycolor) {
	       return color;
	    }
	    // If we are called as a function, call using new instead
	    if (!(this instanceof tinycolor)) {
	        return new tinycolor(color, opts);
	    }

	    var rgb = inputToRGB(color);
	    this._originalInput = color,
	    this._r = rgb.r,
	    this._g = rgb.g,
	    this._b = rgb.b,
	    this._a = rgb.a,
	    this._roundA = mathRound(100*this._a) / 100,
	    this._format = opts.format || rgb.format;
	    this._gradientType = opts.gradientType;

	    // Don't let the range of [0,255] come back in [0,1].
	    // Potentially lose a little bit of precision here, but will fix issues where
	    // .5 gets interpreted as half of the total, instead of half of 1
	    // If it was supposed to be 128, this was already taken care of by `inputToRgb`
	    if (this._r < 1) { this._r = mathRound(this._r); }
	    if (this._g < 1) { this._g = mathRound(this._g); }
	    if (this._b < 1) { this._b = mathRound(this._b); }

	    this._ok = rgb.ok;
	    this._tc_id = tinyCounter++;
	}

	tinycolor.prototype = {
	    isDark: function() {
	        return this.getBrightness() < 128;
	    },
	    isLight: function() {
	        return !this.isDark();
	    },
	    isValid: function() {
	        return this._ok;
	    },
	    getOriginalInput: function() {
	      return this._originalInput;
	    },
	    getFormat: function() {
	        return this._format;
	    },
	    getAlpha: function() {
	        return this._a;
	    },
	    getBrightness: function() {
	        //http://www.w3.org/TR/AERT#color-contrast
	        var rgb = this.toRgb();
	        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
	    },
	    getLuminance: function() {
	        //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
	        var rgb = this.toRgb();
	        var RsRGB, GsRGB, BsRGB, R, G, B;
	        RsRGB = rgb.r/255;
	        GsRGB = rgb.g/255;
	        BsRGB = rgb.b/255;

	        if (RsRGB <= 0.03928) {R = RsRGB / 12.92;} else {R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);}
	        if (GsRGB <= 0.03928) {G = GsRGB / 12.92;} else {G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);}
	        if (BsRGB <= 0.03928) {B = BsRGB / 12.92;} else {B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);}
	        return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
	    },
	    setAlpha: function(value) {
	        this._a = boundAlpha(value);
	        this._roundA = mathRound(100*this._a) / 100;
	        return this;
	    },
	    toHsv: function() {
	        var hsv = rgbToHsv(this._r, this._g, this._b);
	        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
	    },
	    toHsvString: function() {
	        var hsv = rgbToHsv(this._r, this._g, this._b);
	        var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
	        return (this._a == 1) ?
	          "hsv("  + h + ", " + s + "%, " + v + "%)" :
	          "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
	    },
	    toHsl: function() {
	        var hsl = rgbToHsl(this._r, this._g, this._b);
	        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
	    },
	    toHslString: function() {
	        var hsl = rgbToHsl(this._r, this._g, this._b);
	        var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
	        return (this._a == 1) ?
	          "hsl("  + h + ", " + s + "%, " + l + "%)" :
	          "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
	    },
	    toHex: function(allow3Char) {
	        return rgbToHex(this._r, this._g, this._b, allow3Char);
	    },
	    toHexString: function(allow3Char) {
	        return '#' + this.toHex(allow3Char);
	    },
	    toHex8: function(allow4Char) {
	        return rgbaToHex(this._r, this._g, this._b, this._a, allow4Char);
	    },
	    toHex8String: function(allow4Char) {
	        return '#' + this.toHex8(allow4Char);
	    },
	    toRgb: function() {
	        return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
	    },
	    toRgbString: function() {
	        return (this._a == 1) ?
	          "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
	          "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
	    },
	    toPercentageRgb: function() {
	        return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
	    },
	    toPercentageRgbString: function() {
	        return (this._a == 1) ?
	          "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
	          "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
	    },
	    toName: function() {
	        if (this._a === 0) {
	            return "transparent";
	        }

	        if (this._a < 1) {
	            return false;
	        }

	        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
	    },
	    toFilter: function(secondColor) {
	        var hex8String = '#' + rgbaToArgbHex(this._r, this._g, this._b, this._a);
	        var secondHex8String = hex8String;
	        var gradientType = this._gradientType ? "GradientType = 1, " : "";

	        if (secondColor) {
	            var s = tinycolor(secondColor);
	            secondHex8String = '#' + rgbaToArgbHex(s._r, s._g, s._b, s._a);
	        }

	        return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
	    },
	    toString: function(format) {
	        var formatSet = !!format;
	        format = format || this._format;

	        var formattedString = false;
	        var hasAlpha = this._a < 1 && this._a >= 0;
	        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "hex4" || format === "hex8" || format === "name");

	        if (needsAlphaFormat) {
	            // Special case for "transparent", all other non-alpha formats
	            // will return rgba when there is transparency.
	            if (format === "name" && this._a === 0) {
	                return this.toName();
	            }
	            return this.toRgbString();
	        }
	        if (format === "rgb") {
	            formattedString = this.toRgbString();
	        }
	        if (format === "prgb") {
	            formattedString = this.toPercentageRgbString();
	        }
	        if (format === "hex" || format === "hex6") {
	            formattedString = this.toHexString();
	        }
	        if (format === "hex3") {
	            formattedString = this.toHexString(true);
	        }
	        if (format === "hex4") {
	            formattedString = this.toHex8String(true);
	        }
	        if (format === "hex8") {
	            formattedString = this.toHex8String();
	        }
	        if (format === "name") {
	            formattedString = this.toName();
	        }
	        if (format === "hsl") {
	            formattedString = this.toHslString();
	        }
	        if (format === "hsv") {
	            formattedString = this.toHsvString();
	        }

	        return formattedString || this.toHexString();
	    },
	    clone: function() {
	        return tinycolor(this.toString());
	    },

	    _applyModification: function(fn, args) {
	        var color = fn.apply(null, [this].concat([].slice.call(args)));
	        this._r = color._r;
	        this._g = color._g;
	        this._b = color._b;
	        this.setAlpha(color._a);
	        return this;
	    },
	    lighten: function() {
	        return this._applyModification(lighten, arguments);
	    },
	    brighten: function() {
	        return this._applyModification(brighten, arguments);
	    },
	    darken: function() {
	        return this._applyModification(darken, arguments);
	    },
	    desaturate: function() {
	        return this._applyModification(desaturate, arguments);
	    },
	    saturate: function() {
	        return this._applyModification(saturate, arguments);
	    },
	    greyscale: function() {
	        return this._applyModification(greyscale, arguments);
	    },
	    spin: function() {
	        return this._applyModification(spin, arguments);
	    },

	    _applyCombination: function(fn, args) {
	        return fn.apply(null, [this].concat([].slice.call(args)));
	    },
	    analogous: function() {
	        return this._applyCombination(analogous, arguments);
	    },
	    complement: function() {
	        return this._applyCombination(complement, arguments);
	    },
	    monochromatic: function() {
	        return this._applyCombination(monochromatic, arguments);
	    },
	    splitcomplement: function() {
	        return this._applyCombination(splitcomplement, arguments);
	    },
	    triad: function() {
	        return this._applyCombination(triad, arguments);
	    },
	    tetrad: function() {
	        return this._applyCombination(tetrad, arguments);
	    }
	};

	// If input is an object, force 1 into "1.0" to handle ratios properly
	// String input requires "1.0" as input, so 1 will be treated as 1
	tinycolor.fromRatio = function(color, opts) {
	    if (typeof color == "object") {
	        var newColor = {};
	        for (var i in color) {
	            if (color.hasOwnProperty(i)) {
	                if (i === "a") {
	                    newColor[i] = color[i];
	                }
	                else {
	                    newColor[i] = convertToPercentage(color[i]);
	                }
	            }
	        }
	        color = newColor;
	    }

	    return tinycolor(color, opts);
	};

	// Given a string or object, convert that input to RGB
	// Possible string inputs:
	//
	//     "red"
	//     "#f00" or "f00"
	//     "#ff0000" or "ff0000"
	//     "#ff000000" or "ff000000"
	//     "rgb 255 0 0" or "rgb (255, 0, 0)"
	//     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
	//     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
	//     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
	//     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
	//     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
	//     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
	//
	function inputToRGB(color) {

	    var rgb = { r: 0, g: 0, b: 0 };
	    var a = 1;
	    var s = null;
	    var v = null;
	    var l = null;
	    var ok = false;
	    var format = false;

	    if (typeof color == "string") {
	        color = stringInputToObject(color);
	    }

	    if (typeof color == "object") {
	        if (isValidCSSUnit(color.r) && isValidCSSUnit(color.g) && isValidCSSUnit(color.b)) {
	            rgb = rgbToRgb(color.r, color.g, color.b);
	            ok = true;
	            format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
	        }
	        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.v)) {
	            s = convertToPercentage(color.s);
	            v = convertToPercentage(color.v);
	            rgb = hsvToRgb(color.h, s, v);
	            ok = true;
	            format = "hsv";
	        }
	        else if (isValidCSSUnit(color.h) && isValidCSSUnit(color.s) && isValidCSSUnit(color.l)) {
	            s = convertToPercentage(color.s);
	            l = convertToPercentage(color.l);
	            rgb = hslToRgb(color.h, s, l);
	            ok = true;
	            format = "hsl";
	        }

	        if (color.hasOwnProperty("a")) {
	            a = color.a;
	        }
	    }

	    a = boundAlpha(a);

	    return {
	        ok: ok,
	        format: color.format || format,
	        r: mathMin(255, mathMax(rgb.r, 0)),
	        g: mathMin(255, mathMax(rgb.g, 0)),
	        b: mathMin(255, mathMax(rgb.b, 0)),
	        a: a
	    };
	}


	// Conversion Functions
	// --------------------

	// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
	// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

	// `rgbToRgb`
	// Handle bounds / percentage checking to conform to CSS color spec
	// <http://www.w3.org/TR/css3-color/>
	// *Assumes:* r, g, b in [0, 255] or [0, 1]
	// *Returns:* { r, g, b } in [0, 255]
	function rgbToRgb(r, g, b){
	    return {
	        r: bound01(r, 255) * 255,
	        g: bound01(g, 255) * 255,
	        b: bound01(b, 255) * 255
	    };
	}

	// `rgbToHsl`
	// Converts an RGB color value to HSL.
	// *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
	// *Returns:* { h, s, l } in [0,1]
	function rgbToHsl(r, g, b) {

	    r = bound01(r, 255);
	    g = bound01(g, 255);
	    b = bound01(b, 255);

	    var max = mathMax(r, g, b), min = mathMin(r, g, b);
	    var h, s, l = (max + min) / 2;

	    if(max == min) {
	        h = s = 0; // achromatic
	    }
	    else {
	        var d = max - min;
	        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	        switch(max) {
	            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
	            case g: h = (b - r) / d + 2; break;
	            case b: h = (r - g) / d + 4; break;
	        }

	        h /= 6;
	    }

	    return { h: h, s: s, l: l };
	}

	// `hslToRgb`
	// Converts an HSL color value to RGB.
	// *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
	// *Returns:* { r, g, b } in the set [0, 255]
	function hslToRgb(h, s, l) {
	    var r, g, b;

	    h = bound01(h, 360);
	    s = bound01(s, 100);
	    l = bound01(l, 100);

	    function hue2rgb(p, q, t) {
	        if(t < 0) t += 1;
	        if(t > 1) t -= 1;
	        if(t < 1/6) return p + (q - p) * 6 * t;
	        if(t < 1/2) return q;
	        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
	        return p;
	    }

	    if(s === 0) {
	        r = g = b = l; // achromatic
	    }
	    else {
	        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	        var p = 2 * l - q;
	        r = hue2rgb(p, q, h + 1/3);
	        g = hue2rgb(p, q, h);
	        b = hue2rgb(p, q, h - 1/3);
	    }

	    return { r: r * 255, g: g * 255, b: b * 255 };
	}

	// `rgbToHsv`
	// Converts an RGB color value to HSV
	// *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
	// *Returns:* { h, s, v } in [0,1]
	function rgbToHsv(r, g, b) {

	    r = bound01(r, 255);
	    g = bound01(g, 255);
	    b = bound01(b, 255);

	    var max = mathMax(r, g, b), min = mathMin(r, g, b);
	    var h, s, v = max;

	    var d = max - min;
	    s = max === 0 ? 0 : d / max;

	    if(max == min) {
	        h = 0; // achromatic
	    }
	    else {
	        switch(max) {
	            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
	            case g: h = (b - r) / d + 2; break;
	            case b: h = (r - g) / d + 4; break;
	        }
	        h /= 6;
	    }
	    return { h: h, s: s, v: v };
	}

	// `hsvToRgb`
	// Converts an HSV color value to RGB.
	// *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
	// *Returns:* { r, g, b } in the set [0, 255]
	 function hsvToRgb(h, s, v) {

	    h = bound01(h, 360) * 6;
	    s = bound01(s, 100);
	    v = bound01(v, 100);

	    var i = Math.floor(h),
	        f = h - i,
	        p = v * (1 - s),
	        q = v * (1 - f * s),
	        t = v * (1 - (1 - f) * s),
	        mod = i % 6,
	        r = [v, q, p, p, t, v][mod],
	        g = [t, v, v, q, p, p][mod],
	        b = [p, p, t, v, v, q][mod];

	    return { r: r * 255, g: g * 255, b: b * 255 };
	}

	// `rgbToHex`
	// Converts an RGB color to hex
	// Assumes r, g, and b are contained in the set [0, 255]
	// Returns a 3 or 6 character hex
	function rgbToHex(r, g, b, allow3Char) {

	    var hex = [
	        pad2(mathRound(r).toString(16)),
	        pad2(mathRound(g).toString(16)),
	        pad2(mathRound(b).toString(16))
	    ];

	    // Return a 3 character hex if possible
	    if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
	        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
	    }

	    return hex.join("");
	}

	// `rgbaToHex`
	// Converts an RGBA color plus alpha transparency to hex
	// Assumes r, g, b are contained in the set [0, 255] and
	// a in [0, 1]. Returns a 4 or 8 character rgba hex
	function rgbaToHex(r, g, b, a, allow4Char) {

	    var hex = [
	        pad2(mathRound(r).toString(16)),
	        pad2(mathRound(g).toString(16)),
	        pad2(mathRound(b).toString(16)),
	        pad2(convertDecimalToHex(a))
	    ];

	    // Return a 4 character hex if possible
	    if (allow4Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1) && hex[3].charAt(0) == hex[3].charAt(1)) {
	        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0) + hex[3].charAt(0);
	    }

	    return hex.join("");
	}

	// `rgbaToArgbHex`
	// Converts an RGBA color to an ARGB Hex8 string
	// Rarely used, but required for "toFilter()"
	function rgbaToArgbHex(r, g, b, a) {

	    var hex = [
	        pad2(convertDecimalToHex(a)),
	        pad2(mathRound(r).toString(16)),
	        pad2(mathRound(g).toString(16)),
	        pad2(mathRound(b).toString(16))
	    ];

	    return hex.join("");
	}

	// `equals`
	// Can be called with any tinycolor input
	tinycolor.equals = function (color1, color2) {
	    if (!color1 || !color2) { return false; }
	    return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
	};

	tinycolor.random = function() {
	    return tinycolor.fromRatio({
	        r: mathRandom(),
	        g: mathRandom(),
	        b: mathRandom()
	    });
	};


	// Modification Functions
	// ----------------------
	// Thanks to less.js for some of the basics here
	// <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

	function desaturate(color, amount) {
	    amount = (amount === 0) ? 0 : (amount || 10);
	    var hsl = tinycolor(color).toHsl();
	    hsl.s -= amount / 100;
	    hsl.s = clamp01(hsl.s);
	    return tinycolor(hsl);
	}

	function saturate(color, amount) {
	    amount = (amount === 0) ? 0 : (amount || 10);
	    var hsl = tinycolor(color).toHsl();
	    hsl.s += amount / 100;
	    hsl.s = clamp01(hsl.s);
	    return tinycolor(hsl);
	}

	function greyscale(color) {
	    return tinycolor(color).desaturate(100);
	}

	function lighten (color, amount) {
	    amount = (amount === 0) ? 0 : (amount || 10);
	    var hsl = tinycolor(color).toHsl();
	    hsl.l += amount / 100;
	    hsl.l = clamp01(hsl.l);
	    return tinycolor(hsl);
	}

	function brighten(color, amount) {
	    amount = (amount === 0) ? 0 : (amount || 10);
	    var rgb = tinycolor(color).toRgb();
	    rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
	    rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
	    rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
	    return tinycolor(rgb);
	}

	function darken (color, amount) {
	    amount = (amount === 0) ? 0 : (amount || 10);
	    var hsl = tinycolor(color).toHsl();
	    hsl.l -= amount / 100;
	    hsl.l = clamp01(hsl.l);
	    return tinycolor(hsl);
	}

	// Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
	// Values outside of this range will be wrapped into this range.
	function spin(color, amount) {
	    var hsl = tinycolor(color).toHsl();
	    var hue = (hsl.h + amount) % 360;
	    hsl.h = hue < 0 ? 360 + hue : hue;
	    return tinycolor(hsl);
	}

	// Combination Functions
	// ---------------------
	// Thanks to jQuery xColor for some of the ideas behind these
	// <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

	function complement(color) {
	    var hsl = tinycolor(color).toHsl();
	    hsl.h = (hsl.h + 180) % 360;
	    return tinycolor(hsl);
	}

	function triad(color) {
	    var hsl = tinycolor(color).toHsl();
	    var h = hsl.h;
	    return [
	        tinycolor(color),
	        tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
	        tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
	    ];
	}

	function tetrad(color) {
	    var hsl = tinycolor(color).toHsl();
	    var h = hsl.h;
	    return [
	        tinycolor(color),
	        tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
	        tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
	        tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
	    ];
	}

	function splitcomplement(color) {
	    var hsl = tinycolor(color).toHsl();
	    var h = hsl.h;
	    return [
	        tinycolor(color),
	        tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
	        tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
	    ];
	}

	function analogous(color, results, slices) {
	    results = results || 6;
	    slices = slices || 30;

	    var hsl = tinycolor(color).toHsl();
	    var part = 360 / slices;
	    var ret = [tinycolor(color)];

	    for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
	        hsl.h = (hsl.h + part) % 360;
	        ret.push(tinycolor(hsl));
	    }
	    return ret;
	}

	function monochromatic(color, results) {
	    results = results || 6;
	    var hsv = tinycolor(color).toHsv();
	    var h = hsv.h, s = hsv.s, v = hsv.v;
	    var ret = [];
	    var modification = 1 / results;

	    while (results--) {
	        ret.push(tinycolor({ h: h, s: s, v: v}));
	        v = (v + modification) % 1;
	    }

	    return ret;
	}

	// Utility Functions
	// ---------------------

	tinycolor.mix = function(color1, color2, amount) {
	    amount = (amount === 0) ? 0 : (amount || 50);

	    var rgb1 = tinycolor(color1).toRgb();
	    var rgb2 = tinycolor(color2).toRgb();

	    var p = amount / 100;

	    var rgba = {
	        r: ((rgb2.r - rgb1.r) * p) + rgb1.r,
	        g: ((rgb2.g - rgb1.g) * p) + rgb1.g,
	        b: ((rgb2.b - rgb1.b) * p) + rgb1.b,
	        a: ((rgb2.a - rgb1.a) * p) + rgb1.a
	    };

	    return tinycolor(rgba);
	};


	// Readability Functions
	// ---------------------
	// <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

	// `contrast`
	// Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
	tinycolor.readability = function(color1, color2) {
	    var c1 = tinycolor(color1);
	    var c2 = tinycolor(color2);
	    return (Math.max(c1.getLuminance(),c2.getLuminance())+0.05) / (Math.min(c1.getLuminance(),c2.getLuminance())+0.05);
	};

	// `isReadable`
	// Ensure that foreground and background color combinations meet WCAG2 guidelines.
	// The third argument is an optional Object.
	//      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
	//      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
	// If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

	// *Example*
	//    tinycolor.isReadable("#000", "#111") => false
	//    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
	tinycolor.isReadable = function(color1, color2, wcag2) {
	    var readability = tinycolor.readability(color1, color2);
	    var wcag2Parms, out;

	    out = false;

	    wcag2Parms = validateWCAG2Parms(wcag2);
	    switch (wcag2Parms.level + wcag2Parms.size) {
	        case "AAsmall":
	        case "AAAlarge":
	            out = readability >= 4.5;
	            break;
	        case "AAlarge":
	            out = readability >= 3;
	            break;
	        case "AAAsmall":
	            out = readability >= 7;
	            break;
	    }
	    return out;

	};

	// `mostReadable`
	// Given a base color and a list of possible foreground or background
	// colors for that base, returns the most readable color.
	// Optionally returns Black or White if the most readable color is unreadable.
	// *Example*
	//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
	//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
	//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
	//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
	tinycolor.mostReadable = function(baseColor, colorList, args) {
	    var bestColor = null;
	    var bestScore = 0;
	    var readability;
	    var includeFallbackColors, level, size ;
	    args = args || {};
	    includeFallbackColors = args.includeFallbackColors ;
	    level = args.level;
	    size = args.size;

	    for (var i= 0; i < colorList.length ; i++) {
	        readability = tinycolor.readability(baseColor, colorList[i]);
	        if (readability > bestScore) {
	            bestScore = readability;
	            bestColor = tinycolor(colorList[i]);
	        }
	    }

	    if (tinycolor.isReadable(baseColor, bestColor, {"level":level,"size":size}) || !includeFallbackColors) {
	        return bestColor;
	    }
	    else {
	        args.includeFallbackColors=false;
	        return tinycolor.mostReadable(baseColor,["#fff", "#000"],args);
	    }
	};


	// Big List of Colors
	// ------------------
	// <http://www.w3.org/TR/css3-color/#svg-color>
	var names = tinycolor.names = {
	    aliceblue: "f0f8ff",
	    antiquewhite: "faebd7",
	    aqua: "0ff",
	    aquamarine: "7fffd4",
	    azure: "f0ffff",
	    beige: "f5f5dc",
	    bisque: "ffe4c4",
	    black: "000",
	    blanchedalmond: "ffebcd",
	    blue: "00f",
	    blueviolet: "8a2be2",
	    brown: "a52a2a",
	    burlywood: "deb887",
	    burntsienna: "ea7e5d",
	    cadetblue: "5f9ea0",
	    chartreuse: "7fff00",
	    chocolate: "d2691e",
	    coral: "ff7f50",
	    cornflowerblue: "6495ed",
	    cornsilk: "fff8dc",
	    crimson: "dc143c",
	    cyan: "0ff",
	    darkblue: "00008b",
	    darkcyan: "008b8b",
	    darkgoldenrod: "b8860b",
	    darkgray: "a9a9a9",
	    darkgreen: "006400",
	    darkgrey: "a9a9a9",
	    darkkhaki: "bdb76b",
	    darkmagenta: "8b008b",
	    darkolivegreen: "556b2f",
	    darkorange: "ff8c00",
	    darkorchid: "9932cc",
	    darkred: "8b0000",
	    darksalmon: "e9967a",
	    darkseagreen: "8fbc8f",
	    darkslateblue: "483d8b",
	    darkslategray: "2f4f4f",
	    darkslategrey: "2f4f4f",
	    darkturquoise: "00ced1",
	    darkviolet: "9400d3",
	    deeppink: "ff1493",
	    deepskyblue: "00bfff",
	    dimgray: "696969",
	    dimgrey: "696969",
	    dodgerblue: "1e90ff",
	    firebrick: "b22222",
	    floralwhite: "fffaf0",
	    forestgreen: "228b22",
	    fuchsia: "f0f",
	    gainsboro: "dcdcdc",
	    ghostwhite: "f8f8ff",
	    gold: "ffd700",
	    goldenrod: "daa520",
	    gray: "808080",
	    green: "008000",
	    greenyellow: "adff2f",
	    grey: "808080",
	    honeydew: "f0fff0",
	    hotpink: "ff69b4",
	    indianred: "cd5c5c",
	    indigo: "4b0082",
	    ivory: "fffff0",
	    khaki: "f0e68c",
	    lavender: "e6e6fa",
	    lavenderblush: "fff0f5",
	    lawngreen: "7cfc00",
	    lemonchiffon: "fffacd",
	    lightblue: "add8e6",
	    lightcoral: "f08080",
	    lightcyan: "e0ffff",
	    lightgoldenrodyellow: "fafad2",
	    lightgray: "d3d3d3",
	    lightgreen: "90ee90",
	    lightgrey: "d3d3d3",
	    lightpink: "ffb6c1",
	    lightsalmon: "ffa07a",
	    lightseagreen: "20b2aa",
	    lightskyblue: "87cefa",
	    lightslategray: "789",
	    lightslategrey: "789",
	    lightsteelblue: "b0c4de",
	    lightyellow: "ffffe0",
	    lime: "0f0",
	    limegreen: "32cd32",
	    linen: "faf0e6",
	    magenta: "f0f",
	    maroon: "800000",
	    mediumaquamarine: "66cdaa",
	    mediumblue: "0000cd",
	    mediumorchid: "ba55d3",
	    mediumpurple: "9370db",
	    mediumseagreen: "3cb371",
	    mediumslateblue: "7b68ee",
	    mediumspringgreen: "00fa9a",
	    mediumturquoise: "48d1cc",
	    mediumvioletred: "c71585",
	    midnightblue: "191970",
	    mintcream: "f5fffa",
	    mistyrose: "ffe4e1",
	    moccasin: "ffe4b5",
	    navajowhite: "ffdead",
	    navy: "000080",
	    oldlace: "fdf5e6",
	    olive: "808000",
	    olivedrab: "6b8e23",
	    orange: "ffa500",
	    orangered: "ff4500",
	    orchid: "da70d6",
	    palegoldenrod: "eee8aa",
	    palegreen: "98fb98",
	    paleturquoise: "afeeee",
	    palevioletred: "db7093",
	    papayawhip: "ffefd5",
	    peachpuff: "ffdab9",
	    peru: "cd853f",
	    pink: "ffc0cb",
	    plum: "dda0dd",
	    powderblue: "b0e0e6",
	    purple: "800080",
	    rebeccapurple: "663399",
	    red: "f00",
	    rosybrown: "bc8f8f",
	    royalblue: "4169e1",
	    saddlebrown: "8b4513",
	    salmon: "fa8072",
	    sandybrown: "f4a460",
	    seagreen: "2e8b57",
	    seashell: "fff5ee",
	    sienna: "a0522d",
	    silver: "c0c0c0",
	    skyblue: "87ceeb",
	    slateblue: "6a5acd",
	    slategray: "708090",
	    slategrey: "708090",
	    snow: "fffafa",
	    springgreen: "00ff7f",
	    steelblue: "4682b4",
	    tan: "d2b48c",
	    teal: "008080",
	    thistle: "d8bfd8",
	    tomato: "ff6347",
	    turquoise: "40e0d0",
	    violet: "ee82ee",
	    wheat: "f5deb3",
	    white: "fff",
	    whitesmoke: "f5f5f5",
	    yellow: "ff0",
	    yellowgreen: "9acd32"
	};

	// Make it easy to access colors via `hexNames[hex]`
	var hexNames = tinycolor.hexNames = flip(names);


	// Utilities
	// ---------

	// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
	function flip(o) {
	    var flipped = { };
	    for (var i in o) {
	        if (o.hasOwnProperty(i)) {
	            flipped[o[i]] = i;
	        }
	    }
	    return flipped;
	}

	// Return a valid alpha value [0,1] with all invalid values being set to 1
	function boundAlpha(a) {
	    a = parseFloat(a);

	    if (isNaN(a) || a < 0 || a > 1) {
	        a = 1;
	    }

	    return a;
	}

	// Take input from [0, n] and return it as [0, 1]
	function bound01(n, max) {
	    if (isOnePointZero(n)) { n = "100%"; }

	    var processPercent = isPercentage(n);
	    n = mathMin(max, mathMax(0, parseFloat(n)));

	    // Automatically convert percentage into number
	    if (processPercent) {
	        n = parseInt(n * max, 10) / 100;
	    }

	    // Handle floating point rounding errors
	    if ((Math.abs(n - max) < 0.000001)) {
	        return 1;
	    }

	    // Convert into [0, 1] range if it isn't already
	    return (n % max) / parseFloat(max);
	}

	// Force a number between 0 and 1
	function clamp01(val) {
	    return mathMin(1, mathMax(0, val));
	}

	// Parse a base-16 hex value into a base-10 integer
	function parseIntFromHex(val) {
	    return parseInt(val, 16);
	}

	// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
	// <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
	function isOnePointZero(n) {
	    return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
	}

	// Check to see if string passed in is a percentage
	function isPercentage(n) {
	    return typeof n === "string" && n.indexOf('%') != -1;
	}

	// Force a hex value to have 2 characters
	function pad2(c) {
	    return c.length == 1 ? '0' + c : '' + c;
	}

	// Replace a decimal with it's percentage value
	function convertToPercentage(n) {
	    if (n <= 1) {
	        n = (n * 100) + "%";
	    }

	    return n;
	}

	// Converts a decimal to a hex value
	function convertDecimalToHex(d) {
	    return Math.round(parseFloat(d) * 255).toString(16);
	}
	// Converts a hex value to a decimal
	function convertHexToDecimal(h) {
	    return (parseIntFromHex(h) / 255);
	}

	var matchers = (function() {

	    // <http://www.w3.org/TR/css3-values/#integers>
	    var CSS_INTEGER = "[-\\+]?\\d+%?";

	    // <http://www.w3.org/TR/css3-values/#number-value>
	    var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

	    // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
	    var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

	    // Actual matching.
	    // Parentheses and commas are optional, but not required.
	    // Whitespace can take the place of commas or opening paren
	    var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
	    var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

	    return {
	        CSS_UNIT: new RegExp(CSS_UNIT),
	        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
	        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
	        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
	        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
	        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
	        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
	        hex3: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
	        hex6: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
	        hex4: /^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
	        hex8: /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
	    };
	})();

	// `isValidCSSUnit`
	// Take in a single string / number and check to see if it looks like a CSS unit
	// (see `matchers` above for definition).
	function isValidCSSUnit(color) {
	    return !!matchers.CSS_UNIT.exec(color);
	}

	// `stringInputToObject`
	// Permissive string parsing.  Take in a number of formats, and output an object
	// based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
	function stringInputToObject(color) {

	    color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
	    var named = false;
	    if (names[color]) {
	        color = names[color];
	        named = true;
	    }
	    else if (color == 'transparent') {
	        return { r: 0, g: 0, b: 0, a: 0, format: "name" };
	    }

	    // Try to match string input using regular expressions.
	    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
	    // Just return an object and let the conversion functions handle that.
	    // This way the result will be the same whether the tinycolor is initialized with string or object.
	    var match;
	    if ((match = matchers.rgb.exec(color))) {
	        return { r: match[1], g: match[2], b: match[3] };
	    }
	    if ((match = matchers.rgba.exec(color))) {
	        return { r: match[1], g: match[2], b: match[3], a: match[4] };
	    }
	    if ((match = matchers.hsl.exec(color))) {
	        return { h: match[1], s: match[2], l: match[3] };
	    }
	    if ((match = matchers.hsla.exec(color))) {
	        return { h: match[1], s: match[2], l: match[3], a: match[4] };
	    }
	    if ((match = matchers.hsv.exec(color))) {
	        return { h: match[1], s: match[2], v: match[3] };
	    }
	    if ((match = matchers.hsva.exec(color))) {
	        return { h: match[1], s: match[2], v: match[3], a: match[4] };
	    }
	    if ((match = matchers.hex8.exec(color))) {
	        return {
	            r: parseIntFromHex(match[1]),
	            g: parseIntFromHex(match[2]),
	            b: parseIntFromHex(match[3]),
	            a: convertHexToDecimal(match[4]),
	            format: named ? "name" : "hex8"
	        };
	    }
	    if ((match = matchers.hex6.exec(color))) {
	        return {
	            r: parseIntFromHex(match[1]),
	            g: parseIntFromHex(match[2]),
	            b: parseIntFromHex(match[3]),
	            format: named ? "name" : "hex"
	        };
	    }
	    if ((match = matchers.hex4.exec(color))) {
	        return {
	            r: parseIntFromHex(match[1] + '' + match[1]),
	            g: parseIntFromHex(match[2] + '' + match[2]),
	            b: parseIntFromHex(match[3] + '' + match[3]),
	            a: convertHexToDecimal(match[4] + '' + match[4]),
	            format: named ? "name" : "hex8"
	        };
	    }
	    if ((match = matchers.hex3.exec(color))) {
	        return {
	            r: parseIntFromHex(match[1] + '' + match[1]),
	            g: parseIntFromHex(match[2] + '' + match[2]),
	            b: parseIntFromHex(match[3] + '' + match[3]),
	            format: named ? "name" : "hex"
	        };
	    }

	    return false;
	}

	function validateWCAG2Parms(parms) {
	    // return valid WCAG2 parms for isReadable.
	    // If input parms are invalid, return {"level":"AA", "size":"small"}
	    var level, size;
	    parms = parms || {"level":"AA", "size":"small"};
	    level = (parms.level || "AA").toUpperCase();
	    size = (parms.size || "small").toLowerCase();
	    if (level !== "AA" && level !== "AAA") {
	        level = "AA";
	    }
	    if (size !== "small" && size !== "large") {
	        size = "small";
	    }
	    return {"level":level, "size":size};
	}

	// Node: Export function
	if ( module.exports) {
	    module.exports = tinycolor;
	}
	// AMD/requirejs: Define the module
	else {
	    window.tinycolor = tinycolor;
	}

	})(Math);
	});

	// yy-counter
	// In-browser counter to watch changeable values like counters or FPS
	// David Figatner
	// (c) YOPEY YOPEY LLC 2017
	// MIT License
	// https://github.com/davidfig/counter

	var counter = class Counter
	{
	    /**
	     * @param {object} [options]
	     * @param {string} [options.side=rightbottom] side to place the panel (combination of right/left and bottom/top)
	     * @param {number} [options.padding=7px]
	     * @param {string} [options.color=white]
	     * @param {string} [options.background=rgba(0,0,0,0.5)]
	     * @param {*} {options.xxx} where xxx is a CSS style for the div
	     */
	    constructor(options)
	    {
	        options = options || {};
	        options.side = options.side || 'rightbottom';
	        options.side.toLowerCase();
	        options.padding = options.padding || '7px';
	        options.color = options.color || 'white';
	        options.background = options.background || 'rgba(0,0,0,0.5)';
	        this.div = document.createElement('div');
	        Counter.findParent(options.side).appendChild(this.div);
	        for (let style in options)
	        {
	            if (style !== 'parent' && style !== 'side')
	            {
	                this.div.style[style] = options[style];
	            }
	        }
	    }

	    /**
	     * find the parent div for one of the corners
	     * @param {string} [options.side] side to place the panel (combination of right/left and bottom/top)
	     * @return {HTMLElement}
	     */
	    static findParent(side)
	    {
	        const styles = [];
	        let name = 'yy-counter-';
	        if (side.indexOf('left') !== -1)
	        {
	            name += 'left-';
	            styles['left'] = 0;
	        }
	        else
	        {
	            name += 'right-';
	            styles['right'] = 0;
	        }
	        if (side.indexOf('top') !== -1)
	        {
	            name += 'top';
	            styles['top'] = 0;
	        }
	        else
	        {
	            name += 'bottom';
	            styles['bottom'] = 0;
	        }
	        const test = document.getElementById(name);
	        if (test)
	        {
	            return test
	        }
	        const container = document.createElement('div');
	        container.id = name;
	        container.style.overflow = 'hidden';
	        container.style.position = 'fixed';
	        container.style.zIndex = 10000;
	        container.style.pointerEvents = 'none';
	        container.style.userSelect = 'none';
	        for (let style in styles)
	        {
	            container.style[style] = styles[style];
	        }
	        document.body.appendChild(container);
	        return container
	    }

	    /**
	     * replaces the innerHTML of the console
	     * @param {string|number} text1
	     * @param {string|number} [text2]
	     * @param {string|number} [...textn] any number of arguments
	     */
	    log()
	    {
	        let s = '';
	        for (let arg of arguments)
	        {
	            s += '<div>' + arg + '</div>';
	        }
	        this.div.innerHTML =  s;
	    }

	    /**
	     * appends to the innerHTML of the console
	     * @param {string|number} text1
	     * @param {string|number} [text2]
	     * @param {string|number} [...textn] any number of arguments
	     */
	    append()
	    {
	        let s = this.div.innerHTML;
	        for (let arg of arguments)
	        {
	            s += '<div>' + arg + '</div>';
	        }
	        this.div.innerHTML = s;
	    }
	};

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }




	var STYLES = {
	    'background': 'rgba(0, 0, 0, 0.5)',
	    'color': 'white'
	};

	var STYLES_FPS = {
	    'padding': '0.1em 0.5em'
	};

	var STYLES_METER = {};

	var yyFps = function () {
	    /**
	     * @param {object} [options]
	     * @param {boolean} [options.meter=true] include a meter with the FPS
	     * @param {string} [options.side=bottom-right] include any combination of left/right and top/bottom
	     * @param {number} [options.FPS=60] desired FPS
	     * @param {number} [options.tolerance=1] minimum tolerance for fluctuations in FPS number
	     * @param {number} [options.meterWidth=100] width of meter div
	     * @param {number} [options.meterHeight=25] height of meter div
	     * @param {number} [options.meterLineHeight=4] height of meter line
	     * @param {styles[]} [options.styles] CSS styles to apply to the div (in javascript format)
	     * @param {styles[]} [options.stylesFPS] CSS styles to apply to the FPS text (in javascript format)
	     * @param {styles[]} [options.stylesMeter] CSS styles to apply to the FPS meter (in javascript format)
	     * @param {string} [options.text=" FPS"] change the text to the right of the FPS
	     */
	    function FPS(options) {
	        _classCallCheck(this, FPS);

	        this.options = options || {};
	        this.tolerance = this.options.tolerance || 1;
	        this.FPS = this.options.FPS || 60;
	        this.meterWidth = this.options.meterWidth || 100;
	        this.meterHeight = this.options.meterHeight || 25;
	        this.meterLineHeight = this.options.meterLineHeight || 4;
	        this.div = document.createElement('div');
	        counter.findParent(this.options.side || 'bottom-right').appendChild(this.div);
	        this.style(this.div, STYLES, this.options.styles);
	        this.divFPS();
	        this.meter = typeof this.options.meter === 'undefined' || this.options.meter;
	        this.lastTime = 0;
	        this.frameNumber = 0;
	        this.lastUpdate = 0;
	        this.lastFPS = '--';
	    }

	    /**
	     * change desired FPS
	     * @type {number}
	     */


	    _createClass(FPS, [{
	        key: 'remove',


	        /**
	         * remove meter from DOM
	         */
	        value: function remove() {
	            this.div.remove();
	        }

	        /**
	         * @type {boolean} meter (the FPS graph) is on or off
	         */

	    }, {
	        key: 'style',
	        value: function style(div, style1, style2) {
	            for (var style in style1) {
	                div.style[style] = style1[style];
	            }
	            if (style2) {
	                for (var _style in style2) {
	                    div.style[_style] = style2[_style];
	                }
	            }
	        }

	        /**
	         * create div for text FPS
	         * @private
	         * @param {HTMLElement} div
	         * @param {object} options (see contructor)
	         */

	    }, {
	        key: 'divFPS',
	        value: function divFPS() {
	            var div = this.div;
	            var options = this.options;
	            var divFPS = document.createElement('div');
	            div.appendChild(divFPS);
	            this.fpsSpan = document.createElement('span');
	            divFPS.appendChild(this.fpsSpan);
	            var span = document.createElement('span');
	            divFPS.appendChild(span);
	            span.innerText = typeof options.text !== 'undefined' ? options.text : ' FPS';
	            this.style(div, STYLES_FPS, options.stylesFPS);
	        }

	        /**
	         * create div for FPS meter
	         * @private
	         * @param {HTMLElement} div
	         * @param {object} options (see contructor)
	         */

	    }, {
	        key: 'divMeter',
	        value: function divMeter() {
	            var div = this.div;
	            var options = this.options;
	            if (!this.meterCanvas) {
	                this.meterCanvas = document.createElement('canvas');
	                div.appendChild(this.meterCanvas);
	                this.meterCanvas.width = this.meterWidth;
	                this.meterCanvas.height = this.meterHeight;
	                this.meterCanvas.style.width = div.width + 'px';
	                this.meterCanvas.style.height = div.height + 'px';
	                this.style(this.meterCanvas, STYLES_METER, options.stylesMeter);
	            } else {
	                this.meterCanvas.style.display = 'block';
	            }
	        }

	        /**
	         * call this at the start of the frame to calculate FPS
	         */

	    }, {
	        key: 'frame',
	        value: function frame() {
	            this.frameNumber++;
	            var currentTime = performance.now() - this.lastTime;

	            // skip large differences to remove garbage
	            if (currentTime > 500) {
	                if (this.lastTime !== 0) {
	                    this.lastFPS = Math.floor(this.frameNumber / (currentTime / 1000));
	                    if (this.lastFPS >= this.FPS - this.tolerance && this.lastFPS <= this.FPS + this.tolerance) {
	                        this.lastFPS = this.FPS;
	                    }
	                }
	                this.lastTime = performance.now();
	                this.frameNumber = 0;
	            }
	            this.fpsSpan.innerText = this.lastFPS;
	            if (this.meterCanvas && this.lastFPS !== '--') {
	                this.meterUpdate(this.lastFPS / this.FPS);
	            }
	        }
	    }, {
	        key: 'meterUpdate',
	        value: function meterUpdate(percent) {
	            var c = this.meterCanvas.getContext('2d');
	            var data = c.getImageData(0, 0, this.meterCanvas.width, this.meterCanvas.height);
	            c.putImageData(data, -1, 0);
	            c.clearRect(this.meterCanvas.width - 1, 0, 1, this.meterCanvas.height);
	            if (percent < 0.5) {
	                c.fillStyle = tinycolor.mix('#ff0000', '0xffa500', percent * 200).toHexString();
	            } else {
	                c.fillStyle = tinycolor.mix('#ffa500', '#00ff00', (percent - 0.5) * 200).toHexString();
	            }
	            var height = (this.meterCanvas.height - this.meterLineHeight) * (1 - percent);
	            c.fillRect(this.meterCanvas.width - 1, height, 1, this.meterLineHeight);
	        }
	    }, {
	        key: 'side',
	        value: function side(options) {
	            if (options.side) {
	                options.side = options.side.toLowerCase();
	                if (options.side.indexOf('left') !== -1) {
	                    STYLES['left'] = 0;
	                    delete STYLES['right'];
	                } else {
	                    STYLES['right'] = 0;
	                    delete STYLES['left'];
	                }
	                if (options.side.indexOf('top') !== -1) {
	                    STYLES['top'] = 0;
	                    delete STYLES['bottom'];
	                } else {
	                    STYLES['bottom'] = 0;
	                    delete STYLES['top'];
	                }
	            } else {
	                STYLES['right'] = 0;
	                STYLES['bottom'] = 0;
	            }
	        }
	    }, {
	        key: 'fps',
	        get: function get() {
	            return this.FPS;
	        },
	        set: function set(value) {
	            this.FPS = value;
	        }
	    }, {
	        key: 'meter',
	        get: function get() {
	            return this._meter;
	        },
	        set: function set(value) {
	            if (value) {
	                this.divMeter();
	            } else if (this.meterCanvas) {
	                this.meterCanvas.style.display = 'none';
	            }
	        }
	    }]);

	    return FPS;
	}();

	/**
	 * shortcut to create an html element
	 * @param {object} options
	 * @param {type} [options.string=div]
	 * @param {string} [options.className]
	 * @param {object} [options.styles]
	 * @param {HTMLElement} [options.parent]
	 * @param {string} [options.html]
	 * @returns {HTMLElement}
	 */
	function html(options={})
	{
	    const object = document.createElement(options.type || 'div');
	    if (options.parent)
	    {
	        options.parent.appendChild(object);
	    }
	    if (options.styles)
	    {
	        Object.assign(object.style, options.styles);
	    }
	    if (options.className)
	    {
	        object.className = options.className;
	    }
	    if (options.html)
	    {
	        object.innerHTML = options.html;
	    }
	    return object
	}

	var eventemitter3 = createCommonjsModule(function (module) {

	var has = Object.prototype.hasOwnProperty
	  , prefix = '~';

	/**
	 * Constructor to create a storage for our `EE` objects.
	 * An `Events` instance is a plain object whose properties are event names.
	 *
	 * @constructor
	 * @private
	 */
	function Events() {}

	//
	// We try to not inherit from `Object.prototype`. In some engines creating an
	// instance in this way is faster than calling `Object.create(null)` directly.
	// If `Object.create(null)` is not supported we prefix the event names with a
	// character to make sure that the built-in object properties are not
	// overridden or used as an attack vector.
	//
	if (Object.create) {
	  Events.prototype = Object.create(null);

	  //
	  // This hack is needed because the `__proto__` property is still inherited in
	  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
	  //
	  if (!new Events().__proto__) prefix = false;
	}

	/**
	 * Representation of a single event listener.
	 *
	 * @param {Function} fn The listener function.
	 * @param {*} context The context to invoke the listener with.
	 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
	 * @constructor
	 * @private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	/**
	 * Add a listener for a given event.
	 *
	 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} context The context to invoke the listener with.
	 * @param {Boolean} once Specify if the listener is a one-time listener.
	 * @returns {EventEmitter}
	 * @private
	 */
	function addListener(emitter, event, fn, context, once) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('The listener must be a function');
	  }

	  var listener = new EE(fn, context || emitter, once)
	    , evt = prefix ? prefix + event : event;

	  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
	  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
	  else emitter._events[evt] = [emitter._events[evt], listener];

	  return emitter;
	}

	/**
	 * Clear event by name.
	 *
	 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	 * @param {(String|Symbol)} evt The Event name.
	 * @private
	 */
	function clearEvent(emitter, evt) {
	  if (--emitter._eventsCount === 0) emitter._events = new Events();
	  else delete emitter._events[evt];
	}

	/**
	 * Minimal `EventEmitter` interface that is molded against the Node.js
	 * `EventEmitter` interface.
	 *
	 * @constructor
	 * @public
	 */
	function EventEmitter() {
	  this._events = new Events();
	  this._eventsCount = 0;
	}

	/**
	 * Return an array listing the events for which the emitter has registered
	 * listeners.
	 *
	 * @returns {Array}
	 * @public
	 */
	EventEmitter.prototype.eventNames = function eventNames() {
	  var names = []
	    , events
	    , name;

	  if (this._eventsCount === 0) return names;

	  for (name in (events = this._events)) {
	    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
	  }

	  if (Object.getOwnPropertySymbols) {
	    return names.concat(Object.getOwnPropertySymbols(events));
	  }

	  return names;
	};

	/**
	 * Return the listeners registered for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Array} The registered listeners.
	 * @public
	 */
	EventEmitter.prototype.listeners = function listeners(event) {
	  var evt = prefix ? prefix + event : event
	    , handlers = this._events[evt];

	  if (!handlers) return [];
	  if (handlers.fn) return [handlers.fn];

	  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
	    ee[i] = handlers[i].fn;
	  }

	  return ee;
	};

	/**
	 * Return the number of listeners listening to a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Number} The number of listeners.
	 * @public
	 */
	EventEmitter.prototype.listenerCount = function listenerCount(event) {
	  var evt = prefix ? prefix + event : event
	    , listeners = this._events[evt];

	  if (!listeners) return 0;
	  if (listeners.fn) return 1;
	  return listeners.length;
	};

	/**
	 * Calls each of the listeners registered for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Boolean} `true` if the event had listeners, else `false`.
	 * @public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return false;

	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;

	  if (listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	/**
	 * Add a listener for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  return addListener(this, event, fn, context, false);
	};

	/**
	 * Add a one-time listener for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  return addListener(this, event, fn, context, true);
	};

	/**
	 * Remove the listeners of a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn Only remove the listeners that match this function.
	 * @param {*} context Only remove the listeners that have this context.
	 * @param {Boolean} once Only remove one-time listeners.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return this;
	  if (!fn) {
	    clearEvent(this, evt);
	    return this;
	  }

	  var listeners = this._events[evt];

	  if (listeners.fn) {
	    if (
	      listeners.fn === fn &&
	      (!once || listeners.once) &&
	      (!context || listeners.context === context)
	    ) {
	      clearEvent(this, evt);
	    }
	  } else {
	    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
	      if (
	        listeners[i].fn !== fn ||
	        (once && !listeners[i].once) ||
	        (context && listeners[i].context !== context)
	      ) {
	        events.push(listeners[i]);
	      }
	    }

	    //
	    // Reset the array, or remove it completely if we have no more listeners.
	    //
	    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
	    else clearEvent(this, evt);
	  }

	  return this;
	};

	/**
	 * Remove all listeners, or those of the specified event.
	 *
	 * @param {(String|Symbol)} [event] The event name.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  var evt;

	  if (event) {
	    evt = prefix ? prefix + event : event;
	    if (this._events[evt]) clearEvent(this, evt);
	  } else {
	    this._events = new Events();
	    this._eventsCount = 0;
	  }

	  return this;
	};

	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	//
	// Expose the prefix.
	//
	EventEmitter.prefixed = prefix;

	//
	// Allow `EventEmitter` to be imported as module namespace.
	//
	EventEmitter.EventEmitter = EventEmitter;

	//
	// Expose the module.
	//
	{
	  module.exports = EventEmitter;
	}
	});

	/**
	 * Watcher for click, double-click, or long-click event for both mouse and touch
	 * @example
	 * import { clicked } from 'clicked'
	 *
	 * function handleClick()
	 * {
	 *    console.log('I was clicked.')
	 * }
	 *
	 * const div = document.getElementById('clickme')
	 * const c = clicked(div, handleClick, { threshold: 15 })
	 *
	 * // change callback
	 * c.callback = () => console.log('different clicker')
	 *
	 * // destroy
	 * c.destroy()
	 *
	 * // using built-in querySelector
	 * clicked('#clickme', handleClick2)
	 *
	 * // watching for all types of clicks
	 * function handleAllClicks(e) {
	 *     switch (e.type)
	 *     {
	 *         case 'clicked': ...
	 *         case 'double-clicked': ...
	 *         case 'long-clicked': ...
	 *     }
	 *
	 *     // view UIEvent that caused callback
	 *     console.log(e.event)
	 * }
	 * clicked('#clickme', handleAllClicks, { doubleClicked: true, longClicked: true })
	 */

	/** @type {object} */
	const defaultOptions = {
	    threshold: 10,
	    clicked: true,
	    doubleClicked: false,
	    doubleClickedTime: 300,
	    longClicked: false,
	    longClickedTime: 500,
	    capture: false,
	    clickDown: false
	};

	/**
	 * @param {HTMLElement|string} element or querySelector entry (e.g., #id-name or .class-name)
	 * @param {ClickedCallback} callback called after a click, double click, or long click is registered
	 * @param {object} [options]
	 * @param {number} [options.threshold=10] if touch moves threshhold-pixels then the touch-click is cancelled
	 * @param {boolean} [options.clicked=true] disable watcher for default clicked event
	 * @param {boolean} [options.doubleClicked] enable watcher for double click
	 * @param {number} [options.doubleClickedTime=500] wait time in millseconds for double click
	 * @param {boolean} [options.longClicked] enable watcher for long click
	 * @param {number} [options.longClickedTime=500] wait time for long click
	 * @param {boolean} [options.clickDown] enable watcher for click start
	 * @param {boolean} [options.capture]  events will be dispatched to this registered listener before being dispatched to any EventTarget beneath it in the DOM tree
	 * @returns {Clicked}
	 */
	function clicked(element, callback, options)
	{
	    return new Clicked(element, callback, options)
	}

	class Clicked
	{
	    constructor(element, callback, options)
	    {
	        if (typeof element === 'string')
	        {
	            element = document.querySelector(element);
	            if (!element)
	            {
	                console.warn(`Unknown element: document.querySelector(${element}) in clicked()`);
	                return
	            }
	        }
	        this.options = Object.assign({}, defaultOptions, options);
	        this.events = {
	            mousedown: (e) => this.mousedown(e),
	            mouseup: (e) => this.mouseup(e),
	            mousemove: (e) => this.mousemove(e),
	            touchstart: (e) => this.touchstart(e),
	            touchmove: (e) => this.touchmove(e),
	            touchcancel: (e) => this.cancel(e),
	            touchend: (e) => this.touchend(e)
	        };
	        element.addEventListener('mousedown', this.events.mousedown, { capture: this.options.capture });
	        element.addEventListener('mouseup', this.events.mouseup, { capture: this.options.capture });
	        element.addEventListener('mousemove', this.events.mousemove, { capture: this.options.capture });
	        element.addEventListener('touchstart', this.events.touchstart, { passive: true, capture: this.options.capture });
	        element.addEventListener('touchmove', this.events.touchmove, { passive: true, capture: this.options.capture });
	        element.addEventListener('touchcancel', this.events.touchcancel, { capture: this.options.capture});
	        element.addEventListener('touchend', this.events.touchend, { capture: this.options.capture });
	        this.element = element;
	        this.callback = callback;
	    }

	    /**
	     * removes event listeners added by Clicked
	     */
	    destroy()
	    {
	        this.element.removeEventListener('mousedown', this.events.mousedown);
	        this.element.removeEventListener('mouseup', this.events.mouseup);
	        this.element.removeEventListener('mousemove', this.events.mousemove);
	        this.element.removeEventListener('touchstart', this.events.touchstart, { passive: true });
	        this.element.removeEventListener('touchmove', this.events.touchmove, { passive: true });
	        this.element.removeEventListener('touchcancel', this.events.touchcancel);
	        this.element.removeEventListener('touchend', this.events.touchend);
	    }

	    touchstart(e)
	    {
	        if (this.down === true)
	        {
	            this.cancel();
	        }
	        else
	        {
	            if (e.touches.length === 1)
	            {
	                this.handleDown(e.changedTouches[0].screenX, e.changedTouches[0].screenY);
	            }
	        }
	    }

	    pastThreshold(x, y)
	    {
	        return Math.abs(this.lastX - x) > this.options.threshold || Math.abs(this.lastY - y) > this.options.threshold
	    }

	    touchmove(e)
	    {
	        if (this.down)
	        {
	            if (e.touches.length !== 1)
	            {
	                this.cancel();
	            }
	            else
	            {
	                const x = e.changedTouches[0].screenX;
	                const y = e.changedTouches[0].screenY;
	                if (this.pastThreshold(x, y))
	                {
	                    this.cancel();
	                }
	            }
	        }
	    }

	    /** cancel current event */
	    cancel()
	    {
	        this.down = false;
	        if (this.doubleClickedTimeout)
	        {
	            clearTimeout(this.doubleClickedTimeout);
	            this.doubleClickedTimeout = null;
	        }
	        if (this.longClickedTimeout)
	        {
	            clearTimeout(this.longClickedTimeout);
	            this.longClickedTimeout = null;
	        }
	    }

	    touchend(e)
	    {
	        if (this.down)
	        {
	            e.preventDefault();
	            this.handleClicks(e, e.pointerId);
	        }
	    }

	    handleClicks(e)
	    {
	        if (this.options.doubleClicked)
	        {
	            this.doubleClickedTimeout = setTimeout(() => this.doubleClickedCancel(e), this.options.doubleClickedTime);
	        }
	        else if (this.options.clicked)
	        {
	            this.callback({ event: e, type: 'clicked' });
	        }
	        if (this.longClickedTimeout)
	        {
	            clearTimeout(this.longClickedTimeout);
	            this.longClickedTimeout = null;
	        }
	        this.down = false;
	    }

	    handleDown(e, x, y)
	    {
	        if (this.doubleClickedTimeout)
	        {
	            if (this.pastThreshold(x, y))
	            {
	                if (this.options.clicked)
	                {
	                    this.callback({ event: e, type: 'clicked' });
	                }
	                this.cancel();
	            }
	            else
	            {
	                this.callback({ event: e, type: 'double-clicked' });
	                this.cancel();
	            }
	        }
	        else
	        {
	            this.lastX = x;
	            this.lastY = y;
	            this.down = true;
	            if (this.options.longClicked)
	            {
	                this.longClickedTimeout = setTimeout(() => this.longClicked(e), this.options.longClickedTime);
	            }
	            if (this.options.clickDown) {
	                this.callback({ event: e, type: 'click-down' });
	            }
	        }
	    }

	    longClicked(e)
	    {
	        this.longClikedTimeout = null;
	        this.down = false;
	        this.callback({ event: e, type: 'long-clicked' });
	    }

	    doubleClickedCancel(e)
	    {
	        this.doubleClickedTimeout = null;
	        if (this.options.clicked)
	        {
	            this.callback({ event: e, type: 'double-clicked' });
	        }
	    }

	    mousedown(e)
	    {
	        if (this.down === true)
	        {
	            this.down = false;
	        }
	        else
	        {
	            this.handleDown(e, e.screenX, e.screenY);
	        }
	    }

	    mousemove(e)
	    {
	        if (this.down)
	        {
	            const x = e.screenX;
	            const y = e.screenY;
	            if (this.pastThreshold(x, y))
	            {
	                this.cancel();
	            }
	        }
	    }

	    mouseup(e)
	    {
	        if (this.down)
	        {
	            e.preventDefault();
	            this.handleClicks(e);
	        }
	    }
	}

	/**
	 * Callback for
	 * @callback Clicked~ClickedCallback
	 * @param {UIEvent} event
	 * @param {('clicked'|'double-clicked'|'long-clicked'|'click-down')} type
	 */

	/**
	 * Window class returned by WindowManager.createWindow()
	 * @extends EventEmitter
	 * @fires open
	 * @fires focus
	 * @fires blur
	 * @fires close
	 * @fires maximize
	 * @fires maximize-restore
	 * @fires move
	 * @fires move-start
	 * @fires move-end
	 * @fires resize
	 * @fires resize-start
	 * @fires resize-end
	 * @fires move-x
	 * @fires move-y
	 * @fires resize-width
	 * @fires resize-height
	 */
	class Window extends eventemitter3
	{
	    /**
	     * @param {WindowManager} [wm]
	     * @param {object} [options]
	     */
	    constructor(wm, options={})
	    {
	        super();
	        this.wm = wm;
	        this.options = options;
	        this.id = typeof this.options.id === 'undefined' ? Window.id++ : this.options.id;
	        this._createWindow();
	        this._listeners();

	        this.active = false;
	        this.maximized = false;

	        this._closed = true;
	        this._restore = null;
	        this._moving = null;
	        this._resizing = null;
	        this._attachedToScreen = { vertical: '', horziontal: '' };
	    }

	    /**
	     * open the window
	     * @param {boolean} [noFocus] do not focus window when opened
	     */
	    open(noFocus)
	    {
	        if (this._closed)
	        {
	            this.win.style.display = 'block';
	            this._closed = false;
	            this.emit('open', this);
	            if (!noFocus)
	            {
	                this.focus();
	            }
	        }
	    }

	    /**
	     * focus the window
	     */
	    focus()
	    {
	        this.active = true;
	        if (this.options.titlebar)
	        {
	            this.winTitlebar.style.backgroundColor = this.options.backgroundTitlebarActive;
	        }
	        this.emit('focus', this);
	    }

	    /**
	     * blur the window
	     */
	    blur()
	    {
	        this.active = false;
	        if (this.options.titlebar)
	        {
	            this.winTitlebar.style.backgroundColor = this.options.backgroundTitlebarInactive;
	        }
	        this.emit('blur', this);
	    }

	    /**
	     * closes the window (can be reopened with open)
	     */
	    close()
	    {
	        if (!this._closed)
	        {
	            this._closed = true;
	            this.win.style.display = 'none';
	            this.emit('close', this);
	        }
	    }

	    /**
	     * is window closed?
	     * @type {boolean}
	     * @readonly
	     */
	    get closed()
	    {
	        return this._closed
	    }

	    /**
	     * left coordinate
	     * @type {number}
	     */
	    get x() { return this.options.x }
	    set x(value)
	    {
	        if (value !== this.options.x)
	        {
	            this.options.x = value;
	            this.emit('move-x', this);
	            this._buildTransform();
	        }
	    }

	    _buildTransform()
	    {
	        this.win.style.transform = `translate(${this.options.x}px,${this.options.y}px)`;
	    }

	    /**
	     * top coordinate
	     * @type {number}
	     */
	    get y() { return this.options.y }
	    set y(value)
	    {
	        if (value !== this.options.y)
	        {
	            this.options.y = value;
	            this._buildTransform();
	            this.emit('move-y', this);
	        }
	    }

	    /**
	     * width of window
	     * @type {number}
	     */
	    get width() { return this.options.width || this.win.offsetWidth }
	    set width(value)
	    {
	        if (value !== this.options.width)
	        {
	            if (value)
	            {
	                this.win.style.width = `${value}px`;
	                this.options.width = this.win.offsetWidth;
	            }
	            else
	            {
	                this.win.style.width = 'auto';
	                this.options.width = '';
	            }
	            this.emit('resize-width', this);
	        }
	    }

	    /**
	     * height of window
	     * @type {number}
	     */
	    get height() { return this.options.height || this.win.offsetHeight }
	    set height(value)
	    {
	        if (value !== this.options.height)
	        {
	            if (value)
	            {
	                this.win.style.height = `${value}px`;
	                this.options.height = this.win.offsetHeight;
	            }
	            else
	            {
	                this.win.style.height = 'auto';
	                this.options.height = '';
	            }
	            this.emit('resize-height', this);
	        }
	    }

	    /**
	     * resize the window
	     * @param {number} width
	     * @param {number} height
	     */
	    resize(width, height)
	    {
	        this.width = width;
	        this.height = height;
	    }

	    /**
	     * move window
	     * @param {number} x
	     * @param {number} y
	     */
	    move(x, y)
	    {
	        const keepInside = this.keepInside;
	        if (keepInside)
	        {
	            const bounds = this.bounds;
	            if (keepInside === true || keepInside === 'horizontal')
	            {
	                x = x + this.width > bounds.right ? bounds.right - this.width : x;
	                x = x < bounds.left ? bounds.left : x;
	            }
	            if (keepInside === true || keepInside === 'vertical')
	            {
	                y = y + this.height > bounds.bottom ? bounds.bottom - this.height : y;
	                y = y < bounds.top ? bounds.top : y;
	            }
	        }
	        if (x !== this.options.x)
	        {
	            this.options.x = x;
	            this.emit('move-x', this);
	        }
	        if (y !== this.options.y)
	        {
	            this.options.y = y;
	            this.emit('move-y', this);
	        }
	        this._buildTransform();
	    }

	    /**
	     * maximize the window
	     */
	    maximize()
	    {
	        if (this.options.maximizable)
	        {
	            if (this.maximized)
	            {
	                this.x = this.maximized.x;
	                this.y = this.maximized.y;
	                this.width = this.maximized.width;
	                this.height = this.maximized.height;
	                this.maximized = null;
	                this.emit('restore', this);
	                this.buttons.maximize.innerHTML = this.options.maximizeButton;
	            }
	            else
	            {
	                const x = this.x, y = this.y, width = this.win.offsetWidth, height = this.win.offsetHeight;
	                this.maximized = { x, y, width, height };
	                this.x = 0;
	                this.y = 0;
	                this.width = this.wm.overlay.offsetWidth;
	                this.height = this.wm.overlay.offsetHeight;
	                this.emit('maximize', this);
	                this.buttons.maximize.innerHTML = this.options.restoreButton;
	            }
	        }
	    }

	    /**
	     * sends window to back of window-manager
	     */
	    sendToBack()
	    {
	        this.wm.sendToBack(this);
	    }

	    /**
	     * send window to front of window-manager
	     */
	    sendToFront()
	    {
	        this.wm.sendToFront(this);
	    }

	    /**
	     * save the state of the window
	     * @return {object} data
	     */
	    save()
	    {
	        const data = {};
	        const maximized = this.maximized;
	        if (maximized)
	        {
	            data.maximized = { left: maximized.left, top: maximized.top, width: maximized.width, height: maximized.height };
	        }
	        data.x = this.x;
	        data.y = this.y;
	        if (typeof this.options.width !== 'undefined')
	        {
	            data.width = this.options.width;
	        }
	        if (typeof this.options.height !== 'undefined')
	        {
	            data.height = this.options.height;
	        }
	        data.closed = this._closed;
	        return data
	    }

	    /**
	     * return the state of the window
	     * @param {object} data from save()
	     */
	    load(data)
	    {
	        if (data.maximized)
	        {
	            if (!this.maximized)
	            {
	                this.maximize(true);
	            }
	        }
	        else if (this.maximized)
	        {
	            this.maximize(true);
	        }
	        this.x = data.x;
	        this.y = data.y;
	        if (typeof data.width !== 'undefined')
	        {
	            this.width = data.width;
	        }
	        else
	        {
	            this.win.style.width = 'auto';
	        }
	        if (typeof data.height !== 'undefined')
	        {
	            this.height = data.height;
	        }
	        else
	        {
	            this.win.style.height = 'auto';
	        }
	        if (data.closed)
	        {
	            this.close(true);
	        }
	        else if (this.closed)
	        {
	            this.open(true, true);
	        }
	    }

	    /**
	     * change title
	     * @type {string}
	     */
	    get title() { return this._title }
	    set title(value)
	    {
	        this.winTitle.innerText = value;
	        this.emit('title-change', this);
	    }


	    /**
	     * right coordinate of window
	     * @type {number}
	     */
	    get right() { return this.x + this.width }
	    set right(value)
	    {
	        this.x = value - this.width;
	    }

	    /**
	     * bottom coordinate of window
	     * @type {number}
	     */
	    get bottom() { return this.y + this.height }
	    set bottom(value)
	    {
	        this.y = value - this.height;
	    }

	    /**
	     * centers window in middle of other window or document.body
	     * @param {Window} [win]
	     */
	    center(win)
	    {
	        if (win)
	        {
	            this.move(
	                win.x + win.width / 2 - this.width / 2,
	                win.y + win.height / 2 - this.height / 2
	            );
	        }
	        else
	        {
	            this.move(
	                window.innerWidth / 2 - this.width / 2,
	                window.innerHeight / 2 - this.height / 2
	            );
	        }
	    }

	    /**
	     * Fires when window is maximized
	     * @event Window#maximize
	     * @type {Window}
	     */

	    /**
	     * Fires when window is restored to normal after being maximized
	     * @event Window#maximize-restore
	     * @type {Window}
	     */

	    /**
	     * Fires when window opens
	     * @event Window#open
	     * @type {Window}
	     */

	    /**
	     * Fires when window gains focus
	     * @event Window#focus
	     * @type {Window}
	     */
	    /**
	     * Fires when window loses focus
	     * @event Window#blur
	     * @type {Window}
	     */
	    /**
	     * Fires when window closes
	     * @event Window#close
	     * @type {Window}
	     */

	    /**
	     * Fires when resize starts
	     * @event Window#resize-start
	     * @type {Window}
	     */

	    /**
	     * Fires after resize completes
	     * @event Window#resize-end
	     * @type {Window}
	     */

	    /**
	     * Fires during resizing
	     * @event Window#resize
	     * @type {Window}
	     */

	    /**
	     * Fires when move starts
	     * @event Window#move-start
	     * @type {Window}
	     */

	    /**
	     * Fires after move completes
	     * @event Window#move-end
	     * @type {Window}
	     */

	    /**
	     * Fires during move
	     * @event Window#move
	     * @type {Window}
	     */

	    /**
	     * Fires when width is changed
	     * @event Window#resize-width
	     * @type {Window}
	     */

	    /**
	     * Fires when height is changed
	     * @event Window#resize-height
	     * @type {Window}
	     */

	    /**
	     * Fires when x position of window is changed
	     * @event Window#move-x
	     * @type {Window}
	     */


	    /**
	     * Fires when y position of window is changed
	     * @event Window#move-y
	     * @type {Window}
	     */

	    _createWindow()
	    {
	        /**
	         * This is the top-level DOM element
	         * @type {HTMLElement}
	         * @readonly
	         */
	        this.win = html({
	            parent: (this.wm ? this.wm.win : null), styles: {
	                'display': 'none',
	                'border-radius': this.options.borderRadius,
	                'user-select': 'none',
	                'overflow': 'hidden',
	                'position': 'absolute',
	                'min-width': this.options.minWidth,
	                'min-height': this.options.minHeight,
	                'box-shadow': this.options.shadow,
	                'background-color': this.options.backgroundWindow,
	                'width': isNaN(this.options.width) ? this.options.width : this.options.width + 'px',
	                'height': isNaN(this.options.height) ? this.options.height : this.options.height + 'px',
	                ...this.options.styles
	            },
	            className: this.options.classNames.win
	        });

	        this.winBox = html({
	            parent: this.win, styles: {
	                'display': 'flex',
	                'flex-direction': 'column',
	                'width': '100%',
	                'height': '100%',
	                'min-height': this.options.minHeight
	            },
	            className: this.options.classNames.winBox
	        });
	        this._createTitlebar();

	        /**
	         * This is the content DOM element. Use this to add content to the Window.
	         * @type {HTMLElement}
	         * @readonly
	         */
	        this.content = html({
	            parent: this.winBox, type: 'section', styles: {
	                'display': 'block',
	                'flex': 1,
	                'min-height': this.minHeight,
	                'overflow-x': 'hidden',
	                'overflow-y': 'auto'
	            },
	            className: this.options.classNames.content
	        });

	        if (this.options.resizable)
	        {
	            this._createResize();
	        }

	        this.overlay = html({
	            parent: this.win, styles: {
	                'display': 'none',
	                'position': 'absolute',
	                'left': 0,
	                'top': 0,
	                'width': '100%',
	                'height': '100%'
	            },
	            className: this.options.classNames.overlay
	        });
	        this.overlay.addEventListener('mousedown', (e) => { this._downTitlebar(e); e.stopPropagation(); });
	        this.overlay.addEventListener('touchstart', (e) => { this._downTitlebar(e); e.stopPropagation(); });
	        this._buildTransform();
	    }

	    _downTitlebar(e)
	    {
	        const event = this._convertMoveEvent(e);
	        this._moving = {
	            x: event.pageX - this.x,
	            y: event.pageY - this.y
	        };
	        this.emit('move-start', this);
	        this._moved = false;
	    }

	    _createTitlebar()
	    {
	        if (this.options.titlebar)
	        {
	            this.winTitlebar = html({
	                parent: this.winBox, type: 'header', styles: {
	                    'user-select': 'none',
	                    'display': 'flex',
	                    'flex-direction': 'row',
	                    'align-items': 'center',
	                    'justify-content': 'center',
	                    'height': this.options.titlebarHeight,
	                    'min-height': this.options.titlebarHeight,
	                    'border': 0,
	                    'padding': '0 8px',
	                    'overflow': 'hidden',
	                },
	                className: this.options.classNames.titlebar
	            });
	            const winTitleStyles = {
	                'user-select': 'none',
	                'flex': 1,
	                'display': 'flex',
	                'flex-direction': 'row',
	                'align-items': 'center',
	                'user-select': 'none',
	                'cursor': 'default',
	                'padding': 0,
	                'margin': 0,
	                'font-size': '16px',
	                'font-weight': 400,
	                'color': this.options.foregroundTitle
	            };
	            if (this.options.titleCenter)
	            {
	                winTitleStyles['justify-content'] = 'center';
	            }
	            else
	            {
	                winTitleStyles['padding-left'] = '8px';

	            }
	            this.winTitle = html({ parent: this.winTitlebar, type: 'span', html: this.options.title, styles: winTitleStyles, className: this.options.classNames.winTitle });
	            this._createButtons();

	            if (this.options.movable)
	            {
	                this.winTitlebar.addEventListener('mousedown', (e) => this._downTitlebar(e));
	                this.winTitlebar.addEventListener('touchstart', (e) => this._downTitlebar(e));
	            }
	            if (this.options.maximizable)
	            {
	                clicked(this.winTitlebar, () => this.maximize(), { doubleClicked: true, clicked: false});
	            }
	        }
	    }

	    _createButtons()
	    {
	        this.winButtonGroup = html({
	            parent: this.winTitlebar, styles: {
	                'display': 'flex',
	                'flex-direction': 'row',
	                'align-items': 'center',
	                'padding-left': '10px'
	            },
	            className: this.options.classNames.winButtonGroup
	        });
	        const button = {
	            'display': 'inline-block',
	            'border': 0,
	            'margin': 0,
	            'margin-left': '15px',
	            'padding': 0,
	            'width': '12px',
	            'height': '12px',
	            'background-color': 'transparent',
	            'background-size': 'cover',
	            'background-repeat': 'no-repeat',
	            'opacity': .7,
	            'color': this.options.foregroundButton,
	            'outline': 0
	        };
	        this.buttons = {};
	        if (this.options.maximizable)
	        {
	            this.buttons.maximize = html({ parent: this.winButtonGroup, html: this.options.maximizeButton, type: 'button', styles: button, className: this.options.maximize });
	            clicked(this.buttons.maximize, () => this.maximize());
	        }
	        if (this.options.closable)
	        {
	            this.buttons.close = html({ parent: this.winButtonGroup, html: this.options.closeButton, type: 'button', styles: button, className: this.options.close });
	            clicked(this.buttons.close, () => this.close());
	        }
	        for (let key in this.buttons)
	        {
	            const button = this.buttons[key];
	            button.addEventListener('mousemove', () =>
	            {
	                button.style.opacity = 1;
	            });
	            button.addEventListener('mouseout', () =>
	            {
	                button.style.opacity = 0.7;
	            });
	        }
	    }

	    _createResize()
	    {
	        this.resizeEdge = html({
	            parent: this.winBox, type: 'button', html: this.options.backgroundResize, styles: {
	                'position': 'absolute',
	                'bottom': 0,
	                'right': '4px',
	                'border': 0,
	                'margin': 0,
	                'padding': 0,
	                'cursor': 'se-resize',
	                'user-select': 'none',
	                'height': '15px',
	                'width': '10px',
	                'background': 'none'
	            },
	            className: this.options.classNames.resizeEdge
	        });
	        const down = (e) =>
	        {
	            const event = this._convertMoveEvent(e);
	            const width = this.width || this.win.offsetWidth;
	            const height = this.height || this.win.offsetHeight;
	            this._resizing = {
	                width: width - event.pageX,
	                height: height - event.pageY
	            };
	            this.emit('resize-start');
	            e.preventDefault();
	        };
	        this.resizeEdge.addEventListener('mousedown', down);
	        this.resizeEdge.addEventListener('touchstart', down);
	    }

	    _move(e)
	    {
	        const event = this._convertMoveEvent(e);

	        if (!this._isTouchEvent(e) && e.which !== 1)
	        {
	            this._moving && this._stopMove();
	            this._resizing && this._stopResize();
	        }
	        if (this._moving)
	        {
	            this.move(event.pageX - this._moving.x, event.pageY - this._moving.y);
	            this.emit('move', this);
	            e.preventDefault();
	        }

	        if (this._resizing)
	        {
	            this.resize(
	                event.pageX + this._resizing.width,
	                event.pageY + this._resizing.height
	            );
	            this.maximized = null;
	            this.emit('resize', this);
	            e.preventDefault();
	        }
	    }

	    _up()
	    {
	        if (this._moving)
	        {
	            this._stopMove();
	        }
	        this._resizing && this._stopResize();
	    }

	    _listeners()
	    {
	        this.win.addEventListener('mousedown', () => this.focus());
	        this.win.addEventListener('touchstart', () => this.focus());
	    }

	    _stopMove()
	    {
	        this._moving = null;
	        this.emit('move-end', this);
	    }

	    _stopResize()
	    {
	        this._restore = this._resizing = null;
	        this.emit('resize-end', this);
	    }

	    _isTouchEvent(e)
	    {
	        return !!window.TouchEvent && (e instanceof window.TouchEvent)
	    }

	    _convertMoveEvent(e)
	    {
	        return this._isTouchEvent(e) ? e.changedTouches[0] : e
	    }

	    /**
	     * attaches window to a side of the screen
	     * @param {('horizontal'|'vertical')} direction
	     * @param {('left'|'right'|'top'|'bottom')} location
	     */
	    attachToScreen(direction, location)
	    {
	        this._attachedToScreen[direction] = location;
	    }

	    /**
	     * @param {Bounds} bounds
	     * @param {(boolean|'horizontal'|'vertical')} keepInside
	     */
	    resize(bounds, keepInside)
	    {
	        this.bounds = bounds;
	        this.keepInside = keepInside;
	        let x = this.x;
	        let y = this.y;
	        x = this._attachedToScreen.horziontal === 'right' ? bounds.right - this.width : x;
	        x = this._attachedToScreen.horizontal === 'left' ? bounds.left : x;
	        y = this._attachedToScreen.vertical === 'bottom' ? bounds.bottom - this.height : y;
	        y = this._attachedToScreen.vertical === 'top' ? bounds.top : y;
	        this.move(x, y);
	    }

	    /**
	     * @param {boolean} [ignoreClosed]
	     * @returns {boolean}
	     */
	    isModal(ignoreClosed)
	    {
	        return (ignoreClosed || !this._closed) && this.options.modal
	    }

	    /** @returns {boolean} */
	    isClosed()
	    {
	        return this._closed
	    }

	    get z()
	    {
	        return parseInt(this.win.style.zIndex)
	    }
	    set z(value)
	    {
	        this.win.style.zIndex = value;
	    }
	}

	Window.id = 0;

	const close='<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><rect id="close" x="0" y="0" width="20" height="20" style="fill:none;"/><g><path d="M3.5,3.5l13,13" style="fill:none;stroke:#fff;stroke-width:3px;"/><path d="M16.5,3.5l-13,13" style="fill:none;stroke:#fff;stroke-width:3px;"/></g></svg>';const maximize='<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><rect id="maximize" x="0" y="0" width="20" height="20" style="fill:none;"/><rect x="2" y="2" width="16" height="16" style="fill:none;stroke:#fff;stroke-width:2px;"/><rect x="2" y="2" width="16" height="3.2" style="fill:#fff;"/></svg>';const resize='<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><rect id="resize" x="0" y="0" width="20" height="20" style="fill:none;"/><clipPath id="_clip1"><rect x="0" y="0" width="20" height="20"/></clipPath><g clip-path="url(#_clip1)"><rect x="0" y="16.8" width="20" height="3.2" style="fill:#fff;"/><path d="M17.737,3.595l-14.142,14.142l2.263,2.263l14.142,-14.142l-2.263,-2.263Z" style="fill:#fff;"/><path d="M16.8,0l0,20l3.2,0l0,-20l-3.2,0Z" style="fill:#fff;"/><path d="M7.099,18.4l11.301,-11.123l0,11.123l-11.301,0Z" style="fill:#fff;"/></g></svg>';const restore='<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg width="100%" height="100%" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:1.5;"><rect id="restore" x="0" y="0" width="20" height="20" style="fill:none;"/><g><rect x="7" y="2.5" width="10" height="10" style="fill:none;stroke:#fff;stroke-width:1.5px;"/><rect x="7" y="2.5" width="10" height="2" style="fill:#fff;"/></g><g><rect x="3" y="7.5" width="10" height="10" style="fill:none;stroke:#fff;stroke-width:1.5px;"/><g><rect x="3" y="7.5" width="10" height="2" style="fill:#fff;"/></g></g></svg>';

	/**
	 * @typedef {object} WindowOptions
	 * @property {number} [x=0]
	 * @property {number} [y=0]
	 * @property {number} [width]
	 * @property {number} [height]
	 * @property {boolean} [modal]
	 * @property {boolean} [openOnCreate=true]
	 * @property {boolean} [movable=true]
	 * @property {boolean} [resizable=true]
	 * @property {boolean} [maximizable=true]
	 * @property {boolean} [closable=true]
	 * @property {boolean} [noSnap] don't snap this window or use this window as a snap target
	 * @property {boolean} [titlebar=true]
	 * @property {string} [titlebarHeight=36px]
	 * @property {boolean} [titleCenter]
	 * @property {string} [minWidth=200px]
	 * @property {string} [minHeight=60px]
	 * @property {string} [borderRadius=4px]
	 * @property {object} [styles]
	 * @property {string} [shadow='0 0 12px 1px rgba(0, 0, 0, 0.6)']
	 * @property {number} [animateTime=250]
	 * @property {string} [backgroundModal=rgba(0,0,0,0.6)]
	 * @property {string} [backgroundWindow=#fefefe]
	 * @property {string} [backgroundTitlebarActive=#365d98]
	 * @property {string} [backgroundTitlebarInactive=#888888]
	 * @property {string} [foregroundButton=#ffffff]
	 * @property {string} [foregroundTitle=#ffffff]
	 * @property {string} [maximizeButton=...]
	 * @property {string} [closeButton=...]
	 * @property {string} [resize=...]
	 */
	const windowOptions = {
	    x: 0,
	    y: 0,
	    width: undefined,
	    height: undefined,
	    modal: false,
	    openOnCreate: true,

	    classNames: {},

	    minWidth: '200px',
	    minHeight: '60px',
	    borderRadius: 0,
	    styles: {},

	    shadow: 'none',
	    movable: true,
	    resizable: true,
	    maximizable: true,
	    closable: true,

	    titlebar: true,
	    titlebarHeight: '2rem',

	    backgroundModal: 'rgba(0, 0, 0, 0.6)',
	    backgroundWindow: '#fefefe',
	    backgroundTitlebarActive: '#365d98',
	    backgroundTitlebarInactive: '#888888',
	    foregroundButton: '#ffffff',
	    foregroundTitle: '#ffffff',

	    closeButton: close,
	    maximizeButton: maximize,
	    restoreButton: restore,

	    backgroundResize: resize
	};

	const DEFAULT_COLOR = '#a8f0f4';
	const DEFAULT_SIZE = 10;

	const SnapOptionsDefault = {
	    screen: true,
	    windows: true,
	    snap: 20,
	    color: DEFAULT_COLOR,
	    spacing: 5,
	    indicator: DEFAULT_SIZE
	};

	class Snap
	{
	    /**
	     * add edge snapping plugin
	     * @param {WindowManager} wm
	     * @param {object} [options]
	     * @param {boolean} [options.screen=true] snap to screen edges
	     * @param {boolean} [options.windows=true] snap to window edges
	     * @param {number} [options.snap=20] distance to edge in pixels before snapping and width/height of snap bars
	     * @param {string} [options.color=#a8f0f4] color for snap bars
	     * @param {number} [options.spacing=5] spacing distance between window and edges
	     * @param {number} [options.indicator=10] size in pixels of snapping indicator (the indicator is actually twice the size of what is shown)
	     */
	    constructor(wm, options={})
	    {
	        this.wm = wm;
	        this.options = Object.assign({}, SnapOptionsDefault, options);
	        this.highlights = html({ parent: this.wm.overlay, styles: { 'position': 'absolute' } });
	        this.horizontal = html({
	            parent: this.highlights, styles: {
	                display: 'none',
	                position: 'absolute',
	                height: `${this.options.indicator}px`,
	                borderRadius: `${this.options.indicator}px`,
	                backgroundColor: this.options.color
	            }
	        });
	        this.vertical = html({
	            parent: this.highlights, styles: {
	                display: 'none',
	                position: 'absolute',
	                width: `${this.options.indicator}px`,
	                borderRadius: `${this.options.indicator}px`,
	                backgroundColor: this.options.color
	            }
	        });
	        this.horizontal;
	        this.showing = [];
	    }

	    stop()
	    {
	        this.highlights.remove();
	        this.stopped = true;
	    }

	    addWindow(win)
	    {
	        win.on('move', () => this.move(win));
	        win.on('move-end', () => this.moveEnd(win));
	    }

	    screenMove(rect, horizontal, vertical)
	    {
	        const width = document.body.clientWidth;
	        const height = document.body.clientHeight;
	        if (rect.left - this.options.snap <= width && rect.right + this.options.snap >= 0)
	        {
	            if (Math.abs(rect.top - 0) <= this.options.snap)
	            {
	                horizontal.push({ distance: Math.abs(rect.top - 0), left: 0, width, top: 0, side: 'top', screen: true });
	            }
	            else if (Math.abs(rect.bottom - height) <= this.options.snap)
	            {
	                horizontal.push({ distance: Math.abs(rect.bottom - height), left: 0, width, top: height, side: 'bottom', screen: true });
	            }
	        }
	        if (rect.top - this.options.snap <= height && rect.bottom + this.options.snap >= 0)
	        {
	            if (Math.abs(rect.left - 0) <= this.options.snap)
	            {
	                vertical.push({ distance: Math.abs(rect.left - 0), top: 0, height, left: 0, side: 'left', screen: true });
	            }
	            else if (Math.abs(rect.right - width) <= this.options.snap)
	            {
	                vertical.push({ distance: Math.abs(rect.right - width), top: 0, height, left: width, side: 'right', screen: true });
	            }
	        }
	    }

	    windowsMove(original, rect, horizontal, vertical)
	    {
	        for (let win of this.wm.windows)
	        {
	            if (!win.options.noSnap && win !== original)
	            {
	                const rect2 = win.win.getBoundingClientRect();
	                if (rect.left - this.options.snap <= rect2.right && rect.right + this.options.snap >= rect2.left)
	                {
	                    if (Math.abs(rect.top - rect2.bottom) <= this.options.snap)
	                    {
	                        horizontal.push({ distance: Math.abs(rect.top - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'top' });
	                        if (Math.abs(rect.left - rect2.left) <= this.options.snap)
	                        {
	                            vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true });
	                        }
	                        else if (Math.abs(rect.right - rect2.right) <= this.options.snap)
	                        {
	                            vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true });
	                        }
	                    }
	                    else if (Math.abs(rect.bottom - rect2.top) <= this.options.snap)
	                    {
	                        horizontal.push({ distance: Math.abs(rect.bottom - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'bottom' });
	                        if (Math.abs(rect.left - rect2.left) <= this.options.snap)
	                        {
	                            vertical.push({ distance: Math.abs(rect.left - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'left', noSpacing: true });
	                        }
	                        else if (Math.abs(rect.right - rect2.right) <= this.options.snap)
	                        {
	                            vertical.push({ distance: Math.abs(rect.right - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'right', noSpacing: true });
	                        }
	                    }
	                }
	                if (rect.top - this.options.snap <= rect2.bottom && rect.bottom + this.options.snap >= rect2.top)
	                {
	                    if (Math.abs(rect.left - rect2.right) <= this.options.snap)
	                    {
	                        vertical.push({ distance: Math.abs(rect.left - rect2.right), top: rect2.top, height: rect2.height, left: rect2.right, side: 'left' });
	                        if (Math.abs(rect.top - rect2.top) <= this.options.snap)
	                        {
	                            horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true });
	                        }
	                        else if (Math.abs(rect.bottom - rect2.bottom) <= this.options.snap)
	                        {
	                            horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true });
	                        }
	                    }
	                    else if (Math.abs(rect.right - rect2.left) <= this.options.snap)
	                    {
	                        vertical.push({ distance: Math.abs(rect.right - rect2.left), top: rect2.top, height: rect2.height, left: rect2.left, side: 'right' });
	                        if (Math.abs(rect.top - rect2.top) <= this.options.snap)
	                        {
	                            horizontal.push({ distance: Math.abs(rect.top - rect2.top), left: rect2.left, width: rect2.width, top: rect2.top, side: 'top', noSpacing: true });
	                        }
	                        else if (Math.abs(rect.bottom - rect2.bottom) <= this.options.snap)
	                        {
	                            horizontal.push({ distance: Math.abs(rect.bottom - rect2.bottom), left: rect2.left, width: rect2.width, top: rect2.bottom, side: 'bottom', noSpacing: true });
	                        }
	                    }
	                }
	            }
	        }
	    }

	    move(win)
	    {
	        if (this.stopped || win.options.noSnap || win.isModal())
	        {
	            return
	        }
	        this.horizontal.style.display = 'none';
	        this.vertical.style.display = 'none';
	        const horizontal = [];
	        const vertical = [];
	        const rect = win.win.getBoundingClientRect();
	        if (this.options.screen)
	        {
	            this.screenMove(rect, horizontal, vertical);
	        }
	        if (this.options.windows)
	        {
	            this.windowsMove(win, rect, horizontal, vertical);
	        }
	        if (horizontal.length)
	        {
	            horizontal.sort((a, b) => { return a.distance - b.distance });
	            const find = horizontal[0];
	            this.horizontal.style.display = 'block';
	            this.horizontal.style.width = find.width + 'px';
	            this.horizontal.y = find.top - this.options.indicator / 2;
	            this.horizontal.style.transform = `translate(${find.left}px,${this.horizontal.y}px)`;
	            this.horizontal.side = find.side;
	            this.horizontal.noSpacing = find.noSpacing;
	            this.horizontal.screen = find.screen;
	        }
	        if (vertical.length)
	        {
	            vertical.sort((a, b) => { return a.distance - b.distance });
	            const find = vertical[0];
	            this.vertical.style.display  = 'block';
	            this.vertical.style.height = find.height + 'px';
	            this.vertical.x = find.left - this.options.indicator / 2;
	            this.vertical.style.transform = `translate(${this.vertical.x}px,${find.top}px)`;
	            this.vertical.side = find.side;
	            this.vertical.noSpacing = find.noSpacing;
	            this.vertical.screen = find.screen;
	        }
	    }

	    moveEnd(win)
	    {
	        if (this.stopped)
	        {
	            return
	        }
	        if (this.horizontal.style.display === 'block')
	        {
	            const spacing = this.horizontal.noSpacing ? 0 : this.options.spacing;
	            const adjust = win.minimized ? (win.height - win.height * win.minimized.scaleY) / 2 : 0;
	            switch (this.horizontal.side)
	            {
	                case 'top':
	                    win.y = this.horizontal.y - adjust + spacing + this.options.indicator / 2;
	                    break

	                case 'bottom':
	                    win.bottom = Math.floor(this.horizontal.y + adjust - spacing + this.options.indicator / 2);
	                    break
	            }
	            win.attachToScreen('vertical', this.horizontal.screen ? this.horizontal.side : '');
	        }
	        if (this.vertical.style.display === 'block')
	        {
	            const spacing = this.vertical.noSpacing ? 0 : this.options.spacing;
	            const adjust = win.minimized ? (win.width - win.width * win.minimized.scaleX) / 2 : 0;
	            switch (this.vertical.side)
	            {
	                case 'left':
	                    win.x = this.vertical.x - adjust + spacing + this.options.indicator / 2;
	                    break

	                case 'right':
	                    win.right = Math.floor(this.vertical.x + adjust - spacing + this.options.indicator / 2);
	                    break
	            }
	            win.attachToScreen('horziontal', this.vertical.screen ? this.vertical.side : '');
	        }
	        this.horizontal.style.display = this.vertical.style.display = 'none';
	    }
	}

	const windowManagerOptions = {
	    parent: document.body,
	    quiet: false,
	    keepInside: true,
	    snap: true
	};

	/**
	 * Creates a windowing system to create and manage windows
	 *
	 * @extends EventEmitter
	 * @example
	 * var wm = new WindowManager();
	 *
	 * wm.createWindow({ x: 20, y: 20, width: 200 })
	 * wm.content.innerHTML = 'Hello there!'
	 */
	class WindowManager
	{
	    /**
	     * @param {object} [options]
	     * @param {HTMLElement} [options.parent=document.body]
	     * @param {boolean} [options.quiet] suppress the simple-window-manager console message
	     * @param {(boolean|SnapOptions)} [options.snap] turn on edge and/or screen snapping
	     * @param {(boolean|'horizontal'|'vertical')} [options.keepInside=true] keep windows inside the parent in a certain direction
	     * @param {WindowOptions} [defaultOptions] default WindowOptions used when createWindow is called
	     */
	    constructor(options={}, defaultOptions={})
	    {
	        this.windows = [];
	        this.active = null;
	        this.options = Object.assign({}, windowManagerOptions, options);
	        this.defaultOptions = Object.assign({}, windowOptions, defaultOptions);
	        if (!this.options.quiet)
	        {
	            console.log('%c ☕ simple-window-manager initialized ☕', 'color: #ff00ff');
	        }
	        this._createDom(options.parent || document.body);
	        if (this.options.snap)
	        {
	            this.snap(this.options.snap === true ? {} : this.options.snap);
	        }
	        window.addEventListener('resize', () => this.resize());
	    }

	    /**
	     * Create a window
	     * @param {WindowOptions} [options]
	     * @param {string} [options.title]
	     * @param {number} [options.x] position
	     * @param {number} [options.y] position
	     * @param {boolean} [options.modal]
	     * @param {(number|*)} [options.id] if not provide, id will be assigned in order of creation (0, 1, 2...)
	     * @returns {Window} the created window
	     */
	    createWindow(options={})
	    {
	        const win = new Window(this, Object.assign({}, this.defaultOptions, options));
	        win.on('open', () => this._open(win));
	        win.on('focus', () => this._focus(win));
	        win.on('blur', () => this._blur(win));
	        win.on('close', () => this._close(win));
	        win.win.addEventListener('mousemove', (e) => this._move(e));
	        win.win.addEventListener('touchmove', (e) => this._move(e));
	        win.win.addEventListener('mouseup', (e) => this._up(e));
	        win.win.addEventListener('touchend', (e) => this._up(e));
	        if (this._snap && !options.noSnap)
	        {
	            this._snap.addWindow(win);
	        }
	        win.resize(this.bounds, this.options.keepInside);
	        if (win.options.openOnCreate)
	        {
	            win.open();
	        }
	        return win
	    }

	    /**
	     * Attach an existing window to the WindowManager
	     * Note: WindowManager.createWindow is the preferred way to create windows to ensure that all the defaultOptions
	     * are applied to the Window. If you use this function, then Window needs to be initialized with WindowOptions.
	     * @param {Window} win
	     * @returns {Window} the window
	     */
	    attachWindow(win)
	    {
	        win.on('open', this._open, this);
	        win.on('focus', this._focus, this);
	        win.on('blur', this._blur, this);
	        win.on('close', this._close, this);
	        this.win.appendChild(win.win);
	        win.wm = this;
	        win.win.addEventListener('mousemove', (e) => this._move(e));
	        win.win.addEventListener('touchmove', (e) => this._move(e));
	        win.win.addEventListener('mouseup', (e) => this._up(e));
	        win.win.addEventListener('touchend', (e) => this._up(e));
	        if (this._snap && !this.defaultOptions.noSnap)
	        {
	            this._snap.addWindow(win);
	        }
	        return win
	    }

	    /**
	     * enable edge and/or screen snapping
	     * @param {SnapOptions} options
	     */
	    snap(options)
	    {
	        this._snap = new Snap(this, options);
	        for (let win of this.windows)
	        {
	            if (!win.options.noSnap)
	            {
	                this._snap.addWindow(win);
	            }
	        }
	    }

	    /**
	     * send window to front
	     * @param {Window} win
	     */
	    sendToFront(win)
	    {
	        const index = this.windows.indexOf(win);
	        console.assert(index !== -1, 'sendToFront should find window in this.windows');
	        if (index !== this.windows.length - 1)
	        {
	            this.windows.splice(index, 1);
	            this.windows.push(win);
	            this._reorder();
	        }
	    }

	    /**
	     * send window to back
	     * @param {Window} win
	     */
	    sendToBack(win)
	    {
	        const index = this.windows.indexOf(win);
	        console.assert(index !== -1, 'sendToFront should find window in this.windows');
	        if (index !== 0)
	        {
	            this.windows.splice(index, 1);
	            this.windows.unshift(win);
	            this._reorder();
	        }
	    }

	    /**
	     * save the state of all the windows
	     * @returns {object} use this object in load() to restore the state of all windows
	     */
	    save()
	    {
	        const data = {};
	        for (let i = 0; i < this.windows.length; i++)
	        {
	            const entry = this.windows[i];
	            data[entry.id] = entry.save();
	            data[entry.id].order = i;
	        }
	        return data
	    }

	    /**
	     * restores the state of all the windows
	     * NOTE: this requires that the windows have the same id as when save() was called
	     * @param {object} data created by save()
	     */
	    load(data)
	    {
	        for (let i = 0; i < this.windows.length; i++)
	        {
	            const entry = this.windows[i];
	            if (data[entry.id])
	            {
	                entry.load(data[entry.id]);
	            }
	        }
	        // reorder windows
	    }

	    /**
	     * close all windows
	     */
	    closeAll()
	    {
	        for (let win of this.windows)
	        {
	            win.close();
	        }
	        this.windows = [];
	        this.active = null;
	    }

	    /**
	     * reorder windows
	     * @private
	     * @returns {number} available z-index for top window
	     */
	    _reorder()
	    {
	        let i = 0;
	        for (const win of this.windows)
	        {
	            if (!win.isClosed())
	            {
	                win.z = i++;
	            }
	        }
	    }

	    /**
	     * @param {HTMLElement} parent
	     */
	    _createDom(parent)
	    {
	        /**
	         * This is the top-level DOM element
	         * @type {HTMLElement}
	         * @readonly
	         */
	        this.win = html({
	            parent, styles: {
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
	        this.overlay.addEventListener('mousemove', (e) => this._move(e));
	        this.overlay.addEventListener('touchmove', (e) => this._move(e));
	        this.overlay.addEventListener('mouseup', (e) => this._up(e));
	        this.overlay.addEventListener('touchend', (e) => this._up(e));

	        this.modalOverlay = html({
	            parent: this.win,
	            styles: {
	                'display': 'none',
	                'user-select': 'none',
	                'position': 'absolute',
	                'top': 0,
	                'left': 0,
	                'width': '100%',
	                'height': '100%',
	                'overflow': 'hidden',
	                'background': this.defaultOptions.backgroundModal
	            }
	        });
	        this.modalOverlay.addEventListener('mousemove', (e) => { this._move(e); e.preventDefault(); e.stopPropagation(); });
	        this.modalOverlay.addEventListener('touchmove', (e) => { this._move(e); e.preventDefault(); e.stopPropagation(); });
	        this.modalOverlay.addEventListener('mouseup', (e) => { this._up(e); e.preventDefault(); e.stopPropagation(); });
	        this.modalOverlay.addEventListener('touchend', (e) => { this._up(e); e.preventDefault(); e.stopPropagation(); });
	        this.modalOverlay.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
	        this.modalOverlay.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); });
	    }

	    _open(win)
	    {
	        this.windows.push(win);
	        this._reorder();
	        if (win.options.modal)
	        {
	            this.modalOverlay.style.display = 'block';
	            this.modalOverlay.style.zIndex = win.z;
	        }
	        else
	        {
	            this.modalOverlay.style.display = 'none';
	        }
	    }

	    _focus(win)
	    {
	        if (this.active === win)
	        {
	            return
	        }
	        if (this.active)
	        {
	            this.active.blur();
	        }
	        const index = this.windows.indexOf(win);
	        console.assert(index !== -1, 'WindowManager._focus should find window in this.windows');
	        if (index !== this.windows.length - 1)
	        {
	            this.windows.splice(index, 1);
	            this.windows.push(win);
	        }
	        this._reorder();
	        this.active = this.windows[this.windows.length - 1];
	    }

	    _blur(win)
	    {
	        if (this.active === win)
	        {
	            this.active = null;
	        }
	    }

	    _close(win)
	    {
	        const index = this.windows.indexOf(win);
	        console.assert(index !== -1, 'WindowManager._close should find window in this.windows');
	        this.windows.splice(index, 1);
	        const next = this.windows[this.windows.length - 1];
	if (next === win) debugger
	        if (win.isModal(true))
	        {
	            if (next && next.isModal())
	            {
	                this.modalOverlay.style.zIndex = next.z;
	            }
	            else
	            {
	                this.modalOverlay.style.display = 'none';
	            }
	        }
	        next.focus();
	    }

	    _move(e)
	    {
	        for (const key in this.windows)
	        {
	            this.windows[key]._move(e);
	        }
	    }

	    _up(e)
	    {
	        for (const key in this.windows)
	        {
	            this.windows[key]._up(e);
	        }
	    }

	    checkModal(win)
	    {
	        return !this.modal || this.modal === win
	    }

	    /** @type {Bounds} */
	    get bounds()
	    {
	        return {
	            top: this.win.offsetTop,
	            bottom: this.win.offsetTop + this.win.offsetHeight,
	            left: this.win.offsetLeft,
	            right: this.win.offsetLeft + this.win.offsetWidth
	        }
	    }

	    resize()
	    {
	        const bounds = this.bounds;
	        for (const key in this.windows)
	        {
	            this.windows[key].resize(bounds, this.options.keepInside);
	        }
	    }
	}

	/**
	 * @typedef {object} SnapOptions
	 * @property {boolean} [screen=true] snap to screen edges
	 * @property {boolean} [windows=true] snap to window edges
	 * @property {number} [snap=20] distance to edge before snapping
	 * @property {string} [color=#a8f0f4] color for snap bars
	 * @property {number} [spacing=0] spacing distance between window and edges
	 */

	/**
	 * @typedef {object} Bounds
	 * @property {number} left
	 * @property {number} right
	 * @property {number} top
	 * @property {number} bottom
	 */

	// import { menu } from './menu'

	// create a window manager and change some of the default styles
	const wm = new WindowManager();
	wm.snap({ screen: true, windows: true, spacing: 0 });

	window.onload = () =>
	{
	    // creates test windows
	    test();
	    test2();
	    test3();
	    test4();
	    test5();
	    test7();
	    // menu(wm)
	    update();
	};

	const top = 10;

	function test()
	{
	    const test = wm.createWindow({ x: 10, y: top, titlebar: false, title: 'Test Window', resizable: false, maximizable: false, minimizable: false, titleCenter: true, closable: false });
	    test.content.style.padding = '1em';
	    test.content.innerHTML = 'This is a test window.';
	    test.open();
	}

	function test2()
	{
	    const test = wm.createWindow({
	        width: 300, height: 150,
	        x: 100, y: 100,
	        titlebarHeight: '22px',
	        backgroundTitlebarActive: 'green',
	        backgroundTitlebarInactive: 'purple',
	        backgroundWindow: 'rgb(255,200,255)',
	    });
	    test.content.style.padding = '0.5em';
	    test.content.innerHTML = 'This is a pink test window.<br><br>Check out the fancy title bar for other style tests.<br><br><br>And scrolling!!!';
	    test.open();
	}

	function test3()
	{
	    // create a test window with a button to create a modal window
	    const test = wm.createWindow({ x: 300, y: 400, width: 350, title: 'This is one fancy demo!' });
	    test.content.style.padding = '1em';
	    html({ parent: test.content, html: 'OK. It isn\'t that fancy, but it shows off some of the functionality of this library.<br><br>Please excuse the mess. I do NOT keep my desktop this messy, but I thought it made for a good demo.' });
	    const div = html({ parent: test.content, styles: { textAlign: 'center', marginTop: '1em' } });
	    const button = html({ parent: div, type: 'button', html: 'open modal window' });

	    let x = 0;
	    let y = 0;
	    function createModal()
	    {
	        // create a modal window
	        const modal = wm.createWindow({
	            modal: true,
	            width: 200,
	            title: 'modal window',
	            minimizable: false,
	            maximizable: false
	        });
	        const div = html({ parent: modal.content, styles: { 'margin': '0.5em' } });
	        html({ parent: div, html: 'This needs to be closed before using other windows.' });
	        const buttonDiv = html({ parent: div, styles: { 'text-align': 'center', margin: '1em', display: 'flex' } });
	        const buttonAdd = html({ parent: buttonDiv, type: 'button', html: 'open child modal' });
	        const button = html({ parent: buttonDiv, type: 'button', html: 'close modal' });
	        button.onclick = () => modal.close();
	        buttonAdd.onclick = () => createModal();
	        modal.open();

	        // center window in test
	        modal.center(test);
	        modal.move(modal.x + x, modal.y + y);
	        x += 20;
	        y += 20;
	    }

	    button.onclick = () => createModal();
	    test.open();
	}

	function test4()
	{
	    const test = wm.createWindow({ x: 300, y: top, title: 'My wife\'s art gallery!', maximizable: false });
	    test.content.innerHTML = '<iframe width="560" height="315" src="https://yuanru.gallery" frameborder="0" allow="encrypted-media" allowfullscreen></iframe>';
	    test.open();
	    test.sendToBack();
	}

	function test5()
	{
	    const test = wm.createWindow({ x: 20, y: 600, title: 'window save/load' });
	    html({ parent: test.content, html: 'Save the windows, and then move windows around and load them.', styles: { margin: '0.5em' } });
	    const buttons = html({ parent: test.content, styles: { 'text-align': 'center' } });
	    const save = html({ parent: buttons, html: 'save window state', type: 'button', styles: { margin: '1em', background: 'rgb(200,255,200)' } });
	    const load = html({ parent: buttons, html: 'load window state', type: 'button', styles: { margin: '1em', background: 'rgb(255,200,200)' } });
	    test.open();
	    let data;
	    save.onclick = () => data = wm.save();
	    load.onclick = () => { if (data) wm.load(data); };
	}

	function test7()
	{
	    const test = wm.createWindow({ x: 700, y: 40, width: 400, height: 300, title: 'API documentation', styles: { overflow: 'hidden' } });
	    test.content.innerHTML = '<iframe width="100%" height="100%" src="https://davidfig.github.io/window-manager/jsdoc/"></iframe>';
	    test.open();
	}

	const wallpaper = html({ parent: wm.overlay, styles: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white' } });
	wallpaper.innerHTML = 'You can also use the background as wallpaper or another window surface.';

	const fps = new yyFps();
	function update()
	{
	    fps.frame(false, true);
	    requestAnimationFrame(update);
	}

}());
//# sourceMappingURL=index.js.map
