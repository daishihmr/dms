tm.define("LayeredCanvasRenderer", {
    superClass: "tm.display.CanvasRenderer",
    init: function(canvas) {
        this.superInit(canvas);
    },

    renderObject: function(obj) {
        if (obj instanceof CanvasLayer) {
            obj.render();
        } else {
            tm.display.CanvasRenderer.prototype.renderObject.call(this, obj);
        }
    }
});
