var APP_URL = "http://www.dev7.jp";
var TITLE_TWEET = "たまを　よけろ";
var RESULT_URL = TITLE_TWEET + " SCORE: {score}";
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

var SHOT_SPEED = 40;

var BULLET_POOL_SIZE = 256;
var BULLET_BOUNDING_RADIUS = 4;

var MT_SEED = 5;

var ENEMY_SMALL_HP = 2;
var ENEMY_MIDDLE_HP = 10;
var ENEMY_LARGE_HP = 100;

var EXTEND_SCORE = 200000;

var ENEMY_INTERVAL_DECR = 0.5;

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
