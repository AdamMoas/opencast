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
define(["require", "jquery", "underscore", "backbone", "engage/engage_core"], function(require, $, _, Backbone, Engage) {
    "use strict";
    var PLUGIN_NAME = "Engage Plugin Custom Usertracking";
    var PLUGIN_TYPE = "engage_custom";
    var PLUGIN_VERSION = "1.0";
    var PLUGIN_TEMPLATE = "none";
    var PLUGIN_TEMPLATE_MOBILE = "none";
    var PLUGIN_TEMPLATE_EMBED = "none";
    var PLUGIN_STYLES = [
        ""
    ];
    var PLUGIN_STYLES_MOBILE = [
        ""
    ];
    var PLUGIN_STYLES_EMBED = [
        ""
    ];

    var plugin;
    var events = {
        plugin_load_done: new Engage.Event("Core:plugin_load_done", "", "handler"),
        timeupdate: new Engage.Event("Video:timeupdate", "notices a timeupdate", "handler"),
        mediaPackageModelError: new Engage.Event("MhConnection:mediaPackageModelError", "", "handler")
    };

    var isDesktopMode = false;
    var isEmbedMode = false;
    var isMobileMode = false;

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
            isMobileMode = true;
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
            isEmbedMode = true;
            break;
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
            isDesktopMode = true;
            break;
    }

    /* change these variables */
    var USERTRACKING_ENDPOINT = "/usertracking";
    var USERTRACKING_ENDPOINT_GETSTATS = "/stats.json";
    var mediapackageChange = "change:mediaPackage";
    var footprintsChange = "change:footprints";

    /* don"t change these variables */
    var initCount = 3;
    var lastFootprint = undefined;
    var mediapackageID;
    var mediapackageError = false;

    function initPlugin() {
        mediapackageID = Engage.model.get("urlParameters").id;
        if (!mediapackageID) {
            mediapackageID = "";
            return;
        }

        $.ajax({
            type: "PUT",
            url: USERTRACKING_ENDPOINT,
            data: {
                id: mediapackageID,
                    in : 0,
                out: 0,
                type: "VIEWS"
            },
            success: function(result) {
		$.ajax({
		    type: "GET",
		    url: USERTRACKING_ENDPOINT + USERTRACKING_ENDPOINT_GETSTATS,
		    data: {
			id: mediapackageID
		    },
		    success: function(result) {
			if(result && result.stats) {
			    Engage.log("Views: " + result.stats.views);
			}
		    }
		});
            }
        });

        Engage.on(plugin.events.mediaPackageModelError.getName(), function(msg) {
            mediapackageError = true;
        });

        Engage.on(plugin.events.timeupdate.getName(), function(currentTime) {
            if (!mediapackageError) {
                // add footprint each rounded timeupdate
                var cTime = Math.round(currentTime);
                if (lastFootprint != undefined) {
                    if (lastFootprint != cTime) {
                        lastFootprint = cTime;
                        Engage.log("Usertracking: Setting footprint at " + cTime);
                        // put to mh endpoint
                        $.ajax({
                            type: "PUT",
                            url: USERTRACKING_ENDPOINT,
                            data: {
                                id: mediapackageID,
                                in : cTime,
                                out: cTime + 1,
                                type: "FOOTPRINT"
                            },
                            success: function(result) {
                                // update current footprint model
                                Engage.model.get("footprints").update();
                            }
                        });
                    }
                } else {
                    lastFootprint = cTime;
                }
            }
        });
    }

    // init event
    Engage.log("Usertracking: Init");
    var relative_plugin_path = Engage.getPluginPath("EngagePluginCustomUsertracking");

    // mediapackage model created
    Engage.model.on(mediapackageChange, function() {
        initCount -= 1;
        if (initCount <= 0) {
            initPlugin();
        }
    });

    // footprints model created
    Engage.model.on(footprintsChange, function() {
        initCount -= 1;
        if (initCount <= 0) {
            initPlugin();
        }
    });

    // all plugins loaded
    Engage.on(plugin.events.plugin_load_done.getName(), function() {
        Engage.log("Usertracking: Plugin load done");
        initCount -= 1;
        if (initCount <= 0) {
            initPlugin();
        }
    });

    return plugin;
});
