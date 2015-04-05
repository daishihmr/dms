/* 上にくっつける */

tm.graphics.Canvas.prototype.fitWindow = function(everFlag) {
    var _fitFunc = function() {
        everFlag = everFlag === undefined ? true : everFlag;
        var e = this.element;
        var s = e.style;

        s.position = "absolute";
        s.margin = "auto";
        s.left = "0px";
        s.top = "0px";
        // s.bottom = "0px";
        s.right = "0px";

        var rateWidth = e.width / window.innerWidth;
        var rateHeight = e.height / window.innerHeight;
        var rate = e.height / e.width;

        if (rateWidth > rateHeight) {
            s.width = innerWidth + "px";
            s.height = innerWidth * rate + "px";
        } else {
            s.width = innerHeight / rate + "px";
            s.height = innerHeight + "px";
        }
    }.bind(this);

    // 一度実行しておく
    _fitFunc();
    // リサイズ時のリスナとして登録しておく
    if (everFlag) {
        window.addEventListener("resize", _fitFunc, false);
    }
};
