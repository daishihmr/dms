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

var APP_URL = "http://www.dev7.jp";
var TITLE_TWEET = "たまを　よけろ";
var RESULT_URL = TITLE_TWEET + " SCORE: {score} flick";
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
var BIT_DISTANCE = 6;
var BIT_FIRST_DISTANCE = 4;

var SHOT_SPEED = 30;

var BULLET_POOL_SIZE = 256;
var BULLET_BOUNDING_RADIUS = 4;

var MT_SEED = 10;

var ENEMY_SMALL_HP = 2;
var ENEMY_MIDDLE_HP = 10;
var ENEMY_LARGE_HP = 50;

var EXTEND_SCORE = 100000;

var ENEMY_INTERVAL_DECR = 1;

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
    speedRate: 1
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
    var wait = bulletml.dsl.wait;
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
            fire(direction("$1", "relative"), speed("10 + $2 * 0.2"), BCS),
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

    // Danmaku.small = [Danmaku.small.last];
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
    var wait = bulletml.dsl.wait;
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
            repeat(999, [
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
            repeat(999, [
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
            repeat(999, [
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
            repeat(999, [
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
            repeat(999, [
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
            repeat(999, [
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
            repeat(999, [
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
            repeat(999, [
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

    Danmaku.middle = [Danmaku.middle.last];
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
    var wait = bulletml.dsl.wait;
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
            repeat(999, [
                wait(20),
                fire(speed(5), RCL),
            ]),
        ]),
    }));

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
                sides: Math.rand(3, 9),
                width: size,
                height: size,
                fillStyle: "hsla({0}, 90%,  5%, 0.1)".format(h),
                strokeStyle: "hsla({0}, 90%, 80%, 0.1)".format(h),
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
        this.url = param.url || "http://twitter.com/phi_jp";
        this.on('push', this._share);
    },

    _share: function() {
        var text = this.message;

        if (isNative()) {
            var message = {
                text: text + " #FlickArrow #tmlib",
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
                hashtags: "FlickArrow,tmlib",
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
            bgColor: HOME_COLOR,
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
            var h = tm.display.HeartShape({
                width: 40,
                height: 40,
                fillStyle: "gray",
            }).addChildTo(this.backGroup);
            h.x = i*70;
            h.y = 0;
        }, this);
        (5).times(function(i) {
            var h = tm.display.HeartShape({
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
            .to({
                y: 120
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
            .to({
                y: 120
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
        this.superInit(150, 0);
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
        this.superInit(150, 0);
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
        this.superInit(150, 0);
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
        // this.frameIndex = frameIndex + 3;
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
                if (this.age % 2 === 0) {
                    this.frameIndex += 1;
                }
                if (this.frameIndex >= this.eraseFrameIndex + 8) {
                    if (this.parent) this.remove();
                }
            });
        } else if (!this.visible) {
            if (this.parent) this.remove();
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
            bullet.clearEventListener("enterframe");
            bullet.image = tm.asset.Manager.get("bullet");
            bullet.frameIndex = bullet.baseFrameIndex;
            bullet.erasing = false;
            bullet.runner = runner;
            bullet.position.setObject(runner);
            bullet.itemize = false;
            bullet.age = 0;
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

        this.shot = Shot();
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
        this.positionHistory = Array.range((BIT_COUNT + 1) * BIT_DISTANCE + BIT_FIRST_DISTANCE).map(function() {
            return {
                x: this.x,
                y: this.y,
            };
        }.bind(this));
    },

    update: function(app) {
        var bx = this.x;
        var by = this.y;

        if (this.alive && !app.pointing.getPointingStart() && app.pointing.getPointing()) {
            this.position.add(app.pointing.deltaPosition.mul(PLAYER_SPEED));
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
            if (this.positionHistory.length > (BIT_COUNT + 1) * BIT_DISTANCE + BIT_FIRST_DISTANCE) {
                this.positionHistory.shift();
            }
        }

        if (this.shot.parent == null) {
            this.shot.setPosition(this.x, this.y).addChildTo(this.parent);
        }

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
    },
    update: function(app) {
        this.rotation += 20;

        var p = this.player.positionHistory[(1 + this.index) * 6];
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
            width: 30,
            height: 30,
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

        if (H + 30 < this.y) {
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
                        fillStyle: "white",
                    },
                    originX: 0,
                    originY: 0,
                },
                title: {
                    type: "tm.display.Label",
                    init: ["よけろ！弾幕さん", 60],
                    fillStyle: "#333",
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * 0.2,
                },
                life: {
                    type: "tm.display.CanvasElement"
                },
                playButton: {
                    type: "PlayButton",
                    init: {
                        size: 120,
                    },
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * 0.6,
                    onpointingend: function() {
                        this.blink();
                        tm.sound.SoundManager.play("sound/ok");
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

        this.playButton.onpush = function() {
            this.setInteractive(false).blink();
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
        };
    },
});

tm.define("GameScene", {
    superClass: "tm.app.Scene",
    init: function() {
        var gameScene = this;

        this.superInit();
        this.fromJSON({
            children: {
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
                            init: ["ステップ 0", 30],
                            align: "right",
                            baseline: "top",
                            x: SCREEN_WIDTH - 20,
                            y: 60,
                            update: function() {
                                this.text = "ステップ " + gameScene.step;
                            }
                        },
                        debugLabel: {
                            type: "tm.display.Label",
                            init: ["", 30],
                            align: "right",
                            baseline: "top",
                            x: SCREEN_WIDTH - 20,
                            y: 100,
                            update: function() {
                                this.text = "enemyInterval " + gameScene.enemyInterval;
                            }
                        },
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
            bullet.onremoved = function() {
                gameScene.bullets.erase(this);
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
        this.enemyInterval = 200;
        this.step = 0;

        this.enemies = [];
        this.shots = [
            this.player.shot,
            this.player.bits[0].shot,
            this.player.bits[1].shot,
            this.player.bits[2].shot,
            this.player.bits[3].shot,
        ];
        this.bullets = [];
        this.stars = [];

        // tm.sound.SoundManager
        //     .setVolumeMusic(0.5)
        //     .playMusic("sound/bgm");
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
            this.enemyInterval = Math.max(this.enemyInterval - ENEMY_INTERVAL_DECR, 40);
            this.step += 1;
            // var et = this.mt.nextInt(100);
            var et = 50;
            if (et < 50) {
                this._launchSmall();
                this.countDown = this.enemyInterval * 1.0;
            } else if (et < 80) {
                this._launchMiddle();
                this.countDown = this.enemyInterval * 2.0;
            } else {
                this._launchLarge();
                this.countDown = this.enemyInterval * 4.0;
            }
        }

        if (this.bullets.length > 200) {
            this.weight = Math.max(1 - (this.bullets.length - 200) / 800, 0.1);
        } else {
            this.weight = 1.0;
        }

        if (this.player.muteki) {
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
                this.score += 100;
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
                .setPosition(this.mt.range(120, W - 120), -H * this.mt.rangef(0.5, 0.8));
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
                text: {
                    type: "tm.display.Label",
                    init: ["りざると", 50],
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * 0.5,
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
    }
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
