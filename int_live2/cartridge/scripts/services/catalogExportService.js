'use strict';

/**
 * Service for exporting catalog data to external systems
 */

var ProductMgr = require('dw/catalog/ProductMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var Site = require('dw/system/Site');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');

var apiService = require('int_live2/cartridge/scripts/services/httpService');
var catalogProcessor = require('int_live2/cartridge/scripts/helpers/catalogExportHelper');

/**
 * Extract all catalog data including categories and products
 * @returns {Object} The extracted catalog data
 */
function extractFullCatalogData() {
    var siteCatalog = CatalogMgr.getSiteCatalog();
    if (!siteCatalog) {
        throw new Error('Site catalog not found');
    }
    
    var root = siteCatalog.getRoot();
    if (!root) {
        throw new Error('Root category not found');
    }
    
    // Get all categories
    var categories = catalogProcessor.getAllCategories(root);
    
    // Get all products
    var products = [];
    var totalVariants = 0;
    
    var productsIterator = ProductMgr.queryAllSiteProducts();
    while (productsIterator.hasNext()) {
        var product = productsIterator.next();
        
        // Only process master products
        if (product.isMaster()) {
            var productData = catalogProcessor.processProduct(product);
            totalVariants += productData.variants ? productData.variants.length : 0;
            products.push(productData);
        }
    }
    productsIterator.close();
    
    return {
        exportTimestamp: StringUtils.formatCalendar(new Calendar(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''),
        siteId: Site.getCurrent().getID(),
        categories: categories,
        products: products,
        totalVariants: totalVariants
    };
}

module.exports = {
    extractFullCatalogData: extractFullCatalogData,
}; 