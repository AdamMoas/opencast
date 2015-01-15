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
 *
 */
/*jslint browser: true, nomen: true*/
/*global define, CustomEvent*/
define(["backbone", "engage/core"], function(Backbone, Engage) {
    "use strict";

    var INFO_ME_ENDPOINT = "/info/me.json";

    var InfoMeModel = Backbone.Model.extend({
        urlRoot: INFO_ME_ENDPOINT,
        initialize: function() {
            Engage.log("MhConnection: Init InfoMe model");
            this.update();
        },
        update: function() {
            Engage.log("MhConnection: Updating InfoMe model");
            // request model data
            this.fetch({
                data: {},
                success: function(model) {
                    model.loggedIn = false;
                    model.username = "Anonymous";
                    model.roles = [];
                    var attr = model.attributes;
                    if (attr.username) {
                        Engage.log("Username found: " + attr.username);
                        model.username = attr.username;
                    } else {
                        Engage.log("No username found.");
                    }
                    if (attr.roles && (attr.roles.length > 0)) {
                        model.roles = attr.roles;
                        var notAnonymous = false;
                        for (var i = 0; i < attr.roles.length; ++i) {
                            if (attr.roles[i] != "ROLE_ANONYMOUS") {
                                notAnonymous = true;
                            }
                        }
                        model.loggedIn = notAnonymous;
                        if (notAnonymous) {
                            Engage.log("User has one or more roles.");
                        } else {
                            Engage.log("User has no role.");
                        }
                    } else {
                        Engage.log("Error: No roles found.");
                    }
                    model.trigger("change");
                }
            });
        },
        defaults: {}
    });

    return InfoMeModel;
});
