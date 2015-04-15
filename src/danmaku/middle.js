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
    var wait = bulletml.dsl.wait;
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

    Danmaku.middle.push(new bulletml.Root({
        top1: action([
            repeat(999, [
                wait(50),
                repeat(4, [
                    fire(direction(180 + 90, "absolute"), speed(30), IVS(actionRef("bit"))),
                    fire(direction(180 - 90, "absolute"), speed(30), IVS(actionRef("bit"))),
                    wait(5),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(180 - 4, "absolute"), speed(4), RCS),
            fire(direction(180 + 4, "absolute"), speed(4), RCS),
            vanish(),
        ]),
        top2: action([
            repeat(999, [
                wait(90),
                fire(speed(3), IVS),
                repeat(6, [
                    fire(direction(0, "sequence"), speed(0.4, "sequence"), BS),
                ]),
            ]),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            wait(100),
            repeat(999, [
                fire(IVS),
                repeat(10, [
                    fire(direction(0, "sequence"), speed(12), BL),
                    wait(3),
                ]),
                wait(100),
            ]),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            repeat(999, [
                wait(100),
                fire(speed(8), IVS),
                repeat(10, [
                    fire(direction(20 * -2), speed(0.6, "sequence"), IVS),
                    repeat(3, [
                        fire(direction(20, "sequence"), speed(0, "sequence"), RS),
                    ]),
                    wait(3),
                ]),
            ]),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            repeat(999, [
                wait(60),
                repeat(20, [
                    fire(direction(10, "sequence"), IVS),
                    repeat(4, [
                        fire(direction(90, "sequence"), speed(20), IVS(actionRef("bit"))),
                    ]),
                    wait(20),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(speed(4), IVS),
            repeat(3, [
                fire(direction(90, "relative"), speed(0.8, "sequence"), RCL),
            ]),
            vanish(),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            repeat(999, [
                wait(60),
                repeat(20, [
                    fire(direction(-10, "sequence"), IVS),
                    repeat(4, [
                        fire(direction(90, "sequence"), speed(20), IVS(actionRef("bit"))),
                    ]),
                    wait(20),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(speed(4), IVS),
            repeat(3, [
                fire(direction(90, "relative"), speed(0.8, "sequence"), BCL),
            ]),
            vanish(),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            repeat(999, [
                wait(60),
                repeat(18, [
                    fire(direction(20, "sequence"), speed(2), BCS(actionRef("seed"))),
                ]),
            ]),
        ]),
        seed: action([
            wait(20),
            changeSpeed(speed(0), 20),
            wait(20),
            fire(speed(7), RCS),
            vanish(),
        ]),
    }));

    Danmaku.middle.push(new bulletml.Root({
        top: action([
            repeat(999, [
                wait(120),
                repeat(10, [
                    fire(direction(6, "sequence"), IVS),
                    repeat(8, [
                        fire(direction(360 / 8, "sequence"), speed(20), IVS(actionRef("bit"))),
                    ]),
                    wait(7),
                ]),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction(-90, "relative"), speed(5), BCL),
            vanish(),
        ]),
    }));

    Danmaku.middle = [Danmaku.middle.last];
})();
