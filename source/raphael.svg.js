/**!
* RedRaphael 1.0.0 - JavaScript Vector Library SVG Module
* Copyright (c) 2012-2013 FusionCharts Technologies <http://www.fusioncharts.com>
*
* Raphael 2.1.0 - JavaScript Vector Library SVG Module
* Copyright (c) 2008-2012 Dmitry Baranovskiy <http://raphaeljs.com>
* Copyright © 2008-2012 Sencha Labs <http://sencha.com>
*
* Licensed under the MIT license.
*/
window.Raphael && window.Raphael.svg && function(R) {
    var has = "hasOwnProperty",
        Str = String,
        toFloat = parseFloat,
        toInt = parseInt,
        math = Math,
        mmax = math.max,
        abs = math.abs,
        pow = math.pow,
        sqrt = math.sqrt,
        separator = /[, ]+/,
        zeroStrokeFix = !!(/AppleWebKit/.test(R._g.win.navigator.userAgent) &&
                (!/Chrome/.test(R._g.win.navigator.userAgent) ||
                R._g.win.navigator.appVersion.match(/Chrome\/(\d+)\./)[1] < 29)),
        eve = R.eve,
        E = "",
        S = " ",
        xlink = "http://www.w3.org/1999/xlink",
        markers = {
            block: "M5,0 0,2.5 5,5z",
            classic: "M5,0 0,2.5 5,5 3.5,3 3.5,2z",
            diamond: "M2.5,0 5,2.5 2.5,5 0,2.5z",
            open: "M6,1 1,3.5 6,6",
            oval: "M2.5,0A2.5,2.5,0,0,1,2.5,5 2.5,2.5,0,0,1,2.5,0z"
        },
        markerCounter = {},
        updateReferenceUrl = function () {
            return R._url = R._g.win.location.href.replace(/#.*?$/, E);
        };

    R.toString = function() {
        return  "Your browser supports SVG.\nYou are running Rapha\xebl " + this.version;
    };

    // Automatic gradient and other reference update on state change
    R._url = (/msie/i.test(navigator.userAgent) && !window.opera) ?
        E : updateReferenceUrl();
    if (R._url && R._g.win.history.pushState) {
        R._g.win.history.pushState = (function () {
            var fn = R._g.win.history.pushState;
            return function () {
                var ret = fn.apply(R._g.win.history, arguments);
                return updateReferenceUrl(), ret;
            };
        }());
        R._g.win.addEventListener("popstate", updateReferenceUrl, false);
    }

    var $ = R._createNode = function(el, attr) {
        if (attr) {
            if (typeof el == "string") {
                el = $(el);
            }
            for (var key in attr)
                if (attr[has](key)) {
                    if (key.substring(0, 6) == "xlink:") {
                        el.setAttributeNS(xlink, key.substring(6), Str(attr[key]));
                    } else {
                        el.setAttribute(key, Str(attr[key]));
                    }
                }
        } else {
            el = R._g.doc.createElementNS("http://www.w3.org/2000/svg", el);
        }
        return el;
    },
    gradientUnitNames = {
        userSpaceOnUse: 'userSpaceOnUse',
        objectBoundingBox: 'objectBoundingBox'
    },
    gradientSpreadNames = {
        pad: 'pad',
        redlect: 'reflect',
        repeat: 'repeat'
    },
    addGradientFill = function(element, gradient) {
        var type = "linear",
        id = element.id + gradient,
        fx = .5, fy = .5, r, cx, cy, units, spread,
        o = element.node,
        SVG = element.paper,
        s = o.style,
        el = R._g.doc.getElementById(id);
        if (!el && SVG.defs) {
            gradient = Str(gradient).replace(R._radial_gradient, function(all, opts) {
                type = "radial";
                opts = opts && opts.split(',') || [];
                units = opts[5];
                spread = opts[6];

                var _fx = opts[0],
                    _fy = opts[1],
                    _r = opts[2],
                    _cx = opts[3],
                    _cy = opts[4],
                    shifted = (_fx && _fy),
                    dir,
                    sqx;

                if (_r) {
                    r = /\%/.test(_r) ? _r : toFloat(_r);
                }

                if (units === gradientUnitNames.userSpaceOnUse) {
                    if (shifted) {
                        fx = _fx;
                        fy = _fy;
                    }
                    if (_cx && _cy) {
                        cx = _cx;
                        cy = _cy;
                        if (!shifted) {
                            fx = cx;
                            fy = cy;
                        }
                    }
                    return E;
                }

                if (shifted) {
                    fx = toFloat(_fx);
                    fy = toFloat(_fy);
                    dir = ((fy > .5) * 2 - 1);
                    (sqx = pow(fx - .5, 2)) + pow(fy - .5, 2) > .25 &&
                    (sqx < .25) && (fy = sqrt(.25 - sqx) * dir + .5) &&
                    fy !== .5 &&
                    (fy = fy.toFixed(5) - 1e-5 * dir);
                }
                if (_cx && _cy) {
                    cx = toFloat(_cx);
                    cy = toFloat(_cy);
                    dir = ((cy > .5) * 2 - 1);

                    (sqx = pow(cx - .5, 2)) + pow(cy - .5, 2) > .25 &&
                    (sqx < .25) && (cy = sqrt(.25 - sqx) * dir + .5) &&
                    cy !== .5 &&
                    (cy = cy.toFixed(5) - 1e-5 * dir);

                    if (!shifted) {
                        fx = cx;
                        fy = cy;
                    }
                }

                return E;
            });
            gradient = gradient.split(/\s*\-\s*/);
            if (type == "linear") {
                var angle = gradient.shift(),
                    specs = angle.match(/\((.*)\)/),
                    vector,
                    max;

                specs = specs && specs[1] && specs[1].split(/\s*\,\s*/);
                angle = -toFloat(angle);
                if (isNaN(angle)) {
                    return null;
                }
                if (specs && specs.length) {
                    if (specs[0] in gradientUnitNames) {
                        units = specs.shift();
                        (specs[0] in gradientSpreadNames) &&
                            (spread = specs.shift());
                    }
                    else {
                        specs[4] && (units = specs[4]);
                        specs[5] && (spread = specs[5]);
                    }

                    /* @todo apply angle rotation and validation */
                    vector = [
                        specs[0] || "0%", specs[1] || "0%",
                        specs[2] || "100%", specs[3] || "0%"
                    ];
                }
                else {
                    vector = [0, 0, math.cos(R.rad(angle)), math.sin(R.rad(angle))];
                    max = 1 / (mmax(abs(vector[2]), abs(vector[3])) || 1);
                    vector[2] *= max;
                    vector[3] *= max;
                    if (vector[2] < 0) {
                        vector[0] = -vector[2];
                        vector[2] = 0;
                    }
                    if (vector[3] < 0) {
                        vector[1] = -vector[3];
                        vector[3] = 0;
                    }
                }
            }
            var dots = R._parseDots(gradient);
            if (!dots) {
                return null;
            }
            id = id.replace(/[\(\)\s,\xb0#]/g, "_");

            if (element.gradient && id !== element.gradient.id) {
                SVG.defs.removeChild(element.gradient);
                delete element.gradient;
            }

            if (!element.gradient) {
                el = $(type + "Gradient", {
                    id: id
                });
                element.gradient = el;
                (units in gradientUnitNames) &&
                        el.setAttribute('gradientUnits', Str(units));
                (spread in gradientSpreadNames) &&
                        el.setAttribute('spreadMethod', Str(spread));
                if (type === "radial") {
                    (r !== undefined) && el.setAttribute('r', Str(r));

                    if (cx !== undefined && cy !== undefined) {
                        el.setAttribute('cx', Str(cx));
                        el.setAttribute('cy', Str(cy));
                    }
                    el.setAttribute('fx', Str(fx));
                    el.setAttribute('fy', Str(fy));
                }
                else {
                    $(el, {
                        x1: vector[0],
                        y1: vector[1],
                        x2: vector[2],
                        y2: vector[3],
                        gradientTransform: element.matrix.invert()
                    });
                }
                SVG.defs.appendChild(el);
                for (var i = 0, ii = dots.length; i < ii; i++) {
                    el.appendChild($("stop", {
                        offset: dots[i].offset ? dots[i].offset : i ? "100%" : "0%",
                        "stop-color": dots[i].color || "#fff",
                        //add stop opacity information
                        "stop-opacity": dots[i].opacity === undefined ? 1 : dots[i].opacity
                    }));
                }
            }
        }
        $(o, {
            fill: "url('" + R._url + "#" + id + "')",
            opacity: 1,
            "fill-opacity": 1
        });
        s.fill = E;
        s.opacity = 1;
        s.fillOpacity = 1;
        return 1;
    },
    updatePosition = function(o) {
        var bbox = o.getBBox(1);
        $(o.pattern, {
            patternTransform: o.matrix.invert() + " translate(" + bbox.x + "," + bbox.y + ")"
        });
    },
    addArrow = function(o, value, isEnd) {
        if (o.type == "path") {
            var values = Str(value).toLowerCase().split("-"),
            p = o.paper,
            se = isEnd ? "end" : "start",
            node = o.node,
            attrs = o.attrs,
            stroke = attrs["stroke-width"],
            i = values.length,
            type = "classic",
            from,
            to,
            dx,
            refX,
            attr,
            w = 3,
            h = 3,
            t = 5;
            while (i--) {
                switch (values[i]) {
                    case "block":
                    case "classic":
                    case "oval":
                    case "diamond":
                    case "open":
                    case "none":
                        type = values[i];
                        break;
                    case "wide":
                        h = 5;
                        break;
                    case "narrow":
                        h = 2;
                        break;
                    case "long":
                        w = 5;
                        break;
                    case "short":
                        w = 2;
                        break;
                }
            }
            if (type == "open") {
                w += 2;
                h += 2;
                t += 2;
                dx = 1;
                refX = isEnd ? 4 : 1;
                attr = {
                    fill: "none",
                    stroke: attrs.stroke
                };
            } else {
                refX = dx = w / 2;
                attr = {
                    fill: attrs.stroke,
                    stroke: "none"
                };
            }
            if (o._.arrows) {
                if (isEnd) {
                    o._.arrows.endPath && markerCounter[o._.arrows.endPath]--;
                    o._.arrows.endMarker && markerCounter[o._.arrows.endMarker]--;
                } else {
                    o._.arrows.startPath && markerCounter[o._.arrows.startPath]--;
                    o._.arrows.startMarker && markerCounter[o._.arrows.startMarker]--;
                }
            } else {
                o._.arrows = {};
            }
            if (type != "none") {
                var pathId = "raphael-marker-" + type,
                markerId = "raphael-marker-" + se + type + w + h + "-obj" + o.id;
                if (!R._g.doc.getElementById(pathId)) {
                    p.defs.appendChild($($("path"), {
                        "stroke-linecap": "round",
                        d: markers[type],
                        id: pathId
                    }));
                    markerCounter[pathId] = 1;
                } else {
                    markerCounter[pathId]++;
                }
                var marker = R._g.doc.getElementById(markerId),
                use;
                if (!marker) {
                    marker = $($("marker"), {
                        id: markerId,
                        markerHeight: h,
                        markerWidth: w,
                        orient: "auto",
                        refX: refX,
                        refY: h / 2
                    });
                    use = $($("use"), {
                        "xlink:href": "#" + pathId,
                        transform: (isEnd ? "rotate(180 " + w / 2 + " " + h / 2 + ") " : E) + "scale(" + w / t + "," + h / t + ")",
                        "stroke-width": (1 / ((w / t + h / t) / 2)).toFixed(4)
                    });
                    marker.appendChild(use);
                    p.defs.appendChild(marker);
                    markerCounter[markerId] = 1;
                } else {
                    markerCounter[markerId]++;
                    use = marker.getElementsByTagName("use")[0];
                }
                $(use, attr);
                var delta = dx * (type != "diamond" && type != "oval");
                if (isEnd) {
                    from = o._.arrows.startdx * stroke || 0;
                    to = R.getTotalLength(attrs.path) - delta * stroke;
                } else {
                    from = delta * stroke;
                    to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                }
                attr = {};
                attr["marker-" + se] = "url('" + R._url + "#" + markerId + "')";
                if (to || from) {
                    attr.d = Raphael.getSubpath(attrs.path, from, to);
                }
                $(node, attr);
                o._.arrows[se + "Path"] = pathId;
                o._.arrows[se + "Marker"] = markerId;
                o._.arrows[se + "dx"] = delta;
                o._.arrows[se + "Type"] = type;
                o._.arrows[se + "String"] = value;
            } else {
                if (isEnd) {
                    from = o._.arrows.startdx * stroke || 0;
                    to = R.getTotalLength(attrs.path) - from;
                } else {
                    from = 0;
                    to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                }
                o._.arrows[se + "Path"] && $(node, {
                    d: Raphael.getSubpath(attrs.path, from, to)
                });
                delete o._.arrows[se + "Path"];
                delete o._.arrows[se + "Marker"];
                delete o._.arrows[se + "dx"];
                delete o._.arrows[se + "Type"];
                delete o._.arrows[se + "String"];
            }
            for (attr in markerCounter)
                if (markerCounter[has](attr) && !markerCounter[attr]) {
                    var item = R._g.doc.getElementById(attr);
                    item && item.parentNode.removeChild(item);
                }
        }
    },
    dasharray = {
        "": [0],
        "none": [0],
        "-": [3, 1],
        ".": [1, 1],
        "-.": [3, 1, 1, 1],
        "-..": [3, 1, 1, 1, 1, 1],
        ". ": [1, 3],
        "- ": [4, 3],
        "--": [8, 3],
        "- .": [4, 3, 1, 3],
        "--.": [8, 3, 1, 3],
        "--..": [8, 3, 1, 3, 1, 3]
    },
    addDashes = function(o, value, params) {
        var predefValue = dasharray[Str(value).toLowerCase()];
        value = predefValue || ((value !== undefined) && [].concat(value));
        if (value) {
            var width = o.attrs["stroke-width"] || "1",
                    butt = {
                    round: width,
                    square: width,
                    butt: 0
                }[o.attrs["stroke-linecap"] || params["stroke-linecap"]] || 0,
                    i,
                    l = i = value.length;
            if (predefValue) {
                while (i--) {
                    value[i] = value[i] * width + ((i % 2) ? 1 : -1) * butt;
                }
            }
            else {
                for (i = 0; i < l; i += 2) {
                    value[i] -= butt;
                    value[i + 1] && (value[i + 1] += butt);
                    if (value[i] <= 0) {
                        value[i] = 0.1;
                    }
                }
            }
            if (R.is(value, 'array')) {
                $(o.node, {
                    "stroke-dasharray": value.join(",")
                });
            }
        }
    },
    setFillAndStroke = R._setFillAndStroke = function(o, params) {
        if (!o.paper.canvas) {
            return;
        }
        var node = o.node,
            attrs = o.attrs,
            paper = o.paper,
            s = node.style,
            vis = s.visibility;

        s.visibility = "hidden";
        for (var att in params) {
            if (params[has](att)) {
                if (!R._availableAttrs[has](att)) {
                    continue;
                }
                var value = params[att];
                attrs[att] = value;
                switch (att) {
                    case "blur":
                        o.blur(value);
                        break;
                    case "href":
                    case "title":
                    case "target":
                        var pn = node.parentNode;
                        if (pn.tagName.toLowerCase() != "a") {
                            if (value == E) { break; }
                            var hl = $("a");
                            pn.insertBefore(hl, node);
                            hl.appendChild(node);
                            pn = hl;
                        }
                        if (att == "target") {
                            pn.setAttributeNS(xlink, "show", value == "blank" ? "new" : value);
                        } else {
                            pn.setAttributeNS(xlink, att, value);
                        }
                        node.titleNode = pn;
                        break;
                    case "cursor":
                        s.cursor = value;
                        break;
                    case "transform":
                        o.transform(value);
                        break;
                    case "rotation":
                        if (R.is(value, "array")) {
                            o.rotate.apply(o, value);
                        }
                        else {
                            o.rotate(value);
                        }
                        break;
                    case "arrow-start":
                        addArrow(o, value);
                        break;
                    case "arrow-end":
                        addArrow(o, value, 1);
                        break;
                    case "clip-path":
                        var pathClip = true;
                    case "clip-rect":
                        var rect = !pathClip && Str(value).split(separator);
                        o._.clipispath = !!pathClip;
                        if (pathClip || rect.length == 4) {
                            o.clip && o.clip.parentNode.parentNode.removeChild(o.clip.parentNode);
                            var el = $("clipPath"),
                            rc = $(pathClip ? "path" : "rect");
                            el.id = R.createUUID();
                            $(rc, pathClip ? {
                                d: value ? attrs['clip-path'] = R._pathToAbsolute(value) : R._availableAttrs.path,
                                fill: 'none'
                            } : {
                                x: rect[0],
                                y: rect[1],
                                width: rect[2],
                                height: rect[3],
                                transform: o.matrix.invert()
                            });
                            el.appendChild(rc);
                            paper.defs.appendChild(el);
                            $(node, {
                                "clip-path": "url('" + R._url +"#" + el.id + "')"
                            });
                            o.clip = rc;
                        }
                        if (!value) {
                            var path = node.getAttribute("clip-path");
                            if (path) {
                                var clip = R._g.doc.getElementById(path.replace(/(^url\(#|\)$)/g, E));
                                clip && clip.parentNode.removeChild(clip);
                                $(node, {
                                    "clip-path": E
                                });
                                delete o.clip;
                            }
                        }
                        break;
                    case "path":
                        if (o.type == "path") {
                            $(node, {
                                d: value ? attrs.path = R._pathToAbsolute(value) : R._availableAttrs.path
                            });
                            o._.dirty = 1;
                            if (o._.arrows) {
                                "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                                "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                            }
                        }
                        break;
                    case "width":
                        node.setAttribute(att, value);
                        o._.dirty = 1;
                        if (attrs.fx) {
                            att = "x";
                            value = attrs.x;
                        } else {
                            break;
                        }
                    case "x":
                        if (attrs.fx) {
                            value = -attrs.x - (attrs.width || 0);
                        }
                    case "rx":
                        if (att == "rx" && o.type == "rect") {
                            break;
                        }
                    case "cx":
                        node.setAttribute(att, value);
                        o.pattern && updatePosition(o);
                        o._.dirty = 1;
                        break;
                    case "height":
                        node.setAttribute(att, value);
                        o._.dirty = 1;
                        if (attrs.fy) {
                            att = "y";
                            value = attrs.y;
                        } else {
                            break;
                        }
                    case "y":
                        if (attrs.fy) {
                            value = -attrs.y - (attrs.height || 0);
                        }
                    case "ry":
                        if (att == "ry" && o.type == "rect") {
                            break;
                        }
                    case "cy":
                        node.setAttribute(att, value);
                        o.pattern && updatePosition(o);
                        o._.dirty = 1;
                        break;
                    case "r":
                        if (o.type == "rect") {
                            $(node, {
                                rx: value,
                                ry: value
                            });
                        } else {
                            node.setAttribute(att, value);
                        }
                        o._.dirty = 1;
                        break;
                    case "src":
                        if (o.type == "image") {
                            node.setAttributeNS(xlink, "href", value);
                        }
                        break;
                    case "stroke-width":
                        if (o._.sx != 1 || o._.sy != 1) {
                            value /= mmax(abs(o._.sx), abs(o._.sy)) || 1;
                        }
                        if (paper._vbSize) {
                            value *= paper._vbSize;
                        }
                        if (zeroStrokeFix && value === 0) {
                            value = 0.000001;
                        }
                        node.setAttribute(att, value);
                        if (attrs["stroke-dasharray"]) {
                            addDashes(o, attrs["stroke-dasharray"], params);
                        }
                        if (o._.arrows) {
                            "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                            "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                        }
                        break;
                    case "stroke-dasharray":
                        addDashes(o, value, params);
                        break;
                    case "fill":
                        var isURL = Str(value).match(R._ISURL);
                        if (isURL) {
                            el = $("pattern");
                            var ig = $("image");
                            el.id = R.createUUID();
                            $(el, {
                                x: 0,
                                y: 0,
                                patternUnits: "userSpaceOnUse",
                                height: 1,
                                width: 1
                            });
                            $(ig, {
                                x: 0,
                                y: 0,
                                "xlink:href": isURL[1]
                            });
                            el.appendChild(ig);

                            (function(el) {
                                R._preload(isURL[1], function() {
                                    var w = this.offsetWidth,
                                    h = this.offsetHeight;
                                    $(el, {
                                        width: w,
                                        height: h
                                    });
                                    $(ig, {
                                        width: w,
                                        height: h
                                    });
                                    paper.safari();
                                });
                            })(el);
                            paper.defs.appendChild(el);
                            $(node, {
                                fill: "url('" + R._url + "#" + el.id + "')"
                            });
                            o.pattern = el;
                            o.pattern && updatePosition(o);
                            break;
                        }
                        var clr = R.getRGB(value);
                        if (!clr.error) {
                            delete params.gradient;
                            delete attrs.gradient;
                            !R.is(attrs.opacity, "undefined") &&
                                R.is(params.opacity, "undefined") &&
                                $(node, {
                                    opacity: attrs.opacity
                                });
                            !R.is(attrs["fill-opacity"], "undefined") &&
                                R.is(params["fill-opacity"], "undefined") &&
                                $(node, {
                                    "fill-opacity": attrs["fill-opacity"]
                                });
                        } else if ((o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value)) {
                            if ("opacity" in attrs || "fill-opacity" in attrs) {
                                var gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                                if (gradient) {
                                    var stops = gradient.getElementsByTagName("stop");
                                    $(stops[stops.length - 1], {
                                        "stop-opacity": ("opacity" in attrs ? attrs.opacity : 1) * ("fill-opacity" in attrs ? attrs["fill-opacity"] : 1)
                                    });
                                }
                            }
                            attrs.gradient = value;
                            attrs.fill = "none";
                            break;
                        }
                        if (clr[has]("opacity")) {
                            $(node, {
                                "fill-opacity": (s.fillOpacity =
                                        (clr.opacity > 1 ? clr.opacity / 100 : clr.opacity))
                            });
                            o._.opacitydirty = true;
                        }
                        else if (o._.opacitydirty && R.is(attrs['fill-opacity'], "undefined") &&
                                R.is(params["fill-opacity"], "undefined")) {
                            node.removeAttribute('fill-opacity');
                            s.fillOpacity = E;
                            delete o._.opacitydirty;
                        }
                    case "stroke":
                        clr = R.getRGB(value);
                        node.setAttribute(att, clr.hex);
                        att == "stroke" && clr[has]("opacity") && $(node, {
                            "stroke-opacity": clr.opacity > 1 ? clr.opacity / 100 : clr.opacity
                        });
                        if (att == "stroke" && o._.arrows) {
                            "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                            "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                        }
                        break;
                    case "gradient":
                        (o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value);
                        break;
                    case 'line-height': // do not apply
                    case 'vertical-align': // do not apply
                        break;
                    case "visibility":
                        value === 'hidden' ? o.hide() : o.show();
                        break;
                    case "opacity":
                        if (attrs.gradient && !attrs[has]("stroke-opacity")) {
                            $(node, {
                                "stroke-opacity": value > 1 ? value / 100 : value
                            });
                        }
                    // fall
                    case "fill-opacity":
                        if (attrs.gradient) {
                            gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                            if (gradient) {
                                stops = gradient.getElementsByTagName("stop");
                                $(stops[stops.length - 1], {
                                    "stop-opacity": value
                                });
                            }
                            break;
                        }
                    default:
                        att == "font-size" && (value = toInt(value, 10) + "px");
                        var cssrule = att.replace(/(\-.)/g, function(w) {
                            return w.substring(1).toUpperCase();
                        });
                        s[cssrule] = value;
                        o._.dirty = 1;
                        node.setAttribute(att, value);
                        break;
                }
            }
        }

        tuneText(o, params);
        s.visibility = vis;
    },
    leading = 1.2,
    tuneText = function(el, params) {
        if (el.type != "text" || !(params[has]("text") || params[has]("font") ||
                params[has]("font-size") || params[has]("x") || params[has]("y") ||
                params[has]("line-height") || params[has]("vertical-align"))) {
            return;
        }
        var a = el.attrs,
        node = el.node,
        computedStyle = node.firstChild && R._g.doc.defaultView.getComputedStyle(node.firstChild, E),
        fontSize = computedStyle ? toFloat(R._g.doc.defaultView.getComputedStyle(node.firstChild, E).getPropertyValue("font-size")) : 10,
        lineHeight = toFloat(params['line-height'] || a['line-height']) || fontSize * leading,
        valign = a[has]("vertical-align") ? a["vertical-align"] : "middle";

        if (isNaN(lineHeight)) {
            lineHeight = fontSize * leading;
        }

        valign = valign === 'top' ? -0.5 : (valign === 'bottom' ? 0.5 : 0);

        if (params[has]("text") && (params.text !== a.text || el._textdirty)) {
            a.text = params.text;
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            var texts = Str(params.text).split(/\n|<br\s*?\/?>/ig),
            tspans = [],
            tspan;
            for (var i = 0, ii = texts.length; i < ii; i++) {
                tspan = $("tspan");
                if (i) {
                    $(tspan, {
                        dy: lineHeight,
                        x: a.x
                    });
                } else {
                    $(tspan, {
                        dy: lineHeight * texts.length * valign,
                        x: a.x
                    });
                }
                if (!texts[i]) { // preserve blank lines
                    tspan.setAttributeNS("http://www.w3.org/XML/1998/namespace",
                        "xml:space","preserve");
                    texts[i] = " ";
                }
                tspan.appendChild(R._g.doc.createTextNode(texts[i]));
                node.appendChild(tspan);
                tspans[i] = tspan;
            }
            el._textdirty = false;
        } else {
            tspans = node.getElementsByTagName("tspan");
            for (i = 0, ii = tspans.length; i < ii; i++)
                if (i) {
                    $(tspans[i], {
                        dy: lineHeight,
                        x: a.x
                    });
                } else {
                    $(tspans[0], {
                        dy: lineHeight * tspans.length * valign,
                        x: a.x
                    });
                }
        }
        $(node, {
            x: a.x,
            y: a.y
        });
        el._.dirty = 1;
        var bb = el._getBBox(),
        dif = a.y - (bb.y + bb.height / 2);

        // If the bbox is calculated then we need to make additional adjustments,
        // to account for the fact that the calculated bbox already has the
        // text alignment, both horizontal and vertical, included in the calculation.
        if (bb.isCalculated) {
            switch (a['vertical-align']) {
                case "top":
                    dif = bb.height * .75;
                    break;
                case "bottom":
                    dif = - (bb.height * .25);
                    break;
                default:
                    dif = a.y - (bb.y + bb.height * .25);
                    break;
            };
        }

        dif && R.is(dif, "finite") && tspans[0] && $(tspans[0], {
            dy: dif
        });
    },
    Element = function(node, svg, group) {
        var o = this,
            parent = group || svg;

        o.node = o[0] = node;
        node.raphael = true;
        node.raphaelid = o.id = R._oid++;

        o.matrix = R.matrix();
        o.realPath = null;

        o.attrs = o.attrs || {};
        o.styles = o.styles || {};
        o.followers = o.followers || [];

        o.paper = svg;
        o.ca = o.customAttributes = o.customAttributes ||
            new svg._CustomAttributes();

        o._ = {
            transform: [],
            sx: 1,
            sy: 1,
            deg: 0,
            dx: 0,
            dy: 0,
            dirty: 1
        };

        o.parent = parent;
        !parent.bottom && (parent.bottom = o);

        o.prev = parent.top;
        parent.top && (parent.top.next = o);
        parent.top = o;
        o.next = null;
    },
    elproto = R.el;

    Element.prototype = elproto;
    elproto.constructor = Element;

    R._engine.getNode = function (el) {
        var node = el.node || el[0].node;
        return node.titleNode || node;
    };
    R._engine.getLastNode = function (el) {
        var node = el.node || el[el.length - 1].node;
        return node.titleNode || node;
    };

    R._engine.path = function(pathString, SVG, group) {
        var el = $("path");

        (group && group.canvas && group.canvas.appendChild(el)) ||
        (SVG.canvas && SVG.canvas.appendChild(el));

        var p = new Element(el, SVG, group);
        p.type = "path";
        setFillAndStroke(p, {
            fill: "none",
            stroke: "#000",
            path: pathString
        });
        return p;
    };

    elproto.rotate = function(deg, cx, cy) {
        var o = this,
            bbox;
        if (o.removed) {
            return o;
        }
        deg = Str(deg).split(separator);
        if (deg.length - 1) {
            cx = toFloat(deg[1]);
            cy = toFloat(deg[2]);
        }
        deg = toFloat(deg[0]);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            bbox = o.getBBox(1);
            cx = bbox.x + bbox.width / 2;
            cy = bbox.y + bbox.height / 2;
        }
        o.transform(o._.transform.concat([["r", deg, cx, cy]]));
        return o;
    };

    elproto.scale = function(sx, sy, cx, cy) {
        var o = this,
            bbox;
        if (o.removed) {
            return o;
        }
        sx = Str(sx).split(separator);
        if (sx.length - 1) {
            sy = toFloat(sx[1]);
            cx = toFloat(sx[2]);
            cy = toFloat(sx[3]);
        }
        sx = toFloat(sx[0]);
        (sy == null) && (sy = sx);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            bbox = o.getBBox(1);
        }
        cx = cx == null ? bbox.x + bbox.width / 2 : cx;
        cy = cy == null ? bbox.y + bbox.height / 2 : cy;
        o.transform(o._.transform.concat([["s", sx, sy, cx, cy]]));
        return o;
    };

    elproto.translate = function(dx, dy) {
        var o = this;
        if (o.removed) {
            return o;
        }
        dx = Str(dx).split(separator);
        if (dx.length - 1) {
            dy = toFloat(dx[1]);
        }
        dx = toFloat(dx[0]) || 0;
        dy = +dy || 0;
        o.transform(o._.transform.concat([["t", dx, dy]]));
        return o;
    };

    elproto.transform = function(tstr) {
        var o = this,
            _ = o._,
            sw;

        if (tstr == null) {
            return _.transform;
        }
        R._extractTransform(o, tstr);

        o.clip && !_.clipispath && $(o.clip, {
            transform: o.matrix.invert()
        });
        o.pattern && updatePosition(o);
        o.node && $(o.node, {
            transform: o.matrix
        });

        if (_.sx != 1 || _.sy != 1) {
            sw = o.attrs[has]("stroke-width") ? o.attrs["stroke-width"] : 1;
            o.attr({
                "stroke-width": sw
            });
        }

        return o;
    };

    elproto.hide = function() {
        var o = this;
        !o.removed && o.paper.safari(o.node.style.display = "none");
        return o;
    };

    elproto.show = function() {
        var o = this;
        !o.removed && o.paper.safari(o.node.style.display = E);
        return o;
    };

    elproto.remove = function() {
        if (this.removed || !this.parent.canvas) {
            return;
        }

        var o = this,
            node = R._engine.getNode(o),
            paper = o.paper,
            defs = paper.defs,
            i;


        paper.__set__ && paper.__set__.exclude(o);
        eve.unbind("raphael.*.*." + o.id);

        if (o.gradient && defs) {
            defs.removeChild(o.gradient);
        }
        while (i = o.followers.pop()) {
            i.el.remove();
        }
        o.parent.canvas.removeChild(node);
        R._tear(o, paper);
        for (i in o) {
            o[i] = typeof o[i] === "function" ? R._removedFactory(i) : null;
        }
        o.removed = true;
    };
    elproto._getBBox = function() {
        var o = this,
            node = o.node,
            bbox = {},
            a = o.attrs,
            align,
            hide;

        if (node.style.display === "none") {
            o.show();
            hide = true;
        }

        try {
            bbox = node.getBBox();

            if (o.type == "text") {
                // If bbox does not have x / y, which is possible in certain
                // environments, we mathematically calculate these values by
                // using x, y (adjusted using the values of text-anchor, and
                // vertical-align attributes), of the element along with the
                // width and height provided by the getBBox().
                if (bbox.x === undefined) {
                    bbox.isCalculated = true;
                    align = a['text-anchor'];
                    bbox.x = (a.x || 0) - (bbox.width * ((align === "start") ?
                        0 : (align === "middle") ? 0.5 : 1));
                }

                if (bbox.y === undefined) {
                    bbox.isCalculated = true;
                    align = a['vertical-align'];
                    bbox.y = (a.y || 0) - (bbox.height * ((align === "bottom") ?
                        1 : (align === "middle") ? 0.5 : 0));
                }
            }

        } catch (e) {
        // Firefox 3.0.x plays badly here
        } finally {
            bbox = bbox || {};
        }
        hide && o.hide();
        return bbox;
    };

    elproto.css = function (name, value) {
        // do not parse css in case element is removed.
        if (this.removed) {
            return this;
        }

        // process as getter when a single key is sent as parameter.
        if (value == null && R.is(name, "string")) {
            var names = name.split(separator),
            out = {};
            for (var i = 0, ii = names.length; i < ii; i++) {
                name = names[i];
                if (name in this.styles) {
                    out[name] = this.styles[name];
                }
            }
            return ii - 1 ? out : out[names[0]];
        }
        // process as getter when multiple keys are pre-sent as array.
        if (value == null && R.is(name, "array")) {
            out = {};
            for (i = 0, ii = name.length; i < ii; i++) {
                out[name[i]] = this.styles(name[i]);
            }
            return out;
        }
        // convert single key-value setter into object style standard.
        if (value != null) {
            var params = {};
            params[name] = value;
        } else if (name != null && R.is(name, "object")) {
            params = name;
        }
        // iterate on keys and set style or raise events.
        var otherkey, doattrs = {};
        for (var key in params) {
            otherkey = key.replace(/\B([A-Z]{1})/g, "-$1").toLowerCase();

            // If keys are supported via attr then use attr instead of css.
            if (R._availableAttrs[has](otherkey) || otherkey === 'color') {
                // Replace "color" with fill
                (otherkey === 'color' && this.type === 'text') && (otherkey = 'fill');

                doattrs[otherkey] = params[key];
                doattrs.dirty = true;
                continue;
            }
            eve("raphael.css." + otherkey + "." + this.id, this, params[key], otherkey);
            this.node.style[otherkey] = params[key];
            this.styles[otherkey] = params[key];
        }
        // run on followers
        for (i = 0, ii = this.followers.length; i < ii; i++) {
            this.followers[i].el.css(params);
        }
        // apply css via attrs
        if (doattrs[has]("dirty")) {
            delete doattrs.dirty;
            this.attr(doattrs);
        }
        return this;
    };

    elproto.attr = function(name, value) {
        if (this.removed) {
            return this;
        }
        if (name == null) {
            var res = {};
            for (var a in this.attrs)
                if (this.attrs[has](a)) {
                    res[a] = this.attrs[a];
                }
            res.gradient && res.fill == "none" && (res.fill = res.gradient) && delete res.gradient;
            res.transform = this._.transform;
            res.visibility = this.node.style.display === "none" ? "hidden" : "visible";
            return res;
        }
        if (value == null && R.is(name, "string")) {
            if (name == "fill" && this.attrs.fill == "none" && this.attrs.gradient) {
                return this.attrs.gradient;
            }
            if (name == "transform") {
                return this._.transform;
            }
            if (name == "visibility") {
                return this.node.style.display === "none" ? "hidden" : "visible";
            }
            var names = name.split(separator),
            out = {};
            for (var i = 0, ii = names.length; i < ii; i++) {
                name = names[i];
                if (name in this.attrs) {
                    out[name] = this.attrs[name];
                } else if (R.is(this.ca[name], "function")) {
                    out[name] = this.ca[name].def;
                } else {
                    out[name] = R._availableAttrs[name];
                }
            }
            return ii - 1 ? out : out[names[0]];
        }
        if (value == null && R.is(name, "array")) {
            out = {};
            for (i = 0, ii = name.length; i < ii; i++) {
                out[name[i]] = this.attr(name[i]);
            }
            return out;
        }
        if (value != null) {
            var params = {};
            params[name] = value;
        } else if (name != null && R.is(name, "object")) {
            params = name;
        }
        for (var key in params) {
            eve("raphael.attr." + key + "." + this.id, this, params[key], key);
        }
        var todel = {};
        for (key in this.ca) {
            if (this.ca[key] && params[has](key) && R.is(this.ca[key], "function") && !this.ca['_invoked' + key]) {

                this.ca['_invoked'+key] = true; // prevent recursion
                var par = this.ca[key].apply(this, [].concat(params[key]));
                delete this.ca['_invoked'+key];

                for (var subkey in par) {
                    if (par[has](subkey)) {
                         params[subkey] = par[subkey];
                    }
                }
                this.attrs[key] = params[key];
                if (par === false) {
                    todel[key] = params[key];
                    delete params[key];
                }
            }
        }

        setFillAndStroke(this, params);

        var follower;
        for (i = 0, ii = this.followers.length; i < ii; i++) {
            follower = this.followers[i];
            (follower.cb && !follower.cb.call(follower.el, params, this)) ||
                follower.el.attr(params);
        }

        for (subkey in todel) {
            params[subkey] = todel[subkey];
        }
        return this;
    };

    elproto.blur = function(size) {
        // Experimental. No Safari support. Use it on your own risk.
        var t = this;
        if (+size !== 0) {
            var fltr = $("filter"),
            blur = $("feGaussianBlur");
            t.attrs.blur = size;
            fltr.id = R.createUUID();
            $(blur, {
                stdDeviation: +size || 1.5
            });
            fltr.appendChild(blur);
            t.paper.defs.appendChild(fltr);
            t._blur = fltr;
            $(t.node, {
                filter: "url('" + R._url + "#" + fltr.id + "')"
            });
        } else {
            if (t._blur) {
                t._blur.parentNode.removeChild(t._blur);
                delete t._blur;
                delete t.attrs.blur;
            }
            t.node.removeAttribute("filter");
        }
    };

    elproto.on = function(eventType, handler) {
        if (this.removed) {
            return this;
        }

        var fn = handler;
        if (R.supportsTouch) {
            eventType = R._touchMap[eventType] ||
                (eventType === 'click' && 'touchstart') || eventType;
            fn = function(e) {
                e.preventDefault();
                handler();
            };
        }
        this.node['on'+ eventType] = fn;
        return this;
    };


    R._engine.group = function(svg, id, group) {
        var el = $("g");
        (group && group.canvas && group.canvas.appendChild(el)) ||
        (svg.canvas && svg.canvas.appendChild(el));

        var g = new Element(el, svg, group);
        g.type = "group";
        g.canvas = g.node;
        g.top = null;
        g.bottom = null;
        id && el.setAttribute('class', ['red', id, g.id].join('-'));

        return g;
    };

    R._engine.circle = function(svg, x, y, r, group) {
        var el = $("circle");
        (group && group.canvas && group.canvas.appendChild(el)) ||
        (svg.canvas && svg.canvas.appendChild(el));

        var res = new Element(el, svg, group);
        res.attrs = {
            cx: x,
            cy: y,
            r: r,
            fill: "none",
            stroke: "#000"
        };
        res.type = "circle";
        $(el, res.attrs);
        return res;
    };
    R._engine.rect = function(svg, x, y, w, h, r, group) {
        var el = $("rect");
        (group && group.canvas && group.canvas.appendChild(el)) ||
        (svg.canvas && svg.canvas.appendChild(el));

        var res = new Element(el, svg, group);
        res.attrs = {
            x: x,
            y: y,
            width: w,
            height: h,
            r: r || 0,
            rx: r || 0,
            ry: r || 0,
            fill: "none",
            stroke: "#000"
        };
        res.type = "rect";
        $(el, res.attrs);
        return res;
    };
    R._engine.ellipse = function(svg, x, y, rx, ry, group) {
        var el = $("ellipse");
        (group && group.canvas && group.canvas.appendChild(el)) ||
        (svg.canvas && svg.canvas.appendChild(el));

        var res = new Element(el, svg, group);
        res.attrs = {
            cx: x,
            cy: y,
            rx: rx,
            ry: ry,
            fill: "none",
            stroke: "#000"
        };
        res.type = "ellipse";
        $(el, res.attrs);
        return res;
    };
    R._engine.image = function(svg, src, x, y, w, h, group) {
        var el = $("image");
        $(el, {
            x: x,
            y: y,
            width: w,
            height: h,
            preserveAspectRatio: "none"
        });
        el.setAttributeNS(xlink, "href", src);
        (group && group.canvas && group.canvas.appendChild(el)) ||
        (svg.canvas && svg.canvas.appendChild(el));

        var res = new Element(el, svg, group);
        res.attrs = {
            x: x,
            y: y,
            width: w,
            height: h,
            src: src
        };
        res.type = "image";
        return res;
    };
    R._engine.text = function(svg, x, y, text, group) {
        var el = $("text");
        (group && group.canvas && group.canvas.appendChild(el)) ||
        (svg.canvas && svg.canvas.appendChild(el));

        var res = new Element(el, svg, group);
        res.attrs = {
            x: x,
            y: y,
            "text-anchor": "middle",
            "vertical-align": "middle",
            text: text,
            //font: R._availableAttrs.font,
            stroke: "none",
            fill: "#000"
        };
        res.type = "text";
        res._textdirty = true;
        setFillAndStroke(res, res.attrs);
        return res;
    };
    /* @diffend */

    R._engine.setSize = function(width, height) {
        this.width = width || this.width;
        this.height = height || this.height;
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
        if (this._viewBox) {
            this.setViewBox.apply(this, this._viewBox);
        }
        return this;
    };
    R._engine.create = function() {
        var con = R._getContainer.apply(0, arguments),
        container = con && con.container,
        x = con.x,
        y = con.y,
        width = con.width,
        height = con.height;
        if (!container) {
            throw new Error("SVG container not found.");
        }
        var cnvs = $("svg"),
        css = "overflow:hidden;-webkit-tap-highlight-color:rgba(0,0,0,0);"+
            "-webkit-user-select:none;-moz-user-select:-moz-none;-khtml-user-select:none;"+
            "-ms-user-select:none;user-select:none;-o-user-select:none;cursor:default;",
        isFloating;
        x = x || 0;
        y = y || 0;
        width = width || 512;
        height = height || 342;
        $(cnvs, {
            height: height,
            version: 1.1,
            width: width,
            xmlns: "http://www.w3.org/2000/svg"
        });
        if (container == 1) {
            cnvs.style.cssText = css + "position:absolute;left:" + x + "px;top:" + y + "px";
            R._g.doc.body.appendChild(cnvs);
            isFloating = 1;
        } else {
            cnvs.style.cssText = css + "position:relative";
            if (container.firstChild) {
                container.insertBefore(cnvs, container.firstChild);
            } else {
                container.appendChild(cnvs);
            }
        }
        container = new R._Paper;
        container.width = width;
        container.height = height;
        container.canvas = cnvs;
        container.clear();
        container._left = container._top = 0;
        isFloating && (container.renderfix = function() {
            });
        container.renderfix();
        return container;
    };
    R._engine.setViewBox = function(x, y, w, h, fit) {
        eve("raphael.setViewBox", this, this._viewBox, [x, y, w, h, fit]);
        var size = mmax(w / this.width, h / this.height),
        top = this.top,
        aspectRatio = fit ? "meet" : "xMinYMin",
        vb,
        sw;
        if (x == null) {
            if (this._vbSize) {
                size = 1;
            }
            delete this._vbSize;
            vb = "0 0 " + this.width + S + this.height;
        } else {
            this._vbSize = size;
            vb = x + S + y + S + w + S + h;
        }
        $(this.canvas, {
            viewBox: vb,
            preserveAspectRatio: aspectRatio
        });
        while (size && top) {
            sw = "stroke-width" in top.attrs ? top.attrs["stroke-width"] : 1;
            top.attr({
                "stroke-width": sw
            });
            top._.dirty = 1;
            top._.dirtyT = 1;
            top = top.prev;
        }
        this._viewBox = [x, y, w, h, !!fit];
        return this;
    };

    R.prototype.renderfix = function() {
        var cnvs = this.canvas,
        s = cnvs.style,
        pos;
        try {
            pos = cnvs.getScreenCTM() || cnvs.createSVGMatrix();
        } catch (e) {
            pos = cnvs.createSVGMatrix();
        }
        var left = -pos.e % 1,
        top = - pos.f % 1;
        if (left || top) {
            if (left) {
                this._left = (this._left + left) % 1;
                s.left = this._left + "px";
            }
            if (top) {
                this._top = (this._top + top) % 1;
                s.top = this._top + "px";
            }
        }
    };

    R.prototype.clear = function() {
        eve("raphael.clear", this);
        var c = this.canvas;
        while (c.firstChild) {
            c.removeChild(c.firstChild);
        }
        this.bottom = this.top = null;
        (this.desc = $("desc")).appendChild(R._g.doc.createTextNode(R.is(R.desc, "string") && R.desc ||
            "Created with Red Rapha\xebl " + R.version));
        c.appendChild(this.desc);
        c.appendChild(this.defs = $("defs"));
    };

    R.prototype.remove = function() {
        eve("raphael.remove", this);
        this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        this.removed = true;
    };
    var setproto = R.st;
    for (var method in elproto)
        if (elproto[has](method) && !setproto[has](method)) {
            setproto[method] = (function(methodname) {
                return function() {
                    var arg = arguments;
                    return this.forEach(function(el) {
                        el[methodname].apply(el, arg);
                    });
                };
            })(method);
        }
}(window.Raphael);
