/* global window */
window.Raphael && (window.Raphael.define && function (R) {
    var win = R._g.win,

        math = win.Math,
        mathSqrt = math.sqrt,
        toFloat = win.parseFloat,
        toInt = win.parseInt,

        EMP = "", // empty string
        SPC = " ", // white-space
        NONE = "none",
        ROUND = "round",
        STROKE_WIDTH = "stroke-width",
        DROP_SHADOW = "drop-shadow",
        BLACK = "rgba(0,0,0,1)",

        hasSVGFilters = win.SVGFilterElement  || (win.SVGFEColorMatrixElement &&
            win.SVGFEColorMatrixElement.SVG_FECOLORMATRIX_TYPE_SATURATE === 2),

        createNode = R._createNode;

    if (R.svg) {

        // Browsers that support SVG filters needs filters to not just be
        // created, but managed as well. This is done so that multiple elements
        // can share same filter definition.
        if (hasSVGFilters) {

            R.el.dropshadow = function (dx, dy, spread, color) {
                var o = this,
                    node = o.node,
                    shadow = o._.shadowFilter,
                    cache = o.paper.cacheShadows || (o.paper.cacheShadows = {}),
                    hash = DROP_SHADOW + [dx, dy, spread, color].join(SPC),
                    prop,
                    filter,
                    opacity,
                    el;

                if (dx === NONE) {
                    if (shadow) {
                        shadow.use -= 1; // dereference
                        o.node.removeAttribute("filter");

                        // In case there is no remainig reference
                        // for the shadow, we need to remove the
                        // element in use.
                        if (!shadow.use) {
                            hash = shadow.hash; // retain hash
                            for (prop in shadow) {
                                el = shadow[prop];
                                if (el.parentNode) {
                                    el.parentNode.removeChild(el);
                                }
                                delete shadow[prop];
                            }
                            // Cleanup
                            el = null;
                            delete cache[hash];
                        }
                        // Cleanup
                        shadow = null;
                        delete o._.shadowFilter;
                    }
                }
                // In case of a valid value and shadow is yet to be
                // defined then create one.
                else if (!(shadow && cache[hash] === shadow)) {
                    filter = o.paper.defs.appendChild(createNode('filter', {
                        id: R.createUUID(),
                        width: "200%",
                        height: "200%"
                    }));
                    color = R.color(color);
                    if (color.error) {
                        color = R.color(BLACK);
                    }
                    opacity = R.pick(color.opacity, 1);

                    // Create the filters that are required to give shadow
                    // effect on an element.
                    shadow = o._.shadowFilter = cache[hash] = {
                        use: 1,
                        filter: filter,
                        hash: hash,
                        offset: filter.appendChild(createNode('feOffset', {
                            result: "offOut",
                            "in": "SourceGraphic",
                            dx: toFloat(dx),
                            dy: toFloat(dy)
                        })),
                        matrix: filter.appendChild(createNode('feColorMatrix', {
                            result: "matrixOut",
                            "in": "offOut",
                            type: "matrix",
                            // remove all colors and add specified color
                            // retain original alpha channel to avoid feOffset
                            // being overridden
                            values: "0 0 0 0 " + color.r / 255 +
                                    " 0 0 0 0 " + color.g / 255 +
                                    " 0 0 0 0 " + color.b / 255 +
                                    " 0 0 0 " + opacity + " 0"
                        })),
                        blur: filter.appendChild(createNode("feGaussianBlur", {
                            result: "blurOut",
                            "in": "matrixOut",
                            stdDeviation: mathSqrt(toFloat(spread))
                        })),
                        blend: filter.appendChild(createNode("feComposite", {
                            "in": "SourceGraphic",
                            in2: "blurOut",
                            operator: "over"
                        }))
                    };

                    node.setAttribute('filter',
                        "url('" + R._url + "#" + filter.id + "')");
                }

                return this;
            };
        }

        var forbiddenAttrs = {
            'drop-shadow': 'drop-shadow',
            'stroke': 'stroke',
            'fill': 'fill',
            'stroke-width': 'stroke-width',
            'stroke-opacity': 'stroke-opacity',
            'stroke-linecap': 'stroke-linecap',
            'stroke-linejoin': 'stroke-linejoin',
            'shape-rendering': 'shape-rendering',
            'transform': 'transform'
        };

        supervisor = function (params, leader) {
            var o = this,
                scale = o.__shadowscale,
                del = {},
                matrix,
                key;

            for (var key in params) {
                if (forbiddenAttrs[key]) {
                    del[key] = params[key];
                    delete params[key];
                }
                switch (key) {
                    case "transform":
                        matrix = leader.matrix.clone();
                        matrix.translate(o.__shadowx, o.__shadowy);
                        o.transform(matrix.toTransformString());
                    break;
                    case STROKE_WIDTH:
                        params[key] = ((del[key] || 1) + 6 - 2 * o.__shadowlevel) * scale;
                    break;
                }
            }
            o.attr(params);
            for (var key in del) {
                params[key] = del[key];
            }

        };

        R.ca[DROP_SHADOW] = function (offX, offY, spread, color, scale, group) {
            var o = this,
                node = o.node,
                shadows = o._.shadows || (o._.shadows = []),
                opacity,
                shadow,
                offset,
                matrix,
                style,
                i;

            if (o.__shadowblocked) {
                return false;
            }
            else if (offX === NONE) {
                while (shadow = shadows.pop()) {
                    shadow.remove();
                }
            }
            else {
                color = R.color(color);
                if (color.error) {
                    color = R.color(BLACK);
                }

                if (scale instanceof Array) {
                    tScale = scale[0];
                    strScale = scale[1];
                }
                else {
                    tScale = strScale = scale;
                }

                var tScale = 1 / R.pick(tScale, 1),
                strScale = 1 / R.pick(strScale, 1);

                offX = R.pick(offX, 1) * tScale;
                offY = R.pick(offY, 1) * tScale;
                opacity = R.pick(color.opacity, 1) * 0.05;
                offset = toInt(o.attr(STROKE_WIDTH) || 1, 10) + 6;
                matrix = o.matrix.clone();
                matrix.translate(offX, offY);

                for (i = 1; i <= 3; i++) {
                    shadow = (shadows[i - 1] || o.clone()
                            .follow(o, supervisor, !group && 'before')).attr({
                        'stroke': color.hex,
                        'stroke-opacity': opacity * i,
                        'stroke-width':  (offset - 2 * i) * strScale,
                        'transform': matrix.toTransformString(),
                        'stroke-linecap': ROUND,
                        'stroke-linejoin': ROUND,
                        'fill': NONE
                    });

                    shadow.__shadowlevel = i;
                    shadow.__shadowscale = strScale;
                    shadow.__shadowx = offX;
                    shadow.__shadowy = offY;
                    group && group.appendChild(shadow);

                    shadows.push(shadow);
                }

            }

            return false;
        };


       /**
        * Add or remove a shadow composition to the element.
        *
        * @param {Boolean} apply
        * @param {Number} opacity
        */
        R.el.shadow = function (apply, opacity, scale, group) {

            var useFilter;

            // allow alternative polymorphism in last two parameters
            if (scale && scale.constructor === R.el.constructor) {
                group = scale;
                scale = undefined;
            }

            // In case the parameter is provided in object style then expand it
            if (typeof apply === 'object') {
                opacity && opacity.constructor === R.el.constructor && (group = opacity);
                opacity = apply.opacity;
                scale = apply.scalefactor;
                useFilter = !!apply.useFilter;
                apply = (apply.apply === undefined) ? !!opacity : apply.apply;
            }

            // In case opacity is undefined, set it to full.
            (opacity === undefined) && (opacity = 1);

            // Check if filter based shadow needs some modification or not.
            if (this.dropshadow) {
                if (useFilter) {
                    apply && this.dropshadow(1, 1, 3, 'rgb(64,64,64)') ||
                            this.dropshadow(NONE);
                    return this;
                }
                else if (this._.shadowFilter) {
                    this.dropshadow(NONE);
                }
            }

            return this.attr(DROP_SHADOW, apply ?
                    [1, 1, 3, 'rgba(64,64,64,' + (opacity) + ')', scale, group] : NONE);

        };
    }

    // For VML based browsers, there is a single implementation across IE 6-8.
    // As such, it requires only a single implementation.
    else if (R.vml) {

        R.ca['drop-shadow'] = function (offX, offY, spread, color, scale, group) {
            var o = this,
                shadow = o._.shadow,
                style,
                filter,
                opacity;

            // do not apply shadow on shadow!
            if (o.isShadow) {
                return false;
            }

            if (offX === NONE) {
                shadow && (shadow = o._.shadow = shadow.remove());
            }
            else {
                if (!shadow) {

                    shadow = o._.shadow = o.clone();
                    // while adding to separate shadow group, we cannot mark the
                    // shadow as stalker as that would break the shadow away from
                    // shadow group and insert it before the main element.
                    group &&
                        group.appendChild(shadow.follow(o)) ||
                        shadow.follow(o, undefined, 'before');

                    shadow.attr({
                        fill: 'none',
                        'fill-opacity': 0.5,
                        'stroke-opacity': 1
                    }).isShadow = true;

                    if (shadow.attr(STROKE_WIDTH) <= 0) {
                        shadow.attr(STROKE_WIDTH, 1);
                    }
                }

                style = shadow.node.runtimeStyle;
                filter = style.filter.replace(/ progid:\S+Blur\([^\)]+\)/g, EMP);

                color = R.color(color);
                if (color.error) {
                    color = R.color(BLACK);
                }
                opacity = R.pick(color.opacity, 1) / 5;

                if (scale instanceof Array) {
                    tScale = scale[0];
                }
                else {
                    tScale = scale;
                }

                var tScale = 1 / R.pick(scale, 1);

                offX = R.pick(offX, 1) * tScale;
                offY = R.pick(offY, 1) * tScale;

                shadow.translate(offX, offY);
                style.filter = filter +
                    " progid:DXImageTransform.Microsoft.Blur(pixelRadius=" +
                    toFloat(spread * .4) + " makeShadow=True Color=" +
                    color.hex + " shadowOpacity='" + opacity + "');";
            }

            return false;
        };

        /**
         * Add or remove a shadow composition to the element.
         *
         * @param {Boolean} apply
         * @param {Number} opacity
         */
        R.el.shadow = function (apply, opacity, scale, group) {
            var o = this;

            // allow alternative polymorphism in last two parameters
            if (scale && scale.constructor === R.el.constructor) {
                group = scale;
                scale = undefined;
            }

            // In case the parameter is provided in object style then expand it
            if (typeof apply === 'object') {
                opacity && opacity.type === 'group' && (group = opacity);
                opacity = apply.opacity;
                scale = apply.scalefactor;
                apply = apply.apply === undefined ? !!opacity : apply.apply;
            }

            // In case opacity is undefined, set it to full.
            (opacity === undefined) && (opacity = 1);

            return o.attr(DROP_SHADOW, apply || !opacity ?
                [1, 1, 5, 'rgba(64,64,64,' + (opacity) + ')', scale, group] : NONE);

        };
    }
    else if (R.canvas) {
        R.el.shadow = function () {
            return this;
        };
    }


})(window.Raphael);