;
(function ($) {
    //var url = 'http://siteposition.ru/check_result_status_json.php';
    var url = 'test.php';

    var types = [{
            type: 'ao',
            averageTime: 20000
        }, {
            type: 'manual',
            averageTime: 10000
        }, {
            type: 'report',
            averageTime: 10000
        }, {
            type: 'big_report',
            averageTime: 10000
        }, {
            type: 'proverka',
            averageTime: 10000
        }];

    var sitepositionProgressBar = function (params) {
        try {
            $.extend(true, this, mfProgressBar.prototype);
            console.log(this);
            this.init(params);
            $(this).on('reciveData', this.onReciveData);
            var r = Math.floor(Math.random() * 10000000);
            $(this.element).after('<span class="mon current" id="mon' + r + 'cur"></span>');
            $(this.element).after('<span class="mon timeleft" id="mon' + r + 'tl"></span>');
            this.monCurrent = $('#mon' + r + 'cur');
            this.monTimeleft = $('#mon' + r + 'tl');
            this.initializeAverageTime();
            if (this.autobegin)
                this.begin();
            return this;
        } catch (e) {
            console.error(e);
        }
    };


    sitepositionProgressBar.prototype = {
        id: '', // идентификатор проверки
        ch: '', // контрольная сумма 
        type: 'ao', // maybe ['ao', 'manual', 'report', 'big_report', 'proverka']
        redirect: '',
        url: '',
        isRunning: false,
        runHNDL: null,
        getDataInterval: 3000, // Интервал получения данных в миллисекундах
        monCurrent: null,
        monTimeleft: null,
        startTime: 0,
        endTime: 0,
        questNum: 0,
        actualQuest: 0,
        averageTime: 10000,
        autobegin: false,
        onReciveData: function (e, data) {
            this.questNum = parseInt(data.current[0]);
            data.current[1] = parseInt(data.current[1]);
            this.calculateTime(data);
            var chunk = 100 / this.questNum;
            var _tmp = this.actualQuest;
            this.actualQuest = data.current[1];
            this.setMonCurrent();
            if (data.current[0] != data.current[1] && _tmp != this.actualQuest) {
                this.position(chunk * this.actualQuest + chunk - 0.001, this.averageTime);
            }
            if (this.actualQuest === 0) {
                this.position(chunk * 1, this.getDataInterval * 5);
            }
            if (data.current[0] == data.current[1]) {
                this.isRunning = false;
                this.position(100, 1000);
                this.setMonTimeLeft('Все задания выполнены за ' + this.timeFormat(this.currentTime() - this.startTime));
                if (this.redirect.length > 0) {
                    window.location.href = this.redirect;
                }
                return;
            }
        },
        calculateTime: function (d) {
            if (this.actualQuest > 0) {
                this.averageTime = (d.timestamp - this.startTime) / this.actualQuest;
            } else {
                this.averageTime = (d.timestamp - this.startTime) / 1;
            }
            if (!isNaN(this.averageTime) && this.averageTime > 0) {
                var left = Math.floor(this.averageTime * (this.questNum - this.actualQuest));
                if (left !== Infinity && !isNaN(left)) {
                    this.setMonTimeLeft('Осталось примерно ' + this.timeFormat(left));
                }
                /**
                 * 
                 if (left > 10000) {
                 this.precission = 1;
                 }
                 if (left > 100000) {
                 this.precission = 2;
                 }
                 */
            }
        },
        timeFormat: function (ms) {
            var sec = ms / 1000,
                    hour = Math.floor((sec / 3600) % 24),
                    min = Math.floor((sec / 60) % 60),
                    ssec = Math.floor(sec % 60);
            function num(val) {
                val = Math.floor(val);
                return val < 10 ? '0' + val : val;
            }
            var ret = '';
            //console.log(hour + ' ' + min);
            if (hour > 0)
                ret = ret + num(hour) + " час. ";
            if (min > 0)
                ret = ret + num(min) + " мин. ";
            ret = ret + num(ssec) + " сек.";

            return ret;
        },
        setMonCurrent: function (text) {
            if (!text)
                text = 'Завершено ' + this.actualQuest + ' из ' + this.questNum + ' заданий';
            this.monCurrent.html(text);
        },
        setMonTimeLeft: function (text) {
            if (!text)
                text = 'Вычисляю оставшееся время...';
            this.monTimeleft.html(text);
        },
        setStyle: function (obj, css) {
            try {
                obj.css(css);
            } catch (e) {

            }
        },
        begin: function () {
            this.startTime = this.currentTime();
            this.questNum = 0;
            this.position(0);
            this.setMonTimeLeft('вычисляю оставшееся время');
            this.isRunning = true;
            this.getData();
            this.setMonCurrent();
            var _this = this;
            try {
                clearInterval(this.runHNDL);
                this.runHNDL = setInterval(function () {
                    if (_this.isRunning) {
                        _this.getData();
                    } else {
                        clearInterval(_this.runHNDL);
                        _this.isRunning = false;
                    }
                }, this.getDataInterval);
            } catch (e) {

            }
        },
        getData: function () {
            try {
                var _this = this;
                $.getJSON(this.url, {id: this.id, ch: this.ch, type: this.type, ci: this.actualQuest}, function (data) {
                    $(_this).trigger('reciveData', {current: data, timestamp: _this.currentTime()});
                });
            } catch (e) {

            }
        },
        currentTime: function () {
            var d = new Date();
            return d.getTime();
        }
    };

    sitepositionProgressBar.prototype.initializeAverageTime = function () {
        try {
            for (var i = 0; i < types.length; i++) {
                if (types[i].type == this.type) {
                    this.averageTime = types[i].averageTime;
                    return;
                }
            }
        } catch (e) {
            console.log(e);
        }
    };

    $.fn.spProgress = function () {
        try {
            var ret = this;
            var args = arguments;
            if (!args.length)
                args = {};
            var func = null;
            var params = null;
            this.each(function () {
                try {
                    if (typeof args === 'object' && !('owner' in this)) {
                        args[0].element = this;
                        args[0].name = 'sp_progressbar_' + arguments[0];
                        var pb = new sitepositionProgressBar(args[0], args[1]);
                    }
                } catch (e) {
                    console.warn(e);
                }
                try {
                    if (typeof args[0] === 'string' && (args[0] in mfProgressBar || args[0] in mfProgressBar.prototype || args[0] in sitepositionProgressBar.prototype)) {
                        if (!func)
                            func = args[0];
                        if (!params)
                            params = Array.prototype.slice.call(args, 1);
                        var data = this.owner;
                        if ('function' === typeof mfProgressBar.prototype[args[0]] || 'function' === typeof sitepositionProgressBar.prototype[args[0]]) {
                            ret = data[func].apply(data, params);
                            console.info(func, params, ret);
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