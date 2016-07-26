;
(function ($) {
    /**
     * Константы, описывающие направление прогресса
     * @type Object
     */
    var pbDirection = {
        PB_DIRECT_LEFT_TO_RIGHT: 'lr', //слева-направо
        PB_DIRECT_RIGHT_TO_LEFT: 'rl', //справа-налево
        PB_DIRECT_BOTTOM_TO_TOP: 'bt', //снизу-вверх
        PB_DIRECT_TOP_TO_BOTTOM: 'tb'   //сверху-вниз
    };
    var pbDirectSet = {
        lr: ['left', 'right'],
        rl: ['right', 'left'],
        tb: ['top', 'bottom'],
        bt: ['bottom', 'top']
    };
    mfProgressBar = function (params) {
        this.init(params);
        return this;
    };
    mfProgressBar.prototype = {
        element: null,
        progress: null,
        progressDuration: 1000,
        progressMon: null,
        /**
         * @var {boolean} showNumericPos
         * Флаг. Указывает, нужно ли в прогрессе показывать числовое значение.
         * @default true
         */
        showNumericPos: true,
        /**
         * @var {boolean} animatePosition
         * Флаг. Указывает, нужно ли анимировать прогресс. 
         * Если false, позиция будет устанавливаться без анимации.
         * @default true
         */
        animatePosition: true,
        /**
         * @var {integer} precission 
         * Количество знаков в дроби числового индикатора.
         * @default 0
         */
        precission: 0,
        /**
         * @var {string} direction Направление прогресса.
         * Может быть lr (слева-направо), rl (справа-налево), 
         * tb (сверху-вниз), bt (снизу-вверх)
         * Описаны "константами" в классе pbDirection.
         * @default 'lr'
         */
        direction: pbDirection.PB_DIRECT_LEFT_TO_RIGHT,
        _beginDirect: 'left',
        _endDirect: 'right',
        /**
         * @var float Положение в процентах
         */
        value: 0,
        background: null,
        init: function (params) {
            try {
                $.extend(true, this, params);
                this.$el = $(this.element);
                this.element.owner = this;
                if ('style' in params)
                    this.element.style.cssText = params.style;
                if (this.$el.css('position') === 'static')
                    this.$el.css('position', 'relative');
                this.progress = $('<div></div>').css({
                    position: 'absolute'
                }).appendTo(this.element);
                this.progress.css(this._beginDirect, 0);
                this.background = new backgroundClass();
                this.background.owner = this;
                $.extend(this.background, params.background);
                this.progressMon = $('<span></span>').css({position: 'relative'}).appendTo(this.progress);
                this.direct(this.direction);
                if ('background' in params && params.background.animated)
                    this.animateBack(true);
                else
                    this.animateBack(false);
                return this;
            } catch (e) {
                console.warn(e);
            }
        },
        /**
         * Возвращает контейнер
         * @returns {mfProgressBar.element}
         */
        getElement: function () {
            return this.element;
        },
        /**
         * Устанавливает CSS-стиль контейнера.
         * Строка CSS.
         * @param {string} style
         * @returns {mfProgressBar}
         */
        setStyle: function (style) {
            this.$el.css(style);
            return this;
        },
        /**
         * Устанавливает и возвращает количество разрядов после запятой 
         * в индикаторе процентов.
         * @param {integer} val
         * @returns {integer* mfProgressBar.precission} 
         */
        doPrecission: function (val) {
            if (arguments.length) {
                try {
                    this.precission = parseInt(val);
                } catch (e) {
                    this.precission = 0;
                }
            } else {
                return this.precission;
            }
            this.pr(this.value);
            return this.precission;
        },
        /**
         * Устанавливает и возвращает флаг анимации прогресса.
         * Если false, прогресс устанавливается дискретно.
         * @default true
         * @param {Boolean} val
         * @returns {Boolean* mfProgressBar.animatePosition}
         */
        doAnimatePosition: function (val) {
            if (arguments.length) {
                try {
                    if (typeof val === 'boolean') {
                        this.animatePosition = val;
                    }
                } catch (e) {
                    this.animatePosition = true;
                }
                return this.animatePosition;
            } else {
                return this.animatePosition;
            }
        },
        /**
         * Устанавливает и возвращает позицию прогресса в процентах.
         * Значение duration опционально. Учтанавливает значение mfProgressBar.progressDuration.
         * @param {float range [0..100]} val
         * @param {integer} duration
         * @returns {float mfProgressBar.value}
         */
        position: function (val, duration) {
            try {
                if (typeof val !== 'number' || val < 0 || val > 100) {
                    val = 0;
                }
                if (typeof duration === 'number')
                    this.progressDuration = duration;
                if (typeof val === 'number') {
                    if (this.animatePosition) {
                        this.goTo(parseFloat(val), this.progressDuration);
                    } else {
                        this.value = parseFloat(val);
                        this.goTo(this.value, this.progressDuration);
                    }
                    $(this).trigger('changePos', this.value);
                    return this.value;
                } else {
                    return parseFloat(this.value);
                }
            } catch (e) {

            }
        },
        goTo: function (val, duration) {
            var _this = this;
            var _spos = this.value;
            val = parseFloat(val);
            if (this.animatePosition) {
                var _diff = val - parseFloat(this.value);
                this.progress.stop();
                var d = {};
                d[this._endDirect] = this._percentToPx(val);
                this.progress.animate(d, {
                    queue: false,
                    duration: duration,
                    progress: function (a, p, r) {
                        _this.value = _spos + (_diff * p);
                        _this.pr(_this.value);
                    },
                    done: function () {
                        _this.pr(_this.value);
                    }
                });
            } else {
                this.progress.get(0).style[this._endDirect] = this._percentToPx(val);
                this.pr(this.value);
            }
            return this;
        },
        pr: function (v) {
            if (this.showNumericPos) {
                var pow = this.precission > 0 ? Math.pow(10, this.precission) : 1;
                var text = (Math.floor(v * pow) / pow).toFixed(this.precission) + '%';
                this.progressMon.html(text);
                this.monPos();
            }
        },
        /**
         * Пересчитывает позцию индикатора в процентах в положении в пикселях.
         * @param {float} percent 
         * @returns {float}
         */
        _percentToPx: function (percent) {
            if (this._isHorizontal())
                var v = this.$el.width();
            if (this._isVertical())
                var v = this.$el.height();
            return v - (v / 100 * percent) + 'px';
        },
        _isVertical: function () {
            return this.direction === pbDirection.PB_DIRECT_BOTTOM_TO_TOP || this.direction === pbDirection.PB_DIRECT_TOP_TO_BOTTOM;
        },
        _isHorizontal: function () {
            return this.direction === pbDirection.PB_DIRECT_LEFT_TO_RIGHT || this.direction === pbDirection.PB_DIRECT_RIGHT_TO_LEFT;
        },
        direct: function (direct) {
            try {
                if (direct) {
                    this.direction = direct;
                    this._beginDirect = pbDirectSet[this.direction][0];
                    this._endDirect = pbDirectSet[this.direction][1];
                    this.$el.removeClass('horizontal vertical');
                    this.progress.get(0).style.top = "";
                    this.progress.get(0).style.right = "";
                    this.progress.get(0).style.bottom = "";
                    this.progress.get(0).style.left = "";
                    if (this._isHorizontal()) {
                        this.$el.addClass('horizontal');
                    }
                    if (this._isVertical()) {
                        this.$el.addClass('vertical');
                    }
                    this.progress.get(0).style[this._beginDirect] = 0;
                    this.position(this.value);
                    this.animateBack(this.background.animated);
                    return this;
                } else {
                    return this.direction;
                }
            } catch (e) {
                console.dir(e);
            }
        },
        monPos: function () {
            var x = (this.progress.width() / 2) - (this.progressMon.width() / 2);
            var y = (this.progress.height() / 2) - (this.progressMon.height() / 2);
            this.progressMon.get(0).style.left = x + 'px';
            this.progressMon.get(0).style.top = y + 'px';
        },
        animateBack: function (val) {
            if (arguments.length) {
                try {
                    switch (val) {
                        case true:
                            return this.background.animateOn();
                            break;
                        case false:
                            return this.background.animateOff();
                            break;
                    }
                } catch (e) {
                    return this.background.animateOff();
                }
            } else {
                return this.background.animated;
            }
        }
    };
    var backgroundClass = function () {
        return {
            /**
             * @var {mfProgressBar}
             */
            owner: null,
            hndl: null,
            animated: false,
            pos: 0,
            size: 200,
            duration: 10,
            animateOn: function () {
                this.animated = true;
                this._doAnimate();
                return this.animated;
            },
            animateOff: function () {
                this.animated = false;
                this._stopAnimate();
                //return 1;
            },
            _doAnimate: function () {
                this._stopAnimate();
                var _this = this;
                try {
                    this.hndl = setInterval(function () {
                        _this._render();
                    }, this.duration);
                } catch (e) {
                    console.error(e);
                }
            },
            _stopAnimate: function () {
                clearInterval(this.hndl);
            },
            _render: function () {
                switch (this.owner.direction) {
                    case pbDirection.PB_DIRECT_TOP_TO_BOTTOM:
                    case pbDirection.PB_DIRECT_LEFT_TO_RIGHT:
                        ++this.pos;
                        break;
                    case pbDirection.PB_DIRECT_BOTTOM_TO_TOP:
                    case pbDirection.PB_DIRECT_RIGHT_TO_LEFT:
                        --this.pos;
                        break;
                }
                switch (this.owner.direction) {
                    case pbDirection.PB_DIRECT_LEFT_TO_RIGHT:
                        if (this.pos > this.size)
                            this.pos = 0;
                        this.owner.progress.css('background-position', this.pos + 'px 0');
                        break;
                    case pbDirection.PB_DIRECT_RIGHT_TO_LEFT:
                        if (this.pos < 0)
                            this.pos = this.size;
                        this.owner.progress.css('background-position', this.pos + 'px 0');
                        break;
                    case pbDirection.PB_DIRECT_TOP_TO_BOTTOM:
                        if (this.pos > this.size)
                            this.pos = 0;
                        this.owner.progress.css('background-position', '0 ' + this.pos + 'px');
                        break;
                    case pbDirection.PB_DIRECT_BOTTOM_TO_TOP:
                        if (this.pos < 0)
                            this.pos = this.size;
                        this.owner.progress.css('background-position', '0 ' + this.pos + 'px');
                        break;
                }
            }
        };
    };


    $.fn.mfProgressBar = function () {
        function emptyObject(obj) {
            for (var i in obj) {
                return false;
            }
            return true;
        }
        try {
            var ret = this;
            var args = arguments;
            if (!args.length)
                args = [];
            var func = null;
            var params = null;
            this.each(function () {
                try {
                    if (typeof args === 'object' && !('owner' in this)) {
                        var p = {};
                        p.element = this;
                        var pb = new mfProgressBar(p);
                        //pb.$el.data(pb);
                    }
                } catch (e) {
                    console.warn(e);
                }
                try {
                    if (typeof args[0] === 'string' && (args[0] in mfProgressBar || args[0] in mfProgressBar.prototype)) {
                        if (!func)
                            func = args[0];
                        if (!params)
                            params = Array.prototype.slice.call(args, 1);
                        var data = this.owner;
                        if ('function' === typeof mfProgressBar.prototype[args[0]]) {
                            ret = data[func].apply(data, params);
                            //console.info(func, params, ret);
                            return ret;
                        }
                    }
                } catch (e) {
                    console.warn(e);
                }
            });
        } catch (e) {
            console.error(e);
        }
        return ret;
    };
})(jQuery);