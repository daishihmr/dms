tm.define("ResultScene", {
    superClass: "tm.app.Scene",
    init: function(param) {
        this.superInit(param);
        this.fromJSON({
            children: {
                backgroundLayer: {
                    type: "CanvasLayer",
                    init: "#back",
                    renderInterval: 60,
                    children: {
                        bd: {
                            type: "tm.display.RectangleShape",
                            init: {
                                width: SCREEN_WIDTH,
                                height: SCREEN_HEIGHT,
                                fillStyle: "black",
                                strokeStyle: "transparent",
                            },
                            originX: 0,
                            originY: 0,
                        }
                    }
                },
                text: {
                    type: "tm.display.Label",
                    init: ["りざると", 50],
                    x: SCREEN_WIDTH * 0.5,
                    y: SCREEN_HEIGHT * 0.5,
                },
                hmdLayer: {
                    type: "CanvasLayer",
                    init: "#hmd",
                    renderInterval: 60,
                    visible: false,
                },
            }
        });

        var scene = this;
        tm.display.RectangleShape({
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            fillStyle: "black",
            strokeStyle: "transparent",
        })
            .setOrigin(0, 0)
            .setAlpha(0)
            .addChildTo(this)
            .tweener.fadeIn(1000).call(function() {
                scene.app.popScene();
            });
    }
});
