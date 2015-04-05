tm.define("StarItem", {
    superClass: "tm.display.StarShape",
    init: function(pool) {
        this.superInit({
            width: 30,
            height: 30,
        });
        this.pool = pool;
        this.target = null;
        this.flying = false;

        this.boundingType = "circle";
        this.radius = 30;
        this.checkHierarchy = false;

        this.fv = tm.geom.Vector2(0, 0);
    },
    onremoved: function() {
        this.pool.stars.push(this);
    },
    update: function() {
        if (this.flying) {
            this.position.add(this.fv);
            this.fv.mul(0.7);
            if (this.fv.lengthSquared() < 0.1 * 0.1) {
                this.flying = false;
            }
        } else if (this.target) {
            var v = tm.geom.Vector2.sub(this.target, this);
            v.normalize().mul(10);
            this.position.add(v);
        } else {
            this.y += 3;
        }

        if (H + 30 < this.y) {
            this.remove();
        }
    },
    setTarget: function(target) {
        this.target = target;
    }
});

tm.define("StarItemPool", {
    init: function() {
        this.stars = Array.range(256 * 4).map(function() {
            return StarItem(this);
        }.bind(this));
    },
    get: function() {
        var star = this.stars.shift();
        if (star !== undefined) {
            star.target = null;
            return star;
        }
        return null;
    }
});