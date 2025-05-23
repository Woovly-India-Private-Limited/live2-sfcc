'use strict';

/**
 * HTTP Service for making API calls to external systems
 */

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger').getLogger('int_live2_social_wall', 'httpService');
var preferences = require('int_live2_social_wall/cartridge/config/preferences');

/**
 * Create and configure a service for API calls
 * @returns {dw.svc.Service} Configured service instance
 */
function getHttpService() {
  return LocalServiceRegistry.createService('int_live2_social_wall.http.service', {
    createRequest: function (service, requestData) {
      var headers;
      var headersObj;
      var apiKey;

      // Set request headers
      service.addHeader('Content-Type', 'application/json');

      // Add custom headers from site preferences if available
      headers = preferences.catalogExportHeaders;
      if (headers) {
        try {
          headersObj = JSON.parse(headers);
          Object.keys(headersObj).forEach(function (key) {
            service.addHeader(key, headersObj[key]);
          });
        } catch (e) {
          Logger.error('Failed to parse custom headers: ' + e.message);
        }
      }

      // Add authentication headers if available
      //   apiKey = preferences.catalogExportApiKey;
      //   if (apiKey) {
      //     service.addHeader('Authorization', 'Bearer ' + apiKey);
      //   }

      return JSON.stringify(requestData);
    },
    parseResponse: function (service, response) {
      return {
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        body: response.text ? JSON.parse(response.text) : null
      };
    },
    mockCall: function () {
      return {
        statusCode: 200,
        statusMessage: 'OK',
        body: {
          success: true,
          message: 'Mock response for catalog export'
        }
      };
    },
    filterLogMessage: function (message) {
      return message;
    }
  });
}

/**
 * Make a service call
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} url - The URL to call
 * @param {Object} data - The data to send (for POST/PUT)
 * @returns {Object} The response
 */
function callService(method, url, data) {
  var service = getHttpService();
  var result;

  service.setURL(url);
  service.setRequestMethod(method);

  try {
    result = service.call(data);

    if (result.isOk()) {
      Logger.info('API call successful: ' + url);
      return result.object;
    }

    Logger.error('API call failed: ' + url + ', Error: ' + result.errorMessage);
    throw new Error('API call failed: ' + result.errorMessage);
  } catch (e) {
    Logger.error('Exception in API call: ' + e.message);
    throw e;
  }
}

/**
 * Make a POST request
 * @param {string} url - The URL to call
 * @param {Object} data - The data to send
 * @returns {Object} The response
 */
function post(url, data) {
  return callService('POST', url, data);
}

/**
 * Make a GET request
 * @param {string} url - The URL to call
 * @returns {Object} The response
 */
function get(url) {
  return callService('GET', url, null);
}

/**
 * Make a PUT request
 * @param {string} url - The URL to call
 * @param {Object} data - The data to send
 * @returns {Object} The response
 */
function put(url, data) {
  return callService('PUT', url, data);
}

/**
 * Make a DELETE request
 * @param {string} url - The URL to call
 * @returns {Object} The response
 */
function del(url) {
  return callService('DELETE', url, null);
}

module.exports = {
  callService: callService,
  post: post,
  get: get,
  put: put,
  del: del
};
