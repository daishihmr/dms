/*
 * tmlib.js 0.5.0
 * http://github.com/phi-jp/tmlib.js
 * MIT Licensed
 * 
 * Copyright (C) 2010 phi, http://tmlife.net
 */

(function() { "use strict"; })();

/*
 * tm namespace
 */
var tm = tm || {};
tm.global = window || global || this;
tm.global.tm = tm;

// node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = tm;
}


(function() {

    /**
     * バージョン
     */
    tm.VERSION = '0.5.0';

    /**
     * tmlib.js のルートパス
     */
    tm.LIB_ROOT = (function(){
        if (!window.document) return ;

        var scripts = document.getElementsByTagName("script");
        for (var i=0, len=scripts.length; i<len; ++i) {

        }
    })();

    /**
     * ブラウザ
     */
    tm.BROWSER = (function() {
        if (!window.navigator) return ;

        if      (/chrome/i.test(navigator.userAgent))   { return "Chrome";  }
        else if (/safari/i.test(navigator.userAgent))   { return "Safari";  }
        else if (/firefox/i.test(navigator.userAgent))  { return "Firefox"; }
        else if (/opera/i.test(navigator.userAgent))    { return "Opera";   }
        else if (/getcko/i.test(navigator.userAgent))   { return "Getcko";  }
        else if (/msie/i.test(navigator.userAgent))     { return "IE";      }
        else { return ''; }
    })();

    /**
     * ベンダープレフィックス
     */
    tm.VENDER_PREFIX = (function() {
        if (!window) return ;

        var map = {
            "Chrome"    : "webkit",
            "Safari"    : "webkit",
            "Firefox"   : "moz",
            "Opera"     : "o",
            "IE"        : "ms"
        };

        return map[tm.BROWSER] || "";
    })();


    /**
     * モバイルかどうかの判定フラグ
     */
    tm.isMobile = (function() {
        if (!window.navigator) return ;

        var ua = navigator.userAgent;
        return (ua.indexOf("iPhone") > 0 || ua.indexOf("iPad") > 0 || ua.indexOf("Android") > 0);
    })();
    
    tm.isLocal = (function() {
        var flag = (location.protocol == "file:");
        return function() { return flag; };
    })();
    
    /**
     * クラス定義
     */
    tm.createClass = function(prop) {
        // デフォルト値
        prop.init = prop.init || function() {};
        prop.superClass = prop.superClass || null;

        // クラス作成
        var tm_class = function() {
            var temp = new tm_class.prototype.creator();
            tm_class.prototype.init.apply(temp, arguments);
            return temp
        };

        // 継承
        if (prop.superClass) {
            prop.init.owner = tm_class;
            tm_class.prototype = Object.create(prop.superClass.prototype);
            tm_class.prototype.superInit = function() {
                var caller    = this.superInit.caller; // 呼び出しもと
                var subclass  = caller.owner; // 呼び出しもとを持っているクラス
                var superclass= subclass.prototype.superClass; // 呼び出しもとクラスの親クラス
                var superInit = superclass.prototype.init; // 呼び出しもとクラスの親クラスの init
//                var superMethod = this.superInit.caller.owner.prototype.superClass.prototype.init;

                superInit.apply(this, arguments);
            };
            tm_class.prototype.constructor = tm_class;
        }

        tm_class.prototype.selfClass = tm_class;

        // プロパティを追加
        for (var key in prop) {
            tm_class.prototype[key] = prop[key];
        }

        // クリエイタの生成
        tm_class.prototype.creator = function() { return this; };
        // クリエイタの継承
        tm_class.prototype.creator.prototype = tm_class.prototype;

        tm_class._class = true;

        return tm_class;
    };

    tm.classes = {};
    var _calssDefinedCallback = {};

    /**
     * クラス定義
     * phi クラス定義 <http://jsdo.it/phi/eEmj>
     * new と apply を同時に使う <http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible>
     */
    tm.define = function(path, prop) {
        var index       = path.lastIndexOf(".");
        var nsName      = path.substring(0, index);
        var ns          = (nsName) ? tm.using(nsName) : tm.global;
        var className   = (nsName) ? path.substring(index+1) : path;
        var bind        = Function.prototype.bind;
        var unshift     = Array.prototype.unshift;

        prop._path      = path;
        prop._className = className;

        var _class = null;
        var superClass = prop.superClass;

        if (superClass && typeof superClass == "string") {
            var superClassName = superClass;
            superClass = tm.using(superClass);

            if (superClass._class) {
                prop.superClass = superClass;
                _class = tm.createClass(prop);
            }
            else {
                // 親クラスが呼ばれた際に再度実行する
                if (!_calssDefinedCallback[superClassName]) {
                    _calssDefinedCallback[superClassName] = [];
                }

                _calssDefinedCallback[superClassName].push(function() {
                    tm.define(path, prop);
                });

                return ;
            }
        }
        else {
            _class = tm.createClass(prop);
        }

        // キャッシュしておく
        ns[className] = tm.classes[path] = _class;

        if (_calssDefinedCallback[path]) {
            var list = _calssDefinedCallback[path];
            for (var i=0,len=list.length; i<len; ++i) {
                list[i]();
            }
            delete _calssDefinedCallback[path];
        }

        return _class;
    };


    /**
     * 名前空間
     * typescript の mudle 機能を参考
     * https://sites.google.com/site/jun1sboardgames/programming/typescript
     */
    tm.namespace = function(ns, fn) {
        var ns = tm.using(ns);

        fn.call(ns, ns);
    };

    /**
     * 使用
     */
    tm.using = function(ns) {
        if (tm.classes[ns]) return tm.classes[ns];

        var path = ns.split(/[,.\/ ]|::/);
        var current = tm.global;

        for (var i=0,len=path.length; i<len; ++i) {
            var dir = path[i];
            current = current[dir] || (current[dir]={});
        }

        // キャッシュ
        tm.classes[ns] = current;

        return current;
    };
    
    tm.globalize = function(obj) {
        tm.$forIn(function(key, value) {
            if (typeof value !== 'object') {
                return ;
            }
            else if (key === "classes") {
                return ;
            }
            else if (key === "global") {
                return ;
            }
            else if (key === "event") {
                return ;
            }
            else if (key === "dom") {
                return ;
            }

            // console.log("#### " + key + " ###########");
            value.$forIn(function(key, value) {
                if (!window[key]) {
                    // console.log(key);
                    window[key] = value;
                }
                else {
                    // TODO: 名前を考えなおす
                    // console.log(key);
                }
            });
        });

        return this;
    };
    
    tm["import"] = function(namespace) {
        var target = tm[namespace];
        tm.global.$strict(target);
        
        return this;
    };

    /**
     * ループ
     */
    tm.setLoop = function(fn, delay) {
        var temp = function() {
            // 開始時間
            var start = (new Date()).getTime();

            // 実行
            fn();

            // 経過時間
            var progress = (new Date()).getTime() - start;
            // 次回までの待ち時間を計算
            var newDelay = delay-progress;
            newDelay = (newDelay > 0) ? newDelay : 0;

            // 次回呼び出し登録
            setTimeout(arguments.callee, newDelay);
        };
        setTimeout(temp, delay);
    };

    tm.inform = function(parent){
        parent = parent || document.body;

        var eInfo = document.createElement("div");
        eInfo.setAttribute("class", "tm-info");
        eInfo.addEventListener("mouseover", function(){
            this.style.opacity = 0.9;
        }, false);
        eInfo.addEventListener("mouseout", function(){
            this.style.opacity = 0.25;
        }, false);

        with(eInfo.style) {
            position    = "absolute";
            width       = "100%";
            // top         = "0px";
            bottom      = "0px";
            left        = "0px";
            right       = "0px";
            margin      = "0px";
            padding     = "10px 0px";
            zIndex      = "0";
            textAlign   = "center";
            fontFamily  = '"Meiryo", "メイリオ", "ヒラギノ角ゴ Pro W3", sans-serif';
            fontSize    = "13px";
            opacity     = "0.25";
            backgroundColor = "rgb(230,230,255)";
            background  = "-webkit-linear-gradient(top, hsla(0, 100%, 100%, 0.8) 0%, hsla(0, 100%, 100%, 0.3) 50%, hsla(0, 100%, 100%, 0.1) 51%, hsla(0, 100%, 100%, 0.2) 100%), rgb(190,190,210)";
            background  = "-moz-linear-gradient(top, hsla(0, 100%, 100%, 0.8) 0%, hsla(0, 100%, 100%, 0.3) 50%, hsla(0, 100%, 100%, 0.1) 51%, hsla(0, 100%, 100%, 0.2) 100%), rgb(190,190,210)";
            WebkitTransition = "1s";
            MozTransition = "1s";
        }

        /*
        eInfo.innerHTML = "このプログラムで利用している JavaScript ライブラリ 『tmlib.js』 は<a href='{tmlibLink}'>こちら</a>からダウンロードできます. 詳しくは<a href='{blogLink}'>Blog</a>に書いています.".format({
            "tmlibLink": "http://code.google.com/p/tmlib-js/downloads/list",
            "blogLink" : "http://tmlife.net/tmlib"
        });
        */
        eInfo.innerHTML = "このプログラムで利用している JavaScript ライブラリ 『tmlib.js』 については<a href='{projectLink}'>こちら</a>.".format({
            "projectLink" : "https://github.com/phi1618/tmlib.js"
        });
        parent.appendChild(eInfo);
    };

})();


(function() {

    if (!window) return ;

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = window[tm.VENDER_PREFIX + "RequestAnimationFrame"] || function(callback) {
            window.setTimeout(callback, 1000/60);
        };
    }

    if (!window.cancelRequestAnimationFrame) {
        window.cancelRequestAnimationFrame = window[tm.VENDER_PREFIX + "CancelRequestAnimationFrame"] || window.clearTimeout;
    }

})();



(function() {
    if (!window.document) return ;

    var _mainListeners = [];

    tm.main    = function(fn) {
        if (fn) {
            _mainListeners.push(fn);
        }
        else {
            _main();
        }
    };

    var _main = function() {
        for (var i=0,len=_mainListeners.length; i<len; ++i) {
            _mainListeners[i]();
        }

        _mainListeners = [];
    };

    window.addEventListener("load", function() {
        _main();
    }, false);

})();
/*
 * object.js
 */

(function() {
    
    /**
     * @class global.Object
     * Objectの拡張
     */
    
    /**
     * @method defineVariable
     * 変数を追加
     * @param   {String} key name
     * @param   {Object} param
     */
    Object.defineProperty(Object.prototype, "defineVariable", {
        value: function(name, val) {
            Object.defineProperty(this, name, {
                value: val,
                enumerable: true,
                writable: true
            });
        }
    });
    
    /**
     * @method defineFunction
     * 関数を追加
     * @param   {String} key name
     * @param   {Function} function
     */
    Object.defineProperty(Object.prototype, "defineFunction", {
        value: function(name, fn) {
            Object.defineProperty(this, name, {
                value: fn,
                enumerable: false,
                writable: true
            });
        }
    });
    
    /**
     * @method defineInstanceVariable
     * インスタンス変数を定義する
     */
    Object.prototype.defineFunction("defineInstanceVariable", function(name, val){
        Object.defineProperty(this.prototype, name, {
            value: val,
            enumerable: true,
            writable: true
        });
    });
    
    /**
     * @method defineInstanceMethod
     * インスタンスメソッドを定義する
     */
    Object.prototype.defineFunction("defineInstanceMethod", function(name, fn){
        Object.defineProperty(this.prototype, name, {
            value: fn,
            enumerable: false,
            writable: true
        });
    });
    
    /**
     * @method setter
     * セッターを定義する
     */
    Object.defineInstanceMethod("setter", function(name, fn){
        Object.defineProperty(this, name, {
            set: fn,
            enumerable: false,
            configurable: true
        });
    });
    
    /**
     * @method getter
     * ゲッターを定義する
     */
    Object.defineInstanceMethod("getter", function(name, fn){
        Object.defineProperty(this, name, {
            get: fn,
            enumerable: false,
            configurable: true
        });
    });
    
    /**
     * @method accessor
     * アクセッサ(セッター/ゲッター)を定義する
     */
    Object.defineInstanceMethod("accessor", function(name, param) {
        Object.defineProperty(this, name, {
            set: param["set"],
            get: param["get"],
            enumerable: false,
            configurable: true
        });
    });
    
    /**
     * @method $forIn
     * オブジェクト用ループ処理
     */
    Object.defineInstanceMethod("$forIn", function(fn, self) {
        self = self || this;

        Object.keys(this).forEach(function(key, index) {
            var value = this[key];

            fn.call(self, key, value, index);
        }, this);

        return this;
    });

    /**
     * @method  $has
     * そのプロパティを持っているかを判定する
     */
    Object.defineInstanceMethod("$has", function(key) {
        return this.hasOwnProperty(key);
    });

    /**
     * @method  $extend
     * 他のライブラリと競合しちゃうので extend -> $extend としました
     */
    Object.defineInstanceMethod("$extend", function() {
        Array.prototype.forEach.call(arguments, function(source) {
            for (var property in source) {
                this[property] = source[property];
            }
        }, this);
        return this;
    });
    
    /**
     * @method  $safe
     * 安全拡張
     * 上書きしない
     */
    Object.defineInstanceMethod("$safe", function(source) {
        Array.prototype.forEach.call(arguments, function(source) {
            for (var property in source) {
                if (this[property] === undefined) this[property] = source[property];
            }
        }, this);
        return this;
    });
    
    
    /**
     * @method  $strict
     * 厳格拡張
     * すでにあった場合は警告
     */
    Object.defineInstanceMethod("$strict", function(source) {
        Array.prototype.forEach.call(arguments, function(source) {
            for (var property in source) {
                console.assert(!this[property], "tm error: {0} is Already".format(property));
                this[property] = source[property];
            }
        }, this);
        return this;
    });

    /**
     * @method  $pick
     * ピック
     */
    Object.defineInstanceMethod("$pick", function() {
        var temp = {};

        Array.prototype.forEach.call(arguments, function(key) {
            if (key in this) temp[key] = this[key];
        }, this);

        return temp;
    });

    /**
     * @method  $omit
     * オミット
     */
    Object.defineInstanceMethod("$omit", function() {
        var temp = {};

        for (var key in this) {
            if (Array.prototype.indexOf.call(arguments, key) == -1) {
                temp[key] = this[key];
            }
        }

        return temp;
    });
    
})();


/*
 * array.js
 */

(function() {
    
    /**
     * @class   global.Array
     * Arrayの拡張
     * 
     *      @example display
     *      [1, 2, 3].first;
     */
    
    /**
     * @property    first
     * 最初の要素
     */
    Array.prototype.accessor("first", {
        "get": function()   { return this[0]; },
        "set": function(v)  { this[0] = v; }
    });
    
    /**
     * @property    last
     * 最後の要素
     */
    Array.prototype.accessor("last", {
        "get": function()   { return this[this.length-1]; },
        "set": function(v)  { this[this.length-1] = v; }
    });

    /**
     * @method  equals
     * 渡された配列と等しいかどうかをチェック
     */
    Array.defineInstanceMethod("equals", function(arr) {
        // 長さチェック
        if (this.length !== arr.length) return false;
        
        for (var i=0,len=this.length; i<len; ++i) {
            if (this[i] !== arr[i]) {
                return false;
            }
        }
        return true;
    });
    
    /**
     * @method  deepEquals
     * ネストされている配列含め渡された配列と等しいかどうかをチェック
     * equalsDeep にするか検討. (Java では deepEquals なのでとりあえず合わせとく)
     */
    Array.defineInstanceMethod("deepEquals", function(arr) {
        // 長さチェック
        if (this.length !== arr.length) return false;
        
        for (var i=0,len=this.length; i<len; ++i) {
            var result = (this[i].deepEquals) ? this[i].deepEquals(arr[i]) : (this[i] === arr[i]);
            if (result === false) {
                return false;
            }
        }
        return true;
    });

    /**
     * @property    contains
     * 要素が含まれいるかをチェック
     */
    Array.defineInstanceMethod("contains", function(item, fromIndex) {
        return this.indexOf(item, fromIndex) != -1;
    });
    
    /**
     * @method  at
     * ループ添字アクセス(Ruby っぽいやつ)
     */
    Array.defineInstanceMethod("at", function(i) {
        i%=this.length;
        i+=this.length;
        i%=this.length;
        return this[i];
    });
    
    
    /**
     * @method  swap
     * a番目 と b番目 を入れ替える
     */
    Array.defineInstanceMethod("swap", function(a, b) {
        var temp = this[a];
        this[a] = this[b];
        this[b] = temp;
        
        return this;
    });
    
    
    /**
     * @method  erase
     * elm と一致する要素を削除
     */
    Array.defineInstanceMethod("erase", function(elm) {
        var index  = this.indexOf(elm);
        if (index >= 0) {
            this.splice(index, 1);
        }
        return this;
    });
    
    /**
     * @method  eraseAll
     * elm と一致する要素を全て削除
     */
    Array.defineInstanceMethod("eraseAll", function(elm) {
        for (var i=0,len=this.length; i<len; ++i) {
            if (this[i] == elm) {
                this.splice(i--, 1);
            }
        }
        return this;
    });
    
    /**
     * @method  eraseIf
     * 条件にマッチした要素を削除
     */
    Array.defineInstanceMethod("eraseIf", function(fn) {
        for (var i=0,len=this.length; i<len; ++i) {
            if ( fn(this[i], i, this) ) {
                this.splice(i, 1);
                break;
            }
            // if ( fn(this[i], i, this) ) { this.splice(i--, 1); }
        }
        return this;
    });
    
    /**
     * @method  eraseIfAll
     * 条件にマッチした要素を削除
     */
    Array.defineInstanceMethod("eraseIfAll", function(fn) {
        for (var i=0,len=this.length; i<len; ++i) {
            if ( fn(this[i], i, this) ) {
                this.splice(i, 1);
            }
        }
        return this;
    });
    
    /**
     * @method  random
     * 要素の中からランダムで取り出す
     */
    Array.defineInstanceMethod("random", function(min, max) {
        min = min || 0;
        max = max || this.length-1;
        return this[ Math.rand(min, max) ];
    });
    
    /**
     * @method  pickup
     * 要素の中からランダムで取り出す
     */
    Array.defineInstanceMethod("pickup", function(min, max) {
        min = min || 0;
        max = max || this.length-1;
        return this[ Math.rand(min, max) ];
    });
    
    /**
     * @method  uniq
     * 重複削除
     */
    Array.defineInstanceMethod("uniq", function(deep) {
        return this.filter(function(value, index, self) {
            return self.indexOf(value) === index;
        });
    });
    

    /**
     * @method  flatten
     * フラット.
     * Ruby のやつ.
     */
    Array.defineInstanceMethod("flatten", function(level) {
        var arr = null;

        if (level) {
            arr = this;
            for (var i=0; i<level; ++i) {
                arr = Array.prototype.concat.apply([], arr);
            }
        }
        else {
            // 完全フラット
            arr = this.reduce(function (previousValue, curentValue) {
                return Array.isArray(curentValue) ?
                    previousValue.concat(curentValue.flatten()) : previousValue.concat(curentValue);
            }, []);
        }

        return arr;
    });
    
    /**
     * @method  clone
     * 配列をクローン
     */
    Array.defineInstanceMethod("clone", function(deep) {
        if (deep == true) {
            var a = Array(this.length);
            for (var i=0,len=this.length; i<len; ++i) {
                a[i] = (this[i].clone) ? this[i].clone(deep) : this[i];
            }
            return a;
        };
        
        return Array.prototype.slice.apply(this);
    });
    
    /**
     * @method  clear
     * クリア
     */
    Array.defineInstanceMethod("clear", function() {
        this.length = 0;
        return this;
    });
    
    /**
     * @method  fill
     * 特定の値で満たす
     */
    Array.defineInstanceMethod("fill", function(value, start, end) {
        start = start || 0;
        end   = end   || (this.length);
        
        for (var i=start; i<end; ++i) {
            this[i] = value;
        }
        
        return this;
    });
    

    /**
     * @method  range
     * python のやつ
     */
    Array.defineInstanceMethod("range", function(start, end, step) {
        if (arguments.length == 1) {
            this.clear();
            for (var i=0; i<start; ++i) this[i] = i;
        }
        else if (start < end){
            step  = step || 1;
            this.clear();
            for (var i=start, index=0; i<end; i+=step, ++index) {
                this[index] = i;
            }
        }
        else {
            step  = step || -1;
            this.clear();
            for (var i=start, index=0; i>end; i+=step, ++index) {
                this[index] = i;
            }
        }
        
        return this;
    });
    
    /**
     * @method  shuffle
     * シャッフル
     */
    Array.defineInstanceMethod("shuffle", function() {
        for (var i=0,len=this.length; i<len; ++i) {
            var j = Math.rand(0, len-1);
            
            if (i != j) {
                this.swap(i, j);
            }
        }
        
        return this;
    });

    /**
     * @method  sum
     * 合計
     */
    Array.defineInstanceMethod("sum", function() {
        var sum = 0;
        for (var i=0,len=this.length; i<len; ++i) {
            sum += this[i];
        }
        return sum;
    });

    /**
     * @method  average
     * 平均
     */
    Array.defineInstanceMethod("average", function() {
        var sum = 0;
        var len = this.length;
        for (var i=0; i<len; ++i) {
            sum += this[i];
        }
        return sum/len;
    });

    /**
     * @method  each
     * 繰り返し
     * チェーンメソッド対応
     */
    Array.defineInstanceMethod("each", function() {
        this.forEach.apply(this, arguments);
        return this;
    });

    
    /**
     * @method  toULElement
     * ULElement に変換
     */
    Array.defineInstanceMethod("toULElement", function(){
        // TODO: 
    });

    /**
     * @method  toOLElement
     * OLElement に変換
     */
    Array.defineInstanceMethod("toOLElement", function(){
        // TODO:
    });

    
    /**
     * @static
     * @method  range
     * range
     */
    Array.defineFunction("range", function(start, end, step) {
        return Array.prototype.range.apply([], arguments);
    });
    
})();


/*
 * date.js
 */

(function() {
    
    /**
     * @class   global.Date
     * Date(日付)の拡張
     */
    
    var MONTH = [
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ];
    
    var WEEK = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ];
    
    /**
     * @method  format
     * 日付フォーマットに合わせた文字列を返す
     */
    Date.defineInstanceMethod("format", function(pattern) {
        /*
        var str = "{y}/{m}/{d}".format({
            y: this.getYear()+1900,
            m: this.getMonth()+1,
            d: this.getDate(),
        });
        
        return str;
        */
        
        var year    = this.getFullYear();
        var month   = this.getMonth();
        var date    = this.getDate();
        var day     = this.getDay();
        var hours   = this.getHours();
        var minutes = this.getMinutes();
        var seconds = this.getSeconds();
        var millseconds = this.getMilliseconds();
        var str = "";
        
        for (var i=0,len=pattern.length; i<len; ++i) {
            var ch = pattern.charAt(i);
            var temp = "";
            switch(ch) {
                // 日
                case "d": temp = date.padding(2, '0'); break;
                case "D": temp = WEEK[day].substr(0, 3); break;
                case "j": temp = date; break;
                case "l": temp = WEEK[day]; break;
                // case "N": temp = ; break;
                // case "S": temp = ; break;
                // case "w": temp = ; break;
                // case "z": temp = ; break;
                
                // 月
                case "F": temp = MONTH[month]; break;
                case "m": temp = (month+1).padding(2, '0'); break;
                case "M": temp = MONTH[month].substr(0, 3); break;
                case "n": temp = (month+1); break;
                // case "t": temp = (month+1); break;
                
                // 年
                // case "L": temp = ; break;
                // case "o": temp = ; break;
                case "Y": temp = year; break;
                case "y": temp = year.toString().substr(2, 2); break;
                
                
                // 時間
                // case "a": temp = ; break;
                // case "A": temp = ; break;
                // case "B": temp = ; break;
                // case "g": temp = ; break;
                case "G": temp = hours; break;
                // case "h": temp = ; break;
                case "H": temp = hours.padding(2, '0'); break;
                case "i": temp = minutes.padding(2, '0'); break;
                case "s": temp = seconds.padding(2, '0'); break;
                case "S": temp = millseconds.padding(3, '0'); break;
                
                default : temp = ch; break;
            }
            str += temp;
        }
        return str;
    });
    
})();


/*
 * function.js
 */

(function() {
    
    /**
     * @class   global.Function
     * Functionの拡張
     */
    if (!Function.prototype.bind) {
        /**
         * @member  global.Function
         * @method  bind
         * バインド
         */
        Function.defineInstanceMethod("bind", function(obj) {
            var self = this;
            
            return function() {
                self.apply(obj, arguments);
            };
        });
    }


    // 関数名（無名関数は空文字列）を取得 (IE用パッチ)
    if (!Function.prototype.$has("name")) {
        Function.prototype.getter("name", function() {
            return (''+this).replace(/^\s*function\s*([^\(]*)[\S\s]+$/im, '$1');
        });
    }
    

    /**
     * @method  toArrayFunction
     * 関数を配列対応関数に変換.
     * forEach の逆アプローチ的な感じ.
     * 配列を継承したクラスなどに使用する.
     * ## Example
     *      var hoge = function(n) { console.log(this*n); return this*n; };
     *      var arr = [5, 10, 15];
     *      arr.hogeArray = hoge.toArrayFunction();
     *      var result = arr.hogeArray(100);
     *      console.log(result);
     */
    Function.defineInstanceMethod("toArrayFunction", function() {
        var self = this;
        return function() {
            var resultList = [];
            for (var i=0,len=this.length; i<len; ++i) {
                resultList.push( self.apply(this[i], arguments) );
            }
            return resultList;
        }
    });
    
    // forEach や map はもう標準化されてきてるので実装しないよん♪
    
})();


/*
 * math.js
 */

(function() {
    
    /**
     * @class global.Math
     * Mathの拡張
     */

    
    /**
     * @property    DEG_TO_RAD
     * Degree to Radian.
     */
    Math.DEG_TO_RAD = Math.PI/180;
    
    /**
     * @property    RAD_TO_DEG
     * Radian to Degree.
     */
    Math.RAD_TO_DEG = 180/Math.PI;
    
    /**
     * @method
     * Degree を Radian に変換
     */
    Math.degToRad = function(deg) {
        return deg * Math.DEG_TO_RAD;
    };
    
    /**
     * @method
     * Radian を Degree に変換
     */
    Math.radToDeg = function(rad) {
        return rad * Math.RAD_TO_DEG;
    };
    

    
    /**
     * @method
     * クランプ
     */
    Math.defineFunction("clamp", function(value, min, max) {
        return (value < min) ? min : ( (value > max) ? max : value );
    });
    
    /**
     * @method
     * min <= value <= max のとき true を返す
     */
    Math.defineFunction("inside", function(value, min, max) {
        return (value >= min) && (value) <= max;
    });
    
    /**
     * @method
     * ランダムな値を指定された範囲内で生成
     */
    Math.defineFunction("rand", function(min, max) {
        return window.Math.floor( Math.random()*(max-min+1) ) + min;
    });
    
    /**
     * @method
     * ランダムな値を指定された範囲内で生成
     */
    Math.defineFunction("randf", function(min, max) {
        return window.Math.random()*(max-min)+min;
    });
    
})();


/*
 * number.js
 */

(function() {
    
    /**
     * @class global.Number
     * Numberの拡張
     */
    
    /**
     * @method  round
     * 四捨五入
     * 桁数指定版
     */
    Number.defineInstanceMethod("round", function(figure) {
        figure = figure || 0;
        var base = Math.pow(10, figure);
        var temp = this * base;
        temp = Math.round(temp);
        return temp/base;
    });
    
    /**
     * @method  ceil
     * 切り上げ.
     * 桁数指定版
     */
    Number.defineInstanceMethod("ceil",  function(figure) {
        figure = figure || 0;
        var base = Math.pow(10, figure);
        var temp = this * base;
        temp = Math.ceil(temp);
        return temp/base;
    });
    /**
     * @method  floor
     * 切り捨て
     * 桁数指定版
     */
    Number.defineInstanceMethod("floor",  function(figure) {
        figure = figure || 0;
        var base = Math.pow(10, figure);
        var temp = this * base;
        temp = Math.floor(temp);
        
        // ~~this
        // this|0
        
        return temp/base;
    });
    
    /**
     * @method  toInt
     * integer 型に変換する
     */
    Number.defineInstanceMethod("toInt",  function() {
        return (this | 0);
    });
    
    /**
     * @method  toHex
     * 16進数化
     */
    Number.defineInstanceMethod("toHex",  function() {
        return this.toString(16);
    });
    
    /**
     * @method  toBin
     * 2進数化
     */
    Number.defineInstanceMethod("toBin",  function() {
        return this.toString(2);
    });
    
    
    /**
     * @method  toUnsigned
     * unsigned 型に変換する
     */
    Number.defineInstanceMethod("toUnsigned",  function() {
        return this >>> 0;
    });
    
    /**
     * @method  padding
     * 文字埋め
     */
    Number.defineInstanceMethod("padding",  function(n, ch) {
        var str = this+'';
        n  = n-str.length;
        ch = ch || '0';
        
        while(n-- > 0) { str = ch + str; }
        
        return str;
    });
    
    /**
     * @method  times
     * 数値分繰り返す
     */
    Number.defineInstanceMethod("times",  function(fn, self) {
        self = self || this;
        for (var i=0; i<this; ++i) {
            fn.call(self, i);
        }
        return this;
    });
    
    /**
     * @method  upto
     * インクリメント繰り返し
     */
    Number.defineInstanceMethod("upto",  function(t, fn, self) {
        self = self || this;
        for (var i=+this; i<=t; ++i) {
            fn.call(self, i);
        }
        return this;
    });
    
    /**
     * @method  upto
     * デクリメント繰り返し
     */
    Number.defineInstanceMethod("downto",  function(t, fn, self) {
        self = self || this;
        for (var i=+this; i>=t; --i) {
            fn.call(self, i);
        }
        return this;
    });

    /**
     * @method step
     * ステップ繰り返し(float対応)
     */
    Number.defineInstanceMethod("step",  function(limit, step, fn, self) {
        self = self || this;
        for (var i=+this; i<=limit; i+=step) {
            fn.call(self, i);
        }
        return this;
    });

    
})();


/*
 * string.js
 */

(function() {
    
    /**
     * @class global.String
     * Stringの拡張
     * `String` is a global object that may be used to construct String instances.
     */
    
    
    /**
     * @method  format
     * 
     * フォーマット
     * 
     * ## example
     * 
     *      document.write("{0} + {1} = {2}".format(5, 10, 5+10));   // "5 + 10 = 15"
     *      document.write("rgb({r}, {g}, {b})".format({             // "rgb(128, 0, 255)"
     *          r: 128,
     *          g: 0,
     *          b: 255
     *      }));
     */
    String.defineInstanceMethod("format", function(arg) {
        // 置換ファンク
        var rep_fn = undefined;
        
        // オブジェクトの場合
        if (typeof arg == "object") {
            /** @ignore */
            rep_fn = function(m, k) {
                if (arg[k] === undefined) {
                    return '';
                }
                else {
                    return arg[k];
                }
            }
        }
        // 複数引数だった場合
        else {
            var args = arguments;
            /** @ignore */
            rep_fn = function(m, k) { return args[ parseInt(k) ]; }
        }
        
        return this.replace( /\{(\w+)\}/g, rep_fn );
    });
    
    /**
     * @method  trim
     * トリム
     * 
     * <a href="http://jamesroberts.name/blog/2010/02/22/string-functions-for-javascript-trim-to-camel-case-to-dashed-and-to-underscore/">Reference</a>
     * 
     */
    String.defineInstanceMethod("trim", function() {
        return this.replace(/^\s+|\s+$/g, "");
    });
    
    /**
     * @method  capitalize
     * キャピタライズ
     * 
     * ## Reference
     * 
     * - [キャピタライズ(単語の先頭の大文字化)を行う - oct inaodu](http://d.hatena.ne.jp/brazil/20051212/1134369083)
     * - [デザインとプログラムの狭間で: javascriptでキャピタライズ（一文字目を大文字にする）](http://design-program.blogspot.com/2011/02/javascript.html)
     * 
     */
    String.defineInstanceMethod("capitalize", function() {
        return this.replace(/\w+/g, function(word){
            return word.capitalizeFirstLetter();
        });
    });
    
    /**
     * @method  capitalizeFirstLetter
     * 先頭文字のみキャピタライズ
     */
    String.defineInstanceMethod("capitalizeFirstLetter", function() {
        return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
    });
    
    /**
     * @method  toDash
     * ダッシュ
     */
    String.defineInstanceMethod("toDash", function() {
        return this.replace(/([A-Z])/g, function(m){ return '-'+m.toLowerCase(); });
    });
    
    
    /**
     * @method toHash
     * ハッシュ値に変換
     */
    String.defineInstanceMethod("toHash", function() {
        return this.toCRC32();
    });
    
    /**
     * @method  padding
     * 左側に指定された文字を詰めて右寄せにする
     */
    String.defineInstanceMethod("padding", function(n, ch) {
        var str = this.toString();
        n  = n-str.length;
        ch = ch || ' ';
        
        while(n-- > 0) { str = ch + str; }
        
        return str;
    });
    
    /**
     * @method  paddingLeft
     * 左側に指定された文字を詰めて右寄せにする
     */
    String.defineInstanceMethod("paddingLeft", function(n, ch) {
        var str = this.toString();
        n  = n-str.length;
        ch = ch || ' ';
        
        while(n-- > 0) { str = ch + str; }
        
        return str;
    });
    
    /**
     * @method  paddingRight
     * 右側に指定された文字を詰めて左寄せにする
     */
    String.defineInstanceMethod("paddingRight", function(n, ch) {
        var str = this.toString();
        n  = n-str.length;
        ch = ch || ' ';
        
        while(n-- > 0) { str = str + ch; }
        
        return str;
    });
    
    /**
     * @method  quotemeta
     * メタ文字をクォート
     */
    String.defineInstanceMethod("quotemeta", function(n) {
        return this.replace(/([^0-9A-Za-z_])/g, '\\$1');
    });
    
    /**
     * @method  repeat
     * リピート
     */
    String.defineInstanceMethod("repeat", function(n) {
        // TODO: 確認する
        var arr = Array(n);
        for (var i=0; i<n; ++i) arr[i] = this;
        return arr.join('');
    });
    
    /**
     * @method  count
     * リピート
     */
    String.defineInstanceMethod("count", function(str) {
        var re = new RegExp(str, 'gm');
        return this.match(re).length;
    });
    
    /**
     * @method  toString
     * 配列に変換
     */
    String.defineInstanceMethod("toArray", function() {
        var arr = [];
        for (var i=0,len=this.length; i<len; ++i) {
            arr.push(this[i]);
        }
        return arr;
    });
    
    
    var table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D".split(' ');
    
    /**
     * @method  toCRC32
     * CRC32 変換
     */
    String.defineInstanceMethod("toCRC32", function() {
        var crc = 0, x=0, y=0;
        
        crc = crc ^ (-1);
        for (var i=0, iTop=this.length; i<iTop; ++i) {
            y = (crc ^ this.charCodeAt(i)) & 0xff;
            x = "0x" + table[y];
            crc = (crc >>> 8) ^ x;
        }
        
        return (crc ^ (-1)) >>> 0;
    });
    
    
})();

/*
 * event/event.js
 */

tm.event = tm.event || {};

(function() {
    
    /**
     * @class tm.event.Event
     * イベントクラス
     */
    tm.event.Event = tm.createClass({
        
        /** タイプ */
        type: null,
        
        /**
         * @constructor
         */
        init: function(type) {
            this.type = type;
        },
        
    });
    
})();


(function() {
    
    /**
     * @class tm.event.TweenEvent
     * Tween Event
     * @extends tm.event.Event
     */
    tm.event.TweenEvent = tm.createClass({
        
        superClass: tm.event.Event,

        /** time */
        time: null,
        /** now */
        now: null,

        /**
         * @constructor
         */
        init: function(type, time, now) {
            this.superInit(type);
            
            this.time = time;
            this.now  = now;
        }
        
    });
    
    /**
     * @static
     * チェンジ
     */
    tm.event.TweenEvent.CHANGE    = "change";
    /**
     * @static
     * フィニッシュ
     */
    tm.event.TweenEvent.FINISH    = "finish";
    /**
     * @static
     * ループ
     */
    tm.event.TweenEvent.LOOP      = "loop";
    /**
     * @static
     * レジューム
     */
    tm.event.TweenEvent.RESUME    = "resume";
    /**
     * @static
     * スタート
     */
    tm.event.TweenEvent.START     = "start";
    /**
     * @static
     * ストップ
     */
    tm.event.TweenEvent.STOP      = "stop";
    
})();




(function() {
    
    /**
     * @class tm.event.MouseEvent
     * Pointing Event
     * @extends tm.event.Event
     */
    tm.event.MouseEvent = tm.createClass({
        
        superClass: tm.event.Event,

        /**
         * app
         */
        app: null,

        /**
         * pointing
         */
        pointing: null,

        /**
         * @constructor
         */
        init: function(type, app, pointing) {
            this.superInit(type);
            
            this.app = app;
            this.pointing = pointing;
        }
        
    });
    
})();




(function() {
    
    /**
     * @class tm.event.TouchEvent
     * Pointing Event
     * @extends tm.event.Event
     */
    tm.event.TouchEvent = tm.createClass({
        
        superClass: tm.event.Event,

        /**
         * app
         */
        app: null,

        /**
         * pointing
         */
        pointing: null,

        /**
         * @constructor
         */
        init: function(type, app, pointing) {
            this.superInit(type);
            
            this.app = app;
            this.pointing = pointing;
        }
        
    });
    
})();



(function() {
    
    /**
     * @class tm.event.PointingEvent
     * Pointing Event
     * @extends tm.event.Event
     */
    tm.event.PointingEvent = tm.createClass({
        
        superClass: tm.event.Event,

        /**
         * app
         */
        app: null,
        
        /**
         * pointing
         */
        pointing: null,
        
        /**
         * @constructor
         */
        init: function(type, app, pointing) {
            this.superInit(type);
            
            this.app = app;
            this.pointing = pointing;
        }
        
    });
    
    // tm.event.PointingEvent.CHANGE    = "change";
    // tm.event.PointingEvent.FINISH    = "finish";
    // tm.event.PointingEvent.LOOP      = "loop";
    // tm.event.PointingEvent.RESUME    = "resume";
    // tm.event.PointingEvent.START     = "start";
    // tm.event.PointingEvent.STOP      = "stop";
    
})();



/*
 * eventdispatcher.js
 */

tm.event = tm.event || {};

(function() {
    
    /**
     * @class tm.event.EventDispatcher
     * Event Dispatcher
     * ### Reference
     * -(EventDispatcher - ActionScript 3.0 コンポーネントリファレンスガイド)[http://livedocs.adobe.com/flash/9.0_jp/ActionScriptLangRefV3/flash/events/EventDispatcher.html]
     */
    tm.define("tm.event.EventDispatcher", {

        /** @private @property _listeners */

        /**
         * @constructor
         */
        init: function() {
            this._listeners = {};
        },

        /**
         * イベントリスナー追加
         */
        on: function(type, listener) {
            if (this._listeners[type] === undefined) {
                this._listeners[type] = [];
            }
            
            this._listeners[type].push(listener);
            return this;
        },
        
        /**
         * リスナーを削除
         */
        off: function(type, listener) {
            var listeners = this._listeners[type];
            var index = listeners.indexOf(listener);
            if (index != -1) {
                listeners.splice(index,1);
            }
            return this;
        },
        
        /**
         * イベント発火
         */
        fire: function(e) {
            e.target = this;
            var oldEventName = 'on' + e.type;
            if (this[oldEventName]) this[oldEventName](e);
            
            var listeners = this._listeners[e.type];
            if (listeners) {
                var temp = listeners.clone();
                for (var i=0,len=temp.length; i<len; ++i) {
                    temp[i].call(this, e);
                }
            }
            
            return this;
        },

        /*
         * イベント名でイベント発火
         */
        flare: function(eventName, param) {
            var e = tm.event.Event(eventName);
            if (param) {
                e.$extend(param);
            }
            this.fire(e);

            return this;
        },
        
        one: function(type, listener) {
            var self = this;
            
            var func = function() {
                var result = listener.apply(self, arguments);
                self.off(type, func);
                return result;
            };
            
            this.on(type, func);
            
            return this;
        },
        
        /**
         * type に登録されたイベントがあるかをチェック
         */
        hasEventListener: function(type) {
            if (this._listeners[type] === undefined && !this["on" + type]) return false;
            return true;
        },
        
        /**
         * type に登録されているリスナーを全てクリア
         */
        clearEventListener: function(type) {
            var oldEventName = 'on' + type;
            if (this[oldEventName]) delete this[oldEventName];

            this._listeners[type] = [];
            return this;
        },
    });

    var proto = tm.event.EventDispatcher.prototype;
    
    /**
     * @member  tm.event.EventDispatcher
     * @method  addEventListener
     * on と同じ
     */
    proto.addEventListener      = proto.on;
    
    /**
     * @member  tm.event.EventDispatcher
     * @method  removeEventListener
     * off と同じ
     */
    proto.removeEventListener   = proto.off;
    
    /**
     * @member  tm.event.EventDispatcher
     * @method  dispatchEvent
     * fire と同じ
     */
    proto.dispatchEvent         = proto.fire;
    
})();

/*
 * random.js
 */

tm.util = tm.util || {};


(function() {
    
    /**
     * @class tm.util.Random
     * ランダムクラス
     * 
     * ## Reference
     * - <http://www.python.jp/doc/2.5/lib/module-random.html>
     * - <http://www.yukun.info/blog/2008/06/python-random.html>
     * - <http://www.python-izm.com/contents/application/random.shtml>
     * - <http://libcinder.org/docs/v0.8.3/classcinder_1_1_rand.html>
     * - <http://libcinder.org/docs/v0.8.3/_rand_8h_source.html>
     */
    tm.util.Random = {
        
        /**
         * Dummy
         */
        randint: function(min, max) {
            return window.Math.floor( Math.random()*(max-min+1) ) + min;
        },
        
        /**
         * Dummy
         */
        randfloat: function(min, max) {
            return window.Math.random()*(max-min)+min;
        },
        
        /**
         * Dummy
         */
        randbool: function() {
            return this.randint(0, 1) === 1;
        },
    };
    
})();

/*
 * ajax.js
 */

tm.util = tm.util || {};


(function() {

    /*
     * @enum
     * @private
     */
    var AJAX_DEFAULT_SETTINGS = {
        /* @property type */
        type :"GET",
        /* @property async */
        async: true,
        /* @property data */
        data: null,
        /* @property contentType */
        contentType: 'application/x-www-form-urlencoded',
        /* @property dataType */
        dataType: 'text',
        /* @property dataType */
        responseType: '', // or 'arraybuffer'
        /* @property username */
        username: null,
        /* @property password */
        password: null,
        /* @property success */
        success : function(data){ alert("success!!\n"+data); },
        /* @property error */
        error   : function(data){ alert("error!!"); },
        /* @property beforeSend */
        beforeSend: null,
    };

    /**
     * @class tm.util.Ajax
     * Ajax クラス
     */
    tm.util.Ajax = {
        /**
         * load
         */
        load: function(params) {
            for (var key in AJAX_DEFAULT_SETTINGS) {
                params[key] = params[key] || AJAX_DEFAULT_SETTINGS[key];
            }

            var httpRequest = new XMLHttpRequest();
            var ajax_params = "";
            var conv_func = tm.util.Ajax.DATA_CONVERTE_TABLE[params.dataType];

            var url = params.url;
            if (params.data) {
                var query = "";
                if (typeof params.data == 'string') {
                    query = params.data;
                    // query = encodeURIComponent(params.data);
                }
                else {
                    query = tm.util.QueryString.stringify(params.data);
                }

                if (params.type == 'GET') {
                    params.url += '?' + query;
                    params.data = null;
                }
                else if (params.type == 'POST') {
                    params.data = query;
                }
            }

            // httpRequest.withCredentials = true;

            // コールバック
            httpRequest.onreadystatechange = function() {
                if (httpRequest.readyState == 4) {
                    // 成功(status === 0 はローカルファイル用)
                    if (httpRequest.status === 200 || httpRequest.status === 201 || httpRequest.status === 0) {
                        if (params.responseType !== "arraybuffer") {
                            // タイプ別に変換をかける
                            var data = conv_func(httpRequest.responseText);
                            params.success(data);
                        }
                        else {
                            // バイナリデータ
                            params.success(this.response);
                        }
                    }
                    else {
                        params.error(httpRequest.responseText);
                    }
                }
                else {
                    //console.log("通信中");
                }
            };


            httpRequest.open(params.type, params.url, params.async, params.username, params.password);   // オープン
            if (params.type === "POST") {
                httpRequest.setRequestHeader('Content-Type', params.contentType);        // ヘッダをセット
            }

            if (params.responseType) {
                httpRequest.responseType = params.responseType;
            }

            if (params.beforeSend) {
                params.beforeSend(httpRequest);
            }

            if (params.password) {
                httpRequest.withCredentials = true;
            }

            httpRequest.send(params.data);
        },

        /**
         * loadJSONP
         */
        loadJSONP: function(url, callback) {
            var g = tm.global;
            g.tmlib_js_dummy_func_count = tm.global.tmlib_js_dummy_func || 0;
            var dummy_func_name = "tmlib_js_dummy_func" + (g.tmlib_js_dummy_func_count++);
            g[dummy_func_name]  = callback;

            var elm = document.createElement("script");
            elm.type = "text/javascript";
            elm.charset = "UTF-8";
            elm.src = url + (url.indexOf("?") < 0 ? "?" : "&") + "callback=" + dummy_func_name;
            elm.setAttribute("defer", true);
            document.getElementsByTagName("head")[0].appendChild(elm);
        }
    };

    /*
     * @enum tm.util.Ajax.DATA_CONVERTE_TABLE
     * データコンバータテーブル
     */
    tm.util.Ajax.DATA_CONVERTE_TABLE = {
        /* @method */
        undefined: function(data) {
            return data;
        },

        /* @method */
        text: function(data) {
            return data;
        },

        /* @method */
        xml: function(data) {
            var parser = new DOMParser();
            var xml = parser.parseFromString(data, 'text/xml');

            return xml;
        },

        /* @method */
        dom: function(data) {
            var div = document.createElement("div");
            div.innerHTML = data;
            return tm.dom.Element(div);
        },

        /* @method */
        json: function(data) {
            try {
                return JSON.parse(data);
            }
            catch(e) {
                console.dir(e);
                console.dir(data);
            }
        },

        /* @method */
        script: function(data) {
            eval(data);
            return data;
        },

        /*
         * @method
         * ### Reference
         * - <http://efcl.info/adiary/Javascript/treat-binary>
         * @param {Object} data
         */
        bin: function(data) {
            var bytearray = [];
            for (var i=0, len=data.length; i<len; ++i) {
                bytearray[i] = data.charCodeAt(i) & 0xff;
            }
            return bytearray;
        },

    };


    tm.util.Ajax.DEFAULT_SETTINGS = AJAX_DEFAULT_SETTINGS;

})();

/*
 * file.js
 */

tm.util = tm.util || {};


(function() {
    
    /**
     * @class tm.util.File
     * ファイルクラス
     */
    tm.define("tm.util.File", {
        superClass: "tm.event.EventDispatcher",

        /** deta */
        data: null,
        /** deta */
        loaded: false,

        /**
         * @constructor
         */
        init: function(params) {
            this.superInit();

            this.loaded = false;
            if (arguments.length == 1) {
                this.load(params);
            }
        },
        
        /**
         * ロード
         */
        load: function(params) {
            if (typeof params == "string") {
                var url = params;
                params = { url: url, };
            }
            
            var self = this;
            params.success = function(data) {
                self.setData(data);
                var e = tm.event.Event("load");
                self.dispatchEvent( e );
            };
            tm.util.Ajax.load(params);
        },

        /**
         * setData
         */
        setData: function(data) {
            this.data = data;
            this.loaded = true;
        },
        
        /**
         * ローカルストレージからロード
         */
        loadLocalStorage: function() {
            
        },
        

    });
    
    
})();



/*
 * tmline.js
 */

tm.util = tm.util || {};


(function() {
    
    /**
     * @class tm.util.Timeline
     * タイムラインクラス
     */
    tm.util.Timeline = tm.createClass({
        
        /** target */
        target  : null,
        /** tasks */
        tasks   : null,
        /** fps */
        fps     : 30,
        
        /**
         * @constructor
         */
        init: function() {
            this.tasks = [];
            this.time = 0;
        },
        
        /**
         * アット
         */
        at: function(time, action) {
            this.tasks.push({
                time: time,
                action: action,
            });
            return this;
        },

        /**
         * アフター
         */
        after: function(time, action) {
            this.at(this.time + time, action);
            return this;
        },

        /**
         * クリア
         */
        clear: function() {
            this.tasks = [];
            return this;
        },

        /**
         * リムーブタイム
         */
        removeTime: function(time) {
            // TODO: 
        },

        /**
         * リムーブアクション
         */
        removeAction: function(action) {
            // TODO: 
        },
        
        /**
         * スタート
         */
        start: function() {
            this.isPlaying = true;
            this._startTime();
            this._updateTime();
        },

        /**
         * レジューム
         */
        resume: function() {
            this.isPlaying = true;
            this._resumeTime();
            this._updateTime();
        },

        /**
         * ストップ
         */
        stop: function() {
            this.isPlaying = false;
        },

        /**
         * レウィンド
         */
        rewind: function() {
            this.time = 0;
        },

        /**
         * 更新
         */
        update: function() {
            // タスク更新
            if (this.tasks.length > 0) {
                for (var i=0,len=this.tasks.length; i<len; ++i) {
                    var task = this.tasks[i];
                    if (this.prev <= task.time && task.time < this.time) {
                        task.action();
                        // this.tasks.erase(task);
                        // break;
                    }
                }
            }
        },
        
        /**
         * @private
         */
        _startTime: function() {
            this.startTime = (new Date()).getTime();
        },

        /**
         * @private
         */
        _resumeTime: function() {
            this.startTime = (new Date()).getTime() - this.time;
        },

        /**
         * @private
         */
        _updateTime: function() {
            if (this.isPlaying) {
                this._nextTime();
                setTimeout(arguments.callee.bind(this), 1000/this.fps);
            }
        },
        
        /**
         * @private
         */
        _nextTime: function() {
            // 前回の時間
            this.prev = this.time;
            // 今回の時間
            this.time = (new Date()).getTime() - this.startTime;
            // 更新
            this.update();
        },
        
    });
    
})();


/*
 * util/data.js
 */

tm.util = tm.util || {};


(function() {
    
    /**
     * @class tm.util.DataManager
     * データマネージャ
     */
    tm.util.DataManager = {
        data: {}
    };

    /**
     * @static
     * @method
     * セーブ
     */
    tm.util.DataManager.save = function() {
        // TODO: ローカルストレージ?
        for (var key in this.data) {
            var data = this.data[key];
            localStorage[key] = JSON.stringify( data );
        }
    };

    /**
     * @static
     * @method
     * ロード
     */
    tm.util.DataManager.load = function(key) {
        // TODO: ローカルストレージ?
        for (var key in localStorage) {
            this.data[key] = JSON.parse(localStorage[key]);
        }
    };

    /**
     * @static
     * @method
     * セット
     */
    tm.util.DataManager.set = function(key, value) {
        this.data[key] = value;
        return this;
    };

    /**
     * @static
     * @method
     * ゲット
     */
    tm.util.DataManager.get = function(key) {
        return this.data[key];
    };
    
    
    // tm.addLoadCheckList(tm.util.DataManager);
    
})();
/*
 * querystring.js
 */

tm.util = tm.util || {};


(function() {
    
    /**
     * @class tm.util.QueryString
     * クエリ文字列クラス
     */
    tm.util.QueryString = {
        /**
         * パース
         */
        parse: function(str, sep, eq) {
            sep = sep || '&';
            eq  = eq  || '=';
            
            var obj = {};
            var params = str.split(sep);
            for (var i=0,len=params.length; i<len; ++i) {
                var param = params[i];
                var pos = param.indexOf(eq);
                if (pos>0) {
                    var key = param.substring(0, pos);
                    var val = param.substring(pos+1);
                    obj[key] = val;
                }
            }
            
            return obj;
        },
        
        /**
         * ストリングファイ
         */
        stringify: function(obj, sep, eq) {
            sep = sep || '&';
            eq  = eq  || '=';
            
            
            var strList = [];
            for (var key in obj) {
                var value = encodeURIComponent(obj[key]);
                strList.push(key + eq + value);
            }
            
            return strList.join(sep);
        },
    };
    
})();




/*
 * type.js
 */

/**
 * @class tm.util.Type
 * 型チェック
 */
tm.namespace("tm.util.Type", function() {
    var self = this;
    var toString = Object.prototype.toString;

    /**
     * @static
     * @method  isObject
     * is object
     */
    this.defineFunction("isObject", function(obj) {
        return obj === Object(obj);
    });

    /**
     * @static
     * @method  isArray
     * is array
     */
    this.defineFunction("isArray", function(obj) {
        return toString.call(obj) == '[object Array]';
    });

    /**
     * @static
     * @method  isArguments
     * is arguments
     */
    this.defineFunction("isArguments", function(obj) {
        return toString.call(obj) == '[object Arguments]';
    });

    /**
     * @static
     * @method  isFunction
     * is function
     */
    this.defineFunction("isFunction", function(obj) {
        return toString.call(obj) == '[object Function]';
    });

    /**
     * @static
     * @method  isString
     * is string
     */
    this.defineFunction("isString", function(obj) {
        return toString.call(obj) == '[object String]';
    });

    /**
     * @static
     * @method  isNumber
     * is number
     */
    this.defineFunction("isNumber", function(obj) {
        return toString.call(obj) == '[object Number]';
    });

    /**
     * @static
     * @method  isDate
     * is date
     */
    this.defineFunction("isDate", function(obj) {
        return toString.call(obj) == '[object Date]';
    });

    /**
     * @static
     * @method  isRegExp
     * is RegExp
     */
    this.defineFunction("isRegExp", function(obj) {
        return toString.call(obj) == '[object RegExp]';
    });

    /**
     * @static
     * @method  isEmpty
     * is empty
     */
    this.defineFunction("isEmpty", function(obj) {
        if (!obj) return true;
        if (self.isArray(obj) || self.isString(obj) || self.isArguments(obj)) return obj.length === 0;
        for (var key in obj) {
            if (key) return false;
        }
        return true;
    });

});

/*
 * flow.js
 */

    
/**
 * @class tm.util.Flow
 * @extends tm.event.EventDispatcher
 * it is inspire in made flow.js of `@uupaa`
 */
tm.define("tm.util.Flow", {
    superClass: "tm.event.EventDispatcher",
    
    /** waits */
    waits: 0,
    /** counter */
    counter: 0,
    /** args */
    args: null,
    
    /**
     * @constructor
     */
    init: function(waits, callback) {
        this.superInit();
        
        waits = waits || 0;
        callback = callback || null;
        
        this.setup(waits, callback);
    },
    
    /**
     * セットアップ
     */
    setup: function(waits, callback) {
        this.waits = waits;
        this.callback = callback;
        this.counter = 0;
        this.args = {};

        this._check();

        return this;
    },
    
    /**
     * パス
     */
    pass: function(key, value) {
        ++this.counter;
        
        if (arguments.length >= 2) {
            this.args[key] = value;
        }
        
        this._check();
    },
    
    /**
     * 終了チェック
     */
    isFinish: function() {
        return (this.counter === this.waits);
    },
    
    _check: function() {
        if (this.isFinish()) {
            var args = this.args;
            
            if (this.callback) {
                this.callback(args);
                
                this.args = null;
                this.callback = null;
            }
            
            var e = tm.event.Event("flowfinish");
            e.args = args;
            this.fire(e);
        }
    }
});


/*
 * グリッドシステム
 */
tm.define("tm.util.GridSystem", {
    width: 640, // 幅
    col: 12,    // 列数
    
    init: function(width, col) {
        if (typeof arguments[0] === 'object') {
            var param = arguments[0];
            width = param.width;
            col = param.col;
        }
        
        this.width = width;
        this.col = col;
        this.unitWidth = this.width/this.col;
    },
    
    // スパン指定で値を取得(負数もok)
    span: function(index) {
        index += this.col;
        index %= this.col;

        return this.unitWidth * index;
    },
    
    // 真ん中
    center: function() {
        return this.unitWidth * (this.col/2);
    },
});

/*
 * vector2.js
 */

/*
 * 幾何学
 */
tm.geom = tm.geom || {};


(function() {
    
    /**
     * @class tm.geom.Vector2
     * 2次元ベクトル
     */
    tm.geom.Vector2 = tm.createClass({
        /** x座標 */
        x: 0,
        /** y座標 */
        y: 0,
        
        /**
         * @constructor
         */
        init: function(x, y) {
            this.set(x, y);
        },
        
        
        /**
         * 複製
         */
        clone: function() {
            return tm.geom.Vector2(this.x, this.y);
        },
        
        
        /**
         * 等しいかどうかをチェック
         * @param   {tm.geom.Vector2}   v   比較対象となる２次元ベクトル
         */
        equals: function(v) {
            return (this.x === v.x && this.y === v.y) ? true : false;
        },
        
        /**
         * 数値と等しいかどうかをチェック
         * @param   {Number}   x    比較対象となる x 値
         * @param   {Number}   y    比較対象となる y 値
         */
        equalsNumber: function(x, y) {
            return (this.x === x && this.y === y) ? true : false;
        },
        
        /**
         * 配列と等しいかどうかをチェック
         * @param   {Number}   arr  比較対象となる配列
         */
        equalsArray: function(arr) {
            return (this.x === arr[0] && this.y === arr[1]) ? true : false;
        },
        
        
        /**
         * セッター
         */
        set: function(x, y) {
            this.x = x;
            this.y = y;
        },
        
        /**
         * 数値からセット
         */
        setNumber: function(x, y) {
            this.x = x;
            this.y = y;
            
            return this;
        },
        
        /**
         * 配列からセット
         */
        setArray: function(arr) {
            this.x = arr[0];
            this.y = arr[1];
            
            return this;
        },
        
        /**
         * オブジェクトからセット
         */
        setObject: function(obj) {
            this.x = obj.x;
            this.y = obj.y;
            
            return this;
        },
        
        /**
         * 文字列からセット
         */
        setString: function(str) {
            var m = str.match(/(-?\d+(\.{1}\d+)?),\s*(-?\d+(\.{1}\d+)?)/);
            this.x = parseFloat(m[1]);
            this.y = parseFloat(m[3]);
            
            return this;
        },
        
        /**
         * 賢いセット
         */
        setSmart: function(x, y) {
            var v = arguments[0];
            // xyz
            if (arguments.length === 2) {
                this.x = x;
                this.y = y;
            }
            // Array
            else if (v instanceof Array) {
                this.x = v[0];
                this.y = v[1];
            }
            // Object
            else if (v instanceof Object) {
                this.x = v.x;
                this.y = v.y;
            }
            // String
            else if (typeof(v) == "string") {
                var m = v.match(/(-?\d+(\.{1}\d+)?),\s*(-?\d+(\.{1}\d+)?)/);
                this.x = parseFloat(m[1]);
                this.y = parseFloat(m[3]);
            }
            
            return this;
        },
        
        /**
         * 角度と長さでベクトルをセット
         * Angle は Degree 値で指定
         */
        setAngle: function(angle, len) {
            var rad = angle*Math.DEG_TO_RAD;
            
            len = len || 1;
            this.x = Math.cos(rad)*len;
            this.y = Math.sin(rad)*len;
            
            return this;
        },
        
        /**
         * 角度(radian)と長さでベクトルをセット
         */
        setRadian: function(radian, len) {
            len = len || 1;
            this.x = Math.cos(radian)*len;
            this.y = Math.sin(radian)*len;
            
            return this;
        },
        
        /**
         * 角度(degree)と長さでベクトルをセット
         */
        setDegree: function(degree, len) {
            var rad = degree*Math.DEG_TO_RAD;
            
            len = len || 1;
            this.x = Math.cos(rad)*len;
            this.y = Math.sin(rad)*len;
            
            return this;
        },
        
        /**
         * ランダムベクトルをセット
         */
        setRandom: function(min, max, len) {
            min = min || 0;
            max = max || 360;
            len = len || 1;
            this.setDegree(Math.randf(min, max), len);
            return this;
        },
        
        /**
         * 加算
         */
        add: function(v) {
            this.x += v.x;
            this.y += v.y;
            
            return this;
        },
        
        /**
         * 減算
         */
        sub: function(v) {
            this.x -= v.x;
            this.y -= v.y;
            
            return this;
        },
        
        /**
         * 乗算
         */
        mul: function(n) {
            this.x *= n;
            this.y *= n;
            
            return this;
        },
        
        /**
         * 除算
         */
        div: function(n) {
            //console.assert(n != 0, "0 division!!");
            n = n || 0.01;
            this.x /= n;
            this.y /= n;
            
            return this;
        },
        
        /**
         * 反転
         */
        negate: function() {
            this.x = -this.x;
            this.y = -this.y;
            
            return this;
        },

        /**
         * @method
         * 内積.
         * 投影ベクトルを求めたり, 類似度に使ったり.
         */
        dot: function(v) {
            return this.x * v.x + this.y * v.y;
        },

        /**
         * @method
         * 外積
         */
        cross: function(v) {
            return (this.x*v.y) - (this.y*v.x);
        },
        
        /**
         * 長さを取得
         * ### memo
         * magnitude って名前の方が良いかも. 検討中.
         */
        length: function() {
            return Math.sqrt(this.x*this.x + this.y*this.y);
        },
        
        /**
         * 2乗された長さを取得
         * C# の名前を引用
         * or lengthSquare or lengthSqrt
         */
        lengthSquared: function() {
            return this.x*this.x + this.y*this.y;
        },
        
        /**
         * ２点間の距離を返す
         */
        distance: function(v) {
            return Math.sqrt( Math.pow(this.x-v.x, 2) + Math.pow(this.y-v.y, 2) );
        },
        
        /**
         * ２点間の距離を返す
         */
        distanceSquared: function(v) {
            return Math.pow(this.x-v.x, 2) + Math.pow(this.y-v.y, 2);
        },
        
        /**
         * 正規化
         */
        normalize: function() {
            var length = this.length();
            this.div(length);
            
            return this;
        },
        
        /**
         * 角度(radian)に変換
         */
        toAngle: function() {
            return Math.atan2(this.y, this.x);
        },

        /**
         * スタイル文字列に変換
         */
        toStyleString: function() {
            return "{x:{x}, y:{y}}".format(this);
        },

        /**
         * 文字列に変換
         */
        toString: function() {
            return "{x:{x}, y:{y}}".format(this);
        },
        
        /**
         * X値をセット
         * チェーンメソッド用セッター
         */
        setX: function(x) {
            this.x = x;
            return this;
        },
        
        /**
         * Y値をセット
         * チェーンメソッド用セッター
         */
        setY: function(y) {
            this.y = y;
            return this;
        },
        
    });
    
    
    /**
     * @method
     * @static
     * min
     */
    tm.geom.Vector2.min = function(lhs, rhs) {
        return tm.geom.Vector2(
            (lhs.x < rhs.x) ? lhs.x : rhs.x,
            (lhs.y < rhs.y) ? lhs.y : rhs.y
        );
    };
    
    /**
     * @method
     * @static
     * max
     */
    tm.geom.Vector2.max = function(lhs, rhs) {
        return tm.geom.Vector2(
            (lhs.x > rhs.x) ? lhs.x : rhs.x,
            (lhs.y > rhs.y) ? lhs.y : rhs.y
        );
    };
    
    /**
     * @method
     * @static
     * 加算
     */
    tm.geom.Vector2.add = function(lhs, rhs) {
        return tm.geom.Vector2(lhs.x+rhs.x, lhs.y+rhs.y);
    };
    
    /**
     * @method
     * @static
     * 減算
     */
    tm.geom.Vector2.sub = function(lhs, rhs) {
        return tm.geom.Vector2(lhs.x-rhs.x, lhs.y-rhs.y);
    };
    
    /**
     * @method
     * @static
     * 乗算
     */
    tm.geom.Vector2.mul = function(v, n) {
        return tm.geom.Vector2(v.x*n, v.y*n);
    };
    
    /**
     * @method
     * @static
     * 割算
     */
    tm.geom.Vector2.div = function(v, n) {
        return tm.geom.Vector2(v.x/n, v.y/n);
    };
    
    /**
     * @method
     * @static
     * 反転
     */
    tm.geom.Vector2.negate = function(v) {
        return tm.geom.Vector2(-v.x, -v.y);
    };
    
    /**
     * @method
     * @static
     * 内積.
     * 投影ベクトルを求めたり, 類似度に使ったり.
     */
    tm.geom.Vector2.dot = function(lhs, rhs) {
        return lhs.x * rhs.x + lhs.y * rhs.y;
    };
    

    /**
     * @method
     * @static
     * 外積
     */
    tm.geom.Vector2.cross = function(lhs, rhs) {
        return (lhs.x*rhs.y) - (lhs.y*rhs.x);
    };
    
    /**
     * @method
     * @static
     * ２点間の距離を返す
     */
    tm.geom.Vector2.distance = function(lhs, rhs) {
        return Math.sqrt( Math.pow(lhs.x-rhs.x, 2) + Math.pow(lhs.y-rhs.y, 2) );
    };
    
    /**
     * @method
     * @static
     * ２点間の距離を返す
     */
    tm.geom.Vector2.distanceSquared = function(lhs, rhs) {
        return Math.pow(lhs.x-rhs.x, 2) + Math.pow(lhs.y-rhs.y, 2);
    };

    /**
     * @method
     * @static
     * マンハッタン距離
     */
    tm.geom.Vector2.manhattanDistance = function(lhs, rhs) {
        return Math.abs(lhs.x-rhs.x) + Math.abs(lhs.y-rhs.y);
    };
    
    /**
     * @method
     * @static
     * 反射ベクトル
     */
    tm.geom.Vector2.reflect = function(v, normal) {
        var len = Vector2.dot(v, normal);
        var temp= Vector2.mul(normal, 2*len);
        
        return tm.geom.Vector2.sub(v, temp);
    };

    /**
     * @method
     * @static
     * 補間.
     * 0.5 で lhs と rhs の中間ベクトルを求めることができます.
     */
    tm.geom.Vector2.lerp = function(lhs, rhs, t) {
        // TODO: 
        return tm.geom.Vector2(
            lhs.x + (rhs.x-lhs.x)*t,
            lhs.y + (rhs.y-lhs.y)*t
        );
    };
    
    
    /**
     * @method
     * @static
     * 補間
     */
    tm.geom.Vector2.slerp = function(lhs, rhs, t) {
        // TODO:
        // cos...
    };
    

    /**
     * @method
     * @static
     * min ~ max の間でランダムな方向のベクトルを生成する. len で長さ指定.
     */
    tm.geom.Vector2.random = function(min, max, len) {
        min = min || 0;
        max = max || 360;
        len = len || 1;
        return tm.geom.Vector2().setDegree(Math.randf(min, max), len);
    };
    
    
    /**
     * @property
     * @static
     * zero
     */
    tm.geom.Vector2.ZERO    = tm.geom.Vector2( 0, 0);
    
    /**
     * @property
     * @static
     * left
     */
    tm.geom.Vector2.LEFT    = tm.geom.Vector2(-1, 0);
    
    
    /**
     * @property
     * @static
     * right
     */
    tm.geom.Vector2.RIGHT   = tm.geom.Vector2( 1, 0);
    
    /**
     * @property
     * @static
     * up
     */
    tm.geom.Vector2.UP      = tm.geom.Vector2( 0, 1);
    
    /**
     * @property
     * @static
     * down
     */
    tm.geom.Vector2.DOWN    = tm.geom.Vector2( 0,-1);
    
})();


/*
 * vector3.js
 */

/*
 * 幾何学
 */
tm.geom = tm.geom || {};


(function() {
    
    /**
     * @class tm.geom.Vector3
     * 3次元ベクトル
     */
    tm.geom.Vector3 = tm.createClass({
        /** x 座標 */
        x: 0,
        /** y 座標 */
        y: 0,
        /** z 座標 */
        z: 0,
        

        /**
         * @constructor
         * - [Test Program](http://tmlib-js.googlecode.com/svn/trunk/test/geom/vector-test.html)
         */
        init: function(x, y, z) {
            this.set(x, y, z);
        },
        
        /**
         * セット
         */
        set: function(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            
            return this;
        },
        
        /**
         * 数値からセット
         */
        setNumber: function(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            
            return this;
        },
        
        /**
         * 配列からセット
         */
        setArray: function(arr) {
            this.x = arr[0];
            this.y = arr[1];
            this.z = arr[2];
            
            return this;
        },
        
        /**
         * オブジェクトからセット
         */
        setObject: function(obj) {
            this.x = obj.x;
            this.y = obj.y;
            this.z = obj.z;
            
            return this;
        },
        
        /**
         * 文字列からセット
         */
        setString: function(str) {
            var m = str.match(/(-?\d+(\.{1}\d+)?),\s*(-?\d+(\.{1}\d+)?),\s*(-?\d+(\.{1}\d+)?)/);
            this.x = parseFloat(m[1]);
            this.y = parseFloat(m[3]);
            this.z = parseFloat(m[5]);
            
            return this;
        },
        
        /**
         * 角度(radian)と長さでベクトルをセット
         */
        setAngle: function(thetaRad, phiRad, len) {
            len = len || 1;
            
            this.x = len * Math.cos(thetaRad) * Math.sin(phiRad);
            this.y = len * Math.sin(thetaRad);
            this.z = len * Math.cos(thetaRad) * Math.cos(phiRad);
            
            return this;
        },
        
        /**
         * 角度(radian)と長さでベクトルをセット
         */
        setRadian: function(thetaRad, phiRad, len) {
            return this.setAngle(thetaRad, phiRad, len);
        },
        
        /**
         * 角度(degree)と長さでベクトルをセット
         */
        setDegree: function(thetaDegree, phiDegree, len) {
            return this.setAngle(thetaDegree*Math.DEG_TO_RAD, phiDegree*Math.DEG_TO_RAD, len);
        },
        
        /**
         * 賢いセット
         */
        setSmart: function(x, y, z) {
            var v = arguments[0];
            // xyz
            if (arguments.length === 3) {
                this.x = x;
                this.y = y;
                this.z = z;
            }
            // Array
            else if (v instanceof Array) {
                this.x = v[0];
                this.y = v[1];
                this.z = v[2];
            }
            // Object
            else if (v instanceof Object) {
                this.x = v.x;
                this.y = v.y;
                this.z = v.z;
            }
            // String
            else if (typeof(v) == "string") {
                var m = v.match(/(-?\d+(\.{1}\d+)?),\s*(-?\d+(\.{1}\d+)?),\s*(-?\d+(\.{1}\d+)?)/);
                this.x = parseFloat(m[1]);
                this.y = parseFloat(m[3]);
                this.z = parseFloat(m[5]);
            }
            
            return this;
        },
        
        /**
         * 加算
         */
        add: function(v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            
            return this;
        },
        
        /**
         * 減算
         */
        sub: function(v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            
            return this;
        },
        
        /**
         * 乗算
         */
        mul: function(n) {
            this.x *= n;
            this.y *= n;
            this.z *= n;
            
            return this;
        },
        
        /**
         * 除算
         */
        div: function(n) {
            console.assert(n != 0, "0 division!!");
            this.x /= n;
            this.y /= n;
            this.z /= n;
            
            return this;
        },
        
        /**
         * 反転
         */
        negate: function() {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
            
            return this;
        },

        /**
         * 内積.
         * 投影ベクトルを求めたり, 類似度に使ったり.
         */
        dot: function(v) {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        },

        /**
         * 外積
         */
        cross: function(v) {
            var x = this.y*v.z - this.z*v.y;
            var y = this.z*v.x - this.x*v.z;
            var z = this.x*v.y - this.y*v.x;

            this.set(x, y, z);

            return this;
        },
        
        /**
         * 長さを取得
         * or magnitude
         */
        length: function() {
            return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
        },
        
        /**
         * 2乗された長さを取得
         * C# の名前を引用
         * or lengthSquare or lengthSqrt
         */
        lengthSquared: function() {
            return this.x*this.x + this.y*this.y + this.z*this.z;
        },
        
        /**
         * 正規化
         */
        normalize: function() {
            var length = this.length();
            this.div(length);
            
            return this;
        },
        
        /**
         * ２次元ベクトルに変換
         */
        toVector2: function() {
            // TODO:
        },
        

        /**
         * 角度(radian)に変換
         */
        toAngleXY: function() {
            return Math.atan2(this.y, this.x);
        },
        
        
        /**
         * 3D化する
         */
        to3D: function() {
            // TODO: 3d化する
        },
        
        /**
         * 等しいか
         */
        equals: function(x, y, z) {
            return ( (this.x === x) && (this.y === y) && (this.z === z) );
        },
        // equals: function(obj) {
            // return this.equals(obj.x, obj.y, obj.z);
        // },
        
        /**
         * 配列と等しいか
         */
        equalsArray: function(arr) {
            return this.equals(arr[0], arr[1], arr[2]);
        },
        
        /**
         * オブジェクトと等しいか
         */
        equalsObject: function(obj) {
            return this.equals(obj.x, obj.y, obj.z);
        },
        
        /**
         * 賢い比較
         */
        equalsSmart: function() {
            // TODO: 
        },

        /**
         * スタイル文字列に変換
         */
        toStyleString: function() {
            return "{x:{x}, y:{y}, z:{z}}".format(this);
        },

        /**
         * 文字列に変換
         */
        toString: function() {
            return "{x:{x}, y:{y}, z:{z}}".format(this);
        },
        
        
        /**
         * X値をセット
         * チェーンメソッド用セッター
         */
        setX: function(x) {
            this.x = x;
            return this;
        },
        
        /**
         * Y値をセット
         * チェーンメソッド用セッター
         */
        setY: function(y) {
            this.y = y;
            return this;
        },
        
        /**
         * Z値をセット
         * チェーンメソッド用セッター
         */
        setZ: function(z) {
            this.z = z;
            return this;
        }
    });
    
    
    
    /**
     * @method
     * @static
     * min
     */
    tm.geom.Vector3.min = function(lhs, rhs) {
        return Vector3(
            (lhs.x < rhs.x) ? lhs.x : rhs.x,
            (lhs.y < rhs.y) ? lhs.y : rhs.y,
            (lhs.z < rhs.z) ? lhs.z : rhs.z
        );
    };
    
    /**
     * @method
     * @static
     * max
     */
    tm.geom.Vector3.max = function(lhs, rhs) {
        return Vector3(
            (lhs.x > rhs.x) ? lhs.x : rhs.x,
            (lhs.y > rhs.y) ? lhs.y : rhs.y,
            (lhs.z > rhs.z) ? lhs.z : rhs.z
        );
    };
    
    /**
     * @method
     * @static
     * 加算
     */
    tm.geom.Vector3.add = function(lhs, rhs) {
        return tm.geom.Vector3(lhs.x+rhs.x, lhs.y+rhs.y, lhs.z+rhs.z);
    };
    
    /**
     * @method
     * @static
     * 減算
     */
    tm.geom.Vector3.sub = function(lhs, rhs) {
        return tm.geom.Vector3(lhs.x-rhs.x, lhs.y-rhs.y, lhs.z-rhs.z);
    };
    
    /**
     * @method
     * @static
     * 乗算
     */
    tm.geom.Vector3.mul = function(v, n) {
        return tm.geom.Vector3(v.x*n, v.y*n, v.z*n);
    };
    
    /**
     * @method
     * @static
     * 割算
     */
    tm.geom.Vector3.div = function(v, n) {
        return tm.geom.Vector3(v.x/n, v.y/n, v.z/n);
    };
    
    /**
     * @method
     * @static
     * 内積.
     * 投影ベクトルを求めたり, 類似度に使ったり.
     */
    tm.geom.Vector3.dot = function(lhs, rhs) {
        return lhs.x * rhs.x + lhs.y * rhs.y + lhs.z * rhs.z;
    };
    

    /**
     * @method
     * @static
     * 外積
     */
    tm.geom.Vector3.cross = function(lhs, rhs) {
        return tm.geom.Vector3(
            lhs.y*rhs.z - lhs.z*rhs.y,
            lhs.z*rhs.x - lhs.x*rhs.z,
            lhs.x*rhs.y - lhs.y*rhs.x
        );
    };
    
    /**
     * @method
     * @static
     * 反転
     */
    tm.geom.Vector3.negate = function(v) {
        return tm.geom.Vector3(-v.x, -v.y, -v.z);
    };
    
    /**
     * @method
     * @static
     * ２点間の距離を返す
     */
    tm.geom.Vector3.distance = function(lhs, rhs) {
        return Math.sqrt( Math.pow(lhs.x-rhs.x, 2) + Math.pow(lhs.y-rhs.y, 2) + Math.pow(lhs.z-rhs.z, 2) );
    };
    
    /**
     * @method
     * @static
     * ２点間の距離を返す
     */
    tm.geom.Vector3.distanceSquared = function(lhs, rhs) {
        return Math.pow(lhs.x-rhs.x, 2) + Math.pow(lhs.y-rhs.y, 2) + Math.pow(lhs.z-rhs.z, 2);
    };

    /**
     * @method
     * @static
     * マンハッタン距離
     */
    tm.geom.Vector3.manhattanDistance = function(lhs, rhs) {
        return Math.abs(lhs.x-rhs.x) + Math.abs(lhs.y-rhs.y) + Math.abs(lhs.z-rhs.z);
    };
    
    /**
     * @method
     * @static
     * 反射ベクトル
     */
    tm.geom.Vector3.reflect = function(v, normal) {
        var len = Vector3.dot(v, normal);
        var temp= Vector3.mul(normal, 2*len);
        
        return Vector3.sub(v, temp);
    };

    /**
     * @method
     * @static
     * 補間.
     * 0.5 で lhs と rhs の中間ベクトルを求めることができます.
     */
    tm.geom.Vector3.lerp = function(lhs, rhs, t) {
        return tm.geom.Vector3(
            lhs.x + (rhs.x-lhs.x)*t,
            lhs.y + (rhs.y-lhs.y)*t,
            lhs.z + (rhs.z-lhs.z)*t
        );
    };
    
    
    /**
     * @method
     * @static
     * 補間
     */
    tm.geom.Vector3.slerp = function(lhs, rhs, t) {
        // TODO:
        // cos...
    };
    
    /**
     * @method
     * @static
     * min ~ max の間でランダムな方向のベクトルを生成する. len で長さ指定.
     */
    tm.geom.Vector3.random = function(thetaMin, thetaMax, phiMin, phiMax, len) {
        thetaMin= thetaMin || 0;
        thetaMax= thetaMax || 360;
        phiMin  = phiMin || 0;
        phiMax  = phiMax || 360;
        len = len || 1;
        return TM.Geom.Vector3().setFromDegree(TM.randomf(thetaMin, thetaMax), TM.randomf(phiMin, phiMax), len);
    };
    
    
    
    /*
    Vector3.prototype.accessor("length", {
        "get": function()    { return this.length(); },
        "set": function(len) { this.normalize().mul(len); }
    });
    */
    
    
    /**
     * @property
     * @static
     * zero
     */
    tm.geom.Vector3.ZERO    = tm.geom.Vector3( 0, 0, 0);
    
    /**
     * @property
     * @static
     * left
     */
    tm.geom.Vector3.LEFT    = tm.geom.Vector3(-1, 0, 0);
    
    /**
     * @property
     * @static
     * right
     */
    tm.geom.Vector3.RIGHT   = tm.geom.Vector3( 1, 0, 0);
    
    /**
     * @property
     * @static
     * up
     */
    tm.geom.Vector3.UP      = tm.geom.Vector3( 0, 1, 0);
    
    /**
     * @property
     * @static
     * down
     */
    tm.geom.Vector3.DOWN    = tm.geom.Vector3( 0,-1, 0);
    
    /**
     * @property
     * @static
     * forward
     */
    tm.geom.Vector3.FORWARD = tm.geom.Vector3( 0, 0,-1);
    
    /**
     * @property
     * @static
     * backward
     */
    tm.geom.Vector3.BACKWARD= tm.geom.Vector3( 0, 0, 1);
    
})();


/*
 * matrix33.js
 */

tm.geom = tm.geom || {};

(function() {
    
    /**
     * @class   tm.geom.Matrix33
     * 3*3 マトリックスクラス
     */
    tm.define("tm.geom.Matrix33", {
        /**
         * 要素
         */
        m: null,
        
        /**
         * @constructor
         */
        init: function() {
            this.m = [];
            if (arguments.length >= 9) {
                this.set.apply(this, arguments);
            }
            else {
                this.identity();
            }
        },
        
        /**
         * クローン
         */
        clone: function() {
            var m = this.m;
            return tm.geom.Matrix33(
                m[0], m[3], m[6],
                m[1], m[4], m[7],
                m[2], m[5], m[8]
            );
        },
        
        /**
         * セッター
         */
        set: function(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
            console.assert(arguments.length>=9, "");
            
            // |m00, m01, m02|
            // |m10, m11, m12|
            // |m20, m21, m22|
            
            // |m[0], m[3], m[6]|
            // |m[1], m[4], m[7]|
            // |m[2], m[5], m[8]|
            
            // |a, b, tx|
            // |c, d, ty|
            // |0, 0,  1|
            
            this.m00 = m00; this.m01 = m01; this.m02 = m02;
            this.m10 = m10; this.m11 = m11; this.m12 = m12;
            this.m20 = m20; this.m21 = m21; this.m22 = m22;
            
            return this;
        },
        
        /**
         * 配列からセット
         */
        setArray: function(arr) {
            this.set(
                arr[0], arr[3], arr[6],
                arr[1], arr[4], arr[7],
                arr[2], arr[5], arr[8]
            );
            
            return this;
        },
        
        /**
         * オブジェクトからセット
         */
        setObject: function(obj) {
            this.set(
                obj.m00, obj.m01, obj.m02,
                obj.m10, obj.m11, obj.m12,
                obj.m20, obj.m21, obj.m22
            );
            
            return this;
        },
        
        /**
         * 単位行列
         */
        identity: function() {
            var m = this.m;
            
            m[0] = 1; m[3] = 0; m[6] = 0;
            m[1] = 0; m[4] = 1; m[7] = 0;
            m[2] = 0; m[5] = 0; m[8] = 1;
            
            return this;
        },
        
        /**
         * 転置
         */
        transpose: function() {
            this.m.swap(1, 3);
            this.m.swap(2, 6);
            this.m.swap(5, 7);
            
            return this;
        },
        
        /**
         * 逆行列
         */
        invert: function() {
            var m = this.m;
            var m00 = m[0], m01 = m[3], m02 = m[6];
            var m10 = m[1], m11 = m[4], m12 = m[7];
            var m20 = m[2], m21 = m[5], m22 = m[8];
            var det = this.determinant();
            
            // |m00, m01, m02|
            // |m10, m11, m12|
            // |m20, m21, m22|
            
            this.m00 = (m11*m22-m12*m21)/det;
            this.m01 = (m10*m22-m12*m20)/det*-1;
            this.m02 = (m10*m21-m11*m20)/det;
            
            this.m10 = (m01*m22-m02*m21)/det*-1;
            this.m11 = (m00*m22-m02*m20)/det;
            this.m12 = (m00*m21-m01*m20)/det*-1;
            
            this.m20 = (m01*m12-m02*m11)/det;
            this.m21 = (m00*m12-m02*m10)/det*-1;
            this.m22 = (m00*m11-m01*m10)/det;
            
            this.transpose();
            
            return this;
        },

        /**
         * 行列式
         */
        determinant: function() {
            var m = this.m;
            
            var m00 = m[0], m01 = m[3], m02 = m[6];
            var m10 = m[1], m11 = m[4], m12 = m[7];
            var m20 = m[2], m21 = m[5], m22 = m[8];
            
            return m00*m11*m22 + m10*m21*m02 + m01*m12*m20 - m02*m11*m20 - m01*m10*m22 - m12*m21*m00;
        },
        
        /**
         * ゼロクリア
         */
        zero: function() {
            this.set(
                0, 0, 0,
                0, 0, 0,
                0, 0, 0
            );
            
            return this;
        },
        
        /**
         * 移動
         */
        translate: function(x, y) {
            var m = this.m;
            
            m[6] = m[0] * x + m[3] * y + m[6];
            m[7] = m[1] * x + m[4] * y + m[7];
            m[8] = m[2] * x + m[5] * y + m[8];
            
            return this;
            
            return this.multiply( tm.geom.Matrix33.translate(x, y) );
        },
        
        /**
         * X軸回転
         */
        rotateX: function(rad) {
            return this.multiply( tm.geom.Matrix33.rotateX(rad) );
        },
        
        /**
         * Y軸回転
         */
        rotateY: function(rad) {
            return this.multiply( tm.geom.Matrix33.rotateY(rad) );
        },
        
        /**
         * Z軸回転
         */
        rotateZ: function(rad) {
            var s = Math.sin(rad);
            var c = Math.cos(rad);
            var m = this.m;
            
            var m00 = m[0];
            var m10 = m[1];
            var m20 = m[2];
            var m01 = m[3];
            var m11 = m[4];
            var m21 = m[5];
            
            
            return this.multiply( tm.geom.Matrix33.rotateZ(rad) );
        },
        
        /**
         * スケーリング
         */
        scale: function(x, y) {
            var m = this.m;
            
            m[0] *= x; m[3] *= y;
            m[1] *= x; m[4] *= y;
            m[2] *= x; m[5] *= y;
            
            return this;
            return this.multiply( tm.geom.Matrix33.scale(x, y) );
        },
        
        /**
         * 掛け算
         */
        multiply: function(mat) {
            var tm = this.m;
            var om = mat.m;
            
            var a00 = tm[0], a01 = tm[3], a02 = tm[6];
            var a10 = tm[1], a11 = tm[4], a12 = tm[7];
            var a20 = tm[2], a21 = tm[5], a22 = tm[8];
            var b00 = om[0], b01 = om[3], b02 = om[6];
            var b10 = om[1], b11 = om[4], b12 = om[7];
            var b20 = om[2], b21 = om[5], b22 = om[8];
            
            
            tm[0] = a00*b00 + a01*b10 + a02*b20;
            tm[3] = a00*b01 + a01*b11 + a02*b21;
            tm[6] = a00*b02 + a01*b12 + a02*b22;
            
            tm[1] = a10*b00 + a11*b10 + a12*b20;
            tm[4] = a10*b01 + a11*b11 + a12*b21;
            tm[7] = a10*b02 + a11*b12 + a12*b22;
            
            tm[2] = a20*b00 + a21*b10 + a22*b20;
            tm[5] = a20*b01 + a21*b11 + a22*b21;
            tm[8] = a20*b02 + a21*b12 + a22*b22;
            
            return this;
        },
        
        /**
         * ベクトルとの掛け算
         */
        multiplyVector2: function(v) {
            var vx = this.m00*v.x + this.m01*v.y + this.m02;
            var vy = this.m10*v.x + this.m11*v.y + this.m12;
            
            return tm.geom.Vector2(vx, vy);
        },
        
        /**
         * ベクトルとの掛け算
         */
        multiplyVector3: function(v) {
            var vx = this.m00*v.x + this.m01*v.y + this.m02*v.z;
            var vy = this.m10*v.x + this.m11*v.y + this.m12*v.z;
            var vz = this.m20*v.x + this.m21*v.y + this.m22*v.z;
            
            return tm.geom.Vector3(vx, vy, vz);
        },
        
        /**
         * 配列に変換
         */
        toArray: function() {
            return this.m.slice();
        },
        
        /**
         * 文字列化
         */
        toString: function() {
            return "|{m00}, {m01}, {m02}|\n|{m10}, {m11}, {m12}|\n|{m20}, {m21}, {m22}|".format(this);
        },
        
    });
    
    
    
    /**
     * @property    m00
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("m00", {
        "get": function()   { return this.m[0]; },
        "set": function(v)  { this.m[0] = v;    }
    });
    /**
     * @property    m10
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("m10", {
        "get": function()   { return this.m[1]; },
        "set": function(v)  { this.m[1] = v;    }
    });
    /**
     * @property    m20
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("m20", {
        "get": function()   { return this.m[2]; },
        "set": function(v)  { this.m[2] = v;    }
    });
    
    /**
     * @property    m01
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("m01", {
        "get": function()   { return this.m[3]; },
        "set": function(v)  { this.m[3] = v;    }
    });
    /**
     * @property    m11
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("m11", {
        "get": function()   { return this.m[4]; },
        "set": function(v)  { this.m[4] = v;    }
    });
    /**
     * @property    m21
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("m21", {
        "get": function()   { return this.m[5]; },
        "set": function(v)  { this.m[5] = v;    }
    });
    
    /**
     * @property    m02
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("m02", {
        "get": function()   { return this.m[6]; },
        "set": function(v)  { this.m[6] = v;    }
    });
    /**
     * @property    m12
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("m12", {
        "get": function()   { return this.m[7]; },
        "set": function(v)  { this.m[7] = v;    }
    });
    /**
     * @property    m22
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("m22", {
        "get": function()   { return this.m[8]; },
        "set": function(v)  { this.m[8] = v;    }
    });

    /**
     * @property    a
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("a", {
        "get": function()   { return this.m[0]; },
        "set": function(v)  { this.m[0] = v;    }
    });
    /**
     * @property    b
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("b", {
        "get": function()   { return this.m[3]; },
        "set": function(v)  { this.m[3] = v;    }
    });
    /**
     * @property    c
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("c", {
        "get": function()   { return this.m[1]; },
        "set": function(v)  { this.m[1] = v;    }
    });
    /**
     * @property    d
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("d", {
        "get": function()   { return this.m[4]; },
        "set": function(v)  { this.m[4] = v;    }
    });
    /**
     * @property    tx
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("tx", {
        "get": function()   { return this.m[6]; },
        "set": function(v)  { this.m[6] = v;    }
    });
    /**
     * @property    ty
     * 要素
     */
    tm.geom.Matrix33.prototype.accessor("ty", {
        "get": function()   { return this.m[7]; },
        "set": function(v)  { this.m[7] = v;    }
    });
    

    /**
     * @static
     * @method
     * 移動
     */
    tm.geom.Matrix33.translate = function(x, y) {
        return tm.geom.Matrix33(
            1, 0, x,
            0, 1, y,
            0, 0, 1
        );
    };
    
    /**
     * @static
     * @method
     * X軸回転
     */
    tm.geom.Matrix33.rotateX = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        
        return tm.geom.Matrix33(
            1, 0, 0,
            0, c,-s,
            0, s, c
        );
    };
    
    /**
     * @static
     * @method
     * Y軸回転
     */
    tm.geom.Matrix33.rotateY = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        
        return tm.geom.Matrix33(
             c, 0, s,
             0, 1, 0,
            -s, 0, c
        );
    };
    
    /**
     * @static
     * @method
     * Z軸回転
     */
    tm.geom.Matrix33.rotateZ = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        
        return tm.geom.Matrix33(
            c,-s, 0,
            s, c, 0,
            0, 0, 1
        );
    };
    
    /**
     * @static
     * @method
     * スケーリング
     */
    tm.geom.Matrix33.scale = function(x, y) {
        var mat = tm.geom.Matrix33();
        
        if (y == undefined) y = x;
        
        mat.set(
            x, 0, 0,
            0, y, 0,
            0, 0, 1
        );
        
        return mat;
    };
    
})();










/*
 * matrix44.js
 */

tm.geom = tm.geom || {};

(function() {
    
    /**
     * @class
     * 4*4 マトリックスクラス
     */
    tm.geom.Matrix44 = tm.createClass({
        /** 要素 */
        m: null,

        /**
         * @constructor
         */
        init: function() {
            this.m = [];
            if (arguments.length >= 16) {
                this.set.apply(this, arguments);
            }
            else {
                this.identity();
            }
        },
        
        /**
         * セット
         */
        set: function(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
            console.assert(arguments.length>=16, "");
            
            // |m00, m01, m02, m03|
            // |m10, m11, m12, m13|
            // |m20, m21, m22, m23|
            // |m30, m31, m32, m33|
            
            this.m00 = m00; this.m01 = m01; this.m02 = m02; this.m03 = m03;
            this.m10 = m10; this.m11 = m11; this.m12 = m12; this.m13 = m13;
            this.m20 = m20; this.m21 = m21; this.m22 = m22; this.m23 = m23;
            this.m30 = m30; this.m31 = m31; this.m32 = m32; this.m33 = m33;
            
            return this;
        },
        
        /**
         * 配列からセット
         */
        setArray: function(arr) {
            this.set(
                arr[0], arr[4],  arr[8], arr[12],
                arr[1], arr[5],  arr[9], arr[13],
                arr[2], arr[6], arr[10], arr[14],
                arr[3], arr[7], arr[11], arr[15]
            );
            
            return this;
        },
        
        /**
         * オブジェクトからセット.
         * Matrix44 もこいつでいける!!
         */
        setObject: function(obj) {
            this.set(
                obj.m00, obj.m01, obj.m02, obj.m03,
                obj.m10, obj.m11, obj.m12, obj.m13,
                obj.m20, obj.m21, obj.m22, obj.m23,
                obj.m30, obj.m31, obj.m32, obj.m33
            );
            
            return this;
        },
        
        
        /**
         * 単位行列
         */
        identity: function() {
            this.set(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            );
            return this;
        },
        
        /**
         * 転置
         */
        transpose: function() {
            this.m.swap(1, 4);
            this.m.swap(2, 8);
            this.m.swap(3, 12);
            this.m.swap(6, 9);
            this.m.swap(7, 13);
            this.m.swap(11, 14);
            
            return this;
        },
        
        /**
         * 移動
         */
        translate: function(x, y, z) {
            return this.multiply( tm.geom.Matrix44.translate(x, y, z) );
        },
        
        /**
         * 回転
         */
        rotate: function(angle) {
            // TODO: いつか実装する
            console.error("Unimplemented");
        },
        
        /**
         * X軸を基軸に回転する
         */
        rotateX: function(rad) {
            return this.multiply( tm.geom.Matrix44.rotateX(rad) );
        },
        
        /**
         * Y軸を基軸に回転する
         */
        rotateY: function(rad) {
            return this.multiply( tm.geom.Matrix44.rotateY(rad) );
        },
        
        /**
         * Z軸を基軸に回転する
         */
        rotateZ: function(rad) {
            return this.multiply( tm.geom.Matrix44.rotateZ(rad) );
        },
        
        /**
         * スケーリング
         */
        scale: function(x, y, z) {
            return this.multiply( tm.geom.Matrix44.scale(x, y, z) );
        },
        
        /**
         * ゼロ
         */
        zero: function() {
            this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
            return this;
        },
        
        /**
         * 乗算
         * this * mat
         */
        multiply: function(mat) {
            var m00 = this.m00*mat.m00 + this.m01*mat.m10 + this.m02*mat.m20 + this.m03*mat.m30;
            var m01 = this.m00*mat.m01 + this.m01*mat.m11 + this.m02*mat.m21 + this.m03*mat.m31;
            var m02 = this.m00*mat.m02 + this.m01*mat.m12 + this.m02*mat.m22 + this.m03*mat.m32;
            var m03 = this.m00*mat.m03 + this.m01*mat.m13 + this.m02*mat.m23 + this.m03*mat.m33;
            
            var m10 = this.m10*mat.m00 + this.m11*mat.m10 + this.m12*mat.m20 + this.m13*mat.m30;
            var m11 = this.m10*mat.m01 + this.m11*mat.m11 + this.m12*mat.m21 + this.m13*mat.m31;
            var m12 = this.m10*mat.m02 + this.m11*mat.m12 + this.m12*mat.m22 + this.m13*mat.m32;
            var m13 = this.m10*mat.m03 + this.m11*mat.m13 + this.m12*mat.m23 + this.m13*mat.m33;
            
            var m20 = this.m20*mat.m00 + this.m21*mat.m10 + this.m22*mat.m20 + this.m23*mat.m30;
            var m21 = this.m20*mat.m01 + this.m21*mat.m11 + this.m22*mat.m21 + this.m23*mat.m31;
            var m22 = this.m20*mat.m02 + this.m21*mat.m12 + this.m22*mat.m22 + this.m23*mat.m32;
            var m23 = this.m20*mat.m03 + this.m21*mat.m13 + this.m22*mat.m23 + this.m23*mat.m33;
            
            var m30 = this.m30*mat.m00 + this.m31*mat.m10 + this.m32*mat.m20 + this.m33*mat.m30;
            var m31 = this.m30*mat.m01 + this.m31*mat.m11 + this.m32*mat.m21 + this.m33*mat.m31;
            var m32 = this.m30*mat.m02 + this.m31*mat.m12 + this.m32*mat.m22 + this.m33*mat.m32;
            var m33 = this.m30*mat.m03 + this.m31*mat.m13 + this.m32*mat.m23 + this.m33*mat.m33;
            
            return this.set(
                m00, m01, m02, m03,
                m10, m11, m12, m13,
                m20, m21, m22, m23,
                m30, m31, m32, m33
            );
        },
        
        /*
        getAxisX: function() { return TM.Geom.Vector3(this.m00, this.m10, this.m20); },
        getAxisY: function() { return TM.Geom.Vector3(this.m01, this.m11, this.m21); },
        getAxisZ: function() { return TM.Geom.Vector3(this.m02, this.m12, this.m22); },
        */
        
        /**
         * X軸ベクトルをゲット
         */
        getAxisX: function() { return TM.Geom.Vector3(this.m00, this.m01, this.m02); },
        /**
         * Y軸ベクトルをゲット
         */
        getAxisY: function() { return TM.Geom.Vector3(this.m10, this.m11, this.m12); },
        /**
         * Z軸ベクトルをゲット
         */
        getAxisZ: function() { return TM.Geom.Vector3(this.m20, this.m21, this.m22); },

        /**
         * X軸ベクトルをセット
         */
        setAxisX: function(v) { this.m00=v.x, this.m01=v.y, this.m02=v.z; },
        /**
         * Y軸ベクトルをセット
         */
        setAxisY: function(v) { this.m10=v.x, this.m11=v.y, this.m12=v.z; },
        /**
         * Z軸ベクトルをセット
         */
        setAxisZ: function(v) { this.m20=v.x, this.m21=v.y, this.m22=v.z; },
        
        /**
         * Matrix33 に変換
         */
        toMatrix33: function() {
            // TODO:
        },
        
        /**
         * 配列に変換
         */
        toArray: function() {
            return this.m.slice();
        },
        
        /**
         * 文字列化
         */
        toString: function() {
            return "|{m00}, {m01}, {m02}, {m03}|\n|{m10}, {m11}, {m12}, {m13}|\n|{m20}, {m21}, {m22}, {m23}|\n|{m30}, {m31}, {m32}, {m33}|".format(this);
        }
        
    });
    
    
    /**
     * @property    m00
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m00", {
        "get": function()   { return this.m[0]; },
        "set": function(v)  { this.m[0] = v;    }
    });
    /**
     * @property    m01
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m10", {
        "get": function()   { return this.m[1]; },
        "set": function(v)  { this.m[1] = v;    }
    });
    /**
     * @property    m02
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m20", {
        "get": function()   { return this.m[2]; },
        "set": function(v)  { this.m[2] = v;    }
    });
    /**
     * @property    m03
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m30", {
        "get": function()   { return this.m[3]; },
        "set": function(v)  { this.m[3] = v;    }
    });
    
    /**
     * @property    m10
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m01", {
        "get": function()   { return this.m[4]; },
        "set": function(v)  { this.m[4] = v;    }
    });
    /**
     * @property    m11
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m11", {
        "get": function()   { return this.m[5]; },
        "set": function(v)  { this.m[5] = v;    }
    });
    /**
     * @property    m12
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m21", {
        "get": function()   { return this.m[6]; },
        "set": function(v)  { this.m[6] = v;    }
    });
    /**
     * @property    m13
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m31", {
        "get": function()   { return this.m[7]; },
        "set": function(v)  { this.m[7] = v;    }
    });
    
    /**
     * @property    m20
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m02", {
        "get": function()   { return this.m[8]; },
        "set": function(v)  { this.m[8] = v;    }
    });
    /**
     * @property    m21
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m12", {
        "get": function()   { return this.m[9]; },
        "set": function(v)  { this.m[9] = v;    }
    });
    /**
     * @property    m22
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m22", {
        "get": function()   { return this.m[10]; },
        "set": function(v)  { this.m[10] = v;    }
    });
    /**
     * @property    m23
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m32", {
        "get": function()   { return this.m[11]; },
        "set": function(v)  { this.m[11] = v;    }
    });
        
    /**
     * @property    m30
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m03", {
        "get": function()   { return this.m[12]; },
        "set": function(v)  { this.m[12] = v;    }
    });
    /**
     * @property    m31
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m13", {
        "get": function()   { return this.m[13]; },
        "set": function(v)  { this.m[13] = v;    }
    });
    /**
     * @property    m32
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m23", {
        "get": function()   { return this.m[14]; },
        "set": function(v)  { this.m[14] = v;    }
    });
    /**
     * @property    m33
     * 要素
     */
    tm.geom.Matrix44.prototype.accessor("m33", {
        "get": function()   { return this.m[15]; },
        "set": function(v)  { this.m[15] = v;    }
    });
    
    
    
    

    /**
     * @static
     * @method
     * 移動
     */
    tm.geom.Matrix44.translate = function(x, y, z) {
        return tm.geom.Matrix44(
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1
        );
    };
    
    /**
     * @static
     * @method
     * X軸回転
     */
    tm.geom.Matrix44.rotateX = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        
        return tm.geom.Matrix44(
            1, 0, 0, 0,
            0, c,-s, 0,
            0, s, c, 0,
            0, 0, 0, 1
        );
    };
    
    /**
     * @static
     * @method
     * Y軸回転
     */
    tm.geom.Matrix44.rotateY = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        
        return tm.geom.Matrix44(
             c, 0, s, 0,
             0, 1, 0, 0,
            -s, 0, c, 0,
             0, 0, 0, 1
        );
    };
    
    /**
     * @static
     * @method
     * Z軸回転
     */
    tm.geom.Matrix44.rotateZ = function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        
        return tm.geom.Matrix44(
            c,-s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
    };
    
    /**
     * @static
     * @method
     * スケーリング
     */
    tm.geom.Matrix44.scale = function(x, y, z) {
        var mat = tm.geom.Matrix44();
        
        if (y == undefined) y = x;
        if (z == undefined) z = x;
        
        mat.set(
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        );
        
        return mat;
    };

    /**
     * @static
     * @method
     * perspective
     */
    tm.geom.Matrix44.perspective = function(fovy, aspect, znear, zfar) {
        var yscale = 1.0 / Math.tan(0.5*fovy*Math.PI/180);
        var xscale = yscale / aspect;

        return tm.geom.Matrix44(
            xscale, 0.0, 0.0, 0.0,
            0.0, yscale, 0.0, 0.0,
            0.0, 0.0, zfar/(zfar-znear), znear*zfar/(znear-zfar),
            0.0, 0.0, 1.0, 0.0
        );
    };
    
    /**
     * @static
     * @method
     * ortho
     */
    tm.geom.Matrix44.ortho = function(left, right, bottom, top, near, far) {
        /*
        var lr = 1 / (left - right),
            bt = 1 / (bottom - top),
            nf = 1 / (near - far);
        
        return tm.geom.Matrix44(
            -2*lr, 0, 0, 0,
            0, -2*bt, 0, 0,
            0, 0, 2*nf, 0,
            (left+right)*lr, (top+bottom)*bt, (far+near)*nf, 1
        );
        */
        
        var rl = (right - left),
            tb = (top - bottom),
            fn = (far - near);
        return tm.geom.Matrix44(
            2.0/rl,      0,     0, 0,
               0.0, 2.0/tb,     0, 0,
                 0,      0, -2.0/fn, 0,
            -(left+right)/rl, -(top+bottom)/tb, -(far+near)/fn, 1
        ).transpose();
    };

    
    /**
     * @static
     * @method
     * lookAt
     */
    tm.geom.Matrix44.lookAt = function(eye, target, up) {
        var axis_z = tm.geom.Vector3.sub(eye, target).normalize();
        var axis_x = tm.geom.Vector3.cross(up, axis_z).normalize();
        var axis_y = tm.geom.Vector3.cross(axis_z, axis_x).normalize();
        
        /*
        return tm.geom.Matrix44(
            axis_x.x, axis_x.y, axis_x.z, -tm.geom.Vector3.dot(eye, axis_x),
            axis_y.x, axis_y.y, axis_y.z, -tm.geom.Vector3.dot(eye, axis_y),
            axis_z.x, axis_z.y, axis_z.z, -tm.geom.Vector3.dot(eye, axis_z),
            0, 0, 0, 1
        );
        */
        
        /*
        return tm.geom.Matrix44(
            axis_x.x, axis_y.x, axis_z.x, 0,
            axis_x.y, axis_y.y, axis_z.y, 0,
            axis_x.z, axis_y.z, axis_z.z, 0,
            -tm.geom.Vector3.dot(eye, axis_x), -tm.geom.Vector3.dot(eye, axis_y), -tm.geom.Vector3.dot(eye, axis_z), 1
        );
        */
        
        var orientation = tm.geom.Matrix44(
            axis_x.x, axis_y.x, axis_z.x, 0,
            axis_x.y, axis_y.y, axis_z.y, 0,
            axis_x.z, axis_y.z, axis_z.z, 0,
            0, 0, 0, 1
        );
        var translation = tm.geom.Matrix44(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -eye.x, -eye.y, -eye.z, 1
        );

        return translation.multiply(orientation);
    };
    
})();


























/*
 * rect.js
 */

tm.geom = tm.geom || {};

(function() {
    
    /**
     * @class tm.geom.Rect
     * 四角形クラス
     */
    tm.geom.Rect = tm.createClass({
        /** x */
        x: 0,
        /** y */
        y: 0,
        /** 幅 */
        width: 0,
        /** 高さ */
        height: 0,
        
        /**
         * @constructor
         */
        init: function(x, y, width, height) {
            this.set(x, y, width, height);
        },
        
        /**
         * セッター
         */
        set: function(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            
            return this;
        },
        

        /**
         * 移動
         */
        move: function(x, y) {
            this.x = x;
            this.y = y;
            return this;
        },
        
        /**
         * 現在位置を基準に移動
         */
        moveBy: function(x, y) {
            this.x += x;
            this.y += y;
            return this;
        },
        
        /**
         * リサイズ
         */
        resize: function(w, h) {
            this.width = w;
            this.height= h;
            return this;
        },
        
        /**
         * 現在のサイズを基準にリサイズ
         */
        resizeBy: function(w, h) {
            this.width += w;
            this.height+= h;
            return this;
        },
        
        /**
         * パディング.
         * 縮めたりなど. 画面ハミ出しチェック時などに便利
         * ## example
         *     var circle = TM.$Circle(10, 10, 10);
         *     var windowRect = TM.$Rect(0, 0, window.innerWidth, window.innerHiehgt);
         *     windowRect.padding(circle.radius);
         *     if (circle.x < windowRect.left) {
         *         // 左にはみ出した時の処理
         *     }
         */
        padding: function(top, right, bottom, left) {
            // css の padding に合わせて時計回りにパラメータ調整
            switch (arguments.length) {
                case 1:
                    top = right = bottom = left = arguments[0];
                    break;
                case 2:
                    top     = bottom = arguments[0];
                    right   = left   = arguments[1];
                    break;
                case 3:
                    top     = arguments[0];
                    right   = left = arguments[1];
                    bottom  = arguments[2];
                    break;
            }
            
            this.x += left;
            this.y += top;
            this.width -= left+right;
            this.height-= top +bottom;
            
            return this;
        },

        contains: function(x, y) {
            return this.left <= x && x <= this.right && this.top <= y && y <= this.bottom;
        },

        /**
         * クローン
         */
        clone: function() {
            return tm.geom.Rect(this.x, this.y, this.width, this.height);
        },
        
        /**
         * 円に変換
         */
        toCircle: function() {
            return tm.geom.Circle(
                this.centerX,
                this.centerY,
                ((this.width < this.height) ? this.width : this.height)/2
                );
        },

        /**
         * 配列に変換
         */
        toArray: function() {
            return [this.x, this.y, this.width, this.height];
        },
        
    });
    
    
    /**
     * @property    left
     * left
     */
    tm.geom.Rect.prototype.accessor("left", {
        "get": function()   { return this.x; },
        "set": function(v)  { this.width -= v-this.x; this.x = v; }
    });
    
    /**
     * @property    top
     * top
     */
    tm.geom.Rect.prototype.accessor("top", {
        "get": function()   { return this.y; },
        "set": function(v)  { this.height -= v-this.y; this.y = v; }
    });
    
    /**
     * @property    right
     * right
     */
    tm.geom.Rect.prototype.accessor("right", {
        "get": function()   { return this.x + this.width; },
        "set": function(v)  { this.width += v-this.right; }
    });
    
    /**
     * @property    bottom
     * bottom
     */
    tm.geom.Rect.prototype.accessor("bottom", {
        "get": function()   { return this.y + this.height; },
        "set": function(v)  { this.height += v-this.bottom; }
    });
    
    /**
     * @property    centerX
     * centerX
     */
    tm.geom.Rect.prototype.accessor("centerX", {
        "get": function()   { return this.x + this.width/2; },
        "set": function(v)  {
            // TODO: どうしようかな??
        }
    });
    
    /**
     * @property    centerY
     * centerY
     */
    tm.geom.Rect.prototype.accessor("centerY", {
        "get": function()   { return this.y + this.height/2; },
        "set": function(v)  {
            // TODO: どうしようかな??
        }
    });
    
})();


/*
 * circle.js
 */

tm.geom = tm.geom || {};

(function() {
    
    /**
     * @class tm.geom.Circle
     * 円クラス
     */
    tm.define("tm.geom.Circle", {
        /** x */
        x: 0,
        /** y */
        y: 0,
        /** 半径 */
        radius: 0,
        
        /**
         * @constructor
         */
        init: function(x, y, radius) {
            this.set(x, y, radius);
        },
        
        /**
         * セッター
         */
        set: function(x, y, radius) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            
            return this;
        },
        
        /**
         * 移動
         */
        move: function(x, y) {
            this.x = x;
            this.y = y;
            return this;
        },
        
        /**
         * 現在位置を基準に移動
         */
        moveBy: function(x, y) {
            this.x += x;
            this.y += y;
            return this;
        },
        
        /**
         * リサイズ
         */
        resize: function(size) {
            this.radius = size;
            return this;
        },
        
        /**
         * 現在のサイズを基準にリサイズ
         */
        resizeBy: function(size) {
            this.radius += size;
            return this;
        },

        /**
         * 
         */
        contains: function(x, y) {
            var lenX = this.x-x;
            var lenY = this.y-y;
            var lenSquared = (lenX*lenX)+(lenY*lenY);

            return lenSquared <= this.radius*this.radius;
        },

        /**
         * クローン作成
         */
        clone: function() {
            return tm.geom.Circle(this.x, this.y, this.radius);
        },
        
        /**
         * 四角形に変換
         */
        toRect: function() {
            return tm.geom.Rect(
                this.x - this.radius,
                this.y - this.radius,
                this.radius*2, this.radius*2
                );
        },
        
        /**
         * 配列に変換
         */
        toArray: function() {
            return [this.x, this.y, this.radius];
        }
    });
    
    /**
     * @property    left
     * left
     */
    tm.geom.Circle.prototype.getter("left", function() {
        return this.x - this.radius;
    });
    
    /**
     * @property    top
     * top
     */
    tm.geom.Circle.prototype.getter("top", function() {
        return this.y - this.radius;
    });
    
    /**
     * @property    right
     * right
     */
    tm.geom.Circle.prototype.getter("right", function() {
        return this.x + this.radius;
    });
    
    /**
     * @property    bottom
     * bottom
     */
    tm.geom.Circle.prototype.getter("bottom", function() {
        return this.y + this.radius;
    });
    
})();


/*
 * collision.js
 */

tm.collision = tm.collision || {};
 
(function() {

    /**
     * @class tm.collision
     * 衝突判定
     */
    tm.collision;
    
    /**
     * @method testCircleCircle
     * 円同士の衝突判定
     */
    tm.collision.testCircleCircle = function(circle0, circle1) {
        var distanceSquared = tm.geom.Vector2.distanceSquared(circle0, circle1);
        return distanceSquared <= Math.pow(circle0.radius + circle1.radius, 2);
    };
    
    /**
     * @method testRectRect
     * 矩形同士の衝突判定
     */
    tm.collision.testRectRect = function(rect0, rect1) {
        return (rect0.left < rect1.right) && (rect0.right > rect1.left) &&
               (rect0.top < rect1.bottom) && (rect0.bottom > rect1.top);
    };

    tm.collision.testCircleRect = function(circle, rect) {
        // まずは大きな矩形で判定(高速化)
        var bigRect = tm.geom.Rect(rect.left-circle.radius, rect.top-circle.radius, rect.width+circle.radius*2, rect.height+circle.radius*2);
        if (bigRect.contains(circle.x, circle.y) == false) {
            return false;
        }
        
        // 2種類の矩形と衝突判定
        var r = tm.geom.Rect(rect.left-circle.radius, rect.top, rect.width+circle.radius*2, rect.height);
        if (r.contains(circle.x, circle.y)) {
            return true;
        }
        r.set(rect.left, rect.top-circle.radius, rect.width, rect.height+circle.radius*2);
        if (r.contains(circle.x, circle.y)) {
            return true;
        }
        
        // 円と矩形の４点の判定
        var c = tm.geom.Circle(circle.x, circle.y, circle.radius);
        // left top
        if (c.contains(rect.left, rect.top)) {
            return true;
        }
        // right top
        if (c.contains(rect.right, rect.top)) {
            return true;
        }
        // right bottom
        if (c.contains(rect.right, rect.bottom)) {
            return true;
        }
        // left bottom
        if (c.contains(rect.left, rect.bottom)) {
            return true;
        }
        
        return false;
    };

    tm.collision.testRectCircle = function(rect, circle) {
        return this.testCircleRect(circle, rect);
    };
 
})();














/*
 * element.js
 */


tm.dom = tm.dom || {};

(function() {
    
    /**
     * @class
     * Element クラス
     */
    tm.dom.Element = tm.createClass({
        
        /** エレメント */
        element: null,
        
        /**
         * @constructor
         */
        init: function() {
            this.set.apply(this, arguments);
        },
        
        /**
         * セッター
         */
        set: function(q) {
            if (typeof q === "string") {
                this.element = document.querySelector(q);
            }
            else if (q != undefined) {
                this.element = q;
            }
            else {
                // デフォルトはドキュメント
                this.element = document;
            }
        },
        

        /**
         * 子供の最後尾に追加
         */
        append: function(child) {
            this.element.appendChild(child.element);
            return this;
        },
        
        /**
         * 子供の先頭に追加
         */
        prepend: function(child) {
            this.element.insertBefore(child.element, this.element.firstChild);
            return this;
        },
        
        /**
         * 自分の後に追加
         */
        after: function(child) {
            this.element.parentNode.insertBefore(child.element, this.element.nextSibling);
            return this;
        },
        
        /**
         * 自分の前に追加
         */
        before: function(child) {
            this.element.parentNode.insertBefore(child.element, this.element);
            return this;
        },
        
        /**
         * 引数に渡された要素に自分を append
         */
        appendTo: function(parent) {
            parent.append(this);
            return this;
        },
        
        /**
         * 引数に渡された要素に自分を prepend
         */
        prependTo: function(parent) {
            parent.prepend(this);
            return this;
        },
        
        /**
         * 複製
         */
        clone: function() {
            return tm.dom.Element(this.element.cloneNode(true));
        },
        
        /**
         * 親から自分を引っぺがす
         */
        remove: function() {
            this.element.parentNode.removeChild(this.element);
            return this;
        },
        
        /**
         * 要素生成
         */
        create: function(tag, addFuncName) {
            // 要素を生成
            var element = tm.dom.Element(document.createElement(tag));
            // デフォルトの追加方法は append
            if (!addFuncName) { addFuncName="append"; }
            // 自分の子供として追加
            this[addFuncName](element);
            
            return element;
        },
        
        /**
         * query
         */
        query: function(query, index) {
            var elm = (index) ?
                this.element.querySelectorAll(query)[index] : 
                this.element.querySelector(query);
            
            return tm.dom.Element(elm);
        },
        
        /**
         * queryAll
         */
        queryAll: function(query) {
            var list = this.element.querySelectorAll(query);
            return tm.dom.ElementList(list);
        },
        
        /**
         * 固定化
         */
        fixed: function(x, y, width, height) {
            this.style.set("position", "fixed");
            if (x) this.x = x;
            if (y) this.y = y;
            if (width) this.width = width;
            if (height) this.height = height;
            return this;
        },
        
        /**
         * absolute 化
         */
        absolute: function(x, y, width, height) {
            this.style.set("position", "absolute");
            if (x) this.x = x;
            if (y) this.y = y;
            if (width) this.width = width;
            if (height) this.height = height;
            return this;
        },
        
        /**
         * フルスクリーン化
         */
        fullScreen: function() {
            this.element.webkitRequestFullScreen();
        },

        /**
         * 表示
         */
        show: function() {
            this.visible = true;
        },

        /**
         * 非表示
         */
        hide: function() {
            this.visible = false;
        },
        
        /**
         * 文字列に変換
         */
        toString: function() {
            return "tm.dom.element";
        },
        
        /**
         * 要素を取得
         */
        getElement: function() {
            return this.element;
        },
        
    });
    
    
    
    /** @property html  html の値 */
    tm.dom.Element.prototype.accessor("html", {
        "get": function()       { return this.element.innerHTML; },
        "set": function(html)   { this.element.innerHTML = html; }
    });
    /** @property value  value の値 */
    tm.dom.Element.prototype.accessor("value", {
        "get": function()       { return this.element.value; },
        "set": function(value)   { this.element.value = value; }
    });
    /** @property x  x値 */
    tm.dom.Element.prototype.accessor("x", {
        "get": function()   { return Number( this.element.style.left.replace("px", '') ); },
        "set": function(x)  { this.element.style.left = x+"px"; }
    });
    /** @property y  y値 */
    tm.dom.Element.prototype.accessor("y", {
        "get": function()   { return Number( this.element.style.top.replace("px", '') ); },
        "set": function(y)  { this.element.style.top = y+"px"; }
    });
    /** @property width  幅 */
    tm.dom.Element.prototype.accessor("width", {
        "get": function()   { return Number( this.element.style.width.replace("px", '') ); },
        "set": function(w)  { this.element.style.width = w+"px"; }
    });
    /** @property height  高さ */
    tm.dom.Element.prototype.accessor("height", {
        "get": function()   { return Number( this.element.style.height.replace("px", '') ); },
        "set": function(h)  { this.element.style.height = h+"px"; }
    });
    /** @property color  色 */
    tm.dom.Element.prototype.accessor("color", {
        "get": function()       { return this.element.style.color; },
        "set": function(color)  { this.element.style.color = color; }
    });
    /** @property backgroundColor  背景色 */
    tm.dom.Element.prototype.accessor("backgroundColor", {
        "get": function()       { return this.element.style.backgroundColor; },
        "set": function(color)  { this.element.style.backgroundColor = color; }
    });
    /** @property visible  表示/非表示 */
    tm.dom.Element.prototype.accessor("visible", {
        "get": function()   { return this.element.style.visibility != "hidden"; },
        "set": function(v)  { this.element.style.visibility = (v==true) ? "visible" : "hidden"; }
    });
    /** @property text  テキスト */
    tm.dom.Element.prototype.accessor("text", {
        "get": function()   { return this.element.innerText || this.element.textContent; },
        "set": function(v)  {
            if (this.element.innerText) {
                this.element.innerText = v;
            } else {
                this.element.textContent = v;
            }
        }
    });
    /** @property classList  クラスリスト */
    tm.dom.Element.prototype.getter("classList", function()   { return this.element.classList; });
    /** @property parent */
    tm.dom.Element.prototype.getter("parent", function(){
        return (this.element.parentNode != undefined) ? tm.dom.Element(this.element.parentNode) : null;
    });
    /** @property prev */
    tm.dom.Element.prototype.getter("prev", function(){
        return (this.element.previousSibling != undefined) ? tm.dom.Element(this.element.previousSibling) : null;
    });
    /** @property next */
    tm.dom.Element.prototype.getter("next", function(){
        return (this.element.nextSibling != undefined) ? tm.dom.Element(this.element.nextSibling) : null;
    });
    /** @property children */
    tm.dom.Element.prototype.getter("children", function(){
        return tm.dom.ElementList(this.element.children);
    });
    
    
})();





(function(){
    
    /**
     * @class tm.dom.ElementList
     * エレメントリスト
     * @extends global.Array
     */
    tm.dom.ElementList = tm.createClass({
        superClass: Array,
        
        /**
         * @constructor
         * TM.DOM.Element 用配列
         */
        init: function(arr) {
            if (typeof arguments[0] == "string") {
                var query = arguments[0];
                arr = document.querySelectorAll(query);
            }
            else if (arr == undefined) {
                return ;
            }
            
            for (var i=0,len=arr.length; i<len; ++i) {
                this.push( tm.dom.Element(arr[i]) );
            }
        },
        
        /**
         * 文字列に変換
         */
        toString: function() {
            return "";
        }
    });
    
})();


/*
 * dom/evnet.js
 */

tm.dom = tm.dom || {};

(function() {
    
    /**
     * @class global.Event
     * 既存のEventオブジェクト拡張
     */
    
    // 仕方なしの IE 対応(これ引っかかったら他のもダメだから必要ないかも)
    if (!Event.prototype.stopPropagation) {
        /** @method */
        Event.prototype.stopPropagation = function() {
            this.cancelBubble = true;
        };
    }
    if (!Event.prototype.preventDefault) {
        /** @method */
        Event.prototype.preventDefault = function() {
            this.returnValue = false;
        };
    }
    
    /**
     * @method stop
     * イベントのデフォルト処理 & 伝達を止める
     */
    Event.prototype.stop = function() {
        // イベントキャンセル
        this.preventDefault();
        // イベント伝達を止める
        this.stopPropagation();
    };
    
})();


(function() {
    
    /**
     * @class global.KeyboardEvent
     * KeyboardEvent クラス
     */
    
    /**
     * @method    character
     * 押したキーの文字を取得
     */
    KeyboardEvent.prototype.getter("character", function(){
        return String.fromCharCode(this.keyCode);
    });
    
})();


(function() {
    
    /**
     * @class global.MouseEvent
     * MouseEvent クラス
     */
    
    /**
     * @method    pointX
     * マウスのX座標.
     */
    MouseEvent.prototype.getter("pointX", function() {
        return this.clientX - this.target.getBoundingClientRect().left;
//        return this.pageX - this.target.getBoundingClientRect().left - window.scrollX;
    });
    
    /**
     * @method    pointY
     * マウスのY座標.
     */
    MouseEvent.prototype.getter("pointY", function() {
        return this.clientY - this.target.getBoundingClientRect().top;
//        return this.pageY - this.target.getBoundingClientRect().top - window.scrollY;
    });
    
})();




(function() {
    
    if (window.TouchEvent === undefined) { return ; }
    
    
    /**
     * @class global.TouchEvent
     * TouchEvent クラス
     */
    
    /**
     * @method    pointX
     * タッチイベント.
     */
    TouchEvent.prototype.getter("pointX", function() {
        return this.touches[0].clientX - this.target.getBoundingClientRect().left;
//        return this.touches[0].pageX - this.target.getBoundingClientRect().left - tm.global.scrollX;
    });
    
    /**
     * @method    pointY
     * タッチイベント.
     */
    TouchEvent.prototype.getter("pointY", function() {
        return this.touches[0].clientY - this.target.getBoundingClientRect().top;
//        return this.touches[0].pageY - this.target.getBoundingClientRect().top - tm.global.scrollY;
    });
    
    
})();


(function() {
    
    /**
     * @class tm.dom.Event
     * Event クラス
     */
    tm.dom.Event = tm.createClass({

        /** DOMエレメント */
        element     : null,
        /** イベント発火時に実行する関数リスト */
        funcList    : null,
        /** 関数リストのインデックス　未使用？ */
        funcIndex   : 0,
        /** @property domElement */
        
        /**
         * @constructor
         */
        init: function(element) {
            this.element = element;
            this.domElement = element.element;
            this.funcList = {};
        },
        
        /**
         * イベントを追加
         */
        add: function(type, fn, id) {
            var self = this;
            var elm  = this.element;
            
            var temp_fn = function(e) {
                // return fn.apply(self, arguments);
                var result = fn.apply(elm, arguments);
                
                if (result === false) {
                    // デフォルトイベントをキャンセル
                    e.preventDefault();
                    e.returnValue = false;  // IE
                    // イベント伝達をキャンセル
                    e.stopPropagation();
                }
                
                return result;
            }
            
            this._funcIndex = this._funcIndex || 0;
            id = id || this._funcIndex++;
            this.funcList[type] = this.funcList[type] || {};
            this.funcList[type][id] = temp_fn;
            fn._id = id;    // しれっと記録
            
            this.domElement.addEventListener(type, temp_fn, false);
            return this;
        },
        
        /**
         * イベントを解除
         */
        remove: function(type, fn_or_id) {
            var id = (typeof(fn_or_id) === "function") ? fn_or_id._id : fn_or_id;
            var fn = this.getFunc(type, id);
            
            this.domElement.removeEventListener(type, fn, false);
            delete this.funcList[type][id];
        },
        
        /**
         * クリックイベント
         */
        click: function(fn, id) {
            this.add("click", fn, id);
            return this;
        },
        
        /**
         * ミドルクリックイベント
         */
        mdlclick: function(fn, id) {
            var temp_fn = function(e) {
                if (e.button == 1) {
                    fn(e);
                }
            }
            this.add("click", temp_fn, id);
        },
        
        /**
         * ポインティングスタート
         */
        pointstart: function(fn, id) {
            this.add(tm.dom.Event.POINT_START, fn, id);
        },
        /**
         * ポインティング中
         */
        pointmove: function(fn, id) {
            this.add(tm.dom.Event.POINT_MOVE, fn, id);
        },
        /**
         * ポインティングエンド
         */
        pointend: function(fn, id) {
            this.add(tm.dom.Event.POINT_END, fn, id);
        },
        
        /**
         * ホバーイベント
         */
        hover: function(fn, id) {
            this.add("mouseover", fn, id);
            return this;
        },
        
        /**
         * 一度だけ呼ばれるイベントを登録
         */
        one: function(type, fn, id) {
            var self = this;
            var elm  = this.element;
            
            var temp_fn = function() {
                var result = fn.apply(elm, arguments);
                self.remove(type, temp_fn);
                return result;
            };
            
            this.add(type, temp_fn, id);
            
            return this;
        },
        
        /**
         * トグルイベント登録
         */
        toggle: function(type, fn_list) {
            var self = this;
            var elm  = this.element;
            var temp_list = [];
            
            for (var i=0; i<fn_list.length; ++i) {
                var temp_fn = (function(i){
                    return function(){
                        var result = fn_list[i].apply(elm, arguments);
                        
                        if (result !== false) {
                            var index = (i+1)%fn_list.length;
                            self.one(type, temp_list[index]);
                        }
                    }
                })(i);
                temp_list.push(temp_fn);
            }
            
            this.one(type, temp_list[0]);
            
            return this;
        },
        
        /**
         * 指定したイベントタイプ & id の関数を取得
         */
        getFunc: function(type, id) {
            return this.funcList[type][id];
        },
        
    });
    
    /** @static @property */
    tm.dom.Event.POINT_START    = (tm.isMobile) ? "touchstart" : "mousedown";
    /** @static @property */
    tm.dom.Event.POINT_MOVE     = (tm.isMobile) ? "touchmove" : "mousemove";
    /** @static @property */
    tm.dom.Event.POINT_END      = (tm.isMobile) ? "touchend" : "mouseup";
    
    
    /**
     * @member      tm.dom.Element
     * @property    event
     * スタイルクラス
     */
    tm.dom.Element.prototype.getter("event", function(){
        return this._event || ( this._event = tm.dom.Event(this) );
    });
    
})();




/*
 * attr.js
 */

tm.dom = tm.dom || {};

(function(){
    
    /**
     * @class tm.dom.Attr
     * 属性クラス
     */
    tm.dom.Attr = tm.createClass({
        
        /**
         * エレメント
         */
        element: null,
        
        /**
         * @constructor
         */
        init: function(element) {
            this.element = element;
        },
        
        /**
         * 属性をセット
         */
        set: function(name, value) {
            this.element.setAttribute(name, value);
            return this;
        },
        
        /**
         * 属性を追加
         */
        add: function(name, value) {
            var now = this.get(name);
            value = (now) ? now + ' ' + value : value;
            this.element.setAttribute(name, value);
            return this;
        },
        
        /**
         * 属性を削除
         */
        remove: function(name, value) {
            // value があるときはそれのみを削除する
            if (value) {
                var now = this.get(name);
                var next= (now) ? now.replace(value, '').replace('  ', ' ') : '';
                this.element.setAttribute(name, next.trim());
            }
            // ないときは属性そのものを削除する
            else {
                this.element.removeAttribute(name);
            }
            return this;
        },
        
        /**
         * 属性を取得
         */
        get: function(name) {
            return this.element.getAttribute(name);
        },

        /**
         * 属性の存在チェック
         */
        contains: function(name, value) {
            var now = this.get(name);
            if (arguments.length == 1) {
                return now != null;
            }
            else if (arguments.length == 2) {
                return (' '+now+' ').indexOf(' '+value+' ') > -1;
            }

            return false;
        },

        /**
         * トグル
         */
        toggle: function(name, value) {
            if (this.contains(name, value)) {
                this.remove(name, value);
            } else {
                this.add(name, value);
            }
            return this;
        }
    });
    
    /**
     * Attr クラス
     * @property    attr
     */
    tm.dom.Element.prototype.getter("attr", function(){
        return this._attr || ( this._attr = tm.dom.Attr(this.element) );
    });
    
})();


/*
 * style.js
 */

tm.dom = tm.dom || {};

(function(){
    
    /**
     * @class tm.dom.Style
     * スタイル
     */
    tm.dom.Style = tm.createClass({
        
        /** エレメント */
        element: null,
        
        /**
         * @constructor
         */
        init: function(element) {
            this.element = element;
        },
        
        /**
         * セット
         */
        set: function(name, value) {
            this.element.style[name] = value;
            return this;
        },
        
        /**
         * 削除
         */
        remove: function(name) {
            this.element.style.removeProperty(name);
            // delete this.element.style[name];
            return this;
        },
        
        /**
         * クリア
         */
        clear: function(name) {
            
            return this;
        },
        
        /**
         * 取得
         */
        get: function(name) {
            return this.element.style[name];
        },
        
        /**
         * CSS の値も考慮した上での値を取得
         */
        getPropValue: function(prop_name) {
            return document.defaultView.getComputedStyle(this.element, '').getPropertyValue(prop_name);
        },
    });
    
    /**
     * スタイルクラス
     * @member      tm.dom.Element
     * @property    style
     */
    tm.dom.Element.prototype.getter("style", function(){
        return this._style || ( this._style = tm.dom.Style(this.element) );
    });
    
})();


/*
 * anim.js
 */

tm.dom = tm.dom || {};

(function() {
    
    var prefix = tm.VENDER_PREFIX;
    
    var ANIMATION                   = prefix + "Animation";
    var ANIMATION_END               = prefix + "AnimationEnd";
    var ANIMATION_PLAY_STATE        = prefix + "AnimationPlayState";
    var ANIMATION_NAME              = prefix + "AnimationName";
    var ANIMATION_DURATION          = prefix + "AnimationDuration";
    var ANIMATION_TIMING_FUNCTION   = prefix + "AnimationTimingFunction";
    var ANIMATION_DELAY             = prefix + "AnimationDelay";
    var ANIMATION_DIRECTION         = prefix + "AnimationDirection";
    var ANIMATION_ITERATION_COUNT   = prefix + "AnimationIterationCount";
    
    /**
     * @class tm.dom.Anim
     * アニメーションクラス
     */
    tm.dom.Anim = tm.createClass({
        
        /** @property element */

        /**
         * @constructor
         */
        init: function(element) {
            this.element = element;
            
            // アニメーションが終了したらステートを "paused" にする(何度も再生できるようにする為)
            var self = this;
            this.element.addEventListener(ANIMATION_END, function() {
                self.stop();
            }, false);
        },
        
        /**
         * アニメーション開始
         */
        start: function() {
            this.element.style[ANIMATION_PLAY_STATE] = "running";
            return this;
        },
        
        /**
         * アニメーション終了
         */
        stop: function() {
            this.element.style[ANIMATION_PLAY_STATE] = "paused";
            return this;
        },
        
        /**
         * プロパティをセット
         */
        setProperty: function(prop) {
            if (typeof prop == "string") {
                this.element.style[ANIMATION] = prop;
            }
            else {
                for (var key in prop) {
                    var fn = ANIM_SETTER_FUNC_NAME_MAP[key];
                    var value = prop[key];
                    fn.call(this, value);
                }
            }
            return this;
        },
        
        /**
         * 名前をセット
         */
        setName: function(name) {
            this.element.style[ANIMATION_NAME] = name;
            return this;
        },
        
        /**
         * アニメーション時間の長さをセット
         */
        setDuration: function(s) {
            this.element.style[ANIMATION_DURATION] = s;
            return this;
        },
        
        /**
         * 補間関数をセット
         */
        setTimingFunction: function(func) {
            this.element.style[ANIMATION_TIMING_FUNCTION] = func;
            return this;
        },
        
        /**
         * イテレータカウントをセット
         */
        setIterationCount: function(n) {
            this.element.style[ANIMATION_ITERATION_COUNT] = n;
            return this;
        },
        
        /**
         * アニメーション開始待ち時間をセット
         */
        setDelay: function(s) {
            this.element.style[ANIMATION_DELAY] = s;
            return this;
        },
        
        /**
         * 判定再生させるかどうかを指定
         * "normal" or "alternate"
         */
        setDirection: function(t) {
            this.element.style[ANIMATION_DURATION] = t;
            return this;
        },
    });
    
    var ANIM_SETTER_FUNC_NAME_MAP = {
        // 小文字対応
        "name"          : tm.dom.Anim.prototype.setName,
        "duration"      : tm.dom.Anim.prototype.setDuration,
        "timingFunction": tm.dom.Anim.prototype.setTimingFunction,
        "iterationCount": tm.dom.Anim.prototype.setIterationCount,
        "delay"         : tm.dom.Anim.prototype.setDelay,
        
        // 大文字対応
        "Name"          : tm.dom.Anim.prototype.setName,
        "Duration"      : tm.dom.Anim.prototype.setDuration,
        "TimingFunction": tm.dom.Anim.prototype.setTimingFunction,
        "IterationCount": tm.dom.Anim.prototype.setIterationCount,
        "Delay"         : tm.dom.Anim.prototype.setDelay,
    };
    
    /**
     * @property    anim
     */
    tm.dom.Element.prototype.getter("anim", function() {
        return this._anim || (this._anim = tm.dom.Anim(this.element));
    });
    
})();


(function(){
    
    /**
     * @class tm.dom.Trans
     * トランス
     */
    tm.dom.Trans = tm.createClass({
        
        /** エレメント */
        element: null,
        
        /**
         * @constructor
         */
        init: function(element) {
            this.element = element;
        },
        
        /**
         * 変換開始
         */
        to: function(props, t) {
            this.set(props).duration(t||1000);
            return this;
        },

        /**
         * セット
         */
        set: function(props) {
            var style = this.element.style;
            var names = [];
            
            for (var key in props) {
                var name = _checkStyleProperty(key);
                names.push( name.toDash() );
                style[name] = props[key] + "";
            }
            
            style[tm.dom.Trans.PROPERTY] = names.join(', ');   // none;
            
            return this;
        },

        /**
         * 間関
         */
        duration: function(t) {
            var style = this.element.style;
            if (typeof t == "number") t = t + "ms";
            style[tm.dom.Trans.DURATION] = t;
            return this;
        },

        /**
         * イージング
         */
        easing: function(ease) {
            var style = this.element.style;
            style[tm.dom.Trans.TIMING_FUNCTION] = func;
            return this;
        },

        /**
         * 終了
         */
        end: function(fn) {
            var elm  = tm.dom.Element(this.element);
            elm.event.add(tm.dom.Trans.END_EVENT, fn);
            return this;
        },

        /**
         * リセット
         */
        reset: function() {
            var style = this.element.style;
            style[tm.dom.Trans.PROPERTY] = "none";
            return this;
        },

        /**
         * 移動
         */
        translate: function(x, y, t) {
            this.to({"transform": "translate({0}px,{1}px)".format(x, y)}, t);
            return this;
        },

        /**
         * 移動3D
         */
        translate3d: function(x, y, z, t) {
            this.to({"transform": "translate3d({0}px,{1}px,{2}px)".format(x, y, z)}, t);
            return this;
        },

        /**
         * 回転
         */
        rotate: function(deg, t) {
            this.to({"transform": "rotate({0}deg)".format(deg)}, t);
            return this;
        },

        /**
         * 回転3D
         */
        rotate3d: function(x, y, z, deg, t) {
            this.to({"transform": "rotate3d({0},{1},{2},{3}deg)".format(x, y, z, deg)}, t);
            return this;
        },

        /**
         * スケール
         */
        scale: function(x, y, t) {
            this.to({"transform": "scale({0},{1})".format(x, y)}, t);
            return this;
        },

        /**
         * 行列変換
         */
        transform: function() {
            // TODO: 実装する
        },
        
        // -------------------------------------
        
        /**
         * プロパティをセット
         */
        setProp: function(prop) {
            var style = this.element.style;
            var prop_list = [];
            
            for (var key in prop) {
                var name = _checkStyleProperty(key);
                prop_list.push( name.toDash() );
                style[name] = prop[key];
            }
            
            style[tm.dom.Trans.PROPERTY] = prop_list.join(', ');   // none;
            
            return this;
        },

        /**
         * 間関をセット
         */
        setDuration: function(t) {
            var style = this.element.style;
            style[tm.dom.Trans.DURATION] = t;
            return this;
        },

        /**
         * タイミングファンクをセット
         */
        setTimingFunction: function(func) {
            var style = this.element.style;
            style[tm.dom.Trans.TIMING_FUNCTION] = func;
            return this;
        },

        /**
         * リセット
         */
        resetProp: function() {
            var style = this.element.style;
            style[tm.dom.Trans.PROPERTY] = "none";
            return this;
        },

        /**
         * 終了時関数を登録
         */
        setEndFunction: function(fn) {
            var elm  = tm.dom.Element(this.element);
            elm.event.add(tm.dom.Trans.END_EVENT, fn);
            return this;
        },
    });
    
    /** @static @property */
    tm.dom.Trans.PROPERTY        = tm.VENDER_PREFIX + "TransitionProperty";
    /** @static @property */
    tm.dom.Trans.DURATION        = tm.VENDER_PREFIX + "TransitionDuration";
    /** @static @property */
    tm.dom.Trans.TIMING_FUNCTION = tm.VENDER_PREFIX + "TransitionTimingFunction";
    /** @static @property */
    tm.dom.Trans.DELAY           = tm.VENDER_PREFIX + "TransitionDelay";
    /** @static @method @member tm.dom.Trans */
    tm.dom.Trans.END_EVENT       = (function(){
        return {
            "webkit": "webkitTransitionEnd",
            "moz"   : "transitionend",
            "o"     : "oTransitionEnd",
        }[tm.VENDER_PREFIX];
    })();
    
    /**
     * @property    trans
     */
    tm.dom.Element.prototype.getter("trans", function(){
        return this._trans || ( this._trans = tm.dom.Trans(this.element) );
    });
    
    var _styleList = {
        "transform": true,
    };
    var _checkStyleProperty = function(name) {
        if (_styleList[name] === true) {
            return '-'+tm.VENDER_PREFIX + name.capitalizeFirstLetter();
        }
        return name;
    };
})();
/*
 * dom/data.js
 */

(function(){
    
    /**
     * @class tm.dom.Data
     */
    tm.define("tm.dom.Data", {

        /** エレメント */
        element: null,
        
        /**
         * @constructor
         */
        init: function(element) {
            this.element = element;
        },
        
        /**
         * 属性をセット
         */
        set: function(name, value) {
        	var key = "data-" + name.toDash();
            this.element.setAttribute(key, value);

            return this;
        },
        
        /**
         * 属性をゲット
         */
        get: function(name, value) {
        	var key = "data-" + name.toDash();
        	return this.element.attributes[key].value;
        },
    });
    
    /**
     * Attr クラス
     * @property    data
     */
    tm.dom.Element.prototype.getter("data", function(){
        return this._data || ( this._data = tm.dom.Data(this.element) );
    });

})();
/*
 * manager.js
 */

(function() {

    tm.asset = tm.asset || {};
    
    /**
     * アセットマネージャー
     */
    tm.asset.Manager = {
        /** アセット */
        assets: {},
        
        /**
         * アセットのゲット
         * @param {Object} key
         */
        get: function(key) {
            return this.assets[key];
        },

        /**
         * アセットのセット
         * @param {Object} key
         * @param {Object} asset
         */
        set: function(key, asset) {
            this.assets[key] = asset;
            return this;
        },

        /**
         * キーと一致するアセットを含んでいるか
         * @param {Object} key
         */
        contains: function(key) {
            return (this.assets[key]) ? true : false;
        },

    };

})();













(function() {

    /**
     * @class tm.asset.Loader
     * @extends tm.event.EventDispatcher
     * アセットローダー
     */
    tm.define("tm.asset.Loader", {
        superClass: "tm.event.EventDispatcher",

        /** @property assets  アセット */
        
        /**
         * @constructor
         */
        init: function() {
            this.superInit();
            
            this.assets = {};
        },
        
        /**
         * キーと一致するアセットを含んでいるか
         * @param {Object} key
         */
        contains: function(key) {
            return (this.assets[key]) ? true : false;
        },
        
        /**
         * アセットのロード実行
         * @param {Object} arg
         */
        load: function(arg) {
            if (tm.util.Type.isObject(arg)) {
                this._loadByObject(arg);
            }
            else {
                this._loadString(arguments[0], arguments[1], arguments[2]);
            }
            
            return this;
        },

        /**
         * アセットのゲット
         * @param {Object} key
         */
        get: function(key) {
            return this.assets[key];
        },

        /**
         * アセットのセット
         * @param {Object} key
         * @param {Object} asset
         */
        set: function(key, asset) {
            this.assets[key] = asset;
            
            // manager の方にもセットする
            tm.asset.Manager.set(key, asset);
            
            return this;
        },
        
        /**
         * アセットのロード
         * @private
         * @param {Object} key
         * @param {Object} path
         * @param {Object} type
         */
        _load: function(key, path, type) {
            // if (tm.asset.Manager.contains(key)) {
            //     return tm.asset.Manager.get(key);
            // }
            
            path = path || key;
            // type が省略されている場合は拡張子から判定する
            type = type || path.split('?')[0].split('#')[0].split('.').last;
            
            var asset = tm.asset.Loader._funcs[type](path, key);
            this.set(key, asset);
            
            return asset;
        },
        /**
         * 文字列指定のアセットのロード
         * @private
         * @param {Object} key
         * @param {Object} path
         * @param {Object} type
         */
        _loadString: function(key, path, type) {
            
            var hash = {};
            hash[key] = {
                url: path,
                type: type,
            };
            this._loadByObject(hash);
        },
        /**
         * オブジェクト指定のアセットのロード
         * @private
         * @param {Object} hash
         */
        _loadByObject: function(hash) {
            var flow = tm.util.Flow(Object.keys(hash).length, function() {
                var e = tm.event.Event("load");
                this.dispatchEvent(e);
            }.bind(this));
            
            var loadAsset = function(asset, key) {

                var e = tm.event.Event("progress");
                e.key = key;
                e.asset = asset;
                e.progress = (flow.counter+1)/flow.waits; // todo
                this.dispatchEvent(e);

                flow.pass();
            }.bind(this);
            
            Object.keys(hash).each(function(key) {
                var value = hash[key];
                var asset = null;

                if (typeof value == 'string') {
                    asset = this._load(key, value);
                }
                else {
                    asset = this._load(key, value['url'] || value['src'] || value['path'], value['type']);
                }
                
                if (asset.loaded) {
                    loadAsset(asset, key);
                }
                else {
                    asset.on("load", function() {
                        loadAsset(asset, key);
                    });
                }
            }.bind(this));
        },
    });
    
    
    tm.asset.Loader._funcs = [];
    tm.asset.Loader.defineFunction("register", function(type, func) {
        this._funcs[type] = func;
    });
    
    
    var _textureFunc = function(path) {
        var texture = tm.asset.Texture(path);
        return texture;
    };
    var _soundFunc = function(path) {
        var audio = tm.sound.WebAudio(path);
        return audio;
    };
    
    var _tmxFunc = function(path) {
        var mapSheet = tm.asset.MapSheet(path);
        return mapSheet;
    };
    
    var _tmssFunc = function(path) {
        var ss = tm.asset.SpriteSheet(path);
        return ss;
    };

    var _jsonFunc = function(path) {
        var file = tm.util.File();
        
        if (typeof path == 'string') {
            file.load({
                url: path,
                dataType: 'json',
            });
        }
        else {
            var data = path;
            file.setData(path);
            file.loaded = true;
        }

        return file;
    };

    var _loadScript = function(path) {
        var script = tm.asset.Script(path);

        return script;
    };

    // image
    tm.asset.Loader.register("png", _textureFunc);
    tm.asset.Loader.register("gif", _textureFunc);
    tm.asset.Loader.register("jpg", _textureFunc);
    tm.asset.Loader.register("jpeg", _textureFunc);

    // sound
    tm.asset.Loader.register("wav", _soundFunc);
    tm.asset.Loader.register("mp3", _soundFunc);
    tm.asset.Loader.register("ogg", _soundFunc);
    tm.asset.Loader.register("m4a", _soundFunc);

    // json
    tm.asset.Loader.register("json", _jsonFunc);

    // map data
    tm.asset.Loader.register("tmx", _tmxFunc);
    
    // spritesheet for tmlib.js
    tm.asset.Loader.register("tmss", _tmssFunc);
    
    // script file
    tm.asset.Loader.register("js", _loadScript);
    
})();


/*
 * texture.js
 */

(function() {
    
    /**
     * @class tm.asset.Texture
     * テクスチャクラス
     * @extends tm.event.EventDispatcher
     */
    tm.define("tm.asset.Texture", {
        superClass: "tm.event.EventDispatcher",
        
        /** window.document.Image */
        element: null,

        /** ロード済みかどうか */
        loaded: false,
        
        /**
         * @constructor
         */
        init: function(src) {
            this.superInit();
            
            this.element = new Image();
            if ( !tm.isLocal() && !(/^data:/.test(src)) ) {
                // this.element.crossOrigin = "anonymous";
            }
            this.element.src = src;
            
            var self = this;
            this.element.onload = function() {
                self.loaded = true;
                var e = tm.event.Event("load");
                self.dispatchEvent( e );
            };

            this.element.onerror = function(e) {
                console.error("[tmlib] {0}の読み込みに失敗!".format(src));
                
                var key = src.split('/').last.replace('.png', '').split('?').first.split('#').first;
                var elm = e.target;
                
                elm.src = "http://dummyimage.com/128x128/444444/eeeeee&text=" + key;
                elm.onerror = null;
            };
        },
        
        /**
         * window.document.Image クラスのインスタンスを返す
         */
        getElement: function() {
            return this.element;
        },
    });
    
    /**
     * @property    width
     * 幅
     */
    tm.asset.Texture.prototype.getter("width", function() {
        return this.element.width;
    });
    
    /**
     * @property    height
     * 高さ
     */
    tm.asset.Texture.prototype.getter("height", function() {
        return this.element.height;
    });
    
})();

(function(){

    /*
     * @static
     * @method
     * ### ref
     * http://dummyimage.com/
     */
    /*
    tm.graphics.TextureManager.loadDummy = function(key, param) {
        param = param || {};

        var paths = ["http://dummyimage.com"];
        paths.push(param.size || 256);
        paths.push(param.bgColor || "aaa");
        paths.push(param.color || "000");
        paths.push(param.format || "png");

        var src = paths.join('/');
        if (param.text) {
            src += '&text=' + param.text;
        }

        this.textures[key] = tm.graphics.Texture(src);
        this.loaded = false;
    };
    */

})();



/*
 * spritesheet.js
 */

(function() {
    
    /**
     * @class tm.asset.SpriteSheet
     * マップシート
     * @extends tm.event.EventDispatcher
     */
    tm.define("tm.asset.SpriteSheet", {
        superClass: "tm.event.EventDispatcher",

        /** ロード済みかどうか */
        loaded: false,

        /**
         * @constructor
         */
        init: function(src) {
            this.superInit();

            this.loaded = false;

            if (typeof src == "string") {
            	this.load(src);
            }
            else {
	            this.parse(src);
    			this.loaded = true;
    			this.dispatchEvent(tm.event.Event("load"));
            }

        },

        /**
         * ロード
         */
        load: function(path) {
        	tm.util.Ajax.load({
        		url: path,
        		dataType: "json",
        		success: function(d) {
        			this.parse(d);
        			this.loaded = true;
        		}.bind(this),
        	});
        },

        /**
         * パース
         */
        parse: function(param) {
            this.frame = param.frame;

            if (typeof param.image == "string") {
                if (!tm.asset.Manager.contains(param.image)) {
                    var loader = tm.asset.Loader();
                    loader.load(param.image);
                }
                this.image = tm.asset.Manager.get(param.image);
            }
            else {
                this.image = param.image;
            }

            if (this.image.loaded === false) {
                this.image.addEventListener("load", function() {
                    this._calcFrames(param.frame);
                    var e = tm.event.Event("load");
                    this.dispatchEvent(e);
                }.bind(this), false);
            }
            else {
                this._calcFrames(param.frame);
                var e = tm.event.Event("load");
                this.dispatchEvent(e);
            }

            this._calcAnim(param.animations);
        },

        /**
         * フレームを取得
         */
        getFrame: function(index) {
            return this.frames[index];
        },
        
        /**
         * アニメーションを取得
         */
        getAnimation: function(name) {
            return this.animations[name];
        },
        
        /**
         * @private
         */
        _calcFrames: function(frame) {
            var frames = this.frames = [];
            
            var w = frame.width;
            var h = frame.height;
            var row = ~~(this.image.width / w);
            var col = ~~(this.image.height/ h);
            
            if (!frame.count) frame.count = row*col;

            for (var i=0,len=frame.count; i<len; ++i) {
                var x   = i%row;
                var y   = (i/row)|0;
                var rect = {
                    x:x*w,
                    y:y*h,
                    width: w,
                    height: h
                };
                frames.push(rect);
            }
        },

        /**
         * @private
         */
        _calcAnim: function(animations) {
            this.animations = {};
            for (var key in animations) {
                var anim = animations[key];

                if (anim instanceof Array) {
                    this.animations[key] = {
                        frames: [].range(anim[0], anim[1]),
                        next: anim[2],
                        frequency: anim[3] || 1
                    };
                }
                else if (typeof anim == "number") {
                    this.animations[key] = {
                        frames: [anim],
                        next: null,
                        frequency: 1
                    };
                }
                else {
                    this.animations[key] = {
                        frames: anim.frames,
                        next: anim.next,
                        frequency: anim.frequency || 1
                    };
                }
            }
            
            // デフォルトアニメーション
            this.animations["default"] = {
                frames: [].range(0, this.frame.count),
                next: "default",
                frequency: 1,
            };
        }

    });

})();

/*
 * mapsheet.js
 */

(function() {

    /**
     * @class tm.asset.MapSheet
     * マップシート
     * @extends tm.event.EventDispatcher
     */
    tm.define("tm.asset.MapSheet", {
        superClass: "tm.event.EventDispatcher",

        /** @property loaded  */

        /**
         * @constructor
         */
        init: function(path) {
            this.superInit();

            this.loaded = false;

            if (typeof path == "string") {
                tm.util.Ajax.load({
                    url: path,
                    success: function(e) {
                        var d = this._parse(e);
                        this.$extend(d);
                        this._checkImage();
                    }.bind(this),
                });
            }
            else {
                this.$extend(arguments[0]);

                this._checkImage();
            }
        },

        /**
         * パース
         * @private
         */
        _parse: function(str) {
            var each = Array.prototype.forEach;
            var data = {};
            var parser = new DOMParser();
            var xml = parser.parseFromString(str, 'text/xml');
            var map = this._attrToJSON(xml.getElementsByTagName('map')[0]);

            this.$extend(map);

            // tilesets(image)
            data.tilesets = this._parseTilesets(xml);

            // layer
            data.layers = this._parseLayers(xml);

            return data;
        },

        /**
         * @private
         */
        _parseTilesets: function(xml) {
            var each = Array.prototype.forEach;
            var self = this;
            var data = [];
            var tilesets = xml.getElementsByTagName('tileset');
            each.call(tilesets, function(tileset) {
                var t = {};
                var props = self._propertiesToJson(tileset);

                if (props.src) {
                    t.image = props.src;
                }
                else {
                    t.image = tileset.getElementsByTagName('image')[0].getAttribute('source');
                }
                data.push(t);
            });

            return data;
        },

        /**
         * @private
         */
        _parseLayers: function(xml) {
            var each = Array.prototype.forEach;
            var data = [];

            var map = xml.getElementsByTagName("map")[0];
            var layers = [];
            each.call(map.childNodes, function(elm) {
                if (elm.tagName == "layer" || elm.tagName == "objectgroup" || elm.tagName == "imagelayer") {
                    layers.push(elm);
                }
            });

            layers.each(function(layer) {
                if (layer.tagName == "layer") {
                    var d = layer.getElementsByTagName('data')[0];
                    var encoding = d.getAttribute("encoding");
                    var l = {
                        type: "layer",
                        name: layer.getAttribute("name"),
                    };

                    if (encoding == "csv") {
                        l.data = this._parseCSV(d.textContent);
                    }
                    else if (encoding == "base64") {
                        l.data = this._parseBase64(d.textContent);
                    }

                    var attr = this._attrToJSON(layer);
                    l.$extend(attr);

                    data.push(l);
                }
                else if (layer.tagName == "objectgroup") {
                    var l = {
                        type: "objectgroup",
                        objects: [],
                        name: layer.getAttribute("name"),
                    };
                    each.call(layer.childNodes, function(elm) {
                        if (elm.nodeType == 3) return ;

                        var d = this._attrToJSON(elm);
                        d.properties = this._propertiesToJson(elm);

                        l.objects.push(d);
                    }.bind(this));

                    data.push(l);
                }
                else if (layer.tagName == "imagelayer") {
                    var l = {
                        type: "imagelayer",
                        name: layer.getAttribute("name"),
                        x: layer.getAttribute("x") || 0,
                        y: layer.getAttribute("y") || 0,
                        alpha: layer.getAttribute("opacity") || 1,
                        visible: (layer.getAttribute("visible") === undefined || layer.getAttribute("visible") != 0),
                    };
                    var imageElm = layer.getElementsByTagName("image")[0];
                    l.image = {
                        source: imageElm.getAttribute("source")
                    };

                    data.push(l);
                }
            }.bind(this));

            return data;
        },

        /**
         * @private
         */
        _parseCSV: function(data) {
            var dataList = data.split(',');
            var layer = [];

            dataList.each(function(elm, i) {
                var num = parseInt(elm, 10) - 1;
                layer.push(num);
            });

            return layer;
        },

        /**
         * http://thekannon-server.appspot.com/herpity-derpity.appspot.com/pastebin.com/75Kks0WH
         * @private
         */
        _parseBase64: function(data) {
            var dataList = atob(data.trim());
            var rst = [];

            dataList = dataList.split('').map(function(e) {
                return e.charCodeAt(0);
            });

            for (var i=0,len=dataList.length/4; i<len; ++i) {
                var n = dataList[i*4];
                rst[i] = parseInt(n, 10) - 1;
            }

            return rst;
        },

        /**
         * @private
         */
        _propertiesToJson: function(elm) {
            var properties = elm.getElementsByTagName("properties")[0];
            var obj = {};
            if (properties === undefined) {
                return obj;
            }
            for (var k = 0;k < properties.childNodes.length;k++) {
                var p = properties.childNodes[k];
                if (p.tagName === "property") {
                    obj[p.getAttribute('name')] = p.getAttribute('value');
                }
            }

            return obj;
        },

        /**
         * @private
         */
        _attrToJSON: function(source) {
            var obj = {};
            for (var i = 0; i < source.attributes.length; i++) {
                var val = source.attributes[i].value;
                val = isNaN(parseFloat(val))? val: parseFloat(val);
                obj[source.attributes[i].name] = val;
            }

            return obj;
        },

        /**
         * @private
         */
        _checkImage: function() {
            var self = this;
            var imageSoruces = [];

            // for tile set
            if (this.tilesets.length) {
                Array.prototype.push.apply(imageSoruces, this.tilesets.map(function(tile) {
                    return tile.image;
                }));
            }

            // for image layer
            this.layers.each(function(layer) {
                if (layer.type == "imagelayer") {
                    imageSoruces.push(layer.image.source);
                }
            });

            if (imageSoruces.length) {
                var i = 0;
                var len = imageSoruces.length;

                var _onloadimage = function() {
                    i++;
                    if (i==len) {
                        this.loaded = true;
                        var e = tm.event.Event("load");
                        this.dispatchEvent(e);
                    }
                }.bind(this);

                imageSoruces.each(function(imageName) {
                    var image = tm.asset.Manager.get(imageName);

                    if (image) {
                        if (image.loaded) {
                            // ロード済み
                            ++i;
                            if (i==len) {
                                this.loaded = true;
                                var e = tm.event.Event("load");
                                self.dispatchEvent(e);
                            }
                        }
                        else {
                            image.addEventListener("load", _onloadimage);
                        }
                    }
                    else {
                        var loader = tm.asset.Loader();
                        loader.load(imageName);
                        var texture = tm.asset.Manager.get(imageName);
                        texture.addEventListener("load", _onloadimage);
                    }
                });

            }
            else {
                this.loaded = true;
                var e = tm.event.Event("load");
                this.dispatchEvent(e);
            }
        },
    });

})();
tm.asset = tm.asset || {};

(function() {

    tm.define("tm.asset.Font", {
        superClass: "tm.event.EventDispatcher",

        init: function(path, key, format) {
            this.superInit();

            var fontFaceStyleElement = tm.dom.Element("head").create("style");
            fontFaceStyleElement.text = "@font-face { font-family: '{0}'; src: url({1}) format('{2}'); }".format(key, path, format);

            tm.asset.Font.checkLoaded(key, function() {
                this.flare("load");
            }.bind(this));
        },
    });

    tm.asset.Font.checkLoaded = function(font, callback) {
        var element = tm.dom.Element("body").create("span");
        element.style
            .set("color", "rgba(0, 0, 0, 0)")
            .set("fontSize", "40px");
        element.text = "QW@HhsXJ=/()あいうえお＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝";

        var before = element.element.offsetWidth;
        element.style
            .set("fontFamily", "'{0}', 'monospace'".format(font));

        var checkLoadFont = function() {
            if (element.element.offsetWidth !== before) {
                element.remove();
                callback && callback();
            } else {
                setTimeout(checkLoadFont, 100);
            }
        };
        setTimeout(checkLoadFont, 100);
    };

    tm.asset.Loader.register("ttf", function(path, key) {
        return tm.asset.Font(path, key, "truetype");
    });
    tm.asset.Loader.register("otf", function(path, key) {
        return tm.asset.Font(path, key, "opentype");
    });
    tm.asset.Loader.register("woff", function(path, key) {
        return tm.asset.Font(path, key, "woff");
    });
    tm.asset.Loader.register("woff2", function(path, key) {
        return tm.asset.Font(path, key, "woff2");
    });

})();

/*
 * script.js
 */

tm.util = tm.util || {};


(function() {
    
    /**
     * @class tm.asset.Script
     * スクリプトクラス
     */

    tm.define("tm.asset.Script", {

        superClass: "tm.event.EventDispatcher",

        /** element */
        element: null,
        /** loaded */
        loaded: false,
        
        /**
         * @constructor
         */
        init: function(src) {
            this.superInit();

            this.loaded = false;
            this.element = document.createElement("script");
            this.element.type = "text/javascript";
            this.element.src = src;
            this.element.charset = "UTF-8";
            this.element.setAttribute("defer", true);
            document.head.appendChild(this.element);
            
            var self = this;
            this.element.onload = function() {
                self.loaded = true;
                self.fire(tm.event.Event("load"));
            };
        },
        
        /**
         * getElement
         */
        getElement: function() {
            return this.element;
        },
        
    });

    tm.asset.Script.load = function(src) {
        var script = tm.asset.Script(src);

        return script;
    };

    /**
     * @static
     * @method
     * Stats を動的ロード
     */
    tm.asset.Script.loadStats = function(version) {
        version = version || "r11";
        var path = null;
        if (["r6", "r7", "r8", "r9", "10"].indexOf(version) != -1) {
            path = "https://cdn.rawgit.com/mrdoob/stats.js/" + version + "/build/Stats.js";
        }
        else {
            path = "http://cdn.rawgit.com/mrdoob/stats.js/" + version + "/build/stats.min.js";
        }

        return this.load(path);
    };

    /**
     * @static
     * @method
     * datGUI を動的ロード
     */
    tm.asset.Script.loadDatGUI = function(version) {
        // http://dat-gui.googlecode.com/git/build/dat.gui.min.js
        // https://dat-gui.googlecode.com/git-history/0.5/build/dat.gui.min.js

        version = version || "0.5";
//        var path = "https://dat-gui.googlecode.com/git-history/" + version + "/build/dat.gui.min.js";
//        var path = "http://dat-gui.googlecode.com/git/build/dat.gui.min.js";
        var path = "http://dat-gui.googlecode.com/git/build/dat.gui.js";
        return this.load(path);
    };

    /**
     * @static
     * @method
     * Three.js を動的ロード
     */
    tm.asset.Script.loadThree = function(version) {
        var THREE_JS_URL = "http://cdn.rawgit.com/mrdoob/three.js/{version}/build/three.js";
//        var THREE_JS_URL = "https://raw.github.com/mrdoob/three.js/{version}/build/three.min.js";
        version = version || "r55";

        var path = THREE_JS_URL.format({version: version});

        return this.load(path);
    };

    /**
     * @static
     * @method
     * BulletML.js を動的ロード
     */
    tm.asset.Script.loadBulletML = function(version) {
        var BULLETML_FOR_TMLIB_JS_URL   = "http://cdn.rawgit.com/daishihmr/bulletml.js/{version}/target/bulletml.for.tmlib.js";
        version = version || "v0.4.2";
        var path = BULLETML_FOR_TMLIB_JS_URL.format({version: version});        
        return this.load(path);
    };


})();

/*
 * keyboard.js
 */

tm.input = tm.input || {};


(function() {
    
    /**
     * @class tm.input.Keyboard
     * キーボードクラス
     * 
     *      @example
     *      
     */
    tm.input.Keyboard = tm.createClass({
        
        /** target element */
        element: null,
        /** key */
        key: null,
        /** 押しているキー */
        press   : null,
        /** 押したキー */
        down    : null,
        /** 離したキー */
        up      : null,
        /** 押していたキー */
        last    : null,
        
        /**
         * @constructor
         * <a href="http://tmlib-js.googlecode.com/svn/trunk/test/input/keyboard-test.html">Test Program</a>.
         * ### Example
         * TM.loadScript("input", "keyboard");
         *  
         * TM.main(function() {
         *     var k = TM.$Key(document);
         *     k.run();
         *     TM.setLoop(function(){
         *         if (k.getKey('a')) { console.log("press 'a'!!"); }
         *     });
         * });
         */
        init: function(element) {
            this.element = element || document;
            
            this.key = {};
            
            this.press  = {};
            this.down   = {};
            this.up     = {};
            this.last   = {};
            
            var self = this;
            this.element.addEventListener("keydown", function(e){
                self.key[e.keyCode] = true;
            });
            this.element.addEventListener("keyup", function(e){
                // delete self.key[e.keyCode];
                self.key[e.keyCode] = false;
                // self.button |= 1<<e.button;
            });
            this.element.addEventListener("keypress", function(e){
                // self.button &= ~(1<<e.button);
            });
        },
        
        /**
         * run.
         * 自動でマウス情報を更新したい際に使用する
         */
        run: function(fps) {
            var self = this;
            fps = fps || 30;
            tm.setLoop(function(){
                self._update();
                if (self.update) self.update();
            }, 1000/fps);
        },
        
        /**
         * 情報更新処理
         * マイフレーム呼んで下さい.
         * @private
         */
        _update: function() {
            // TODO: 一括ビット演算で行うよう修正する
            for (var k in this.key) {
                this.last[k]    = this.press[k];
                this.press[k]   = this.key[k];
                
                this.down[k] = (this.press[k] ^ this.last[k]) & this.press[k];
                this.up[k] = (this.press[k] ^ this.last[k]) & this.last[k];
            }
            
            return this;
        },
        
        /**
         * キーを押しているかをチェック
         * @param   {Number/String} key keyCode or keyName
         * @returns {Boolean}   チェック結果
         */
        getKey: function(key) {
            if (typeof(key) == "string") {
                key = KEY_CODE[key];
            }
            return this.press[key] == true;
        },
        
        /**
         * キーを押したかをチェック
         * @param   {Number/String} key keyCode or keyName
         * @returns {Boolean}   チェック結果
         */
        getKeyDown: function(key) {
            if (typeof(key) == "string") {
                key = KEY_CODE[key];
            }
            return this.down[key] == true;
        },
        
        /**
         * キーを離したかをチェック
         * @param   {Number/String} key keyCode or keyName
         * @returns {Boolean}   チェック結果
         */
        getKeyUp: function(key) {
            if (typeof(key) == "string") {
                key = KEY_CODE[key];
            }
            return this.up[key] == true;
        },
        
        /**
         * キーの方向を Angle(Degree) で取得
         * @returns {Boolean}   角度(Degree)
         */
        getKeyAngle: function() {
            var angle = null;
            var arrowBit =
                (this.getKey("left")   << 3) | // 1000
                (this.getKey("up")     << 2) | // 0100
                (this.getKey("right")  << 1) | // 0010
                (this.getKey("down"));         // 0001
            
            if (arrowBit != 0 && ARROW_BIT_TO_ANGLE_TABLE.hasOwnProperty(arrowBit)) {
                angle = ARROW_BIT_TO_ANGLE_TABLE[arrowBit];
            }
            
            return angle;
        },

        /**
         * キーの押している向きを取得
         * 正規化されている
         */
        getKeyDirection: function() {
            var direction = tm.geom.Vector2(0, 0);

            if (this.getKey("left")) {
                direction.x = -1;
            }
            else if (this.getKey("right")) {
                direction.x = 1;
            }
            if (this.getKey("up")) {
                direction.y = -1;
            }
            else if (this.getKey("down")) {
                direction.y = 1;
            }

            if (direction.x && direction.y) {
                direction.div(Math.SQRT2);
            }

            return direction;
        },
        
        /**
         * キーの状態を設定する
         */
        setKey: function(key, flag) {
            if (typeof(key) == "string") {
                key = KEY_CODE[key];
            }
            this.key[key] = flag;
            
            return this;
        },

        /**
         * キーを全て離したことにする
         */
        clearKey: function() {
            this.key = {};
            
            return this;
        },
        
    });

    /*
     * @enum ARROW_BIT_TO_ANGLE_TABLE
     * 方向のアングル jsduckでは数字をプロパティに指定できない？
     * @private
     */
    var ARROW_BIT_TO_ANGLE_TABLE = {
        /* @property 下 */
        0x01: 270,
        /* @property 右 */
        0x02:   0,
        /* @property 上 */
        0x04:  90,
        /* @property 左 */
        0x08: 180,

        /* @property 右上 */
        0x06:  45,
        /* @property 右下 */
        0x03: 315,
        /* @property 左上 */
        0x0c: 135,
        /* @property 左下 */
        0x09: 225,

        // 三方向同時押し対応
        // 想定外の操作だが対応しといたほうが無難
        /* @property 右上左 */
        0x0e:  90,
        /* @property 上左下 */
        0x0d: 180,
        /* @property 左下右 */
        0x0b: 270,
        /* @property 下右上 */
        0x07:   0,
    };

    /*
     * @enum KEY_CODE
     * キー番号
     * @private
     */
    var KEY_CODE = {
        /* @property */
        "backspace" : 8,
        /* @property */
        "tab"       : 9,
        /* @property */
        "enter"     : 13,
        /* @property */
        "return"    : 13,
        /* @property */
        "shift"     : 16,
        /* @property */
        "ctrl"      : 17,
        /* @property */
        "alt"       : 18,
        /* @property */
        "pause"     : 19,
        /* @property */
        "capslock"  : 20,
        /* @property */
        "escape"    : 27,
        /* @property */
        "pageup"    : 33,
        /* @property */
        "pagedown"  : 34,
        /* @property */
        "end"       : 35,
        /* @property */
        "home"      : 36,
        /* @property */
        "left"      : 37,
        /* @property */
        "up"        : 38,
        /* @property */
        "right"     : 39,
        /* @property */
        "down"      : 40,
        /* @property */
        "insert"    : 45,
        /* @property */
        "delete"    : 46,
        
        /* @property */
        "0" : 48,
        /* @property */
        "1" : 49,
        /* @property */
        "2" : 50,
        /* @property */
        "3" : 51,
        /* @property */
        "4" : 52,
        /* @property */
        "5" : 53,
        /* @property */
        "6" : 54,
        /* @property */
        "7" : 55,
        /* @property */
        "8" : 56,
        /* @property */
        "9" : 57,
        /* @property */
        
        "a" : 65,
        /* @property */
        "A" : 65,
        /* @property */
        "b" : 66,
        /* @property */
        "B" : 66,
        /* @property */
        "c" : 67,
        /* @property */
        "C" : 67,
        /* @property */
        "d" : 68,
        /* @property */
        "D" : 68,
        /* @property */
        "e" : 69,
        /* @property */
        "E" : 69,
        /* @property */
        "f" : 70,
        /* @property */
        "F" : 70,
        /* @property */
        "g" : 71,
        /* @property */
        "G" : 71,
        /* @property */
        "h" : 72,
        /* @property */
        "H" : 72,
        /* @property */
        "i" : 73,
        /* @property */
        "I" : 73,
        /* @property */
        "j" : 74,
        /* @property */
        "J" : 74,
        /* @property */
        "k" : 75,
        /* @property */
        "K" : 75,
        /* @property */
        "l" : 76,
        /* @property */
        "L" : 76,
        /* @property */
        "m" : 77,
        /* @property */
        "M" : 77,
        /* @property */
        "n" : 78,
        /* @property */
        "N" : 78,
        /* @property */
        "o" : 79,
        /* @property */
        "O" : 79,
        /* @property */
        "p" : 80,
        /* @property */
        "P" : 80,
        /* @property */
        "q" : 81,
        /* @property */
        "Q" : 81,
        /* @property */
        "r" : 82,
        /* @property */
        "R" : 82,
        /* @property */
        "s" : 83,
        /* @property */
        "S" : 83,
        /* @property */
        "t" : 84,
        /* @property */
        "T" : 84,
        /* @property */
        "u" : 85,
        /* @property */
        "U" : 85,
        /* @property */
        "v" : 86,
        /* @property */
        "V" : 86,
        /* @property */
        "w" : 87,
        /* @property */
        "W" : 87,
        /* @property */
        "x" : 88,
        /* @property */
        "X" : 88,
        /* @property */
        "y" : 89,
        /* @property */
        "Y" : 89,
        /* @property */
        "z" : 90,
        /* @property */
        "Z" : 90,
        
        /* @property */
        "numpad0" : 96,
        /* @property */
        "numpad1" : 97,
        /* @property */
        "numpad2" : 98,
        /* @property */
        "numpad3" : 99,
        /* @property */
        "numpad4" : 100,
        /* @property */
        "numpad5" : 101,
        /* @property */
        "numpad6" : 102,
        /* @property */
        "numpad7" : 103,
        /* @property */
        "numpad8" : 104,
        /* @property */
        "numpad9" : 105,
        /* @property */
        "multiply"      : 106,
        /* @property */
        "add"           : 107,
        /* @property */
        "subtract"      : 109,
        /* @property */
        "decimalpoint"  : 110,
        /* @property */
        "divide"        : 111,

        /* @property */
        "f1"    : 112,
        /* @property */
        "f2"    : 113,
        /* @property */
        "f3"    : 114,
        /* @property */
        "f4"    : 115,
        /* @property */
        "f5"    : 116,
        /* @property */
        "f6"    : 117,
        /* @property */
        "f7"    : 118,
        /* @property */
        "f8"    : 119,
        /* @property */
        "f9"    : 120,
        /* @property */
        "f10"   : 121,
        /* @property */
        "f11"   : 122,
        /* @property */
        "f12"   : 123,
        
        /* @property */
        "numlock"   : 144,
        /* @property */
        "scrolllock": 145,
        /* @property */
        "semicolon" : 186,
        /* @property */
        "equalsign" : 187,
        /* @property */
        "comma"     : 188,
        /* @property */
        "dash"      : 189,
        /* @property */
        "period"    : 190,
        /* @property */
        "forward slash" : 191,
        /* @property */
        "/": 191,
        /* @property */
        "grave accent"  : 192,
        /* @property */
        "open bracket"  : 219,
        /* @property */
        "back slash"    : 220,
        /* @property */
        "close bracket"  : 221,
        /* @property */
        "single quote"  : 222,
        /* @property */
        "space"         : 32
    };
    
    
})();


/*
 * mouse.js
 */

tm.input = tm.input || {};


(function() {
    
    /**
     * @class tm.input.Mouse
     * マウスクラス
     */
    tm.input.Mouse = tm.createClass({
        /** element */
        element: null,
        
        /** @property  position */
        /** @property  deltaPosition */
        /** @property  prevPosition */
        /** @private @property  _x */
        /** @private @property  _y */

        /**
         * @constructor
         */
        init: function(element) {
            this.element = element || window.document;
            
            this.position       = tm.geom.Vector2(0, 0);
            this.deltaPosition  = tm.geom.Vector2(0, 0);
            this.prevPosition   = tm.geom.Vector2(0, 0);
            this._x = 0;
            this._y = 0;
            this.touches = [];
            
            var self = this;
            this.element.addEventListener("mousedown", function(e){
                self._mousemove(e);
                self.prevPosition.set(self._x, self._y);    // prevPostion をリセット
                self.button |= 1<<e.button;
            });
            this.element.addEventListener("mouseup", function(e){
                self.button &= ~(1<<e.button);
            });
            this.element.addEventListener("mousemove", function(e){
                // 座標更新
                self._mousemove(e);
            });
        },
        
        /**
         * run
         * 自動でマウス情報を更新したい際に使用する
         */
        run: function(fps) {
            var self = this;
            fps = fps || 30;
            
            tm.setLoop(function() {
                self.update();
            }, 1000/fps);
            
            return this;
        },
        
        /**
         * 情報更新処理
         * マイフレーム呼んで下さい.
         */
        update: function() {
            this.last = this.press;
            
            this.press = this.button;
            
            this.down = (this.press ^ this.last) & this.press;
            this.up   = (this.press ^ this.last) & this.last;
            
            // 変化値を更新
            this.deltaPosition.x = this._x - this.position.x;
            this.deltaPosition.y = this._y - this.position.y;
            
            // 前回の座標を更新
            this.prevPosition.setObject(this.position);
            
            // 現在の位置を更新
            this.position.set(this._x, this._y);
        },
        
        /**
         * ボタン取得
         */
        getButton: function(button) {
            if (typeof(button) == "string") {
                button = BUTTON_MAP[button];
            }
            
            return (this.press & button) != 0;
        },
        
        /**
         * ボタンダウン取得
         */
        getButtonDown: function(button) {
            if (typeof(button) == "string") {
                button = BUTTON_MAP[button];
            }
            
            return (this.down & button) != 0;
        },
        
        /**
         * ボタンアップ取得
         */
        getButtonUp: function(button) {
            if (typeof(button) == "string") {
                button = BUTTON_MAP[button];
            }
            
            return (this.up & button) != 0;
        },

        /**
         * @private
         */
        _mousemove: function(e) {
            var rect = e.target.getBoundingClientRect();
            this._x = e.clientX - rect.left;
            this._y = e.clientY - rect.top;
        },

        /**
         * @private
         */
        _mousemoveNormal: function(e) {
            var rect = e.target.getBoundingClientRect();
            this._x = e.clientX - rect.left;
            this._y = e.clientY - rect.top;
        },

        /**
         * @private
         */
        _mousemoveScale: function(e) {
            var rect = e.target.getBoundingClientRect();
            this._x = e.clientX - rect.left;
            this._y = e.clientY - rect.top;
            
            //if (e.target instanceof HTMLCanvasElement) {
                // スケールを考慮した拡縮
                if (e.target.style.width) {
                    this._x *= e.target.width / parseInt(e.target.style.width);
                }
                if (e.target.style.height) {
                    this._y *= e.target.height / parseInt(e.target.style.height);
                }
            //}
        },
        
    });
    
    /** @static @property */
    tm.input.Mouse.BUTTON_LEFT      = 0x1;
    /** @static @property */
    tm.input.Mouse.BUTTON_MIDDLE    = 0x2;
    /** @static @property */
    tm.input.Mouse.BUTTON_RIGHT     = 0x4;
    
    /*
     * 
     */
    var BUTTON_MAP = {
        "left"  : tm.input.Mouse.BUTTON_LEFT,
        "middle": tm.input.Mouse.BUTTON_MIDDLE,
        "right" : tm.input.Mouse.BUTTON_RIGHT
    };
    
    
    /**
     * @property    x
     * x座標値
     */
    tm.input.Mouse.prototype.accessor("x", {
        "get": function()   { return this.position.x; },
        "set": function(v)  { this.position.x = v; }
    });
    
    /**
     * @property    y
     * y座標値
     */
    tm.input.Mouse.prototype.accessor("y", {
        "get": function()   { return this.position.y; },
        "set": function(v)  { this.position.y = v; }
    });
    
    /**
     * @property    dx
     * dx値
     */
    tm.input.Mouse.prototype.accessor("dx", {
        "get": function()   { return this.deltaPosition.x; },
        "set": function(v)  { this.deltaPosition.x = v; }
    });
    
    /**
     * @property    dy
     * dy値
     */
    tm.input.Mouse.prototype.accessor("dy", {
        "get": function()   { return this.deltaPosition.y; },
        "set": function(v)  { this.deltaPosition.y = v; }
    });
    
    
    /**
     * @static
     * @method getPointing
     * ポインティング状態取得(touch との差異対策)
     */
    tm.input.Mouse.prototype.getPointing        = function() { return this.getButton("left"); };
    /**
     * @static
     * @method getPointingStart
     * ポインティングを開始したかを取得(touch との差異対策)
     */
    tm.input.Mouse.prototype.getPointingStart   = function() { return this.getButtonDown("left"); };
    /**
     * @static
     * @method getPointingEnd
     * ポインティングを終了したかを取得(touch との差異対策)
     */
    tm.input.Mouse.prototype.getPointingEnd     = function() { return this.getButtonUp("left"); };
    
    
})();


/*
 * touch.js
 */

tm.input = tm.input || {};


(function() {
    
    /**
     * @class tm.input.Touch
     * タッチクラス
     */
    tm.input.Touch = tm.createClass({
        /** element */
        element: null,
        /** touched */
        touched: false,

        /** @property position */
        /** @property deltaPosition */
        /** @property prevPosition */
        /** @private @property _x */
        /** @private @property _y */
        
        /**
         * @constructor
         * <a href="http://tmlib-js.googlecode.com/svn/trunk/test/input/touch-test.html">Test Program</a>.
         */
        init: function(element) {
            this.element = element || window.document;
            
            this.position       = tm.geom.Vector2(0, 0);
            this.deltaPosition  = tm.geom.Vector2(0, 0);
            this.prevPosition   = tm.geom.Vector2(0, 0);
            this._x = 0;
            this._y = 0;
            this.touches = [];

            var self = this;
            this.element.addEventListener("touchstart", function(e){
                self.touched = true;
                
                self._touchmove(e);
                // 最初だけセット
                self.position.set(self._x, self._y);
                self.prevPosition.set(self._x, self._y);    // prevPostion をリセット

                self._setTouches(e);
            });
            this.element.addEventListener("touchend", function(e){
                self.touched = false;

                self._setTouches(e);
            });
            this.element.addEventListener("touchmove", function(e){
                self._touchmove(e);
                // 画面移動を止める
                e.stop();

                self._setTouches(e);
            });
            
            // var self = this;
            // this.element.addEventListener("touchstart", function(e) {
            //     if (self._touch) return ;
            //     self._touch = e.changedTouches[0];

            //     // changedTouches;
            //     // targetTouches;
            //     self._touchmove(e);
            //     self.prevPosition.setObject(self.position);

            //     self.touched = true;
            // });
            // this.element.addEventListener("touchend", function(e){
            //     if (self._touch == e.changedTouches[0]) {
            //         self.touched = false;
            //     }
            // });
            // this.element.addEventListener("touchmove", function(e){
            //     self._touchmove(e);
            //     // 画面移動を止める
            //     e.stop();
            // });
        },
        
        /**
         * run.
         * 自動でマウス情報を更新したい際に使用する
         */
        run: function(fps) {
            var self = this;
            fps = fps || 30;
            
            tm.setLoop(function() {
                
                self.update();
                
            }, 1000/fps);
            
            return this;
        },
        
        /**
         * 情報更新処理
         * マイフレーム呼んで下さい.
         */
        update: function() {
            this.last   = this.now;
            this.now    = Number(this.touched);
            
            this.start  = (this.now ^ this.last) & this.now;
            this.end    = (this.now ^ this.last) & this.last;
            
            // 変化値を更新
            this.deltaPosition.x = this._x - this.position.x;
            this.deltaPosition.y = this._y - this.position.y;
            
            // 前回の座標を更新
            this.prevPosition.setObject(this.position);
            
            // 現在の位置を更新
            this.position.set(this._x, this._y);
        },
        
        /**
         * タッチしているかを判定
         */
        getTouch: function() {
            return this.touched != 0;
        },
        
        /**
         * タッチ開始時に true
         */
        getTouchStart: function() {
            return this.start != 0;
        },
        
        /**
         * タッチ終了時に true
         */
        getTouchEnd: function() {
            return this.end != 0;
        },

        /**
         * @private
         */
        _touchmove: function(e) {
            var t = e.touches[0];
            var r = e.target.getBoundingClientRect();
            this._x = t.clientX - r.left;
            this._y = t.clientY - r.top;
        },

        /**
         * @private
         */
        _touchmoveScale: function(e) {
            var t = e.touches[0];
            var r = e.target.getBoundingClientRect();
            this._x = t.clientX - r.left;
            this._y = t.clientY - r.top;
            
            if (e.target.style.width) {
                this._x *= e.target.width / parseInt(e.target.style.width);
            }
            if (e.target.style.height) {
                this._y *= e.target.height / parseInt(e.target.style.height);
            }
        },

        _getAdjustPoint: function(p) {
            var elm = this.element;
            var style = elm.style;
            var r = elm.getBoundingClientRect();
            var p = {
                x: p.clientX - r.left,
                y: p.clientY - r.top,
            };
            
            if (style.width) {
                p.x *= elm.width / parseInt(style.width);
            }
            if (style.height) {
                p.y *= elm.height / parseInt(style.height);
            }

            return p;
         },

        _setTouches: function(e) {
            var touches = e.touches;

            this.touches.clear();
            for (var i=0,len=touches.length; i<len; ++i) {
                var p = this._getAdjustPoint(touches[i]);
                this.touches.push(p);
            }

            return this;
        }
        
    });
    
    

    /**
     * @property    x
     * x座標値
     */
    tm.input.Touch.prototype.accessor("x", {
        "get": function()   { return this.position.x; },
        "set": function(v)  { this.position.x = v; }
    });
    
    /**
     * @property    y
     * y座標値
     */
    tm.input.Touch.prototype.accessor("y", {
        "get": function()   { return this.position.y; },
        "set": function(v)  { this.position.y = v; }
    });
    
    /**
     * @property    dx
     * dx値
     */
    tm.input.Touch.prototype.accessor("dx", {
        "get": function()   { return this.deltaPosition.x; },
        "set": function(v)  { this.deltaPosition.x = v; }
    });
    
    /**
     * @property    dy
     * dy値
     */
    tm.input.Touch.prototype.accessor("dy", {
        "get": function()   { return this.deltaPosition.y; },
        "set": function(v)  { this.deltaPosition.y = v; }
    });
    
    
    
    /**
     * @method
     * ポインティング状態取得(mouse との差異対策)
     */
    tm.input.Touch.prototype.getPointing        = tm.input.Touch.prototype.getTouch;
    /**
     * @method
     * ポインティングを開始したかを取得(mouse との差異対策)
     */
    tm.input.Touch.prototype.getPointingStart   = tm.input.Touch.prototype.getTouchStart;
    /**
     * @method
     * ポインティングを終了したかを取得(mouse との差異対策)
     */
    tm.input.Touch.prototype.getPointingEnd     = tm.input.Touch.prototype.getTouchEnd;
    
})();



(function() {
    return ;

    /**
     * @class tm.input.Touches
     * マルチタッチ対応クラス
     * @extends global.Array
     */
    tm.define("tm.input.Touches", {
        superClass: Array,

        /**
         * @constructor
         */
        init: function(elm, length) {
            this.element = elm;
            for (var i=0; i<length; ++i) {
                var touch = tm.input.Touch(this.element);
                this.push(touch);
            }

            var self = this;
            this.element.addEventListener("touchstart", function(e) {
                var target = null;
                for (var i=0; i<length; ++i) {
                    if (!self[i]._touch) {
                        target = self[i];
                        break;
                    }
                }
                if (!target) return ;

                target._touch = e.changedTouches[0];

                target._touchmove(e);
                target.prevPosition.setObject(target.position);

                target.touched = true;
                // changedTouches;
                // targetTouches;
            });
            this.element.addEventListener("touchend", function(e){
                for (var i=0; i<length; ++i) {
                    if (self[i]._touch == e.changedTouches[0]) {
                        self[i]._touch = null;
                        self[i].touched = false;
                    }
                }
            });
            this.element.addEventListener("touchmove", function(e){
                for (var i=0; i<length; ++i) {
                    if (self[i]._touch) {
                        self[i]._touchmove(e);
                    }
                }
                // 画面移動を止める
                e.stop();
            });
        },

        /**
         * 更新
         */
        update: function() {
            this.each(function(touch) {
                touch.update();
            });
        }
    });

})();






/*
 * accelerometer.js
 */

tm.input = tm.input || {};


(function() {
    
    /**
     * @class tm.input.Accelerometer
     * スマートフォンのセンサー情報
     */
    tm.input.Accelerometer = tm.createClass({

        /** @property  gravity 重力センサー */
        /** @property  acceleration 加速度センサー */
        /** @property  rotation 回転加速度センサー */
        /** @property  orientation スマートフォンの傾き */
        
        /**
         * @constructor
         * ### Example
         * <a href="http://tmlib-js.googlecode.com/svn/trunk/test/input/touch-test.html">Test Program</a>.
         * 
         * ### Reference
         * - <http://tmlife.net/programming/javascript/javascript-iphone-acceleration.html>
         * - <http://hidekatsu.com/html5/archives/113>
         * - <http://d.hatena.ne.jp/nakamura001/20110209/1297229062>
         * - <http://d.hatena.ne.jp/nakamura001/20101128/1290946966>
         */
        init: function(element) {
            
            this.gravity        = tm.geom.Vector3(0, 0, 0);
            this.acceleration   = tm.geom.Vector3(0, 0, 0);
            this.rotation       = tm.geom.Vector3(0, 0, 0);
            this.orientation    = tm.geom.Vector3(0, 0, 0);
            
            var self = this;
            window.addEventListener("devicemotion", function(e) {
                var acceleration = self.acceleration;
                var gravity = self.gravity;
                var rotation = self.rotation;
                
                if (e.acceleration) {
                    acceleration.x = e.acceleration.x;
                    acceleration.y = e.acceleration.y;
                    acceleration.z = e.acceleration.z;
                }
                if (e.accelerationIncludingGravity) {
                    gravity.x = e.accelerationIncludingGravity.x;
                    gravity.y = e.accelerationIncludingGravity.y;
                    gravity.z = e.accelerationIncludingGravity.z;
                }
                if (e.rotationRate) {
                    rotation.x = rotation.beta  = e.rotationRate.beta;
                    rotation.y = rotation.gamma = e.rotationRate.gamma;
                    rotation.z = rotation.alpha = e.rotationRate.alpha;
                }
            });
            
            window.addEventListener("deviceorientation", function(e) {
                var orientation = self.orientation;
                orientation.alpha   = e.alpha;  // z(0~360)
                orientation.beta    = e.beta;   // x(-180~180)
                orientation.gamma   = e.gamma;  // y(-90~90)
            });
        },
        
    });
    
})();


/*
 * color.js
 */

tm.graphics = tm.graphics || {};

(function() {
    
    /**
     * @class tm.graphics.Color
     * カラークラス
     */
    tm.graphics.Color = tm.createClass({
        /** R値 */
        r: 255,
        /** G値 */
        g: 255,
        /** B値 */
        b: 255,
        /** A値 */
        a: 1.0,
        
        /**
         * @constructor
         */
        init: function(r, g, b, a) {
            this.set.apply(this, arguments);
        },

        /**
         * セッター.
         */
        set: function(r, g, b, a) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = (a !== undefined) ? a : 1.0;
            return this;
        },
        
        /**
         * 数値によるセッター.
         */
        setFromNumber: function(r, g, b, a) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = (a !== undefined) ? a : 1.0;
            return this;
        },
        
        /**
         * 配列によるセッター
         */
        setFromArray: function(arr) {
            return this.set.apply(this, arr);
        },
        
        /**
         * オブジェクトによるセッター
         */
        setFromObject: function(obj) {
            return this.set(obj.r, obj.g, obj.b, obj.a);
        },
        
        /**
         * 文字列によるセッター
         */
        setFromString: function(str) {
            var color = tm.graphics.Color.stringToNumber(str);
            return this.set(color[0], color[1], color[2], color[3]);
        },
        
        /**
         * 賢いセッター
         */
        setSmart: function() {
            var arg = arguments[0];
            if (arguments.length >= 3) {
                this.set(arguments.r, arguments.g, arguments.b, arguments.a);
            }
            else if (arg instanceof Array) {
                this.setFromArray(arg);
            }
            else if (arg instanceof Object) {
                this.setFromObject(arg);
            }
            else if (typeof(arg) == "string") {
                this.setFromString(arg);
            }
            return this;
        },

        /**
         * CSS 用 16進数文字列に変換
         */
        toStyleAsHex: function() {
            return "#{0}{1}{2}".format(
                this.r.toString(16).padding(2, '0'),
                this.g.toString(16).padding(2, '0'),
                this.b.toString(16).padding(2, '0')
            );
        },
        
        /**
         * CSS 用 RGB文字列に変換
         */
        toStyleAsRGB: function() {
            return "rgb({r},{g},{b})".format({
                r: ~~this.r,
                g: ~~this.g,
                b: ~~this.b
            });
        },
        
        
        /**
         * CSS 用 RGBA文字列に変換
         */
        toStyleAsRGBA: function() {
            return "rgba({r},{g},{b},{a})".format({
                r: ~~this.r,
                g: ~~this.g,
                b: ~~this.b,
                a: this.a
            });
        },

        /**
         * CSS 用 RGBA 文字列に変換
         */
        toStyle: function() {
            return "rgba({r},{g},{b},{a})".format({
                r: ~~this.r,
                g: ~~this.g,
                b: ~~this.b,
                a: this.a
            });
        },
        
    });
    
    var MATCH_SET_LIST = {
        "hex111": {
            reg: /^#(\w{1})(\w{1})(\w{1})$/,
            exec: function(m) {
                return [
                    parseInt(m[1]+m[1], 16),
                    parseInt(m[2]+m[2], 16),
                    parseInt(m[3]+m[3], 16)
                ];
            }
        },
        "hex222": {
            reg: /^#(\w{2})(\w{2})(\w{2})$/,
            exec: function(m) {
                return [
                    parseInt(m[1], 16),
                    parseInt(m[2], 16),
                    parseInt(m[3], 16)
                ];
            }
        },
        "rgb": {
            reg: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
            exec: function(m) {
                return [
                    parseInt(m[1]),
                    parseInt(m[2]),
                    parseInt(m[3])
                ];
            }
        },
        "rgba": {
            reg: /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d{1}(\.{1}\d+)?)\)$/,
            exec: function(m) {
                return [
                    parseInt(m[1]),
                    parseInt(m[2]),
                    parseInt(m[3]),
                    parseFloat(m[4])
                ];
            }
        },
        "hsl": {
            reg: /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/,
            exec: function(m) {
                return tm.graphics.Color.HSLtoRGB(m[1], m[2], m[3]);
            }
        },
        "hsla": {
            reg: /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d{1}(\.{1}\d+)?)\)$/,
            exec: function(m) {
                return Color.HSLAtoRGBA(m[1], m[2], m[3], m[4]);
            }
        },
    };

    /**
     * @static
     * カラーリスト
     */
    tm.graphics.Color.COLOR_LIST = {
        /** @property black */
        "black"     : [0x00, 0x00, 0x00],
        /** @property silver */
        "silver"    : [0xc0, 0xc0, 0xc0],
        /** @property gray */
        "gray"      : [0x80, 0x80, 0x80],
        /** @property white */
        "white"     : [0xff, 0xff, 0xff],
        /** @property maroon */
        "maroon"    : [0x80, 0x00, 0x00],
        /** @property red */
        "red"       : [0xff, 0x00, 0x00],
        /** @property purple */
        "purple"    : [0x80, 0x00, 0x80],
        /** @property fuchsia */
        "fuchsia"   : [0xff, 0x00, 0xff],
        /** @property green */
        "green"     : [0x00, 0x80, 0x00],
        /** @property lime */
        "lime"      : [0x00, 0xff, 0x00],
        /** @property olive */
        "olive"     : [0x80, 0x80, 0x00],
        /** @property yellow */
        "yellow"    : [0xff, 0xff, 0x00],
        /** @property navy */
        "navy"      : [0x00, 0x00, 0x80],
        /** @property blue */
        "blue"      : [0x00, 0x00, 0xff],
        /** @property teal */
        "teal"      : [0x00, 0x80, 0x80],
        /** @property aqua */
        "aqua"      : [0x00, 0xff, 0xff],
    };

    /**
     * @static
     * @member tm.graphics.Color
     * @method strToNum
     */
    tm.graphics.Color.strToNum = tm.graphics.Color.stringToNumber = function(str){
        var vlaue = null;
        var type = null;
        
        if (str[0] === '#') {
            type = (str.length == 4) ?  "hex111" : "hex222";
        }
        else if (str[0] === 'r' && str[1] === 'g' && str[2] === 'b') {
            type = (str[3] == 'a') ? "rgba" : "rgb";
        }
        else if (str[0] === 'h' && str[1] === 's' && str[2] === 'l') {
            type = (str[3] == 'a') ? "hsla" : "hsl";
        }
        
        if (type) {
            var match_set = MATCH_SET_LIST[type];
            var m = str.match( match_set.reg );
            value = match_set.exec(m);
        }
        else if (Color.COLOR_LIST[str]){
            value = Color.COLOR_LIST[str];
        }
        
        return value;
    };

    /**
     * @static
     * @method
     * hsl を rgb に変換
     */
    tm.graphics.Color.HSLtoRGB = function(h, s, l) {
        var r, g, b;
        
        h%=360;
        h+=360;
        h%=360;
        s *= 0.01;
        l *= 0.01;
        
        if (s == 0) {
            var l = Math.round(l * 255);
            return [l, l, l];
        }
        var m2 = (l < 0.5) ? l * (1+s) : l + s - l*s;
        var m1 = l*2 - m2;
        
        // red
        var temp = (h + 120)%360;
        if      (temp < 60) { r = m1 + (m2-m1) * temp/60; }
        else if (temp < 180){ r = m2; }
        else                { r = m1; }
        
        // green
        temp = h;
        if      (temp < 60) { g = m1 + (m2-m1) * temp/60; }
        else if (temp < 180){ g = m2; }
        else if (temp < 240){ g = m1 + (m2-m1) * (240-temp)/60; }
        else                { g = m1; }
        
        // blue
        temp = ((h-120)+360)%360;
        if      (temp < 60) { b = m1 + (m2-m1) * temp/60; }
        else if (temp < 180){ b = m2; }
        else if (temp < 240){ b = m1 + (m2-m1) * (240-temp)/60; }
        else                { b = m1; }
        
        return [
            parseInt(r*255),
            parseInt(g*255),
            parseInt(b*255)
            ];
    };

    /**
     * @static
     * @method
     * hsla を rgba に変換
     */
    tm.graphics.Color.HSLAtoRGBA = function(h, s, l, a) {
        var temp = Color.HSLtoRGB(h, s, l); temp[3] = a;
        return rgb;
    };

    /**
     * @static
     * @method
     * rgb 値を作成
     */
    tm.graphics.Color.createStyleRGB = function(r, g, b) {
        return "rgba(" + r + "," + g + "," + b + ")";
    };
    
    /**
     * @static
     * @method
     * rgba 値を作成
     */
    tm.graphics.Color.createStyleRGBA = function(r, g, b, a) {
        return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    };

    /**
     * @static
     * @method
     * hsl 値を作成
     */
    tm.graphics.Color.createStyleHSL = function(h, s, l) {
        return "hsl(" + h + "," + s + "%," + l + "%)";
    };
    
    /**
     * @static
     * @method
     * hsla 値を作成
     */
    tm.graphics.Color.createStyleHSLA = function(h, s, l, a) {
        return "hsla(" + h + "," + s + "%," + l + "%," + a + ")";
    };
})();

/*
 * canvas.js
 */

tm.graphics = tm.graphics || {};

(function() {
    
    /**
     * @class tm.graphics.Canvas
     * キャンバス
     */
    tm.graphics.Canvas = tm.createClass({
        
        /** 要素 */
        element: null,
        
        /** キャンバス */
        canvas: null,
        
        /** コンテキスト */
        context: null,
        
        /**
         * @constructor
         */
        init: function(canvas) {
            this.canvas = null;
            if (typeof canvas == "string") {
                this.canvas = document.querySelector(canvas);
            }
            else {
                this.canvas = canvas || document.createElement("canvas");
            }
            this.element            = this.canvas;
            this.context            = this.canvas.getContext("2d");
            this.context.lineCap    = "round";
            this.context.lineJoin   = "round";
        },
        
        /**
         * リサイズする
         */
        resize: function(width, height) {
            this.canvas.width   = width;
            this.canvas.height  = height;
            return this;
        },
        
        /**
         * リサイズウィンドウ
         */
        resizeWindow: function() {
            this.canvas.style.position  = "fixed";
            this.canvas.style.margin    = "0px";
            this.canvas.style.padding   = "0px";
            this.canvas.style.left      = "0px";
            this.canvas.style.top       = "0px";
            return this.resize(window.innerWidth, window.innerHeight);
        },
        
        /**
         * フィット
         */
        resizeToFitScreen: function() {
            this.canvas.style.position  = "fixed";
            this.canvas.style.margin    = "0px";
            this.canvas.style.padding   = "0px";
            this.canvas.style.left      = "0px";
            this.canvas.style.top       = "0px";
            return this.resize(window.innerWidth, window.innerHeight);
        },
        
        /**
         * 拡縮で画面にフィットさせる
         * 名前は仮. 検討する
         */
        fitWindow: function(everFlag) {
            var _fitFunc = function() {
                everFlag = everFlag === undefined ? true : everFlag;
                var e = this.element;
                var s = e.style;
                
                s.position = "absolute";
                s.margin = "auto";
                s.left = "0px";
                s.top  = "0px";
                s.bottom = "0px";
                s.right = "0px";

                var rateWidth = e.width/window.innerWidth;
                var rateHeight= e.height/window.innerHeight;
                var rate = e.height/e.width;
                
                if (rateWidth > rateHeight) {
                    s.width  = (innerWidth).floor()+"px";
                    s.height = (innerWidth*rate).floor()+"px";
                }
                else {
                    s.width  = (innerHeight/rate).floor()+"px";
                    s.height = (innerHeight).floor()+"px";
                }
            }.bind(this);
            
            // 一度実行しておく
            _fitFunc();
            // リサイズ時のリスナとして登録しておく
            if (everFlag) {
                window.addEventListener("resize", _fitFunc, false);
            }
        },
        
        /**
         * クリア
         */
        clear: function(x, y, width, height) {
            x = x || 0;
            y = y || 0;
            width = width || this.width;
            height= height|| this.height;
            this.context.clearRect(x, y, width, height);
            return this;
        },
        
        
        /**
         * 色指定クリア
         * @param {String}  fillStyle
         * @param {Number}  [x=0]
         * @param {Number}  [y=0]
         * @param {Number}  [width=this.width]
         * @param {Number}  [height=this.height]
         */
        clearColor: function(fillStyle, x, y, width, height) {
            x = x || 0;
            y = y || 0;
            width = width || this.width;
            height= height|| this.height;
            
            this.save();
            this.resetTransform();          // 行列初期化
            this.fillStyle = fillStyle;     // 塗りつぶしスタイルセット
            this.context.fillRect(x, y, width, height);
            this.restore();
            
            return this;
        },
                
        /**
         * パスを開始(リセット)
         */
        beginPath: function() {
            this.context.beginPath();
            return this;
        },
                
        /**
         *  パスを閉じる
         */
        closePath: function() {
            this.context.closePath();
            return this;
        },
        

        /**
         *  新規パス生成
         */
        moveTo: function(x, y) {
            this.context.moveTo(x, y);
            return this;
        },
        
        /**
         * パスに追加
         */
        lineTo: function(x, y) {
            this.context.lineTo(x, y);
            return this;
        },
        
        /**
         * パス内を塗りつぶす
         */
        fill: function() {
            this.context.fill();
            return this;
        },
        
        /**
         * パス上にラインを引く
         */
        stroke: function() {
            this.context.stroke();
            return this;
        },
        
        /**
         * クリップ
         */
        clip: function() {
            this.context.clip();
            return this;
        },
        
        /**
         * 点描画
         */
        drawPoint: function(x, y) {
            return this.strokeRect(x, y, 1, 1);
            // return this.beginPath().moveTo(x-0.5, y-0.5).lineTo(x+0.5, y+0.5).stroke();
        },

        /**
         * ラインパスを作成
         */
        line: function(x0, y0, x1, y1) {
            return this.moveTo(x0, y0).lineTo(x1, y1);
        },
        
        /**
         * ラインを描画
         */
        drawLine: function(x0, y0, x1, y1) {
            return this.beginPath().line(x0, y0, x1, y1).stroke();
        },
        
        /**
         * ダッシュラインを描画
         */
        drawDashLine: function(x0, y0, x1, y1, pattern) {
            var patternTable = null;
            if (typeof(pattern) == "string") {
                patternTable = pattern;
            }
            else {
                pattern = pattern || 0xf0f0;
                patternTable = pattern.toString(2);
            }
            patternTable = patternTable.padding(16, '1');
            
            var vx = x1-x0;
            var vy = y1-y0;
            var len = Math.sqrt(vx*vx + vy*vy);
            vx/=len; vy/=len;
            
            var x = x0;
            var y = y0;
            for (var i=0; i<len; ++i) {
                if (patternTable[i%16] == '1') {
                    this.drawPoint(x, y);
                    // this.fillRect(x, y, this.context.lineWidth, this.context.lineWidth);
                }
                x += vx;
                y += vy;
            }
            
            return this;
        },
        
        /**
         * v0(x0, y0), v1(x1, y1) から角度を求めて矢印を描画
         * http://hakuhin.jp/as/rotation.html
         */
        drawArrow: function(x0, y0, x1, y1, arrowRadius) {
            var vx = x1-x0;
            var vy = y1-y0;
            var angle = Math.atan2(vy, vx)*180/Math.PI;
            
            this.drawLine(x0, y0, x1, y1);
            this.fillPolygon(x1, y1, arrowRadius || 5, 3, angle);
            
            return this;
        },
        
        
        /**
         * lines
         */
        lines: function() {
            this.moveTo(arguments[0], arguments[1]);
            for (var i=1,len=arguments.length/2; i<len; ++i) {
                this.lineTo(arguments[i*2], arguments[i*2+1]);
            }
            return this;
        },

        /**
         * ラインストローク描画
         */
        strokeLines: function() {
            this.beginPath();
            this.lines.apply(this, arguments);
            this.stroke();
            return this;
        },

        /**
         * ライン塗りつぶし描画
         */
        fillLines: function() {
            this.beginPath();
            this.lines.apply(this, arguments);
            this.fill();
            return this;
        },
        
        /**
         * 四角形パスを作成する
         */
        rect: function(x, y, width, height) {
            this.context.rect.apply(this.context, arguments);
            return this;
        },
        
        /**
         * 四角形塗りつぶし描画
         */
        fillRect: function() {
            this.context.fillRect.apply(this.context, arguments);
            return this;
        },
        
        /**
         * 四角形ライン描画
         */
        strokeRect: function() {
            this.context.strokeRect.apply(this.context, arguments);
            return this;
        },
        
        /**
         * 角丸四角形パス
         */
        roundRect: function(x, y, width, height, radius) {
            var l = x + radius;
            var r = x + width - radius;
            var t = y + radius;
            var b = y + height - radius;
            
            /*
            var ctx = this.context;
            ctx.moveTo(l, y);
            ctx.lineTo(r, y);
            ctx.quadraticCurveTo(x+width, y, x+width, t);
            ctx.lineTo(x+width, b);
            ctx.quadraticCurveTo(x+width, y+height, r, y+height);
            ctx.lineTo(l, y+height);
            ctx.quadraticCurveTo(x, y+height, x, b);
            ctx.lineTo(x, t);
            ctx.quadraticCurveTo(x, y, l, y);
            /**/
            
            this.context.arc(l, t, radius,     -Math.PI, -Math.PI*0.5, false);  // 左上
            this.context.arc(r, t, radius, -Math.PI*0.5,            0, false);  // 右上
            this.context.arc(r, b, radius,            0,  Math.PI*0.5, false);  // 右下
            this.context.arc(l, b, radius,  Math.PI*0.5,      Math.PI, false);  // 左下
            this.closePath();
            
            return this;
        },
        /**
         * 角丸四角形塗りつぶし
         */
        fillRoundRect: function(x, y, width, height, radius) {
            return this.beginPath().roundRect(x, y, width, height, radius).fill();
        },
        /**
         * 角丸四角形ストローク描画
         */
        strokeRoundRect: function(x, y, width, height, radius) {
            return this.beginPath().roundRect(x, y, width, height, radius).stroke();
        },
        
        /**
         * ポリゴンパス
         */
        polygon: function(x, y, size, sides, offsetAngle) {
            var radDiv = (Math.PI*2)/sides;
            var radOffset = (offsetAngle!=undefined) ? offsetAngle*Math.PI/180 : -Math.PI/2;
            
            this.moveTo(x + Math.cos(radOffset)*size, y + Math.sin(radOffset)*size);
            for (var i=1; i<sides; ++i) {
                var rad = radDiv*i+radOffset;
                this.lineTo(
                    x + Math.cos(rad)*size,
                    y + Math.sin(rad)*size
                );
            }
            this.closePath();
            return this;
        },
        /**
         * ポリゴン塗りつぶし
         */
        fillPolygon: function(x, y, radius, sides, offsetAngle) {
            return this.beginPath().polygon(x, y, radius, sides, offsetAngle).fill();
        },
        /**
         * ポリゴンストローク描画
         */
        strokePolygon: function(x, y, radius, sides, offsetAngle) {
            return this.beginPath().polygon(x, y, radius, sides, offsetAngle).stroke();
        },
        
        /**
         * star
         */
        star: function(x, y, radius, sides, sideIndent, offsetAngle) {
            var sideIndentRadius = radius * (sideIndent || 0.38);
            var radOffset = (offsetAngle) ? offsetAngle*Math.PI/180 : -Math.PI/2;
            var radDiv = (Math.PI*2)/sides/2;
            
            this.moveTo(
                x + Math.cos(radOffset)*radius,
                y + Math.sin(radOffset)*radius
            );
            for (var i=1; i<sides*2; ++i) {
                var rad = radDiv*i + radOffset;
                var len = (i%2) ? sideIndentRadius : radius;
                this.lineTo(
                    x + Math.cos(rad)*len,
                    y + Math.sin(rad)*len
                );
            }
            this.closePath();
            return this;
        },

        /**
         * 星を塗りつぶし描画
         */
        fillStar: function(x, y, radius, sides, sideIndent, offsetAngle) {
            return this.beginPath().star(x, y, radius, sides, sideIndent, offsetAngle).fill();
        },

        /**
         * 星をストローク描画
         */
        strokeStar: function(x, y, radius, sides, sideIndent, offsetAngle) {
            return this.beginPath().star(x, y, radius, sides, sideIndent, offsetAngle).stroke();
        },

        /*
         * heart
         */
        heart: function(x, y, radius, angle) {
            var half_radius = radius*0.5;
            var rad = (angle === undefined) ? Math.PI/4 : Math.degToRad(angle);

            // 半径 half_radius の角度 angle 上の点との接線を求める
            var p = Math.cos(rad)*half_radius;
            var q = Math.sin(rad)*half_radius;

            // 円の接線の方程式 px + qy = r^2 より y = (r^2-px)/q
            var x2 = -half_radius;
            var y2 = (half_radius*half_radius-p*x2)/q;

            // 中心位置調整
            var height = y2 + half_radius;
            var offsetY = half_radius-height/2;

            // パスをセット
            this.moveTo(0+x, y2+y+offsetY);

            this.arc(-half_radius+x, 0+y+offsetY, half_radius, Math.PI-rad, Math.PI*2);
            this.arc(half_radius+x, 0+y+offsetY, half_radius, Math.PI, rad);
            this.closePath();

            return this;
        },

        /*
         * fill heart
         */
        fillHeart: function(x, y, radius, angle) {
            return this.beginPath().heart(x, y, radius, angle).fill();
        },

        /*
         * stroke heart
         */
        strokeHeart: function(x, y, radius, angle) {
            return this.beginPath().heart(x, y, radius, angle).stroke();
        },
        
        /**
         * 円のパスを設定
         */
        circle: function(x, y, radius) {
            this.context.arc(x, y, radius, 0, Math.PI*2, false);
            return this;
        },
        
        /**
         * 塗りつぶし円を描画
         */
        fillCircle: function(x, y, radius) {
            var c = this.context;
            c.beginPath();
            c.arc(x, y, radius, 0, Math.PI*2, false);
            c.closePath();
            c.fill();
            return this;
            // return this.beginPath().circle(x, y, radius).fill();
        },
        
        /**
         * ストローク円を描画
         */
        strokeCircle: function(x, y, radius) {
            return this.beginPath().circle(x, y, radius).stroke();
        },
        
        
        /**
         * 円弧のパスを設定
         */
        arc: function(x, y, radius, startAngle, endAngle, anticlockwise) {
            this.context.arc(x, y, radius, startAngle, endAngle, anticlockwise);
            return this;
        },
        
        /**
         * 塗りつぶし円弧を描画
         */
        fillArc: function(x, y, radius, startAngle, endAngle, anticlockwise) {
            return this.beginPath().arc(x, y, radius, startAngle, endAngle, anticlockwise).fill();
        },
        
        /**
         * ストローク円弧を描画
         */
        strokeArc: function(x, y, radius, startAngle, endAngle, anticlockwise) {
            return this.beginPath().arc(x, y, radius, startAngle, endAngle, anticlockwise).stroke();
        },
        
        /**
         * 三角形パスを設定
         */
        triangle: function(x0, y0, x1, y1, x2, y2) {
            this.moveTo(x0, y0).lineTo(x1, y1).lineTo(x2, y2);
            this.closePath();
            return this;
        },
        
        /**
         * 塗りつぶし三角形を描画
         */
        fillTriangle: function(x0, y0, x1, y1, x2, y2) {
            return this.beginPath().triangle(x0, y0, x1, y1, x2, y2).fill();
        },
        
        /**
         * ストローク三角形を描画
         */
        strokeTriangle: function(x0, y0, x1, y1, x2, y2) {
            return this.beginPath().triangle(x0, y0, x1, y1, x2, y2).stroke();
        },
        

        /**
         * 塗りつぶしテキストを描画
         */
        fillText: function(text, x, y) {
            return this.context.fillText.apply(this.context, arguments);
        },
        
        /**
         * ストロークテキスト
         */
        strokeText: function(text, x, y) {
            return this.context.strokeText.apply(this.context, arguments);
        },
        
        fillVerticalText: function(text, x, y) {
            this._drawVerticalText("fillText", text, x, y);
        },
        strokeVerticalText: function(text, x, y) {
            this._drawVerticalText("strokeText", text, x, y);
        },
        
        _drawVerticalText: function(func, text, x, y) {
            var ctx = this.context;
            var lines = text.split('\n');
            var charSize = this.context.measureText('あ').width;
            
            ctx.save();
            
            ctx.textAlign = "right";
            ctx.textBaseline = "top";

            Array.prototype.forEach.call(text, function(ch, j) {
                ctx[func](ch, x, y+charSize*j);
            });
            
            ctx.restore();
        },
        
        /**
         * drawLabelBox, drawLabelArea, drawTextBox, 
         */
        _drawLabelArea: function(func, param) {
            var ctx = this.context;
            var text = param.text;
            var charSize = this.context.measureText('あ').width;
            var lines = text.split('\n');
            var lineSpace = (param.lineSpace || 1)*charSize;
            
            ctx.save();
            
            // 横書き
            if (!param.mode || param.mode == "horizon") {
                var maxCharNum = Math.max( (param.width/charSize)|0, 1 );
                var normalLines = [];
                
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                
                
                lines.each(function(line) {
                    for (var i=0,len=line.length; i<len; i+=maxCharNum) {
                        var str = line.substr(i, maxCharNum);
                        normalLines.push(str);
                    }
                });
                
                var funcName = func + "Text";
                normalLines.each(function(line, i) {
                    ctx[funcName](line, param.x, param.y + i*lineSpace + 4);
                });
            }
            // 縦書き
            else {
                var maxCharNum = Math.max( (param.height/charSize)|0, 1 );
                var startX = param.x + param.width;
                var normalLines = [];
                
                lines.each(function(line) {
                    for (var i=0,len=line.length; i<len; i+=maxCharNum) {
                        var str = line.substr(i, maxCharNum);
                        normalLines.push(str);
                    }
                });
                
                var funcName = func + "VerticalText";
                normalLines.each(function(line, i) {
                    // boldになるとフォントサイズが変わるため、マージンとして15pxずらす
                    this[funcName](line, startX-i*lineSpace, param.y+15);
                }.bind(this));
            }
            
            ctx.restore();
        },
        
        fillLabelArea: function(param) {
            this._drawLabelArea("fill", param);
        },
        
        strokeLabelArea: function(param) {
            this._drawLabelArea("stroke", param);
        },
        
        /**
         * 画像描画
         */
        drawImage: function(image, x, y) {
            this.context.drawImage.apply(this.context, arguments);
            return ;
            
            x = x || 0;
            y = y || 0;
            this.context.drawImage(image, x, y);
            return this;
            // ctx.drawImage(this.image.canvas,
                // 0, 0, this.width, this.height,
                // -this.width/2, -this.height/2, this.width, this.height);
        },
        
        /**
         * テクスチャ描画
         */
        drawTexture: function(texture, x, y) {
            arguments[0] = texture.element;
            this.context.drawImage.apply(this.context, arguments);
            
            return this;
        },
        
        /**
         * ビットマップ描画
         */
        drawBitmap: function(bitmap, x, y) {
            arguments[0] = bitmap.imageData;
            this.context.putImageData.apply(this.context, arguments);
            
            return this;
        },
        
        /**
         * dummy
         */
        drawScale9Image: function(image, rect0, rect1) {
            
            var leftWidth   = rect1.x;
            var middleWidth = rect1.width;
            var rightWidth  = image.width - (leftWidth+middleWidth);
            var finalWidth  = rect0.width - (leftWidth+rightWidth);
            var topHeight   = rect1.y;
            
            // left top
            this.drawImage(image,
                0, 0, leftWidth, topHeight,
                rect0.x, rect0.y, leftWidth, topHeight);
            // middle top
            this.drawImage(image,
                leftWidth, 0, middleWidth, topHeight,
                rect0.x + leftWidth, rect0.y, finalWidth, topHeight)
            // right top
            this.drawImage(image,
                leftWidth+middleWidth, 0, rightWidth, topHeight,
                rect0.x + leftWidth + finalWidth, rect0.y, rightWidth, topHeight);
            
            return this;
        },
        
        /**
         * 行列をセット
         */
        setTransform: function(m11, m12, m21, m22, dx, dy) {
            this.context.setTransform(m11, m12, m21, m22, dx, dy);
            return this;
        },
        
        
        /**
         * 行列をリセット
         */
        resetTransform: function() {
            this.setTransform(1.0, 0.0, 0.0, 1.0, 0.0, 0.0);
            return this;
        },
        
        
        /**
         * 中心に移動
         */
        setTransformCenter: function() {
            this.context.setTransform(1, 0, 0, 1, this.width/2, this.height/2);
            return this;
        },
        
        /**
         * 行列を掛ける
         */
        transform: function(m11, m12, m21, m22, dx, dy) {
            this.context.transform(m11, m12, m21, m22, dx, dy);
            return this;
        },
        
        /**
         * 保存
         */
        save: function() {
            this.context.save();
            return this;
        },
        
        /**
         * 復元
         */
        restore: function() {
            this.context.restore();
            return this;
        },
        
        /**
         * 移動
         */
        translate: function(x, y) {
            this.context.translate(x, y);
            return this;
        },
        
        /**
         * 回転
         */
        rotate: function(rotation) {
            this.context.rotate(rotation);
            return this;
        },
        
        /**
         * スケール
         */
        scale: function(scaleX, scaleY) {
            this.context.scale(scaleX, scaleY);
            return this;
        },
        
        /**
         * 画像として保存
         */
        saveAsImage: function(mime_type) {
            mime_type = mime_type || tm.graphics.Canvas.MIME_TYPE_PNG;
            var data_url = this.canvas.toDataURL(mime_type);
            // data_url = data_url.replace(mime_type, "image/octet-stream");
            window.open(data_url, "save");
            
            // toDataURL を使えば下記のようなツールが作れるかも!!
            // TODO: プログラムで絵をかいて保存できるツール
        },

        /**
         * アルファとブレンドモードを同時セット
         * TODO: 未実装
         */
        setCompositing: function(alpha, compositeOperation) {
            // TODO
        },

        /**
         * 塗りつぶしスタイルをセット
         */
        setFillStyle: function(style) {
            this.context.fillStyle = style;
            return this;
        },

        /**
         * ストロークスタイルをセット
         */
        setStrokeStyle: function(style) {
            this.context.strokeStyle = style;
            return this;
        },
        
        /**
         * <a href="http://www.w3.org/TR/2010/WD-2dcontext-20100624/#colors-and-styles">http://www.w3.org/TR/2010/WD-2dcontext-20100624/#colors-and-styles</a>
         */
        setColorStyle: function(stroke, fill) {
            fill = fill || stroke;
            
            this.context.strokeStyle    = stroke;
            this.context.fillStyle      = fill;
            return this;
        },
        
        /**
         * テキストをセット
         */
        setText: function(font, align, baseline) {
            var c = this.context;
            c.font          = font;
            c.textAlign     = align;
            c.textBaseline  = baseline;
        },
        
        /**
         * ラインスタイルを一括セット
         * <a href="http://www.w3.org/TR/2010/WD-2dcontext-20100624/#line-styles">http://www.w3.org/TR/2010/WD-2dcontext-20100624/#line-styles</a>
         */
        setLineStyle: function(width, cap, join, miter) {
            with(this.context) {
                lineWidth   = width || 1;
                lineCap     = cap   || "round";
                lineJoin    = join  || "round";
                miterLimit  = miter || 10.0;
            }
            return this;
        },
        
        /**
         * 影をセット
         * - <http://www.html5.jp/canvas/ref/property/shadowColor.html>
         * - <http://www.w3.org/TR/2010/WD-2dcontext-20100624/#shadows>
         */
        setShadow: function(color, offsetX, offsetY, blur) {
            var ctx = this.context;
            
            ctx.shadowColor     = color     || "black";
            ctx.shadowOffsetX   = offsetX   || 0;
            ctx.shadowOffsetY   = offsetY   || 0;
            ctx.shadowBlur      = blur      || 0;
            
            return this;
        },
        
        /**
         * エレメント取得
         */
        getElement: function() {
            return this.element;
        },
    });
    
    /** @static @property */
    tm.graphics.Canvas.MIME_TYPE_PNG = "image/png";
    /** @static @property */
    tm.graphics.Canvas.MIME_TYPE_JPG = "image/jpeg";
    /** @static @property */
    tm.graphics.Canvas.MIME_TYPE_SVG = "image/svg+xml";
    
    /**
     * @property    width
     * 幅
     */
    tm.graphics.Canvas.prototype.accessor("width", {
        "get": function()   { return this.canvas.width; },
        "set": function(v)  { this.canvas.width = v; }
    });
    
    /**
     * @property    height
     * 高さ
     */
    tm.graphics.Canvas.prototype.accessor("height", {
        "get": function()   { return this.canvas.height; },
        "set": function(v)  { this.canvas.height = v;   }
    });
    
    /**
     * @property    fillStyle
     * 塗りつぶしスタイル
     */
    tm.graphics.Canvas.prototype.accessor("fillStyle", {
        "get": function()   { return this.context.fillStyle; },
        "set": function(v)  { this.context.fillStyle = v;   }
    });
    
    
    /**
     * @property    strokeStyle
     * ストロークスタイル
     */
    tm.graphics.Canvas.prototype.accessor("strokeStyle", {
        "get": function()   { return this.context.strokeStyle; },
        "set": function(v)  { this.context.strokeStyle = v;   }
    });
    
    
    /**
     * @property    globalAlpha
     * アルファ指定
     */
    tm.graphics.Canvas.prototype.accessor("globalAlpha", {
        "get": function()   { return this.context.globalAlpha; },
        "set": function(v)  { this.context.globalAlpha = v;   }
    });
    
    
    /**
     * @property    globalCompositeOperation
     * ブレンド指定
     */
    tm.graphics.Canvas.prototype.accessor("globalCompositeOperation", {
        "get": function()   { return this.context.globalCompositeOperation; },
        "set": function(v)  { this.context.globalCompositeOperation = v;   }
    });

    /**
     * @property    shadowBlur
     * シャドウブラー
     */
    tm.graphics.Canvas.prototype.accessor("shadowBlur", {
        "get": function()   { return this.context.shadowBlur; },
        "set": function(v)  { this.context.shadowBlur = v;   }
    });
    

    /**
     * @property    shadowColor
     * シャドウブラーカラー
     */
    tm.graphics.Canvas.prototype.accessor("shadowColor", {
        "get": function()   { return this.context.shadowColor; },
        "set": function(v)  { this.context.shadowColor = v;   }
    });
    

    /**
     * @property    shadowOffsetX
     * シャドウオフセット X 
     */
    tm.graphics.Canvas.prototype.accessor("shadowOffsetX", {
        "get": function()   { return this.context.shadowOffsetX; },
        "set": function(v)  { this.context.shadowOffsetX = v;   }
    });
    

    /**
     * @property    shadowOffsetY
     * シャドウオフセット Y
     */
    tm.graphics.Canvas.prototype.accessor("shadowOffsetY", {
        "get": function()   { return this.context.shadowOffsetY; },
        "set": function(v)  { this.context.shadowOffsetY = v;   }
    });
    
    /**
     * @property    lineCap
     * ライン終端の描画方法
     */
    tm.graphics.Canvas.prototype.accessor("lineCap", {
        "get": function()   { return this.context.lineCap; },
        "set": function(v)  { this.context.lineCap = v;   }
    });
    
    /**
     * @property    lineJoin
     * ラインつなぎ目の描画方法
     */
    tm.graphics.Canvas.prototype.accessor("lineJoin", {
        "get": function()   { return this.context.lineJoin; },
        "set": function(v)  { this.context.lineJoin = v;   }
    });
    
    /**
     * @property    miterLimit
     * マイターリミット
     */
    tm.graphics.Canvas.prototype.accessor("miterLimit", {
        "get": function()   { return this.context.miterLimit; },
        "set": function(v)  { this.context.miterLimit = v;   }
    });
    
    /**
     * @property    lineWidth
     * ライン幅設定
     */
    tm.graphics.Canvas.prototype.accessor("lineWidth", {
        "get": function()   { return this.context.lineWidth; },
        "set": function(v)  { this.context.lineWidth = v;   }
    });
    
    /**
     * @property    font
     * フォント
     */
    tm.graphics.Canvas.prototype.accessor("font", {
        "get": function()   { return this.context.font; },
        "set": function(v)  { this.context.font = v;   }
    });
    
    /**
     * @property    textAlign
     * テキストのアラインメント
     */
    tm.graphics.Canvas.prototype.accessor("textAlign", {
        "get": function()   { return this.context.textAlign; },
        "set": function(v)  { this.context.textAlign = v;   }
    });
    
    /**
     * @property    textBaseline
     * テキストのベースライン
     */
    tm.graphics.Canvas.prototype.accessor("textBaseline", {
        "get": function()   { return this.context.textBaseline; },
        "set": function(v)  { this.context.textBaseline = v;   }
    });
    
    /**
     * @property    centerX
     * センターX
     */
    tm.graphics.Canvas.prototype.getter("centerX", function() {
        return this.canvas.width/2;
    });
    
    /**
     * @property    centerY
     * センターY
     */
    tm.graphics.Canvas.prototype.getter("centerY", function(){
        return this.canvas.height/2;
    });

    /**
     * @property    imageSmoothingEnabled
     * 画像スムージング設定
     */
    tm.graphics.Canvas.prototype.accessor("imageSmoothingEnabled", {
        "get": function() {
            return this.context.imageSmoothingEnabled;
        },
        "set": function(v) {
            this.context.imageSmoothingEnabled = v;
            this.context.webkitImageSmoothingEnabled = v;
            this.context.mozImageSmoothingEnabled = v;
        }
    });
    
})();




/*
 * bitmap.js
 */

tm.graphics = tm.graphics || {};

(function() {
    
    /**
     * @class tm.graphics.Bitmap
     * ビットマップクラス
     */
    tm.graphics.Bitmap = tm.createClass({
        
        /** イメージデータ */
        imageData: null,
        
        /**
         * @constructor
         */
        init: function(imageData) {
            if (!dummyCanvas) {
                dummyCanvas = document.createElement("canvas");
                dummyContext= dummyCanvas.getContext("2d");
            }
            this._init.apply(this, arguments);
            this.init = this._init;
        },

        /**
         * @private
         */
        _init: function(imageData) {
            if (arguments.length == 1) {
                this.imageData = imageData;
                this.data = imageData.data;
            }
            else if (arguments.length == 2) {
                var w = arguments[0];
                var h = arguments[1];
                this.imageData = dummyContext.createImageData(w, h);
                this.data = this.imageData.data;
            }
        },
        
        /**
         * index 指定でピクセル値を取得
         * 最も高速
         */
        getPixelIndex: function(index) {
            var i = index*4;
            return [
                this.data[i+0],
                this.data[i+1],
                this.data[i+2],
                this.data[i+3]
            ];
        },
        
        /**
         * x, y 指定でピクセル値を取得
         */
        getPixelXY: function(x, y) {
            return this.getPixelIndex( this.posToIndex(x, y) );
        },
        
        /**
         * ピクセル値を取得
         * ### Memo
         * - index 指定か x, y 指定にするか検討中
         * - 配列で返すか数値で返すか検討中. 速度の早いやつを採用する
         */
        getPixel: function(x, y) {
            return this.getPixelIndex( this.posToIndex(x, y) );
        },

        /**
         * ピクセルを数値としてゲット
         */
        getPixelAsNumber: function(index) {
            var i = index*4;
            return (this.data[i+3] << 24) | (this.data[i+0] << 16) | (this.data[i+1] << 8) | this.data[i+2];
        },

        /**
         * ピクセルをオブジェクトとしてゲット
         */
        getPixelAsObject: function(index) {
            var i = index*4;
            return {
                r: this.data[i+0],
                g: this.data[i+1],
                b: this.data[i+2],
                a: this.data[i+3]
            };
        },

        /**
         * ピクセルを配列としてゲット
         */
        getPixelAsArray: function(index) {
            var i = index*4;
            return [
                this.data[i+0],
                this.data[i+1],
                this.data[i+2],
                this.data[i+3]
            ];
        },
        
        /**
         * 指定した範囲内のピクセル平均値を取得
         */
        getPixelAverage: function(x, y, width, height) {
            var rgba = [0, 0, 0, 0];
            
            // 範囲
            var l = x;
            var r = x+width;
            var t = y;
            var b = y+height;
            
            // ハミ出し調整
            if (l < 0) { l = 0; }
            if (r > this.width) { r = this.width; }
            if (t < 0) { t = 0; }
            if (b > this.height) { b = this.height; }
            
            // 範囲内のピクセル全てを取得
            var temp = [];
            var bitmapWidth = this.width;
            for (var i=t; i<b; ++i) {
                for (var j=l; j<r; ++j) {
                    var index = bitmapWidth*i + j;
                    temp.push( this.getPixelIndex(index) );
                    // temp.push( this.getPixelXY(j, i) );
                }
            }
            
            // 平均を求める
            var len = len=temp.length;
            for (var i=0; i<len; ++i) {
                rgba[0] += temp[i][0];
                rgba[1] += temp[i][1];
                rgba[2] += temp[i][2];
                rgba[3] += temp[i][3];
            }
            
            rgba[0]/=len;
            rgba[1]/=len;
            rgba[2]/=len;
            rgba[3]/=len;
            
            return rgba;
        },
        
        
        /**
         * index 指定でピクセル値をセット
         * 最も高速
         */
        setPixelIndex: function(index, r, g, b) {
            var i = index*4;
            this.data[i+0] = r;
            this.data[i+1] = g;
            this.data[i+2] = b;
            return this;
        },
        
        /**
         * x, y指定でピクセル値をセット
         */
        setPixelXY: function(x, y, r, g, b) {
            return this.setPixelIndex(y*this.imageData.width+x, r, g, b);
        },
        
        /**
         * ピクセル値をセット
         */
        setPixel: function(index, r, g, b) {
            return this.setPixelIndex(y*this.imageData.width+x, r, g, b);
        },

        /**
         * 32bit セット
         */
        setPixel32Index: function(index, r, g, b, a) {
            var i = index*4;
            this.data[i+0] = r;
            this.data[i+1] = g;
            this.data[i+2] = b;
            this.data[i+3] = a;
            return this;
        },

        /**
         * 32bit セット
         */
        setPixel32: function(x, y, r, g, b, a) {
            return this.setPixel32Index(y*this.width+x, r, g, b, a);
        },

        /**
         * 32bit セット
         */
        setPixel32XY: function(x, y, r, g, b, a) {
            return this.setPixel32Index(y*this.width+x, r, g, b, a);
        },

        /**
         * 配列からピクセルをセット
         */
        setPixelFromArray: function(index, pixel) {
            return this.setPixel(index, pixel[0], pixel[1], pixel[2]);
        },

        /**
         * 配列からピクセルをセット
         */
        setPixel32FromArray: function(index, pixel) {
            return this.setPixel32(index, pixel[0], pixel[1], pixel[2], pixel[3]);
        },

        /**
         * argb
         */
        setPixelFromNumber: function(index, pixel) {
            return this.setPixel(index, (pixel & 0x00ff0000)>>>16, (pixel & 0x0000ff00)>>>8, (pixel & 0x000000ff)>>>0);
        },

        /**
         * argb
         */
        setPixel32FromNumber: function(index, pixel) {
            return this.setPixel32(index, (pixel & 0x00ff0000)>>>16, (pixel & 0x0000ff00)>>>8, (pixel & 0x000000ff)>>>0, (pixel & 0xff000000)>>>24);
        },
        
        /**
         * object
         */
        setPixelFromObject: function(index, pixel) {
            return this.setPixel(pixel.r, pixel.g, pixel.b);
        },
        /**
         * オブジェクトからピクセルをセット
         */
        setPixel32FromObject: function(index, pixel) {
            return this.setPixel32(pixel.r, pixel.g, pixel.b, pixel.a);
        },
        
        /**
         * string
         * rgb, hsl, #... #...... などに対応予定
         */
        setPixelFromString: function(index, pixel) {
            // TODO
        },
        
        /**
         * 位置をインデックスに変換
         */
        posToIndex: function(x, y) {
            return y*this.imageData.width + x;
        },
        
        /**
         * フィルター
         */
        filter: function(filter) {
            for (var i=0; i<this.height; ++i) {
                for (var j=0; j<this.width; ++j) {
                    var index = this.posToIndex(j, i);
                    var p = this.getPixel(j, i);
                    
                    filter.calc(p, index, j, i, this);
                }
            }
            
            return this;
        },
        
        /**
         * ノイズ
         */
        noise: function(low, high) {
            low = low  || 0;
            high= high || 255;
            range= high-low;
            
            for (var i=0,len=this.length; i<len; ++i) {
                var p = this.getPixelIndex(i);
                p[0] = Math.random()*range + low;
                p[1] = Math.random()*range + low;
                p[2] = Math.random()*range + low;
                p[3] = 255;
                this.setPixel32Index(i, p[0], p[1], p[2], p[3]);
            }
        },

        /**
         * フィルタを適応する
         * TODO: 未実装
         */
        applyFilter: function(filter) {
            
        },
        
    });
    
    /** @property width  幅 */
    tm.graphics.Bitmap.prototype.accessor("width", {
        "get": function()   { return this.imageData.width; },
        "set": function(v)  { this.imageData.width = v;    }
    });
    /** @property height  高さ */
    tm.graphics.Bitmap.prototype.accessor("height", {
        "get": function()   { return this.imageData.height; },
        "set": function(v)  { this.imageData.height = v;    }
    });
    /** @property length */
    tm.graphics.Bitmap.prototype.getter("length", function() {
        return this.imageData.width*this.imageData.height;
    });
    
    
    /**
     * @member tm.graphics.Canvas
     * ビットマップ取得
     */
    tm.graphics.Canvas.prototype.getBitmap = function(x, y, width, height) {
        return tm.graphics.Bitmap(this.context.getImageData(x||0, y||0, width||this.width, height||this.height));
    };
    
    /**
     * @member tm.graphics.Canvas
     * ビットマップ生成
     */
    tm.graphics.Canvas.prototype.createBitmap = function(width, height) {
        return tm.graphics.Bitmap(this.context.createImageData(width||this.width, height||this.height));
    };

    /**
     * @member tm.asset.Texture
     * ビットマップ生成
     */
    tm.asset.Texture.prototype.getBitmap = function(x, y, width, height) {
        var canvas = tm.graphics.Canvas();
        canvas.resize(this.width, this.height);
        canvas.drawTexture(this, 0, 0, this.width, this.height);
        return canvas.getBitmap(x, y, width, height);
    };

    var dummyCanvas = null;
    var dummyContext = null;
})();


/*
 * filter.js
 */

tm.graphics = tm.graphics || {};

(function() {
    
    /**
     * @class tm.graphics.MonochromeFilter
     * モノクロフィルタ
     */
    tm.graphics.MonochromeFilter = tm.createClass({
        
        /**
         * @constructor
         */
        init: function() {},
        
        /**
         * apply
         */
        apply: function(src, dst) {
            var len = src.length;
            for (var i=0; i<len; ++i) {
                var p = src.getPixelIndex(i);
                var grayscale = p[0]*0.3 + p[1]*0.59 + p[2]*0.11;
                dst.setPixel32Index(i, grayscale, grayscale, grayscale, p[3]);
            }
            
            return dst;
        },
    });
    
    
})();




(function() {
    
    /**
     * @class tm.graphics.ReverseFilter
     * リバースフィルタ
     */
    tm.graphics.ReverseFilter = tm.createClass({
        
        /**
         * @constructor
         */
        init: function() {},
        
        /**
         * apply
         */
        apply: function(src, dst) {
            for (var i=0,len=src.width*src.height; i<len; ++i) {
                var p = src.getPixelIndex(i);
                p[0] = 255-p[0];
                p[1] = 255-p[1];
                p[2] = 255-p[2];
                dst.setPixel32Index(i, p[0], p[1], p[2], 255);
            }
            
            return dst;
        },
    });
    
    
})();


(function() {
    
    /**
     * @class tm.graphics.BlurFilter
     * ブラーフィルタ
     * 
     * ### Reference
     * - <http://www40.atwiki.jp/spellbound/pages/153.html>
     * - <http://www.flother.com/blog/2010/image-blur-html5-canvas/>
     */
    tm.graphics.BlurFilter = tm.createClass({

        /** @property blurX */
        /** @property blurY */
        /** @property quality */
        
        /**
         * @constructor
         */
        init: function(blurX, blurY, quality) {
            this.blurX      = blurX || 4;
            this.blurY      = blurY || 4;
            this.quality    = quality || 1;
        },
        
        /**
         * apply
         */
        apply: function(src, dst) {
            var halfX       = Math.floor(this.blurX/2);
            var halfY       = Math.floor(this.blurY/2);
            var rangeX      = this.blurX;
            var rangeY      = this.blurY;
            var srcWidth    = src.width;
            var srcHeight   = src.height;
            var len         = src.length;
            
            // ブラー処理
            var _apply = function(src, dst) {
                for (var i=0; i<len; ++i) {
                    var x = i%srcWidth;
                    var y = Math.floor(i/srcWidth);
                    var p = src.getPixelAverage(x-halfX, y-halfY, rangeX, rangeY);
                    dst.setPixel32Index(i, p[0], p[1], p[2], 255);
                }
            };
            
            // quality の回数だけブラーをかける
            var tempDst     = src;
            for (var i=0; i<this.quality; ++i) {
                src = tempDst;
                tempDst = tm.graphics.Bitmap(srcWidth, srcHeight);
                _apply(src, tempDst);
            }
            
            // 結果に代入
            //? メモリリークとか大丈夫なのかな
            dst.imageData = tempDst.imageData;
            
            return dst;
        },
    });
    
    
})();


(function() {
    
    // トゥーンテーブル
    var defaultToonTable = [];
    for(var i=0; i<255; ++i) {
        var n=0;
        
        if      (i<100) { n =  60; }
        else if (i<150) { n = 150; }
        else if (i<180) { n = 180; }
        else            { n = 220; }
        
        defaultToonTable[i] = n;
    }
    
    /**
     * @class tm.graphics.ToonFilter
     * トゥーンフィルタ
     */
    tm.graphics.ToonFilter = tm.createClass({
        
        /** トゥーンテーブル */
        toonTable: null,
        
        /**
         * @constructor
         */
        init: function(toonTable) {
            this.toonTable = toonTable || defaultToonTable;
        },
        
        /**
         * apply
         */
        apply: function(src, dst) {
            for (var i=0,len=src.width*src.height; i<len; ++i) {
                var pixel = src.getPixelIndex(i);
                var r = this.toonTable[ pixel[0] ];
                var g = this.toonTable[ pixel[1] ];
                var b = this.toonTable[ pixel[2] ];
                dst.setPixel32Index(i, r, g, b, 255);
            }
            
            return dst;
        },
    });
    
    
})();



(function() {
    
    /**
     * @class tm.graphics.ColorMatrixFilter
     * カラーマトリックスフィルタ
     * 
     * ### Reference
     * - <http://blog.boreal-kiss.com/2008/04/08113113.html/>
     * - <http://voglia.jp/2010/01/26/260>
     * - <http://hakuhin.jp/as/color.html#COLOR_02>
     * - <http://d.hatena.ne.jp/umezo/20090122/1232627694>
     * - <http://www40.atwiki.jp/spellbound/pages/188.html>
     */
    tm.graphics.ColorMatrixFilter = tm.createClass({
        
        /** @property colorMatrix */

        /**
         * @constructor
         */
        init: function(colorMatrix) {
            this.colorMatrix = colorMatrix;
        },
        
        /**
         * @property
         * apply
         */
        apply: function(src, dst) {
            var cm = this.colorMatrix;
            for (var i=0,len=src.length; i<len; ++i) {
                var pixel = src.getPixelIndex(i);
                var r = (pixel[0] * cm[0]) + (pixel[1] * cm[1]) + (pixel[2] * cm[2]) + (pixel[3] * cm[3]) + cm[4];
                var g = (pixel[0] * cm[5]) + (pixel[1] * cm[6]) + (pixel[2] * cm[7]) + (pixel[3] * cm[8]) + cm[9];
                var b = (pixel[0] * cm[10]) + (pixel[1] * cm[11]) + (pixel[2] * cm[12]) + (pixel[3] * cm[13]) + cm[14];
                var a = (pixel[0] * cm[15]) + (pixel[1] * cm[16]) + (pixel[2] * cm[17]) + (pixel[3] * cm[18]) + cm[19];
                dst.setPixel32Index(i, r, g, b, a);
            }
            
            return dst;
        }
        
    });
    
})();












/*
 * gradient.js
 */

tm.graphics = tm.graphics || {};

(function() {
    
    tm.graphics.Canvas.prototype.setGradient = function(gradient) {
        this.context.fillStyle = gradient.gradient;
    };
    
})();

(function() {
    
    /**
     * @class tm.graphics.LinearGradient
     * 線形グラデーション
     */
    tm.graphics.LinearGradient = tm.createClass({

        /**
         * @constructor
         */
        init: function(x, y, width, height) {
            if (!dummyCanvas) {
                dummyCanvas = document.createElement("canvas");
                dummyContext= dummyCanvas.getContext("2d");
            }
            this._init(x, y, width, height);
            this.init = this._init;
        },

        /**
         * @private
         */
        _init: function(x, y, width, height) {
            this.gradient = dummyContext.createLinearGradient(x, y, width, height);
        },

        /**
         * カラー点を追加
         */
        addColorStop: function(offset, color) {
            this.gradient.addColorStop(offset, color);
            return this;
        },

        /**
         * カラー点をリストで追加
         */
        addColorStopList: function(prop) {
            for (var i=0,len=prop.length; i<len; ++i) {
                var offset  = prop[i].offset;
                var color   = prop[i].color;
                this.addColorStop(offset, color);
            }
            return this;
        },

        /**
         * スタイル化
         */
        toStyle: function() {
            return this.gradient;
        },
        
    });

    
    /**
     * @class tm.graphics.RadialGradient
     * 円形グラデーション
     */
    tm.graphics.RadialGradient = tm.createClass({

        /**
         * @constructor
         */        
        init: function(x0, y0, r0, x1, y1, r1) {
            if (!dummyCanvas) {
                dummyCanvas = document.createElement("canvas");
                dummyContext= dummyCanvas.getContext("2d");
            }
            this._init(x0, y0, r0, x1, y1, r1);
            this.init = this._init;
        },

        /**
         * @private
         */
        _init: function(x0, y0, r0, x1, y1, r1) {
            this.gradient = dummyContext.createRadialGradient(x0, y0, r0, x1, y1, r1);
        },
        
        /**
         * カラー点を追加
         */
        addColorStop: function(offset, color) {
            this.gradient.addColorStop(offset, color);
            return this;
        },

        /**
         * カラー点をリストで追加
         */
        addColorStopList: function(prop) {
            for (var i=0,len=prop.length; i<len; ++i) {
                var offset  = prop[i].offset;
                var color   = prop[i].color;
                this.addColorStop(offset, color);
            }
            return this;
        },

        /**
         * スタイル化
         */
        toStyle: function() {
            return this.gradient;
        },
        
    });

    var dummyCanvas = null;
    var dummyContext = null;
    
})();
















/*
 * tween.js
 */

tm.anim = tm.anim || {};

(function() {
    
    
    /**
     * @class tm.anim.Tween
     * Tween クラス
     * @extends tm.event.EventDispatcher
     */
    tm.anim.Tween = tm.createClass({
        
        superClass: tm.event.EventDispatcher,

        /** アニメーションさせる対象  */
        target      : null,
        /** アニメーションの時間  */
        time        : null,
        /** プロパティ 未使用？  */
        prop        : null,
        /** 現在のプロパティ  */
        nowProps    : null,
        /** 未使用  */
        now         : null,
        /** 未使用  */
        begin       : null,
        /** 未使用  */
        finish      : null,
        /** アニメーションにかける時間  */
        duration    : null,
        /** ループするかどうか  */
        isLooping   : null,
        /** アニメーション中かどうか  */
        isPlaying   : null,
        /** アニメーション実行関数  */
        func        : Math.linear,
        /** フレームレート  */
        fps         : 30,
        
        /**
         * @constructor
         * @param {Object} target
         * @param {Object} finishProps
         * @param {Object} duration
         * @param {Function} func
         */
        init: function(target, finishProps, duration, func) {
            this.superInit();
            
            this.time = 0;
            this.nowProps = {};
            this.isPlaying = false;

            if (arguments.length > 0) {
                this.to.apply(this, arguments);
            }
        },

        /**
         * 指定した値までアニメーション
         * @param {Object} target
         * @param {Object} finishProps
         * @param {Object} duration
         * @param {Function} func
         */
        to: function(target, finishProps, duration, func) {
            var beginProps = {};

            for (var key in finishProps) {
                beginProps[key] = target[key];
            }

            this.fromTo(target, beginProps, finishProps, duration, func);

            return this;
        },

        /**
         * 指定した値を足した値までアニメーション
         * @param {Object} target
         * @param {Object} props
         * @param {Object} duration
         * @param {Function} func
         */
        by: function(target, props, duration, func) {
            var beginProps = {};
            var finishProps = {};

            for (var key in props) {
                beginProps[key] = target[key];
                finishProps[key] = target[key] + props[key];
            }

            this.fromTo(target, beginProps, finishProps, duration, func);

            return this;
        },

        /**
         * 開始の値から終了の値までアニメーション
         * @param {Object} target
         * @param {Object} beginProps
         * @param {Object} finishProps
         * @param {Object} duration
         * @param {Function} func
         */
        fromTo: function(target, beginProps, finishProps, duration, func) {
            this.target = target;
            this.beginProps  = beginProps;
            this.finishProps = finishProps;
            this.duration = duration;
            
            // setup
            this.changeProps = {};
            for (var key in beginProps) {
                this.changeProps[key] = finishProps[key] - beginProps[key];
            }
            this.setTransition(func);

            return this;
        },

        /**
         * from
         * @param {Object} target
         * @param {Object} beginProps
         * @param {Object} duration
         * @param {Function} func
         */
        from: function(target, beginProps, duration, func) {
            var finishProps = {};

            for (var key in beginProps) {
                finishProps[key] = target[key];
            }

            this.fromTo(target, beginProps, finishProps, duration, func);

            return this;
        },
        
        /**
         * easingの指定か、コールバックの指定か調べる
         * @param {Function} func
         */
        setTransition: function(func) {
            if (typeof func == 'function') {
                this.func = func;
            }
            else if (typeof func == 'string'){
                this.func = tm.anim.easing[func];
            }
            else {
                this.func = tm.anim.easing["default"];
            }
            return this;
        },
        
        /**
         * アニメーションの再開
         */
        resume: function() {
            this.isPlaying = true;
            this._resumeTime();
            this._updateTime();
            this.dispatchEvent(tm.event.TweenEvent("resume", this.time, this.nowProps));
        },
        
        /**
         * アニメーションの開始
         */
        start: function() {
            this.isPlaying = true;
            this._startTime();
            this._updateTime();
            this.dispatchEvent(tm.event.TweenEvent("start", this.time, this.nowProps));
        },
        
        /**
         * アニメーションのストップ
         */
        stop: function() {
            this.isPlaying = false;
            this.dispatchEvent(tm.event.TweenEvent("stop", this.time, this.nowProps));
        },
        
        /**
         * 開始位置まで戻る
         */
        rewind: function() {
            this.time = 0;
            this.update();
        },
        
        /**
         * 最後位置まで早送り
         */
        fforward: function() {
            this.time = this.duration;
            this.update();
        },

        /**        
         * ヨーヨーのアニメーション
         */
        yoyo: function() {
            var temp = this.finishProps;
            this.finishProps = this.beginProps;
            this.beginProps  = temp;
            for (var key in this.beginProps) {
                this.changeProps[key] = this.finishProps[key] - this.beginProps[key];
            }
            this.start();
        },
        
        /**
         * 更新
         */
        update: function() {
            for (var key in this.changeProps) {
                this.nowProps[key] = this.func(this.time, this.beginProps[key], this.changeProps[key], this.duration);
                this.target[key] = this.nowProps[key];
            }
            this.dispatchEvent(tm.event.TweenEvent("change", this.time, this.nowProps));
        },
        
        /**
         * 時間を巻き戻す
         * @private
         */
        _resumeTime: function() {
            this.startTime = (new Date()).getTime() - this.time;
        },
        
        /**
         * スタート時間を設定
         * @private
         */
        _startTime: function() {
            this.startTime = (new Date()).getTime();
        },
        
        /**
         * 時間を進める
         * @private
         */
        _updateTime: function() {
            if (this.isPlaying) {
                this._setTime((new Date()).getTime() - this.startTime);
                setTimeout(arguments.callee.bind(this), 1000/this.fps);
            }
        },
        
        /**
         * 時間を設定する
         * @param {Object} t
         * @private
         */
        _setTime: function(t) {
            var time = t;
            // モーション終了
            if (time > this.duration) {
                // ループ
                if (this.isLooping) {
                    this.rewind();
                    // 座標を更新
                    this.update();
                    // イベント開始
                    this.dispatchEvent(tm.event.TweenEvent("loop", this.time, this.nowProps));
                }
                // 終了
                else {
                    this.time = this.duration;
                    // 座標を更新
                    this.update();
                    // 停止
                    this.stop();
                    // イベント
                    this.dispatchEvent(tm.event.TweenEvent("finish", this.time, this.nowProps));
                }
            }
            // 更新
            else {
                this.time = time;
                // 座標を更新
                this.update();
            }
        }
    });
})();


/*
 * easing
 */
(function() {
    
    /**
     * @class tm.anim.easing
     * イージング
     * ### Reference
     * - <http://coderepos.org/share/wiki/JSTweener>
     * - <http://coderepos.org/share/browser/lang/javascript/jstweener/trunk/src/JSTweener.js>
     * - <http://gsgd.co.uk/sandbox/jquery/easing/jquery.easing.1.3.js>
     * - <http://hosted.zeh.com.br/tweener/docs/en-us/misc/transitions.html>
     */
    tm.anim.easing = {
        /** default */
        "default": function(t, b, c, d) {
            return c*t/d + b;
        },        
        /** linear */
        linear: function(t, b, c, d) {
            return c*t/d + b;
        },        
        /** swing */
        swing: function(t, b, c, d) {
            return -c *(t/=d)*(t-2) + b;
        },        
        /** easeInQuad */
        easeInQuad: function(t, b, c, d) {
            return c*(t/=d)*t + b;
        },        
        /** easeOutQuad */
        easeOutQuad: function(t, b, c, d) {
            return -c *(t/=d)*(t-2) + b;
        },        
        /** easeInOutQuad */
        easeInOutQuad: function(t, b, c, d) {
            if((t/=d/2) < 1) return c/2*t*t + b;
            return -c/2 *((--t)*(t-2) - 1) + b;
        },
        /** defeInCubic */
        easeInCubic: function(t, b, c, d) {
            return c*(t/=d)*t*t + b;
        },
        /** easeOutCubic */
        easeOutCubic: function(t, b, c, d) {
            return c*((t=t/d-1)*t*t + 1) + b;
        },
        /** easeInOutCubic */
        easeInOutCubic: function(t, b, c, d) {
            if((t/=d/2) < 1) return c/2*t*t*t + b;
            return c/2*((t-=2)*t*t + 2) + b;
        },
        /** easeOutInCubic */
        easeOutInCubic: function(t, b, c, d) {
            if(t < d/2) return tm.anim.easing.easeOutCubic(t*2, b, c/2, d);
            return tm.anim.easing.easeInCubic((t*2)-d, b+c/2, c/2, d);
        },
        /** easeInQuart */
        easeInQuart: function(t, b, c, d) {
            return c*(t/=d)*t*t*t + b;
        },
        /** easeOutQuart */
        easeOutQuart: function(t, b, c, d) {
            return -c *((t=t/d-1)*t*t*t - 1) + b;
        },
        /** easeInOutQuart */
        easeInOutQuart: function(t, b, c, d) {
            if((t/=d/2) < 1) return c/2*t*t*t*t + b;
            return -c/2 *((t-=2)*t*t*t - 2) + b;
        },
        /** easeOutInQuart */
        easeOutInQuart: function(t, b, c, d) {
            if(t < d/2) return tm.anim.easing.easeOutQuart(t*2, b, c/2, d);
            return tm.anim.easing.easeInQuart((t*2)-d, b+c/2, c/2, d);
        },
        /** easeInQuint */
        easeInQuint: function(t, b, c, d) {
            return c*(t/=d)*t*t*t*t + b;
        },
        /** easeOutQuint */
        easeOutQuint: function(t, b, c, d) {
            return c*((t=t/d-1)*t*t*t*t + 1) + b;
        },
        /** easeInOutQuint */
        easeInOutQuint: function(t, b, c, d) {
            if((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
            return c/2*((t-=2)*t*t*t*t + 2) + b;
        },
        /** easeOutInQuint */
        easeOutInQuint: function(t, b, c, d) {
            if(t < d/2) return tm.anim.easing.easeOutQuint(t*2, b, c/2, d);
            return tm.anim.easing.easeInQuint((t*2)-d, b+c/2, c/2, d);
        },
        /** easeInSine */
        easeInSine: function(t, b, c, d) {
            return -c * Math.cos(t/d *(Math.PI/2)) + c + b;
        },
        /** easeOutSine */
        easeOutSine: function(t, b, c, d) {
            return c * Math.sin(t/d *(Math.PI/2)) + b;
        },
        /** easeInOutSine */
        easeInOutSine: function(t, b, c, d) {
            return -c/2 *(Math.cos(Math.PI*t/d) - 1) + b;
        },
        /** easeOutInSine */
        easeOutInSine: function(t, b, c, d) {
            if(t < d/2) return tm.anim.easing.easeOutSine(t*2, b, c/2, d);
            return tm.anim.easing.easeInSine((t*2)-d, b+c/2, c/2, d);
        },
        /** easeInExpo */
        easeInExpo: function(t, b, c, d) {
            return(t==0) ? b : c * Math.pow(2, 10 *(t/d - 1)) + b - c * 0.001;
        },
        /** easeOutExpo */
        easeOutExpo: function(t, b, c, d) {
            return(t==d) ? b+c : c * 1.001 *(-Math.pow(2, -10 * t/d) + 1) + b;
        },
        /** easeInOutExpo */
        easeInOutExpo: function(t, b, c, d) {
            if(t==0) return b;
            if(t==d) return b+c;
            if((t/=d/2) < 1) return c/2 * Math.pow(2, 10 *(t - 1)) + b - c * 0.0005;
            return c/2 * 1.0005 *(-Math.pow(2, -10 * --t) + 2) + b;
        },
        /** easeOutInExpo */
        easeOutInExpo: function(t, b, c, d) {
            if(t < d/2) return tm.anim.easing.easeOutExpo(t*2, b, c/2, d);
            return tm.anim.easing.easeInExpo((t*2)-d, b+c/2, c/2, d);
        },
        /** easeInCirc */
        easeInCirc: function(t, b, c, d) {
            return -c *(Math.sqrt(1 -(t/=d)*t) - 1) + b;
        },
        /** easeOutCirc */
        easeOutCirc: function(t, b, c, d) {
            return c * Math.sqrt(1 -(t=t/d-1)*t) + b;
        },
        /** easeInOutCirc */
        easeInOutCirc: function(t, b, c, d) {
            if((t/=d/2) < 1) return -c/2 *(Math.sqrt(1 - t*t) - 1) + b;
            return c/2 *(Math.sqrt(1 -(t-=2)*t) + 1) + b;
        },
        /** easeOutInCirc */
        easeOutInCirc: function(t, b, c, d) {
            if(t < d/2) return tm.anim.easing.easeOutCirc(t*2, b, c/2, d);
            return tm.anim.easing.easeInCirc((t*2)-d, b+c/2, c/2, d);
        },
        /** easeInElastic */
        easeInElastic: function(t, b, c, d, a, p) {
            var s;
            if(t==0) return b;  if((t/=d)==1) return b+c;  if(!p) p=d*.3;
            if(!a || a < Math.abs(c)) { a=c; s=p/4; } else s = p/(2*Math.PI) * Math.asin(c/a);
            return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )) + b;
        },
        /** easeOutElastic */
        easeOutElastic: function(t, b, c, d, a, p) {
            var s;
            if(t==0) return b;  if((t/=d)==1) return b+c;  if(!p) p=d*.3;
            if(!a || a < Math.abs(c)) { a=c; s=p/4; } else s = p/(2*Math.PI) * Math.asin(c/a);
            return(a*Math.pow(2,-10*t) * Math.sin((t*d-s)*(2*Math.PI)/p ) + c + b);
        },
        /** easeInOutElastic */
        easeInOutElastic: function(t, b, c, d, a, p) {
            var s;
            if(t==0) return b;  if((t/=d/2)==2) return b+c;  if(!p) p=d*(.3*1.5);
            if(!a || a < Math.abs(c)) { a=c; s=p/4; }       else s = p/(2*Math.PI) * Math.asin(c/a);
            if(t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )) + b;
            return a*Math.pow(2,-10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p )*.5 + c + b;
        },
        /** easeOutInElastic */
        easeOutInElastic: function(t, b, c, d, a, p) {
            if(t < d/2) return tm.anim.easing.easeOutElastic(t*2, b, c/2, d, a, p);
            return tm.anim.easing.easeInElastic((t*2)-d, b+c/2, c/2, d, a, p);
        },
        /** easeInBack */
        easeInBack: function(t, b, c, d, s) {
            if(s == undefined) s = 1.70158;
            return c*(t/=d)*t*((s+1)*t - s) + b;
        },
        /** easeOutBack */
        easeOutBack: function(t, b, c, d, s) {
            if(s == undefined) s = 1.70158;
            return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
        },
        /** easeInOutBack */
        easeInOutBack: function(t, b, c, d, s) {
            if(s == undefined) s = 1.70158;
            if((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
            return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
        },
        /** easeOutInBack */
        easeOutInBack: function(t, b, c, d, s) {
            if(t < d/2) return tm.anim.easing.easeOutBack(t*2, b, c/2, d, s);
            return tm.anim.easing.easeInBack((t*2)-d, b+c/2, c/2, d, s);
        },
        /** easeInBounce */
        easeInBounce: function(t, b, c, d) {
            return c - tm.anim.easing.easeOutBounce(d-t, 0, c, d) + b;
        },
        /** easeOutBounce */
        easeOutBounce: function(t, b, c, d) {
            if((t/=d) <(1/2.75)) {
                return c*(7.5625*t*t) + b;
            } else if(t <(2/2.75)) {
                return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
            } else if(t <(2.5/2.75)) {
                return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
            } else {
                return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
            }
        },
        /** easeInOutBounce */
        easeInOutBounce: function(t, b, c, d) {
            if(t < d/2) return tm.anim.easing.easeInBounce(t*2, 0, c, d) * .5 + b;
            else return tm.anim.easing.easeOutBounce(t*2-d, 0, c, d) * .5 + c*.5 + b;
        },
        /** easeOutInBounce */
        easeOutInBounce: function(t, b, c, d) {
            if(t < d/2) return tm.anim.easing.easeOutBounce(t*2, b, c/2, d);
            return tm.anim.easing.easeInBounce((t*2)-d, b+c/2, c/2, d);
        }
    };
    
})();








/*
 * Timer
 */


(function() {

    tm.define("tm.app.Timer", {
        /** フレーム */
        frame: 0,
        fps: 30,
        frameTime: 1000/30,

        init: function() {
            this.frame = 0;
            this.fps = tm.app.Timer["default"].fps;
        },

        reset: function() {
            this.frame = 0;
            return this;
        },

        update: function() {
            this.frame = this.frame + 1;
            return this;
        },

        getFrame: function() {
            return this.frame;
        },

        getSeconds: function() {
            return this._seconds;
        },

        getMilliseconds: function() {
            return this._milliseconds;
        },

        checkIntervalEnd: function(time) {
            var t = (time/this.fps)|0;
            if (this.frame % t == 0) {
                return true;
            }
            return false;
        },

        // start ~ end の間かを判定する
        checkBetween: function(start, end) {
            if (arguments.length == 1) {
                end = Math.max(start, 0);
                start = end-this.frameTime;
            }
            var time = (this.frame/this.fps)*1000;

            return start <= time < end;
            return Math.inside(time, start, end);
        },

        _update: function() {
            var time = (this.frame/this.fps);
            this._seconds = time|0;
            this._milliseconds = (time*1000)|0;
        }
    });

    tm.app.Timer.prototype.accessor("frame", {
        "get": function() {
            return this._frame;
        },
        "set": function(frame){
            this._frame = frame;
            this._update();
        },
    });
    
    /**
     * @property fps
     * fps
     */
    tm.app.Timer.prototype.accessor("fps", {
        "get": function() {
            return this._fps;
        },
        "set": function(fps){
            if (fps !== this._fps) {
                this.frameTime = (1000/fps);
            }
            this._fps = fps;
            this._update();
        },
    });    

    tm.app.Timer["default"] = {
        fps: 30,
    };

})();




/*
 * updater.js
 */

 
(function() {
    
    /**
     * @class tm.app.Updater
     * 更新管理クラス
     */
    tm.define("tm.app.Updater", {
        app: null,

        init: function(app) {
            this.app = app;
        },

        update: function(root) {
            this._updateElement(root);
        },

        _updateElement: function(elm) {
            var app = this.app;
            
            // 更新するかを判定
            if (elm.awake == false) return ;

            // 更新
            if (elm.update) elm.update(app);

            // エンターフレームイベント
            if (elm.hasEventListener("enterframe")) {
                var e = tm.event.Event("enterframe");
                e.app = app;
                elm.fire(e);
            }
            
            // タッチ判定
            if (elm.interactive) {
                elm._checkPointing(app);
            }

            // 子供を更新
            var len = elm.children.length;
            if (len > 0) {
                var tempChildren = elm.children.slice();
                for (var i=0; i<len; ++i) {
                    this._updateElement(tempChildren[i]);
                }
            }
        },
    });

})();



/*
 * baseapp.js
 */

tm.app = tm.app || {};


(function() {
    
    /**
     * @class tm.app.BaseApp
     * ベースアプリケーション
     */
    tm.app.BaseApp = tm.createClass({

        superClass: tm.event.EventDispatcher,
        
        /** エレメント */
        element       : null,
        /** マウスクラス */
        mouse         : null,
        /** タッチクラス */
        touch         : null,
        /** マウスクラス + タッチクラス */
        pointing      : null,
        /** キーボードクラス */
        keyboard      : null,
        /** 加速度センサー */
        accelerometer : null,
        /** 更新クラス */
        updater       : null,
        /** statsライブラリ */
        stats         : null,
        /** タイマー */
        timer         : null,
        /** 現在更新中か */
        awake         : null,
        /** @private  シーン情報の管理 */
        _scenes       : null,
        /** @private  シーンのインデックス */
        _sceneIndex   : 0,

        /**
         * @constructor
         * @param {Object} elm
         */
        init: function(elm) {
            this.superInit();

            this.element = elm;

            // タイマー
            this.timer = tm.app.Timer();

            // マウスを生成
            this.mouse      = tm.input.Mouse(this.element);
            // タッチを生成
            this.touch      = tm.input.Touch(this.element, 0);
            // キーボードを生成
            this.keyboard   = tm.input.Keyboard();
            
            // ポインティングをセット(PC では Mouse, Mobile では Touch)
            this.pointing   = (tm.isMobile) ? this.touch : this.mouse;
            this.element.addEventListener("touchstart", function () {
                this.pointing = this.touch;
            }.bind(this));
            this.element.addEventListener("mousedown", function () {
                this.pointing = this.mouse;
            }.bind(this));
            
            // 加速度センサーを生成
            this.accelerometer = tm.input.Accelerometer();

            this.updater = tm.app.Updater(this);
            
            // 再生フラグ
            this.awake = true;
            
            // シーン周り
            this._scenes = [ tm.app.Scene() ];
            this._sceneIndex = 0;
            
            // 決定時の処理をオフにする(iPhone 時のちらつき対策)
            this.element.addEventListener("touchstart", function(e) { e.stop(); });
            this.element.addEventListener("touchmove", function(e) { e.stop(); });
            
            // ウィンドウフォーカス時イベントリスナを登録
            window.addEventListener("focus", function() {
                this.fire(tm.event.Event("focus"));
                this.currentScene.dispatchEvent(tm.event.Event("focus"));
            }.bind(this));
            // ウィンドウブラー時イベントリスナを登録
            window.addEventListener("blur", function() {
                this.fire(tm.event.Event("blur"));
                this.currentScene.dispatchEvent(tm.event.Event("blur"));
            }.bind(this));
            // クリック
            this.element.addEventListener((tm.isMobile) ? "touchend" : "mouseup", this._onclick.bind(this));
        },
        
        /**
         * 実行
         */
        run: function() {
            var self = this;

            this.startedTime = new Date();
            this.prevTime = new Date();
            this.deltaTime = 0;

            var _run = function() {
                // start
                var start = (new Date()).getTime();

                // run
                self._loop();

                // calculate progress time
                var progress = (new Date()).getTime() - start;
                // calculate next waiting time
                var newDelay = self.timer.frameTime-progress;

                // set next running function
                setTimeout(_run, newDelay);
            };

            _run();

            return this;
        },
        
        /*
         * ループ処理
         * @private
         */
        _loop: function() {
            // update
            if (this.update) this.update();
            this._update();
            
            // draw
            if (this.draw) this.draw();
            this._draw();

            var now = new Date();
            this.deltaTime = now - this.prevTime;
            this.prevTime = now;
            
            // stats update
            if (this.stats) this.stats.update();
        },
        
        /**
         * シーンを切り替える
         * @param {Object} scene
         * ## Reference
         * - <http://ameblo.jp/hash-r-1234/entry-10967942550.html>
         */
        replaceScene: function(scene) {
            var e = null;
            if (this.currentScene) {
                e = tm.event.Event("exit");
                e.app = this;
                this.currentScene.dispatchEvent(e);
                this.currentScene.app = null;
            }
            e = tm.event.Event("enter");
            e.app = this;
            this.currentScene = scene;
            this.currentScene.app = this;
            this.currentScene.dispatchEvent(e);

            return this;
        },
        
        /**
         * シーンをプッシュする(ポーズやオブション画面などで使用)
         * @param {Object} scene
         */
        pushScene: function(scene) {
            this.fire(tm.event.Event("push"));

            var e = tm.event.Event("pause");
            e.app = this;
            this.currentScene.dispatchEvent(e);
            
            this._scenes.push(scene);
            ++this._sceneIndex;
            
            this.fire(tm.event.Event("pushed"));

            var e = tm.event.Event("enter");
            e.app = this;
            scene.app = this;
            scene.dispatchEvent(e);


            return this;
        },
        
        /**
         * シーンをポップする(ポーズやオブション画面などで使用)
         */
        popScene: function() {
            this.fire(tm.event.Event("pop"));
            
            var scene = this._scenes.pop();
            --this._sceneIndex;
            
            var e = tm.event.Event("exit");
            e.app = this;
            scene.dispatchEvent(e);
            scene.app = null;

            this.fire(tm.event.Event("poped"));
            
            // 
            var e = tm.event.Event("resume");
            e.app = this;
            e.prevScene = scene;
            this.currentScene.dispatchEvent(e);
            
            return scene;
        },
        
        /**
         * 外部のFPS表示ライブラリ Stats を生成、配置する
         * ## Reference
         * - <https://github.com/mrdoob/stats.js>
         */
        enableStats: function() {
            if (window["Stats"]) {
                // Stats
                this.stats = new Stats();
                // 右上に設定
                this.stats.domElement.style.position = "fixed";
                this.stats.domElement.style.left     = "5px";
                this.stats.domElement.style.top      = "20px";
                document.body.appendChild(this.stats.domElement);
            }
            else {
                console.warn("not defined stats.");
            }

            return this;
        },
        
        /**
         * dat gui を有効化
         */
        enableDatGUI: function() {
            if (window.dat) {
                var gui = new dat.GUI();
                
                return gui;
            }
        },
        
        /**
         * シーンのupdateを実行するようにする
         */
        start: function() {
            this.awake = true;

            return this;
        },
        
        /**
         * シーンのupdateを実行しないようにする
         */
        stop: function() {
            this.awake = false;

            return this;
        },
        
        /**
         * デバイスやシーンのアップデート呼び出し処理
         * @private
         */
        _update: function() {
            // デバイス系 Update
            this.mouse.update();
            this.keyboard._update();
            this.touch.update();
            // this.touches.update();
            
            if (this.awake) {
                this.updater.update(this.currentScene);
                this.timer.update();
            }
        },
        
        /**
         * 描画用仮想関数
         * @private
         */
        _draw: function() {},
        
        /**
         * elementの取得
         */
        getElement: function() {
            return this.element;
        },

        /**
         * クリックイベント登録
         * @private
         * @param {Object} e
         */
        _onclick: function(e) {
            var _fn = function(elm) {
                if (elm.children.length > 0) {
                    elm.children.each(function(elm) { _fn(elm); });
                }
                if (elm._clickFlag && elm.hasEventListener("click")) {
                    elm.dispatchEvent(tm.event.Event("click"));
                }
                elm._clickFlag = false;
            };
            _fn(this.currentScene);
        },
    });
    
    /**
     * @property currentScene
     * カレントシーン
     */
    tm.app.BaseApp.prototype.accessor("currentScene", {
        "get": function() { return this._scenes[this._sceneIndex]; },
        "set": function(v){ this._scenes[this._sceneIndex] = v; }
    });
    
    /**
     * @property frame
     * フレーム
     */
    tm.app.BaseApp.prototype.accessor("frame", {
        "get": function() {
            return this.timer.frame;
        },
        "set": function(v){
            this.timer.frame = v;
        }
    });
    
    /**
     * @property fps
     * fps
     */
    tm.app.BaseApp.prototype.accessor("fps", {
        "get": function() {
            return this.timer.fps;
        },
        "set": function(v){
            this.timer.fps = v;
        }
    });
    
})();














/*
 * element.js
 */

tm.app = tm.app || {};


(function() {
    
    /**
     * @class tm.app.Element
     * アプリケーション用オブジェクトの基底となるクラス
     * 親子関係の情報を管理する
     * @extends tm.event.EventDispatcher
     */
    tm.app.Element = tm.createClass({
        superClass: tm.event.EventDispatcher,
        
        /** 親 */
        parent: null,
        /** 子 */
        children: null,
        
        /**
         * @constructor
         */
        init: function() {
            this.superInit();
            this.children = [];
        },
        
        /**
         * 親から離す
         */
        remove: function() {
            console.assert(this.parent);
            this.parent.removeChild(this);

            this.parent = null;
            
            return this;
        },
        
        /**
         * 子供を追加
         * @param {Object} child
         */
        addChild: function(child) {
            if (child.parent) child.remove();
            child.parent = this;
            this.children.push(child);

            var e = tm.event.Event("added");
            child.dispatchEvent(e);
            
            return child;
        },
        
        /**
         * parent に自分を子供として追加
         * @param {Object} parent
         */
        addChildTo: function(parent) {
            parent.addChild(this);
            
            // if (this.parent) this.remove();
            // this.parent = parent;
            // parent.children.push(child);
            
            return this;
        },
        
        /**
         * まとめて追加
         * scene 遷移時に子供をごっそり移譲するときなどに使用
         * まだ動作確認していない
         * @param {Object} children
         */
        addChildren: function(children) {
            var tempChildren = children.slice();
            for (var i=beginIndex,len=tempChildren.length; i<len; ++i) {
                this.addChild(tempChildren[i]);
            }
        },
        
        /**
         * index 指定で要素を取得
         */
        addChildAt: function(child, index) {
            if (child.parent) child.remove();
            child.parent = this;
            this.children.splice(index, 0, child);

            var e = tm.event.Event("added");
            child.dispatchEvent(e);

            return child;
        },
        
        /**
         * 指定で要素を取得
         */
        getChildAt: function(child) {
            return this.children.at(child);
        },
        
        /**
         * 指定で要素を取得
         */
        getChildIndex: function(child) {
            return this.children.indexOf(child);
        },
        
        /**
         * child に一致するエレメントを離す
         * @param {Object} child
         */
        removeChild: function(child) {
            var index = this.children.indexOf(child);
            if (index != -1) {
                this.children.splice(index, 1);
                var e = tm.event.Event("removed");
                child.dispatchEvent(e);
            }
        },
        
        /**
         * すべての child を離す
         * @param {Object} beginIndex
         */
        removeChildren: function(beginIndex) {
            beginIndex = beginIndex || 0;
            var tempChildren = this.children.slice();
            for (var i=beginIndex,len=tempChildren.length; i<len; ++i) {
                tempChildren[i].remove();
            }
            this.children = [];
        },
        
        /**
         * 名前の一致する child を取得
         * @param {String} name
         */
        getChildByName: function(name) {
            for (var i=0,len=this.children.length; i<len; ++i)
                if (this.children[i].name == name) return this.children[i];
            
            return null;
        },
        
        /**
         * 関数実行
         * @param {Function} func
         * @param {Object} args
         */
        execChildren: function(func, args) {
            args = (args && args.length) ? args : [args];
            // 関数内で remove される可能性があるので配列をコピーする
            var tempChildren = this.children.slice();
            for (var i=0,len=tempChildren.length; i<len; ++i) {
                func.apply(tempChildren[i], args);
            }
        },
        
        /**
         * 親を取得
         */
        getParent: function() { return this.parent; },
        
        /**
         * ルートを取得
         */
        getRoot: function() {
            if (!this.parent) return null;
            // TODO: 親をたどって NULL だったらそのエレメントを返す
            var elm = null;
            for (elm=this.parent; elm.parent != null; elm = elm.parent) {}
            return elm;
        },
        
        /**
         * jsonをパースしてthisに展開
         */
        fromJSON: function(data) {
            var _fromJSON = function(name, data) {
                var init = data["init"];
                var args = (init instanceof Array) ? init : [init];
                var type = (DIRTY_CLASS_MAP[data.type]) ? DIRTY_CLASS_MAP[data.type] : data.type;
                var _class = tm.using(type);
                
                console.assert(Object.keys(_class).length !== 0, _class + " is not defined.");
                
                var elm = _class.apply(null, args).addChildTo(this);
                elm.fromJSON(data);
                
                this[name] = elm;
            }.bind(this);
            
            for (var key in data) {
                var value = data[key];
                if (key == "children") {
                    if (value instanceof Array) {
                        for (var i=0,len=value.length; i<len; ++i) {
                            var childData = value[i];
                            _fromJSON(childData.name, childData);
                        }
                    }
                    else {
                        for (var key in value) {
                            var childData = value[key];
                            _fromJSON(key, childData);
                        }
                    }
                }
                else {
                    if (key == "type") key = "__key";
                    this[key] = value;
                }
            }

            return this;
        },
        /**
         * 要素を JSON 化する
         * TODO: 実装する予定
         */
        toJSON: function() {
            // TODO:
        },
        
    });

    /*
     * @private
     * namespaceの後方互換
     */
    var DIRTY_CLASS_MAP = {
        "Sprite"                : "tm.display.Sprite",
        "Label"                 : "tm.display.Label",
        "Shape"                 : "tm.display.Shape",
        "CircleShape"           : "tm.display.CircleShape",
        "TriangleShape"         : "tm.display.TriangleShape",
        "RectangleShape"        : "tm.display.RectangleShape",
        "RoundRectangleShape"   : "tm.display.RoundRectangleShape",
        "TextShape"             : "tm.display.TextShape",
        "StarShape"             : "tm.display.StarShape",
        "PolygonShape"          : "tm.display.PolygonShape",
        "HeartShape"            : "tm.display.HeartShape",
        "AnimationSprite"       : "tm.display.AnimationSprite",
        
        "LabelButton"           : "tm.ui.LabelButton",
        "IconButton"            : "tm.ui.IconButton",
        "GlossyButton"          : "tm.ui.GlossyButton",
        "FlatButton"            : "tm.ui.FlatButton",
    };
    
})();

/*
 * object2d.js
 */

(function() {
    
    /**
     * @class tm.app.Object2D
     * Object2D
     * @extends tm.app.Element
     */
    tm.define("tm.app.Object2D", {
        superClass: "tm.app.Element",
        
        /** 位置 */
        position: null,
        /** スケール */
        scale: null,
        /** 回転 */
        rotation: 0,
        /** 起きているフラグ */
        awake: true,
        /** @private  幅 */
        _width:  64,
        /** @private  高さ */
        _height: 64,
        /** @property pointing      ポインティング */
        /** @property origin        中心位置 */
        /** @property _matrix       マトリックス */
        /** @property hitFlags      ヒット判定フラグ */
        /** @property downFlags     ダウンフラグ */
        /** @property _worldMatrix  グローバル行列 */
        /** @property _worldAlpha   グローバルのα値 */
        
        /**
         * @constructor
         * @param {Object} elm
         */
        init: function() {
            this.superInit();
            this.position = tm.geom.Vector2(0, 0);
            this.scale    = tm.geom.Vector2(1, 1);
            this.pointing = tm.geom.Vector2(0, 0);
            this.origin   = tm.geom.Vector2(0.5, 0.5);
            this._matrix  = tm.geom.Matrix33();
            this._matrix.identity();
            
            this.boundingType = "circle";
            this.checkHierarchy = true;
            this.interactive = false;
            this.hitFlags = [];
            this.downFlags= [];
            this._clickFlag = false;

            this._worldMatrix = tm.geom.Matrix33().identity();
            this._worldAlpha = 1.0;
        },
        
        /**
         * 最終的な行列をゲット
         */
        getFinalMatrix: function() {
            var matrix = tm.geom.Matrix33();
 
            if (this.parent) {
                matrix.multiply(this.parent.getFinalMatrix());
            }
            matrix.translate(this.x, this.y);
            matrix.rotateZ(this.rotation*Math.DEG_TO_RAD);
            matrix.scale(this.scaleX, this.scaleY);
 
            return matrix;
        },
        
        /**
         * 点と衝突しているかを判定
         * @param {Number} x
         * @param {Number} y
         */
        isHitPoint: function(x, y) {
            // 円判定
            var p = this.globalToLocal(tm.geom.Vector2(x, y));
            this.pointing.x = p.x;
            this.pointing.y = p.y;
            
            if (((p.x)*(p.x)+(p.y)*(p.y)) < (this.radius*this.radius)) {
                return true;
            }
            return false;
        },
 
        /**
         * 円として点と衝突判定
         * @param {Number} x
         * @param {Number} y
         */
        isHitPointCircle: function(x, y) {
            var lenX = this.x - x;
            var lenY = this.y - y;
            if (((lenX)*(lenX)+(lenY)*(lenY)) < (this.radius*this.radius)) {
                return true;
            }
            return false;
        },
 
        /**
         * 矩形として点と衝突判定
         * @param {Number} x
         * @param {Number} y
         */
        isHitPointRect: function(x, y) {
            // ここから下のバージョンは四角形
            
            var left   = this.x - this.width*this.originX;
            var right  = this.x + this.width*(1-this.originX);
            var top    = this.y - this.height*this.originY;
            var bottom = this.y + this.height*(1-this.originY);
            
            if ( left < x && x < right && top  < y && y < bottom ) { return true; }
            
            return false;
        },
        
        /**
         * 階層を考慮した円衝突判定
         * @param {Number} x
         * @param {Number} y
         */
        isHitPointCircleHierarchy: function(x, y) {
            // 円判定
            var p = this.globalToLocal(tm.geom.Vector2(x, y));
            this.pointing.x = p.x;
            this.pointing.y = p.y;
            
            if (((p.x)*(p.x)+(p.y)*(p.y)) < (this.radius*this.radius)) {
                return true;
            }
            return false;
        },
        
        /**
         * 階層を考慮した矩形衝突判定
         * @param {Number} x
         * @param {Number} y
         */
        isHitPointRectHierarchy: function(x, y) {
            var p = this.globalToLocal(tm.geom.Vector2(x, y));
            this.pointing.x = p.x;
            this.pointing.y = p.y;
            
            var left   = -this.width*this.originX;
            var right  = +this.width*(1-this.originX);
            var top    = -this.height*this.originY;
            var bottom = +this.height*(1-this.originY);
            
            if ( left < p.x && p.x < right && top  < p.y && p.y < bottom ) { return true; }
            
            return false;
        },
        
        /**
         * 要素と衝突しているかを判定
         * @param {Object} elm
         */
        isHitElement: function(elm) {
            var selfGlobalPos  = this.parent.localToGlobal(this);
            if (((this.x-elm.x)*(this.x-elm.x)+(this.y-elm.y)*(this.y-elm.y)) < (this.radius+elm.radius)*(this.radius+elm.radius)) {
                return true;
            }
            return false;
        },
 
        /**
         * 円同士の衝突判定
         * @param {Object} elm
         */
        isHitElementCircle: function(elm) {
            return tm.collision.testCircleCircle(this.getBoundingCircle(), elm.getBoundingCircle());
        },
 
        /**
         * 円同士の衝突判定
         * @param {Object} elm
         */
        isHitElementRect: function(elm) {
            return tm.collision.testRectRect(this.getBoundingRect(), elm.getBoundingRect());    
        },
 
        /**
         * バウンディングサークル
         * @param {Object} elm
         */
        getBoundingCircle: function() {
            return tm.geom.Circle(this.centerX, this.centerY, this.radius);
        },
 
        /**
         * バウンディングレクト
         * @param {Object} elm
         */
        getBoundingRect: function() {
            return tm.geom.Rect(this.left, this.top, this.width, this.height);
        },
 
        /**
         * ローカル座標をグローバル座標に変換
         * @param {Object} elm
         */
        localToGlobal: function(p) {
            return this.getFinalMatrix().multiplyVector2(p);
        },
        
        /**
         * グローバル座標をローカル座標に変換
         * @param {Object} elm
         */
        globalToLocal: function(p) {
            var matrix = this._worldMatrix.clone();
            matrix.invert();
            matrix.transpose();

            return matrix.multiplyVector2(p);
        },
        
        /**
         * X 座標値をセット
         * @param {Number} x
         */
        setX: function(x) {
            this.position.x = x;
            return this;
        },
        
        /**
         * Y 座標値をセット
         * @param {Number} y
         */
        setY: function(y) {
            this.position.y = y;
            return this;
        },
        
        /**
         * XY 座標をセット
         * @param {Number} x
         * @param {Number} y
         */
        setPosition: function(x, y) {
            this.position.x = x;
            this.position.y = y;
            return this;
        },

        /**
         * 回転をセット
         * @param {Number} rotation
         */
        setRotation: function(rotation) {
            this.rotation = rotation;
            return this;
        },

        /**
         * スケールをセット
         * @param {Number} x
         * @param {Number} y
         */
        setScale: function(x, y) {
            this.scale.x = x;
            if (arguments.length <= 1) {
                this.scale.y = x;
            } else {
                this.scale.y = y;
            }
            return this;
        },
        
        /**
         * 基準点をセット
         * @param {Number} x
         * @param {Number} y
         */
        setOrigin: function(x, y) {
            this.origin.x = x;
            this.origin.y = y;
            return this;
        },
        
        /**
         * 幅をセット
         * @param {Number} width
         */
        setWidth: function(width) {
            this.width = width;
            return this;
        },
        
        /**
         * 高さをセット
         * @param {Number} height
         */
        setHeight: function(height) {
            this.height = height;
            return this;
        },
        
        /**
         * サイズ(幅, 高さ)をセット
         * @param {Number} width
         * @param {Number} height
         */
        setSize: function(width, height) {
            this.width  = width;
            this.height = height;
            return this;
        },
        
        /**
         * 起動
         */
        wakeUp: function() {
            this.awake = true;
            return this;
        },
        
        /**
         * 停止
         */
        sleep: function() {
            this.awake = false;
            return this;
        },
        
        /**
         * タッチ判定の有効/無効をセット
         * @param {Boolean} flag
         */
        setInteractive: function(flag, type) {
            this.interactive = flag;

            if (type) {
                this.boundingType = type;
            }

            return this;
        },
        
        /**
         * バウンディングタイプをセット("circle" or "rect")
         * @param {Object} type
         */
        setBoundingType: function(type) {
            this.boundingType = type;
            return this;
        },
        
        /**
         * ポインティングをチェック
         * @private
         * @param {Object} app
         */
        _checkPointing: function(app) {
            console.assert(false);
        },
        
        /**
         * マウスチェック
         * @private
         * @param {Object} app
         */
        _checkMouse: function(app) {
            this.__checkPointing(app, app.pointing, 0);
        },

        /**
         * タッチチェック
         * @private
         * @param {Object} app
         */
        _checkTouch: function(app) {
            var self = this;
            this.__checkPointing(app, app.pointing, 0);
            // app.touches.each(function(touch, i) {
            //     self.__checkPointing(app, touch, i);
            // });
        },
        
        /**
         * チェックポインンティング
         * @private
         * @param {Object} app
         * @param {Object} p
         * @param {Number} index
         */
        __checkPointing: function(app, p, index) {
            var elm = this.element;
            
            var prevHitFlag = this.hitFlags[index];
            this.hitFlags[index]    = this.isHitPoint(p.x, p.y);

            if (!prevHitFlag && this.hitFlags[index]) {
                this._dispatchPointingEvent("mouseover", "touchover", "pointingover", app, p);
            }
            
            if (prevHitFlag && !this.hitFlags[index]) {
                this._dispatchPointingEvent("mouseout", "touchout", "pointingout", app, p);
            }
            
            if (this.hitFlags[index]) {
                if (p.getPointingStart()) {
                    this._dispatchPointingEvent("mousedown", "touchstart", "pointingstart", app, p);
                    this.downFlags[index] = true;
                    this._clickFlag = true;
                }
            }
            
            if (this.downFlags[index]) {
                this._dispatchPointingEvent("mousemove", "touchmove", "pointingmove", app, p);
            }
            
            if (this.downFlags[index]==true && p.getPointingEnd()) {
                this._dispatchPointingEvent("mouseup", "touchend", "pointingend", app, p);
                this.downFlags[index] = false;
            }
        },
        
        /**
         * ポイントイベントを発火する
         * @private
         * @param {Object} mouse
         * @param {Object} touch
         * @param {Object} pointing
         * @param {Object} app
         * @param {Object} p
         */
        _dispatchPointingEvent: function(mouse, touch, pointing, app, p) {
            this.dispatchEvent( tm.event.MouseEvent(mouse, app, p) );
            this.dispatchEvent( tm.event.TouchEvent(touch, app, p) );
            this.dispatchEvent( tm.event.PointingEvent(pointing, app, p) );
        },
        
        /**
         * ワールドマトリックスを計算
         * @private
         */
        _calcWorldMatrix: function() {
            if (!this.parent) {
                return ;
            }

            // 行列
            if(this.rotation != this.rotationCache) {
                this.rotationCache = this.rotation;
                var r = this.rotation*Math.DEG_TO_RAD;
                this._sr =  Math.sin(r);
                this._cr =  Math.cos(r);
            }

            var localTransform = this._matrix.m;
            var parentTransform = this.parent._worldMatrix.m;
            var worldTransform = this._worldMatrix.m;
            //console.log(localTransform)
            localTransform[0] = this._cr * this.scale.x;
            localTransform[1] =-this._sr * this.scale.y
            localTransform[3] = this._sr * this.scale.x;
            localTransform[4] = this._cr * this.scale.y;

            // 
            localTransform[2] = this.position.x;
            localTransform[5] = this.position.y;

            // cache
            var a00 = localTransform[0], a01 = localTransform[1], a02 = localTransform[2],
                a10 = localTransform[3], a11 = localTransform[4], a12 = localTransform[5],

                b00 = parentTransform[0], b01 = parentTransform[1], b02 = parentTransform[2],
                b10 = parentTransform[3], b11 = parentTransform[4], b12 = parentTransform[5];

            worldTransform[0] = b00 * a00 + b01 * a10;
            worldTransform[1] = b00 * a01 + b01 * a11;
            worldTransform[2] = b00 * a02 + b01 * a12 + b02;

            worldTransform[3] = b10 * a00 + b11 * a10;
            worldTransform[4] = b10 * a01 + b11 * a11;
            worldTransform[5] = b10 * a02 + b11 * a12 + b12;
        },
        
        /**
         * dirty method
         * @private
         */
        _dirtyCalc: function() {
            this._calcWorldMatrix();
        },
    });
 
    /**
     * @property    x
     * x座標値
     */
    tm.app.Object2D.prototype.accessor("x", {
        "get": function()   { return this.position.x; },
        "set": function(v)  { this.position.x = v; }
    });
    
    /**
     * @property    y
     * y座標値
     */
    tm.app.Object2D.prototype.accessor("y", {
        "get": function()   { return this.position.y; },
        "set": function(v)  { this.position.y = v; }
    });
 
    /**
     * @property    originX
     * x座標値
     */
    tm.app.Object2D.prototype.accessor("originX", {
        "get": function()   { return this.origin.x; },
        "set": function(v)  { this.origin.x = v; }
    });
    
    /**
     * @property    originY
     * y座標値
     */
    tm.app.Object2D.prototype.accessor("originY", {
        "get": function()   { return this.origin.y; },
        "set": function(v)  { this.origin.y = v; }
    });
    
    /**
     * @property    scaleX
     * スケールX値
     */
    tm.app.Object2D.prototype.accessor("scaleX", {
        "get": function()   { return this.scale.x; },
        "set": function(v)  { this.scale.x = v; }
    });
    
    /**
     * @property    scaleY
     * スケールY値
     */
    tm.app.Object2D.prototype.accessor("scaleY", {
        "get": function()   { return this.scale.y; },
        "set": function(v)  { this.scale.y = v; }
    });
    
    
    
    /**
     * @property    width
     * width
     */
    tm.app.Object2D.prototype.accessor("width", {
        "get": function()   { return this._width; },
        "set": function(v)  { this._width = v; }
    });
    
    
    /**
     * @property    height
     * height
     */
    tm.app.Object2D.prototype.accessor("height", {
        "get": function()   { return this._height; },
        "set": function(v)  { this._height = v; }
    });
    
    /**
     * @property    radius
     * 半径
     */
    tm.app.Object2D.prototype.accessor("radius", {
        "get": function()   {
            return (this._radius !== undefined) ? this._radius : (this.width+this.height)/4;
        },
        "set": function(v)  { this._radius = v; }
    });
    
    /**
     * @property    top
     * 左
     */
    tm.app.Object2D.prototype.accessor("top", {
        "get": function()   { return this.y - this.height*this.originY; },
        "set": function(v)  { this.y = v + this.height*this.originY; },
    });
 
    /**
     * @property    right
     * 左
     */
    tm.app.Object2D.prototype.accessor("right", {
        "get": function()   { return this.x + this.width*(1-this.originX); },
        "set": function(v)  { this.x = v - this.width*(1-this.originX); },
    });
 
    /**
     * @property    bottom
     * 左
     */
    tm.app.Object2D.prototype.accessor("bottom", {
        "get": function()   { return this.y + this.height*(1-this.originY); },
        "set": function(v)  { this.y = v - this.height*(1-this.originY); },
    });
 
    /**
     * @property    left
     * 左
     */
    tm.app.Object2D.prototype.accessor("left", {
        "get": function()   { return this.x - this.width*this.originX; },
        "set": function(v)  { this.x = v + this.width*this.originX; },
    });

    /**
     * @property    centerX
     * centerX
     */
    tm.app.Object2D.prototype.accessor("centerX", {
        "get": function()   { return this.x + this.width/2 - this.width*this.originX; },
        "set": function(v)  {
            // TODO: どうしようかな??
        }
    });
 
    /**
     * @property    centerY
     * centerY
     */
    tm.app.Object2D.prototype.accessor("centerY", {
        "get": function()   { return this.y + this.height/2 - this.height*this.originY; },
        "set": function(v)  {
            // TODO: どうしようかな??
        }
    });
 
    /**
     * @property    boundingType
     * boundingType
     */
    tm.app.Object2D.prototype.accessor("boundingType", {
        "get": function() {
            return this._boundingType;
        },
        "set": function(v) {
            this._boundingType = v;
            this._setIsHitFunc();
        },
    });
 
    /**
     * @property    checkHierarchy
     * checkHierarchy
     */
    tm.app.Object2D.prototype.accessor("checkHierarchy", {
        "get": function()   { return this._checkHierarchy; },
        "set": function(v)  {
            this._checkHierarchy = v;
            this._setIsHitFunc();
        }
    });
 
 
    var _isHitFuncMap = {
        "rect": tm.app.Object2D.prototype.isHitPointRect,
        "circle": tm.app.Object2D.prototype.isHitPointCircle,
        "true": function() { return true; },
        "false": function() { return false; },
    };
 
    var _isHitFuncMapHierarchy = {
        "rect": tm.app.Object2D.prototype.isHitPointRectHierarchy,
        "circle": tm.app.Object2D.prototype.isHitPointCircleHierarchy,
        "true": function() { return true; },
        "false": function() { return false; },
    };
 
    var _isHitElementMap = {
        "rect": tm.app.Object2D.prototype.isHitElementRect,
        "circle": tm.app.Object2D.prototype.isHitElementCircle,
        "true": function() { return true; },
        "false": function() { return false; },
    };
 
    /**
     * @member      tm.app.Object2D
     * @property    _setIsHitFunc
     * @private
     */
    tm.app.Object2D.prototype._setIsHitFunc = function() {
        var isHitFuncMap = (this.checkHierarchy) ? _isHitFuncMapHierarchy : _isHitFuncMap;
        var boundingType = this.boundingType;
        var isHitFunc = (isHitFuncMap[boundingType]) ? (isHitFuncMap[boundingType]) : (isHitFuncMap["true"]);
 
        this.isHitPoint   = (isHitFuncMap[boundingType]) ? (isHitFuncMap[boundingType]) : (isHitFuncMap["true"]);
        this.isHitElement = (_isHitElementMap[boundingType]) ? (_isHitElementMap[boundingType]) : (_isHitElementMap["true"]);
    };
    
    /**
     * @member      tm.app.Object2D
     * @property    _checkPointing
     * ポイントをチェック
     * @param {Object} isMobile
     * @private
     */
    tm.app.Object2D.prototype._checkPointing = (tm.isMobile) ?
        tm.app.Object2D.prototype._checkTouch : tm.app.Object2D.prototype._checkMouse;

    
})();




;(function() {


    /**
     * @class tm.app.Grid
     * @extends tm.app.Object2d
     * グリッド
     */
    tm.define("tm.app.Grid", {
        superClass: "tm.app.Object2D",

        cellWidth: 64,
        cellHeight: 64,
        maxPerLine: 8,
        arrangement: "horizontal", // vertical
        
        /**
         * @constructor
         */
        init: function(param) {
            this.superInit();

        },

        reposition: function() {
            var childs = this.children;

            if (this.arrangement == "horizontal") {
                childs.each(function(child, i) {
                    var xIndex = (i%this.maxPerLine);
                    var yIndex = (i/this.maxPerLine)|0;
                    var x = this.cellWidth*xIndex;
                    var y = this.cellHeight*yIndex;
                    child.setPosition(x, y);
                }, this);
            }
            else {
                childs.each(function(child, i) {
                    var xIndex = (i/this.maxPerLine)|0;
                    var yIndex = (i%this.maxPerLine);
                    var x = this.cellWidth*xIndex;
                    var y = this.cellHeight*yIndex;
                    child.setPosition(x, y);
                }, this);
            }
        },
    });

})();


/*
 * scene.js
 */

tm.app = tm.app || {};


(function() {
    
    /**
     * @class tm.app.Scene
     * シーンとして使用するゲームエレメントクラス
     * @extends tm.app.Object2D
     */
    tm.app.Scene = tm.createClass({
        superClass: tm.app.Object2D,

        app: null,

        /** ManagerScene 経由で生成された際に次にどのシーンに遷移するかのラベル */
        nextLabel: "",

        /** ManagerScene 経由で生成された際に次のシーンに渡す引数 */
        nextArguments: null,

        /**
         * @constructor
         */
        init: function() {
            this.superInit();
            
            this.boundingType = "none";
            
            // タッチに反応させる
            this.setInteractive(true);
        },

        exit: function(param) {
            if (!this.app) return ;

            if (typeof param !== 'object') {
                var temp = {};
                temp.nextLabel = arguments[0];
                temp.nextArguments = arguments[1];
                param = temp;
            }

            if (param.nextLabel) {
                this.nextLabel = param.nextLabel;
            }
            if (param.nextArguments) {
                this.nextArguments = param.nextArguments;
            }

            this.app.popScene();

            return this;
        },

    });
    
})();



/*
 * collision.js
 */

tm.app = tm.app || {};


(function() {
    
    /**
     * @class tm.app.Collision
     * 衝突管理クラス
     */
    tm.app.Collision = tm.createClass({
        
        /** @property */
        element: null,
        /** @property */
        collideList: null,

        /**
         * @constructor
         * @param {Object} elm
         */
        init: function(elm) {
            this.element = elm;
            this.collideList = [];
        },
        
        /**
         * 更新
         * @param {Object} app
         */
        update: function(app) {
            var cl  = this.collideList.clone();
            var elm = this.element;
            
            for (var i=0,len=cl.length; i<len; ++i) {
                var c = cl[i];
                if (elm.isHitElement(c.element)) {
                    // 最初の衝突だった場合は collisionenter を呼ぶ
                    if (c.collide === false) {
                        var e = tm.event.Event("collisionenter");
                        e.other = c.element;
                        elm.dispatchEvent(e);
                    }
                    // 通常の衝突イベント
                    var e = tm.event.Event("collisionstay");
                    e.other = c.element;
                    elm.dispatchEvent(e);
                    
                    c.collide = true;
                }
                else {
                    if (c.collide == true) {
                        var e = tm.event.Event("collisionexit");
                        e.other = c.element;
                        elm.dispatchEvent(e);
                    }
                    c.collide = false;
                }
            }
        },
        
        /**
         * 追加
         * @param {Object} elm
         */
        add: function(elm) {
            this.collideList.push({
                element: elm,
                collide: false,
            });
        },
        
        /**
         * 削除
         * @param {Object} elm
         */
        remove: function(elm) {
            this.collideList.eraseIf(function(v) {
                return v.element == elm;
            });
        },
        
    });
    
    
    /**
     * @member      tm.app.Element
     * @property    collision
     * コリジョン
     */
    tm.app.Element.prototype.getter("collision", function() {
        if (!this._collision) {
            this._collision = tm.app.Collision(this);
            this.addEventListener("enterframe", function(e){
                this._collision.update(e.app);
            });
        }
        
        return this._collision;
    });
    
    
})();
/*
 * tweener.js
 */

(function() {

    /**
     * @class tm.app.Tweener
     * トゥイーナークラス
     * @extends tm.event.EventDispatcher
     */
    tm.define("tm.app.Tweener", {
        superClass: "tm.app.Element",

        /**
         * @constructor
         * @param {Object} elm
         */
        init: function(elm) {
            this.superInit();

            this.setTarget(elm || {});
            this.loop = false;

            this._init();
        },

        /**
         * 初期化
         */
        _init: function() {
            this._index = 0;
            this._tasks = [];
            this._func = this._updateTask;
            this.isPlaying = true;
        },

        /**
         * ターゲットのセット
         * @param {Object} target
         */
        setTarget: function(target) {
            this.element = target;

            return this;
        },

        /**
         * 更新
         * @param {Object} app
         */
        update: function(app) {
            this._func(app);
            return ;
            var tweens = this.tweens.clone();
            for (var i=0,len=tweens.length; i<len; ++i) {
                var tween = tweens[i];
                
                // 待ちチェック
                if (tween.delay > 0) {
                    tween.delay -= 1000/app.fps;
                    continue;
                }
                
                var time = tween.time + 1000/app.fps;
                tween._setTime(time);
                
                if (tween.time >= tween.duration) {
                    // 削除
                    this.tweens.erase(tween);
                    
                    // 全てのアニメーション終了チェック
                    if (this.tweens.length <= 0) {
                        this.isAnimation = false;
                        var e = tm.event.Event("finish");
                        this.element.fire(e);
                        this.dispatchEvent(e);
                    }
                }
                else {
                    tween.update();
                }
            }
        },

        /**
         * タスクの更新
         * @private
         * @param {Object} app
         */
        _updateTask: function(app) {
            if (!this.isPlaying) return ;

            var task = this._tasks[this._index];
            if (!task) {

                if (this.loop === true) {
                    this._index = 0;
                }
                else {
                    this.isPlaying = false;
                }

                return ;
            }
            this._index++;

            if (task.type == "tween") {
                var data = task.data;
                var fnStr= task.data.type;
                var args = task.data.args;
                this._tween = tm.anim.Tween();

                this._tween[fnStr].apply(this._tween, args);

                this._func = this._updateTween;
                this._func(app);
            }
            else if (task.type == "wait") {
                this._wait = task.data;
                this._wait.time = 0;

                this._func = this._updateWait;
                this._func(app);
            }
            else if (task.type == "call") {
                task.data.func.apply(task.data.self, task.data.args);
                // 1フレーム消費しないよう再帰
                this._updateTask(app);
            }
            else if (task.type == "set") {
                this.element.$extend(task.data.values);
                // 1フレーム消費しないよう再帰
                this._updateTask(app);
            }
        },

        /**
         * Tween の更新
         * @private
         * @param {Object} elm
         */
        _updateTween: function(app) {
            var tween = this._tween;
            var time = tween.time + 1000/app.fps;
            tween._setTime(time);
            
            if (tween.time >= tween.duration) {
                // 削除
                delete this._tween;
                this._tween = null;
                this._func = this._updateTask;
            }
            else {
                tween.update();
            }

        },

        /**
         * 時間の更新
         * @private
         * @param {Object} elm
         */
        _updateWait: function(app) {
            var wait = this._wait;
            wait.time += 1000/app.fps;

            if (wait.time >= wait.limit) {
                delete this._wait;
                this._wait = null;
                this._func = this._updateTask;
            }
        },

        /**
         * 追加
         * @param {Object} param
         */
        add: function(param) {
            if (!param.target) param.target = this.element;

            this._tasks.push({
                type: "tween",
                data: param
            });

            if (this.isAnimation == false) {
                this.isAnimation = true;
                var e = tm.event.Event("animationstart");
                this.element.dispatchEvent(e);
            }
            
            return this;
        },

        /**
         * 指定した値を足した値までアニメーション
         * @param {Object} props
         * @param {Object} duration
         * @param {Function} fn
         */
        by: function(props, duration, fn) {
            this._addTweenTask({
                props: props,
                duration: duration,
                fn: fn,
                type: "by"
            });
            return this;
        },

        /**
         * 指定した値までアニメーション
         * @param {Object} props
         * @param {Object} duration
         * @param {Function} fn
         */
        to: function(props, duration, fn) {
            this._addTweenTask({
                props: props,
                duration: duration,
                fn: fn,
                type: "to"
            });
            return this;
        },

        from: function(props, duration, fn) {
            this._addTweenTask({
                props: props,
                duration: duration,
                fn: fn,
                type: "from"
            });
            return this;
        },

        /**
         * 移動アニメーション
         * @param {Number} x
         * @param {Number} y
         * @param {Object} duration
         * @param {Function} fn
         */
        move: function(x, y, duration, fn) {
            return this.to({x:x, y:y}, duration, fn);
        },

        /**
         * 指定した値を足した座標までアニメーション
         * @param {Number} x
         * @param {Number} y
         * @param {Object} duration
         * @param {Function} fn
         */
        moveBy: function(x, y, duration, fn) {
            return this.by({x:x, y:y}, duration, fn);
        },

        /**
         * 回転アニメーション
         * @param {Number} rotation
         * @param {Object} duration
         * @param {Function} fn
         */
        rotate: function(rotation, duration, fn) {
            return this.to({rotation:rotation}, duration, fn);
        },

        /**
         * 拡縮アニメーション
         * @param {Number} scale
         * @param {Object} duration
         * @param {Function} fn
         */
        scale: function(scale, duration, fn) {
            return this.to({scaleX:scale, scaleY:scale}, duration, fn);
        },

        /**
         * フェードアニメーション
         * @param {Object} value
         * @param {Object} duration
         */
        fade: function(value, duration) {
            this.to({"alpha":value}, duration);
            return this;
        },

        /**
         * フェードイン
         * @param {Object} duration
         */
        fadeIn: function(duration) {
            this.fade(1.0, duration);
            return this;
        },

        /**
         * フェードアウト
         * @param {Object} duration
         */
        fadeOut: function(duration) {
            this.fade(0.0, duration);
            return this;
        },

        /**
         * Tween のタスクを追加
         * @private
         * @param {Object} param
         */
        _addTweenTask: function(param) {
            param.target   = (param.target !== undefined) ? param.target : this.element;
            param.duration = (param.duration !== undefined) ? param.duration : 1000;

            this._tasks.push({
                type: "tween",
                data: {
                    args: [param.target, param.props, param.duration, param.fn],
                    type: param.type
                }
            });

            if (this.isAnimation == false) {
                this.isAnimation = true;
                var e = tm.event.Event("animationstart");
                this.element.dispatchEvent(e);
            }
            
            return this;
        },

        /**
         * 待ち時間
         * @param {Object} time
         */
        wait: function(time) {
            this._tasks.push({
                type: "wait",
                data: {
                    limit: time
                }
            });
            return this;
        },

        /**
         * コールバックを登録
         * @param {Function} fn
         * @param {Object} args
         */
        call: function(fn, self, args) {
            this._tasks.push({
                type: "call",
                data: {
                    func: fn,
                    self: self || this,
                    args: args,
                },
            });

            return this;
        },

        /**
         * プロパティをセット
         * @param {Object} key
         * @param {Object} value
         */
        set: function(key, value) {
            var values = null;
            if (arguments.length == 2) {
                values = {};
                values[key] = value;
            }
            else {
                values = key;
            }
            this._tasks.push({
                type: "set",
                data: {
                    values: values
                }
            });

            return this;
        },

        /**
         * アニメーション開始
         */
        play: function() {
            this.isPlaying = true;
            return this;
        },

        /**
         * アニメーションを一時停止
         */
        pause: function() {
            this.isPlaying = false;
            return this;
        },

        /**
         * アニメーションを巻き戻す
         */
        rewind: function() {
            this._func = this._updateTask;
            this._index = 0;
            this.play();
            return this;
        },

        /**
         * アニメーションループ設定
         * @param {Boolean} flag
         */
        setLoop: function(flag) {
            this.loop = flag;
            return this;
        },

        /**
         * アニメーションをクリア
         */
        clear: function() {
            this._init();
            return this;
        }
    });

    /**
     * @member      tm.app.Element
     * @property    tweener
     * トゥイーンアニメーション
     */
    tm.app.Element.prototype.getter("tweener", function() {
        if (!this._tweener) {
            this._tweener = tm.app.Tweener(this);
            this.on("enterframe", function(e) {
                this._tweener.update(e.app);
            });
        }
        
        return this._tweener;
    });
})();

/*
 * timeline.js
 */

tm.namespace("tm.app", function() {

    /**
     * @class tm.app.Timeline
     * タイムラインクラス
     * @extends tm.event.EventDispatcher
     */
    tm.define("tm.app.Timeline", {
        superClass: "tm.app.Element",
        
        /**
         * @constructor
         * @param {Object} elm
         */
        init: function(elm) {
            this.superInit();
            
            this.setTarget(elm || {});
            
            this.currentFrame = 0;
            this.currentTime = 0;
            this.prevTime = 0;
            this.duration = 0;
            this.isPlay = true;
            this._tweens  = [];
            this._actions = [];
        },
        
        /**
         * 更新
         * @param {Object} app
         */
        update: function(app) {
            if (!this.isPlay) return ;

            if (this.prevTime <= this.duration) {
                this._updateTween();
                this._updateAction();
            }

            this.currentFrame++;
            this.prevTime = this.currentTime;
            this.currentTime = ((this.currentFrame/app.fps)*1000)|0;
        },
        
        /**
         * トゥイーンを更新
         * @private
         */
        _updateTween: function() {
            var tweens = this._tweens;
            for (var i=0,len=tweens.length; i<len; ++i) {
                var tween = tweens[i];
                
                if (tween.delay > this.currentTime) {
                    continue ;
                }
                
                var time = this.currentTime - tween.delay;
                tween._setTime(time);
                if (tween.time >= tween.duration) {
                }
                else {
                    tween.update();
                }
            }
        },
        
        /**
         * アクションを更新
         * @private
         */
        _updateAction: function() {
            var actions = this._actions;
            
            for (var i=0,len=actions.length; i<len; ++i) {
                var action = actions[i];
                
                if (this.prevTime <= action.delay && action.delay < this.currentTime) {
                    if (action.type == "call") {
                        action.func.call(action.self);
                        // action.func();
                    }
                    else if (action.type == "set") {
                        var props = action.props;
                        for (var key in props) {
                            this.element[key] = props[key];
                        }
                    }
                }
            }
        },
        
        /**
         * 指定した値までアニメーション
         * @param {Object} delay
         * @param {Object} props
         * @param {Object} duration
         * @param {Function} func
         */
        to: function(delay, props, duration, fn) {
            console.assert(typeof delay == "number", "to の第一引数はdelayに変わりました");
            this._addTween({
                props: props,
                duration: duration,
                fn: fn,
                delay: delay
            });
            
            return this;
        },

        /**
         * 指定した値を足した値までアニメーション
         * @param {Object} delay
         * @param {Object} props
         * @param {Object} duration
         * @param {Function} func
         */
        by: function(delay, props, duration, fn) {
            console.assert(typeof delay == "number", "by の第一引数はdelayに変わりました");
            for (var key in props) {
                props[key] += this.element[key] || 0;
            }
            this._addTween({
                props: props,
                duration: duration,
                fn: fn,
                delay: delay
            });
            
            return this;
        },
        
        /**
         * 関数を実行
         * @param {Object} delay
         * @param {Function} func
         */
        call: function(delay, func, self) {
            console.assert(typeof delay == "number", "call の第一引数はdelayに変わりました");
            this._addAction({
                "type": "call",
                func: func,
                self: self || this,
                delay: delay,
            });
            return this;
        },
        
        /**
         * プロパティをセット
         * @param {Object} delay
         * @param {Object} props
         */
        set: function(delay, props) {
            console.assert(typeof delay == "number", "set の第一引数はdelayに変わりました");
            this._addAction({
                "type": "set",
                props: props,
                delay: delay,
            });
            return this;
        },


        /**
         * ターゲットのセット
         * @param {Object} target
         */
        setTarget: function(target) {
            this.element = target;

            return this;
        },

        /**
         * ターゲットをゲット
         */
        getTarget: function() {
            return this.element;
        },
        
        /**
         * アニメーション開始
         * アニメーションが終了したら再度アニメーションを行う
         * @param {Number} frame
         */
        gotoAndPlay: function(frame) {
            this.isPlay = true;
            this.currentFrame = frame;
            this._updateTween();
        },
        
        /**
         * アニメーション開始
         * アニメーションが終了したらストップする
         * @param {Number} frame
         */
        gotoAndStop: function(frame) {
            this.currentFrame = frame;
            this.isPlay = false;
            this._updateTween();
        },

        /**
         * tween を追加
         * @private
         * @param {Object} tween
         */
        _addTween: function(tween) {
            tween.duration = tween.duration || 1000;
            tween.duration = this._dirty(tween.duration);
            tween.delay = tween.delay || 0;
            tween.delay = this._dirty(tween.delay);

            var tweenObj = tm.anim.Tween();
            tweenObj.to(this.element, tween.props, tween.duration, tween.fn);
            tweenObj.delay = tween.delay;

            this._tweens.push(tweenObj);
            this._updateDuration(tweenObj);
        },

        /**
         * アニメーションを追加
         * @private
         * @param {Object} action
         */
        _addAction: function(action) {
            action.delay = action.delay || 0;
            action.delay = this._dirty(action.delay);

            this._actions.push(action);
            this._updateDuration(action);
        },
        
        /**
         * 時間を更新
         * @private
         * @param {Object} task
         */
        _updateDuration: function(task) {
            var duration = task.delay + (task.duration ? task.duration : 0);
            if (this.duration < duration) this.duration = duration;
            return this;
        },

        /**
         * dirty method
         * @private
         * @param {Object} t
         */
        _dirty: function(t) {
            return t;
//            return (t/this.fps).toInt();
        },
        
        /**
         * ロード
         * @param {Object} data
         */
        load: function(data) {
            
            for (var key in data.timeline) {
                var value = data.timeline[key];
            }
            
            return this;
        },
        
        /**
         * アニメーションをクリア
         */
        clear: function() {
            this.currentFrame = 0;
            this.prevTime = 0;
            this.currentTime = 0;
            this.duration = 0;
            this.isPlay = true;
            this._tweens  = [];
            this._actions = [];
            
            return this;
        }
        
    });
    
    
    
    /**
     * @member      tm.app.Element
     * @property    timeline
     * タイムラインアニメーション
     */
    tm.app.Element.prototype.getter("timeline", function() {
        if (!this._timeline) {
            this._timeline = tm.app.Timeline(this);
            this.on("enterframe", function(e) {
                this._timeline.update(e.app);
            });
        }

        return this._timeline;
    });
    
});

/*
 * canvasapp.js
 */

tm.display = tm.display || {};

(function() {

    /**
     * @class tm.display.CanvasApp
     * キャンバスアプリケーション
     * @extends tm.app.BaseApp
     */
    tm.display.CanvasApp = tm.createClass({
        superClass: tm.app.BaseApp,

        /** @property element */
        /** @property canvas */
        /** @property renderer */
        /** @property background */
        /** @property _scenes */
        /** @property mouse */
        /** @property touch */
        
        /**
         * @constructor
         */
        init: function(canvas) {
            if (canvas instanceof HTMLCanvasElement) {
                this.element = canvas;
            }
            else if (typeof canvas == "string") {
                this.element = document.querySelector(canvas);
            }
            else {
                this.element = document.createElement("canvas");
            }

            // 親の初期化
            this.superInit(this.element);

            // グラフィックスを生成
            this.canvas = tm.graphics.Canvas(this.element);
            this.renderer = tm.display.CanvasRenderer(this.canvas);
            
            // カラー
            this.background = "black";
            
            // シーン周り
            this._scenes = [ tm.app.Scene() ];


            this._canvasCache = [];
            this._canvasCacheCache = [];
            this.on("push", function() {
                this._draw();

                var canvas = this._canvasCacheCache.pop();
                if (!canvas) {
                    var element = this.canvas.element.cloneNode();
                    canvas = tm.graphics.Canvas(element);
                }
                canvas.clear();
                canvas.drawTexture(this.canvas, 0, 0);
                this._canvasCache.push(canvas);
            });
            this.on("poped", function() {
                var canvas = this._canvasCache.pop();
                this._draw();

                this._canvasCacheCache.push(canvas);
            });
        },
        
        /**
         * リサイズ
         */
        resize: function(width, height) {
            this.width = width;
            this.height= height;
            
            return this;
        },

        /**
         * ウィンドウのサイズにリサイズ
         */
        resizeWindow: function() {
            this.width = innerWidth;
            this.height= innerHeight;
            
            return this;
        },
        
        /**
         * 画面にフィットさせる
         */
        fitWindow: function(everFlag) {
            // 画面にフィット
            this.canvas.fitWindow(everFlag);
            
            // マウスとタッチの座標更新関数をパワーアップ
            this.mouse._mousemove = this.mouse._mousemoveScale;
            this.touch._touchmove = this.touch._touchmoveScale;

            return this;
        },

        /**
         * @private
         */
        _draw: function() {
            this.canvas.clear();
            
            this.canvas.fillStyle   = "white";
            this.canvas.strokeStyle = "white";
            this.canvas.context.lineJoin = "round";
            this.canvas.context.lineCap  = "round";

            // スタックしたキャンバスを描画
            if (this._canvasCache.last)
                this.canvas.drawTexture(this._canvasCache.last, 0, 0);
            
            // this._canvasCache.each(function(bitmap, index) {
            //     this.canvas.drawBitmap(bitmap, 0, 0);
            // }, this);

            
            // 描画は全てのシーン行う
            this.canvas.save();

            this.renderer.render(this.currentScene);

            this.canvas.restore();
        },
        
    });
    
    
    /**
     * @property    width
     * 幅
     */
    tm.display.CanvasApp.prototype.accessor("width", {
        "get": function()   { return this.canvas.width; },
        "set": function(v)  { this.canvas.width = v; }
    });
    
    /**
     * @property    height
     * 高さ
     */
    tm.display.CanvasApp.prototype.accessor("height", {
        "get": function()   { return this.canvas.height; },
        "set": function(v)  { this.canvas.height = v; }
    });
    
    /**
     * @property    height
     * 高さ
     */
    tm.display.CanvasApp.prototype.accessor("background", {
        "get": function()   { return this.canvas._background; },
        "set": function(v)  {
            this._background = v;
            this.element.style.background = v;
        }
    });

})();



/*
 * canvaselement.js
 */

tm.display = tm.display || {};


(function() {

    /**
     * @class tm.display.CanvasElement
     * キャンバスエレメント
     * @extends tm.app.Object2D
     */
    tm.display.CanvasElement = tm.createClass({
        superClass: tm.app.Object2D,

        /** 表示フラグ */
        visible: true,
        /** クリッピングフラグ */
        clipping: false,
        /** fillStyle */
        fillStyle: "white",
        /** strokeStyle */
        strokeStyle: "white",
        /** アルファ */
        alpha: 1.0,
        /** ブレンドモード */
        blendMode: "source-over",
        /** シャドウカラー */
        shadowColor: "black",
        /** シャドウオフセットX */
        shadowOffsetX: 0,
        /** シャドウオフセットY */
        shadowOffsetY: 0,
        /** シャドウオフブラー */
        shadowBlur: 0,

        /**
         * @constructor
         */
        init: function() {
            this.superInit();
        },

        /**
         * アルファをセット
         */
        setAlpha: function(alpha) {
            this.alpha = alpha;
            return this;
        },

        /**
         * シャドウカラーをセット
         */
        setShadowColor: function(color) {
            this.shadowColor = color;
            return this;
        },
        
        /**
         * シャドウブラーをセット
         */
        setShadowBlur: function(blur) {
            this.shadowBlur = blur;
            return this;
        },
        
        /**
         * シャドウオフセットをセット
         */
        setShadowOffset: function(x, y) {
            this.shadowOffsetX = x;
            this.shadowOffsetY = y;
            return this;
        },

        /**
         * バウンディングサークルを描画
         */
        drawBoundingCircle: function(canvas) {
            canvas.save();
            canvas.lineWidth = 2;
            canvas.strokeCircle(0, 0, this.radius);
            canvas.restore();
        },

        /**
         * バウンディングレクトを描画
         */
        drawBoundingRect: function(canvas) {
            canvas.save();
            canvas.lineWidth = 2;
            canvas.strokeRect(-this.width*this.originX, -this.height*this.originY, this.width, this.height);
            canvas.restore();
        },

        /**
         * ????
         */
        drawFillRect: function(ctx) {
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            return this;
        },
        /**
         * ????
         */
        drawStrokeRect: function(ctx) {
            ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
            return this;
        },

        /**
         * ????
         */
        drawFillArc: function(ctx) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI*2, false);
            ctx.fill();
            ctx.closePath();
            return this;
        },
        /**
         * ????
         */
        drawStrokeArc: function(ctx) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI*2, false);
            ctx.stroke();
            ctx.closePath();
            return this;
        },

        /**
         * 表示/非表示をセット
         */
        setVisible: function(flag) {
            this.visible = flag;
            return this;
        },

        /**
         * 表示
         */
        show: function() {
            this.visible = true;
            return this;
        },

        /**
         * 非表示
         */
        hide: function() {
            this.visible = false;
            return this;
        },

        /**
         * 塗りつぶしスタイルをセット
         */
        setFillStyle: function(style) {
            this.fillStyle = style;
            return this;
        },

        /**
         * ストロークスタイルをセット
         */
        setStrokeStyle: function(style) {
            this.strokeStyle = style;
            return this;
        },

        /**
         * ブレンドモードをセット
         */
        setBlendMode: function(blendMode) {
            this.blendMode = blendMode;
            return this;
        },

        /**
         * ロード
         */
        load: function(data) {
            var self = this;

            data.layers.forEach(function(layer) {
                if (layer.type != "objectgroup") return ;

                var group = tm.display.CanvasElement().addChildTo(self);
                group.width = layer.width;
                group.height = layer.height;

                layer.objects.forEach(function(obj) {
                    var _class = tm.using(obj.type);
                    if (Object.keys(_class).length === 0) {
                        _class=tm.display[obj.type];
                    }
                    var initParam = null;
                    if (obj.properties.init) {
                        initParam = JSON.parse(obj.properties.init);
                    }
                    var element = _class.apply(null, initParam).addChildTo(group);
                    var props   = obj.properties;
                    for (var key in props) {
                        if (key == "init") continue ;
                        var value = props[key];
                        element[key] = value;
                    }

                    element.x = obj.x;
                    element.y = obj.y;
                    element.width = obj.width;
                    element.height = obj.height;
                });

                self[layer.name] = group;
            });
        },

        /**
         * @private
         */
        _calcAlpha: function() {
            if (!this.parent) {
                this._worldAlpha = this.alpha;
                return ;
            }
            else {
                // alpha
                this._worldAlpha = this.parent._worldAlpha * this.alpha;
            }
        },

        /**
         * @private
         */
        _dirtyCalc: function() {
            this._calcAlpha();
            this._calcWorldMatrix();
        },
    });


})();


/*
 * sprite.js
 */


tm.display = tm.display || {};


(function() {
    
    /**
     * @class tm.display.Sprite
     * 画像の描画を行うクラス
     * @extends tm.display.CanvasElement
     */
    tm.display.Sprite = tm.createClass({
        superClass: tm.display.CanvasElement,
        
        /** @property srcRect          */
        /** @property width            width */
        /** @property height           height */
        /** @property @private _image  表示しているアセット(画像) */

        /**
         * @constructor
         */
        init: function(image, width, height) {
            this.superInit();
            
            console.assert(typeof image != 'number', "Sprite の第一引数はテクスチャもしくはテクスチャ名に変わりました");
            
            this._frameIndex = 0;
            this.srcRect = tm.geom.Rect(0, 0, 64, 64);
            
            // 引数あり
            if (arguments.length >= 1) {
                this.setImage(image).fitImage();

                if (width !== undefined) this.width = width;
                if (height !== undefined) this.height = height;
            }
        },

        /**
         * 表示するアセット(画像)をセット
         */
        setImage: function(image, width, height) {
            if (typeof image == "string") {
                var key = image;
                image = tm.asset.Manager.get(key);
                console.assert(image != null, "don't find '" + key + "' as image.");
            }
            
            this._image = image;
            this.srcRect.x = 0;
            this.srcRect.y = 0;
            this.srcRect.width  = image.element.width;
            this.srcRect.height = image.element.height;

            if (width  !== undefined) this.width  = width;
            if (height !== undefined) this.height = height;
            // this.width  = (width !== undefined)  ? width  : image.element.width;
            // this.height = (height !== undefined) ? height : image.element.height;

            return this;
        },

        /**
         * 表示しているアセット(画像)を取得
         */
        getImage: function() {
            return this._image;
        },

        /**
         * 自分自信を画像サイズと同じサイズにする
         */
        fitImage: function() {
            this.width  = this.image.width;
            this.height = this.image.height;

            return this;
        },
        
        /**
         * フレームインデックスをセット
         */
        setFrameIndex: function(index, width, height) {
            var tw  = width || this.width;      // tw
            var th  = height || this.height;    // th
            var row = ~~(this.image.width / tw);
            var col = ~~(this.image.height / th);
            var maxIndex = row*col;
            index = index%maxIndex;
            
            var x   = index%row;
            var y   = ~~(index/row);
            this.srcRect.x = x*tw;
            this.srcRect.y = y*th;
            this.srcRect.width  = tw;
            this.srcRect.height = th;

            this._frameIndex = index;

            return this;
        },
        
        /**
         * @private
         */
        _refreshSize: function() {},
    });
    
    /**
     * @property    image
     * 画像
     */
    tm.display.Sprite.prototype.accessor("image", {
        "get": function()   {
            return this._image;
        },
        "set": function(image)  {
            this.setImage(image);
        }
    });

    /**
     * @property    frameIndex
     * フレームインデックス
     */
    tm.display.Sprite.prototype.accessor("frameIndex", {
        "get": function()   {
            return this._frameIndex;
        },
        "set": function(value)  {
            this.setFrameIndex(value);
        }
    });
    
})();

/*
 * shape.js
 */


tm.display = tm.display || {};


(function() {
    
    /**
     * @class tm.display.Shape
     * @extends tm.display.CanvasElement
     * 図形を描画するクラス
     */
    tm.display.Shape = tm.createClass({
        superClass: tm.display.CanvasElement,
        
        /** @property canvsa */
        /** @property width */
        /** @property height */
        /** @property autoRender */

        /**
         * @constructor
         */
        init: function(param) {
            param = this._dirtyCheckParam.apply(this, arguments);
            var param = {}.$safe(param, {
                width: 64,
                height: 64,
                // bgColor: "#888",
                bgColor: "transparent",

                fillStyle: "red",
                strokeStyle: "white",
                lineWidth: "2",
                shadowBlur: 0,
                shadowColor: "red",
            });
            
            this.superInit();

            // 
            this.canvas = tm.graphics.Canvas();
            // 
            this.$extend(param);
            // 
            this.render();
            // 
            this.autoRender = true;
        },

        _prerender: function() {
            var c = this.canvas;
            c.resize(this.width, this.height);
            c.clearColor(this.bgColor);

            c.save();

            // パラメータセット
            c.fillStyle   = this.fillStyle;
            c.strokeStyle = this.strokeStyle;
            c.lineWidth   = this.lineWidth;
            c.shadowBlur  = this.shadowBlur;
            c.shadowColor  = this.shadowColor;

            return this;
        },

        _postrender: function() {
            var c = this.canvas;
            c.restore();

            return this;
        },

        render: function() {
            this._prerender();

            this._render();

            this._postrender();
        },

        _render: function() {

        },

        /**
         * テキスト描画
         */
        renderText: function(param) {
            var c = this.canvas;
            param = {}.$extend(tm.display.Shape.DEFAULT_SHAPE_PARAM_TEXT, param);

            c.save();
            
            // パラメータセット
            c.fillStyle     = param.fillStyle;
            c.strokeStyle   = param.strokeStyle;
            c.lineWidth     = param.lineWidth;
            c.font          = param.font;
            c.textAlign     = param.textAlign;
            c.textBaseline  = param.textBaseline;

            // 描画
            c.strokeText(param.text, this.width/2, this.height/2);
            c.fillText(param.text, this.width/2, this.height/2);
            
            c.restore();
        },


        // TODO: old support(plan delete)
        _dirtyCheckParam: function(param) {
            var param = param;
            if (arguments.length >= 2) {
                var width = arguments[0];
                var height= arguments[1];
                var param = arguments[2] || {};
                param.width = width;
                param.height = height;

                console.warn("tmlib.js warn: arguments of shape init is only param from version 0.4");
            }

            return param;
        },
        
    });

    ["width", "height", "bgColor", "strokeStyle", "fillStyle", "lineWidth", "shadowBlur", "shadowColor"].each(function(prop) {
        var propName = '_' + prop;

        tm.display.Shape.prototype.accessor(prop, {
            "get": function()   {
                return this[propName];
            },
            "set": function(v)  {
                this[propName] = v;
                if (this.autoRender === true) {
                    this.render();
                }
            }
        });
    });

})();


(function() {
    
    /**
     * @class tm.display.CircleShape
     * @extends tm.display.Shape
     * 簡単に円を描画できるクラス
     * 
     *      @example display
     *      var shape = tm.display.CircleShape().addChildTo(this);
     *      shape.setPosition(50, 50);
     */
    tm.define("tm.display.CircleShape", {
        superClass: tm.display.Shape,
        
        /**
         * @constructor
         */
        init: function(param) {
            param = this._dirtyCheckParam.apply(this, arguments);
            this.superInit(param);

            this.render();
        },

        _render: function() {
            var c = this.canvas;
            // 描画
            var radius = Math.min(this.width, this.height)/2;
            c.fillCircle(this.width/2, this.height/2, radius);
            c.strokeCircle(this.width/2, this.height/2, radius-Number(c.lineWidth)/2);
        },
    });
    
})();




(function() {
    
    /**
     * @class tm.display.TriangleShape
     * 簡単に三角形を描画できるクラス
     * @extends tm.display.Shape
     */
    tm.define("tm.display.TriangleShape", {
        superClass: tm.display.Shape,
        
        /**
         * @constructor
         */
        init: function(param) {
            param = this._dirtyCheckParam.apply(this, arguments);
            param = {}.$safe(param, {
                fillStyle: "green",
            });
            this.superInit(param);

            this.render();
        },

        _render: function() {
            var c = this.canvas;

            // 描画
            var x = this.width/2;
            var y = this.height/2;
            var radius = Math.min(this.width, this.height)/2;
            var offsetLine = Number(c.lineWidth)*1;
            c.fillPolygon(x, y, radius, 3);
            c.strokePolygon(x, y, radius-offsetLine, 3);
        },
    });
    
})();




(function() {
    
    /**
     * @class tm.display.RectangleShape
     * 簡単に矩形を描画できるクラス
     * @extends tm.display.Shape
     */
    tm.define("tm.display.RectangleShape", {
        superClass: tm.display.Shape,
        
        /**
         * @constructor
         */
        init: function(param) {
            param = this._dirtyCheckParam.apply(this, arguments);
            param = {}.$safe(param, {
                fillStyle: "blue",
            });
            this.superInit(param);

            this.render();
        },

        _render: function() {
            var c = this.canvas;
            // 描画
            var lw = this.lineWidth;
            var lw_half = lw/2;
            c.fillRect(0, 0, this.width, this.height);
            c.strokeRect(lw_half, lw_half, this.width-lw, this.height-lw);
        },
    });
    
})();




(function() {
    
    /**
     * @class tm.display.RoundRectangleShape
     * 簡単に矩形を描画できるクラス
     * @extends tm.display.Shape
     */
    tm.define("tm.display.RoundRectangleShape", {
        superClass: tm.display.Shape,
        
        /**
         * @constructor
         */
        init: function(param) {
            param = this._dirtyCheckParam.apply(this, arguments);
            param = {}.$safe(param, {
                fillStyle: "blue",
                cornerRadius: 8,
            });
            this.superInit(param);

            this.render();
        },

        _render: function() {
            var c = this.canvas;
            // 描画
            var lw = this.lineWidth;
            var lw_half = lw/2;

            c.fillRoundRect(lw_half, lw_half, this.width-lw, this.height-lw, this.cornerRadius);
            c.strokeRoundRect(lw_half, lw_half, this.width-lw, this.height-lw, this.cornerRadius);
        },
    });

    ["cornerRadius"].each(function(prop) {
        var propName = '_' + prop;

        tm.display.RoundRectangleShape.prototype.accessor(prop, {
            "get": function()   {
                return this[propName];
            },
            "set": function(v)  {
                this[propName] = v;
                if (this.autoRender === true) { this.render(); }
            }
        });
    });

})();


(function() {
    
    /**
     * @class tm.display.StarShape
     * 簡単に星形を描画できるクラス
     * @extends tm.display.Shape
     */
    tm.define("tm.display.StarShape", {
        superClass: tm.display.Shape,
        
        /**
         * @constructor
         */
        init: function(param) {
            param = this._dirtyCheckParam.apply(this, arguments);
            param = {}.$safe(param, {
                fillStyle: "yellow",
                sides: 5,
                sideIndent: 0.38,
                offsetAngle: -90,
            });
            this.superInit(param);

            this.render();
        },

        _render: function() {
            var c = this.canvas;

            var sides       = this.sides;
            var sideIndent  = this.sideIndent;
            var offsetAngle = this.offsetAngle;
            
            // 描画
            var x = this.width/2;
            var y = this.height/2;
            var radius = Math.min(this.width, this.height)/2;
            var offsetLine = Number(c.lineWidth)*1.5;
            c.fillStar(x, y, radius, sides, sideIndent, offsetAngle);
            c.strokeStar(x, y, radius-offsetLine, sides, sideIndent, offsetAngle);
        },
    });

    ["sides", "sideIndent", "offsetAngle"].each(function(prop) {
        var propName = '_' + prop;

        tm.display.StarShape.prototype.accessor(prop, {
            "get": function()   {
                return this[propName];
            },
            "set": function(v)  {
                this[propName] = v;
                if (this.autoRender === true) {
                    this.render();
                }
            }
        });
    });
    
})();



(function() {
    
    /**
     * @class tm.display.PolygonShape
     * @extends tm.display.Shape
     * ポリゴン描画クラス
     */
    tm.define("tm.display.PolygonShape", {
        superClass: tm.display.Shape,
        
        /**
         * @constructor
         */
        init: function(param) {
            param = this._dirtyCheckParam.apply(this, arguments);
            param = {}.$safe(param, {
                fillStyle: "cyan",
                sides: 5,
                sideIndent: 0.38,
                offsetAngle: -90,
            });
            this.superInit(param);

            this.render();
        },

        _render: function() {
            var c = this.canvas;

            var sides       = this.sides;
            var offsetAngle = this.offsetAngle;
            
            // 描画
            var x = this.width/2;
            var y = this.height/2;
            var radius = Math.min(this.width, this.height)/2;
            var offsetLine = Number(c.lineWidth)*0.6;
            c.fillPolygon(x, y, radius, sides, offsetAngle);
            c.strokePolygon(x, y, radius-offsetLine, sides, offsetAngle);
        },
    });

    ["sides", "offsetAngle"].each(function(prop) {
        var propName = '_' + prop;

        tm.display.PolygonShape.prototype.accessor(prop, {
            "get": function()   {
                return this[propName];
            },
            "set": function(v)  {
                this[propName] = v;
                if (this.autoRender === true) {
                    this.render();
                }
            }
        });
    });
    
})();




(function() {
    
    /**
     * @class tm.display.HeartShape
     * 簡単にハートを描画できるクラス
     * @extends tm.display.Shape
     */
    tm.define("tm.display.HeartShape", {
        superClass: tm.display.Shape,
        
        /**
         * @constructor
         */
        init: function(param) {
            param = this._dirtyCheckParam.apply(this, arguments);
            param = {}.$safe(param, {
                fillStyle: "pink",
                cornerAngle: 45,
            });
            this.superInit(param);

            this.render();
        },

        _render: function() {
            var c = this.canvas;
            // 描画
            var x = this.width/2;
            var y = this.height/2;
            var radius = Math.min(this.width, this.height)/2;
            c.fillHeart(x, y, radius, this.cornerAngle);
            c.strokeHeart(x, y, radius-Number(c.lineWidth)/2, this.cornerAngle);
        },
    });

    ["cornerAngle"].each(function(prop) {
        var propName = '_' + prop;

        tm.display.HeartShape.prototype.accessor(prop, {
            "get": function()   {
                return this[propName];
            },
            "set": function(v)  {
                this[propName] = v;
                if (this.autoRender === true) { this.render(); }
            }
        });
    });

})();




(function() {

    var dummyCanvas = null;
    
    /**
     * @class tm.display.TextShape
     * @extends tm.display.Shape
     * テキスト描画クラス
     */
    tm.define("tm.display.TextShape", {

        superClass: "tm.display.Shape",
        
        /**
         * @constructor
         */
        init: function(width, height, param) {
            param = this._dirtyCheckParam.apply(this, arguments);
            param = {}.$safe(param, {
                fillStyle: "black",
                lineWidth: 4,
                text: "hello, world!",
                fontSize: 64,
                fontWeight: "",
                fontFamily: "'HiraKakuProN-W3'",
            });
            this.superInit(param);

            this.fit();

            this.render();
        },

        fit: function() {
            if (!dummyCanvas) {
                dummyCanvas = tm.graphics.Canvas();
            }
            dummyCanvas.font = "{fontWeight} {fontSize}px {fontFamily}".format(this);
            var textWidth = dummyCanvas.context.measureText(this.text).width + (10);
            var textHeight = dummyCanvas.context.measureText('あ').width*1.5;
            this.width = textWidth;
            this.height = textHeight;
        },

        _render: function() {
            var c = this.canvas;

            c.fillStyle = this.fillStyle;
            c.strokeStyle = this.strokeStyle;
            c.font = "{fontWeight} {fontSize}px {fontFamily}".format(this);
            c.textAlign = "center";
            c.textBaseline = "middle";

            var textWidth = c.context.measureText(this.text).width;

            var hw = this.width/2;
            var hh = this.height/2
            c.strokeText(this.text, hw, hh);
            c.fillText(this.text, hw, hh);
        },

    });

    ['text', "fontWeight", "fontSize", "fontFamily"].each(function(prop) {
        var propName = '_' + prop;

        tm.display.TextShape.prototype.accessor(prop, {
            "get": function()   {
                return this[propName];
            },
            "set": function(v)  {
                this[propName] = v;
                if (this.autoRender === true) { this.render(); }
            }
        });
    });

    
})();



















/*
 * label.js
 */

tm.display = tm.display || {};


(function() {
    
    var dummyCanvas  = null;
    var dummyContext = null;

    /**
     * @class tm.display.Label
     * システムフォントを描画するクラス
     * @extends tm.display.CanvasElement
     */
    tm.display.Label = tm.createClass({
        
        superClass: tm.display.CanvasElement,
        
        /** 塗りつぶしフラグ */
        fill: true,
        /** ストロークフラグ */
        stroke: false,
        /** デバッグボックス */
        debugBox: false,

        /** @property _fontSize @private */
        /** @property _fontFamily @private */
        /** @property _fontWeight @private */
        /** @property _lineHeight @private */
        /** @property align */
        /** @property baseline */
        /** @property maxWidth */

        /**
         * @constructor
         */
        init: function(text, size) {
            this.superInit();
            
            this.text       = text || "";
            
            this._fontSize   = size || 24;
            this._fontFamily = tm.display.Label["default"].fontFamily;
            this._fontWeight = "";
            this._lineHeight = 1.2;
            this._updateFont();
            
            this.align = tm.display.Label["default"].align;
            this.baseline = tm.display.Label["default"].baseline;

            this.maxWidth   = null;
        },
        
        /**
         * アラインをセット
         */
        setAlign: function(align) {
            this.align = align;
            return this;
        },
        
        /**
         * ベースラインをセット
         */
        setBaseline: function(baseline) {
            this.baseline = baseline;
            return this;
        },
        
        /**
         * フォントサイズをセット
         */
        setFontSize: function(size) {
            this.fontSize = size;
            return this;
        },
        
        /**
         * フォントファミリーをセット
         */
        setFontFamily: function(family) {
            this.fontFamily= family;
            return this;
        },

        /**
         * フォントウェイトをセット
         */
        setFontWeight: function(weight) {
            this.fontWeight= weight;
            return this;
        },

        /**
         * @private
         */
        _updateFont: function() {
            this.fontStyle = "{fontWeight} {fontSize}px {fontFamily}".format(this);
            if (!dummyCanvas) {
                dummyCanvas = document.createElement("canvas");
                dummyContext = dummyCanvas.getContext('2d');
            }
            dummyContext.font = this.fontStyle;
            this.textSize = dummyContext.measureText('あ').width * this.lineHeight;
        },

        /**
         * @private
         */
        _updateLines: function() {
            this._lines = (this._text+'').split('\n');
        },
        
    });
    
    /**
     * @property    text
     * 文字
     */
    tm.display.Label.prototype.accessor("text", {
        "get": function() { return this._text; },
        "set": function(v){
            if (v == null || v == undefined) {
                this._text = "";
            }
            else {
                this._text = v;
            }
            this._updateLines();
        }
    });
    
    /**
     * @property    fontSize
     * フォントサイズ
     */
    tm.display.Label.prototype.accessor("fontSize", {
        "get": function() { return this._fontSize; },
        "set": function(v){ this._fontSize = v; this._updateFont(); }
    });
    
    /**
     * @property    fontFamily
     * フォント
     */
    tm.display.Label.prototype.accessor("fontFamily", {
        "get": function() { return this._fontFamily; },
        "set": function(v){ this._fontFamily = v; this._updateFont(); }
    });
    
    /**
     * @property    fontWeight
     */
    tm.display.Label.prototype.accessor("fontWeight", {
        "get": function() { return this._fontWeight; },
        "set": function(v) {
            this._fontWeight = v; this._updateFont();
        },
    });
    
    /**
     * @property lineHeight
     */
    tm.display.Label.prototype.accessor("lineHeight", {
        "get": function() { return this._lineHeight; },
        "set": function(v) {
            this._lineHeight = v; this._updateFont();
        },
    });
    
    tm.display.Label["default"] = {
        align: "center",
        baseline: "middle",
        fontFamily: "'HiraKakuProN-W3'", // Hiragino or Helvetica
        // align: "start",
        // baseline: "alphabetic",
    };

    
})();


/*
 * animationsprite.js
 */


tm.display = tm.display || {};


(function() {

    /**
     * @class tm.display.AnimationSprite
     * スプライトアニメーションクラス
     * @extends tm.display.CanvasElement
     */
    tm.display.AnimationSprite = tm.createClass({
        superClass: tm.display.CanvasElement,

        /** @property ss                 sprite sheet */
        /** @property width              width */
        /** @property height             height */
        /** @property currentFrame       現在のフレーム */
        /** @property currentFrameIndex  現在のフレームインデックス */
        /** @property paused             ポーズ */
        /** @property currentAnimation   現在のアニメーション */

        /**
         * @constructor
         */
        init: function(ss, width, height) {
            this.superInit();

            if (typeof ss == "string") {
                var ss = tm.asset.Manager.get(ss);
                console.assert(ss, "not found " + ss);
            }

            console.assert(typeof ss == "object", "AnimationSprite の第一引数はスプライトシートもしくはスプライトシート名に変わりました");

            this.ss = ss;

            this.width  = width || ss.frame.width;
            this.height = height|| ss.frame.height;

            this.currentFrame = 0;
            this.currentFrameIndex = 0;
            this.paused = true;

            this.currentAnimation = null;

            this.addEventListener("enterframe", function(e) {
                if (!this.paused && e.app.frame%this.currentAnimation.frequency === 0) {
                    this._updateFrame();
                }
            });
        },

        /**
         * 描画
         */
        draw: function(canvas) {
            var srcRect = this.ss.getFrame(this.currentFrame);
            var element = this.ss.image.element;

            canvas.drawImage(element,
                srcRect.x, srcRect.y, srcRect.width, srcRect.height,
                -this.width*this.originX, -this.height*this.originY, this.width, this.height);
        },

        /**
         * 再生
         */
        gotoAndPlay: function(name) {
            name = (name !== undefined) ? name : "default";

            this.paused = false;
            this.currentAnimation = this.ss.animations[name];
            this.currentFrame = 0;
            this.currentFrameIndex = 0;
            this._normalizeFrame();

            return this;
        },

        /**
         * ストップ
         */
        gotoAndStop: function(name) {
            name = (name !== undefined) ? name : "default";

            this.paused = true;
            this.currentAnimation = this.ss.animations[name];
            this.currentFrame = 0;
            this.currentFrameIndex = 0;
            this._normalizeFrame();

            return this;
        },

        /**
         * フレーム数のカウントアップ
         * @private
         */
        _updateFrame: function() {
            this.currentFrameIndex += 1;
            this._normalizeFrame();
        },

        /**
         * @private
         */
        _normalizeFrame: function() {
            var anim = this.currentAnimation;
            if (anim) {
                if (this.currentFrameIndex < anim.frames.length) {
                    this.currentFrame = anim.frames[this.currentFrameIndex];
                }
                else {
                    if (anim.next) {
                        this.gotoAndPlay(anim.next);
                    }
                    else {
                        this.currentFrameIndex = anim.frames.length - 1;
                        this.currentFrame = anim.frames[this.currentFrameIndex];
                        this.paused = true;
                    }
                    // dispatch animationend
                    var e = tm.event.Event("animationend");
                    this.dispatchEvent(e);
                }
            }
        },

    });

})();


/*
 * mapsprite.js
 */


(function() {

    /**
     * @class tm.display.MapSprite
     * マップ描画クラス
     * @extends tm.display.CanvasElement
     */
    tm.define("tm.display.MapSprite", {
        superClass: "tm.display.CanvasElement",

        /** @property mapSheet */
        /** @property chipWidth */
        /** @property chipHeight */
        /** @property originX */
        /** @property originY */
        /** @property width */
        /** @property height */
        /** @property tileset */

        /**
         * @constructor
         */
        init: function(mapSheet, chipWidth, chipHeight) {
            this.superInit();

            if (typeof mapSheet == "string") {
                this.mapSheet = tm.asset.Manager.get(mapSheet);
            }
            else {
                this.mapSheet = mapSheet;
            }

            this.chipWidth  = chipWidth  || 32;
            this.chipHeight = chipHeight || 32;

            this.originX = this.originY = 0;

            this.width = chipWidth*this.mapSheet.width;
            this.height= chipWidth*this.mapSheet.height;

            this.tileset = [];
            this.tilesetInfo = {};
            this._build();
        },

        /**
         * @private
         */
        _build: function() {
            var self = this;

            this.mapSheet.tilesets.each(function(tileset, index) {
                self._buildTileset(tileset, index);
            });

            this.mapSheet.layers.each(function(layer, hoge) {
                if (layer.type == "objectgroup") {
                    self._buildObject(layer);
                }
                else if (layer.type == "imagelayer") {
                    self._buildImageLayer(layer);
                }
                else {
                    self._buildLayer(layer);
                }
            });
        },

        /**
         * @private
         */
        _buildTileset: function(tileset, index) {
            var self      = this;
            var mapSheet  = this.mapSheet;
            var texture   = tm.asset.Manager.get(tileset.image);
            var xIndexMax = (texture.width / mapSheet.tilewidth)|0;
            var yIndexMax = (texture.height / mapSheet.tileheight)|0;

            var info = {
                begin: self.tileset.length,
                end: self.tileset.length + xIndexMax * yIndexMax
            };

            self.tilesetInfo[index] = info;

            if (tileset.name !== undefined) {
                self.tilesetInfo[tileset.name] = info;
            }

            yIndexMax.times(function(my) {
                xIndexMax.times(function(mx) {
                    var rect = tm.geom.Rect(
                        mx * mapSheet.tilewidth,
                        my * mapSheet.tileheight,
                        mapSheet.tilewidth,
                        mapSheet.tileheight
                        );
                    self.tileset.push({
                        image: tileset.image,
                        rect: rect
                    });
                });
            });
        },

        /**
         * @private
         */
        _buildLayer: function(layer) {
            var self     = this;
            var mapSheet = this.mapSheet;
            var shape    = tm.display.Shape({
                width: this.width,
                height: this.height
            }).addChildTo(this);
            var visible  = (layer.visible === 1) || (layer.visible === undefined);
            var opacity  = layer.opacity === undefined ? 1 : layer.opacity;
            var tileset  = [];
            shape.origin.set(0, 0);

            if (layer.tilesets !== undefined) {
                var tilesets = null;
                if (Array.isArray(layer.tilesets)) {
                    tilesets = layer.tilesets;
                } else {
                    tilesets = [layer.tilesets];
                }
                tilesets.each(function(n) {
                    var info = self.tilesetInfo[n];
                    tileset = tileset.concat(self.tileset.slice(info.begin, info.end));
                });
            } else {
                tileset = self.tileset;
            }

            if (visible) {
                layer.data.each(function(d, index) {
                    var type = d;
                    if (type == -1) {
                        return ;
                    }
                    type = Math.abs(type);
                    if (tileset[type] === undefined) {
                        return ;
                    }

                    var xIndex = index%mapSheet.width;
                    var yIndex = (index/mapSheet.width)|0;
                    var dx = xIndex*self.chipWidth;
                    var dy = yIndex*self.chipHeight;

                    var tile = tileset[type];

                    var texture = tm.asset.Manager.get(tile.image);
                    var rect = tile.rect;

                    shape.canvas.globalAlpha = opacity;
                    shape.canvas.drawTexture(texture,
                        rect.x, rect.y, rect.width, rect.height,
                        dx, dy, self.chipWidth, self.chipHeight
                        );
                }.bind(this));
            }

        },

        /**
         * @private
         */
        _buildObject: function(layer) {
            var self = this;

            var group = tm.display.CanvasElement().addChildTo(self);
            group.width = self.width;
            group.height = self.height;

            layer.objects.forEach(function(obj) {
                var _class = tm.using(obj.type);
                if (Object.keys(_class).length === 0) {
                    _class=tm.display[obj.type];
                }

                var initParam = null;
                if (obj.properties.init) {
                    initParam = JSON.parse(obj.properties.init);
                }
                var element = _class.apply(null, initParam).addChildTo(group);
                var props   = obj.properties;
                for (var key in props) {
                    if (key == "init") continue ;
                    var value = props[key];
                    element[key] = value;
                }

                element.x = obj.x;
                element.y = obj.y;
                element.width = obj.width;
                element.height = obj.height;

                group[obj.name] = element;
            });

            self[layer.name] = group;

        },

        /**
         * @private
         */
        _buildImageLayer: function(layer) {
            var sprite = tm.display.Sprite(layer.image.source).setOrigin(0, 0).addChildTo(this);
            sprite.x = layer.x;
            sprite.y = layer.y;
            sprite.alpha = layer.alpha;
            sprite.visible = layer.visible;

            this[layer.name] = sprite;
        }

    });

})();




/*
 * renderer.js
 */

 
(function() {
    
    /**
     * @class tm.display.CanvasRenderer
     * キャンバス描画クラス
     */
    tm.define("tm.display.CanvasRenderer", {
        /** キャンバス */
        canvas: null,

        /** @property @private _context     コンテキスト */

        /**
         * @constructor
         * コンストラクタ
         */
        init: function(canvas) {
            this.canvas = canvas;
            this._context = this.canvas.context;
        },

        /**
         * 描画
         */
        render: function(root) {
            this.canvas.save();
            this.renderObject(root);
            this.canvas.restore();
        },

        /**
         * オブジェクトを描画
         */
        renderObject: function(obj) {
            if (obj.visible === false) return ;
            var context = this._context;

            // TODO: 別の場所で呼ぶよう調整する
            obj._dirtyCalc && obj._dirtyCalc();

            // 描画可能かをチェック
            if (!this._checkRenderable(obj)) {
                // 子供達のみ描画実行
                if (obj.children.length > 0) {
                    var tempChildren = obj.children.slice();
                    for (var i=0,len=tempChildren.length; i<len; ++i) {
                        this.renderObject(tempChildren[i]);
                    }
                }

                return ;
            }

            // 
            if (!obj.draw) {
                this._setRenderFunction(obj);
            }

            // 情報をセット
            if (obj.fillStyle)   context.fillStyle   = obj.fillStyle;
            if (obj.strokeStyle) context.strokeStyle = obj.strokeStyle;
            context.globalAlpha    = obj._worldAlpha;
            context.globalCompositeOperation = obj.blendMode;
            
            if (obj.shadowBlur) {
                context.shadowColor   = obj.shadowColor;
                context.shadowOffsetX = obj.shadowOffsetX;
                context.shadowOffsetY = obj.shadowOffsetY;
                context.shadowBlur    = obj.shadowBlur;
            }
            else {
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
                context.shadowColor   = "rgba(0, 0, 0, 0)";
            }
            
            // 行列をセット
            var m = obj._worldMatrix.m;
            context.setTransform( m[0], m[3], m[1], m[4], m[2], m[5] );
            

            if (obj.clipping) {
                context.save();

                // クリップ処理を実行
                if (obj.clip) {
                    obj.clip();
                }
                else {
                    onclip.call(obj, this.canvas);
                }
                context.clip();

                obj.draw(this.canvas);
                
                // 子供達も実行
                if (obj.children.length > 0) {
                    var tempChildren = obj.children.slice();
                    for (var i=0,len=tempChildren.length; i<len; ++i) {
                        this.renderObject(tempChildren[i]);
                    }
                }

                context.restore();
            }
            else {
                obj.draw(this.canvas);
                
                // 子供達も実行
                if (obj.children.length > 0) {
                    var tempChildren = obj.children.slice();
                    for (var i=0,len=tempChildren.length; i<len; ++i) {
                        this.renderObject(tempChildren[i]);
                    }
                }
            }
        },

        /**
         * @private
         */
        _checkRenderable: function(obj) {
            if (obj._renderable === undefined) {
                obj._renderable = (obj instanceof tm.display.CanvasElement);
            }
            return obj._renderable;
        },

        /**
         * @private
         */
        _setRenderFunction: function(obj) {
            if (obj instanceof tm.display.Sprite) {
                obj.draw = renderFuncList["sprite"];
            }
            else if (obj instanceof tm.display.MapSprite) {
                obj.draw = function() {};
            }
            else if (obj instanceof tm.display.Label) {
                obj.draw = renderFuncList["label"];
            }
            else if (obj instanceof tm.display.Shape) {
                obj.draw = renderFuncList["shape"];
            }
            else {
                obj.draw = function() {};
            }
        }

    });
    
    var renderFuncList = {
        "sprite": function(canvas) {
            var srcRect = this.srcRect;
            var element = this._image.element;
            
            canvas.context.drawImage(element,
                srcRect.x, srcRect.y, srcRect.width, srcRect.height,
                -this.width*this.origin.x, -this.height*this.origin.y, this.width, this.height);
        },
        "shape": function(canvas) {
            var srcRect = this.srcRect;
            canvas.drawImage(
                this.canvas.canvas,
                0, 0, this.canvas.width, this.canvas.height,
                -this.width*this.origin.x, -this.height*this.origin.y, this.width, this.height);
        },
        "label": function(canvas) {
            canvas.setText(this.fontStyle, this.align, this.baseline);
            if (this.lineWidth) canvas.lineWidth = this.lineWidth;
            
            if (this.stroke) {
                if (this.maxWidth) {
                    this._lines.each(function(elm, i) {
                        canvas.strokeText(elm, 0, this.textSize*i, this.maxWidth);
                    }.bind(this));
                }
                else {
                    this._lines.each(function(elm, i) {
                        canvas.strokeText(elm, 0, this.textSize*i);
                    }.bind(this));
                }
            }
            if (this.fill) {
                if (this.maxWidth) {
                    this._lines.each(function(elm, i) {
                        canvas.fillText(elm, 0, this.textSize*i, this.maxWidth);
                    }.bind(this));
                }
                else {
                    this._lines.each(function(elm, i) {
                        canvas.fillText(elm, 0, this.textSize*i);
                    }.bind(this));
                }
            }
            
            if (this.debugBox) {
                canvas.strokeRect(0, 0, this.width, -this.size);
            }
        }
    };

    var onclip = function(c) {
        c.beginPath();
        c.rect(
            -this.width*this.origin.x,
            -this.height*this.origin.y,
            this.width,
            this.height
            );
    };

})();
 


 
(function() {
    
    /**
     * @class tm.display.BoundingRectRenderer
     * バウンディング表示レンダー
     * @extends tm.display.CanvasRenderer
     */
    tm.define("tm.display.BoundingRectRenderer", {
        superClass: "tm.display.CanvasRenderer",

        /**
         * @constructor
         * コンストラクタ
         */
        init: function(canvas) {
            this.superInit(canvas);
        },

        /**
         * @private
         */
        _setRenderFunction: function(obj) {
            obj.draw = render;
        }
    });

    var render = function(canvas) {
        canvas.save();
        canvas.lineWidth = 2;
        canvas.strokeRect(-this.width*this.originX, -this.height*this.originY, this.width, this.height);
        canvas.restore();
    };

})();
 












/*
 * userinterface.js
 */

tm.ui = tm.ui || {};



(function() {
    
    /**
     * @class tm.ui.Pad
     * padクラス
     * @extends tm.display.Shape
     */
    tm.ui.Pad = tm.createClass({
        superClass: tm.display.Shape,
        
        isTouching: false,
        circle: null,

        /**
         * @constructor
         */
        init: function() {
            this.superInit(120, 120);
            
            var c = this.canvas;
            c.fillStyle = "#fff";
            c.fillCircle(60, 60, 60);
            c.fillStyle = "#eee";
            
            this._createCircle();
            
            this.setInteractive(true);
            
            this.alpha = 0.75;
        },

        /**
         * @private
         */
        _createCircle: function() {
            var circle = this.circle = tm.display.Shape(80, 80);
            this.addChild(circle);
            
            var c = circle.canvas;
            c.fillStyle = "#222";
            c.setShadow("black", 2, 2, 2);
            c.fillCircle(40, 40, 35);
        },

        onpointingstart: function() {
            this.isTouching = true;
        },

        onpointingend: function() {
            this.isTouching = false;
            this.circle.position.set(0, 0);
        },

        onpointingmove: function(e) {
            if (this.isTouching==false) return ;
            var p = e.pointing;
            var v = tm.geom.Vector2(p.x - this.x, p.y - this.y);
            var len = v.length();
            v.div(len);
            if (len > 40) len = 40;
            
            this.angle = Math.radToDeg(v.toAngle());
            this.circle.position.set(v.x*len, v.y*len);
            
            // 大きさ
            this.distance  = len/40.0;
            // 向きベクトル
            this.direction = v.mul(this.distance);
        }
        
        
    });
    
})();




/*
 * button.js
 */

tm.ui = tm.ui || {};


;(function() {

    tm.define("tm.ui.BaseButton", {
        superClass: "tm.display.CanvasElement",

        init: function(param) {
            this.superInit();

            param = param || {};
            this.width = param.width || 64;
            this.height = param.height || 64;

            this.setInteractive(true);
            this.boundingType = "rect";

            this.on("pointingend", function() {
                this.flare('push');
            });
        },
    });

})();


;(function() {

    tm.define("tm.ui.SpriteButton", {
        superClass: "tm.ui.BaseButton",

        init: function(image) {
            this.superInit();

            this.sprite = tm.display.Sprite(image).addChildTo(this);

            this.width = this.sprite.width;
            this.height = this.sprite.height;
        },
    });

})();


;(function() {
    
    /**
     * @class tm.ui.LabelButton
     * LabelButton
     * @extends tm.display.Label
     */
    tm.ui.LabelButton = tm.createClass({
        superClass: tm.display.Label,

        /**
         * @constructor
         */
        init: function(text) {
            this.superInit(text);
            
            this.alpha = tm.ui.LabelButton.DEFAULT_ALPHA;
            this.setAlign("center").setBaseline("middle");
            
            this.setInteractive(true);
            this.boundingType = "rect";
            
            this.addEventListener("pointingover", function() {
                this.tweener.clear();
                this.tweener.fadeIn(250);
            }.bind(this));
            this.addEventListener("pointingout", function() {
                this.tweener.clear();
                this.tweener.fade(tm.ui.LabelButton.DEFAULT_ALPHA, 250);
            }.bind(this));
            
            /*
            var d = this.draw;
            this.draw = function(canvas) {
                d.call(this, canvas);
                this.drawBoundingRect(canvas);
            }
            /*
            */
        }
    });
    
    /**
     * @static
     * @property
     * デフォルトとなるアルファ値
     */
    tm.ui.LabelButton.DEFAULT_ALPHA = 0.5;
    
})();


(function() {
    
    /**
     * @class tm.ui.IconButton
     * IconButton
     * @extends tm.display.Sprite
     */
    tm.ui.IconButton = tm.createClass({
        superClass: tm.display.Sprite,
        
        /**
         * @constructor
         */
        init: function() {
            this.superInit.call(this, arguments);
            
            this.setInteractive(true);
            this.boundingType = "rect";

            this.on("pointingend", function() {
                this.flare('push');
            });
        },
    });
    
    /**
     * @static
     * @property
     * デフォルトとなるアルファ値
     */
    tm.ui.IconButton.DEFAULT_ALPHA = 0.5;
    
})();


(function() {
    
    /**
     * @class tm.ui.GlossyButton
     * glossy button
     * @extends tm.display.Shape
     */
    tm.ui.GlossyButton = tm.createClass({
        superClass: tm.display.Shape,

        /**
         * @constructor
         */
        init: function(width, height, backgroundColor, text) {
            this.superInit(width, height);
            
            text  = text  || "Button";
            this.backgroundColor = backgroundColor || "black";
            this.alpha = tm.ui.GlossyButton.DEFAULT_ALPHA;
            
            this.setInteractive(true);
            this.boundingType = "rect";
            this.addEventListener("pointingover", function() {
                this.tweener.clear();
                this.tweener.fade(1.0, 250);
            });
            this.addEventListener("pointingout", function() {
                this.tweener.clear();
                this.tweener.fade(tm.ui.GlossyButton.DEFAULT_ALPHA, 250);
            });
            
            // ラベル
            this.label = tm.display.Label(text || "").addChildTo(this);
            this.label.setAlign("center").setBaseline("middle");
            
            this._refresh();
        },

        /**
         * 背景色をセット
         */
        setBackgroundColor: function(backgroundColor) {
            this.backgroundColor = backgroundColor;
            
            this._refresh();
            
            return this;
        },

        /**
         * リフレッシュ
         * @private
         */
        _refresh: function() {
            // ボタン描画
            var c = this.canvas;
            c.resize(this.width, this.height);
            c.fillStyle = this.backgroundColor;
            c.fillRoundRect(2, 2, this.width-4, this.height-4, 10);
            c.strokeStyle   = "rgba(100,100,100,0.75)";
            c.lineWidth     = 2;
            c.strokeRoundRect(2, 2, this.width-4, this.height-4, 10);
            
            // テカリ
            c.roundRect(2, 2, this.width-4, this.height-4, 10);
            c.clip();
            
            var grad = tm.graphics.LinearGradient(0, 0, 0, this.height);
            
            // grad.addColorStop(0.0, "hsl(  0, 75%, 50%)");
            // grad.addColorStop(0.5, "hsl(120, 75%, 50%)");
            // grad.addColorStop(1.0, "hsl(240, 75%, 50%)");
            grad.addColorStop(0.0, "rgba(255,255,255,0.9)");
            grad.addColorStop(0.5, "rgba(255,255,255,0.5)");
            grad.addColorStop(0.51, "rgba(255,255,255,0.2)");
            grad.addColorStop(1.0, "rgba(255,255,255,0.0)");
            c.setGradient(grad);
            c.fillRect(2, 2, this.width-4, this.height-4, 10);
            
            // ラベルのサイズをリセット
            this.label.setSize(this.width, this.height);
        },
    });

    /**
     * @static
     * @property
     * デフォルトとなるアルファ値
     */
    tm.ui.GlossyButton.DEFAULT_ALPHA = 0.5;
    
    
})();


(function() {

    /**
     * @class tm.ui.FlatButton
     * フラットデザインのボタン
     * @extends tm.display.Shape
     */
    tm.define("tm.ui.FlatButton", {
        superClass: "tm.ui.BaseButton",

        /**
         * @constructor
         */
        init: function(param) {
            param = (param || {}).$safe(tm.ui.FlatButton.defaults);

            this.superInit(param);

            this.shape = tm.display.RoundRectangleShape(param).addChildTo(this);

            this.label = tm.display.Label(param.text).addChildTo(this);
            this.label.setFontSize(param.fontSize).setFontFamily(param.fontFamily).setAlign("center").setBaseline("middle");
        },
    });

    tm.ui.FlatButton.defaults = {
        width: 300,
        height: 100,
        fillStyle: "hsl(180, 60%, 50%)",
        strokeStyle: "transparent",
        text: "START",
        fontSize: 50,
        cornerRadius: 8,
        fontFamily: "'ヒラギノ角ゴ Pro W3', 'Hiragino Kaku Gothic Pro', 'メイリオ', 'Meiryo', 'ＭＳ Ｐゴシック', 'MS PGothic', sans-serif",
    };

})();




/*
 * menudialog.js
 */

(function() {
    
    /**
     * @class tm.ui.MenuDialog
     * メニューダイアログ
     * @extends tm.app.Scene
     */
    tm.define("tm.ui.MenuDialog", {
        superClass: tm.app.Scene,

        /** @type {string} タイトル */
        titleText: null,
        /** @type {Array.<string>} メニュー名リスト */
        menu: null,
        /** @type {Array.<string>} メニュー詳細リスト */
        descriptions: null,
        /** @type {boolean} exit の表示/非表示 */
        showExit: false,

        /** @type {tm.display.Label} dummy */
        title: null,
        /** @type {Array.<tm.ui.LabelButton>} dummy */
        selections: [],
        /** @type {tm.display.Label} dummy */
        description: null,
        /** @type {tm.display.RectangleShape} dummy */
        box: null,
        /** @type {tm.display.RectangleShape} dummy */
        cursor: null,

        /** @private */
        _selected: 0,
        /** @private */
        _opened: false,
        /** @private */
        _finished: false,

        /** @private */
        _screenWidth: 0,
        /** @private */
        _screenHeight: 0,

        /**
         * @constructor
         * @param {Object} params
         */
        init: function(params) {
            this.superInit();

            this._screenWidth = params.screenWidth;
            this._screenHeight = params.screenHeight;

            this.titleText = params.title;
            this.menu = [].concat(params.menu);
            this._selected = ~~params.defaultSelected;
            this.showExit = !!params.showExit;
            if (params.menuDesctiptions) {
                this.descriptions = params.menuDesctiptions;
            } else {
                this.descriptions = [].concat(params.menu);
            }

            if (this.showExit) {
                this.menu.push("exit");
                this.descriptions.push("前の画面へ戻ります");
            }

            var height = Math.max((1+this.menu.length)*50, 50) + 40;
            this.box = tm.display.RectangleShape(this._screenWidth * 0.8, height, {
                strokeStyle: "rgba(0,0,0,0)",
                fillStyle: "rgba(43,156,255, 0.8)",
            }).setPosition(this._screenWidth*0.5, this._screenHeight*0.5);
            this.box.width = 1;
            this.box.height = 1;
            this.box.setBoundingType("rect");
            this.box.tweener
                .to({ width: this._screenWidth*0.8, height: height }, 200, "easeOutExpo")
                .call(this._onOpen.bind(this));
            this.box.addChildTo(this);

            this.description = tm.display.Label("", 14)
                .setAlign("center")
                .setBaseline("middle")
                .setPosition(this._screenWidth*0.5, this._screenHeight-10)
                .addChildTo(this);
        },

        /**
         * @private
         */
        _onOpen: function() {
            var self = this;
            var y = this._screenHeight*0.5 - this.menu.length * 25;

            this.title = tm.display.Label(this.titleText, 30)
                .setAlign("center")
                .setBaseline("middle")
                .setPosition(this._screenWidth*0.5, y)
                .addChildTo(this);

            this.cursor = this._createCursor();

            this.selections = this.menu.map(function(text, i) {
                var self = this;
                y += 50;
                var selection = tm.ui.LabelButton(text)
                    .setPosition(this._screenWidth*0.5, y)
                    .addChildTo(this);
                selection.interactive = true;
                selection.addEventListener("click", function() {
                    if (self._selected === i) {
                        self.closeDialog(self._selected);
                    } else {
                        self._selected = i;
                        var e = tm.event.Event("menuselect");
                        e.selectValue = self.menu[self._selected];
                        e.selectIndex = i;
                        self.dispatchEvent(e);
                    }
                });
                selection.width = this._screenWidth * 0.7;
                return selection;
            }.bind(this));

            this.cursor.y = this.selections[this._selected].y;

            this._opened = true;

            // close window when touch bg outside
            this.addEventListener("pointingend", function(e) {
                var p = e.app.pointing;
                if (!self.box.isHitPoint(p.x, p.y)) {
                    self.closeDialog(self._selected);
                }
            });

            // dispatch opened event
            var e = tm.event.Event("menuopened");
            this.dispatchEvent(e);
        },

        /**
         * @private
         */
        _createCursor: function() {
            var cursor = tm.display.RectangleShape(this._screenWidth*0.7, 30, {
                strokeStyle: "rgba(0,0,0,0)",
                fillStyle: "rgba(12,79,138,1)"
            }).addChildTo(this);
            cursor.x = this._screenWidth*0.5;
            cursor.target = this._selected;
            
            cursor.update = function() {
                if (this.target !== this.parent._selected) {
                    this.target = this.parent._selected;
                    this.tweener.clear();
                    this.tweener.to({
                        y: this.parent.selections[this.parent._selected].y
                    }, 200, "easeOutExpo");
                }
            };

            return cursor;
        },

        /**
         * 更新
         */
        update: function(app) {
            this.description.text = this.descriptions[this._selected];
        },

        /**
         * 閉じる
         */
        closeDialog: function(result) {
            this._finished = true;

            var e = tm.event.Event("menuselected");
            e.selectIndex = result;
            this.dispatchEvent(e);

            this.tweener
                .clear()
                .wait(200)
                .call(function() {
                    this.cursor.remove();
                    this.title.remove();
                    this.selections.each(function(sel) {
                        sel.remove();
                    });
                    this.box.tweener.clear();
                    this.box.tweener
                        .to({ width: 1, height: 1 }, 200, "easeInExpo")
                        .call(function() {
                            this.app.popScene();
                            var e = tm.event.Event("menuclosed");
                            e.selectIndex = result;
                            this.dispatchEvent(e);
                        }.bind(this));
                }.bind(this));
            this.cursor.tweener
                .clear()
                .call(function() {
                    this.visible = !this.visible;
                }.bind(this.cursor))
                .setLoop(true);
        },

        /**
         * 描画
         */
        draw: function(canvas) {
            canvas.fillStyle = "rgba(0,0,0,0.8)";
            canvas.fillRect(0,0,this._screenWidth,this._screenHeight);
        },

    });

})();

/*
 * sketch.js
 */

;(function() {
    
    var DEFAULT_PARAM = {
        bgColor: "rgba(255, 255, 255, 1.0)",
        penColor: "rgba(0, 0, 0, 1.0)",
        lineWidth: 16,
    };
    
    /**
     * @class tm.ui.Sketch
     * Sketch
     * @extends tm.display.Shape
     */
    tm.define("tm.ui.Sketch", {
        superClass: "tm.display.Shape",
        
        /**
         * @constructor
         */
        init: function(param) {
            param = this._dirtyCheckParam.apply(this, arguments);
            param.$safe(DEFAULT_PARAM);
            this.superInit(param);
            
            this.autoRender = false;
            
            this._setup(param);
        },
        
        _setup: function(param) {
            var self = this;
            
            // setup this
            this.boundingType = "rect";
            this.setInteractive(true);
            
            // setup canvas
            var c = this.canvas.context;
            c.lineCap  = "round";
            c.lineJoin = "round";
            c.miterLimit = 10.0;
            this.bgColor = param.bgColor;
            this.penColor = param.penColor;
            this.lineWidth = param.lineWidth;
            
            // setup event
            this.on("pointingstart", function(e) {
                var p = e.app.pointing;
                
                self._drawPoint(p.position);
            });
            this.on("pointingmove", function(e) {
                var p = e.app.pointing;
                self._drawLine(p.prevPosition, p.position);
                self.points.push({
                    x: p.x-this.left,
                    y: p.y-this.top,
                });
            });
            this.on("pointingend", function(e) {
                self.pointsList.push(self.points);
                self.points = [];
            });

            // ポイントスタック
            this.pointsList = [];
            this.points = [];
        },
        
        /**
         * 画面をbgColor色でクリアする
         */
        clear: function() {
            this.canvas.clear();
            this.canvas.clearColor(this.bgColor);

            this.pointsList = [];
            this.points = [];
            
            return this;
        },
        
        _drawPoint: function(p) {
            this.canvas.drawPoint(p.x-this.left, p.y-this.top);
        },
        
        _drawLine: function(p, prev) {
            this.canvas.drawLine(
                p.x-this.left, p.y-this.top,
                prev.x-this.left, prev.y-this.top
            );
        },
        
    });

    /**
     * @property    penColor
     * penColor
     */
    tm.ui.Sketch.prototype.accessor("penColor", {
        "get": function()   { return this._penColor; },
        "set": function(v)  {
            this._penColor = v;
            this.canvas.strokeStyle = v;
        }
    });
    
    /**
     * @property    bgColor
     * bgColor
     */
    tm.ui.Sketch.prototype.accessor("bgColor", {
        "get": function()   { return this._bgColor; },
        "set": function(v)  {
            this._bgColor = v;
            this.clear();
        }
    });
    
    /**
     * @property    lineWidth
     * lineWidth
     */
    tm.ui.Sketch.prototype.accessor("lineWidth", {
        "get": function()   { return this._lineWidth; },
        "set": function(v)  {
            this._lineWidth = v;
            this.canvas.lineWidth = v;
        }
    });

    
})();


/*
 *  gauge.js
 */



(function() {

    /**
     * @class tm.ui.Gauge
     * ゲーム用ゲージクラス
     * @extends tm.display.CanvasElement
     */
    tm.ui.Gauge = tm.createClass({
        superClass: tm.display.CanvasElement,
        
        
        /**
         * アニメーションさせるかどうかのフラグ
         */
        animationFlag: true,
        /**
         * 0~100 に変化する際にかかる時間
         * つまり10*1000 だった場合は, 0~10に変化するさいに　1秒かかる
         */
        animationTime: 10*1000, // 10 秒

        /**
         * @constructor
         */
        init: function(param) {
            this.superInit();
            
            param = param || {};
            param.$safe({
                width: 300,
                height: 25,
                color: "hsl(220, 100%, 50%)",
                bgColor: "#444",
                borderColor: "white",
                borderWidth: 4,
            });
            
            this.$extend(param);
            
            this._reset();
        },

        /**
         * 満タンかをチェック
         */
        isFull: function() {
            return this._value === this._maxValue;
        },

        /**
         * 空っぽかをチェック
         */
        isEmpty: function() {
            return this._value == 0;
        },

        /**
         * @private
         */
        _reset: function(direction) {
            this.originX = 0;
            this._value = 100;
            this._value = this._maxValue = 100;
        },

        /**
         * 値をセット
         */
        setValue: function(value) {
            value= Math.clamp(value, 0, this._maxValue);

            this._realValue = value;
            
            // end when now value equal value of argument
            if (this._value === value) return ;
            
            // fire value change event
            this.fire(tm.event.Event("change"));
            
            if (this.isAnimation()) {
                this.tweener.clear();

                var time = (Math.abs(this._value-value)/100)*this.animationTime;
                this.tweener.clear()
                    .to({ "_value":value }, time)
                    .call(function() {
                        this.fire(tm.event.Event("changed"));

                        if (this.isEmpty()) {
                            this.fire(tm.event.Event("empty"));
                        }
                        else if (this.isFull()) {
                            this.fire(tm.event.Event("full"));
                        }
                    }.bind(this));
            }
            else {
                this._value = value;
                this.fire(tm.event.Event("changed"));
                
                if (this.isEmpty()) {
                    this.fire(tm.event.Event("empty"));
                }
                else if (this.isFull()) {
                    this.fire(tm.event.Event("full"));
                }
            }
            
            return this;
        },

        /**
         * 値をゲット
         */
        getValue: function() {
            return this.value;
        },

        /**
         * 値を％でセット
         */
        setPercent: function(percent) {
            return this.setValue(this._maxValue*percent*0.01);
        },

        /**
         * 値を％でゲット
         */
        getPercent: function() {
            return (this._value/this._maxValue)*100;
        },

        /**
         * 値を比率でセット
         */
        setRatio: function(ratio) {
            return this.setValue(this._maxValue*ratio);
        },

        /**
         * 値を比率でゲット
         */
        getRatio: function() {
            return this._value/this._maxValue;
        },
        
        isAnimation: function() {
            return this.animationFlag;
        },
        
        draw: function(canvas) {
            canvas.save();
            
            // bg
            canvas.fillStyle = this.bgColor;
            canvas.fillRect(0, 0, this.width, this.height);
            
            // bar
            canvas.fillStyle = this.color;
            canvas.fillRect(0, 0, this.width*this.getRatio(), this.height);
            
            // border
            canvas.strokeStyle = this.borderColor;
            canvas.lineWidth = this.borderWidth;
            canvas.strokeRect(0, 0, this.width, this.height);
            
            canvas.restore();
        }
    });
    
    /**
     * @property    value
     * 値
     */
    tm.ui.Gauge.prototype.accessor("value", {
        get: function() {
            return this._value;
        },
        set: function(v) {
            this.setValue(v);
        },
    });

    /**
     * @property    percent
     * パーセント
     */
    tm.ui.Gauge.prototype.accessor("percent", {
        get: function() {
            return this.getPercent();
        },
        set: function(v) {
            this.setPercent(v);
        },
    });
    
    
    /**
     * @property    ratio
     * 比率
     */
    tm.ui.Gauge.prototype.accessor("ratio", {
        get: function() {
            return this.getRatio();
        },
        set: function(v) {
            this.setRatio(v);
        },
    });
    
})();


;(function() {
    
    /**
     * @class tm.ui.FlatGauge
     * ゲーム用ゲージクラス
     * @extends tm.ui.Gauge
     */
    tm.define("tm.ui.FlatGauge", {
        superClass: "tm.ui.Gauge",
        
        /**
         * @constructor
         */
        init: function(param) {
            this.superInit(param);
        },
        
        draw: function(canvas) {
            canvas.save();
            
            canvas.save();
            
            canvas.roundRect(0, 0, this.width, this.height, this.height/2);
            canvas.clip();
            
            // bg
            canvas.fillStyle = this.bgColor;
            canvas.fillRect(0, 0, this.width, this.height);
            
            // bar
            canvas.fillStyle = this.color;
            canvas.fillRect(0, 0, this.width*this.getRatio(), this.height);
            
            canvas.restore();
            
            // border
            canvas.strokeStyle = this.borderColor;
            canvas.lineWidth = this.borderWidth;
            canvas.strokeRoundRect(0, 0, this.width, this.height, this.height/2);
            
            canvas.restore();
        },
    });
    
})();



;(function() {
    
    /**
     * @class tm.ui.GlossyGauge
     * ゲーム用ゲージクラス
     * @extends tm.ui.Gauge
     */
    tm.define("tm.ui.GlossyGauge", {
        superClass: "tm.ui.Gauge",
        
        init: function(param) {
            param = param || {};
            param.borderWidth = param.borderWidth || 2;
            this.superInit(param);
        },
        
        /**
         * @constructor
         */
        draw: function(c) {
            c.save();
            
            // clip
            c.roundRect(0, 0, this.width, this.height, this.height/2);
            c.clip();
            
            // bg
            c.fillStyle = this.bgColor;
            c.fillRect(0, 0, this.width, this.height);
            
            // bar
            c.fillStyle = this.color;
            c.fillRect(0, 0, this.width*this.getRatio(), this.height);
            var grad = tm.graphics.LinearGradient(0, 0, 0, this.height);
            grad.addColorStop(0.0,  "rgba(255,255,255,0.9)");
            grad.addColorStop(0.5,  "rgba(255,255,255,0.5)");
            grad.addColorStop(0.51, "rgba(255,255,255,0.2)");
            grad.addColorStop(1.0,  "rgba(255,255,255,0.0)");
            c.setGradient(grad);
            c.fillRect(0, 0, this.width*this.getRatio(), this.height);
            
            c.restore();
            
            // border
            c.lineWidth = this.borderWidth;
            c.strokeStyle = this.borderColor;
            c.strokeRoundRect(0, 0, this.width, this.height, this.height/2);
        },
    });
    
})();




;(function() {
    
    /**
     * @class tm.ui.LabelArea
     * @extends tm.display.Shape
     * ラベルエリアクラス
     */
    tm.define("tm.ui.LabelArea", {
        superClass: "tm.display.Shape",
        
        init: function(param) {
            param = param || {};
            this.superInit(param.width || 150, param.height || 60);
            this.canvas.clearColor("red");
            this.$extend({
                mode:         param.mode       || "horizon",
                _fillStyle:   param.fillStyle  || "#aaa",
                _bgColor:     param.bgColor    || "transparent",
                _fontSize:    param.fontSize   || 24,
                _fontFamily:  param.fontFamily || "'Consolas', 'Monaco', 'ＭＳ ゴシック'",
                _fontWeight:  param.fontWeight || "",
                lineSpace:    param.lineSpace  || 1, // 行間, 文字サイズ(px)に対する倍率
            });
            this._updateFont();
            this.setText(param.text || "こんにちは,世界!");
        },
        
        setText: function(text) {
            if (this._text === text) { return ; }
            
            this._text =  text;
            
            this._renderText();
        },
        
        _renderText: function() {
            this.canvas.width  =this.width;
            this.canvas.height =this.height;
            
            this.canvas.clearColor(this.bgColor);
            
            this.canvas.font = this.fontStyle;
            this.canvas.fillStyle = this.fillStyle;
            this.canvas.fillLabelArea({
                text: this._text,
                x: 0,
                y: 0,
                width: this.width,
                height: this.height,
                mode: this.mode,
                lineSpace: this.lineSpace,
            });
        },

        /**
         * @private
         */
        _updateFont: function() {
            this.fontStyle = "{fontWeight} {fontSize}px {fontFamily}".format(this);
            if (this.text) {
                this._renderText();
            }
        },
    });
    
    
    /**
     * @property    text
     * 文字
     */
    tm.ui.LabelArea.prototype.accessor("text", {
        "get": function() { return this._text; },
        "set": function(v){
            this.setText(v);
        }
    });
    
    /**
     * @property    fontSize
     * フォントサイズ
     */
    tm.ui.LabelArea.prototype.accessor("fontSize", {
        "get": function() { return this._fontSize; },
        "set": function(v){ this._fontSize = v; this._updateFont(); }
    });
    
    /**
     * @property    fontFamily
     * フォント
     */
    tm.ui.LabelArea.prototype.accessor("fontFamily", {
        "get": function() { return this._fontFamily; },
        "set": function(v){ this._fontFamily = v; this._updateFont(); }
    });
    
    /**
     * @property    fontWeight
     */
    tm.ui.LabelArea.prototype.accessor("fontWeight", {
        "get": function() { return this._fontWeight; },
        "set": function(v) {
            this._fontWeight = v; this._updateFont();
        },
    });
    
    /**
     * @property    fillStyle
     */
    tm.ui.LabelArea.prototype.accessor("fillStyle", {
        "get": function() { return this._fillStyle; },
        "set": function(v) {
            this._fillStyle = v; this._updateFont();
        },
    });
    
    /**
     * @property    bgColor
     */
    tm.ui.LabelArea.prototype.accessor("bgColor", {
        "get": function() { return this._bgColor; },
        "set": function(v) {
            this._bgColor = v; this._updateFont();
        },
    });

    /**
     * @property    width
     * dummy
     */
    tm.ui.LabelArea.prototype.accessor("width", {
        "get": function() { return this._width; },
        "set": function(v){
            this._width = v;
            if (this.text) {
                this._renderText();
            }
        }
    });
    
    /**
     * @property    height
     * dummy
     */
    tm.ui.LabelArea.prototype.accessor("height", {
        "get": function() { return this._height; },
        "set": function(v){
            this._height = v;
            if (this.text) {
                this._renderText();
            }
        }
    });

    
})();


;(function() {

    tm.game = tm.game || {};


    tm.game.setup = function(param) {
        param.$safe({
            query: "#world",
            title: "Title",
            background: "rgba(250, 250, 250, 1.0)",
            width: 640,
            height: 960,
            startLabel: 'title',
            fitting: true,
            fps: 30,
            assets: window.ASSETS || null,
        });

        tm.globalize();

        this.expand(param);

        var scenes = [
            {
                className: "SplashScene",
                arguments: {
                    width: param.width,
                    height: param.height,
                },
                label: "splash",
                nextLabel: "title",
            },
            {
                className: "TitleScene",
                arguments: {
                    title: param.title,
                },
                label: "title",
            },
            {
                className: "GameScene",
                label: "game",
                nextLabel: "result",
            },
            {
                className: "ResultScene",
                arguments: {
                    message: param.title,
                },
                label: "result",
                nextLabel: "title",
            },

            {
                className: "PauseScene",
                label: "pause",
            },
        ];

        tm.main(function() {
            var app = tm.app.CanvasApp(param.query);    // 生成
            app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);    // サイズ(解像度)設定
            if (param.fitting) { app.fitWindow(); }     // 自動フィッティング有効
            app.background = param.background;          // 背景色
            app.fps = param.fps;                        // fps

            if (param.assets) {
                var loading = tm.game.LoadingScene({
                    assets: param.assets,
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT,
                });
                loading.onload = function() {
                    app.replaceScene(tm.game.ManagerScene({
                        startLabel: param.startLabel,
                        scenes: scenes,
                    }));
                };
                app.replaceScene(loading);
            }
            else {
                app.replaceScene(tm.game.ManagerScene({
                    startLabel: param.startLabel,
                    scenes: scenes,
                }));
            }

            app.run();

            tm.game.app = app;
        });
    };

    tm.game.expand = function(param) {
        tm.global.$extend({
            SCREEN_WIDTH: param.width,
            SCREEN_HEIGHT: param.height,
            SCREEN_CENTER_X: param.width/2,
            SCREEN_CENTER_Y: param.height/2,
            SCREEN_GRID_X: GridSystem(param.width, 16),
            SCREEN_GRID_Y: GridSystem(param.height, 16),
            QUERY: tm.util.QueryString.parse(location.search.substr(1)),
        });

    };

})();

/*
 * TitleScene
 */


(function() {

    tm.define("tm.game.TitleScene", {
        superClass: "tm.app.Scene",

        init: function(param) {
            this.superInit();

            param = {}.$extend(tm.game.TitleScene["default"], param);
            this.param = param;

            this.fromJSON({
                children: {
                    bg: {
                        type: "tm.display.RectangleShape",
                        init: {
                            width: param.width,
                            height: param.height,
                            fillStyle: param.bgColor,
                            strokeStyle: "transparent",
                        },
                        originX: 0,
                        originY: 0,
                    }
                }
            });

            if (param.bgImage) {
                this.fromJSON({
                    children: {
                        bgImage: {
                            type: "tm.display.Sprite",
                            init: [param.bgImage],
                            originX: 0,
                            originY: 0,
                        }
                    }
                });
            }

            this.fromJSON({
                children: {
                    titleLabel: {
                        type: "Label", name: "titleLabel",
                        text: param.title,
                        x: this._toGridX(6),
                        y: this._toGridY(3),
                        fillStyle: param.fontColor,
                        fontSize: param.fontSize,
                        fontFamily: "'Helvetica-Light' 'Meiryo' sans-serif",
                        align: "center",
                        baseline: "middle",
                    },
                    messageLabel: {
                        type: "Label", name: "nextLabel",
                        text: param.message || "",
                        x: this._toGridX(6),
                        y: this._toGridY(6),
                        fillStyle: param.fontColor,
                        fontSize: param.fontSize*0.36,
                        fontFamily: "'Helvetica-Light' 'Meiryo' sans-serif",
                        align: "center",
                        baseline: "middle",
                    },
                    touchLabel: {
                        type: "Label", name: "nextLabel",
                        text: "TOUCH START",
                        x: this._toGridX(6),
                        y: this._toGridY(9),
                        fillStyle: param.fontColor,
                        fontSize: param.fontSize*0.4,
                        fontFamily: "'Helvetica-Light' 'Meiryo' sans-serif",
                        align: "center",
                        baseline: "middle",
                    }
                }
            });

            this.touchLabel.tweener
                .fadeOut(500)
                .fadeIn(1000)
                .setLoop(true);

            this.autopop = param.autopop;
        },

        _toGridX: function(index) {
            return this.param.width/12*index;
        },

        _toGridY: function(index) {
            return this.param.height/12*index;
        },

        onpointingstart: function() {
            this.flare("finish");

            if (this.autopop) {
                this.app.popScene();
            }
        },
    });

    tm.game.TitleScene["default"] = {
        title: "Time is money",
        message: "",
        fontSize: 72,
        fontColor: "#444",
        width: 640,
        height: 960,
        bgColor: "rgb(240,240,240)",
        bgImage: null,
        autopop: true,
    };

})();


/*
 * ResultScene
 */


(function() {

    tm.define("tm.game.ResultScene", {
        superClass: "tm.app.Scene",

        init: function(param) {
            this.superInit();

            param = {}.$extend(tm.game.ResultScene["default"], param);
            this.param = param;

            var userData = this._getUserData();
            var bestScore = (userData.bestScore) ? userData.bestScore : 0;
            var highScoreFlag = (param.score > bestScore);

            if (param.record) {
                if (highScoreFlag) {
                    userData.bestScore = param.score;
                    this._record(userData);
                }
            }

            this.fromJSON({
                children: {
                    bg: {
                        type: "tm.display.RectangleShape",
                        init: {
                            width: param.width,
                            height: param.height,
                            fillStyle: param.bgColor,
                            strokeStyle: "transparent",
                        },
                        originX: 0,
                        originY: 0,
                    }
                }
            });

            if (param.bgImage) {
                this.fromJSON({
                    children: {
                        bgImage: {
                            type: "tm.display.Sprite",
                            init: [param.bgImage],
                            originX: 0,
                            originY: 0,
                        }
                    }
                });
            }

            var baseLabelParam = {
                type: "Label",
                fillStyle: param.fontColor,
                fontFamily: "'Helvetica-Light' 'Meiryo' sans-serif",
            };

            this.fromJSON({
                children: {
                    scoreText: baseLabelParam.$extend({
                        text: "score",
                        x: this._toGridX(4),
                        y: this._toGridY(3),
                        fontSize: param.fontSize*0.5,
                    }),
                    scoreLabel: {
                        type: "Label",
                        text: param.score,
                        x: this._toGridX(4),
                        y: this._toGridY(4),
                        fillStyle: param.fontColor,
                        fontSize: param.fontSize,
                        fontFamily: "'Helvetica-Light' 'Meiryo' sans-serif",
                    },
                    bestText: {
                        type: "Label",
                        text: "best",
                        x: this._toGridX(8),
                        y: this._toGridY(3),
                        fillStyle: param.fontColor,
                        fontSize: param.fontSize*0.5,
                        fontFamily: "'Helvetica-Light' 'Meiryo' sans-serif",
                    },
                    bestLabel: {
                        type: "Label",
                        text: bestScore,
                        x: this._toGridX(8),
                        y: this._toGridY(4),
                        fillStyle: param.fontColor,
                        fontSize: param.fontSize,
                        fontFamily: "'Helvetica-Light' 'Meiryo' sans-serif",
                    },

                    newRecordText: {
                        type: "Label",
                        text: "new record!",
                        x: this._toGridX(6),
                        y: this._toGridY(6),
                        fillStyle: param.fontColor,
                        fontSize: param.fontSize*0.5,
                        fontFamily: "'Helvetica-Light' 'Meiryo' sans-serif",
                        visible: false,
                    },

                    messageText: {
                        type: "Label",
                        text: param.message,
                        x: this._toGridX(6),
                        y: this._toGridY(7),
                        fillStyle: param.fontColor,
                        fontSize: param.fontSize*0.5,
                        fontFamily: "'Helvetica-Light' 'Meiryo' sans-serif",
                    },

                    shareButton: {
                        type: "FlatButton",
                        init: {
                            text: "Share",
                            width: 200,
                            fillStyle: "hsl(240, 100%, 64%)",
                        },
                        x: this._toGridX(4),
                        y: this._toGridY(9),
                    },
                    backButton: {
                        type: "FlatButton",
                        init: {
                            text: "Back",
                            width: 200,
                            fillStyle: "hsl(240, 80%, 0%)",
                        },
                        x: this._toGridX(8),
                        y: this._toGridY(9),
                    }
                }
            });

            // setup tweet
            var text = "SCORE: {score}, {message}".format(param);
            var twitterURL = tm.social.Twitter.createURL({
                type    : "tweet",
                text    : text,
                hashtags: param.hashtags,
                url     : param.url, // or window.document.location.href
            });
            this.shareButton.onclick = function() {
                window.open(twitterURL, 'share window', 'width=400, height=300');
            };

            // setup back
            this.backButton.onpointingstart = this._back.bind(this);
            this.autopop = param.autopop;

            // setup record
            if (highScoreFlag) {
                this.newRecordText.show();
                this.newRecordText.tweener
                    .set({alpha:0.0})
                    .fadeIn(2000)
                    .setLoop(true)
                    ;
            }
        },

        _getUserData: function() {
            var key = location.pathname.toCRC32();
            var data = localStorage.getItem(key);
            return (data) ? JSON.parse(data) : {};
        },

        _record: function(data) {
            var key = location.pathname.toCRC32();
            var dataString = JSON.stringify(data);
            localStorage.setItem(key, dataString);
            return this;
        },

        _toGridX: function(index) {
            return this.param.width/12*index;
        },

        _toGridY: function(index) {
            return this.param.height/12*index;
        },

        _back: function() {
            this.flare("finish");

            if (this.autopop) {
                this.app.popScene();
            }
        },
    });

    tm.game.ResultScene["default"] = {
        score: 0,
        message: "this is tmlib.js project.",
        hashtags: "tmlibjs,game",
        related: "tmlib.js tmlife javascript",
        url: "http://phi-jp.github.io/tmlib.js/",

        width: 640,
        height: 960,
        fontColor: "#444",
        fontSize: 90,
        bgColor: "rgba(255,255,255, 0.9)",
        bgImage: null,
        record: true,
        autopop: true,
    };

})();


/*
 * loadingscene.js
 */


;(function() {
    
    var DEFAULT_PARAM = {
        width: 465,
        height: 465,
        bgColor: "transparent",
    };
    
    tm.define("tm.game.LoadingScene", {
        superClass: "tm.app.Scene",
        
        init: function(param) {
            this.superInit();
            
            this.param = param = {}.$extend(DEFAULT_PARAM, param);

            this.fromJSON({
                children: {
                    stage: {
                        type: "tm.display.CanvasElement",
                    },
                }
            });

            this.stage.fromJSON({
                children: {
                    bg: {
                        type: "tm.display.Shape",
                        init: {
                            width: param.width,
                            height: param.height,
                        },
                        originX: 0,
                        originY: 0,
                    },
                    piyoLayer: {
                        type: "tm.display.CanvasElement",
                    },
                    label: {
                        type: "tm.display.Label",
                        text: "LOADING",
                        x: param.width/2,
                        y: param.height/2-20,
                        align: "center",
                        baseline: "middle",
                        fontSize: 46,
                        shadowBlur: 4,
                        shadowColor: "hsl(190, 100%, 50%)",
                    },
                    // piyo: {
                    //     type: "tm.display.Shape",
                    //     init: [84, 84],
                    // },
                    bar: {
                        type: "tm.ui.Gauge",
                        init: [{
                            width: param.width,
                            height: 10,
                            color: "hsl(200, 100%, 80%)",
                            bgColor: "transparent",
                            borderColor: "transparent",
                            borderWidth: 0,
                        }],
                        x: 0,
                        y: 0,
                    },
                }
            });
            
            // bg
            var bg = this.stage.bg;
            bg.canvas.clearColor(param.bgColor);

            // label
            var label = this.stage.label;
            label.tweener
                .to({alpha:1}, 1000)
                .to({alpha:0.5}, 1000)
                .setLoop(true)

            // bar
            var bar = this.stage.bar;
            bar.animationFlag = false;
            bar.value = 0;
            bar.animationFlag = true;
            bar.animationTime = 100;
            
            // ひよこさん
            this._createHiyoko(param).addChildTo(this.stage.piyoLayer);

            // load
            var stage = this.stage;
            stage.alpha = 0.0;
            stage.tweener.clear().fadeIn(100).call(function() {
                if (param.assets) {
                    var loader = tm.asset.Loader();
                    loader.onload = function() {
                        stage.tweener.clear().wait(200).fadeOut(200).call(function() {
                            if (param.nextScene) {
                                this.app.replaceScene(param.nextScene());
                            }
                            var e = tm.event.Event("load");
                            this.fire(e);

                            if (param.autopop == true) {
                                this.app.popScene();
                            }
                        }.bind(this));
                    }.bind(this);
                    
                    loader.onprogress = function(e) {
                        // update bar
                        bar.value = e.progress*100;

                        // dispatch event
                        var event = tm.event.Event("progress");
                        event.progress = e.progress;
                        this.fire(event);
                    }.bind(this);
                    
                    loader.load(param.assets);
                }
            }.bind(this));
        },

        onpointingstart: function(app) {
            // ひよこさん生成
            var p = app.pointing;
            var piyo = this._createHiyoko(this.param).addChildTo(this.stage.piyoLayer);
            piyo.x = p.x;
            piyo.y = p.y;
        },

        _createHiyoko: function(param) {
            // ひよこさん
            var piyo = tm.display.Shape({
                width: 84,
                height: 84,
            });
            piyo.x = tm.util.Random.randint(0, param.width);
            piyo.y = tm.util.Random.randint(0, param.height);
            piyo.canvas.setColorStyle("white", "yellow").fillCircle(42, 42, 32);
            piyo.canvas.setColorStyle("white", "black").fillCircle(27, 27, 2);
            piyo.canvas.setColorStyle("white", "brown").fillRect(40, 70, 4, 15).fillTriangle(0, 40, 11, 35, 11, 45);
            piyo.dir = tm.geom.Vector2.random(0, 360, 4);
            var rect = tm.geom.Rect(0, 0, param.width, param.height);
            rect.padding(42);
            piyo.update = function(app) {
                this.position.add(this.dir);

                if (this.x < rect.left) {
                    this.x = rect.left;
                    this.dir.x*=-1;
                }
                else if (this.x > rect.right) {
                    this.x = rect.right;
                    this.dir.x*=-1;
                }
                if (this.y < rect.top) {
                    this.y = rect.top;
                    this.dir.y*=-1;
                }
                else if (this.y > rect.bottom) {
                    this.y = rect.bottom;
                    this.dir.y*=-1;
                }

                if (this.dir.x<0) {
                    this.rotation -= 7;
                    this.scaleX = 1;
                }
                else {
                    this.rotation += 7;
                    this.scaleX = -1;
                }

                // // 向き更新
                // if (app.pointing.getPointingStart()) {
                //     var p = app.pointing.position;
                //     var v = tm.geom.Vector2.sub(p, this.position);
                //     this.dir = v.normalize().mul(4);
                // }

            };

            return piyo;
        },
    });
    
})();






/*
 * splash
 */

;(function() {
    var SPLASH_IMAGE_PATH = "https://files.gitter.im/phi-jp/tmlib.js/t5F7/splash.png";

    tm.define("SplashScene", {
        superClass: "tm.app.Scene",

        init: function(param) {
            this.superInit();

            this.param = param;

            this.splashImage = tm.asset.Texture(param.path || SPLASH_IMAGE_PATH);
            this.splashImage.onload = this._init.bind(this);
        },

        _init: function() {
            var width = this.param.width;
            var height = this.param.height;
            
            tm.display.Shape({
                width: width,
                height: height,
                bgColor: "white"
            }).setOrigin(0, 0).addChildTo(this);

            tm.display.Sprite(this.splashImage, width, height)
                .setOrigin(0, 0)
                .setAlpha(0)
                .addChildTo(this)
                .tweener
                    .clear()
                    .wait(250)
                    .fadeIn(500)
                    .wait(1000)
                    .fadeOut(500)
                    .wait(250)
                    .call(function() {
                        this.app.popScene();
                    }.bind(this));
        },
    });
})();


/*
 *
 */

;(function() {

    /**
     * @class tm.game.ManagerScene
     * マネージャーシーン
     * @extends tm.app.Scene
     */
    tm.define("tm.game.ManagerScene", {
        superClass: "tm.app.Scene",

        /**
         * @constructor
         */
        init: function(param) {
            this.superInit();

            this.setScenes(param.scenes);

            this.on("enter", function() {
                this.gotoScene(param.startLabel || 0);
            }.bind(this));

            this.on("resume", this.onnext.bind(this));

            this.commonArguments = {};
        },

        /**
         * scenes をセット
         */
        setScenes: function(scenes) {
            this.scenes = scenes;
            this.sceneIndex = 0;

            return this;
        },

        /**
         * index(or label) のシーンへ飛ぶ
         */
        gotoScene: function(index, args) {
            index = (typeof index == 'string') ? this.labelToIndex(index) : index||0;

            // イベント発火
            var e = tm.event.Event("prepare");
            this.fire(e);

            var data = this.scenes[index];
            var klass = tm.using(data.className);
            var initArguments = data.arguments;
            var initArguments = {}.$extend(initArguments, args);
            var scene = klass.call(null, initArguments);
            if (!scene.nextLabel) {
                scene.nextLabel = data.nextLabel;
            }
            if (!scene.nextArguments) {
                scene.nextArguments = data.nextArguments;
            }
            this.app.pushScene(scene);

            this.sceneIndex = index;
            this.currentScene = scene;

            // イベント発火
            var e = tm.event.Event("goto");
            e.scene = scene;
            this.fire(e);

            return this;
        },

        /**
         * 次のシーンへ飛ぶ
         */
        gotoNext: function(args) {
            var data = this.scenes[this.sceneIndex];
            var nextIndex = null;

            // 次のラベルが設定されていた場合
            if (data.nextLabel) {
                nextIndex = this.labelToIndex(data.nextLabel);
            }
            // 次のシーンに遷移
            else if (this.sceneIndex+1 < this.scenes.length) {
                nextIndex = this.sceneIndex+1;
            }

            if (nextIndex !== null) {
                this.gotoScene(nextIndex, args);
            }
            else {
                this.fire(tm.event.Event("finish"));
            }

            return this;
        },

        /**
         * シーンインデックスを取得
         */
        getCurrentIndex: function() {
            return this.sceneIndex;
        },

        /**
         * シーンラベルを取得
         */
        getCurrentLabel: function() {
            return this.scenes[this.sceneIndex].label;
        },

        /**
         * ラベルからインデックスに変換
         */
        labelToIndex: function(label) {
            var data = this.scenes.filter(function(data) {
                return data.label == label;
            })[0];

            return this.scenes.indexOf(data);
        },

        /**
         * インデックスからラベルに変換
         */
        indexToLabel: function(index) {
            return this.scenes[index].label;
        },

        onnext: function(e) {
            var nextLabel = e.prevScene.nextLabel;
            var nextArguments = e.prevScene.nextArguments;
            if (nextLabel) {
                this.gotoScene(nextLabel, nextArguments);
            }
            else {
                this.gotoNext(nextArguments);
            }
        },
    });

})();


;(function() {

	tm.define("tm.game.NumericalInputScene", {
		superClass: "tm.app.Scene",

		init: function(param) {
			this.superInit();

			this.fromJSON({
				children: {
					inputLabel: {
						type: "tm.display.Label",
						fillStyle: "white",
						text: "",
						fontSize: 64,
						x: 320,
						y: 120,
					},
					buttonGroup: {
						type: "tm.display.CanvasElement",
					},
				},
			});


			[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].each(function(n, i) {
				var button = this._createButton(n.toString()).addChildTo(this.buttonGroup);
				var xIndex = i%3;
				var yIndex = (i/3)|0;
				button.x = 190*xIndex + 130;
				button.y = 177*yIndex + 280;
			}, this);

			var self = this;
			var buttons = this.buttonGroup.children;
			buttons.each(function(button) {
				button.setInteractive(true).setBoundingType("circle");
				button.radius = 145/2;
				button.onpointingstart = function() {
					if (this.label.text == 'OK') {
						var e = tm.event.Event("decided");
						e.value = Number(self.inputLabel.text);
						self.fire(e);
					}
					else if (this.label.text == 'C') {
						var e = tm.event.Event("push");
						self.inputLabel.text = "";
						self.flare("clear");
					}
					else {
						self.inputLabel.text += this.label.text;
						self.flare("push", {
							select: this.label.text,
						});
					}
				}
			});
		},

		_createButton: function(n) {
			var button = tm.display.CanvasElement();

			button.fromJSON({
				children: {
					bg: {
						type: "tm.display.CircleShape",
						init: [145, 145, {
							fillStyle: "transparent",
							strokeStyle: "white",
						}],
					},
					label: {
						type: "tm.display.Label",
						text: n,
						fontSize: 64,
						fillStyle: "white",
					},
				},
			});

			return button;
		},
	});

})();

/*
 * countscene.js
 */

;(function() {

    tm.define("tm.game.CountScene", {
        superClass: "tm.app.Scene",

        init: function(param) {
            this.superInit();

            param = param.$safe({
                width: 640,
                height: 960,
                bgColor: '#444',
                count: 3,
                autopop: true,
                fontSize: 180,
            });

            param = param || {};

            this.fromJSON({
                children: {
                    bg: {
                        type: "tm.display.Shape",
                        width: param.width,
                        height: param.height,
                        bgColor: param.bgColor,
                        originX: 0,
                        originY: 0,
                    },
                    label: {
                        type: "tm.display.Label",
                        fillStyle: "white",
                        fontSize: param.fontSize,
                        x: SCREEN_CENTER_X,
                        y: SCREEN_CENTER_Y,
                    },
                }
            });

            if (param.count instanceof Array) {
                this.countList = param.count.reverse();
            }
            else {
                this.countList = Array.range(1, param.count+1);
            }
            this.counter = this.countList.length;
            this.autopop = param.autopop;
            this._updateCount();
        },

        _updateCount: function() {
            var endFlag = this.counter <= 0;
            var index = --this.counter;

            this.label.text = this.countList[index];

            this.label.scale.set(1, 1);
            this.label.tweener
                .clear()
                .to({
                    scaleX: 1,
                    scaleY: 1,
                    alpha: 1,
                }, 250)
                .wait(500)
                .to({
                    scaleX: 1.5,
                    scaleY: 1.5,
                    alpha: 0.0
                }, 250)
                .call(function() {
                    if (this.counter <= 0) {
                        this.flare('finish');
                        if (this.autopop) {
                            this.app.popScene();
                        }
                    }
                    else {
                        this._updateCount();
                    }
                }, this);
        },

    });

})();
/*
 * three.js
 */

tm.three = tm.three || {};


(function() {

    if (!tm.global.THREE) return ;
    
    /**
     * @class tm.three.ThreeApp
     * 3Dライブラリ - Three.jsをtmlib.jsで対応
     * @extends tm.app.BaseApp
     */
    tm.three.ThreeApp = tm.createClass({
        superClass: tm.app.BaseApp,
        
        /** canvas */
        canvas      : null,
        /** canvas */
        background  : null,
        /** @private canvas */
        _scenes      : null,
        /** @private canvas */
        _sceneIndex  : 0,
        
        /**
         * @constructor
         */
        init: function(canvas) {
            if (canvas instanceof HTMLCanvasElement) {
                this.element = canvas;
            }
            else if (typeof canvas == "string") {
                this.element = document.querySelector(canvas);
            }
            else {
                this.element = document.createElement("canvas");
                document.body.appendChild(this.element);
            }

            // 親の初期化
            this.superInit(this.element);

            // レンダラーを生成
//            this.renderer = new THREE.CanvasRenderer({ canvas: this.element });
            this.renderer = new THREE.WebGLRenderer({ canvas: this.element, clearColor: 0x222222, clearAlpha: 1.0 });

            this.renderer.setSize(this.element.width, this.element.height);
            
            // シーン周り
            this._scenes = [ tm.three.Scene() ];
        },
        
        /**
         * @TODO ?
         */
        resize: function(width, height) {
            this.width = width;
            this.height= height;
            this.renderer.setSize(this.width, this.height);
            
            return this;
        },

        /**
         * @TODO ?
         */
        resizeWindow: function() {
            this.width = innerWidth;
            this.height= innerHeight;
            this.renderer.setSize(this.width, this.height);
            
            return this;
        },
        
        /**
         * 画面にフィットさせる
         */
        fitWindow: function(everFlag) {
            // 画面にフィット
            var _fitFunc = function() {
                everFlag = everFlag === undefined ? true : everFlag;
                var e = this.element;
                var s = e.style;
                
                s.position = "absolute";
                s.left = "0px";
                s.top  = "0px";
                
                var rateWidth = e.width/window.innerWidth;
                var rateHeight= e.height/window.innerHeight;
                var rate = e.height/e.width;
                
                if (rateWidth > rateHeight) {
                    s.width  = innerWidth+"px";
                    s.height = innerWidth*rate+"px";
                }
                else {
                    s.width  = innerHeight/rate+"px";
                    s.height = innerHeight+"px";
                }
            }.bind(this);
            
            // 一度実行しておく
            _fitFunc();
            // リサイズ時のリスナとして登録しておく
            if (everFlag) {
                window.addEventListener("resize", _fitFunc, false);
            }
            
            // マウスとタッチの座標更新関数をパワーアップ
            this.mouse._mousemove = this.mouse._mousemoveScale;
            this.touch._touchmove = this.touch._touchmoveScale;
        },

        /**
         * @TODO ?
         * @private
         */
        _draw: function() {
            // 描画は全てのシーン行う
            for (var i=0, len=this._scenes.length; i<len; ++i) {
                this.renderer.render(this.currentScene, this.currentScene.camera);
            }
        },
        
    });
    
    
    /**
     * @property    width
     * 幅
     */
    tm.three.ThreeApp.prototype.accessor("width", {
        "get": function()   { return this.element.width; },
        "set": function(v)  { this.element.width = v; }
    });
    
    /**
     * @property    height
     * 高さ
     */
    tm.three.ThreeApp.prototype.accessor("height", {
        "get": function()   { return this.element.height; },
        "set": function(v)  { this.element.height = v; }
    });
    
})();


(function() {
    
    if (!tm.global.THREE) return ;

    /**
     * @class tm.three.Element
     * @TODO ?
     */
    tm.three.Element = tm.createClass({
        superClass: THREE.Object3D,

        /**
         * @constructor
         */
        init: function() {
            // THREE.Object3D の初期化 
            THREE.Object3D.call(this);

            tm.event.EventDispatcher.prototype.init.call(this);
        },
        
        /**
         * 更新処理
         */
        update: function() {},

        /**
         * @TODO ?
         * @private
         */
        _update: function(app) {
            // 更新有効チェック
            if (this.awake == false) return ;
            
            this.update(app);
            
            var e = tm.event.Event("enterframe");
            e.app = app;
            this.dispatchEvent(e);
            // 子供達も実行
            if (this.children.length > 0) {
                var tempChildren = this.children.slice();
                for (var i=0,len=tempChildren.length; i<len; ++i) {
                    var child = tempChildren[i];
                    child._update && child._update(app);
                }
                //this.execChildren(arguments.callee, app);
            }
        },
    });
    
    // tm.event.EventDispatcher を継承
    tm.three.Element.prototype.$safe(tm.event.EventDispatcher.prototype);
    
})();

(function() {
    
    if (!tm.global.THREE) return ;

    /**
     * @class tm.three.MeshElement
     * @TODO ?
     */
    tm.three.MeshElement = tm.createClass({
        superClass: THREE.Mesh,
        
        /**
         * @constructor
         */
        init: function(geometry, material) {
            material = material || new THREE.MeshNormalMaterial();
            // THREE.Mesh の初期化
            THREE.Mesh.call(this, geometry, material);

            tm.three.Element.prototype.init.call(this);
        },
    });
    
    // tm.three.Element を継承
    tm.three.MeshElement.prototype.$safe(tm.three.Element.prototype);

    
    /**
     * @class tm.three.CubeElement
     * @TODO ?
     * @extends tm.three.MeshElement
     */
    tm.three.CubeElement = tm.createClass({
        superClass: tm.three.MeshElement,

        /**
         * @constructor
         */
        init: function(width, height, depth) {
            width  = width || 100;
            height = height || 100;
            depth  = depth || 100;

            var geometry = new THREE.CubeGeometry(width, height, depth);
            var material = new THREE.MeshNormalMaterial();

            this.superInit(geometry, material);
        }
    });


    /**
     * @class tm.three.SphereElement
     * @TODO ?
     * @extends tm.three.MeshElement
     */
    tm.three.SphereElement = tm.createClass({
        superClass: tm.three.MeshElement,

        /**
         * @constructor
         */
        init: function(radius, widthSegments, heightSegments) {
            radius          = radius || 45;
            widthSegments   = widthSegments || 16;
            heightSegments  = heightSegments || 12;

            var geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
            var material = new THREE.MeshNormalMaterial();

            this.superInit(geometry, material);
        }
    });

    /**
     * @class tm.three.PlaneElement
     * @TODO ?
     * @extends tm.three.MeshElement
     */
    tm.three.PlaneElement = tm.createClass({
        superClass: tm.three.MeshElement,

        /**
         * @constructor
         */
        init: function(width, height) {
            var geometry = new THREE.PlaneGeometry(width, height);
            var material = new THREE.MeshNormalMaterial();

            this.superInit(geometry, material);
        }
    });


    /**
     * @class tm.three.FloorElement
     * @TODO ?
     * @extends tm.three.MeshElement
     */
    tm.three.FloorElement = tm.createClass({
        superClass: tm.three.MeshElement,

        /**
         * @constructor
         */
        init: function(width, height) {
            width  = width || 1000;
            height = height || 1000;
            var geometry = new THREE.PlaneGeometry(width, height);
            var material = new THREE.MeshBasicMaterial();

            this.superInit(geometry, material);

            this.rotation.x = -Math.PI/2;
            this._render();
        },

        /**
         * @TODO ?
         * @private
         */
        _render: function() {
            var c = tm.graphics.Canvas();
            c.resize(128, 128);
            c.clearColor("#444");
            c.setFillStyle("white");
            c.fillRect(0, 0, 64, 64);
            c.fillRect(64, 64, 64, 64);

            var texture = new THREE.Texture(c.element);
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(10, 10);
            texture.needsUpdate = true;
            this.material.map = texture;
        }
    });

    /**
     * @class tm.three.TextElement
     * @TODO ?
     * @extends tm.three.MeshElement
     */
    tm.three.TextElement = tm.createClass({
        superClass: tm.three.MeshElement,

        /**
         * @constructor
         */
        init: function(text, param) {
            var geometry = new THREE.TextGeometry(text, param);
            var material = new THREE.MeshNormalMaterial();

            this.superInit(geometry, material);
        }
    });

    /**
     * @class tm.three.CanvasTexture
     * @TODO ?
     */
    tm.three.CanvasTexture = tm.createClass({
        superClass: THREE.Texture,

        /** canvas */
        canvas: null,
        /** @property needsUpdate */

        /**
         * @constructor
         */
        init: function() {
            this.canvas = tm.graphics.Canvas();

            THREE.Texture.call(this, this.canvas.element);
            this.needsUpdate = true;
        }

    });


})();

(function() {
    
    if (!tm.global.THREE) return ;

    /**
     * @class tm.three.Scene
     * シーン
     */
    tm.three.Scene = tm.createClass({
        superClass: THREE.Scene,
        
        /** @property camera    カメラ */
        /** @property Projector プロジェクター */

        /**
         * @constructor
         */
        init: function(fov, aspect) {
            fov = fov || 60;
            aspect = aspect || 640/480;
            // THREE.Scene の初期化
            THREE.Scene.call(this);

            // tm.three.Element を継承
            tm.three.Element.prototype.init.call(this);

            this.camera = new THREE.PerspectiveCamera(fov, aspect, 1, 10000);
            this.camera.position.y = 100;
            this.camera.position.z = 500;

            this.projector = new THREE.Projector();
        },

        /**
         * @TODO ?
         */
        intersect: function(objects) {
            objects = objects || this.children;
            var mouseX = this.app.pointing.x;
            var mouseY = this.app.pointing.y;

            mouseX = (mouseX/this.app.width) *2-1;
            mouseY =-(mouseY/this.app.height)*2+1;

            var vector = new THREE.Vector3(mouseX, mouseY, 0.5);
            this.projector.unprojectVector(vector, this.camera);

            var raycaster = new THREE.Raycaster(
                this.camera.position, vector.sub(this.camera.position).normalize()
            );

            return raycaster.intersectObjects(objects);
        }
    });
    
    // tm.three.Element を継承
    tm.three.Scene.prototype.$safe(tm.three.Element.prototype);
})();





/*
 * sound.js
 */

tm.sound = tm.sound || {};


(function() {
    
    tm.sound.globalVolume = 1.0;
    
})();


(function() {
    
    /**
     * @class tm.sound.Sound
     * サウンドクラス
     */
    tm.sound.Sound = tm.createClass({
        superClass: tm.event.EventDispatcher,

        /** element */
        element     : null,
        /** loaded */
        loaded      : false,
        /** isPlay */
        isPlay      : false,
        
        /**
         * @constructor
         */
        init: function(src) {
            this.superInit();
            
            this.element = new Audio();
            this.element.src = src;
            this.element.load();
            this.element.setAttribute("preload", "auto");
            
            var self = this;
            this.element.addEventListener("canplaythrough", function(){
                self.loaded = true;
                self.fire(tm.event.Event("load"));
            });
            this.element.addEventListener("ended", function(){
                self.isPlay = false;
            });
            this.element.addEventListener("error", function(){
                console.warn(this.src + "の読み込みに失敗しました");
            });
            
            this.element.volume = 1.0;
            
            //? モバイル系は音が不安定なので一時対応
            if (tm.isMobile) {
                this.loaded = true;
            }
        },
        
        /**
         * 再生
         */
        play: function() {
            this.element.play();
            this.isPlay = true;
            return this;
        },
        
        /**
         * 停止
         */
        stop: function() {
            this.element.pause();
            //? スマホだと止まるので応急対応
            if (!tm.isMobile) {
                this.element.currentTime = 0;
            }
            this.isPlay = false;
            return this;
        },
        
        /**
         * 一時停止
         */
        pause: function() {
            this.element.pause();
            return this;
        },
        
        /**
         * クローン
         */
        clone: function() {
            return tm.sound.Sound( this.element.src );
        },
        
    });
    
    
    
    /**
     * @property    volume
     * ボリューム
     */
    tm.sound.Sound.prototype.accessor("volume", {
        "get": function() { return this.element.volume; },
        "set": function(v){ this.element.volume = v; }
    });
    
    
    if ((new Audio()).loop !== undefined) {
    
        /**
         * @property    loop
         * ループフラグ
         */
        tm.sound.Sound.prototype.accessor("loop", {
            "get": function() { return this.element.loop; },
            "set": function(v){ this.element.loop = v; }
        });
    }
    // firefox 対応
    else {
        var onLoopFunc = function() {
            this.play();
        }
        tm.sound.Sound.prototype.accessor("loop", {
            "get": function() { return this.element.loop; },
            "set": function(v){
                // ループが false の状態で ture が来た場合ループ用関数を登録する
                if (this.element.loop != true && v == true) {
                    this.element.addEventListener("ended", onLoopFunc, false);
                }
                // 関数が登録されていて false が設定された場合ループ用関数を解除する
                else if (this.element.loop == true && v == false) {
                    this.element.removeEventListener("ended", onLoopFunc, false);
                }
                this.element.loop = v;
            }
        });
    }
    
    
    /**
     * @static
     * サポートしている拡張子
     */
    tm.sound.Sound.SUPPORT_EXT = (function(){
        var ext     = "";
        var audio   = new Audio();
        
        if      (audio.canPlayType("audio/wav") == 'maybe') { ext="wav"; }
        else if (audio.canPlayType("audio/mp3") == 'maybe') { ext="mp3"; }
        else if (audio.canPlayType("audio/ogg") == 'maybe') { ext="ogg"; }
        
        return ext;
    })();
    
})();

/*
 * webaudio.js
 */

tm.sound = tm.sound || {};

(function() {

    var context = null;

    /**
     * @class tm.sound.WebAudio
     * WebAudioクラス
     * @extends tm.event.EventDispatcher
     */
    tm.sound.WebAudio = tm.createClass({
        superClass: tm.event.EventDispatcher,

        /** loaded */
        loaded: false,
        /** context */
        context: null,
        /** panner */
        panner: null,
        /** volume */
        volume: 0.8,
        /** playing **/
        playing: false,

        _pannerEnabled: true,

        /**
         * @constructor
         */
        init: function(src_or_buffer) {
            this.superInit();

            this.context = context;
            var type = typeof(src_or_buffer);

            if (type==="string") {
                this.loaded = false;
                this._load(src_or_buffer);
            }
            else if (type==="object") {
                this._setup();
                this.buffer = src_or_buffer;
                this.loaded = true;
                this.dispatchEvent( tm.event.Event("load") );
            }
            else {
                this._setup();
                this.loaded = false;
            }
        },

        /**
         * 再生
         * - noteGrainOn ... http://www.html5rocks.com/en/tutorials/casestudies/munkadoo_bouncymouse/
         */
        play: function(time) {
            if (this.playing == true) { return ; }
            this.playing = true;

            if (time === undefined) time = 0;

            this.source.start(this.context.currentTime + time);

            var self = this;
            var time = (this.source.buffer.duration/this.source.playbackRate.value)*1000;
            window.setTimeout(function() {
                var e = tm.event.Event("ended");
                self.fire(e);
            }, time);

            return this;
        },

        /**
         * 停止
         */
        stop: function(time) {
            if (this.playing == false) { return ; }
            this.playing = false;

            if (time === undefined) time = 0;
            if (this.source.playbackState == 0) {
                return ;
            }
            this.source.stop(this.context.currentTime + time);

            var buffer = this.buffer;
            var volume = this.volume;
            var loop   = this.loop;

            this.source = this.context.createBufferSource();
            this.source.connect(this.gainNode);
            this.buffer = buffer;
            this.volume = volume;
            this.loop = loop;

            return this;
        },

        /**
         * ポーズ
         */
        pause: function() {
            this.source.disconnect();

            return this;
        },

        /**
         * レジューム
         */
        resume: function() {
            this.source.connect(this.gainNode);

            return this;
        },

        /**
         * 複製
         */
        clone: function() {
            var webAudio = tm.sound.WebAudio(this.buffer);
            webAudio.volume = this.volume;
            return webAudio;
        },
        /**
         * dummy
         */
        setPosition: function(x, y, z) {
            this.panner.setPosition(x, y||0, z||0);

            return this;
        },
        /**
         * dummy
         */
        setVelocity: function(x, y, z) {
            this.panner.setVelocity(x, y||0, z||0);

            return this;
        },
        /**
         * dummy
         */
        setOrientation: function(x, y, z) {
            this.panner.setOrientation(x, y||0, z||0);

            return this;
        },

        /**
         * dummy
         * チェーンメソッド用
         */
        setBuffer: function(v) {
            this.buffer = v;
            return this;
        },


        /**
         * dummy
         * チェーンメソッド用
         */
        setLoop: function(v) {
            this.loop = v;
            return this;
        },


        /**
         * dummy
         * チェーンメソッド用
         */
        setVolume: function(v) {
            this.volume = v;
            return this;
        },


        /**
         * チェーンメソッド用
         */
        setPlaybackRate: function(v) {
            this.playbackRate = v;
            return this;
        },

        /**
         * @private
         */
        _load: function(src) {
            if (!this.context) {
                console.warn("本環境はWebAudio未対応です。(" + src + ")");
                return;
            }

            var self = this;
            tm.util.Ajax.load({
                type: "GET",
                url: src,
                responseType: "arraybuffer",
                success: function(data) {
                    // console.debug("WebAudio ajax load success");
                    self.context.decodeAudioData(data, function(buffer) {
                        // console.debug("WebAudio decodeAudioData success");
                        self._setup();
                        self.buffer = buffer;
                        self.loaded = true;
                        self.dispatchEvent( tm.event.Event("load") );
                    }, function() {
                        console.warn("音声ファイルのデコードに失敗しました。(" + src + ")");
                        self._setup();
                        self.buffer = context.createBuffer(1, 1, 22050);
                        self.loaded = true;
                        self.dispatchEvent( tm.event.Event("load") );
                    });
                }
            });
        },

        /**
         * @private
         */
        _setup: function() {
            this.source     = this.context.createBufferSource();
            this.gainNode   = this.context.createGain();
            // this.panner     = this.context.createPanner();
            this.analyser   = this.context.createAnalyser();

            this.source.connect(this.gainNode);
            // this.gainNode.connect(this.panner);
            // this.panner.connect(this.analyser);
            this.gainNode.connect(this.analyser);
            this.analyser.connect(this.context.destination);

            // TODO 暫定的対応
            if (tm.BROWSER === "Firefox") {
                this.pannerEnabled = false;
            }
        },

        /**
         * トーン
         */
        tone: function(hertz, seconds) {
            // handle parameter
            hertz   = hertz !== undefined ? hertz : 200;
            seconds = seconds !== undefined ? seconds : 1;
            // set default value
            var nChannels   = 1;
            var sampleRate  = 44100;
            var amplitude   = 2;
            // create the buffer
            var buffer  = this.context.createBuffer(nChannels, seconds*sampleRate, sampleRate);
            var fArray  = buffer.getChannelData(0);
            // fill the buffer
            for(var i = 0; i < fArray.length; i++){
                var time    = i / buffer.sampleRate;
                var angle   = hertz * time * Math.PI;
                fArray[i]   = Math.sin(angle)*amplitude;
            }
            // set the buffer
            this.buffer = buffer;
            return this;    // for chained API
        },
    });

    /**
     * @property    buffer
     * バッファー
     */
    tm.sound.WebAudio.prototype.accessor("buffer", {
        get: function()  { return this.source.buffer; },
        set: function(v) { this.source.buffer = v; }
    });

    /**
     * @property    loop
     * ループフラグ
     */
    tm.sound.WebAudio.prototype.accessor("loop", {
        get: function()  { return this.source.loop; },
        set: function(v) { this.source.loop = v; }
    });

    /**
     * @property    valume
     * ボリューム
     */
    tm.sound.WebAudio.prototype.accessor("volume", {
        get: function()  { return this.gainNode.gain.value; },
        set: function(v) { this.gainNode.gain.value = v; }
    });

    /**
     * @property    playbackRate
     * プレイバックレート
     */
    tm.sound.WebAudio.prototype.accessor("playbackRate", {
        get: function()  { return this.source.playbackRate.value; },
        set: function(v) { this.source.playbackRate.value = v; }
    });

    /**
     * @property    pannerEnabled
     * panner有効
     */
    tm.sound.WebAudio.prototype.accessor("pannerEnabled", {
        get: function()  { return this._pannerEnabled; },
        set: function(v) {
            this.gainNode.disconnect();
            this.panner.disconnect();
            if (v) {
                this.gainNode.connect(this.panner);
                this.panner.connect(this.analyser);
            } else {
                this.gainNode.connect(this.analyser);
            }
            this._pannerEnabled = v;

            // console.debug("WebAudio pannerEnabled: " + v);
        }
    });

    /**
     * @property    loopStart
     * ループ開始位置（秒）
     */
    tm.sound.WebAudio.prototype.accessor("loopStart", {
        get: function()  { return this.source.loopStart; },
        set: function(v) { this.source.loopStart = v; }
    });

    /**
     * @property    loopEnd
     * ループ終了位置（秒）
     */
    tm.sound.WebAudio.prototype.accessor("loopEnd", {
        get: function()  { return this.source.loopEnd; },
        set: function(v) { this.source.loopEnd = v; }
    });

    /** @static @property */
    tm.sound.WebAudio.isAvailable = (tm.global.AudioContext || tm.global.webkitAudioContext || tm.global.mozAudioContext) ? true : false;

    tm.sound.WebAudio.createContext = function() {
        if (tm.global.AudioContext) {
            context = new AudioContext();
        }
        else if (tm.global.webkitAudioContext) {
            context = new webkitAudioContext();
        }
        else if (tm.global.mozAudioContext) {
            context = new mozAudioContext();
        }

        tm.sound.WebAudio.context = context;
    };

    /**
     * @static
     * iOSでWebAudioを使う場合、window.ontouchend等でこの関数を実行する
     */
    tm.sound.WebAudio.unlock = function() {
        var unlockBuffer = context.createBuffer(1, 1, 22050);
        var unlockSrc = context.createBufferSource();
        unlockSrc.buffer = unlockBuffer;
        unlockSrc.connect(context.destination);
        unlockSrc.start(0);
    };

    tm.sound.WebAudio.createContext();
})();




/*
 * soundmanager.js
 */

;(function() {

    /*
     * tm.sound.SoundManager
     * ### Ref
     * - http://evolve.reintroducing.com/_source/classes/as3/SoundManager/SoundManager.html
     * - https://github.com/nicklockwood/SoundManager
     */
    tm.sound.SoundManager = {
        volume: 0.8,
        musicVolume: 0.8,
        muteFlag: false,
        currentMusic: null,

        /*
         * 再生
         */
        play: function(name, volume, startTime, loop) {
            var sound = tm.asset.Manager.get(name).clone();

            sound.volume = this.getVolume();
            sound.play();

            return sound;
        },
        stop: function() {
            // TODO: 
        },
        pause: function() {
            // TODO: 
        },
        fade: function() {
            // TODO: 
        },
        setVolume: function(volume) {
            this.volume = volume;
        },
        getVolume: function() {
            return this.isMute() ? 0 : this.volume;
        },
        /*
         * ミュート(toggle)
         */
        mute: function() {
            this.muteFlag = (this.muteFlag === true) ? false : true;

            if (this.currentMusic) {
                this.currentMusic.volume = this.getVolumeMusic();
            }

            return this;
        },
        isMute: function() {
            return this.muteFlag;
        },

        /*
         * 音楽を再生
         */
        playMusic: function(name, fadeTime, loop) {
            if (this.currentMusic) {
                this.stopMusic(fadeTime);
            }

            var music = tm.asset.Manager.get(name).clone();

            music.setLoop(true);
            music.volume = this.getVolumeMusic();
            music.play();

            if (fadeTime > 0) {
                var count = 32;
                var counter = 0;
                var unitTime = fadeTime/count;
                var volume = this.getVolumeMusic();

                music.volume = 0;
                var id = setInterval(function() {
                    counter += 1;
                    var rate = counter/count;
                    music.volume = rate*volume;

                    if (rate >= 1) {
                        clearInterval(id);
                        return false;
                    }

                    return true;
                }, unitTime);
            }
            else {
                music.volume = this.getVolumeMusic();
            }

            this.currentMusic = music;

            return this.currentMusic;
        },

        /*
         * 音楽を停止
         */
        stopMusic: function(fadeTime) {
            if (!this.currentMusic) { return ; }

            var music = this.currentMusic;

            if (fadeTime > 0) {
                var count = 32;
                var counter = 0;
                var unitTime = fadeTime/count;
                var volume = this.getVolumeMusic();

                music.volume = 0;
                var id = setInterval(function() {
                    counter += 1;
                    var rate = counter/count;
                    music.volume = volume*(1-rate);

                    if (rate >= 1) {
                        music.stop();
                        clearInterval(id);
                        return false;
                    }

                    return true;
                }, unitTime);
            }
            else {
                this.currentMusic.stop();
            }
        },
        /*
         * 音楽を一時停止
         */
        pauseMusic: function() {
            if (!this.currentMusic) { return ; }
            this.currentMusic.pause();
        },
        /*
         * 音楽を再開
         */
        resumeMusic: function() {
            if (!this.currentMusic) { return ; }
            this.currentMusic.resume();
        },
        /*
         * 音楽のボリュームを設定
         */
        setVolumeMusic: function(volume) {
            this.musicVolume = volume;
            if (this.currentMusic) {
                this.currentMusic.volume = volume;
            }

            return this;
        },
        /*
         * 音楽のボリュームを取得
         */
        getVolumeMusic: function(volume) {
            return this.isMute() ? 0 : this.musicVolume;
        },
    };

})();


/*
 * twitter.js
 */

tm.social = tm.social || {};


(function() {
    
    /**
     * @class tm.social.Twitter
     * ツイッター関連ネームスペース
     */
    tm.social.Twitter = tm.social.Twitter || {};
    
    tm.social.Twitter.API_URL = "http://api.twitter.com/1";    // version 1 は廃止予定らしい
    var BASE_URL = "http://twitter.com/intent";


    /**
     * @member      tm.social.Twitter
     * Tweet する
     * @param {Object} prop
     * ### Reference
     * - <https://dev.twitter.com/docs/intents>
     * ### Example
     *      tm.social.Twitter.createURL({
     *          type        : "tweet",              // タイプ(tweet/retweet/favorite/user)
     *          tweet_id    : "210219483959263232", // 対象となる Tweet
     *          in_reply_to : "210219483959263232", // 返信する対象となる Tweet
     *          text        : "Test",               // テキスト
     *          screen_name : "phi_jp",             // スクリーンネーム
     *          hashtags    : "javascript,tmlibjs", // ハッシュタグ
     *          url         : "http://tmlife.net",  // url
     *          via         : "phi_jp",             // ～から
     *          related     : "tmlib.js tmlife",    // 関連ワード
     *      });
     */
    tm.social.Twitter.createURL = function(prop) {
        var param_string_list = [];
        for (var key in prop) {
            if (key == "type") continue;
            var value = encodeURIComponent(prop[key]);
            var param_string = key+"="+value;
            param_string_list.push(param_string);
        }
        
        var url = "{baseURL}/{type}?{param}".format({
            baseURL : BASE_URL,
            type    : prop.type,
            param   : param_string_list.join('&'),
        });
        
        return url;
    };
    
    
})();

(function() {
    
    var BASE_URL = "http://api.twitter.com/1/{type}/{kind}.json";

    /**
     * @member      tm.social.Twitter
     */
    tm.social.Twitter.api = function(type, kind, param, callback) {
        var url = BASE_URL.format({ type:type, kind:kind });
        var qs  = tm.util.QueryString.stringify(param);
        
        tm.util.Ajax.loadJSONP(url + "?" + qs, callback);
    };
    
})();



(function() {
    
    var BASE_URL = "http://search.twitter.com/search.json";

    /**
     * @member      tm.social.Twitter
     */
    tm.social.Twitter.search = function(param, callback) {
        var url = BASE_URL;
        var qs  = tm.util.QueryString.stringify(param);
        
        tm.util.Ajax.loadJSONP(url + "?" + qs, callback);
    };
    
})();


(function() {
    
    /*
     * format = xml or json
     */
    var BASE_URL = "http://api.twitter.com/1/statuses/followers.json";
    //http://api.twitter.com/1/statuses/followers.json?id=tmlife_jp
    
    /**
     * @member      tm.social.Twitter
     * 
     * user_id      ユーザーID
     * screen_name  screen_name
     * cursor       -1 を指定すると先頭から 100
     * include_entities     true を指定すると entities を取得できる
     * 
     */
    tm.social.Twitter.getFollowers = function(param, callback) {
        tm.social.Twitter.api("statuses", "followers", param, callback);
        
        /*
        tm.social.Twitter.api("statuses", "public_timeline", param, callback);
        tm.social.Twitter.api("statuses", "home_timeline", param, callback);
        tm.social.Twitter.api("statuses", "friends_timeline", param, callback);
        tm.social.Twitter.api("statuses", "user_timeline", param, callback);
        tm.social.Twitter.api("statuses", "replies", param, callback);
        tm.social.Twitter.api("statuses", "mentions", param, callback);
        */
    };
    
})();





































/*
 * nineleap.js
 */

tm.social = tm.social || {};


(function() {

    /**
     * @class tm.social.NineLeap
     * 9leap ネームスペース
     */
    tm.social.Nineleap = tm.social.Nineleap || {};

    var BASE_URL = "http://9leap.net/games/{id}/result?score={score}&result={result}";

    /**
     * @member      tm.social.Nineleap
     */
    tm.social.Nineleap.DEBUG_GAME_ID = "0";

    /**
     * @member      tm.social.Nineleap
     * @method      createURL
     * 9leap 用の URL を生成
     */
    tm.social.Nineleap.createURL = function(id, score, result) {
        return BASE_URL.format({
            id      : id,
            score   : score,
            result  : result
        });
    };

    /**
     * @member      tm.social.Nineleap
     * @method      postRanking
     * 9leap でランキングを POST
     */
    tm.social.Nineleap.postRanking = function(score, result) {
        if (location.hostname == 'r.jsgames.jp') {
            var id = location.pathname.match(/^\/games\/(\d+)/)[1];
            location.replace( this.createURL(id, score, result) );
        }
        else {
            console.warn("9leap に投稿されていません!");
        }
    };

    /**
     * @member      tm.social.Nineleap
     * @method      gotoLogin
     * 9leapログインページヘ遷移する.
     */
    tm.social.Nineleap.gotoLogin = function() {
        window.location.replace("http://9leap.net/api/login");
    };

    /**
     * @member      tm.social.Nineleap
     * @method      isOn9leap
     * アプリケーションが9leap上にデプロイされているか
     */
    tm.social.Nineleap.isOn9leap = function() {
        return window.location.hostname === "r.jsgames.jp";
    };

    /**
     * @member      tm.social.Nineleap
     * @method      getGameId
     * 9leapのゲームIDを取得する
     */
    tm.social.Nineleap.getGameId = function() {
        if (tm.social.Nineleap.isOn9leap()) {
            return window.location.pathname.match(/^\/games\/(\d+)/)[1];
        } else {
            return tm.social.Nineleap.DEBUG_GAME_ID;
        }
    };

    /**
     * @member      tm.social.Nineleap
     * @method      getMyData
     * プレイヤーのゲームデータを取得する
     */
    tm.social.Nineleap.getMyData = function(callback) {
        tm.util.Ajax.loadJSONP(tm.social.Nineleap.createMyDataURL(), callback);
    };

    /**
     * @member      tm.social.Nineleap
     * @method      postMyData
     * プレイヤーのゲームデータを保存する
     */
    tm.social.Nineleap.postMyData = function(data, callback) {
        tm.util.Ajax.load({
            type: "POST",
            url: tm.social.Nineleap.createMemoryURL("user_memory.json"),
            dataType: "json",
            data: "json=" + JSON.stringify(data),
            contentType: "application/x-www-form-urlencoded;charset=UTF-8",
            async: false,
            beforeSend: function(xhr) {
                xhr.withCredentials = true;
            },
            success: callback,
            error: function(responseText) {
                console.error(responseText);
            }
        });
    };

    /**
     * @member      tm.social.Nineleap
     * @method      createMemoryURL
     * 9leap Memory API へアクセスするURLを生成
     */
    tm.social.Nineleap.createMemoryURL = function() {
        var url = [
            "http://9leap.net/api/memory/",
            tm.social.Nineleap.getGameId() + "/",
        ];
        for (var i = 0, len = arguments.length; i < len; i++) {
            url.push(arguments[i]);
        }

        return url.join("");
    };
    /**
     * @member      tm.social.Nineleap
     * @method      createMyDataURL
     * ユーザデータURLを生成
     */
    tm.social.Nineleap.createMyDataURL = function() {
        return tm.social.Nineleap.createMemoryURL("user_memory.json");
    };
    /**
     * @member      tm.social.Nineleap
     * @method      createUserDataURL
     * 他のユーザのプレイデータURLを生成
     */
    tm.social.Nineleap.createUserDataURL = function(screenName) {
        return tm.social.Nineleap.createMemoryURL("u/", screenName + ".json");
    };
    /**
     * @member      tm.social.Nineleap
     * @method      createRecentDataURL
     * 最近プレイしたユーザのプレイデータURLを生成
     */
    tm.social.Nineleap.createRecentDataURL = function(max) {
        max = max || 30;
        return tm.social.Nineleap.createMemoryURL("recent_memories.json", "?max=" + max);
    };
    /**
     * @member      tm.social.Nineleap
     * @method      createFriendDataURL
     * TwitterでフォローしているユーザのプレイデータURLを生成
     */
    tm.social.Nineleap.createFriendDataURL = function(max) {
        max = max || 30;
        return tm.social.Nineleap.createMemoryURL("friends_memories.json", "?max=" + max);
    };
    /**
     * @member      tm.social.Nineleap
     * @method      createRankingDataURL
     * スコアランキング上位のユーザのプレイデータURLを生成
     */
    tm.social.Nineleap.createRankingDataURL = function(max) {
        max = max || 30;
        return tm.social.Nineleap.createMemoryURL("ranking_memories.json", "?max=" + max);
    };
})();


/*
 * chart.js
 */

tm.google = tm.google || {};


(function() {
    
    /**
     * @class tm.google.Chart
     * チャートネームスペース
     */
    tm.google.Chart = tm.google.Chart || {};
    
    var DYNAMIC_ICONS_BASE_URL  = "https://chart.googleapis.com/chart?chst={type}&chld={data}";
    var QR_CODE_BASE_URL        = "https://chart.googleapis.com/chart?chs={size}&cht={type}&chl={text}&chco={color}";
    
    /**
     * @static
     * ダイナミックアイコン
     * @param {string}  type    d_bubble_text_small OR d_fnote_title OR chst=d_fnote etc...
     * @param {string}  data    
     * ### Example
     *      tm.google.Chart.createDynamicIcons("d_bubble_icon_text_small", "ski|bb|Hello, world!|FFFFFF|000000");
     *      tm.google.Chart.createDynamicIcons("d_fnote", "balloon|1|000000|l|Hello, world!");
     *      tm.google.Chart.createDynamicIcons("d_fnote", "pinned_c|1|000000|l|Hello, world!");
     *      tm.google.Chart.createDynamicIcons("d_weather", "taped_y|sunny|Barcelona|max+25°C|min+15°C");
     *      tm.google.Chart.createDynamicIcons("d_simple_text_icon_left", "flag_jp|14|000|flag_jp|24|000|FFF");
     */
    tm.google.Chart.createDynamicIcons = function(type, data) {
        // data = encodeURIComponent(data);
        return DYNAMIC_ICONS_BASE_URL.format({
            type:type,
            data:data
        });
    };
    
    /**
     * @static
     * QRCode 生成
     * @param {Object} prop
     * ### Reference
     * - <https://developers.google.com/chart/?hl=ja#qrcodes>
     * - <https://developers.google.com/chart/infographics/?hl=ja>
     * - <https://google-developers.appspot.com/chart/infographics/docs/overview>
     * ### Example
     *      tm.google.Chart.createQRCode("160x160", "http://tmlife.net");
     *      tm.google.Chart.createQRCode("160x160", "Hello, world");
     */
    tm.google.Chart.createQRCode = function(size, text, color) {
        text = encodeURIComponent(text);
        
        return QR_CODE_BASE_URL.format({
            type:"qr",
            size:size,
            text:text,
        });
    };
    
    /**
     * @static
     * Tex 生成
     */
    tm.google.Chart.createTeX = function() {
        //&chco=ff0000ff
    };
    
})();


;(function() {
    
    /**
     * @member      tm.app.Element
     * @property    interaction
     * インタラクション
     */
    tm.app.Element.prototype.getter("interaction", function() {
        console.assert(false, "interaction は Object2d に統合されました. obj.setInteractive(true); とすればタッチ判定が有効になります.");
    });
    
    
    var dirtyClass = {
        "display": [
            "Sprite",
            "Shape",
            "CircleShape",
            "TriangleShape",
            "RectangleShape",
            "RoundRectangleShape",
            "StarShape",
            "PolygonShape",
            "HeartShape",
            "TextShape",
            "CanvasRenderer",
            "BoundingRectRenderer",
            "Label",
            "MapSprite",
            "CanvasElement",
            "CanvasApp",
            "AnimationSprite",
            "SpriteSheet",
        ],
        "ui": [
            "LabelButton",
            "IconButton",
            "GlossyButton",
            "FlatButton",
            "LoadingScene",
        ],
    };
    
    for (var key in dirtyClass) {
        var namespace = dirtyClass[key];
        namespace.each(function(className) {
            tm.app[className] = tm[key][className];
        });
    }
    
    tm.asset.AssetManager = tm.asset.Manager;

    tm.util.getter('Script', function() {
        console.warn('`tm.util.Script` は `tm.asset.Script` になりました!');
    });

    tm.ui.LoadingScene = function(param) {
        console.warn('`tm.ui.LoadingScene` は `tm.game.LoadingScene` になりました!');
        return tm.game.LoadingScene(param);
    };

    tm.scene = tm.scene || {};
    tm.scene.ManagerScene = tm.game.ManagerScene;
    tm.scene.LoadingScene = tm.game.LoadingScene;
    tm.scene.TitleScene = tm.game.TitleScene;
    tm.scene.ResultScene = tm.game.ResultScene;
    tm.scene.NumericalInputScene = tm.game.NumericalInputScene;
    
    tm.getter('scene', function() {
        debugger;
        console.warn('tm.scene は tm.game に変更されました');
        return tm.game;
    });

})();

/*
 * bulletml.js v0.5.0
 * https://github.com/daishihmr/bulletml.js
 * 
 * The MIT License (MIT)
 * Copyright © 2014 daishi_hmr, dev7.jp
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the “Software”), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions
 * of the Software.
 * 
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
 
/**
 * @preserve bulletml.js v0.6.0-SNAPSHOT
 *
 * License
 * http://daishihmr.mit-license.org/
 */

/** @namespace */
var bulletml = {};
/** @const */
bulletml.GLOBAL = this;

(function() {
    /**
     * @constructor
     */
    bulletml.Node = function() {};

    /**
     *
     */
    bulletml.Node.prototype.scan = function(func) {
        func(this);
        for (var key in this) if (this.hasOwnProperty(key)) {
            var child = this[key];
            if (child instanceof bulletml.Node) {
                child.scan(func);
            }
        }
    };

    /**
     * bulletmlのルート要素.
     *
     * @constructor
     * @param {Object=} data
     */
    bulletml.Root = function(data) {
        bulletml.Node.call(this);

        /**
         * @type {string}
         */
        this.type = "none";
        /**
         * @type {bulletml.Root}
         */
        this.root = this;
        /**
         * top level action elements.
         *
         * @type {Array.<bulletml.Action>}
         */
        this.actions = [];
        /**
         * top level bullet elements.
         *
         * @type {Array.<bulletml.Bullet>}
         */
        this.bullets = [];
        /**
         * top level fire elements.
         *
         * @type {Array.<bulletml.Fire>}
         */
        this.fires = [];

        if (data !== undefined) {
            for (var prop in data) if (data.hasOwnProperty(prop)) {
                data[prop].label = prop;
                if (data[prop] instanceof bulletml.Action) {
                    this.actions.push(data[prop]);
                } else if (data[prop] instanceof bulletml.Bullet) {
                    this.bullets.push(data[prop]);
                } else if (data[prop] instanceof bulletml.Fire) {
                    this.fires.push(data[prop]);
                }
            }

            for (var i = 0, end = this.actions.length; i < end; i++) {
                this.actions[i].setRoot(this);
            }
            for (var i = 0, end = this.bullets.length; i < end; i++) {
                this.bullets[i].setRoot(this);
            }
            for (var i = 0, end = this.fires.length; i < end; i++) {
                this.fires[i].setRoot(this);
            }
        }
    };

    bulletml.Root.prototype = Object.create(bulletml.Node.prototype);

    /**
     * find top level action element by label.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Action}
     */
    bulletml.Root.prototype.findAction = function(label) {
        return search(this.actions, label);
    };

    /**
     * find actions label starts with 'top'.
     *
     * @return {Array.<string>}
     */
    bulletml.Root.prototype.getTopActionLabels = function() {
        var result = [];
        for ( var i = 0, end = this.actions.length; i < end; i++) {
            var action = this.actions[i];
            if (action.label && action.label.indexOf("top") === 0) {
                result[result.length] = action.label;
            }
        }
        return result;
    };

    /**
     * find top level action element by label. throw error if action is
     * undefined.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Action}
     */
    bulletml.Root.prototype.findActionOrThrow = function(label) {
        var result;
        if (result = this.findAction(label)) {
            return result;
        } else {
            throw new Error("action labeled '" + label + "' is undefined.");
        }
    };

    /**
     * find top level bullet element by label.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Bullet}
     */
    bulletml.Root.prototype.findBullet = function(label) {
        return search(this.bullets, label);
    };

    /**
     * find top level bullet element by label. throw error if bullet is
     * undefined.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Bullet}
     */
    bulletml.Root.prototype.findBulletOrThrow = function(label) {
        var result;
        if (result = this.findBullet(label)) {
            return result;
        } else {
            throw new Error("bullet labeled '" + label + "' is undefined.");
        }
    };

    /**
     * find top level fire element by label.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Fire}
     */
    bulletml.Root.prototype.findFire = function(label) {
        return search(this.fires, label);
    };

    /**
     * find top level fire element by label. throw error if fire is undefined.
     *
     * @param {string}
     *            label label attribute value
     * @return {bulletml.Fire}
     */
    bulletml.Root.prototype.findFireOrThrow = function(label) {
        var result;
        if (result = this.findFire(label)) {
            return result;
        } else {
            throw new Error("fire labeled '" + label + "' is undefined.");
        }
    };

    /**
     * bullet要素.
     *
     * @constructor
     */
    bulletml.Bullet = function() {
        bulletml.Node.call(this);

        /**
         * @type {?string}
         */
        this.label = null;
        /**
         * @type {bulletml.Root}
         */
        this.root = null;
        /**
         * @type {bulletml.Direction}
         */
        this.direction = new bulletml.Direction(0);
        /**
         * @type {bulletml.Speed}
         */
        this.speed = new bulletml.Speed(1);
        /**
         * @type {Array.<bulletml.Command>}
         */
        this.actions = [];
        /**
         * @type {Object}
         */
        this.option = {};
        this._localScope = {};
    };

    bulletml.Bullet.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @return {bulletml.Bullet}
     */
    bulletml.Bullet.prototype.clone = function(walker) {
        var c = new bulletml.Bullet();
        c.label = this.label;
        c.root = this.root;
        c.actions = this.actions;
        c.direction = new bulletml.Direction(walker._evalParam(this.direction.value));
        c.direction.type = this.direction.type;
        c.speed = new bulletml.Speed(walker._evalParam(this.speed.value));
        c.speed.type = this.speed.type;
        c.option = this.option;
        c._localScope = walker._localScope;
        return c;
    };

    /**
     * @param {bulletml.Root} root
     */
    bulletml.Bullet.prototype.setRoot = function(root) {
        this.root = root;
        for (var i = 0, end = this.actions.length; i < end; i++) {
            this.actions[i].setRoot(root);
        }
    };

    /**
     * @constructor
     * @param {string} label
     */
    bulletml.BulletRef = function(label) {
        bulletml.Node.call(this);

        this.root = null;
        /**
         * @type {string}
         */
        this.label = label;
        /**
         */
        this.params = [];
    };

    bulletml.BulletRef.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @return {bulletml.BulletRef}
     */
    bulletml.BulletRef.prototype.clone = function(walker) {
        var bkup = walker._localScope;
        walker._localScope = walker._newScope(this.params);
        var b = this.root.findBulletOrThrow(this.label).clone(walker);
        walker._localScope = bkup;
        return b;
    };

    /**
     * @param {bulletml.Root} root
     */
    bulletml.BulletRef.prototype.setRoot = function(root) {
        this.root = root;
    };

    // commandクラス --------------------------------------------

    /**
     * 命令を表す抽象クラス.
     *
     * Actionのcommands配列に格納される.
     *
     * @constructor
     */
    bulletml.Command = function() {
        bulletml.Node.call(this);

        /**
         * @type {string}
         */
        this.commandName = "";
    };

    bulletml.Command.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @param {bulletml.Root} root
     */
    bulletml.Command.prototype.setRoot = function(root) {
        this.root = root;
    };

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     */
    bulletml.Action = function() {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "action";
        /**
         * @type {?string}
         */
        this.label = null;
        /**
         * @type {bulletml.Root}
         */
        this.root = null;
        /**
         * @type {Array.<bulletml.Command>}
         */
        this.commands = [];
        /**
         * @type {Array.<(string|number)>}
         */
        this.params = [];
    };

    bulletml.Action.prototype = Object.create(bulletml.Command.prototype);

    /** @inheritDoc */
    bulletml.Action.prototype.setRoot = function(root) {
        this.root = root;
        for (var i = 0, end = this.commands.length; i < end; i++) {
            this.commands[i].setRoot(root);
        }
    };

    /** @return {bulletml.Action} */
    bulletml.Action.prototype.clone = function() {
        var c = new bulletml.Action();
        c.label = this.label;
        c.root = this.root;
        c.commands = this.commands;
        return c;
    };

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     * @param {string} label
     */
    bulletml.ActionRef = function(label) {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "actionRef";
        /**
         * @type {string}
         */
        this.label = label;
        /**
         * @type {bulletml.Root}
         */
        this.root = null;
        /**
         */
        this.params = [];
    };

    bulletml.ActionRef.prototype = Object.create(bulletml.Command.prototype);

    bulletml.ActionRef.prototype.clone = function() {
        var c = new bulletml.Action();
        c.root = this.root;
        c.commands.push(this);
        return c;
    };

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     */
    bulletml.Fire = function() {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "fire";
        /**
         * @type {?string}
         */
        this.label = null;
        /**
         * @type {bulletml.Root}
         */
        this.root = null;
        /**
         * @type {bulletml.Direction}
         */
        this.direction = null;
        /**
         * @type {bulletml.Speed}
         */
        this.speed = null;
        /**
         * @type {(bulletml.Bullet|bulletml.BulletRef)}
         */
        this.bullet = null;
        /**
         * @type {bulletml.FireOption}
         */
        this.option = new bulletml.FireOption();
    };

    bulletml.Fire.prototype = Object.create(bulletml.Command.prototype);

    /** @inheritDoc */
    bulletml.Fire.prototype.setRoot = function(root) {
        this.root = root;
        // console.log("this.bullet = ", this.bullet);
        if (this.bullet) this.bullet.setRoot(root);
    };

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     * @param {string} label
     */
    bulletml.FireRef = function(label) {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "fireRef";
        /**
         * @type {string}
         */
        this.label = label;
        /**
         */
        this.params = [];
    };

    bulletml.FireRef.prototype = Object.create(bulletml.Command.prototype);

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     */
    bulletml.ChangeDirection = function() {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "changeDirection";
        /**
         */
        this.direction = new bulletml.Direction();
        /**
         */
        this.term = 0;
    };

    bulletml.ChangeDirection.prototype = Object.create(bulletml.Command.prototype);

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     */
    bulletml.ChangeSpeed = function() {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "changeSpeed";
        /**
         */
        this.speed = new bulletml.Speed();
        /**
         */
        this.term = 0;
    };

    bulletml.ChangeSpeed.prototype = Object.create(bulletml.Command.prototype);

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     */
    bulletml.Accel = function() {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "accel";
        /**
         */
        this.horizontal = new bulletml.Horizontal();
        /**
         */
        this.vertical = new bulletml.Vertical();
        /**
         */
        this.term = 0;
    };

    bulletml.Accel.prototype = Object.create(bulletml.Command.prototype);

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     * @param {(number|string)=} value
     */
    bulletml.Wait = function(value) {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "wait";
        /**
         * @type {(number|string)}
         */
        this.value = value || 0;
    };

    bulletml.Wait.prototype = Object.create(bulletml.Command.prototype);

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     */
    bulletml.Vanish = function() {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "vanish";
    };
    bulletml.Vanish.prototype = Object.create(bulletml.Command.prototype);

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     */
    bulletml.Repeat = function() {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "repeat";
        /**
         * @type {(number|string)}
         */
        this.times = 0;
        /**
         * @type {(bulletml.Action||bulletml.ActionRef)}
         */
        this.action = null;
        /**
         * @type {Array.<(string|number)>}
         */
        this.params = [];
    };

    bulletml.Repeat.prototype = Object.create(bulletml.Command.prototype);

    bulletml.Repeat.prototype.setRoot = function(root) {
        this.root = root;
        if (this.action) this.action.setRoot(root);
    };

    /**
     * @constructor
     * @extends {bulletml.Command}
     * @augments bulletml.Command
     * @param {string} variable
     * @param {(string|number)} expression
     * @since 0.5
     */
    bulletml.Bind = function(variable, expression) {
        bulletml.Command.call(this);

        /**
         * @type {string}
         */
        this.commandName = "bind";
        this.variable = variable;
        this.expression = expression;
    };

    bulletml.Bind.prototype = Object.create(bulletml.Command.prototype);

    /**
     * @constructor
     * @param {string} eventName
     * @param {?Array} params
     * @since 0.5
     */
    bulletml.Notify = function(eventName, params) {
        bulletml.Command.call(this);

        this.commandName = "notify";
        this.eventName = eventName;
        this.params = params || null;
    };

    bulletml.Notify.prototype = Object.create(bulletml.Command.prototype);

    bulletml.DummyCommand = new bulletml.Command();

    // valueクラス -----------------------------------------------

    /**
     * @constructor
     * @param {(number|string)=} value
     */
    bulletml.Direction = function(value) {
        bulletml.Node.call(this);

        /**
         * @type {string}
         */
        this.type = "aim";
        /**
         * @type {(string|number)}
         */
        this.value = value || 0;
    };

    bulletml.Direction.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @constructor
     * @param {(number|string)=} value
     */
    bulletml.Speed = function(value) {
        bulletml.Node.call(this);

        /**
         * @type {string}
         */
        this.type = "absolute";
        /**
         * @type {(string|number)}
         */
        this.value = (value === undefined) ? 1 : value;
    };

    bulletml.Speed.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @constructor
     * @param {(number|string)=} value
     */
    bulletml.Horizontal = function(value) {
        bulletml.Node.call(this);

        /**
         * @type {string}
         */
        this.type = "absolute";
        /**
         * @type {(string|number)}
         */
        this.value = value || 0;
    };

    bulletml.Horizontal.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @constructor
     * @param {(number|string)=} value
     */
    bulletml.Vertical = function(value) {
        bulletml.Node.call(this);

        /**
         * @type {string}
         */
        this.type = "absolute";
        /**
         * @type {(string|number)}
         */
        this.value = value || 0;
    };

    bulletml.Vertical.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @constructor
     * @param {Object=} params
     * @since 0.5
     */
    bulletml.FireOption = function(params) {
        bulletml.Node.call(this);

        params = params || {};

        /**
         * @type {(string|number)}
         */
        this.offsetX = params.offsetX || 0;
        /**
         * @type {(string|number)}
         */
        this.offsetY = params.offsetY || 0;
        /**
         * @type {boolean}
         */
        this.autonomy = true;
        if (params.autonomy !== undefined) {
            this.autonomy = !!params.autonomy;
        }
    };

    bulletml.FireOption.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @constructor
     * @param {number=} value
     * @since 0.5
     */
    bulletml.OffsetX = function(value) {
        bulletml.Node.call(this);

        this.value = value || 0;
    };

    bulletml.OffsetX.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @constructor
     * @param {number=} value
     * @since 0.5
     */
    bulletml.OffsetY = function(value) {
        bulletml.Node.call(this);

        this.value = value || 0;
    };

    bulletml.OffsetY.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @constructor
     * @param {boolean=} value
     * @since 0.5
     */
    bulletml.Autonomy = function(value) {
        bulletml.Node.call(this);

        this.value = !!value;
    };

    bulletml.Autonomy.prototype = Object.create(bulletml.Node.prototype);

    /**
     * @param {Array.<(bulletml.Bullet|bulletml.Action|bulletml.Fire)>} array
     * @param {string} label
     */
    function search(array, label) {
        for ( var i = 0, end = array.length; i < end; i++) {
            if (array[i].label == label) {
                return array[i];
            }
        }
    }

})();

(function() {

    /**
     * @constructor
     * @param {bulletml.Root} root
     */
    bulletml.Walker = function(root) {
        this._root = root;
        /**
         * callstack.
         * @type {Array}
         */
        this._stack = [];
        /**
         * program counter.
         * @type {number}
         */
        this._cursor = -1;
        /**
         * @type {bulletml.Action}
         */
        this._action = null;
        /**
         * current localScope variables.
         * @type {Object.<string,number>}
         */
        this._localScope = {};
    };

    /**
     * @return {bulletml.Command}
     */
    bulletml.Walker.prototype.next = function() {
        this._cursor += 1;
        if (this._action !== null) {
            var n = this._action.commands[this._cursor];

            if (n !== undefined) {
                // console.log(n.commandName, n.label, this._localScope);
                if (n instanceof bulletml.Action) {
                    this._pushStack();
                    this._action = n;
                    this._localScope = this._cloneScope();
                    return this.next();
                } else if (n instanceof bulletml.ActionRef) {
                    this._pushStack();
                    this._action = this._root.findActionOrThrow(n.label);
                    this._localScope = this._newScope(n.params);
                    return this.next();
                } else if (n instanceof bulletml.Repeat) {
                    this._localScope.loopCounter = 0;
                    this._localScope.loopEnd = this._evalParam(n.times);
                    this._pushStack();
                    this._action = n.action.clone();
                    this._localScope = this._cloneScope();
                    return this.next();
                } else if (n instanceof bulletml.Fire) {
                    var f = new bulletml.Fire();
                    f.bullet = n.bullet.clone(this);
                    if (n.direction !== null) {
                        f.direction = new bulletml.Direction(this._evalParam(n.direction.value));
                        f.direction.type = n.direction.type;
                    }
                    if (n.speed !== null) {
                        f.speed = new bulletml.Speed(this._evalParam(n.speed.value));
                        f.speed.type = n.speed.type;
                    }
                    f.option = new bulletml.FireOption();
                    f.option.offsetX = this._evalParam(n.option.offsetX);
                    f.option.offsetY = this._evalParam(n.option.offsetY);
                    f.option.autonomy = n.option.autonomy;
                    return f;
                } else if (n instanceof bulletml.FireRef) {
                    this._pushStack();
                    this._action = new bulletml.Action();
                    this._action.commands = [ this._root.findFireOrThrow(n.label) ];
                    this._localScope = this._newScope(n.params);
                    return this.next();
                } else if (n instanceof bulletml.ChangeDirection) {
                    var cd = new bulletml.ChangeDirection();
                    cd.direction.type = n.direction.type;
                    cd.direction.value = this._evalParam(n.direction.value);
                    cd.term = this._evalParam(n.term);
                    return cd;
                } else if (n instanceof bulletml.ChangeSpeed) {
                    var cs = new bulletml.ChangeSpeed();
                    cs.speed.type = n.speed.type;
                    cs.speed.value = this._evalParam(n.speed.value);
                    cs.term = this._evalParam(n.term);
                    return cs;
                } else if (n instanceof bulletml.Accel) {
                    var a = new bulletml.Accel();
                    a.horizontal.type = n.horizontal.type;
                    a.horizontal.value = this._evalParam(n.horizontal.value);
                    a.vertical.type = n.vertical.type;
                    a.vertical.value = this._evalParam(n.vertical.value);
                    a.term = this._evalParam(n.term);
                    return a;
                } else if (n instanceof bulletml.Wait) {
                    return new bulletml.Wait(this._evalParam(n.value));
                } else if (n instanceof bulletml.Vanish) {
                    return n;
                } else if (n instanceof bulletml.Bind) {
                    // console.log("bind " + n.variable + " <- " + n.expression);
                    this._localScope["$" + n.variable] = this._evalParam(n.expression);
                    // console.log("    = " + this._localScope["$" + n.variable]);
                    return bulletml.DummyCommand;
                } else if (n instanceof bulletml.Notify) {
                    return n;
                } else {
                    return null;
                }
            } else {
                this._popStack();
                if (this._action === null) {
                    return null;
                }
                n = this._action.commands[this._cursor];
                if (n && n.commandName == "repeat") {
                    this._localScope.loopCounter++;
                    if (this._localScope.loopCounter < this._localScope.loopEnd) {
                        this._pushStack();
                        this._action = n.action.clone();
                        this._localScope = this._cloneScope();
                        return this.next();
                    } else {
                        return this.next();
                    }
                } else {
                    return this.next();
                }
            }
        } else {
            return null;
        }
    };

    bulletml.Walker.prototype._pushStack = function() {
        // console.log("_pushStack");
        this._stack.push({
            action : this._action,
            cursor : this._cursor,
            scope : this._localScope
        });
        this._cursor = -1;
    };

    bulletml.Walker.prototype._popStack = function() {
        // console.log("_popStack");
        var p = this._stack.pop();
        if (p) {
            this._cursor = p.cursor;
            this._action = p.action;
            this._localScope = p.scope;
        } else {
            this._cursor = -1;
            this._action = null;
            this._localScope = {};
        }
    };
    /**
     * @param {(number|string)} exp
     * @return {number}
     */
    bulletml.Walker.prototype._evalParam = function(exp) {
        // console.log("eval(" + exp + ")", this._localScope);
        // evalを使わずに済む場合
        var n;
        if (typeof exp === "boolean") {
            return exp ? 1 : 0;
        } else if (typeof exp === "number") {
            return exp;
        } else if (!isNaN(n = Number(exp))) {
            return n;
        } else if (n = this._localScope[exp]) {
            return n;
        } else if (n = bulletml.Walker.globalScope[exp]) {
            return n;
        } else if (exp === "$rand") {
            return Math.random();
        }

        var scope = {};
        for ( var prop in bulletml.Walker.globalScope) {
            if (bulletml.Walker.globalScope.hasOwnProperty(prop)) {
                scope[prop] = bulletml.Walker.globalScope[prop];
            }
        }
        for ( var prop in this._localScope) {
            if (this._localScope.hasOwnProperty(prop)) {
                scope[prop] = this._localScope[prop];
            }
        }
        scope["$rand"] = Math.random();
        var upperScope = this._stack[this._stack.length - 1];
        if (upperScope) {
            scope["$loop"] = {
                "index": upperScope.scope.loopCounter,
                "count": upperScope.scope.loopCounter + 1,
                "first": upperScope.scope.loopCounter === 0,
                "last": (upperScope.scope.loopCounter + 1) >= upperScope.scope.loopEnd,
            };
        }
        // console.log(scope);
        var f = new Function("return " + exp.split("$").join("this.$"));
        // console.log(f);
        var result = f.apply(scope);
        // console.log(result);
        return result;
    };

    bulletml.Walker.prototype._newScope = function(params) {
        var result = {};
        if (params) {
            for ( var i = 0, end = params.length; i < end; i++) {
                result["$" + (i + 1)] = this._evalParam(params[i]);
            }
        } else {
            for ( var prop in this._localScope)
                if (this._localScope.hasOwnProperty(prop)) {
                    result[prop] = this._localScope[prop];
                }
        }
        return result;
    };

    bulletml.Walker.prototype._cloneScope = function() {
        var result = {};
        for ( var prop in this._localScope)
            if (this._localScope.hasOwnProperty(prop)) {
                result[prop] = this._localScope[prop];
            }
        return result;
    };


    /**
     * @return {bulletml.Walker}
     */
    bulletml.Root.prototype.getWalker = function(actionLabel) {
        var w = new bulletml.Walker(this);
        var action = this.findAction(actionLabel);
        if (action) {
            w._action = action;
        }
        return w;
    };

    /**
     * @return {bulletml.Walker}
     */
    bulletml.Bullet.prototype.getWalker = function() {
        var w = new bulletml.Walker(this.root);
        var action = new bulletml.Action();
        action.root = this.root;
        action.commands = this.actions;
        w._action = action;
        w._localScope = this._localScope;
        return w;
    };

    bulletml.Walker.globalScope = {};

})();

(function() {

    /**
     * BulletMLを解析し、JavaScriptオブジェクトツリーを生成する.
     *
     * @param {(string|Document|Object)} data 弾幕定義
     * @return {bulletml.Root}
     */
    bulletml.buildXML = function(data) {
        var result;
        if (typeof data === "string") {
            var domParser = new DOMParser();
            result = parse(domParser.parseFromString(data, "application/xml"));
        } else if (data.getElementsByTagName("bulletml")) {
            result = parse(data);
        } else {
            throw new Error("cannot build " + data);
        }
        return result;
    };

    function parse(element) {
        var result = new bulletml.Root();

        var root = element.getElementsByTagName("bulletml")[0];
        if (!root) {
            return;
        }

        attr(root, "type", function(type) {
            result.type = type;
        });

        // Top Level Actions
        var actions = root.getElementsByTagName("action");
        if (actions) {
            for ( var i = 0, end = actions.length; i < end; i++) {
                if (actions[i].parentNode !== root) continue;
                var newAction = parseAction(result, actions[i]);
                if (newAction) {
                    result.actions[result.actions.length] = newAction;
                }
            }
        }

        // Top Level Bullets
        var bullets = root.getElementsByTagName("bullet");
        if (bullets) {
            for ( var i = 0, end = bullets.length; i < end; i++) {
                if (bullets[i].parentNode !== root) continue;
                var newBullet = parseBullet(result, bullets[i]);
                if (newBullet) {
                    result.bullets[result.bullets.length] = newBullet;
                }
            }
        }

        // Top Level Fires
        var fires = root.getElementsByTagName("fire");
        if (fires) {
            for ( var i = 0, end = fires.length; i < end; i++) {
                if (fires[i].parentNode !== root) continue;
                var newFire = parseFire(result, fires[i]);
                if (newFire) {
                    result.fires[result.fires.length] = newFire;
                }
            }
        }

        return result;
    }

    function parseAction(root, element) {
        var result = new bulletml.Action();
        attr(element, "label", function(label) {
            result.label = label;
        });
        each(element, ".", function(commandElm) {
            switch (commandElm.tagName.toLowerCase()) {
            case "action":
                result.commands[result.commands.length] = parseAction(root, commandElm);
                break;
            case "actionref":
                result.commands[result.commands.length] = parseActionRef(root, commandElm);
                break;
            case "fire":
                result.commands[result.commands.length] = parseFire(root, commandElm);
                break;
            case "fireref":
                result.commands[result.commands.length] = parseFireRef(root, commandElm);
                break;
            case "changedirection":
                result.commands[result.commands.length] = parseChangeDirection(root, commandElm);
                break;
            case "changespeed":
                result.commands[result.commands.length] = parseChangeSpeed(root, commandElm);
                break;
            case "accel":
                result.commands[result.commands.length] = parseAccel(root, commandElm);
                break;
            case "wait":
                result.commands[result.commands.length] = parseWait(root, commandElm);
                break;
            case "vanish":
                result.commands[result.commands.length] = parseVanish(root, commandElm);
                break;
            case "repeat":
                result.commands[result.commands.length] = parseRepeat(root, commandElm);
                break;
            }
        });

        result.root = root;
        return result;
    }

    function parseActionRef(root, element) {
        var result = new bulletml.ActionRef(attr(element, "label"));

        each(element, /param$/, function(param) {
            result.params[result.params.length] = text(param);
        });
        result.root = root;

        return result;
    }

    function parseBullet(root, element) {
        var result = new bulletml.Bullet();

        attr(element, "label", function(label) {
            result.label = label;
        });
        get(element, "direction", function(direction) {
            result.direction = parseDirection(direction);
        });
        get(element, "speed", function(speed) {
            result.speed = parseSpeed(speed);
        });
        each(element, /(action)|(actionRef)$/, function(action) {
            if (action.tagName.toLowerCase() == "action") {
                result.actions[result.actions.length] = parseAction(root,
                        action);
            } else if (action.tagName.toLowerCase() == "actionref") {
                result.actions[result.actions.length] = parseActionRef(root,
                        action);
            }
        });
        result.root = root;

        return result;
    }

    function parseBulletRef(root, element) {
        var result = new bulletml.BulletRef(attr(element, "label"));

        each(element, /param$/, function(param) {
            result.params[result.params.length] = text(param);
        });
        result.root = root;

        return result;
    }

    function parseFire(root, element) {
        var result = new bulletml.Fire();

        attr(element, "label", function(label) {
            result.label = label;
        });
        get(element, "direction", function(direction) {
            result.direction = parseDirection(direction);
        })
        get(element, "speed", function(speed) {
            result.speed = parseSpeed(speed);
        })
        get(element, "bullet", function(bullet) {
            result.bullet = parseBullet(root, bullet);
        });
        get(element, "bulletref", function(bulletRef) {
            result.bullet = parseBulletRef(root, bulletRef);
        });

        if (!result.bullet) {
            throw new Error("fire has no bullet or bulletRef.");
        }

        result.root = root;
        return result;
    }

    function parseFireRef(root, element) {
        var result = new bulletml.FireRef(attr(element, "label"));

        each(element, /param$/, function(param) {
            result.params[result.params.length] = text(param);
        });
        result.root = root;

        return result;
    }

    function parseChangeDirection(root, element) {
        var result = new bulletml.ChangeDirection();
        result.root = root;

        get(element, "direction", function(direction) {
            result.direction = parseDirection(direction);
        });
        get(element, "term", function(term) {
            result.term = text(term);
        });

        return result;
    }

    function parseChangeSpeed(root, element) {
        var result = new bulletml.ChangeSpeed();
        result.root = root;

        get(element, "speed", function(speed) {
            result.speed = parseSpeed(speed);
        });
        get(element, "term", function(term) {
            result.term = text(term);
        });

        return result;
    }

    function parseAccel(root, element) {
        var result = new bulletml.Accel();
        result.root = root;

        get(element, "horizontal", function(horizontal) {
            result.horizontal = parseHorizontal(horizontal);
        });
        get(element, "vertical", function(vertical) {
            result.vertical = parseVertical(vertical);
        });
        get(element, "term", function(term) {
            result.term = text(term);
        });

        return result;
    }

    function parseWait(root, element) {
        var result = new bulletml.Wait();
        result.root = root;

        result.value = text(element);

        return result;
    }

    function parseVanish(root, element) {
        var result = new bulletml.Vanish();
        result.root = root;
        return result;
    }

    function parseRepeat(root, element) {
        var result = new bulletml.Repeat();

        get(element, "action", function(action) {
            result.action = parseAction(root, action);
        });
        get(element, "actionRef", function(actionRef) {
            result.action = parseActionRef(root, actionRef);
        });
        get(element, "times", function(times) {
            result.times = text(times);
        });
        result.root = root;

        return result;
    }

    function parseDirection(element) {
        return setTypeAndValue(new bulletml.Direction(), element);
    }

    function parseSpeed(element) {
        return setTypeAndValue(new bulletml.Speed(), element);
    }

    function parseHorizontal(element) {
        return setTypeAndValue(new bulletml.Horizontal(), element);
    }

    function parseVertical(element) {
        return setTypeAndValue(new bulletml.Vertical(), element);
    }

    function setTypeAndValue(obj, element) {
        attr(element, "type", function(type) {
            obj.type = type;
        });
        text(element, function(val) {
            obj.value = val;
        });
        return obj;
    }

    /**
     * @param {Element} element
     * @param {string} tagName
     * @param {function(Element)=} callback
     * @param {function()=} ifNotFound
     * @return {Element}
     */
    function get(element, tagName, callback, ifNotFound) {
        tagName = tagName.toLowerCase();
        var children = element.childNodes;
        for ( var i = 0, end = children.length; i < end; i++) {
            if (children[i].tagName && children[i].tagName.toLowerCase() == tagName) {
                if (callback) {
                    callback(children[i]);
                }
                return children[i];
            }
        }
        if (ifNotFound) {
            ifNotFound();
        }
        return null;
    }

    /**
     * @param {Element} element
     * @param {(string|RegExp)} filter
     * @param {function(Element)} callback
     */
    function each(element, filter, callback) {
        var children = element.childNodes;
        for ( var i = 0, end = children.length; i < end; i++) {
            if (children[i].tagName && children[i].tagName.toLowerCase().match(filter)) {
                callback(children[i]);
            }
        }
    }
    /**
     * @param {Element} element
     * @param {string} attrName
     * @param {function(string)=} callback
     * @param {function()=} ifNotFound
     * @return {string}
     */
    function attr(element, attrName, callback, ifNotFound) {
        var attrs = element.attributes;
        var attr = attrs[attrName];
        if (attr) {
            if (callback) {
                callback(attr.value);
            }
            return attr.value;
        } else if (ifNotFound) {
            ifNotFound();
        }
        return "";
    }

    /**
     * @param {Element} element
     * @param {function(string)=} callback
     * @return {string}
     */
    function text(element, callback) {
        var result = element.textContent.trim();
        if (result !== undefined) {
            if (callback) {
                callback(result);
            }
            return result;
        }
        return "";
    }

})();

(function() {

    /**
     * @namespace
     * @param {string} prefix
     */
    bulletml.dsl = function(prefix) {
        prefix = prefix || "";
        for (var func in bulletml.dsl) if (bulletml.dsl.hasOwnProperty(func)) {
            bulletml.GLOBAL[prefix + func] = bulletml.dsl[func];
        }
    };

    /**
     * Action要素を作る.
     *
     * @param {...(bulletml.Command|Array.<bulletml.Command>)} commands
     * <ol>
     *   <li>1個または複数のCommand（可変長引数）.
     *   <li>Commandの配列.
     * </ol>
     * @return {bulletml.Action}
     */
    bulletml.dsl.action = function(commands) {
        if (arguments.length > 0) {
            for (var i = 0, end = arguments.length; i < end; i++) {
                if (arguments[i] instanceof Function) {
                    arguments[i] = arguments[i]();
                }
            }
        }
        if (commands instanceof Array) {
            for (var i = 0, end = commands.length; i < end; i++) {
                if (commands[i] instanceof Function) {
                    commands[i] = commands[i]();
                }
            }
        }

        var result = new bulletml.Action();
        if (commands instanceof Array) {
            if (commands.some(function(c) {
                return !(c instanceof bulletml.Command);
            })) {
                throw new Error("argument type error.");
            }
            result.commands = commands;
        } else {
            for (var i = 0, end = arguments.length; i < end; i++) {
                if (arguments[i] instanceof bulletml.Command) {
                    result.commands[i] = arguments[i];
                } else {
                    throw new Error("argument type error.");
                }
            }
        }
        return result;
    };

    /**
     * @param {string} label
     * @return {bulletml.ActionRef}
     */
    bulletml.dsl.actionRef = function(label, args) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (label === undefined) throw new Error("label is required.");
        var result = new bulletml.ActionRef(label);
        if (args instanceof Array) {
            result.params = args;
        } else {
            for (var i = 1; i < arguments.length; i++) {
                result.params.push(arguments[i]);
            }
        }
        return result;
    };

    /**
     * @param {string} label
     * @return {bulletml.Bullet}
     */     
    bulletml.dsl.bullet = function(direction, speed, action, label) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        var result = new bulletml.Bullet();
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof bulletml.Direction) {
                result.direction = arguments[i];
            } else if (arguments[i] instanceof bulletml.Speed) {
                result.speed = arguments[i];
            } else if (arguments[i] instanceof bulletml.Action) {
                result.actions.push(arguments[i]);
            } else if (arguments[i] instanceof bulletml.ActionRef) {
                result.actions.push(arguments[i]);
            } else if (arguments[i] instanceof Array) {
                result.actions.push(bulletml.dsl.action(arguments[i]));
            } else if (arguments[i] instanceof Object) {
                result.option = arguments[i];
            } else if (typeof(arguments[i]) === "string") {
                result.label = arguments[i];
            }
        }
        return result;
    };

    /**
     * @param {string} label
     * @return {bulletml.BulletRef}
     */     
    bulletml.dsl.bulletRef = function(label, args) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (label === undefined) throw new Error("label is required.");
        var result = new bulletml.BulletRef(label);
        if (args instanceof Array) {
            result.params = args;
        } else {
            for (var i = 1; i < arguments.length; i++) {
                result.params.push(arguments[i]);
            }
        }
        return result;
    };

    /**
     * @return {bulletml.Fire}
     */     
    bulletml.dsl.fire = function(bullet, direction, speed, fireOption) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        var result = new bulletml.Fire();
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof bulletml.Direction) {
                result.direction = arguments[i];
            } else if (arguments[i] instanceof bulletml.Speed) {
                result.speed = arguments[i];
            } else if (arguments[i] instanceof bulletml.Bullet) {
                result.bullet = arguments[i];
            } else if (arguments[i] instanceof bulletml.BulletRef) {
                result.bullet = arguments[i];
            } else if (arguments[i] instanceof bulletml.FireOption) {
                result.option = arguments[i];
            } else if (arguments[i] instanceof bulletml.OffsetX) {
                result.option.offsetX = arguments[i].value;
            } else if (arguments[i] instanceof bulletml.OffsetY) {
                result.option.offsetY = arguments[i].value;
            } else if (arguments[i] instanceof bulletml.Autonomy) {
                result.option.autonomy = arguments[i].value;
            }
        }
        if (result.bullet === undefined)
            throw new Error("bullet (or bulletRef) is required.");
        return result;
    };

    /**
     * @param {string} label
     * @return {bulletml.FireRef}
     */     
    bulletml.dsl.fireRef = function(label, args) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (label === undefined) throw new Error("label is required.");
        var result = new bulletml.FireRef(label);
        if (args instanceof Array) {
            result.params = args;
        } else {
            for (var i = 1; i < arguments.length; i++) {
                result.params.push(arguments[i]);
            }
        }
        return result;
    };

    /**
     * @return {bulletml.ChangeDirection}
     */     
    bulletml.dsl.changeDirection = function(direction, term) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (direction === undefined) throw new Error("direction is required.");
        if (term === undefined) throw new Error("term is required.");
        var result = new bulletml.ChangeDirection();
        if (direction instanceof bulletml.Direction) {
            result.direction = direction;
        } else {
            result.direction = new bulletml.Direction(direction);
        }
        result.term = term;
        return result;
    };

    /**
     * @return {bulletml.ChangeSpeed}
     */     
    bulletml.dsl.changeSpeed = function(speed, term) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (speed === undefined) throw new Error("speed is required.");
        if (term === undefined) throw new Error("term is required.");
        var result = new bulletml.ChangeSpeed();
        if (speed instanceof bulletml.Speed) {
            result.speed = speed;
        } else {
            result.speed = new bulletml.Speed(speed);
        }
        result.term = term;
        return result;
    };

    /**
     * @return {bulletml.Accel}
     */     
    bulletml.dsl.accel = function(horizontal, vertical, term) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        var result = new bulletml.Accel();
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] instanceof bulletml.Horizontal) {
                result.horizontal = horizontal;
            } else if (arguments[i] instanceof bulletml.Vertical) {
                result.vertical = vertical;
            } else {
                result.term = arguments[i];
            }
        }
        if (result.horizontal === undefined && result.vertical === undefined)
            throw new Error("horizontal or vertical is required.");
        if (result.term === undefined) throw new Error("term is required.");
        return result;
    };

    /**
     * @return {bulletml.Wait}
     */     
    bulletml.dsl.wait = function(value) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (value === undefined) throw new Error("value is required.");
        return new bulletml.Wait(value);
    };

    /**
     * @return {bulletml.Vanish}
     */     
    bulletml.dsl.vanish = function() {
        return new bulletml.Vanish();
    };

    /**
     * @return {bulletml.Repeat}
     */
    bulletml.dsl.repeat = function(times, action) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (times === undefined) throw new Error("times is required.");
        if (action === undefined) throw new Error("action is required.");
        var result = new bulletml.Repeat();
        result.times = times;
        if (action instanceof bulletml.Action || action instanceof bulletml.ActionRef) {
            result.action = action;
        } else if (action instanceof Array) {
            result.action = bulletml.dsl.action(action);
        } else {
            var commands = [];
            for (var i = 1; i < arguments.length; i++) {
                commands.push(arguments[i]);
            }
            result.action = bulletml.dsl.action(commands);
        }
        return result;
    };

    /**
     * @param {string} variable
     * @param {(string|number)} expression
     * @return {bulletml.Bind}
     * @since 0.5
     */
    bulletml.dsl.bindVar = function(variable, expression) {
        return new bulletml.Bind(variable, expression);
    };

    /**
     * @return {bulletml.Notify}
     * @since 0.5
     */
    bulletml.dsl.notify = function(eventName, params) {
        return new bulletml.Notify(eventName, params);
    };

    /**
     * @return {bulletml.Direction}
     */
    bulletml.dsl.direction = function(value, type) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (value === undefined) throw new Error("value is required.");
        var result = new bulletml.Direction(value);
        if (type !== undefined) result.type = type;
        return result;
    };

    /**
     * @return {bulletml.Speed}
     */
    bulletml.dsl.speed = function(value, type) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (value === undefined) throw new Error("value is required.");
        var result = new bulletml.Speed(value);
        if (type) result.type = type;
        return result;
    };

    /**
     * @return {bulletml.Horizontal}
     */
    bulletml.dsl.horizontal = function(value, type) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (value === undefined) throw new Error("value is required.");
        var result = new bulletml.Horizontal(value);
        if (type) result.type = type;
        return result;
    };

    /**
     * @return {bulletml.Vertical}
     */
    bulletml.dsl.vertical = function(value, type) {
        for (var i = 0, end = arguments.length; i < end; i++) {
            if (arguments[i] instanceof Function) {
                arguments[i] = arguments[i]();
            }
        }

        if (value === undefined) throw new Error("value is required.");
        var result = new bulletml.Vertical(value);
        if (type) result.type = type;
        return result;
    };

    /**
     * @param {Object.<string,*>} params
     * @return {bulletml.FireOption}
     * @since 0.5
     */
    bulletml.dsl.fireOption = function(params) {
        return new bulletml.FireOption(params);
    };

    /**
     * @param {number} x
     * @return {bulletml.OffsetX}
     * @since 0.5
     */
    bulletml.dsl.offsetX = function(x) {
        return new bulletml.OffsetX(x);
    };

    /**
     * @param {number} y
     * @return {bulletml.OffsetY}
     * @since 0.5
     */
    bulletml.dsl.offsetY = function(y) {
        return new bulletml.OffsetY(y);
    };

    /**
     * @param {boolean} autonomy
     * @return {bulletml.Autonomy}
     * @since 0.5
     */
    bulletml.dsl.autonomy = function(autonomy) {
        return new bulletml.Autonomy(autonomy);
    };

})();

(function() {

/** @namespace */
bulletml.json = bulletml.json || {};

var classForName = function(name) {
    switch (name) {
        case "bulletml.Root": return bulletml.Root;
        case "bulletml.Bullet": return bulletml.Bullet;
        case "bulletml.BulletRef": return bulletml.BulletRef;
        case "bulletml.Action": return bulletml.Action;
        case "bulletml.ActionRef": return bulletml.ActionRef;
        case "bulletml.Fire": return bulletml.Fire;
        case "bulletml.FireRef": return bulletml.FireRef;
        case "bulletml.ChangeDirection": return bulletml.ChangeDirection;
        case "bulletml.ChangeSpeed": return bulletml.ChangeSpeed;
        case "bulletml.Accel": return bulletml.Accel;
        case "bulletml.Wait": return bulletml.Wait;
        case "bulletml.Vanish": return bulletml.Vanish;
        case "bulletml.Repeat": return bulletml.Repeat;
        case "bulletml.Bind": return bulletml.Bind;
        case "bulletml.Notify": return bulletml.Notify;
        case "bulletml.Direction": return bulletml.Direction;
        case "bulletml.Speed": return bulletml.Speed;
        case "bulletml.Horizontal": return bulletml.Horizontal;
        case "bulletml.Vertical": return bulletml.Vertical;
        case "bulletml.FireOption": return bulletml.FireOption;
        case "bulletml.OffsetX": return bulletml.OffsetX;
        case "bulletml.OffsetY": return bulletml.OffsetY;
        case "bulletml.Autonomy": return bulletml.Autonomy;
        default:
            throw new Error("invalid type: " + name);
    };
};

var sample = {
    actions: [
        {
            type: "Action",
            label: "top",
            commands: [
                {
                    type: "Fire",
                    bullet: {
                        type: "Bullet"
                    },
                    direction: {
                        
                    }
                }
            ]
        }
    ],
    bullets: [
    ],
    fires: [
    ],
};



})();

(function() {

/** @namespace */
bulletml.runner = bulletml.runner || {};

/**
 * @constructor
 * @param {bulletml.Root} root
 */
bulletml.runner.RunnerFactory = function(root) {
    this.root = root;
};

/**
 * @param {Object} config
 * @return {bulletml.runner.Runner}
 */
bulletml.runner.RunnerFactory.prototype.create = function(config) {
    for (var key in bulletml.runner.DEFAULT_CONFIG) if (bulletml.runner.DEFAULT_CONFIG.hasOwnProperty(key)) {
        if (config[key] === undefined) {
            config[key] = bulletml.runner.DEFAULT_CONFIG[key]
        }
    }

    var topLabels = this.root.getTopActionLabels();
    if (topLabels.length === 1) {
        return new bulletml.runner.SubRunner(
            config,
            this.root.getWalker(topLabels[0])
        );
    } else {
        var parentRunner = new bulletml.runner.ParentRunner();
        for (var i = 0, end = topLabels.length; i < end; i++) {
            parentRunner.addSubRunner(new bulletml.runner.SubRunner(
                config,
                this.root.getWalker(topLabels[i])
            ));
        }
        return parentRunner;
    }
};

/**
 * @param {Object} config
 * @param {function(bulletml.runner.Runner)=} callback
 * @return {bulletml.runner.Runner}
 */
bulletml.Root.prototype.createRunner = function(config, callback) {
    var runner = new bulletml.runner.RunnerFactory(this).create(config);
    if (callback) callback(runner);

    return runner;
};

bulletml.runner.DEFAULT_CONFIG = {
    /** @type {number} */
    rank: 0,
    /** @type {?{x: number, y: number}} */
    target: null,
    /** @type {function(bulletml.runner.Runner,Object)} */
    createNewBullet: function(runner, spec) {},
    /** @type {number} */
    speedRate: 1.0,
};

/**
 * @constructor
 */
bulletml.runner.Runner = function() {
    this.x = 0;
    this.y = 0;
};
bulletml.runner.Runner.prototype = {
    constructor: bulletml.runner.Runner,
    update: function() {},
    onVanish: function() {},
    /**
     * @param {string} eventName
     * @param {Object} params
     */
    onNotify: function(eventName, params) {},
};

/**
 * @constructor
 * @extends {bulletml.runner.Runner}
 */
bulletml.runner.ParentRunner = function() {
    bulletml.runner.Runner.call(this);

    this.completed = false;
    this.completedChildCount = 0;
    /**
     * @type {Array.<bulletml.runner.SubRunner>}
     */
    this.subRunners = [];
};
bulletml.runner.ParentRunner.prototype = Object.create(bulletml.runner.Runner.prototype);

/**
 * @param {bulletml.runner.SubRunner} subRunner
 */
bulletml.runner.ParentRunner.prototype.addSubRunner = function(subRunner) {
    subRunner.parentRunner = this;
    this.subRunners.push(subRunner);
};

/**
 * @override
 */
bulletml.runner.ParentRunner.prototype.update = function() {
    for (var i = this.subRunners.length; i--;) {
        this.subRunners[i].x = this.x;
        this.subRunners[i].y = this.y;
        this.subRunners[i].update();
    }
    if (this.completedChildCount === this.subRunners.length) {
        this.completed = true;
    }
};

/**
 * @constructor
 * @extends {bulletml.runner.Runner}
 * @param {Object} config
 */
bulletml.runner.SimpleSubRunner = function(config) {
    bulletml.runner.Runner.call(this);

    this.config = config;

    this.direction = 0.0;
    this.speed = 0.0;

    this.deltaX = null;
    this.deltaY = null;
};
bulletml.runner.SimpleSubRunner.prototype = Object.create(bulletml.runner.Runner.prototype);

/**
 * @override
 */
bulletml.runner.SimpleSubRunner.prototype.update = function() {
    if (this.deltaX === null) this.deltaX = Math.cos(this.direction) * this.speed;
    if (this.deltaY === null) this.deltaY = Math.sin(this.direction) * this.speed;

    this.x += this.deltaX * this.config.speedRate;
    this.y += this.deltaY * this.config.speedRate;
};

/**
 * @constructor
 * @extends {bulletml.runner.SimpleSubRunner}
 * @param {Object} config
 * @param {bulletml.Walker} walker
 */
bulletml.runner.SubRunner = function(config, walker) {
    bulletml.runner.SimpleSubRunner.call(this, config);

    this.walker = walker;

    this.waitTo = -1;

    this.lastDirection = 0.0;
    this.lastSpeed = 0.0;
    this.speedH = 0.0;
    this.speedV = 0.0;
    this.dirIncr = 0.0;
    this.dirFin = 0.0;
    this.chDirEnd = -1.0;
    this.spdIncr = 0.0;
    this.spdFin = 0.0;
    this.chSpdEnd = -1.0;
    this.aclIncrH = 0.0;
    this.aclFinH = 0.0;
    this.aclIncrV = 0.0;
    this.aclFinV = 0.0;
    this.aclEnd = -1.0;
    this.age = -1.0;
    this.stop = false;

    /**
     * @private
     * @type {?bulletml.runner.ParentRunner}
     */
    this.parentRunner = null;
};
bulletml.runner.SubRunner.prototype = Object.create(bulletml.runner.SimpleSubRunner.prototype);

/**
 * @override
 */
bulletml.runner.SubRunner.prototype.update = function() {
    if (this.stop) return;

    this.age += 1;

    var conf = this.config;

    // update direction
    if (this.age < this.chDirEnd) {
        this.direction += this.dirIncr;
    } else if (this.age === this.chDirEnd) {
        this.direction = this.dirFin;
    }

    // update speed
    if (this.age < this.chSpdEnd) {
        this.speed += this.spdIncr;
    } else if (this.age === this.chSpdEnd) {
        this.speed = this.spdFin;
    }

    // update accel
    if (this.age < this.aclEnd) {
        this.speedH += this.aclIncrH;
        this.speedV += this.aclIncrV;
    } else if (this.age === this.aclEnd) {
        this.speedH = this.aclFinH;
        this.speedV = this.aclFinV;
    }

    // move
    this.x += Math.cos(this.direction) * this.speed * conf.speedRate;
    this.y += Math.sin(this.direction) * this.speed * conf.speedRate;
    this.x += this.speedH * conf.speedRate;
    this.y += this.speedV * conf.speedRate;

    // proccess walker
    if (this.age < this.waitTo || this.completed) {
        return;
    }
    var cmd;
    while (cmd = this.walker.next()) {
        switch (cmd.commandName) {
        case "fire":
            this.fire(/**@type{bulletml.Fire}*/(cmd));
            break;
        case "wait":
            this.waitTo = this.age + cmd.value;
            return;
        case "changeDirection":
            this.changeDirection(/**@type{bulletml.ChangeDirection}*/(cmd));
            break;
        case "changeSpeed":
            this.changeSpeed(/**@type{bulletml.ChangeSpeed}*/(cmd));
            break;
        case "accel":
            this.accel(/**@type{bulletml.Accel}*/(cmd));
            break;
        case "vanish":
            this.onVanish();
            break;
        case "notify":
            this.notify(/**@type{bulletml.Notify}*/(cmd));
            break;
        }
    }

    // complete
    this.completed = true;
    if (this.parentRunner !== null) {
        this.parentRunner.completedChildCount += 1;
    }
};

/**
 * @private
 * @param {bulletml.Fire} cmd
 */
bulletml.runner.SubRunner.prototype.fire = function(cmd) {

    var bulletRunner;
    if (cmd.bullet.actions.length === 0) {
        bulletRunner = new bulletml.runner.SimpleSubRunner(this.config);
    } else {
        bulletRunner = new bulletml.runner.SubRunner(this.config, cmd.bullet.getWalker());
    }

    var gunPosition = {
        x: this.x + /**@type{number}*/(cmd.option.offsetX),
        y: this.y + /**@type{number}*/(cmd.option.offsetY)
    };

    // direction
    var d = cmd.direction || cmd.bullet.direction;
    var dv = d.value * Math.PI / 180;
    switch(d.type) {
    case "aim":
        var target = this.config.target;
        if (target) {
            if (target instanceof Function) target = target();
            if (cmd.option.autonomy) {
                bulletRunner.direction = angleAtoB(gunPosition, target) + dv;
            } else {
                bulletRunner.direction = angleAtoB(this, target) + dv;
            }
        } else {
            bulletRunner.direction = dv - Math.PI / 2;
        }
        break;
    case "absolute":
        bulletRunner.direction = dv - Math.PI / 2; // 真上が0度
        break;
    case "relative":
        bulletRunner.direction = this.direction + dv;
        break;
    case "sequence":
    default:
        bulletRunner.direction = this.lastDirection + dv;
    }
    this.lastDirection = bulletRunner.direction;

    // speed
    var s = cmd.speed || cmd.bullet.speed;
    var sv = s.value;
    switch (s.type) {
    case "relative":
        bulletRunner.speed = this.speed + sv;
        break;
    case "sequence":
        bulletRunner.speed = this.lastSpeed + sv;
        break;
    case "absolute":
    default:
        bulletRunner.speed = sv;
    }
    this.lastSpeed = bulletRunner.speed;

    // initialize position
    bulletRunner.x = gunPosition.x;
    bulletRunner.y = gunPosition.y;

    var spec = {};
    for (var key in cmd.bullet.option) {
        spec[key] = cmd.bullet.option[key];
    }
    spec.label = cmd.bullet.label;
    this.config.createNewBullet(bulletRunner, spec);
};

/**
 * @private
 * @param {bulletml.ChangeDirection} cmd
 */
bulletml.runner.SubRunner.prototype.changeDirection = function(cmd) {
    var d = cmd.direction.value * Math.PI / 180;
    var t = cmd.term;
    switch (cmd.direction.type) {
    case "aim":
        var target = this.config.target;
        if (target instanceof Function) target = target();
        this.dirFin = angleAtoB(this, target) + d;
        this.dirIncr = normalizeRadian(this.dirFin - this.direction) / t;
        break;
    case "absolute":
        this.dirFin = d - Math.PI / 2;
        this.dirIncr = normalizeRadian(this.dirFin - this.direction) / t;
        break;
    case "relative":
        this.dirFin = this.direction + d;
        this.dirIncr = normalizeRadian(this.dirFin - this.direction) / t;
        break;
    case "sequence":
        this.dirIncr = d;
        this.dirFin = this.direction + this.dirIncr * (t-1);
        break;
    }
    this.chDirEnd = this.age + t;
};

/**
 * @private
 * @param {bulletml.ChangeSpeed} cmd
 */
bulletml.runner.SubRunner.prototype.changeSpeed = function(cmd) {
    var s = cmd.speed.value;
    var t = cmd.term;
    switch (cmd.speed.type) {
    case "absolute":
        this.spdFin = s;
        this.spdIncr = (this.spdFin - this.speed) / t;
        break;
    case "relative":
        this.spdFin = s + this.speed;
        this.spdIncr = (this.spdFin - this.speed) / t;
        break;
    case "sequence":
        this.spdIncr = s;
        this.spdFin = this.speed + this.spdIncr * t;
        break;
    }
    this.chSpdEnd = this.age + t;
};

/**
 * @private
 * @param {bulletml.Accel} cmd
 */
bulletml.runner.SubRunner.prototype.accel = function(cmd) {
    var t = cmd.term;
    this.aclEnd = this.age + t;

    if (cmd.horizontal) {
        var h = cmd.horizontal.value;
        switch (cmd.horizontal.type) {
        case "absolute":
        case "sequence":
            this.aclIncrH = (h - this.speedH) / t;
            this.aclFinH = h;
            break;
        case "relative":
            this.aclIncrH = h;
            this.aclFinH = (h - this.speedH) * t;
            break;
        }
    } else {
        this.aclIncrH = 0;
        this.aclFinH = this.speedH;
    }

    if (cmd.vertical) {
        var v = cmd.vertical.value;
        switch (cmd.vertical.type) {
        case "absolute":
        case "sequence":
            this.aclIncrV = (v - this.speedV) / t;
            this.aclFinV = v;
            break;
        case "relative":
            this.aclIncrV = v;
            this.aclFinV = (v - this.speedV) * t;
            break;
        }
    } else {
        this.aclIncrV = 0;
        this.aclFinV = this.speedV;
    }
};

/**
 * @private
 * @param {bulletml.Notify} cmd
 */
bulletml.runner.SubRunner.prototype.notify = function(cmd) {
    this.onNotify(cmd.eventName, cmd.params);
};

/**
 * @param {number} radian
 */
var normalizeRadian = function(radian) {
    while (radian <= -Math.PI) {
        radian += Math.PI * 2;
    }
    while (Math.PI < radian) {
        radian -= Math.PI * 2;
    }
    return radian;
};


/**
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @return {number}
 */
var angleAtoB = function(a, b) {
    return Math.atan2(b.y-a.y, b.x-a.x);
};

})();

(function() {

/** @namespace */
bulletml.output = bulletml.output || {};

/** @namespace */
bulletml.output.json = bulletml.output.json || {};

bulletml.Root.prototype.toJSON = function() {
    return {
        className: "Root",
        actions: this.actions,
        bullets: this.bullets,
        fires: this.fires,
    };
};

bulletml.Bullet.prototype.toJSON = function() {
    return {
        className: "Bullet",
        label: this.label,
        direction: this.direction,
        speed: this.speed,
        actions: this.actions,
        option: this.options,
    };
};

bulletml.BulletRef.prototype.toJSON = function() {
    return {
        className: "BulletRef",
        label: this.label,
        params: this.params,
    };
};

bulletml.Action.prototype.toJSON = function() {
    return {
        className: "Action",
        label: this.label,
        commands: this.commands,
        // params: this.params,
    };
};

bulletml.ActionRef.prototype.toJSON = function() {
    return {
        className: "ActionRef",
        label: this.label,
        params: this.params,
    };
};

bulletml.Fire.prototype.toJSON = function() {
    return {
        className: "Fire",
        label: this.label,
        direction: this.direction,
        speed: this.speed,
        bullet: this.bullet,
        option: this.option,
    };
};

bulletml.FireRef.prototype.toJSON = function() {
    return {
        className: "FireRef",
        label: this.label,
        params: this.params,
    };
};

bulletml.ChangeDirection.prototype.toJSON = function() {
    return {
        className: "ChangeDirection",
        direction: this.direction,
        term: this.term,
    };
};

bulletml.ChangeSpeed.prototype.toJSON = function() {
    return {
        className: "ChangeSpeed",
        speed: this.speed,
        term: this.term,
    };
};

bulletml.Accel.prototype.toJSON = function() {
    return {
        className: "Accel",
        horizontal: this.horizontal,
        vertical: this.vertical,
        term: this.term,
    };
};

bulletml.Wait.prototype.toJSON = function() {
    return {
        className: "Wait",
        value: this.value,
    };
};

bulletml.Vanish.prototype.toJSON = function() {
    return {
        className: "Vanish",
    };
};

bulletml.Repeat.prototype.toJSON = function() {
    return {
        className: "Repeat",
        times: this.times,
        action: this.action,
        // params: this.params,
    };
};

bulletml.Bind.prototype.toJSON = function() {
    return {
        className: "Bind",
        variable: this.variable,
        expression: this.expression,
    };
};

bulletml.Notify.prototype.toJSON = function() {
    return {
        className: "Notify",
        eventName: this.eventName,
        params: this.params,
    };
};

bulletml.Direction.prototype.toJSON = function() {
    return {
        className: "Direction",
        type: this.type,
        value: this.value,
    };
};

bulletml.Speed.prototype.toJSON = function() {
    return {
        className: "Speed",
        type: this.type,
        value: this.value,
    };
};

bulletml.Horizontal.prototype.toJSON = function() {
    return {
        className: "Horizontal",
        type: this.type,
        value: this.value,
    };
};

bulletml.Vertical.prototype.toJSON = function() {
    return {
        className: "Vertical",
        type: this.type,
        value: this.value,
    };
};

bulletml.FireOption.prototype.toJSON = function() {
    return {
        className: "FireOption",
        offsetX: this.offsetX,
        offsetY: this.offsetY,
        autonomy: this.autonomy,
    };
};

bulletml.OffsetX.prototype.toJSON = function() {
    return {
        className: "OffsetX",
        value: this.value,
    };
};

bulletml.OffsetY.prototype.toJSON = function() {
    return {
        className: "OffsetY",
        value: this.value,
    };
};

bulletml.Autonomy.prototype.toJSON = function() {
    return {
        className: "Autonomy",
        value: this.value,
    };
};


})();

tm.define("Application", {
    superClass: "tm.display.CanvasApp",
    init: function() {
        this.superInit("#main");

        this.renderer = LayeredCanvasRenderer(this.canvas);

        var hmdElement = document.querySelector("#hmd");
        this.touch = tm.input.Touch(hmdElement, 0);
        this.mouse = tm.input.Mouse(hmdElement);
        this.pointing = (tm.isMobile) ? this.touch : this.mouse;
        hmdElement.addEventListener("touchstart", function() {
            this.pointing = this.touch;
        }.bind(this));
        hmdElement.addEventListener("mousedown", function() {
            this.pointing = this.mouse;
        }.bind(this));

        this.fps = 60;
        this.background = "transparent";
        this.resize(SCREEN_WIDTH, SCREEN_HEIGHT).fitWindow();
    }
});
tm.define("LayeredCanvasRenderer", {
    superClass: "tm.display.CanvasRenderer",
    init: function(canvas) {
        this.superInit(canvas);
    },

    renderObject: function(obj) {
        if (obj instanceof CanvasLayer) {
            obj.render();
        } else {
            tm.display.CanvasRenderer.prototype.renderObject.call(this, obj);
        }
    }
});

tm.define("CanvasLayer", {
    superClass: "tm.display.CanvasElement",
    init: function(canvas) {
        this.superInit();
        this.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        this.setOrigin(0, 0);

        this.canvas = tm.graphics.Canvas(canvas);
        this.domElement = tm.dom.Element(canvas);

        this.renderer = tm.display.CanvasRenderer(this.canvas);

        this.canvas.resize(SCREEN_WIDTH, SCREEN_HEIGHT).fitWindow();

        this.renderInterval = 2;
        this.isRenderFrame = true;
    },
    clear: function() {
        this.canvas.clear();
        return this;
    },
    update: function(app) {
        this.isRenderFrame = app.frame % this.renderInterval === 0;
    },
    render: function() {
        if (this.isRenderFrame) {
            this.canvas.clear();
            this.renderer.render(this);
        }
    }
});

CanvasLayer.prototype.accessor.visible = {
    get: function() {
        return this.domElement.visible;
    },
    set: function(v) {
        this.domElement.visible = v;
    }
};

var BOARD_ID = null;

var APP_URL = "https://itunes.apple.com/";
var TITLE_TWEET = "『よけろ！弾幕さん』お手軽弾幕シューティングゲーム";
var RESULT_URL = TITLE_TWEET + " スコア: {score}";
var TARGET = 'release';

var FONT_CODE = {
    play: '0xf04b',
    home: '0xf015',
    comment: '0xf075',
    apple: '0xf179',
    android: '0xf17b',
    trophy: '0xf091',
    gamepad: '0xf11b',
    shareAlt: '0xf1e0',
    buysellads: '0xf20d',
    pause: '0xf04c',

    arrowRight: '0xf061',
    longArrowRight: '0xf178',
    handORight: '0xf0a4',
    angleRight: '0xf106',
};

var ASSETS = {
    "unifont": "assets/unip.ttf",
    "bullet": "assets/bullets.png",
    "bullet_erase": "assets/bullets_erase.png",
    "sound/bgm": "assets/nc91440.mp3",
    "sound/miss": "assets/sei_ge_garasu_kudake02.mp3",
    "sound/exp1": "assets/sei_ge_wareru01.mp3",
    "sound/exp2": "assets/sei_ge_wareru02.mp3",
    "sound/exp3": "assets/sei_ge_wareru03.mp3",
    "sound/extend": "assets/extend.mp3",
    "sound/score": "assets/sei_ge_coin_otosu02.mp3",
    "sound/hit": "assets/sei_ge_garasu_hibi02.mp3",
    "sound/ok": "assets/se_maoudamashii_system18.mp3",
    "sound/cancel": "assets/se_maoudamashii_system45.mp3",
};
var SCREEN_WIDTH = 640;
var SCREEN_HEIGHT = 960;

var W = SCREEN_WIDTH;
var H = W * 1.2;

var PLAYER_SPEED = 2.0;

var BIT_COUNT = 4;
var BIT_DISTANCE = 12;

var SHOT_SPEED = 40;

var BULLET_POOL_SIZE = 256;
var BULLET_BOUNDING_RADIUS = 4;

var MT_SEED = 5;

var ENEMY_SMALL_HP = 2;
var ENEMY_MIDDLE_HP = 10;
var ENEMY_LARGE_HP = 100;

var EXTEND_SCORE = 200000;

var ENEMY_INTERVAL_DECR = 0.75;

var isNative = function() {
    return window.cordovaFlag === true;
};

var showAd = function() {
    if (window.cordovaFlag) {
        if(window.AdMob) {
            AdMob.prepareInterstitial( {adId:admobid.interstitial, autoShow:true} );
        }
    }
};

var clickAdCallback = function() {
    alert('onInterstitialLeaveApp');
};

document.addEventListener('onInterstitialLeaveApp', function(){
    clickAdCallback && clickAdCallback();
});


document.addEventListener('onInterstitialDismiss', function(){
    // 広告を閉じた際のコールバック
    // alert('onInterstitialDismiss');
    // AdMob.prepareInterstitial( {adId:admobid.interstitial, autoShow:false} );
});

var UserData = {
    init: function(strong) {
        var defaults = {
            life: 5,
            bestScore: 0,
        };

        var data = this.get();

        if (strong) {
            data.$extend(defaults);
        }
        else {
            data.$safe(defaults);
        }

        this.set(data);
    },
    get: function() {
        var key = location.pathname.toCRC32();
        var data = localStorage.getItem(key);
        return (data) ? JSON.parse(data) : {};
    },
    set: function(data) {
        var key = location.pathname.toCRC32();
        var dataString = JSON.stringify(data);
        localStorage.setItem(key, dataString);
        return this;
    },
    hasLife: function() {
        var data = this.get();
        return data.life >= 1;
    },
};

// ユーザーデータ初期化
(function() {
    UserData.init();
})();

var Danmaku = {};
Danmaku.param = {
    speedRate: 1,
    interval: 1.0,
};
Danmaku.small = [];
Danmaku.middle = [];
Danmaku.large = [];

(function() {
    var action = bulletml.dsl.action;
    var actionRef = bulletml.dsl.actionRef;
    var bullet = bulletml.dsl.bullet;
    var bulletRef = bulletml.dsl.bulletRef;
    var fire = bulletml.dsl.fire;
    var fireRef = bulletml.dsl.fireRef;
    var changeDirection = bulletml.dsl.changeDirection;
    var changeSpeed = bulletml.dsl.changeSpeed;
    var accel = bulletml.dsl.accel;
    // var wait = bulletml.dsl.wait;
    var vanish = bulletml.dsl.vanish;
    var repeat = bulletml.dsl.repeat;
    var bindVar = bulletml.dsl.bindVar;
    var notify = bulletml.dsl.notify;
    var direction = bulletml.dsl.direction;
    var speed = bulletml.dsl.speed;
    var horizontal = bulletml.dsl.horizontal;
    var vertical = bulletml.dsl.vertical;
    var fireOption = bulletml.dsl.fireOption;
    var offsetX = bulletml.dsl.offsetX;
    var offsetY = bulletml.dsl.offsetY;
    var autonomy = bulletml.dsl.autonomy;
    var wait = function(v) {
        return bulletml.dsl.wait(v + " * " + Danmaku.param.interval);
    };

    var RS = function(act) {
        return bullet(act, {
            type: 0
        });
    };
    var BS = function(act) {
        return bullet(act, {
            type: 1
        });
    };
    var RL = function(act) {
        return bullet(act, {
            type: 2
        });
    };
    var BL = function(act) {
        return bullet(act, {
            type: 3
        });
    };
    var RCS = function(act) {
        return bullet(act, {
            type: 4
        });
    };
    var BCS = function(act) {
        return bullet(act, {
            type: 5
        });
    };
    var RCL = function(act) {
        return bullet(act, {
            type: 6
        });
    };
    var BCL = function(act) {
        return bullet(act, {
            type: 7
        });
    };
    var IVS = function(act) {
        return bullet(act, {
            type: 8
        });
    };

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(speed(7), RS),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            repeat(5, [
                fire(speed(7), RS),
                wait(20),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(direction(-30), speed(7), RS),
            fire(direction(  0), speed(7), RS),
            fire(direction( 30), speed(7), RS),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            repeat(10, [
                fire(direction(-30), speed(7), RS),
                fire(direction(  0), speed(7), RS),
                fire(direction( 30), speed(7), RS),
                wait(20),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(speed(4), IVS),
            repeat(5, [
                fire(direction(-30), speed(0.4, "sequence"), RS),
                fire(direction(  0), speed(0.0, "sequence"), RS),
                fire(direction( 30), speed(0.0, "sequence"), RS),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(speed(4), IVS),
            repeat(5, [
                fire(direction(-45), speed(10), IVS(actionRef("bit",  45, "$loop.index"))),
                fire(direction( 45), speed(10), IVS(actionRef("bit", -45, "$loop.index"))),
                fire(direction(  0), speed(10), IVS(actionRef("bit",   0, "$loop.index"))),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction("$1", "relative"), speed("6.5 + $2 * 0.2"), BCS),
            vanish(),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(direction(-4), speed(6), BCS),
            repeat(5 - 1, [
                fire(direction(2, "sequence"), speed(6), BCS),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            repeat(5, [
                fire(speed(3), RCL),
                wait(50),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(speed(6), IVS),
            repeat(5, [
                fire(direction(180, "absolute"), speed(0.2, "sequence"), BCS),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(speed(1), RL(actionRef("bullet"))),
        ]),
        bullet: action([
            wait(30),
            changeSpeed(speed(20), 60),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            repeat(Infinity, [
                wait(20),
                fire(speed(6), RS),
            ]),
        ]),
    }));

    Danmaku.small = [Danmaku.small.last];
})();

(function() {
    var action = bulletml.dsl.action;
    var actionRef = bulletml.dsl.actionRef;
    var bullet = bulletml.dsl.bullet;
    var bulletRef = bulletml.dsl.bulletRef;
    var fire = bulletml.dsl.fire;
    var fireRef = bulletml.dsl.fireRef;
    var changeDirection = bulletml.dsl.changeDirection;
    var changeSpeed = bulletml.dsl.changeSpeed;
    var accel = bulletml.dsl.accel;
    // var wait = bulletml.dsl.wait;
    var vanish = bulletml.dsl.vanish;
    var repeat = bulletml.dsl.repeat;
    var bindVar = bulletml.dsl.bindVar;
    var notify = bulletml.dsl.notify;
    var direction = bulletml.dsl.direction;
    var speed = bulletml.dsl.speed;
    var horizontal = bulletml.dsl.horizontal;
    var vertical = bulletml.dsl.vertical;
    var fireOption = bulletml.dsl.fireOption;
    var offsetX = bulletml.dsl.offsetX;
    var offsetY = bulletml.dsl.offsetY;
    var autonomy = bulletml.dsl.autonomy;
    var wait = function(v) {
        return bulletml.dsl.wait(v * Danmaku.param.interval);
    };

    var RS = function(act) {
        return bullet(act, {
            type: 0
        });
    };
    var BS = function(act) {
        return bullet(act, {
            type: 1
        });
    };
    var RL = function(act) {
        return bullet(act, {
            type: 2
        });
    };
    var BL = function(act) {
        return bullet(act, {
            type: 3
        });
    };
    var RCS = function(act) {
        return bullet(act, {
            type: 4
        });
    };
    var BCS = function(act) {
        return bullet(act, {
            type: 5
        });
    };
    var RCL = function(act) {
        return bullet(act, {
            type: 6
        });
    };
    var BCL = function(act) {
        return bullet(act, {
            type: 7
        });
    };
    var IVS = function(act) {
        return bullet(act, {
            type: 8
        });
    };

    Danmaku.middle.push(new bulletml.Root({
        top1: action([
            repeat(Infinity, [
                wait(50),
                repeat(4, [
                    fire(direction(180 + 90, "absolute"), speed(30), IVS(actionRef("bit"))),
                    fire(direction(180 - 90, "absolute"), speed(30), IVS(actionRef("bit"))),
                    wait(5),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(180 - 4, "absolute"), speed(4), RCS),
            fire(direction(180 + 4, "absolute"), speed(4), RCS),
            vanish(),
        ]),
        top2: action([
            repeat(Infinity, [
                wait(90),
                fire(speed(3), IVS),
                repeat(6, [
                    fire(direction(0, "sequence"), speed(0.4, "sequence"), BS),
                ]),
            ]),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            wait(100),
            repeat(Infinity, [
                fire(IVS),
                repeat(10, [
                    fire(direction(0, "sequence"), speed(12), BL),
                    wait(3),
                ]),
                wait(100),
            ]),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            repeat(Infinity, [
                wait(100),
                fire(speed(8), IVS),
                repeat(10, [
                    fire(direction(20 * -2), speed(0.6, "sequence"), IVS),
                    repeat(3, [
                        fire(direction(20, "sequence"), speed(0, "sequence"), RS),
                    ]),
                    wait(3),
                ]),
            ]),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            repeat(Infinity, [
                wait(60),
                repeat(20, [
                    fire(direction(10, "sequence"), IVS),
                    repeat(4, [
                        fire(direction(90, "sequence"), speed(20), IVS(actionRef("bit"))),
                    ]),
                    wait(20),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(speed(4), IVS),
            repeat(3, [
                fire(direction(90, "relative"), speed(0.8, "sequence"), RCL),
            ]),
            vanish(),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            repeat(Infinity, [
                wait(60),
                repeat(20, [
                    fire(direction(-10, "sequence"), IVS),
                    repeat(4, [
                        fire(direction(90, "sequence"), speed(20), IVS(actionRef("bit"))),
                    ]),
                    wait(20),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(speed(4), IVS),
            repeat(3, [
                fire(direction(90, "relative"), speed(0.8, "sequence"), BCL),
            ]),
            vanish(),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            repeat(Infinity, [
                wait(60),
                repeat(18, [
                    fire(direction(20, "sequence"), speed(2), BCS(actionRef("seed"))),
                ]),
            ]),
        ]),
        seed: action([
            wait(20),
            changeSpeed(speed(0), 20),
            wait(20),
            fire(speed(7), RCS),
            vanish(),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            repeat(Infinity, [
                wait(120),
                repeat(10, [
                    fire(direction(6, "sequence"), IVS),
                    repeat(8, [
                        fire(direction(360 / 8, "sequence"), speed(20), IVS(actionRef("bit"))),
                    ]),
                    wait(7),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(-90, "relative"), speed(5), BCL),
            vanish(),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top0: action([
            repeat(Infinity, [
                wait(80),
                fire(direction(90 * -0.5), speed(5), RL),
                repeat(8, [
                    fire(direction(90 / 8, "sequence"), speed(5), RL),
                ]),
            ]),
        ]),
        top1: action([
            repeat(Infinity, [
                wait(100),
                fire(direction(50 * -0.5), speed(6), RL),
                repeat(8, [
                    fire(direction(50 / 8, "sequence"), speed(6), RL),
                ]),
            ]),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top0: action([
            repeat(Infinity, [
                repeat(3, [
                    wait(80),
                    fire(direction(-90, "absolute"), speed(40), IVS(actionRef("bit"))),
                    fire(direction(+90, "absolute"), speed(40), IVS(actionRef("bit"))),
                    wait(20),
                    fire(direction(-90, "absolute"), speed(40), IVS(actionRef("bit2"))),
                    fire(direction(+90, "absolute"), speed(40), IVS(actionRef("bit2"))),
                    wait(20),
                ]),
                wait(150),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(90 * -0.5), speed(5), BL),
            repeat(4, [
                fire(direction(90 / 4, "sequence"), speed(5), BL),
            ]),
            vanish(),
        ]),
        bit2: action([
            wait(1),
            fire(direction(90 * -0.5), speed(6), BL),
            repeat(3, [
                fire(direction(90 / 3, "sequence"), speed(6), BL),
            ]),
            vanish(),
        ]),
    }));

    // Danmaku.middle = [Danmaku.middle.last];
})();

(function() {
    var action = bulletml.dsl.action;
    var actionRef = bulletml.dsl.actionRef;
    var bullet = bulletml.dsl.bullet;
    var bulletRef = bulletml.dsl.bulletRef;
    var fire = bulletml.dsl.fire;
    var fireRef = bulletml.dsl.fireRef;
    var changeDirection = bulletml.dsl.changeDirection;
    var changeSpeed = bulletml.dsl.changeSpeed;
    var accel = bulletml.dsl.accel;
    // var wait = bulletml.dsl.wait;
    var vanish = bulletml.dsl.vanish;
    var repeat = bulletml.dsl.repeat;
    var bindVar = bulletml.dsl.bindVar;
    var notify = bulletml.dsl.notify;
    var direction = bulletml.dsl.direction;
    var speed = bulletml.dsl.speed;
    var horizontal = bulletml.dsl.horizontal;
    var vertical = bulletml.dsl.vertical;
    var fireOption = bulletml.dsl.fireOption;
    var offsetX = bulletml.dsl.offsetX;
    var offsetY = bulletml.dsl.offsetY;
    var autonomy = bulletml.dsl.autonomy;
    var wait = function(v) {
        return bulletml.dsl.wait(v * Danmaku.param.interval);
    };

    var RS = function(act) {
        return bullet(act, {
            type: 0
        });
    };
    var BS = function(act) {
        return bullet(act, {
            type: 1
        });
    };
    var RL = function(act) {
        return bullet(act, {
            type: 2
        });
    };
    var BL = function(act) {
        return bullet(act, {
            type: 3
        });
    };
    var RCS = function(act) {
        return bullet(act, {
            type: 4
        });
    };
    var BCS = function(act) {
        return bullet(act, {
            type: 5
        });
    };
    var RCL = function(act) {
        return bullet(act, {
            type: 6
        });
    };
    var BCL = function(act) {
        return bullet(act, {
            type: 7
        });
    };
    var IVS = function(act) {
        return bullet(act, {
            type: 8
        });
    };

    Danmaku.large.push(new bulletml.Root({
        top: action([
            repeat(Infinity, [
                wait(80),
                fire(direction(0), IVS),
                repeat(10, [
                    bindVar("way", "$loop.index + 2"),
                    bindVar("angle", "$way * 13"),
                    fire(direction("$angle * -0.5", "sequence"), speed(6), RCL),
                    repeat("$way - 1", [
                        fire(direction("$angle / ($way - 1)", "sequence"), speed(6), RCL),
                    ]),
                    fire(direction("$angle * -0.5", "sequence"), IVS),
                    wait(7),
                ]),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            repeat(Infinity, [
                wait(100),
                repeat(60, [
                    fire(direction(9, "sequence"), IVS),
                    fire(direction(90, "sequence"), IVS(actionRef("bit"))),
                    fire(direction(90, "sequence"), IVS(actionRef("bit"))),
                    fire(direction(90, "sequence"), IVS(actionRef("bit"))),
                    fire(direction(90, "sequence"), IVS(actionRef("bit"))),
                    wait(10),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(34 * -0.5, "relative"), speed(6), RCL),
            repeat(3 - 1, [
                fire(direction(34 / (3 - 1), "sequence"), speed(6), RCL),
            ]),
            vanish(),
        ]),
        top1: action([
            repeat(Infinity, [
                wait(180),
                fire(speed(8), BL),
                repeat(40 - 1, [
                    fire(direction(360 / 40, "sequence"), speed(8), BL),
                ]),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            repeat(Infinity, [
                wait(80),
                repeat(4, [
                    wait(20),
                    fire(speed(5), RL),
                    repeat(10 - 1, [
                        fire(direction(360 / 10, "sequence"), speed(5), RL),
                    ]),
                    wait(5),
                    repeat(3, [
                        fire(direction(5, "sequence"), speed(5), RL),
                        repeat(10 - 1, [
                            fire(direction(360 / 10, "sequence"), speed(5), RL),
                        ]),
                        wait(5),
                    ]),
                    wait(20),
                    fire(speed(5), RL),
                    repeat(10 - 1, [
                        fire(direction(360 / 10, "sequence"), speed(5), RL),
                    ]),
                    wait(5),
                    repeat(3, [
                        fire(direction(-5, "sequence"), speed(5), RL),
                        repeat(10 - 1, [
                            fire(direction(360 / 10, "sequence"), speed(5), RL),
                        ]),
                        wait(5),
                    ]),
                ]),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            repeat(Infinity, [
                wait(80),
                repeat("5 + $loop.index", [
                    fire(direction(180 - 90, "absolute"), speed(30), IVS(actionRef("bit"))),
                    fire(direction(180 - 45, "absolute"), speed(15), IVS(actionRef("bit"))),
                    fire(direction(180 +  0, "absolute"), speed( 0), IVS(actionRef("bit"))),
                    fire(direction(180 + 45, "absolute"), speed(15), IVS(actionRef("bit"))),
                    fire(direction(180 + 90, "absolute"), speed(30), IVS(actionRef("bit"))),
                    wait(8),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(110 * -0.5), speed(5), RCL),
            repeat(5 - 1, [
                fire(direction(110 / (5 - 1), "sequence"), speed(5), RCL),
            ]),
            vanish(),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            wait(100),
            repeat(Infinity, [
                fire(direction(90 + 6, "sequence"), speed(5), BCS),
                fire(direction(90, "sequence"), speed(5), BCS),
                fire(direction(90, "sequence"), speed(5), BCS),
                fire(direction(90, "sequence"), speed(5), BCS),
                wait(5),
            ]),
        ]),
        top1: action([
            wait(130),
            repeat(Infinity, [
                fire(direction(90 - 5, "sequence"), speed(5), RCS),
                fire(direction(90, "sequence"), speed(5), RCS),
                fire(direction(90, "sequence"), speed(5), RCS),
                fire(direction(90, "sequence"), speed(5), RCS),
                wait(5),
            ]),
        ]),
        top2: action([
            wait(160),
            repeat(Infinity, [
                fire(speed(4), RL),
                repeat(30, [
                    fire(direction(360 / (30 - 1), "sequence"), speed(4), RL),
                ]),
                wait(40),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            wait(100),
            repeat(Infinity, [
                repeat(200, [
                    fire(direction("Math.sin($loop.index * 0.2) * 60"), speed(6.5), BL),
                    wait(3),
                ]),
                wait(50),
            ]),
        ]),
        top1: action([
            wait(100),
            repeat(Infinity, [
                repeat(200, [
                    fire(direction("Math.sin($loop.index * 0.3) * -40"), speed(6.5), RL),
                    wait(3),
                ]),
                wait(50),
            ]),
        ]),
        top2: action([
            wait(100),
            repeat(Infinity, [
                repeat(200, [
                    fire(direction("Math.sin($loop.index * 0.1) * 80"), speed(6.5), RS),
                    wait(3),
                ]),
                wait(50),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            wait(100),
            fire(direction(-22.5), speed(4), BCL),
            repeat(Infinity, [
                repeat(7, [
                    fire(direction(90 + 45 / 7, "sequence"), speed(4), BCL),
                    fire(direction(90, "sequence"), speed(4), BCL),
                    fire(direction(90, "sequence"), speed(4), BCL),
                    fire(direction(90, "sequence"), speed(4), BCL),
                ]),
                wait(40),
            ]),
        ]),
        top1: action([
            wait(100),
            repeat(Infinity, [
                fire(speed(6), IVS),
                repeat(7, [
                    fire(direction(-25, "sequence"), speed(0.3, "sequence"), RL),
                    fire(direction(25, "sequence"), speed(0, "sequence"), RL),
                    fire(direction(25, "sequence"), speed(0, "sequence"), RL),
                    fire(direction(-25, "sequence"), speed(0, "sequence"), IVS),
                ]),
                wait(70),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top: action([
            wait(100),
            repeat(Infinity, [
                fire(direction(140 * -0.5), speed(0), IVS(actionRef("bit"))),
                repeat(8, [
                    fire(direction(140 / 8, "sequence"), speed(0), IVS(actionRef("bit"))),
                ]),
                wait(14),
                fire(direction(140 * -0.5), speed(0), IVS(actionRef("bit"))),
                repeat(7, [
                    fire(direction(140 / 7, "sequence"), speed(0), IVS(actionRef("bit"))),
                ]),
                wait(14),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(0, "relative"), speed(5.4), RCL),
            fire(direction(-2, "relative"), speed(5.0), RCL),
            fire(direction(+2, "relative"), speed(5.0), RCL),
            fire(direction(0, "relative"), speed(4.6), RCL),
            vanish(),
        ]),
    }));

    Danmaku.large = [Danmaku.large.last];
})();

// mt.js 0.2.4 (2005-12-23)

/*

Mersenne Twister in JavaScript based on "mt19937ar.c"

 * JavaScript version by Magicant: Copyright (C) 2005 Magicant


 * Original C version by Makoto Matsumoto and Takuji Nishimura
   http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/mt.html

Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

  1. Redistributions of source code must retain the above copyright
     notice, this list of conditions and the following disclaimer.

  2. Redistributions in binary form must reproduce the above copyright
     notice, this list of conditions and the following disclaimer in the
     documentation and/or other materials provided with the distribution.

  3. The names of its contributors may not be used to endorse or promote
     products derived from this software without specific prior written
     permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/


// Methods whose name starts with "_" are private methods.
// Don't call them externally!


/**
 * Constructor: MersenneTwister([integer/Array<integer> seed])
 * initializes the object with the given seed.
 * The seed may be an integer or an array of integers.
 * If the seed is not given, the object will be initialized with the current
 * time: new Date().getTime().
 * See also: setSeed(seed).
 */
function MersenneTwister(seed) {
    if (arguments.length == 0)
        seed = new Date().getTime();

    this._mt = new Array(624);
    this.setSeed(seed);
}

/** multiplies two uint32 values and returns a uint32 result. */
MersenneTwister._mulUint32 = function(a, b) {
    var a1 = a >>> 16, a2 = a & 0xffff;
    var b1 = b >>> 16, b2 = b & 0xffff;
    return (((a1 * b2 + a2 * b1) << 16) + a2 * b2) >>> 0;
};

/** returns ceil(value) if value is finite number, otherwise 0. */
MersenneTwister._toNumber = function(x) {
    return (typeof x == "number" && !isNaN(x)) ? Math.ceil(x) : 0;
};

/**
 * Method: setSeed(integer/Array<integer> seed)
 * resets the seed. The seed may be an integer or an array of integers.
 * Elements in the seed array that are not numbers will be treated as 0.
 * Numbers that are not integers will be rounded down.
 * The integer(s) should be greater than or equal to 0 and less than 2^32.
 * This method is compatible with init_genrand and init_by_array function of
 * the original C version.
 */
MersenneTwister.prototype.setSeed = function(seed) {
    var mt = this._mt;
    if (typeof seed == "number") {
        mt[0] = seed >>> 0;
        for (var i = 1; i < mt.length; i++) {
            var x = mt[i-1] ^ (mt[i-1] >>> 30);
            mt[i] = MersenneTwister._mulUint32(1812433253, x) + i;
        }
        this._index = mt.length;
    } else if (seed instanceof Array) {
        var i = 1, j = 0;
        this.setSeed(19650218);
        for (var k = Math.max(mt.length, seed.length); k > 0; k--) {
            var x = mt[i-1] ^ (mt[i-1] >>> 30);
            x = MersenneTwister._mulUint32(x, 1664525);
            mt[i] = (mt[i] ^ x) + (seed[j] >>> 0) + j;
            if (++i >= mt.length) {
                mt[0] = mt[mt.length-1];
                i = 1;
            }
            if (++j >= seed.length) {
                j = 0;
            }
        }
        for (var k = mt.length - 1; k > 0; k--) {
            var x = mt[i-1] ^ (mt[i-1] >>> 30);
            x = MersenneTwister._mulUint32(x, 1566083941);
            mt[i] = (mt[i] ^ x) - i;
            if (++i >= mt.length) {
                mt[0] = mt[mt.length-1];
                i = 1;
            }
        }
        mt[0] = 0x80000000;
    } else {
        throw new TypeError("MersenneTwister: illegal seed.");
    }
};

/** returns the next random Uint32 value. */
MersenneTwister.prototype._nextInt = function() {
    var mt = this._mt, value;

    if (this._index >= mt.length) {
        var k = 0, N = mt.length, M = 397;
        do {
            value = (mt[k] & 0x80000000) | (mt[k+1] & 0x7fffffff);
            mt[k] = mt[k+M] ^ (value >>> 1) ^ ((value & 1) ? 0x9908b0df : 0);
        } while (++k < N-M);
        do {
            value = (mt[k] & 0x80000000) | (mt[k+1] & 0x7fffffff);
            mt[k] = mt[k+M-N] ^ (value >>> 1) ^ ((value & 1) ? 0x9908b0df : 0);
        } while (++k < N-1);
        value = (mt[N-1] & 0x80000000) | (mt[0] & 0x7fffffff);
        mt[N-1] = mt[M-1] ^ (value >>> 1) ^ ((value & 1) ? 0x9908b0df : 0);
        this._index = 0;
    }

    value = mt[this._index++];
    value ^=  value >>> 11;
    value ^= (value <<   7) & 0x9d2c5680;
    value ^= (value <<  15) & 0xefc60000;
    value ^=  value >>> 18;
    return value >>> 0;
};

/**
 * Method: nextInt([[number min,] number max])
 * returns a random integer that is greater than or equal to min and less than
 * max. The value of (max - min) must be positive number less or equal to 2^32.
 * If min is not given or not a number, this method uses 0 for min.
 * If neither of min and max is given or max is out of range, this method
 * uses 2^32 for max.
 * This method is compatible with genrand_int32 function of the original C
 * version for min=0 & max=2^32, but not with genrand_int31 function.
 */
MersenneTwister.prototype.nextInt = function() {
    var min, sup;
    switch (arguments.length) {
    case 0:
        return this._nextInt();
    case 1:
        min = 0;
        sup = MersenneTwister._toNumber(arguments[0]);
        break;
    default:
        min = MersenneTwister._toNumber(arguments[0]);
        sup = MersenneTwister._toNumber(arguments[1]) - min;
        break;
    }

    if (!(0 < sup && sup < 0x100000000))
        return this._nextInt() + min;
    if ((sup & (~sup + 1)) == sup)
        return ((sup - 1) & this._nextInt()) + min;

    var value;
    do {
        value = this._nextInt();
    } while (sup > 4294967296 - (value - (value %= sup)));
    return value + min;
};

/**
 * Method: next()
 * returns a random number that is greater than or equal to 0 and less than 1.
 * This method is compatible with genrand_res53 function of the original C
 * version.
 */
MersenneTwister.prototype.next = function() {
    var a = this._nextInt() >>> 5, b = this._nextInt() >>> 6;
    return (a * 0x4000000 + b) / 0x20000000000000;
};

tm.define("Background", {
    superClass: "tm.display.CanvasElement",
    init: function() {
        this.superInit();
        this.fromJSON({
            children: {
                bg: {
                    type: "tm.display.CanvasElement",
                },
                fg: {
                    type: "tm.display.CanvasElement",
                }
            }
        });

        this.clipping = true;
        this.setSize(W, H);
        this.setOrigin(0, 0);
        this.age = 0;

        this.stars = Array.range(20).map(function() {
            var size = Math.rand(50, 150);
            var h = Math.rand(0, 360);
            var speed = Math.rand(5, 20);
            var rotSpeed = Math.randf(-5, 5);
            return tm.display.PolygonShape({
                sides: Math.rand(5, 9),
                width: size,
                height: size,
                fillStyle: "hsla({0}, 90%,  5%, 0.2)".format(h),
                strokeStyle: "hsla({0}, 90%, 80%, 0.2)".format(h),
            })
                .setBlendMode("lighter")
                .setPosition(Math.rand(0, W), Math.rand(H * -0.5, H * 1.5))
                .on("enterframe", function() {
                    this.rotation += rotSpeed;
                    this.y += speed;
                    if (this.y > H * 1.5) {
                        this.x = Math.rand(0, W);
                        this.y = H * -0.5;
                    }
                })
                .addChildTo(this.bg);
        }.bind(this));
    },
    update: function(app) {
        this.color = Math.floor((this.age / 30) % 360);
        this.age += 1;
    },
    draw: function(canvas) {
        canvas
            .setFillStyle(
                tm.graphics.RadialGradient(W * 0.5, H * 0.05, 0, W * 0.5, H * 0.05, H)
                    .addColorStopList([
                        { offset: 0.0, color: "hsla({0}, 30%, 10%, 1.0)".format(this.color || 0) },
                        { offset: 1.0, color: "hsla({0}, 30%, 10%, 1.0)".format((this.color || 0) - 50) },
                    ])
                    .toStyle()
            )
            .fillRect(0, 0, W, H);
    }
});



tm.define("CircleButton", {
    superClass: "tm.display.CanvasElement",

    init: function(param) {
        this.superInit();

        param = param || {};

        param.$safe({
            size: 150,
            text: 'A',
            fontFamily: 'FontAwesome',
            fontColor: "white",
            bgColor: "hsl(180, 60%, 50%)",
            strokeColor: "transparent",
            lineWidth: 4,
        });

        this.fromJSON({
            children: {
                bg: {
                    type: "tm.display.Shape",
                    init: {
                        width: param.size,
                        height: param.size,
                    }
                },
                label: {
                    type: "tm.display.Label",
                    init: param.text,
                    fillStyle: param.fontColor,
                    fontFamily: param.fontFamily,
                    fontSize: param.size/2,
                }
            }
        });

        this.setInteractive(true, "circle");
        this.on("pointingend", function() {
            this.flare('push');
        });

        this.fillFlag = param.fillFlag;

        this.lineWidth = param.lineWidth;
        this.strokeColor = param.strokeColor;
        this.bgColor = param.bgColor;
        this.radius = param.size/2;
        this._render();
    },
    _render: function() {
        var c = this.bg.canvas;
        c.setTransformCenter();
        c.fillStyle = this.bgColor;
        c.fillCircle(0, 0, this.radius);

        c.lineWidth = this.lineWidth;
        c.strokeStyle = this.strokeColor;
        c.strokeCircle(0, 0, this.radius-this.lineWidth/2-1);
    },

    fill: function() {
        this.parent.children.each(function(elm) {
            elm.tweener.clear().fadeOut(200)
        });

        var c = this.bg.canvas;
        this.bg.width = SCREEN_WIDTH;
        this.bg.height= SCREEN_HEIGHT;
        this._render();

        this.setInteractive(false);

        this.label.tweener
            .clear()
            .fadeOut(200)
            ;

        this.tweener
            .clear()
            .wait(300)
            .to({
                x: SCREEN_CENTER_X,
                y: SCREEN_CENTER_Y,
            }, 300, 'easeOutQuint')
            .call(function() {
                tm.asset.Manager.get("sounds/warp").clone().play();
            })
            .to({
                radius: 600,
            }, 500, 'easeOutQuint')
            .call(function() {
                this.flare('filled');
            }, this)
            ;

        this.update = function() {
            this._render();
        };
    },

    blink: function() {
        this.tweener
            .clear()
            .set({alpha:0})
            .wait(100)
            .set({alpha:1})
            .wait(100)
            .set({alpha:0})
            .wait(100)
            .set({alpha:1})
            .wait(100)
            .set({alpha:0})
            .wait(100)
            .set({alpha:1})
            .wait(100)
            .set({alpha:0})
            .wait(100)
            .set({alpha:1})
            .wait(100);
        return this;
    }
});




tm.define("RankingButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.trophy),
            bgColor: "hsl(200, 100%, 50%)",
        }.$extend(param));

        this.on('push', function() {
            if (window.gamecenter) {
                var data = {
                    leaderboardId: BOARD_ID
                };
                gamecenter.showLeaderboard(null, null, data);
            }
            else {
                console.log('show gamecenter');
            }
        });
    },
});


tm.define("AdButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.buysellads),
            bgColor: "hsl(0, 100%, 64%)",
        }.$extend(param));

        this.on('push', this._showAd);
    },

    _showAd: function() {
        clickAdCallback = function() {
            this.flare('aded');
        }.bind(this);

        showAd();
    },
});

tm.define("ShareButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.comment),
            bgColor: "hsl(240, 100%, 64%)",
        }.$extend(param));

        this.message = param.message;
        this.url = param.url || "http://twitter.com/daishi_hmr";
        this.on('push', this._share);
    },

    _share: function() {
        var text = this.message;

        if (isNative()) {
            var message = {
                text: text + " #弾幕さん #tmlib",
                activityTypes: ['PostToFacebook'],
                // activityTypes: ["PostToFacebook", "PostToTwitter", "PostToWeibo", "Message", "Mail", "Print", "CopyToPasteboard", "AssignToContact", "SaveToCameraRoll", "AddToReadingList", "PostToFlickr", "PostToVimeo", "TencentWeibo", "AirDrop"];
                activityTypes: ["Message", "Mail", "PostToFacebook", "PostToTwitter"],
                url: this.url,
            };
            window.socialmessage.send(message);
            this.flare('shared');
        }
        else {
            var twitterURL = tm.social.Twitter.createURL({
                type    : "tweet",
                text    : text,
                hashtags: "弾幕さん,tmlib",
                url     : this.url,
            });
            var win = window.open(twitterURL, 'share window', 'width=400, height=300');
            var timer = setInterval(function() {
                if(win.closed) {
                    this.flare('shared');
                    clearInterval(timer);
                }
            }.bind(this), 100);
        }

    },
});

tm.define("PauseButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.pause),
            bgColor: "hsl(0, 0%, 50%)",
        }.$extend(param));
    },
});

tm.define("PlayButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.play),
        }.$extend(param));
    },
});

tm.define("HomeButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.home),
            bgColor: "hsl(60, 90%, 40%)",
        }.$extend(param));
    },
});



tm.define("Life", {
    superClass: "tm.display.CanvasElement",

    init: function() {
        this.superInit();

        var data = UserData.get();

        this.backGroup = tm.display.CanvasElement().addChildTo(this);
        this.frontGroup = tm.display.CanvasElement().addChildTo(this);
        (5).times(function(i) {
            var h = tm.display.StarShape({
                width: 40,
                height: 40,
                fillStyle: "gray",
            }).addChildTo(this.backGroup);
            h.x = i*70;
            h.y = 0;
        }, this);
        (5).times(function(i) {
            var h = tm.display.StarShape({
                width: 40,
                height: 40,
            }).addChildTo(this.frontGroup);
            h.x = i*70;
            h.y = 0;

            h.hide();

            if (data.life>i) {
                h.show();
            }
        }, this);
    },
    decriment: function() {
        var data = UserData.get();
        data.life--;
        UserData.set(data);

        var hearts = this.frontGroup.children;
        hearts[data.life].tweener
            .clear()
            .by({
                y: -100,
                alpha: -1,
            }, 200)
            .call(function() {
                this.flare('decrimented');
            }, this)
            ;
    },

    recovery: function() {
        var data = UserData.get();
        var fronts = this.frontGroup.children;

        (5-data.life).times(function(i) {
            var h = fronts[data.life+i];

            h.show();
            h.alpha = 0;
            h.scale.set(2, 2);

            h.tweener
                .clear()
                .wait(i*250)
                .to({
                    alpha: 1,
                    scaleX: 1,
                    scaleY: 1,
                }, 500)
                ;
        }, this);

        data.life = 5;
        UserData.set(data);
    },

});

tm.define("WaveEffect", {
    superClass: "tm.display.CircleShape",

    init: function() {
        this.superInit({
            fillStyle: "white",
            strokeStyle: "transparent",
        });

        this.tweener.to({
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
        }, 250).call(function() {
            this.remove();
        }, this);

        tm.asset.Manager.get("sounds/touch").clone().play();
    }
});






tm.define("Enemy", {
    superClass: "tm.display.RoundRectangleShape",
    init: function(size, h) {
        this.superInit({
            width: size,
            height: size,
            strokeStyle: "hsl({0}, 45%, 40%)".format(h),
            fillStyle: "hsl({0}, 45%, 20%)".format(h),
            lineWidth: 8,
        });
        this.boundingType = "rect";
        this.checkHierarchy = false;
        this.size = size;

        this.runner = null;

        this.hp = ENEMY_SMALL_HP;
        this.erasing = false;
        this.starCount = 0;
        this.fireToBack = true;

        this.entered = false;
        this.on("enterframe", function() {
            if (!this.entered && this.isInScreen()) {
                this.entered = true;
            } else if (this.entered && !this.isInScreen()) {
                this.remove();
            }
        });
    },
    damage: function() {
        this.hp -= 1;
        if (this.hp <= 0) {
            this.remove();
        }
    },
    isInScreen: function() {
        return -this.size * 0.5 <= this.x && this.x <= W + this.size * 0.5 &&
            -this.size * 0.5 <= this.y && this.y <= H + this.size * 0.5;
    },
    update: function() {
        if (!this.entered) {
            return;
        }

        if (this.fireToBack || this.y < Danmaku.param.target.y) {
            this.runner.x = this.x;
            this.runner.y = this.y;
            this.runner.update();
        }
    }
});

Enemy.types = {};
Enemy.types.small = ["SmallEnemy0", "SmallEnemy1", "SmallEnemy2"];
Enemy.types.middle = ["MiddleEnemy0", "MiddleEnemy1"];
Enemy.types.large = ["LargeEnemy0", "LargeEnemy1", "LargeEnemy2"];

tm.define("SmallEnemy0", {
    superClass: "Enemy",
    init: function(danmakuType) {
        this.superInit(50, 240);
        this.runner = Danmaku.small[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_SMALL_HP;
        this.starCount = 1;
        this.fireToBack = false;

        this.tweener
            .by({
                y: H
            }, 1200, "easeOutQuad")
            .wait(500)
            .by({
                y: -H
            }, 1200, "easeInQuad");
    }
});

tm.define("SmallEnemy1", {
    superClass: "Enemy",
    init: function(danmakuType) {
        this.superInit(50, 240);
        this.runner = Danmaku.small[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_SMALL_HP;
        this.starCount = 1;
        this.fireToBack = false;

        var v = tm.geom.Vector2(0, 4);
        var t = Danmaku.param.target;
        this.on("enterframe", function() {
            if (this.y < t.y) {
                var dv = tm.geom.Vector2.sub(t.position, this.position).normalize().mul(0.2);
                v.add(dv).normalize().mul(4);
            }
            this.position.add(v);
        });
    }
});

tm.define("SmallEnemy2", {
    superClass: "Enemy",
    init: function(danmakuType) {
        this.superInit(50, 240);
        this.runner = Danmaku.small[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_SMALL_HP;
        this.starCount = 1;
        this.fireToBack = false;

        var v = tm.geom.Vector2(0, 4);
        var t = Danmaku.param.target;
        this.on("enterframe", function() {
            if (this.y < t.y) {
                var dv = tm.geom.Vector2.sub(t.position, this.position).normalize().mul(0.2);
                v.add(dv).normalize().mul(8);
            }
            this.position.add(v);
        });
    }
});

tm.define("MiddleEnemy0", {
    superClass: "Enemy",
    init: function(danmakuType) {
        this.superInit(100, 10);
        this.runner = Danmaku.middle[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_MIDDLE_HP;
        this.erasing = true;
        this.starCount = 5;

        this.tweener
            .by({
                y: H
            }, 1200, "easeOutQuad")
            .wait(3000)
            .call(function() {
                this.on("enterframe", function() {
                    this.y += 1;
                });
            }.bind(this));
    }
});

tm.define("MiddleEnemy1", {
    superClass: "Enemy",
    init: function(danmakuType) {
        this.superInit(100, 130);
        this.runner = Danmaku.middle[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_MIDDLE_HP;
        this.erasing = false;
        this.starCount = 5;

        this.tweener
            .by({
                y: H
            }, 1200, "easeOutQuad")
            .wait(3000)
            .call(function() {
                this.on("enterframe", function() {
                    this.y += 1;
                });
            }.bind(this));
    }
});

tm.define("LargeEnemy0", {
    superClass: "Enemy",
    init: function(danmakuType) {
        this.superInit(200, 0);
        this.runner = Danmaku.large[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_LARGE_HP;
        this.erasing = true;
        this.starCount = 20;

        this.tweener
            .to({
                y: 180
            }, 2400, "easeOutQuad");

        this.on("enterframe", function() {
            this.y += 0.25;
        });
    }
});

tm.define("LargeEnemy1", {
    superClass: "Enemy",
    init: function(danmakuType) {
        this.superInit(200, 0);
        this.runner = Danmaku.large[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_LARGE_HP;
        this.erasing = true;
        this.starCount = 20;

        this.one("enterframe", function() {
            this.tweener
                .by({
                    x: W
                }, 2400, "easeOutQuad");
        });

        this.on("enterframe", function() {
            this.y += 0.05;
        });
    }
});

tm.define("LargeEnemy2", {
    superClass: "Enemy",
    init: function(danmakuType) {
        this.superInit(200, 0);
        this.runner = Danmaku.large[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_LARGE_HP;
        this.erasing = true;
        this.starCount = 20;

        this.one("enterframe", function() {
            this.tweener
                .by({
                    x: -W
                }, 2400, "easeOutQuad");
        });

        this.on("enterframe", function() {
            this.y += 0.05;
        });
    }
});
tm.define("Bullet", {
    superClass: "tm.display.Sprite",
    init: function(size, frameIndex, eraseFrameIndex) {
        this.superInit("bullet", 64, 64);
        this.baseFrameIndex = this.frameIndex = frameIndex;
        this.eraseFrameIndex = eraseFrameIndex;

        this.boundingType = "circle";
        this.checkHierarchy = false;
        this.radius = BULLET_BOUNDING_RADIUS;
        this.size = size;
        this.age = 0;

        this.itemize = false;
        this.erasing = false;
        this.runner = null;
        this.pool = null;

        this.on("removed", function() {
            this.pool.push(this);
        });
    },
    reset: function(runner) {
        this.clearEventListener("enterframe");
        this.image = tm.asset.Manager.get("bullet");
        this.frameIndex = this.baseFrameIndex;
        this.erasing = false;
        this.runner = runner;
        this.position.setObject(runner);
        this.itemize = false;
        this.age = 0;
    },
    update: function(app) {
        if (this.runner === null) {
            return;
        }

        this.runner.update();
        this.rotation = Math.atan2(this.runner.y - this.y, this.runner.x - this.x) * Math.RAD_TO_DEG;
        this.position.setObject(this.runner);

        this.age += 1;
        if (!this.erasing) {
            // var f = this.age % 8;
            var f = app.frame % 8;
            if (f > 4) f = 8 - f;
            this.frameIndex = this.baseFrameIndex + 2 + f;
        }

        if (!this.isInScreen()) {
            if (this.parent) this.remove();
        }
    },
    erase: function(itemize) {
        if (!this.erasing && this.visible) {
            this.itemize = itemize;
            this.image = tm.asset.Manager.get("bullet_erase");
            this.frameIndex = this.eraseFrameIndex;
            this.erasing = true;
            this.on("enterframe", function() {
                if (this.age % 4 === 0) {
                    this.frameIndex += 1;
                }
                if (this.frameIndex >= this.eraseFrameIndex + 8) {
                    if (this.parent) this.remove();
                }
            });
            this.flare("erased");
        } else if (!this.visible) {
            // if (this.parent) this.remove();
        }
    },
    isInScreen: function() {
        return -this.size * 0.5 <= this.x && this.x <= W + this.size * 0.5 &&
            -this.size * 0.5 <= this.y && this.y <= H + this.size * 0.5;
    },
});

tm.define("BulletPool", {
    init: function() {
        this.redSmall = [];
        this.blueSmall = [];
        this.redLarge = [];
        this.blueLarge = [];
        this.redSmallCircle = [];
        this.blueSmallCircle = [];
        this.redLargeCircle = [];
        this.blueLargeCircle = [];
        this.invisible = [];
        (BULLET_POOL_SIZE).times(function() {
            var b;

            b = Bullet(20, 16, 0);
            b.pool = this.redSmall;
            this.redSmall.push(b);

            b = Bullet(20, 24, 8);
            b.pool = this.blueSmall;
            this.blueSmall.push(b);

            b = Bullet(30, 0, 0);
            b.pool = this.redLarge;
            this.redLarge.push(b);

            b = Bullet(30, 8, 8);
            b.pool = this.blueLarge;
            this.blueLarge.push(b);

            b = Bullet(20, 48, 0);
            b.pool = this.redSmallCircle;
            this.redSmallCircle.push(b);

            b = Bullet(20, 56, 8);
            b.pool = this.blueSmallCircle;
            this.blueSmallCircle.push(b);

            b = Bullet(30, 32, 0);
            b.pool = this.redLargeCircle;
            this.redLargeCircle.push(b);

            b = Bullet(30, 40, 8);
            b.pool = this.blueLargeCircle;
            this.blueLargeCircle.push(b);

            b = Bullet(30, 0, 0);
            b.pool = this.invisible;
            b.visible = false;
            this.invisible.push(b);

        }.bind(this))

        this.pools = [
            this.redSmall,
            this.blueSmall,
            this.redLarge,
            this.blueLarge,
            this.redSmallCircle,
            this.blueSmallCircle,
            this.redLargeCircle,
            this.blueLargeCircle,
            this.invisible,
        ];
    },
    get: function(type, runner) {
        var bullet = this.pools[type].shift();
        if (bullet !== undefined) {
            bullet.reset(runner);
            runner.onVanish = function() {
                if (bullet.parent) bullet.remove();
            };
            return bullet;
        } else {
            console.warn("弾が足りないニャ");
        }

        return null;
    }
});
tm.define("Player", {
    superClass: "tm.display.Shape",
    init: function() {
        this.superInit({
            width: 80,
            height: 80,
        });
        this.marker = null;
        this.blendMode = "lighter";

        this.canvas
            .setLineStyle(3)
            .setFillStyle("hsl(220, 30%, 30%)")
            .setStrokeStyle("hsl(220, 90%, 90%)")
            .fillTriangle(40, 3, 50, 58, 30, 58)
            .strokeTriangle(40, 3, 50, 58, 30, 58)
            .fillTriangle(30, 25, 25, 58, 5, 68)
            .strokeTriangle(30, 25, 25, 58, 5, 68)
            .fillTriangle(50, 25, 55, 58, 75, 68)
            .strokeTriangle(50, 25, 55, 58, 75, 68);

        this.setPosition(W * 0.5, H * 0.8);

        this.roll = 0;
        this.muteki = false;

        this.positionHistory = [];

        this.shots = [Shot(), Shot()];
        this.bits = Array.range(4).map(function(index) {
            return Bit(this, index);
        }.bind(this));

        this.alive = true;
    },

    damage: function() {
        if (this.muteki) {
            return;
        }

        this.muteki = true;

        this.flare("missed");
    },

    onadded: function() {
        this.bits.forEach(function(bit) {
            this.parent.addChildAt(bit, 0);
        }.bind(this));
        this.positionHistory = Array.range((BIT_COUNT + 1) * BIT_DISTANCE).map(function() {
            return {
                x: this.x,
                y: this.y,
            };
        }.bind(this));
    },

    update: function(app) {
        var bx = this.x;
        var by = this.y;

        var p = app.pointing;
        if (this.alive && p.getPointing() && !p.getPointingStart()) {
            this.position.add(p.deltaPosition.mul(PLAYER_SPEED));
        }

        this.x = Math.clamp(this.x, 6, W - 6);
        this.y = Math.clamp(this.y, 6, H - 6);

        if (bx < this.x) {
            this.roll -= 1;
        } else if (this.x < bx) {
            this.roll += 1;
        } else if (this.roll !== 0) {
            this.roll += -Math.abs(this.roll) / this.roll;
        }

        this.roll = Math.clamp(this.roll, -5, 5);
        this.scaleX = 1 - Math.abs(this.roll) * 0.15;

        this.marker.position.setObject(this);

        if (this.x !== bx || this.y !== by) {
            this.positionHistory.push({
                x: this.x,
                y: this.y,
            });
            if (this.positionHistory.length > (BIT_COUNT + 1) * BIT_DISTANCE) {
                this.positionHistory.shift();
            }
        }

        this.shots.forEach(function(shot, i) {
            if (shot.parent == null) {
                shot.setPosition(this.x + (i - 0.5) * 20, this.y).addChildTo(this.parent);
            }
        }.bind(this));

        if (this.muteki) {
            this.alpha = (Math.floor(app.frame / 2) % 2) * 0.75 + 0.25;
        } else {
            this.alpha = 1;
        }
    }
});

tm.define("Bit", {
    superClass: "tm.display.RectangleShape",
    init: function(player, index) {
        this.superInit({
            width: 30,
            height: 30,
            strokeStyle: "hsl(100, 90%, 90%)",
            fillStyle: "hsl(100, 30%, 30%)",
        });

        this.player = player;
        this.index = index;

        this.shot = Shot();
        this.shot.alpha = 0.25;
    },
    update: function(app) {
        this.rotation += 20;

        var p = this.player.positionHistory[(1 + this.index) * BIT_DISTANCE];
        if (p === undefined) {
            p = {
                x: this.player.x,
                y: this.player.y,
            };
        }
        this.position.setObject(p);

        if (this.shot.parent == null) {
            this.shot.setPosition(this.x, this.y).addChildTo(this.parent);
        }
    }
});

tm.define("PlayerCollisionCircle", {
    superClass: "tm.display.CircleShape",
    init: function() {
        this.superInit({
            width: 18,
            height: 18,
            strokeStyle: "hsl(150, 90%, 90%)",
            fillStyle: "hsl(150, 30%, 30%)",
            lineWidth: 4,
        });
    },
    update: function(app) {
        this.setScale(1.0 + Math.sin(app.frame * 0.4) * 0.2);
    }
});

tm.define("Shot", {
    superClass: "tm.display.RectangleShape",
    init: function() {
        this.superInit({
            width: 10,
            height: 30,
            strokeStyle: "hsl(220, 90%, 90%)",
            fillStyle: "hsl(220, 30%, 30%)",
        });
        this.blendMode = "lighter";

        this.checkHierarchy = false;
    },
    update: function() {
        this.y -= SHOT_SPEED;

        if (this.y < -25) {
            this.remove();
        }
    }
});
var Explosion = function(target, x, y) {
    (6).times(function() {
        var d = Math.rand(0, 360);
        var s = Math.randf(0.8, 1.5);
        (8).times(function(i) {
            var v = tm.geom.Vector2().setAngle(d, (1 + 3 * i) * s);
            var p = Explosion.pool.shift();
            if (p) {
                p.emit(x, y, v).setScale(2 - i * 0.2).addChildTo(target);
            }
        });
    });
};

Explosion.Particle = tm.createClass({
    superClass: tm.display.RectangleShape,
    init: function() {
        this.superInit({
            width: 40,
            height: 40,
            strokeStyle: "hsl(30, 65%, 60%)",
            fillStyle: "hsl(30, 65%, 30%)",
        });
        this.setBlendMode("lighter");

        this.v = null;
    },
    emit: function(x, y, v) {
        this.setPosition(x, y);
        this.setAlpha(0.4);
        this.v = v;
        return this;
    },
    update: function() {
        this.position.add(this.v);
        this.v.mul(0.9);
        this.alpha *= 0.9;
        if (this.alpha < 0.001) {
            this.remove();
            Explosion.pool.push(this);
        }
    }
});

Explosion.pool = Array.range(256).map(function() {
    return Explosion.Particle();
});

var PlayerExplosion = function(target, x, y) {
    var se = ["sound/exp1", "sound/exp2", "sound/exp3"].pickup();
    tm.sound.SoundManager.play(se);
    (6).times(function() {
        var d = Math.rand(0, 360);
        var s = Math.randf(0.8, 1.5);
        (8).times(function(i) {
            var v = tm.geom.Vector2().setAngle(d, (1 + 4 * i) * s);
            var p = PlayerExplosion.pool.shift();
            if (p) {
                p.emit(x, y, v).setScale(2 - i * 0.2).addChildTo(target);
            }
        });
    });
};

PlayerExplosion.Particle = tm.createClass({
    superClass: tm.display.RectangleShape,
    init: function() {
        this.superInit({
            width: 60,
            height: 60,
            strokeStyle: "hsl(230, 65%, 60%)",
            fillStyle: "hsl(230, 65%, 30%)",
        });
        this.setBlendMode("lighter");

        this.v = null;
    },
    emit: function(x, y, v) {
        this.setPosition(x, y);
        this.setAlpha(0.4);
        this.v = v;
        return this;
    },
    update: function() {
        this.position.add(this.v);
        this.v.mul(0.95);
        this.alpha *= 0.95;
        if (this.alpha < 0.001) {
            this.remove();
            PlayerExplosion.pool.push(this);
        }
    }
});

PlayerExplosion.pool = Array.range(256).map(function() {
    return PlayerExplosion.Particle();
});

tm.define("StarItem", {
    superClass: "tm.display.StarShape",
    init: function(pool) {
        this.superInit({
            width: 40,
            height: 40,
            fillStyle: "transparent",
            strokeStyle: "hsl(60, 80%, 80%)",
            sideIndent: 0.7,
            lineWidth: 4,
        });
        this.pool = pool;
        this.target = null;
        this.flying = false;

        this.boundingType = "circle";
        this.radius = 30;
        this.checkHierarchy = false;

        this.fv = tm.geom.Vector2(0, 0);
    },
    onremoved: function() {
        this.pool.stars.push(this);
    },
    update: function() {
        if (this.flying) {
            this.position.add(this.fv);
            this.fv.mul(0.7);
            if (this.fv.lengthSquared() < 0.1 * 0.1) {
                this.flying = false;
            }
        } else if (this.target) {
            var v = tm.geom.Vector2.sub(this.target, this);
            v.normalize().mul(10);
            this.position.add(v);
        } else {
            this.y += 3;
        }

        if (H + 200 < this.y) {
            this.remove();
        }
    },
    setTarget: function(target) {
        this.target = target;
    }
});

tm.define("StarItemPool", {
    init: function() {
        this.stars = Array.range(256 * 4).map(function() {
            return StarItem(this);
        }.bind(this));
    },
    get: function() {
        var star = this.stars.shift();
        if (star !== undefined) {
            star.target = null;
            return star;
        }
        return null;
    }
});
tm.define("TitleScene", {
    superClass: "tm.app.Scene",
    init: function() {
        this.superInit();
        this.fromJSON({
            children: {
                backgroundLayer: {
                    type: "CanvasLayer",
                    init: "#back",
                    renderInterval: 60,
                },
                bg: {
                    type: "tm.display.RectangleShape",
                    init: {
                        width: SCREEN_WIDTH,
                        height: SCREEN_HEIGHT,
                        strokeStyle: "transparent",
                        fillStyle: "black",
                    },
                    originX: 0,
                    originY: 0,
                },
                title1: {
                    type: "tm.display.Label",
                    init: ["よけろ！", 60],
                    x: SCREEN_WIDTH * 0.25,
                    y: SCREEN_HEIGHT * 0.2,
                    rotation: -15,
                    fillStyle: "hsl(40, 40%, 50%)",
                },
                title2: {
                    type: "tm.display.Label",
                    init: ["弾幕さん", 80],
                    x: SCREEN_WIDTH * 0.4,
                    y: SCREEN_HEIGHT * 0.3,
                    fillStyle: "hsl(10, 40%, 50%)",
                },
                title3: {
                    type: "tm.display.Label",
                    init: ["Ａｐｐ", 80],
                    x: SCREEN_WIDTH * 0.75,
                    y: SCREEN_HEIGHT * 0.3,
                    fillStyle: "hsl(60, 40%, 80%)",
                },

                life: {
                    type: "Life",
                    x: 180,
                    y: SCREEN_HEIGHT * 0.45,
                },
                playButton: {
                    type: "PlayButton",
                    init: {
                        size: 120,
                    },
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * 0.6,
                    update: function(app) {
                        this.setScale(1.0 + Math.sin(app.frame * 0.15) * 0.05);
                    },
                },

                shareButton: {
                    type: "ShareButton",
                    init: {
                        size: 80,
                        message: TITLE_TWEET,
                        url: APP_URL,
                    },
                    x: SCREEN_WIDTH * 0.25,
                    y: SCREEN_HEIGHT * 0.8,
                    onpointingend: function() {
                        this.blink();
                        tm.sound.SoundManager.play("sound/ok");
                    },
                },

                rankButton: {
                    type: "RankingButton",
                    init: {
                        size: 80,
                    },
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * 0.85,
                    onpointingend: function() {
                        this.blink();
                        tm.sound.SoundManager.play("sound/ok");
                    },
                },
                adButton: {
                    type: "AdButton",
                    init: {
                        size: 80,
                    },
                    x: SCREEN_WIDTH * 0.75,
                    y: SCREEN_HEIGHT * 0.8,
                    onpointingend: function() {
                        this.blink();
                        tm.sound.SoundManager.play("sound/ok");
                    },
                },

                hmdLayer: {
                    type: "CanvasLayer",
                    init: "#hmd",
                    renderInterval: 60,
                    visible: false,
                },
            }
        });

        var scene = this;

        [this.playButton, this.shareButton, this.adButton, this.rankButton].forEach(function(button) {
            button.y -= SCREEN_HEIGHT;
            button.tweener.clear().by({
                y: SCREEN_HEIGHT
            }, 1200 + tm.util.Random.randint(0, 400), "easeOutBounce");
        });

        this.playButton.onpush = function() {
            if (UserData.hasLife()) {
                tm.sound.SoundManager.play("sound/ok");
                this.setInteractive(false).blink();
                if (TARGET === 'release') {
                    // ライフを減らすやつ
                    scene.life.ondecrimented = function() {
                        scene.startGame();
                    };
                    scene.life.decriment();
                } else {
                    scene.startGame();
                }

            } else {
                tm.sound.SoundManager.play("sound/cancel");
                scene.shareButton.blink();
                scene.adButton.blink();
            }
        };

        this.adButton.onaded = function() {
            this.life.recovery();
        }.bind(this);

        this.shareButton.onshared = function() {
            this.life.recovery();
        }.bind(this);
    },

    startGame: function() {
        var scene = this;
        tm.display.RectangleShape({
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT,
                fillStyle: "black",
                strokeStyle: "transparent",
            })
            .setOrigin(0, 0)
            .setAlpha(0)
            .addChildTo(scene)
            .tweener.fadeIn(1000).call(function() {
                scene.app.popScene();
            });
    }
});
tm.define("GameScene", {
    superClass: "tm.app.Scene",
    init: function() {
        var gameScene = this;

        this.superInit();
        this.fromJSON({
            children: {
                erasingTimer: {
                    type: "tm.app.Element"
                },
                backgroundLayer: {
                    type: "CanvasLayer",
                    init: "#back",
                    renderInterval: 4,
                    children: {
                        background: {
                            type: "Background"
                        },
                        space: {
                            type: "tm.display.RectangleShape",
                            init: {
                                width: SCREEN_WIDTH,
                                height: SCREEN_HEIGHT - H,
                                strokeStyle: "transparent",
                                fillStyle: "hsl(220, 30%, 50%)"
                            },
                            originX: 0,
                            originY: 0,
                            y: H
                        }
                    }
                },
                enemyLayer: {
                    type: "GameSceneLayer",
                    counter: 0,
                    update: function(app) {
                        this.counter += gameScene.weight;
                        if (this.counter >= 1) {
                            this.counter -= 1;
                            this.children.forEach(function(c) {
                                c.wakeUp();
                            });
                        } else {
                            this.children.forEach(function(c) {
                                c.sleep();
                            });
                        }
                    }
                },
                playerLayer: {
                    type: "GameSceneLayer",
                    children: {
                        player: {
                            type: "Player"
                        }
                    }
                },
                bulletLayer: {
                    type: "GameSceneLayer",
                    counter: 0,
                    update: function(app) {
                        this.counter += gameScene.weight;
                        if (this.counter >= 1) {
                            this.counter -= 1;
                            this.children.forEach(function(c) {
                                c.wakeUp();
                            });
                        } else {
                            this.children.forEach(function(c) {
                                c.sleep();
                            });
                        }
                    }
                },
                topLayer: {
                    type: "GameSceneLayer",
                    children: {
                        playerMarker: {
                            type: "PlayerCollisionCircle",
                        }
                    }
                },
                hmdLayer: {
                    type: "CanvasLayer",
                    init: "#hmd",
                    renderInterval: 3,
                    children: {
                        scoreLabel: {
                            type: "tm.display.Label",
                            init: ["0 点", 30],
                            align: "right",
                            baseline: "top",
                            x: SCREEN_WIDTH - 20,
                            y: 20,
                            displayScore: 0,
                            bs: 0,
                            unit: 0,
                            update: function() {
                                if (this.bs !== gameScene.score) {
                                    this.unit = Math.floor((gameScene.score - this.displayScore) / 9);
                                }
                                if (this.unit < gameScene.score - this.displayScore) {
                                    this.displayScore += this.unit;
                                } else if (this.displayScore < gameScene.score) {
                                    this.displayScore = gameScene.score;
                                }
                                this.text = this.displayScore + " 点";

                                this.bs = gameScene.score;
                            }
                        },
                        stepLabel: {
                            type: "tm.display.Label",
                            init: ["0 光年", 30],
                            align: "right",
                            baseline: "top",
                            x: SCREEN_WIDTH - 20,
                            y: 60,
                            update: function() {
                                var before = this.text;
                                this.text = Math.floor(gameScene.step / 20) + " 光年";
                                if (this.text !== before) {
                                    this.tweener.clear()
                                        .to({
                                            scaleX: 2,
                                            scaleY: 2,
                                        }, 400, "easeOutBack")
                                        .to({
                                            scaleX: 1,
                                            scaleY: 1,
                                        }, 400, "easeOutQuad");
                                }
                            }
                        },
                        // debugLabel: {
                        //     type: "tm.display.Label",
                        //     init: ["", 30],
                        //     align: "right",
                        //     baseline: "top",
                        //     x: SCREEN_WIDTH - 20,
                        //     y: 100,
                        //     update: function() {
                        //         this.text = "enemyInterval " + gameScene.enemyInterval;
                        //     }
                        // },
                        zankiLabel: {
                            type: "tm.display.Label",
                            init: ["残機 2", 30],
                            align: "left",
                            baseline: "top",
                            x: 20,
                            y: 20,
                            update: function() {
                                this.text = "残機 " + Math.max(gameScene.zanki - 1, 0);
                            }
                        }
                    }
                },
            }
        });

        this.score = 0;
        this.zanki = 3;
        this.weight = 1;

        this.bulletPool = BulletPool();
        this.starPool = StarItemPool();

        this.player = this.playerLayer.player;
        this.player.marker = this.topLayer.playerMarker;
        this.player.on("missed", function() {
            tm.sound.SoundManager.play("sound/miss");
            PlayerExplosion(gameScene.backgroundLayer.background.fg, this.x, this.y);
            gameScene.zanki -= 1;
            if (gameScene.zanki > 0) {
                this.tweener.clear().wait(3000).call(function() {
                    this.muteki = false;
                }.bind(this));
            } else {
                this.muteki = false;
                this.alive = false;
                gameScene.playerLayer.hide();
                gameScene.topLayer.playerMarker.hide();

                gameScene.tweener
                    .wait(3000)
                    .call(function() {
                        gameScene.gameover();
                    });
            }
        });

        Danmaku.param.target = this.player;
        Danmaku.param.createNewBullet = function(runner, spec) {
            var bullet = gameScene.bulletPool.get(spec.type, runner);
            if (bullet == null) {
                return;
            }
            gameScene.bullets.push(bullet);
            bullet.onerased = function() {
                if (this.itemize) {
                    var star = gameScene.starPool.get();
                    if (star !== null) {
                        star
                            .setPosition(this.x, this.y)
                            .addChildTo(gameScene.backgroundLayer.background.fg);
                        star.flying = false;
                        gameScene.stars.push(star);
                    }
                }
            };
            bullet.onremoved = function() {
                gameScene.bullets.erase(this);
            };
            bullet.addChildTo(gameScene.bulletLayer);
        };

        this.mt = new MersenneTwister(Math.rand(1, MT_SEED));
        this.mt.range = function(f, t) {
            return f + this.nextInt(t - f);
        };
        this.mt.rangef = function(f, t) {
            return f + this.next() * (t - f);
        };
        this.mt.pickup = function(array) {
            return array[this.nextInt(array.length)];
        };

        this.countDown = 200;
        this.rank = 0;
        this.enemyInterval = 200;
        this.step = 0;
        this.erasingBullets = false;

        this.enemies = [];
        this.shots = [
            this.player.shots[0],
            this.player.shots[1],
            this.player.bits[0].shot,
            this.player.bits[1].shot,
            this.player.bits[2].shot,
            this.player.bits[3].shot,
        ];
        this.bullets = [];
        this.stars = [];

        tm.sound.SoundManager.playMusic("sound/bgm");
        this.on("exit", function() {
            tm.sound.SoundManager.stopMusic();
        });
    },

    eraseAllBullets: function(itemize) {
        this.bullets.forEach(function(bullet) {
            bullet.erase(itemize);
        });
    },

    update: function(app) {
        if (this.player.alive) {
            this.testHit();
        }

        this.countDown -= 1;
        if (this.countDown <= 0) {
            // this.enemyInterval = Math.max(this.enemyInterval - ENEMY_INTERVAL_DECR, 80);
            this.enemyInterval = 80;
            this.step += 1;
            Danmaku.param.speedRate = 1 + Math.sqrt(this.step * 0.05) * 0.2;
            // Danmaku.param.interval = Math.max(0.5, Danmaku.param.interval - 0.01);
            Danmaku.param.interval = 0.5;
            // var et = this.mt.nextInt(100);
            var et = 0;
            if (et < 50) {
                this._launchSmall();
                this.countDown = this.enemyInterval * 1.0;
            } else if (et < 80) {
                this._launchMiddle();
                this.countDown = this.enemyInterval * 1.5;
            } else {
                this._launchLarge();
                this.countDown = this.enemyInterval * 2.0;
            }
        }

        if (this.player.alive && !app.pointing.getPointing()) {
            this.weight = 0.5;
        } else if (this.bullets.length > 50) {
            this.weight = Math.max(1 - (this.bullets.length - 50) / 400, 0.1);
        } else {
            this.weight = 1.0;
        }

        if (this.player.muteki || this.erasingBullets) {
            this.eraseAllBullets(false);
        }
    },

    gameover: function() {
        var gameScene = this;

        tm.display.RectangleShape({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            fillStyle: "black",
            strokeStyle: "transparent",
        })
            .setOrigin(0, 0)
            .setAlpha(0)
            .addChildTo(this.hmdLayer)
            .tweener.fadeIn(3000).call(function() {
                gameScene.nextArguments = {
                    score: gameScene.score,
                };
                gameScene.app.popScene();
            });
    },

    addScore: function(score) {
        if (Math.floor(this.score / EXTEND_SCORE) < Math.floor((this.score + score) / EXTEND_SCORE)) {
            this.zanki += 1;
            tm.sound.SoundManager.play("sound/extend");
        }
        this.score += score;
    },

    testHit: function() {
        this.testPlayerVsStarItem();
        this.testShotVsEnemy();
        // this.testPlayerVsEnemy();
        this.testPlayerVsBullet();
    },

    testPlayerVsStarItem: function() {
        var star;
        var player = this.player;
        var stars = this.stars.slice();
        for (var i = 0, len = stars.length; i < len; i++) {
            star = stars[i];
            if (star.isHitPoint(player.x, player.y)) {
                if (star.parent) star.remove();
                this.stars.erase(star);
                this.addScore(100);
                tm.sound.SoundManager.play("sound/score");
            } else if ((player.x - star.x) * (player.x - star.x) + (player.y - star.y) * (player.y - star.y) < 200 * 200) {
                star.setTarget(player);
            }
        }
    },

    testShotVsEnemy: function() {
        var shot;
        var enemy;
        var shots = this.shots.slice();
        var enemies = this.enemies.slice();
        for (var e = 0, elen = enemies.length; e < elen; e++) {
            enemy = enemies[e];
            for (var s = 0, slen = shots.length; s < slen; s++) {
                shot = shots[s];
                if (shot.parent == null) {
                    continue;
                }

                if (enemy.isHitPoint(shot.x, shot.y)) {
                    enemy.damage();
                    shot.remove();
                    tm.sound.SoundManager.play("sound/hit");
                    if (enemy.parent == null) {
                        Explosion(this.backgroundLayer.background.fg, enemy.x, enemy.y);
                        var se = ["sound/exp1", "sound/exp2", "sound/exp3"].pickup();
                        tm.sound.SoundManager.play(se);
                        if (enemy.erasing) {
                            this.erasingBullets = true;
                            this.erasingTimer.tweener.clear().wait(500).call(function() {
                                this.erasingBullets = false;
                            }.bind(this));
                            this.eraseAllBullets(true);
                        }

                        for (var count = 0; count < enemy.starCount; count++) {
                            var star = this.starPool.get();
                            if (star !== null) {
                                star.setPosition(enemy.x, enemy.y)
                                    .addChildTo(this.backgroundLayer.background.fg);
                                star.flying = true;
                                star.fv = tm.geom.Vector2().setRandom(-135, -45, 50);
                                this.stars.push(star);
                            }
                        }
                        break;
                    }
                }
            }
        }
    },

    testPlayerVsEnemy: function() {
        var player = this.player;
        var enemy;
        for (var i = 0, len = this.enemies.length; i < len; i++) {
            enemy = this.enemies[i];
            if (enemy.isHitPoint(player.x, player.y)) {
                player.damage();
                this.eraseAllBullets(false);
            }
        }
    },

    testPlayerVsBullet: function() {
        var player = this.player;
        var bullet;
        var bullets = this.bullets.slice();
        for (var i = 0, len = bullets.length; i < len; i++) {
            bullet = bullets[i];
            if (!bullet.visible || bullet.erasing) {
                continue;
            }
            if (bullet.isHitPoint(player.x, player.y)) {
                player.damage();
                bullet.remove();
                this.eraseAllBullets(false);
            }
        }
    },

    _launchSmall: function() {
        var gameScene = this;
        var danmakuType = this.mt.nextInt(Danmaku.small.length);
        var count = 5 * (1 + this.mt.nextInt(3));
        var enemyType = this.mt.pickup(Enemy.types.small);
        (count).times(function(i) {
            var enemy = tm.using(enemyType)(danmakuType)
                .setPosition(this.mt.range(60, W - 60), -H * this.mt.rangef(0.4, 0.8));
            enemy.onadded = function() {
                gameScene.enemies.push(this);
            };
            enemy.onremoved = function() {
                gameScene.enemies.erase(this);
            };

            EnemySpawner(enemy, this.mt.range(1, 1000)).addChildTo(this.enemyLayer);
        }.bind(this));

        // console.log("s", count, enemyType, danmakuType);
    },

    _launchMiddle: function() {
        var gameScene = this;
        var danmakuType = this.mt.nextInt(Danmaku.middle.length);
        var count = 2 + this.mt.nextInt(2);
        var enemyType = this.mt.pickup(Enemy.types.middle);
        (count).times(function(i) {
            var enemy = tm.using(enemyType)(danmakuType)
                .setPosition(this.mt.range(120, W - 120), -H * this.mt.rangef(0.6, 0.9));
            enemy.onadded = function() {
                gameScene.enemies.push(this);
            };
            enemy.onremoved = function() {
                gameScene.enemies.erase(this);
            };

            EnemySpawner(enemy, this.mt.range(1, 1000)).addChildTo(this.enemyLayer);
        }.bind(this));

        // console.log("m", count, enemyType, danmakuType);
    },

    _launchLarge: function() {
        var gameScene = this;
        var danmakuType = this.mt.nextInt(Danmaku.large.length);
        var enemyType = this.mt.pickup(Enemy.types.large);

        var enemy = tm.using(enemyType)(danmakuType);
        if (enemyType === "LargeEnemy0") {
            enemy.setPosition(this.mt.range(180, W - 180), -H * Math.randf(0.5, 0.8));
        } else if (enemyType === "LargeEnemy1") {
            enemy.setPosition(-this.mt.range(W * 0.2, W * 0.8), 180);
        } else {
            enemy.setPosition(W + this.mt.range(W * 0.2, W * 0.8), 180);
        }

        enemy.onadded = function() {
            gameScene.enemies.push(this);
        };
        enemy.onremoved = function() {
            gameScene.enemies.erase(this);
        };

        enemy.addChildTo(this.enemyLayer);

        // console.log("l", 1, enemyType, danmakuType);
    },

    onpoped: function() {
        this.backgroundLayer.clear().setVisible(false);
        this.hmdLayer.clear().setVisible(false);
    }
});

tm.define("EnemySpawner", {
    superClass: "tm.display.CanvasElement",
    init: function(enemy, wait) {
        this.superInit();
        this.enemy = enemy;

        this.tweener
            .wait(wait)
            .call(function() {
                this.spawn();
            }.bind(this));
    },
    spawn: function() {
        this.parent.addChild(this.enemy);
        this.remove();
    }
});

tm.define("GameSceneLayer", {
    superClass: "tm.display.CanvasElement",
    init: function() {
        this.superInit();
        this.fromJSON({
            originX: 0,
            originY: 0,
            width: W,
            height: H,
            clipping: true,
        });
    }
});
tm.define("ResultScene", {
    superClass: "tm.app.Scene",
    init: function(param) {
        this.superInit(param);

        var self = this;
        var userData = UserData.get();
        var bestScore = (userData.bestScore) ? userData.bestScore : 0;
        var isHighest = (param.score > bestScore);

        if (isHighest) {
            userData.bestScore = param.score;
            UserData.set(userData);
        }

        // gamecenter にスコアを送る
        this.sendHighScore(userData.bestScore);

        this.fromJSON({
            children: {
                backgroundLayer: {
                    type: "CanvasLayer",
                    init: "#back",
                    renderInterval: 60,
                    children: {
                        bd: {
                            type: "tm.display.RectangleShape",
                            init: {
                                width: SCREEN_WIDTH,
                                height: SCREEN_HEIGHT,
                                fillStyle: "black",
                                strokeStyle: "transparent",
                            },
                            originX: 0,
                            originY: 0,
                        }
                    }
                },
                title: {
                    type: "tm.display.Label",
                    init: ["成績", 50],
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * 0.1,
                    fillStyle: "rgb(230, 230, 230)",
                },
                scoreTitleLabel: {
                    type: "tm.display.Label",
                    init: ["スコア ", 30],
                    align: "left",
                    x: SCREEN_WIDTH * 0.2,
                    y: SCREEN_HEIGHT * 0.2,
                    fillStyle: "rgb(230, 230, 230)",
                },
                scoreLabel: {
                    type: "tm.display.Label",
                    init: [param.score + "点", 30],
                    align: "right",
                    x: SCREEN_WIDTH * 0.8,
                    y: SCREEN_HEIGHT * 0.2,
                    fillStyle: "rgb(230, 230, 230)",
                },
                highscoreTitleLabel: {
                    type: "tm.display.Label",
                    init: ["ベスト ", 30],
                    align: "left",
                    x: SCREEN_WIDTH * 0.2,
                    y: SCREEN_HEIGHT * 0.3,
                    fillStyle: "rgb(230, 230, 230)",
                },
                highscoreLabel: {
                    type: "tm.display.Label",
                    init: [userData.bestScore + "点", 30],
                    align: "right",
                    x: SCREEN_WIDTH * 0.8,
                    y: SCREEN_HEIGHT * 0.3,
                    fillStyle: "rgb(230, 230, 230)",
                },
                updateLabel: {
                    type: "tm.display.Label",
                    init: ["new record!!", 27],
                    align: "right",
                    x: SCREEN_WIDTH * 0.8,
                    y: SCREEN_HEIGHT * 0.3 - 30,
                    visible: isHighest,
                    fillStyle: "red",
                    update: function(app) {
                        this.alpha = 0.5 + (Math.floor(app.frame / 3) % 2) * 0.5;
                    },
                },

                life: {
                    type: "Life",
                    x: 180,
                    y: SCREEN_HEIGHT * 0.45,
                },

                shareButton: {
                    type: "ShareButton",
                    init: {
                        size: 80,
                        message: RESULT_URL.format(param),
                        url: APP_URL,
                    },
                    x: SCREEN_WIDTH * 0.25,
                    y: SCREEN_HEIGHT * 0.8,
                    onpointingend: function() {
                        this.blink();
                        tm.sound.SoundManager.play("sound/ok");
                    },
                },

                homeButton: {
                    type: "HomeButton",
                    init: {
                        size: 120,
                    },
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * 0.6,
                    onpointingend: function() {
                        this.blink();
                        tm.sound.SoundManager.play("sound/ok");
                        this.setInteractive(false);
                        self.exit();
                    },
                },

                rankButton: {
                    type: "RankingButton",
                    init: {
                        size: 80,
                    },
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * 0.85,
                    onpointingend: function() {
                        this.blink();
                        tm.sound.SoundManager.play("sound/ok");
                    },
                },
                adButton: {
                    type: "AdButton",
                    init: {
                        size: 80,
                    },
                    x: SCREEN_WIDTH * 0.75,
                    y: SCREEN_HEIGHT * 0.8,
                    onpointingend: function() {
                        this.blink();
                        tm.sound.SoundManager.play("sound/ok");
                    },
                },

                hmdLayer: {
                    type: "CanvasLayer",
                    init: "#hmd",
                    renderInterval: 60,
                    visible: false,
                },
            }
        });

        this.adButton.onaded = function() {
            this.life.recovery();
        }.bind(this);

        this.shareButton.onshared = function() {
            this.life.recovery();
        }.bind(this);

        if (tm.util.Random.randint(0, 5) === 0) {
            setTimeout(function() {
                showAd();
            }, 1000);
        }
    },

    sendHighScore: function(score) {
        if (window.gamecenter) {
            var data = {
                score: score,
                leaderboardId: BOARD_ID,
            };

            gamecenter.submitScore(function() {
                // alert('success');
            }, function() {
                // alert('failure');
            }, data);
        }
    },

    exit: function() {
        var scene = this;
        tm.display.RectangleShape({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            fillStyle: "black",
            strokeStyle: "transparent",
        })
            .setOrigin(0, 0)
            .setAlpha(0)
            .addChildTo(this)
            .tweener.fadeIn(1000).call(function() {
                scene.app.popScene();
            });
    },
});

tm.main(function() {

    var app = Application();
    app.run();

    var loadingScene = tm.game.LoadingScene({
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
        nextScene: ManagerScene,
    });
    app.replaceScene(loadingScene);
});

tm.define("ManagerScene", {
    superClass: "tm.game.ManagerScene",
    init: function() {
        tm.display.Label.default.fontFamily = "unifont";
        tm.sound.SoundManager.volume = 0.2;
        tm.sound.SoundManager.musicVolume = 0.2;

        tm.dom.Element("#back").visible = true;
        tm.dom.Element("#hmd").visible = true;

        this.superInit({
            startLabel: "title",
            scenes: [{
                label: "title",
                className: "TitleScene",
                nextLabel: "game",
            }, {
                label: "game",
                className: "GameScene",
                nextLabel: "result",
            }, , {
                label: "result",
                className: "ResultScene",
                nextLabel: "title",
            }, ],
        });
    }
});
