'use strict';

var Site = require('dw/system/Site');
var currentSite = Site.getCurrent();

module.exports = {
    catalogExportApiKey: currentSite.getCustomPreferenceValue('catalogExportApiKey'),
    catalogExportDestinationURL: currentSite.getCustomPreferenceValue('catalogExportDestinationURL'),
    live2AIsdk: currentSite.getCustomPreferenceValue('live2AIsdk'),
    live2ATeamId: currentSite.getCustomPreferenceValue('live2ATeamId')
};
