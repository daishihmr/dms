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