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