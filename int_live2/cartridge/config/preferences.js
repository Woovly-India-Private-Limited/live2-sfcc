'use strict';

var Site = require('dw/system/Site');
var currentSite = Site.getCurrent();

module.exports = {
    catalogExportHeaders: currentSite.getCustomPreferenceValue('catalogExportHeaders'),
    catalogExportApiKey: currentSite.getCustomPreferenceValue('catalogExportApiKey'),
    catalogExportDestinationURL: currentSite.getCustomPreferenceValue('catalogExportDestinationURL'),
    live2AIsdk: currentSite.getCustomPreferenceValue('live2AIsdk'),
    live2SocialWallsdk: currentSite.getCustomPreferenceValue('live2SocialWallsdk'),
    live2AITeamId: currentSite.getCustomPreferenceValue('live2AITeamId')
};