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
