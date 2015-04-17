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

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(speed(7), RS),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            repeat(5, [
                fire(speed(7), RS),
                wait(20),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(direction(-30), speed(7), RS),
            fire(direction(  0), speed(7), RS),
            fire(direction( 30), speed(7), RS),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            repeat(10, [
                fire(direction(-30), speed(7), RS),
                fire(direction(  0), speed(7), RS),
                fire(direction( 30), speed(7), RS),
                wait(20),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(speed(4), IVS),
            repeat(5, [
                fire(direction(-30), speed(0.4, "sequence"), RS),
                fire(direction(  0), speed(0.0, "sequence"), RS),
                fire(direction( 30), speed(0.0, "sequence"), RS),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(speed(4), IVS),
            repeat(5, [
                fire(direction(-45), speed(10), IVS(actionRef("bit",  45, "$loop.index"))),
                fire(direction( 45), speed(10), IVS(actionRef("bit", -45, "$loop.index"))),
                fire(direction(  0), speed(10), IVS(actionRef("bit",   0, "$loop.index"))),
            ]),
        ]),
        bit: action([
            wait(1),
            fire(direction("$1", "relative"), speed("6.5 + $2 * 0.2"), BCS),
            vanish(),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(direction(-4), speed(6), BCS),
            repeat(5 - 1, [
                fire(direction(2, "sequence"), speed(6), BCS),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            repeat(5, [
                fire(speed(3), RCL),
                wait(50),
            ]),
        ]),
    }));

    Danmaku.small.push(new bulletml.Root({
        top: action([
            wait(20),
            fire(speed(6), IVS),
            repeat(5, [
                fire(direction(180, "absolute"), speed(0.2, "sequence"), BCS),
            ]),
        ]),
    }));

    // Danmaku.small = [Danmaku.small.last];
})();
