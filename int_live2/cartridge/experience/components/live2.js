"use strict";
/* global response */

var Template = require("dw/util/Template");
var HashMap = require("dw/util/HashMap");

/**
 * Render logic for storefront.mainbanner component.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commerce Cloud Platform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
  var model = modelIn || new HashMap();
  var content = context.content;
  var httpReq = JSON.parse(request.httpParameterMap.params.rawValue);

  model.publishID = content.publishID ? content.publishID : null;
  if (!model.publishID) {
    if (httpReq && httpReq.aspect_attributes) {
      model.pid = httpReq.aspect_attributes.product || null;
      model.cid = httpReq.aspect_attributes.category || null;
    }
    if (model.pid) {
      model.publishID = "p:" + model.pid;
    } else if (model.cid) {
      model.publishID = "c:" + model.cid;
    }
  }
  model.customCSS = content.customCSS ? content.customCSS : null;

  // instruct 24 hours relative pagecache
  var expires = new Date();
  expires.setDate(expires.getDate() + 1);
  response.setExpires(expires);

  return new Template("experience/components/live2").render(model).text;
};
