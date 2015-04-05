tm.define("Application", {
    superClass: "tm.display.CanvasApp",
    init: function() {
        this.superInit("#main");

        this.renderer = LayeredCanvasRenderer(this.canvas);

        var hmdElement = document.querySelector("#hmd");
        this.touch = tm.input.Touch(hmdElement, 0);
        this.mouse = tm.input.Mouse(hmdElement);
        this.pointing = (tm.isMobile) ? this.touch : this.mouse;
        hmdElement.addEventListener("touchstart", function() {
            this.pointing = this.touch;
        }.bind(this));
        hmdElement.addEventListener("mousedown", function() {
            this.pointing = this.mouse;
        }.bind(this));

        this.fps = 60;
        this.background = "transparent";
        this.resize(SCREEN_WIDTH, SCREEN_HEIGHT).fitWindow();
    }
});