'use strict';

/**
 * Job steps for catalog export functionality
 */

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger').getLogger('int_live2', 'catalogExport');
var System = require('dw/system/System');

var catalogExportService = require('int_live2/cartridge/scripts/services/catalogExportService');
var httpService = require('int_live2/cartridge/scripts/services/httpService');

/**
 * Execute a full catalog export
 * @param {dw.util.HashMap} parameters - Job parameters
 * @returns {dw.system.Status} The execution status
 */
function executeFullCatalogExport(parameters) {
    var startTime;
    var catalogData;
    var destinationURL;
    var executionTime;
    var endTime;

    try {
        Logger.info('Starting full catalog export job');
        startTime = Date.now();

        // Extract catalog data
        catalogData = catalogExportService.extractFullCatalogData();

        // Check if we have a destination URL
        destinationURL = parameters.get('DestinationURL') || preferences.catalogExportDestinationURL;

        if (!destinationURL) {
            Logger.error('Destination URL not provided in job parameters or site preferences');
            return new Status(
                Status.ERROR,
                'ERROR',
                'Destination URL not configured'
            );
        }

        // Send data to the external API
        httpService.post(destinationURL, catalogData);

        endTime = Date.now();
        executionTime = (endTime - startTime) / 1000; // in seconds

        Logger.info('Catalog export completed successfully. Execution time: ' + executionTime + ' seconds');
        Logger.info('Exported {0} categories, {1} master products, and {2} variants',
            catalogData.categories.length,
            catalogData.products.length,
            catalogData.totalVariants
        );
        return new Status(Status.OK);
    } catch (e) {
        Logger.error('Error in catalog export job: ' + e.message);
        return new Status(Status.ERROR, 'ERROR', e.message);
    }
}

/**
 * Split catalog export job to process in chunks
 * @param {dw.util.HashMap} parameters - Job parameters
 * @returns {dw.system.Status} The execution status
 */
function splitCatalogExport() {
    var startTime;
    var catalogData;
    var destinationURL;
    var executionTime;
    var endTime;

    try {
        Logger.info('Starting full catalog export job');
        startTime = Date.now();

        // Extract catalog data
        catalogData = catalogExportService.extractFullCatalogData(true);

        // Check if we have a destination URL
        destinationURL = parameters.get('DestinationURL') || preferences.catalogExportDestinationURL;

        if (!destinationURL) {
            Logger.error('Destination URL not provided in job parameters or site preferences');
            return new Status(
                Status.ERROR,
                'ERROR',
                'Destination URL not configured'
            );
        }

        // Send data to the external API
        httpService.post(destinationURL, catalogData);

        endTime = Date.now();
        executionTime = (endTime - startTime) / 1000; // in seconds

        Logger.info('Catalog export completed successfully. Execution time: ' + executionTime + ' seconds');
        Logger.info('Exported {0} categories, {1} master products, and {2} variants',
            catalogData.categories.length,
            catalogData.products.length,
            catalogData.totalVariants
        );
        return new Status(Status.OK);
    } catch (e) {
        Logger.error('Error in catalog export job: ' + e.message);
        return new Status(Status.ERROR, 'ERROR', e.message);
    }
}

module.exports = {
    executeFullCatalogExport: executeFullCatalogExport,
    splitCatalogExport: splitCatalogExport
};
