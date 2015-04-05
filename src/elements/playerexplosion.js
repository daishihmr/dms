var PlayerExplosion = function(target, x, y) {
    var se = ["sound/exp1", "sound/exp2", "sound/exp3"].pickup();
    tm.sound.SoundManager.play(se);
    (6).times(function() {
        var d = Math.rand(0, 360);
        var s = Math.randf(0.8, 1.5);
        (8).times(function(i) {
            var v = tm.geom.Vector2().setAngle(d, (1 + 4 * i) * s);
            var p = PlayerExplosion.pool.shift();
            if (p) {
                p.emit(x, y, v).setScale(2 - i * 0.2).addChildTo(target);
            }
        });
    });
};

PlayerExplosion.Particle = tm.createClass({
    superClass: tm.display.RectangleShape,
    init: function() {
        this.superInit({
            width: 60,
            height: 60,
            strokeStyle: "hsl(230, 65%, 60%)",
            fillStyle: "hsl(230, 65%, 30%)",
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
        this.v.mul(0.95);
        this.alpha *= 0.95;
        if (this.alpha < 0.001) {
            this.remove();
            PlayerExplosion.pool.push(this);
        }
    }
});

PlayerExplosion.pool = Array.range(256).map(function() {
    return PlayerExplosion.Particle();
});
