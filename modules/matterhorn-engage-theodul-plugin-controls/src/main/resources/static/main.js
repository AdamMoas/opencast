/**
 * Copyright 2009-2011 The Regents of the University of California Licensed
 * under the Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain a
 * copy of the License at
 *
 * http://www.osedu.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
/*jslint browser: true, nomen: true*/
/*global define*/
define(['require', 'jquery', 'underscore', 'backbone', 'engage/engage_core'], function(require, $, _, Backbone, Engage) {
    "use strict";
    var PLUGIN_NAME = "Engage Controls",
        PLUGIN_TYPE = "engage_controls",
        PLUGIN_VERSION = "0.1",
        PLUGIN_TEMPLATE = "template.html",
        PLUGIN_TEMPLATE_MOBILE = "template_mobile.html",
        PLUGIN_TEMPLATE_EMBED = "template_embed.html",
        PLUGIN_STYLES = [
            "style.css",
            "js/bootstrap/css/bootstrap.css",
            "js/jqueryui/themes/base/jquery-ui.css"
        ],
        PLUGIN_STYLES_MOBILE = [
            "style_mobile.css"
        ],
        PLUGIN_STYLES_EMBED = [
            "style_embed.css"
        ];

    var plugin;
    var events = {
        play: new Engage.Event("Video:play", "plays the video", "both"),
        pause: new Engage.Event("Video:pause", "pauses the video", "both"),
        fullscreenEnable: new Engage.Event("Video:fullscreenEnable", "", "both"),
        mute: new Engage.Event("Video:mute", "", "both"),
        unmute: new Engage.Event("Video:unmute", "", "both"),
        segmentMouseover: new Engage.Event("Segment:mouseOver", "the mouse is over a segment", "both"),
        segmentMouseout: new Engage.Event("Segment:mouseOut", "the mouse is off a segment", "both"),
        fullscreenCancel: new Engage.Event("Video:fullscreenCancel", "", "trigger"),
        sliderStart: new Engage.Event("Slider:start", "", "trigger"),
        sliderStop: new Engage.Event("Slider:stop", "", "trigger"),
        volumeSet: new Engage.Event("Video:volumeSet", "", "trigger"),
        playbackRateChanged: new Engage.Event("Video:playbackRateChanged", "The video playback rate changed", "trigger"),
        seek: new Engage.Event("Video:seek", "seek video to a given position in seconds", "trigger"),
        customError: new Engage.Event("Notification:customError", "an error occured", "trigger"),
        plugin_load_done: new Engage.Event("Core:plugin_load_done", "", "handler"),
        fullscreenChange: new Engage.Event("Video:fullscreenChange", "notices a fullscreen change", "handler"),
        ready: new Engage.Event("Video:ready", "all videos loaded successfully", "handler"),
        timeupdate: new Engage.Event("Video:timeupdate", "notices a timeupdate", "handler"),
        ended: new Engage.Event("Video:ended", "end of the video", "handler"),
        usingFlash: new Engage.Event("Video:usingFlash", "flash is being used", "handler")
    };

    // desktop, embed and mobile logic
    switch (Engage.model.get("mode")) {
        case "mobile":
            plugin = {
                name: PLUGIN_NAME,
                type: PLUGIN_TYPE,
                version: PLUGIN_VERSION,
                styles: PLUGIN_STYLES_MOBILE,
                template: PLUGIN_TEMPLATE_MOBILE,
                events: events
            };
            break;
        case "embed":
            plugin = {
                name: PLUGIN_NAME,
                type: PLUGIN_TYPE,
                version: PLUGIN_VERSION,
                styles: PLUGIN_STYLES_EMBED,
                template: PLUGIN_TEMPLATE_EMBED,
                events: events
            };
            break;
            // fallback to desktop/default mode
        case "desktop":
        default:
            plugin = {
                name: PLUGIN_NAME,
                type: PLUGIN_TYPE,
                version: PLUGIN_VERSION,
                styles: PLUGIN_STYLES,
                template: PLUGIN_TEMPLATE,
                events: events
            };
            break;
    }

    /* change these variables */
    var logoLink = window.location.protocol + "//" + window.location.host + "/engage/ui/index.html"; // link to the media module
    var bootstrapPath = 'js/bootstrap/js/bootstrap';
    var jQueryUIPath = 'js/jqueryui/jquery-ui';
    var id_engage_controls = "engage_controls";
    var id_slider = "slider";
    var id_volume = "volume";
    var id_volumeIcon = "volumeIcon";
    var id_dropdownMenuPlaybackRate = "dropdownMenuPlaybackRate";
    var id_playbackRate05 = "playback05";
    var id_playbackRate10 = "playback10";
    var id_playbackRate15 = "playback15";
    var id_playbackRate20 = "playback20";
    var id_playpause_controls = "playpause_controls";
    var id_fullscreen_button = "fullscreen_button";
    var id_backward_button = "backward_button";
    var id_forward_button = "forward_button";
    var id_navigation_time = "navigation_time";
    var id_navigation_time_current = "navigation_time_current";
    var id_play_button = "play_button";
    var id_pause_button = "pause_button";
    var id_unmute_button = "unmute_button";
    var id_mute_button = "mute_button";
    var id_segmentNo = "segment_";
    var class_dropdown = "dropdown-toggle";

    /* don't change these variables */
    var videosReady = false;
    var videoDataModelChange = 'change:videoDataModel';
    var mediapackageChange = "change:mediaPackage";
    var event_slidestart = "slidestart";
    var event_slidestop = "slidestop";
    var plugin_path = "";
    var initCount = 5;
    var isPlaying = false;
    var isSliding = false;
    var isMute = false;
    var duration;
    var usingFlash = false;
    var segments = {};

    var ControlsView = Backbone.View.extend({
        el: $("#" + id_engage_controls), // every view has an element associated with it
        initialize: function(videoDataModel, template, plugin_path) {
            this.setElement($(plugin.container)); // every plugin view has it's own container associated with it
            this.model = videoDataModel;
            this.template = template;
            this.pluginPath = plugin_path;
            // bind the render function always to the view
            _.bindAll(this, "render");
            // listen for changes of the model and bind the render function to this
            this.model.bind("change", this.render);
            this.render();
        },
        render: function() {
            duration = this.model.get("duration");
            segments = Engage.model.get("mediaPackage").get("segments");

            var tempVars = {
                plugin_path: this.pluginPath,
                startTime: formatSeconds(0),
                durationMS: (duration && (duration > 0)) ? duration : 1, // duration in ms
                duration: (duration ? formatSeconds(duration / 1000) : formatSeconds(0)), // formatted duration
                logoLink: logoLink,
                segments: segments
            };

            // compile template and load into the html
            this.$el.html(_.template(this.template, tempVars));

            initControlsEvents();

            // init dropdown menus
            $("." + class_dropdown).dropdown();
        }
    });

    /**
     * Returns the input time in milliseconds
     *
     * @param data data in the format ab:cd:ef
     * @return time from the data in milliseconds
     */
    function getTimeInMilliseconds(data) {
        if ((data !== undefined) && (data !== null) && (data != 0) && (data.length) && (data.indexOf(':') != -1)) {
            var values = data.split(':');
            // when the format is correct
            if (values.length == 3) {
                // try to convert to numbers
                var val0 = values[0] * 1;
                var val1 = values[1] * 1;
                var val2 = values[2] * 1;
                // check and parse the seconds
                if (!isNaN(val0) && !isNaN(val1) && !isNaN(val2)) {
                    // convert hours, minutes and seconds to milliseconds
                    val0 *= 60 * 60 * 1000; // 1 hour = 60 minutes = 60 * 60 Seconds = 60 * 60 * 1000 milliseconds
                    val1 *= 60 * 1000; // 1 minute = 60 seconds = 60 * 1000 milliseconds
                    val2 *= 1000; // 1 second = 1000 milliseconds
                    return val0 + val1 + val2;
                }
            }
        }
        return 0;
    }

    /**
     * Returns the formatted seconds
     *
     * @param seconds seconds to format
     * @return formatted seconds
     */
    function formatSeconds(seconds) {
        if (!seconds) {
            seconds = 0;
        }
        seconds = (seconds < 0) ? 0 : seconds;
        var result = "";
        if (parseInt(seconds / 3600) < 10) {
            result += "0";
        }
        result += parseInt(seconds / 3600);
        result += ":";
        if ((parseInt(seconds / 60) - parseInt(seconds / 3600) * 60) < 10) {
            result += "0";
        }
        result += parseInt(seconds / 60) - parseInt(seconds / 3600) * 60;
        result += ":";
        if (seconds % 60 < 10) {
            result += "0";
        }
        result += seconds % 60;
        if (result.indexOf(".") != -1) {
            result = result.substring(0, result.lastIndexOf(".")); // get rid of the .ms
        }
        return result;
    }

    /**
     * enable
     *
     * @param id
     */
    function enable(id) {
        $("#" + id).removeAttr("disabled");
    }

    /**
     * disable
     *
     * @param id
     */
    function disable(id) {
        $("#" + id).attr("disabled", "disabled");
    }

    /**
     * greyIn
     *
     * @param id
     */
    function greyIn(id) {
        $("#" + id).animate({
            opacity: 1.0
        });
    }

    /**
     * greyOut
     *
     * @param id
     */
    function greyOut(id) {
        $("#" + id).animate({
            opacity: 0.5
        });
    }

    function addNonFlashEvents() {
        if (!usingFlash) {
            // setup listeners for the playback rate
            $("#" + id_playbackRate05).click(function(e) {
                e.preventDefault();
                Engage.trigger(plugin.events.playbackRateChanged.getName(), 0.5);
            });
            $("#" + id_playbackRate10).click(function(e) {
                e.preventDefault();
                Engage.trigger(plugin.events.playbackRateChanged.getName(), 1.0);
            });
            $("#" + id_playbackRate15).click(function(e) {
                e.preventDefault();
                Engage.trigger(plugin.events.playbackRateChanged.getName(), 1.5);
            });
            $("#" + id_playbackRate20).click(function(e) {
                e.preventDefault();
                Engage.trigger(plugin.events.playbackRateChanged.getName(), 2.0);
            });
        }
    }

    /**
     * getVolume
     */
    function initControlsEvents() {
        // disable not used buttons
        disable(id_backward_button);
        disable(id_forward_button);
        disable(id_play_button);
        greyOut(id_backward_button);
        greyOut(id_forward_button);
        greyOut(id_play_button);
        disable(id_navigation_time);
        $("#" + id_navigation_time_current).keyup(function(e) {
            e.preventDefault();
            // pressed enter
            if (e.keyCode == 13) {
                $(this).blur();
                try {
                    var time = getTimeInMilliseconds($(this).val()) / 1000;
                    var duration = parseInt(Engage.model.get("videoDataModel").get("duration")) / 1000;
                    if (duration && (time <= duration)) {
                        Engage.trigger(plugin.events.seek.getName(), time);
                    } else {
                        Engage.trigger(plugin.events.customError.getName(), "The given time (" + formatSeconds(time) + ") has to be smaller than the duration (" + formatSeconds(duration) + ").");
                    }
                } catch (e) {
                    $("#" + id_navigation_time_current).val(formatSeconds(0));
                }
            }
        });

        $("#" + id_slider).slider({
            range: "min",
            min: 0,
            max: 1000,
            value: 0
        });

        $("#" + id_volume).slider({
            range: "min",
            min: 1,
            max: 100,
            value: 100,
            change: function(event, ui) {
                Engage.trigger(plugin.events.volumeSet.getName(), (ui.value) / 100);
            }
        });

        $("#" + id_volumeIcon).click(function() {
            if (isMute) {
                Engage.trigger(plugin.events.unmute.getName());
            } else {
                Engage.trigger(plugin.events.mute.getName());
            }
        });

        $("#" + id_playpause_controls).click(function() {
            if (isPlaying) {
                Engage.trigger(plugin.events.pause.getName(), false);
            } else {
                Engage.trigger(plugin.events.play.getName(), false);
            }
        });

        $("#" + id_fullscreen_button).click(function(e) {
            e.preventDefault();
            var isInFullScreen = document.fullScreen ||
                document.mozFullScreen ||
                document.webkitIsFullScreen;
            if (!isInFullScreen) {
                Engage.trigger(plugin.events.fullscreenEnable.getName());
            }
        });

        // slider events
        $("#" + id_slider).on(event_slidestart, function(event, ui) {
            isSliding = true;
            Engage.trigger(plugin.events.sliderStart.getName(), ui.value);
        });
        $("#" + id_slider).on(event_slidestop, function(event, ui) {
            isSliding = false;
            Engage.trigger(plugin.events.sliderStop.getName(), ui.value);
        });
        $("#" + id_volume).on(event_slidestop, function(event, ui) {
            Engage.trigger(plugin.events.unmute.getName());
        });

        if (segments && (segments.length > 0)) {
            Engage.log("Controls: " + segments.length + " segments are available.");
            $.each(segments, function(i, v) {
                $("#" + id_segmentNo + i).click(function(e) {
                    e.preventDefault();
                    var time = parseInt($(this).children().html());
                    if (!isNaN(time)) {
                        Engage.trigger(plugin.events.seek.getName(), time / 1000);
                    }
                });
                $("#" + id_segmentNo + i).mouseover(function(e) {
                    e.preventDefault();
                    Engage.trigger(plugin.events.segmentMouseover.getName(), i);
                }).mouseout(function(e) {
                    e.preventDefault();
                    Engage.trigger(plugin.events.segmentMouseout.getName(), i);
                });
            });
        }
    }

    /**
     * getVolume
     */
    function getVolume() {
        if (isMute) {
            return 0;
        } else {
            var vol = $("#" + id_volume).slider("option", "value");
            return vol;
        }
    }

    /**
     * Initializes the plugin
     */
    function initPlugin() {
        // only init if plugin template was inserted into the DOM
        if (plugin.inserted == true) {
            new ControlsView(Engage.model.get("videoDataModel"), plugin.template, plugin.pluginPath);
            Engage.on(plugin.events.usingFlash.getName(), function(flash) {
                usingFlash = flash;
                if (!usingFlash) {
                    $("#" + id_dropdownMenuPlaybackRate).removeClass("disabled");
                }
                addNonFlashEvents();
            });
            Engage.on(plugin.events.ready.getName(), function() {
                greyIn(id_play_button);
                enable(id_play_button);
                videosReady = true;
                $("#" + id_fullscreen_button).removeClass("disabled");
            });
            Engage.on(plugin.events.play.getName(), function() {
                if (videosReady) {
                    $("#" + id_play_button).hide();
                    $("#" + id_pause_button).show();
                    isPlaying = true;
                }
            });
            Engage.on(plugin.events.pause.getName(), function() {
                if (videosReady) {
                    $("#" + id_play_button).show();
                    $("#" + id_pause_button).hide();
                    isPlaying = false;
                }
            });
            Engage.on(plugin.events.mute.getName(), function() {
                $("#" + id_unmute_button).hide();
                $("#" + id_mute_button).show();
                isMute = true;
                Engage.trigger(plugin.events.volumeSet.getName(), 0);
            });
            Engage.on(plugin.events.unmute.getName(), function() {
                $("#" + id_unmute_button).show();
                $("#" + id_mute_button).hide();
                isMute = false;
                Engage.trigger(plugin.events.volumeSet.getName(), getVolume());
            });
            Engage.on(plugin.events.fullscreenChange.getName(), function() {
                var isInFullScreen = document.fullScreen ||
                    document.mozFullScreen ||
                    document.webkitIsFullScreen;
                if (!isInFullScreen) {
                    Engage.trigger(plugin.events.fullscreenCancel.getName());
                }
            });
            Engage.on(plugin.events.timeupdate.getName(), function(currentTime) {
                if (videosReady) {
                    // set slider
                    var duration = Engage.model.get("videoDataModel").get("duration");
                    if (!isSliding && duration) {
                        var normTime = (currentTime / (duration / 1000)) * 1000;
                        $("#" + id_slider).slider("option", "value", normTime);
                        if (!$("#" + id_navigation_time_current).is(":focus")) {
                            $("#" + id_navigation_time_current).val(formatSeconds(currentTime));
                        }
                    }
                }
            });
            Engage.on(plugin.events.ended.getName(), function() {
                if (videosReady) {
                    Engage.trigger(plugin.events.pause);
                }
            });
            Engage.on(plugin.events.segmentMouseover.getName(), function(no) {
                $("#" + id_segmentNo + no).addClass("segmentHover");
            });
            Engage.on(plugin.events.segmentMouseout.getName(), function(no) {
                $("#" + id_segmentNo + no).removeClass("segmentHover");
            });
        }
    }

    // init event
    Engage.log("Controls: Init");
    var relative_plugin_path = Engage.getPluginPath('EngagePluginControls');

    // load jquery-ui lib
    require([relative_plugin_path + jQueryUIPath], function() {
        Engage.log("Controls: Lib jQuery UI loaded");
        initCount -= 1;
        if (initCount <= 0) {
            initPlugin();
        }
    });

    // load bootstrap lib
    require([relative_plugin_path + bootstrapPath], function() {
        Engage.log("Controls: Lib bootstrap loaded");
        initCount -= 1;
        if (initCount <= 0) {
            initPlugin();
        }
    });

    // listen on a change/set of the video data model
    Engage.model.on(videoDataModelChange, function() {
        initCount -= 1;
        if (initCount == 0) {
            initPlugin();
        }
    });

    // listen on a change/set of the mediaPackage model
    Engage.model.on(mediapackageChange, function() {
        initCount -= 1;
        if (initCount == 0) {
            initPlugin();
        }
    });

    // all plugins loaded
    Engage.on(plugin.events.plugin_load_done.getName(), function() {
        Engage.log("Controls: Plugin load done");
        initCount -= 1;
        if (initCount <= 0) {
            initPlugin();
        }
    });

    return plugin;
});
