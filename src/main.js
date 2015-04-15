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
        tm.display.Label.default.fontFamily = "unifont";
        tm.sound.SoundManager.volume = 0.2;
        tm.sound.SoundManager.musicVolume = 0.2;

        tm.dom.Element("#back").visible = true;
        tm.dom.Element("#hmd").visible = true;

        this.superInit({
            startLabel: "title",
            scenes: [{
                label: "title",
                className: "TitleScene",
                nextLabel: "game",
            }, {
                label: "game",
                className: "GameScene",
                nextLabel: "result",
            }, , {
                label: "result",
                className: "ResultScene",
                nextLabel: "title",
            }, ],
        });
    }
});
