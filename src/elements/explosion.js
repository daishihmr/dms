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
