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
