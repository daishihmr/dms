tm.main(function() {
    var app = Application();
    app.run();

    var loadingScene = tm.game.LoadingScene({
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
        nextScene: ManagerScene,
    });
    app.replaceScene(loadingScene);
});

tm.define("ManagerScene", {
    superClass: "tm.game.ManagerScene",
    init: function() {
        tm.dom.Element("#back").visible = true;
        tm.dom.Element("#hmd").visible = true;

        this.superInit({
            startLabel: "title",
            scenes: [{
                label: "title",
                className: "TitleScene"
            }, {
                label: "game",
                className: "GameScene"
            }, ],
        });
    }
});