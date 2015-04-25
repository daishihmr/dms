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
            if (this.positionHistory.length > (BIT_COUNT + 1) * BIT_DISTANCE + BIT_FIRST_DISTANCE) {
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