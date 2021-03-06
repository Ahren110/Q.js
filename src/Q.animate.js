﻿/// <reference path="Q.$.js" />
/*
* Q.animate.js 动画 from mojoFx v1.2
* Copyright (c) 2010 scott.cgi

* author:devin87@qq.com
* update:2016/07/26 14:58
*/
(function (undefined) {
    "use strict";

    var isNum = Q.isNum,
        isHidden = Q.isHidden,
        getStyle = Q.getStyle,
        makeArray = Q.makeArray,

        cssShow = Q.show,
        cssHide = Q.hide;

    var list_prop = ["scrollTop", "scrollLeft"],
        map_prop = list_prop.toMap(true);

    var

		mojoFx = function (arg) {
		    return new moFx(arg);
		},

		/**
		 * Animation object inculde HTMLElements and animation API
		 * 
		 * @param {Array | NodeList | HTMLElement} arg
		 */
		moFx = function (arg) {
		    this.elements = makeArray(arg);
		},

		joFx = {

		    easing: {
		        /**
                 * @param {Number} t	current time   
                 * @param {Number} b	beginning value 
                 * @param {Number} c	change value    
                 * @param {Number} d	duration        
                 */
		        swing: function (t, b, c, d) {
		            return ((-Math.cos(t / d * Math.PI) / 2) + 0.5) * c + b;
		        }
		    },

		    // animation executor time id
		    timeId: 0,

		    // current animation elements
		    animEls: [],

		    /**
			 * Get the animation data on element
			 * 
			 * @param {HTMLElement} el HLTMLElement
			 * @return {Object}        Animation data
			 */
		    getElData: function (el) {
		        var x;
		        if (!(x = el.mojoData)) {
		            x = el.mojoData = {};
		        }

		        if (!x.mojoFx) {
		            x.mojoFx = {
		                // animation queue
		                queue: [],

		                // current animation steps
		                current: [],

		                // current animation queue step
		                curStep: [],

		                // whether delay animation queue
		                isDelay: false,

		                // whether the element in animation array
		                isAnim: false
		            };
		        }

		        return x.mojoFx;
		    },

		    /**
			 * Add elements into global animation array
			 * And elements animation step
			 * 
			 * @param {Array}              els  Array of HTMLElement
			 * @param {Object | Undefined} cfg  Animation configuration object
			 * @return {Object} joFx
			 */
		    add: function (els, cfg) {
		        var
					aEls = this.animEls,
					len = els.length,
					i = 0,
					el, data;

		        cfg.els = els;

		        for (; i < len; i++) {
		            el = els[i];

		            data = this.getElData(el);

		            if (!data.isAnim) {
		                aEls.push(el);
		                data.isAnim = true;
		            }

		            cfg.isQueue ? data.queue.push(cfg) : data.current.push(this.getElStep(el, cfg));
		        }

		        return this;
		    },

		    /**
			 * Get animation step array
			 * 
			 * @param {HTMLElement} el  HTMLElement
			 * @param {Object}      cfg Animation configuration object
			 * @return {Array}          Animation queue step
			 */
		    getElStep: function (el, cfg) {
		        var
					step = [],
					easing, prop, fxs,
					p, val, fx;

		        step.cfg = {
		            t: 0,
		            d: cfg.duration,
		            args: cfg.args,
		            callback: cfg.callback
		        };

		        if (cfg.prop) {
		            fxs = cfg.fxs;
		        } else {
		            // step only has callback function	
		            return step;
		        }

		        if (!fxs) {
		            fxs = [];
		            prop = cfg.prop;
		            easing = cfg.easing;

		            var hidden = isHidden(el);

		            for (p in prop) {
		                // each property animation bind to object
		                fx = {};

		                // property name
		                fx.name = p;
		                // easing type
		                fx.easing = easing;
		                // property value
		                val = prop[p];

		                if (val == "toggle") val = hidden ? "show" : "hide";

		                switch (val) {
		                    case "show":
		                        val = this.getElStyle(el, p);
		                        cfg._show = true;
		                        break;
		                    case "hide":
		                        val = 0;
		                        cfg._hide = true;
		                        break;
		                }

		                switch (typeof val) {
		                    case "number":
		                        fx.symbol = "";
		                        fx.val = val;
		                        fx.unit = "px";
		                        break;

		                        // Property value is an array
		                        // the 2nd parameter is easing	
		                    case "object":
		                        if (val.length > 1) {
		                            fx.easing = val[1];
		                        }
		                        val = val[0];
		                        // here no break

		                    case "string":
		                        if (p.toLowerCase().indexOf("color") === -1) {
		                            val = /(\+=|-=)?(-?\d+)(\D*)/.exec(val) || ["", 0];
		                            fx.symbol = val[1];
		                            fx.val = val[2] || 0;
		                            fx.unit = val[3] || "px";

		                            // color property					
		                        } else {
		                            fx.val = val;
		                            // unit use "#" when color property
		                            fx.unit = "#";
		                        }
		                }

		                fxs.push(fx);
		            }

		            cfg.fxs = fxs;
		        }

		        var data = this.getElData(el);
		        data._show = cfg._show;
		        data._hide = cfg._hide;

		        return this.setBc(el, fxs, step);
		    },

		    /**
			 * Set animation step begin and change value
			 * 
			 * @param  {HTMLElement} el    HTMLElement
			 * @param  {Array}       fxs   Property animation configuration 
			 * @return {Array}             Animation step
			 */
		    setBc: function (el, fxs, step) {
		        var hidden = isHidden(el),
					len = fxs.length,
					i = 0,
					undefined,
					fx, b, c, p, u;

		        for (; i < len; i++) {
		            fx = fxs[i];

		            p = fx.name;
		            c = fx.val;
		            u = fx.unit;

		            if (u !== "#") {
		                if (hidden) b = 0;
		                else {
		                    // element style property
		                    if (el[p] === undefined) {
		                        // get current style value
		                        b = parseFloat(this.getElStyle(el, p));
		                        if (isNaN(b)) {
		                            b = 0;
		                        }

		                    } else {
		                        b = el[p];
		                        // unit use "&" when not style property
		                        u = "&";
		                    }
		                }

		                // set change value by symbol
		                switch (fx.symbol) {
		                    case "+=":
		                        c = c * 1;
		                        break;

		                    case "-=":
		                        c = c * 1 - c * 2;
		                        break;

		                    default:
		                        c = c * 1 - b;
		                }

		                if (c === 0) {
		                    continue;
		                }

		            } else {
		                b = this.getRgb(this.getElStyle(el, p));
		                c = this.getRgb(c);

		                // RGB value
		                c[0] -= b[0];// red
		                c[1] -= b[1];// green
		                c[2] -= b[2];// blue

		                if (c.join("") === "000") {
		                    continue;
		                }
		            }

		            step.push({
		                p: map_prop[p] ? p : p.replace(/[A-Z]/g, "-$&"),
		                b: b,
		                c: c,
		                u: u,
		                e: this.easing[fx.easing]
		            });
		        }

		        return step;
		    },

		    /**
			 * Start global animation executor
			 */
		    start: function () {
		        var
				    self, start;

		        if (!this.timeId) {
		            self = this;
		            start = Date.now();

		            this.timeId = window.setInterval(function () {
		                var end = Date.now();
		                self.updateEl(end - start);
		                start = end;
		            }, 13);
		        }
		    },

		    /**
			 * Update element style
			 * 
			 * @param {Number} stepTime  Each step interval 
			 */
		    updateEl: function (stepTime) {
		        var
					aEls = this.animEls,
					len = aEls.length,
					i = 0,
					el, que, cur, curStep, data;

		        for (; i < len; i++) {
		            el = aEls[i];

		            data = this.getElData(el);

		            // element animation queue
		            que = data.queue;
		            // current animation steps
		            cur = data.current;

		            // current step of element animation queue 
		            if (!(curStep = data.curStep).length && que.length && !data.isDelay) {
		                curStep = data.curStep = this.getElStep(el, que.shift());
		                cur.push(curStep);
		            }

		            if (cur.length) {
		                if (!data.started) {
		                    data.started = true;

		                    if (data._show && isHidden(el)) cssShow(el);

		                    if (data._show || data._hide) {
		                        data.cssText = el.style.cssText;
		                        el.style.overflow = "hidden";
		                    }
		                }

		                this.step(el, cur, stepTime);
		            } else {
		                // element animation complete
		                aEls.splice(i--, 1);
		                data.isAnim = false;

		                // global animation complete
		                if ((len = aEls.length) === 0) {
		                    window.clearInterval(this.timeId);
		                    this.timeId = 0;
		                    return;
		                }
		            }
		        }
		    },

		    /**
			 * Update each current animation step's value
			 * 
			 * @param {HTMLElement} el     HTMLElement
			 * @param {Array}       steps  Current animation steps array
			 */
		    step: function (el, steps, stepTime) {
		        var
					sty = "",
					len = steps.length,
					cfgs = [],
					i = 0,
					step, cfg, d, t;

		        for (i = 0; i < len; i++) {
		            step = steps[i];
		            cfg = step.cfg;

		            if (step.length) {

		                t = cfg.t += stepTime;
		                d = cfg.d;

		                if (t < d) {
		                    sty += this.getCssText(el, step, t, d);
		                    continue;
		                } else {
		                    t = d;
		                    sty += this.getCssText(el, step, t, d);
		                }
		            }

		            // aniamtion property already complete 
		            // or current step just only has callback function					
		            steps.splice(i--, 1);
		            len--;
		            step.length = 0;
		            cfgs.push(cfg);
		        }

		        el.style.cssText += sty;

		        for (i = 0, len = cfgs.length; i < len; i++) {
		            cfg = cfgs[i];

		            //清理工作
		            var data = this.getElData(el);
		            if (data.cssText != undefined) el.style.cssText = data.cssText;

		            if (data._show) cssShow(el);
		            else if (data._hide) cssHide(el);

		            data.started = data.cssText = data._show = data._hide = undefined;

		            if (cfg.callback) {
		                // execute callback function
		                cfg.callback.apply(el, cfg.args);
		            }
		        }
		    },

		    /**
			 * Get element style cssText
			 * 
			 * @param {HTMLElement} el
			 * @param {Array}       step
			 * @param {Number}      t
			 * @param {Number}      d
			 */
		    getCssText: function (el, step, t, d) {
		        var
					sty = ";",
					len = step.length,
					i = 0,
					f, p, b, c, u, e;

		        for (; i < len; i++) {
		            f = step[i];

		            p = f.p;
		            b = f.b;
		            c = f.c;
		            u = f.u;
		            e = f.e;

		            switch (u) {
		                case "&":
		                    el[p] = e(t, b, c, d);
		                    continue;

		                case "#":
		                    sty += p + ":rgb(" +
								   Math.ceil(e(t, b[0], c[0], d)) + "," +
								   Math.ceil(e(t, b[1], c[1], d)) + "," +
								   Math.ceil(e(t, b[2], c[2], d)) + ");";
		                    break;

		                default:
		                    if (p === "opacity") {
		                        p = e(t, b, c, d);
		                        sty += "opacity:" + p + ";filter:alpha(opacity=" + p * 100 + ");";
		                    } else {
		                        sty += p + ":" + e(t, b, c, d) + u + ";";
		                    }
		            }
		        }

		        return sty;
		    },

		    /**
			 * Stop elements animation
			 * 
			 * @param {Object}  els         HTMLElement array
			 * @param {Boolean} clearQueue  Clear element animation queue
			 * @return {Object} joFx
			 */
		    stop: function (els, clearQueue) {
		        var
					len = els.length,
					i = 0,
					el, data;

		        for (; i < len; i++) {
		            el = els[i];
		            data = this.getElData(el);

		            data.curStep.length = 0;
		            data.current.length = 0;

		            if (clearQueue) {
		                data.queue.length = 0;
		            }
		        }

		        return this;
		    },

		    /**
			 * Get property value of element css style
			 * 
			 * @param  {HTMLElement} el HTMLElement
			 * @param  {String}      p	Css property name
			 * @return {String} 	    Css property value			
			 */
		    //getElStyle: window.getComputedStyle ?
		    //	function (el, p) {
		    //	    return el.style[p] || window.getComputedStyle(el, null)[p];
		    //	} :
		    //	function (el, p) {
		    //	    if (p === "opacity") {
		    //	        return (el.filters.alpha ? el.filters.alpha.opacity : 100) / 100;
		    //	    }

		    //	    return el.style[p] || el.currentStyle[p];
		    //	},
		    getElStyle: function (el, p) {
		        return el.style[p] || getStyle(el, p);
		    },

		    /**
			 * Get color property value to decimal RGB array
			 * 
			 * @param  {String} color Css color style value
			 * @return {Array}     	  Decimal RGB value array
			 */
		    getRgb: function (color) {
		        var
					rgb, i;

		        if (color.charAt(0) === "#") {
		            // #000
		            if (color.length === 4) {
		                color = color.replace(/\w/g, "$&$&");
		            }

		            rgb = [];

		            // #000000
		            for (i = 0; i < 3; i++) {
		                rgb[i] = parseInt(color.substring(2 * i + 1, 2 * i + 3), 16);
		            }

		            // rgb(0,0,0)
		        } else {
		            if (color === "transparent" || color === "rgba(0, 0, 0, 0)") {
		                rgb = [255, 255, 255];
		            } else {
		                rgb = color.match(/\d+/g);
		                for (i = 0; i < 3; i++) {
		                    rgb[i] = parseInt(rgb[i]);
		                }
		            }
		        }

		        return rgb;
		    }

		};


    moFx.prototype = {
        /**
         * Custom animation property and fire it
         * 
         * @param  {Object} prop  HTMLElement style configuration object
         * @return {Object} moFx
         */
        anim: function (prop) {
            var
                // animation configuration object
                cfg = {
                    prop: prop,

                    duration: 400,

                    callback: null,

                    easing: "swing",

                    // whether current animation enter queue 
                    isQueue: true,

                    // arguments of callback funtion
                    args: []
                },
                len = arguments.length,
                i = 1,
                param;

            for (; i < len; i++) {
                param = arguments[i];
                switch (typeof param) {
                    case "number":
                        cfg.duration = param;
                        break;

                    case "string":
                        cfg.easing = param;
                        break;

                    case "function":
                        cfg.callback = param;
                        break;

                    case "boolean":
                        cfg.isQueue = param;
                        break;

                    case "object":
                        if (param.length) {
                            // assert param is array
                            cfg.args = param;
                        }
                }
            }

            // bind configuration object to element
            // set element into global animation array
            // start animation
            joFx.add(this.elements, cfg).start();

            return this;
        },

        /**
         * Stop elements animation
         * 
         * @param {Boolean} clearQueue  Clear element animation queue	 
         * @return {Object} moFx
         */
        stop: function (clearQueue) {
            joFx.stop(this.elements, clearQueue);
            return this;
        },

        /**
         * Set a timer to delay execution aniamtion queue
         * 
         * @param {Number} t     Delay times
         * @return{Object} moFx
         */
        delay: function (t) {
            joFx.add(this.elements, {
                args: [t, joFx, joFx.animEls],
                isQueue: true,
                callback: function (t, joFx, aEls) {
                    var
                        data = joFx.getElData(this),
                        el = this;
                    data.isDelay = true;
                    window.setTimeout(function () {
                        if (!data.isAnim) {
                            aEls.push(el);
                            data.isAnim = true;
                        }
                        data.isDelay = false;
                        joFx.start();
                    }, t);
                }
            });

            return this;
        }
    };

    /**
     * Extend public API
     */
    mojoFx.extend = function (o) {
        var p;
        for (p in o) {
            this[p] = o[p];
        }

        return this;
    };


    mojoFx.extend({
        info: {
            author: "scott.cgi",
            version: "1.2.0"
        },

        /**
         * Add easing algorithm
         */
        addEasing: function () {
            var
                easing = joFx.easing,
                p, o;

            switch (arguments.length) {
                case 1:
                    o = arguments[0];
                    for (p in o) {
                        easing[p] = o[p];
                    }
                    break;

                case 2:
                    p = arguments[0];
                    o = arguments[1];
                    easing[p] = o;
            }

            return this;
        }
    });

    //------------------------- export -------------------------

    var cssExpand = ["Top", "Right", "Bottom", "Left"];

    var fxSpeeds = {
        slow: 600,
        fast: 200,

        _def: 400
    };

    function genFx(type, includeWidth) {
        var which,
            attrs = { height: type },
            i = 0;

        // if we include width, step value is 1 to do all cssExpand values,
        // if we don't include width, step value is 2 to skip over Left and Right
        includeWidth = includeWidth ? 1 : 0;
        for (; i < 4 ; i += 2 - includeWidth) {
            which = cssExpand[i];
            attrs["margin" + which] = attrs["padding" + which] = type;
        }

        if (includeWidth) {
            attrs.opacity = attrs.width = type;
        }

        return attrs;
    }

    function animate(el, props, speed, easing, callback) {
        mojoFx(el).anim(props, isNum(speed, 0) ? speed : speed && fxSpeeds[speed] || fxSpeeds["_def"], easing, callback);
    }

    var domFn = Q.$.fn;

    domFn.extend({
        animate: function (props, speed, easing, callback) {
            if (this.list.length > 0) animate(this.list, props, speed, easing, callback);
            return this;
        }
    });

    ["toggle", "show", "hide"].forEach(function (name) {
        var cssFn = domFn[name];

        domFn[name] = function (speed, easing, callback) {
            if (speed == null || typeof speed === "boolean") {
                joFx.stop(this.list, true);
                return cssFn.apply(this);
            }

            return this.animate(genFx(name, true), speed, easing, callback);
        };
    });

    Object.forEach({
        slideDown: genFx("show"),
        slideUp: genFx("hide"),
        slideToggle: genFx("toggle"),
        fadeIn: { opacity: "show" },
        fadeOut: { opacity: "hide" },
        fadeToggle: { opacity: "toggle" }
    }, function (name, props) {
        domFn[name] = function (speed, easing, callback) {
            return this.animate(props, speed, easing, callback);
        };
    });

    var setCenter = Q.setCenter;

    //元素居中动画
    domFn.center = function (speed, easing, callback) {
        var self = this,
            isNoAnim = speed == null || typeof speed === "boolean";

        if (isNoAnim) joFx.stop(self.list, true);

        return this.each(function (i, el) {
            isNoAnim ? setCenter(el) : animate(el, setCenter(el, true), speed, easing, callback);
        });
    };

    Q.Fx = joFx;
    Q.fx = mojoFx;

})();