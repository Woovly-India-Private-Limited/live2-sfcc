'use strict';

/**
 * Helper for processing catalog data for export
 */

var Money = require('dw/value/Money');
var Logger = require('dw/system/Logger').getLogger('int_live2', 'catalogExport');
var ArrayList = require('dw/util/ArrayList');
var ProductAvailabilityModel = require('dw/catalog/ProductAvailabilityModel');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/**
 * Process a category and all its subcategories recursively
 * @param {dw.catalog.Category} category - The category to process
 * @returns {Array} Array of processed category objects
 */
function getAllCategories(category) {
    var result = [];
    var categoryData;
    var subCategories;
    var i;
    var subcategoryResult;

    // Process this category
    categoryData = processSingleCategory(category);
    if (categoryData) {
        result.push(categoryData);
    }

    // Process subcategories recursively
    subCategories = category.getSubCategories();
    if (subCategories && subCategories.length > 0) {
        for (i = 0; i < subCategories.length; i++) {
            subcategoryResult = getAllCategories(subCategories[i]);
            result = result.concat(subcategoryResult);
        }
    }

    return result;
}

/**
 * Process a single category, extracting all its attributes
 * @param {dw.catalog.Category} category - The category to process
 * @returns {Object} Category data in JSON-ready format
 */
function processSingleCategory(category) {
    var result;
    var i;
    var attribute;

    if (!category) {
        return null;
    }

    result = {
        ID: category.ID,
        displayName: category.displayName,
        description: category.description,
        image: category.image ? category.image.URL.toString() : null,
        thumbnail: category.thumbnail ? category.thumbnail.URL.toString() : null,
        parent: category.parent ? category.parent.ID : null,
        position: category.getSearchPlacement(),
        pageTitle: category.pageTitle,
        pageDescription: category.pageDescription,
        pageKeywords: category.pageKeywords,
        onlineFlag: category.online,
        siteMapIncluded: category.siteMapIncluded,
        siteMapPriority: category.siteMapPriority,
        siteMapFrequency: category.siteMapChangeFrequency
    };

    Transaction.wrap(function () {
        category.custom.live2LastExportedTime = Date.now();
    });

    return result;
}

/**
 * Process a product, including all its variants and attributes
 * @param {dw.catalog.Product} product - The product to process
 * @returns {Object} Product data in JSON-ready format
 */
function processProduct(product) {
    var result;
    var categoryAssignments;
    var i;
    var category;
    var images;
    var j;
    var k;
    var attribute;
    var variants;
    var l;
    var variant;
    var variantData;

    if (!product) {
        return null;
    }

    result = {
        ID: product.ID,
        name: product.name,
        displayName: product.pageTitle || product.name,
        description: product.longDescription ? product.longDescription.source : (product.shortDescription ? product.shortDescription.source : ''),
        shortDescription: product.shortDescription ? product.shortDescription.source : '',
        creationDate: product.creationDate ? product.creationDate.toISOString() : null,
        lastModified: product.lastModified ? product.lastModified.toISOString() : null,
        onlineFlag: product.online,
        onlineFrom: product.onlineFrom ? product.onlineFrom.toISOString() : null,
        onlineTo: product.onlineTo ? product.onlineTo.toISOString() : null,
        searchable: product.searchable,
        siteMapIncluded: product.siteMapIncluded,
        siteMapPriority: product.siteMapPriority,
        siteMapFrequency: product.siteMapChangeFrequency,
        brand: product.brand,
        manufacturerName: product.manufacturerName,
        manufacturerSKU: product.manufacturerSKU,
        upc: product.UPC,
        pageTitle: product.pageTitle,
        pageDescription: product.pageDescription,
        pageKeywords: product.pageKeywords,
        template: product.template ? product.template.ID : null,
        primaryCategory: product.primaryCategory ? product.primaryCategory.ID : null,
        categoryAssignments: [],
        images: [],
        variants: []
    };

    // Process category assignments
    categoryAssignments = product.getCategoryAssignments();
    if (categoryAssignments && categoryAssignments.length > 0) {
        for (i = 0; i < categoryAssignments.length; i++) {
            category = categoryAssignments[i].category;
            if (category) {
                result.categoryAssignments.push({
                    categoryID: category.ID,
                    isPrimary: product.primaryCategory && category.ID === product.primaryCategory.ID
                });
            }
        }
    }

    // Process images
    images = product.getImages('large');
    if (images && images.length > 0) {
        for (j = 0; j < images.length; j++) {
            result.images.push({
                alt: images[j].alt,
                title: images[j].title,
                url: images[j].URL.toString(),
                viewType: images[j].viewType ? images[j].viewType.ID : null
            });
        }
    }

    // Process variants if this is a master product
    if (product.isMaster() && product.variants) {
        variants = product.getVariants();
        if (variants && variants.length > 0) {
            for (l = 0; l < variants.length; l++) {
                variant = variants[l];
                variantData = processVariant(variant);
                if (variantData) {
                    result.variants.push(variantData);
                }
            }
        }
    }

    Transaction.wrap(function () {
        product.custom.live2LastExportedTime = Date.now();
    });

    return result;
}

/**
 * Process a variant product
 * @param {dw.catalog.Variant} variant - The variant to process
 * @returns {Object} Variant data in JSON-ready format
 */
function processVariant(variant) {
    var result;
    var variationAttributes;
    var i;
    var variationAttribute;
    var attributeValue;
    var j;
    var attribute;

    if (!variant) {
        return null;
    }

    result = {
        ID: variant.ID,
        SKU: variant.ID, // In SFCC, the ID is typically the SKU
        EAN: variant.EAN,
        UPC: variant.UPC,
        onlineFlag: variant.online,
        availabilityStatus: getAvailabilityStatus(variant),
        inStock: variant.availabilityModel ? variant.availabilityModel.inStock : false,
        variant: true,
        variationAttributes: {},
        prices: getProductPrices(variant)
    };

    // Process variation attributes
    variationAttributes = variant.variationModel.getProductVariationAttributes();
    if (variationAttributes && variationAttributes.length > 0) {
        for (i = 0; i < variationAttributes.length; i++) {
            variationAttribute = variationAttributes[i];
            attributeValue = variant.variationModel.getSelectedValue(variationAttribute);
            if (attributeValue) {
                result.variationAttributes[variationAttribute.ID] = {
                    displayValue: attributeValue.displayValue,
                    value: attributeValue.value
                };
            }
        }
    }

    var data = {};
    data.prices = result.prices;
    data.availability = result.availabilityStatus;
    Transaction.wrap(function () {
        variant.custom.live2LastExportedTime = Date.now();
        variant.custom.live2Data = JSON.stringify(data);
    });

    return result;
}

/**
 * Get the availability status of a product
 * @param {dw.catalog.Product} product - The product to check
 * @returns {string} The availability status
 */
function getAvailabilityStatus(product) {
    var availability;

    if (!product || !product.availabilityModel) {
        return 'NOT_AVAILABLE';
    }

    availability = product.availabilityModel;

    if (availability.inStock) {
        return 'IN_STOCK';
    } else if (availability.availabilityStatus === ProductAvailabilityModel.AVAILABILITY_STATUS_PREORDER) {
        return 'PREORDER';
    } else if (availability.availabilityStatus === ProductAvailabilityModel.AVAILABILITY_STATUS_BACKORDER) {
        return 'BACKORDER';
    }

    return 'NOT_AVAILABLE';
}

/**
 * Get all prices for a product
 * @param {dw.catalog.Product} product - The product to get prices for
 * @returns {Object} Object containing all price information
 */
function getProductPrices(product) {
    if (!product || !product.priceModel) return { prices: {} };

    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var priceFactory = require('*/cartridge/scripts/factories/price');
    var PriceBookMgr = require('dw/catalog/PriceBookMgr');
    var collections = require('*/cartridge/scripts/util/collections');

    var result = {};
    var priceModel = product.priceModel;
    var priceBooks = PriceBookMgr.getSitePriceBooks();
    if (priceBooks && priceBooks.length > 0) {
        collections.forEach(priceBooks, function (priceBook) {
            let price = priceModel.getPriceBookPrice(priceBook.ID);
            if (price.available) {
                result[priceBook.ID] = formatPrice(price);
            }
        });
    }
    return result;
}

/**
 * Format a price object for JSON export
 * @param {dw.value.Money} price - The price to format
 * @returns {Object} Formatted price object
 */
function formatPrice(price) {
    if (!price || !price.available) {
        return null;
    }

    return {
        value: price.value,
        currencyCode: price.currencyCode,
        decimalValue: price.value.toFixed(2),
        formatted: price.toFormattedString()
    };
}

/**
 * Helper function to safely convert attribute values to JSON-safe values
 * @param {*} value - The value to convert
 * @returns {*} JSON-safe value
 */
function convertToJsonValue(value) {
    var result;
    var i;

    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value instanceof Money) {
        return {
            value: value.value,
            currencyCode: value.currencyCode,
            formatted: value.toFormattedString()
        };
    }

    if (value instanceof ArrayList) {
        result = [];
        for (i = 0; i < value.length; i++) {
            result.push(convertToJsonValue(value[i]));
        }
        return result;
    }

    // Default to string representation
    return value.toString();
}

/**
 * Compares variant data and data exported to live2
 * @param {dw.catalog.Variant} variant - variant object
 * @param {Object} live2VariantData - data from custom attr
 * @returns {boolean} - returns false if variant data are same else true
 */
function compareLive2VariantData(variant, live2VariantData) {
    const prices = getProductPrices(variant);
    const availability = getAvailabilityStatus(variant);

    // Compare prices and availability
    if (prices && live2VariantData.prices && JSON.stringify(prices) !== JSON.stringify(live2VariantData.prices)) {
        return true;
    } else if (live2VariantData.availability !== availability) {
        return true;
    }

    return false;
}


function getAllUpdatedCategories(category) {
    var result = [];
    var categoryData;
    var subCategories;
    var i;
    var subcategoryResult;

    // Process this category if modified after exported to Live2
    if (category.lastModified.getTime() > Number(category.custom.live2LastExportedTime) + 3) {
        categoryData = processSingleCategory(category);
        if (categoryData) {
            result.push(categoryData);
        }
    }

    // Process subcategories recursively
    subCategories = category.getSubCategories();
    if (subCategories && subCategories.length > 0) {
        for (i = 0; i < subCategories.length; i++) {
            subcategoryResult = getAllUpdatedCategories(subCategories[i]);
            result = result.concat(subcategoryResult);
        }
    }

    return result;
}

function processUpdatedProduct(product) {
    var result;
    if (!product) {
        return null;
    }
    let isUpdatedVariant = false;
    if (product.variants) {
        const variants = product.getVariants();
        if (variants && variants.length > 0) {
            for (let i = 0; i < variants.length; i++) {
                const variant = variants[i];
                const variantCustom = variant.custom;
                // compare with last modified time
                if (('live2LastExportedTime' in variantCustom && variantCustom.live2LastExportedTime && variant.lastModified.valueOf() > Number(variantCustom.live2LastExportedTime) + 100) || !('live2LastExportedTime' in variantCustom)) {
                    isUpdatedVariant = true;
                    break;
                }
                // compare with prices and availability
                if ('live2Data' in variantCustom && variantCustom.live2Data) {
                    var live2VariantData = JSON.parse(variantCustom.live2Data);
                    isUpdatedVariant = compareLive2VariantData(variant, live2VariantData);
                    if (isUpdatedVariant) {
                        break;
                    }
                }
            }
        }
    }
    if (isUpdatedVariant) {
        result = processProduct(product);
    }
    return result;
}

module.exports = {
    getAllCategories: getAllCategories,
    processSingleCategory: processSingleCategory,
    processProduct: processProduct,
    processVariant: processVariant,
    getAvailabilityStatus: getAvailabilityStatus,
    getProductPrices: getProductPrices,
    formatPrice: formatPrice,
    convertToJsonValue: convertToJsonValue,
    getAllUpdatedCategories: getAllUpdatedCategories,
    processUpdatedProduct: processUpdatedProduct,
};