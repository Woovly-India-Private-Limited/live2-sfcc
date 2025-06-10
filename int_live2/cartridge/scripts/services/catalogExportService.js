'use strict';

/**
 * Service for exporting catalog data to external systems
 */

var ProductMgr = require('dw/catalog/ProductMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var Site = require('dw/system/Site');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');

var apiService = require('int_live2/cartridge/scripts/services/httpService');
var catalogProcessor = require('int_live2/cartridge/scripts/helpers/catalogExportHelper');

/**
 * Extract all catalog data including categories and products
 * @returns {Object} The extracted catalog data
 */
function extractFullCatalogData(isSplitCatalogExport) {
    var siteCatalog = CatalogMgr.getSiteCatalog();
    if (!siteCatalog) {
        throw new Error('Site catalog not found');
    }
    
    var root = siteCatalog.getRoot();
    if (!root) {
        throw new Error('Root category not found');
    }
    
    // Get all categories
    var categories;
    if (isSplitCatalogExport) {
        categories = catalogProcessor.getAllUpdatedCategories(root);        
    } else {
        categories = catalogProcessor.getAllCategories(root);
    }
    
    // Get all products
    var products = [];
    var totalVariants = 0;
    var productData;
    var productsIterator = ProductMgr.queryAllSiteProducts();

    while (productsIterator.hasNext()) {
        var product = productsIterator.next();
        // Only process master products
        if (product.isMaster()) {
            if (isSplitCatalogExport) {
                productData = catalogProcessor.processUpdatedProduct(product);
            } else {
                productData = catalogProcessor.processProduct(product);
            }
            if (productData) {
                totalVariants += productData.variants ? productData.variants.length : 0;
                products.push(productData);
            }
        }
    }
    productsIterator.close();

    return {
        exportTimestamp: StringUtils.formatCalendar(new Calendar(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''),
        siteId: Site.getCurrent().getID(),
        defaultCurrency: Site.getCurrent().getDefaultCurrency(),
        storeUrl: URLUtils.httpsHome().toString(),
        categories: categories,
        products: products,
        totalVariants: totalVariants
    };
}

module.exports = {
    extractFullCatalogData: extractFullCatalogData
}; 