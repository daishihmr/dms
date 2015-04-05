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
        top: action([
            repeat(999, [
                wait(20),
                fire(speed(5), BL),
            ]),
        ]),
    }));

})();
