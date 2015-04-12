tm.define("Shot", {
    superClass: "tm.display.RectangleShape",
    init: function() {
        this.superInit({
            width: 10,
            height: 30,
            strokeStyle: "hsl(220, 90%, 90%)",
            fillStyle: "hsl(220, 30%, 30%)",
        });
        this.blendMode = "lighter";

        this.checkHierarchy = false;
    },
    update: function() {
        this.y -= SHOT_SPEED;

        if (this.y < -25) {
            this.remove();
        }
    }
});