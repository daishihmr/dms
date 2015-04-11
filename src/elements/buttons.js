

tm.define("CircleButton", {
    superClass: "tm.display.CanvasElement",

    init: function(param) {
        this.superInit();

        param = param || {};

        param.$safe({
            size: 150,
            text: 'A',
            fontFamily: 'FontAwesome',
            fontColor: "white",
            bgColor: "hsl(180, 60%, 50%)",
            strokeColor: "transparent",
            lineWidth: 4,
        });

        this.fromJSON({
            children: {
                bg: {
                    type: "tm.display.Shape",
                    init: {
                        width: param.size,
                        height: param.size,
                    }
                },
                label: {
                    type: "tm.display.Label",
                    init: param.text,
                    fillStyle: param.fontColor,
                    fontFamily: param.fontFamily,
                    fontSize: param.size/2,
                }
            }
        });

        this.setInteractive(true, "circle");
        this.on("pointingend", function() {
            this.flare('push');
        });

        this.fillFlag = param.fillFlag;

        this.lineWidth = param.lineWidth;
        this.strokeColor = param.strokeColor;
        this.bgColor = param.bgColor;
        this.radius = param.size/2;
        this._render();
    },
    _render: function() {
        var c = this.bg.canvas;
        c.setTransformCenter();
        c.fillStyle = this.bgColor;
        c.fillCircle(0, 0, this.radius);

        c.lineWidth = this.lineWidth;
        c.strokeStyle = this.strokeColor;
        c.strokeCircle(0, 0, this.radius-this.lineWidth/2-1);
    },

    fill: function() {
        this.parent.children.each(function(elm) {
            elm.tweener.clear().fadeOut(200)
        });

        var c = this.bg.canvas;
        this.bg.width = SCREEN_WIDTH;
        this.bg.height= SCREEN_HEIGHT;
        this._render();

        this.setInteractive(false);

        this.label.tweener
            .clear()
            .fadeOut(200)
            ;

        this.tweener
            .clear()
            .wait(300)
            .to({
                x: SCREEN_CENTER_X,
                y: SCREEN_CENTER_Y,
            }, 300, 'easeOutQuint')
            .call(function() {
                tm.asset.Manager.get("sounds/warp").clone().play();
            })
            .to({
                radius: 600,
            }, 500, 'easeOutQuint')
            .call(function() {
                this.flare('filled');
            }, this)
            ;

        this.update = function() {
            this._render();
        };
    },

    blink: function() {
        this.tweener
            .clear()
            .set({alpha:0})
            .wait(100)
            .set({alpha:1})
            .wait(100)
            .set({alpha:0})
            .wait(100)
            .set({alpha:1})
            .wait(100)
            .set({alpha:0})
            .wait(100)
            .set({alpha:1})
            .wait(100)
            .set({alpha:0})
            .wait(100)
            .set({alpha:1})
            .wait(100);
    }
});




tm.define("RankingButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.trophy),
            bgColor: "hsl(200, 100%, 50%)",
        }.$extend(param));

        this.on('push', function() {
            if (window.gamecenter) {
                var data = {
                    leaderboardId: BOARD_ID
                };
                gamecenter.showLeaderboard(null, null, data);
            }
            else {
                console.log('show gamecenter');
            }
        });
    },
});


tm.define("AdButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.buysellads),
            bgColor: "hsl(0, 100%, 64%)",
        }.$extend(param));

        this.on('push', this._showAd);
    },

    _showAd: function() {
        clickAdCallback = function() {
            this.flare('aded');
        }.bind(this);

        showAd();
    },
});

tm.define("ShareButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.comment),
            bgColor: "hsl(240, 100%, 64%)",
        }.$extend(param));

        this.message = param.message;
        this.url = param.url || "http://twitter.com/phi_jp";
        this.on('push', this._share);
    },

    _share: function() {
        var text = this.message;

        if (isNative()) {
            var message = {
                text: text + " #FlickArrow #tmlib",
                activityTypes: ['PostToFacebook'],
                // activityTypes: ["PostToFacebook", "PostToTwitter", "PostToWeibo", "Message", "Mail", "Print", "CopyToPasteboard", "AssignToContact", "SaveToCameraRoll", "AddToReadingList", "PostToFlickr", "PostToVimeo", "TencentWeibo", "AirDrop"];
                activityTypes: ["Message", "Mail", "PostToFacebook", "PostToTwitter"],
                url: this.url,
            };
            window.socialmessage.send(message);
            this.flare('shared');
        }
        else {
            var twitterURL = tm.social.Twitter.createURL({
                type    : "tweet",
                text    : text,
                hashtags: "FlickArrow,tmlib",
                url     : this.url,
            });
            var win = window.open(twitterURL, 'share window', 'width=400, height=300');
            var timer = setInterval(function() {   
                if(win.closed) {
                    this.flare('shared');
                    clearInterval(timer);  
                }
            }.bind(this), 100);
        }

    },
});

tm.define("PauseButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.pause),
            bgColor: "hsl(0, 0%, 50%)",
        }.$extend(param));
    },
});

tm.define("PlayButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.play),
        }.$extend(param));
    },
});

tm.define("HomeButton", {
    superClass: "CircleButton",

    init: function(param) {
        this.superInit({
            text: String.fromCharCode(FONT_CODE.home),
            bgColor: HOME_COLOR,
        }.$extend(param));
    },
});



tm.define("Life", {
    superClass: "tm.display.CanvasElement",

    init: function() {
        this.superInit();

        var data = UserData.get();

        this.backGroup = tm.display.CanvasElement().addChildTo(this);
        this.frontGroup = tm.display.CanvasElement().addChildTo(this);
        (5).times(function(i) {
            var h = tm.display.HeartShape({
                width: 40,
                height: 40,
                fillStyle: "gray",
            }).addChildTo(this.backGroup);
            h.x = i*70;
            h.y = 0;
        }, this);
        (5).times(function(i) {
            var h = tm.display.HeartShape({
                width: 40,
                height: 40,
            }).addChildTo(this.frontGroup);
            h.x = i*70;
            h.y = 0;

            h.hide();

            if (data.life>i) {
                h.show();
            }
        }, this);
    },
    decriment: function() {
        var data = UserData.get();
        data.life--;
        UserData.set(data);

        var hearts = this.frontGroup.children;
        hearts[data.life].tweener
            .clear()
            .by({
                y: -100,
                alpha: -1,
            }, 200)
            .call(function() {
                this.flare('decrimented');
            }, this)
            ;
    },

    recovery: function() {
        var data = UserData.get();
        var fronts = this.frontGroup.children;

        (5-data.life).times(function(i) {
            var h = fronts[data.life+i];

            h.show();
            h.alpha = 0;
            h.scale.set(2, 2);

            h.tweener
                .clear()
                .wait(i*250)
                .to({
                    alpha: 1,
                    scaleX: 1,
                    scaleY: 1,
                }, 500)
                ;
        }, this);

        data.life = 5;
        UserData.set(data);
    },

});

tm.define("WaveEffect", {
    superClass: "tm.display.CircleShape",

    init: function() {
        this.superInit({
            fillStyle: "white",
            strokeStyle: "transparent",
        });

        this.tweener.to({
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
        }, 250).call(function() {
            this.remove();
        }, this);

        tm.asset.Manager.get("sounds/touch").clone().play();
    }
});





