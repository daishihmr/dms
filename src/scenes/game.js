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