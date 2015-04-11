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
                title: {
                    type: "tm.display.Label",
                    init: ["よけろ！弾幕さん", 40],
                    fillStyle: "white",
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
                },

                rankButton: {
                    type: "RankingButton",
                    init: {
                        size: 80,
                    },
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * 0.85,
                },
                adButton: {
                    type: "AdButton",
                    init: {
                        size: 80,
                    },
                    x: SCREEN_WIDTH * 0.75,
                    y: SCREEN_HEIGHT * 0.8,
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
    }
});
