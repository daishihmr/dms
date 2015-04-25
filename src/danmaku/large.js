(function() {
    var action = bulletml.dsl.action;
    var actionRef = bulletml.dsl.actionRef;
    var bullet = bulletml.dsl.bullet;
    var bulletRef = bulletml.dsl.bulletRef;
    var fire = bulletml.dsl.fire;
    var fireRef = bulletml.dsl.fireRef;
    var changeDirection = bulletml.dsl.changeDirection;
    var changeSpeed = bulletml.dsl.changeSpeed;
    var accel = bulletml.dsl.accel;
    // var wait = bulletml.dsl.wait;
    var vanish = bulletml.dsl.vanish;
    var repeat = bulletml.dsl.repeat;
    var bindVar = bulletml.dsl.bindVar;
    var notify = bulletml.dsl.notify;
    var direction = bulletml.dsl.direction;
    var speed = bulletml.dsl.speed;
    var horizontal = bulletml.dsl.horizontal;
    var vertical = bulletml.dsl.vertical;
    var fireOption = bulletml.dsl.fireOption;
    var offsetX = bulletml.dsl.offsetX;
    var offsetY = bulletml.dsl.offsetY;
    var autonomy = bulletml.dsl.autonomy;
    var wait = function(v) {
        return bulletml.dsl.wait(v * Danmaku.param.interval);
    };

    var RS = function(act) {
        return bullet(act, {
            type: 0
        });
    };
    var BS = function(act) {
        return bullet(act, {
            type: 1
        });
    };
    var RL = function(act) {
        return bullet(act, {
            type: 2
        });
    };
    var BL = function(act) {
        return bullet(act, {
            type: 3
        });
    };
    var RCS = function(act) {
        return bullet(act, {
            type: 4
        });
    };
    var BCS = function(act) {
        return bullet(act, {
            type: 5
        });
    };
    var RCL = function(act) {
        return bullet(act, {
            type: 6
        });
    };
    var BCL = function(act) {
        return bullet(act, {
            type: 7
        });
    };
    var IVS = function(act) {
        return bullet(act, {
            type: 8
        });
    };

    Danmaku.large.push(new bulletml.Root({
        top: action([
            repeat(Infinity, [
                wait(80),
                fire(direction(0), IVS),
                repeat(10, [
                    bindVar("way", "$loop.index + 2"),
                    bindVar("angle", "$way * 13"),
                    fire(direction("$angle * -0.5", "sequence"), speed(6), RCL),
                    repeat("$way - 1", [
                        fire(direction("$angle / ($way - 1)", "sequence"), speed(6), RCL),
                    ]),
                    fire(direction("$angle * -0.5", "sequence"), IVS),
                    wait(7),
                ]),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            repeat(Infinity, [
                wait(100),
                repeat(60, [
                    fire(direction(9, "sequence"), IVS),
                    fire(direction(90, "sequence"), IVS(actionRef("bit"))),
                    fire(direction(90, "sequence"), IVS(actionRef("bit"))),
                    fire(direction(90, "sequence"), IVS(actionRef("bit"))),
                    fire(direction(90, "sequence"), IVS(actionRef("bit"))),
                    wait(10),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(34 * -0.5, "relative"), speed(6), RCL),
            repeat(3 - 1, [
                fire(direction(34 / (3 - 1), "sequence"), speed(6), RCL),
            ]),
            vanish(),
        ]),
        top1: action([
            repeat(Infinity, [
                wait(180),
                fire(speed(8), BL),
                repeat(40 - 1, [
                    fire(direction(360 / 40, "sequence"), speed(8), BL),
                ]),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            repeat(Infinity, [
                wait(80),
                repeat(4, [
                    wait(20),
                    fire(speed(5), RL),
                    repeat(10 - 1, [
                        fire(direction(360 / 10, "sequence"), speed(5), RL),
                    ]),
                    wait(5),
                    repeat(3, [
                        fire(direction(5, "sequence"), speed(5), RL),
                        repeat(10 - 1, [
                            fire(direction(360 / 10, "sequence"), speed(5), RL),
                        ]),
                        wait(5),
                    ]),
                    wait(20),
                    fire(speed(5), RL),
                    repeat(10 - 1, [
                        fire(direction(360 / 10, "sequence"), speed(5), RL),
                    ]),
                    wait(5),
                    repeat(3, [
                        fire(direction(-5, "sequence"), speed(5), RL),
                        repeat(10 - 1, [
                            fire(direction(360 / 10, "sequence"), speed(5), RL),
                        ]),
                        wait(5),
                    ]),
                ]),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            repeat(Infinity, [
                wait(80),
                repeat("5 + $loop.index", [
                    fire(direction(180 - 90, "absolute"), speed(30), IVS(actionRef("bit"))),
                    fire(direction(180 - 45, "absolute"), speed(15), IVS(actionRef("bit"))),
                    fire(direction(180 +  0, "absolute"), speed( 0), IVS(actionRef("bit"))),
                    fire(direction(180 + 45, "absolute"), speed(15), IVS(actionRef("bit"))),
                    fire(direction(180 + 90, "absolute"), speed(30), IVS(actionRef("bit"))),
                    wait(8),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(110 * -0.5), speed(5), RCL),
            repeat(5 - 1, [
                fire(direction(110 / (5 - 1), "sequence"), speed(5), RCL),
            ]),
            vanish(),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            wait(100),
            repeat(Infinity, [
                fire(direction(90 + 6, "sequence"), speed(5), BCS),
                fire(direction(90, "sequence"), speed(5), BCS),
                fire(direction(90, "sequence"), speed(5), BCS),
                fire(direction(90, "sequence"), speed(5), BCS),
                wait(5),
            ]),
        ]),
        top1: action([
            wait(130),
            repeat(Infinity, [
                fire(direction(90 - 5, "sequence"), speed(5), RCS),
                fire(direction(90, "sequence"), speed(5), RCS),
                fire(direction(90, "sequence"), speed(5), RCS),
                fire(direction(90, "sequence"), speed(5), RCS),
                wait(5),
            ]),
        ]),
        top2: action([
            wait(160),
            repeat(Infinity, [
                fire(speed(4), RL),
                repeat(30, [
                    fire(direction(360 / (30 - 1), "sequence"), speed(4), RL),
                ]),
                wait(40),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            wait(100),
            repeat(Infinity, [
                repeat(200, [
                    fire(direction("Math.sin($loop.index * 0.2) * 60"), speed(6.5), BL),
                    wait(3),
                ]),
                wait(50),
            ]),
        ]),
        top1: action([
            wait(100),
            repeat(Infinity, [
                repeat(200, [
                    fire(direction("Math.sin($loop.index * 0.3) * -40"), speed(6.5), RL),
                    wait(3),
                ]),
                wait(50),
            ]),
        ]),
        top2: action([
            wait(100),
            repeat(Infinity, [
                repeat(200, [
                    fire(direction("Math.sin($loop.index * 0.1) * 80"), speed(6.5), RS),
                    wait(3),
                ]),
                wait(50),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top0: action([
            wait(100),
            fire(direction(-22.5), speed(4), BCL),
            repeat(Infinity, [
                repeat(7, [
                    fire(direction(90 + 45 / 7, "sequence"), speed(4), BCL),
                    fire(direction(90, "sequence"), speed(4), BCL),
                    fire(direction(90, "sequence"), speed(4), BCL),
                    fire(direction(90, "sequence"), speed(4), BCL),
                ]),
                wait(40),
            ]),
        ]),
        top1: action([
            wait(100),
            repeat(Infinity, [
                fire(speed(6), IVS),
                repeat(7, [
                    fire(direction(-25, "sequence"), speed(0.3, "sequence"), RL),
                    fire(direction(25, "sequence"), speed(0, "sequence"), RL),
                    fire(direction(25, "sequence"), speed(0, "sequence"), RL),
                    fire(direction(-25, "sequence"), speed(0, "sequence"), IVS),
                ]),
                wait(70),
            ]),
        ]),
    }));

    Danmaku.large.push(new bulletml.Root({
        top: action([
            wait(100),
            repeat(Infinity, [
                fire(direction(140 * -0.5), speed(0), IVS(actionRef("bit"))),
                repeat(8, [
                    fire(direction(140 / 8, "sequence"), speed(0), IVS(actionRef("bit"))),
                ]),
                wait(14),
                fire(direction(140 * -0.5), speed(0), IVS(actionRef("bit"))),
                repeat(7, [
                    fire(direction(140 / 7, "sequence"), speed(0), IVS(actionRef("bit"))),
                ]),
                wait(14),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(0, "relative"), speed(5.4), RCL),
            fire(direction(-2, "relative"), speed(5.0), RCL),
            fire(direction(+2, "relative"), speed(5.0), RCL),
            fire(direction(0, "relative"), speed(4.6), RCL),
            vanish(),
        ]),
    }));

    Danmaku.large = [Danmaku.large.last];
})();
