tm.define("TitleScene", {
    superClass: "tm.app.Scene",
    init: function() {
        this.superInit();
        this.fromJSON({
            children: {
                backgroundLayer: {
                    type: "CanvasLayer",
                    init: "#back",
                    renderInterval: 6,
                },
                bg: {
                    type: "tm.display.RectangleShape",
                    init: {
                        width: SCREEN_WIDTH,
                        height: SCREEN_HEIGHT,
                        strokeStyle: "transparent",
                        fillStyle: "white",
                    },
                    originX: 0,
                    originY: 0,
                },
                title: {
                    type: "tm.display.Label",
                    init: ["よけろ！弾幕さん", 40],
                    fillStyle: "black",
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * (1 / (1 + 1.618)),
                    interactive: true,
                    onpointingend: function(e) {
                        e.app.popScene();
                    }
                },
                hmdLayer: {
                    type: "CanvasLayer",
                    init: "#hmd",
                    renderInterval: 6,
                },
            }
        });
    }
});