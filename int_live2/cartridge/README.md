# SFCC Catalog Export Cartridge

This cartridge provides functionality to extract the entire storefront catalog from Salesforce Commerce Cloud (SFCC) and send it to an external API in JSON format.

## Features

- Extract all master products with their complete attribute sets
- Extract all variants associated with each master product
- Extract the complete category hierarchy with all product-to-category assignments
- Transform catalog data into a comprehensive JSON format
- Send the resulting JSON payload to an external API
- Support for both on-demand and scheduled catalog exports
- **Real-time product webhooks** for create, update, and delete events

## Installation

1. Upload the cartridge to your SFCC instance using Business Manager or your preferred deployment method
2. Add the cartridge to your cartridge path in Business Manager
3. Import the service configuration (services.xml)
4. Import the job configuration (jobs.xml)
5. Configure the required site preferences (see below)

## Configuration

This cartridge requires the following site preferences to be configured:

- **catalogExportApiKey**: API key for authentication (used for both incoming requests and outgoing API calls)
- **catalogExportDestinationURL**: The URL of the external API where the catalog data will be sent
- **catalogExportJobID**: ID of the export job (default: export-catalog-job)
(optional)
- **productWebhooksEnabled**: Boolean indicating whether to send real-time webhooks on product changes (default: false)
- **productWebhookURL**: The URL where product webhook events are sent

## Usage

### REST API Endpoints

This cartridge exposes the following endpoints:

#### Trigger Catalog Export Job

```
GET /on/demandware.store/Sites-<site>-Site/default/CatalogExport-Full
```

This endpoint triggers a catalog export job and returns the job execution ID.

Required Headers:
- `apikey`: Must match the configured `catalogExportApiKey` site preference

#### Execute Catalog Export Immediately

```
GET /on/demandware.store/Sites-<site>-Site/default/CatalogExport-Execute
```

This endpoint executes a catalog export immediately without using a job.

Required Headers:
- `apikey`: Must match the configured `catalogExportApiKey` site preference

#### Check Job Status

```
GET /on/demandware.store/Sites-<site>-Site/default/CatalogExport-Status?jobID=<job_execution_id>
```

This endpoint checks the status of a running job.

Required Headers:
- `apikey`: Must match the configured `catalogExportApiKey` site preference

Required Parameters:
- `jobID`: The job execution ID returned from the CatalogExport-Full endpoint

### Scheduled Jobs

The cartridge includes a job configuration that can be scheduled to run at specified intervals:

1. In Business Manager, navigate to Administration > Operations > Jobs
2. Find and edit the job with ID `export-catalog-job`
3. Configure the job schedule as needed
4. Optionally, set the `DestinationURL` parameter if it differs from the site preference

### Product Webhooks

The cartridge automatically sends webhook notifications for the following product events:

- **Product Creation**: When a new product is created in SFCC
- **Product Update**: When an existing product is modified
- **Product Deletion**: When a product is deleted

To enable webhooks:

1. Set the `productWebhooksEnabled` site preference to `true`
2. Configure the `productWebhookURL` site preference with the endpoint that will receive the webhook events

Webhook payload format:

```json
{
  "event": "create|update|delete",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "product": {
    "ID": "product-id",
    "name": "Product Name",
    "variants": [...]
  },
  "triggeringVariant": {...},  // only present when a variant triggered the event
  "siteId": "SiteGenesis"
}
```

## Data Format

The catalog data is exported in the following JSON format:

```json
{
  "exportTimestamp": "2025-01-01T00:00:00.000Z",
  "siteId": "SiteGenesis",
  "categories": [
    {
      "ID": "category-id",
      "displayName": "Category Name",
      "description": "Category Description",
      "parent": "parent-category-id",
      "customAttributes": {}
    }
  ],
  "products": [
    {
      "ID": "product-id",
      "name": "Product Name",
      "description": "Product Description",
      "categoryAssignments": [],
      "images": [],
      "variants": [
        {
          "ID": "variant-id",
          "SKU": "variant-sku",
          "variationAttributes": {},
          "prices": {}
        }
      ],
      "customAttributes": {}
    }
  ],
  "totalVariants": 100
}
```

## Performance Considerations

For large catalogs, consider using the scheduled job rather than the immediate execution endpoint to avoid timeouts. The job is designed to handle large data volumes efficiently.

## Error Handling

All errors are logged to the custom log files:
- `int_live2-catalogexport`: For catalog export operations
- `int_live2-productHooks`: For product webhook events
- `int_live2-httpService`: For API communication

## Support

For support or feature requests, please contact your Salesforce Commerce Cloud representative.
