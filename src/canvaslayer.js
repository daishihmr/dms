tm.define("CanvasLayer", {
    superClass: "tm.display.CanvasElement",
    init: function(canvas) {
        this.superInit();
        this.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        this.setOrigin(0, 0);

        this.canvas = tm.graphics.Canvas(canvas);
        this.domElement = tm.dom.Element(canvas);

        this.renderer = tm.display.CanvasRenderer(this.canvas);

        this.canvas.resize(SCREEN_WIDTH, SCREEN_HEIGHT).fitWindow();

        this.renderInterval = 2;
        this.isRenderFrame = true;
    },
    clear: function() {
        this.canvas.clear();
        return this;
    },
    update: function(app) {
        this.isRenderFrame = app.frame % this.renderInterval === 0;
    },
    render: function() {
        if (this.isRenderFrame) {
            this.canvas.clear();
            this.renderer.render(this);
        }
    }
});

CanvasLayer.prototype.accessor.visible = {
    get: function() {
        return this.domElement.visible;
    },
    set: function(v) {
        this.domElement.visible = v;
    }
};
