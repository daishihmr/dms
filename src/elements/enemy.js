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

        if (this.y < Danmaku.param.target.y) {
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
        this.superInit(100, 120);
        this.runner = Danmaku.middle[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_MIDDLE_HP;
        this.erasing = true;

        this.tweener
            .to({
                y: 120
            }, 1200, "easeOutQuad");

        this.on("enterframe", function() {
            this.y += 2;
        });
    }
});

tm.define("MiddleEnemy1", {
    superClass: "Enemy",
    init: function(danmakuType) {
        this.superInit(100, 120);
        this.runner = Danmaku.middle[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_MIDDLE_HP;
        this.erasing = true;

        this.tweener
            .to({
                y: 120
            }, 1200, "easeOutQuad");

        this.on("enterframe", function() {
            this.y += 2;
        });
    }
});

tm.define("LargeEnemy0", {
    superClass: "Enemy",
    init: function(danmakuType) {
        this.superInit(150, 0);
        this.runner = Danmaku.large[danmakuType].createRunner(Danmaku.param);

        this.hp = ENEMY_LARGE_HP;
        this.erasing = true;

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