# URL-Based Dataset Import Feature

## Overview

The URL-based dataset import feature allows you to import data directly from URLs, similar to Power Query functionality in Excel. The feature supports automatic data refresh at configurable intervals.

## Features

### 1. **URL Import Support**
- **CSV files** - Direct CSV file URLs or downloadable CSV endpoints
- **Excel files** (.xlsx, .xls) - Both direct file URLs and Excel export endpoints
- **JSON data** - REST API endpoints returning JSON arrays or objects
- **Supported sources:**
  - GitHub raw content URLs
  - Dropbox shared links
  - Google Drive export links
  - Generic API endpoints
  - Direct file downloads

### 2. **Auto-Refresh Capability**
- **Enable auto-refresh** during import to keep data synchronized
- **Configurable intervals:**
  - Every 5 minutes
  - Every 15 minutes
  - Every 30 minutes
  - Every 1 hour (default)
  - Every 24 hours
- **Manual refresh** - Trigger data refresh on demand
- **Enable/disable** auto-refresh anytime for existing URL-based tables

## How to Use

### Step 1: Open Import Modal
Click the **"Import Data"** button in your project to open the import modal.

### Step 2: Select URL Tab
Choose the **"🔗 URL Import"** tab from the modal tabs.

### Step 3: Enter Dataset URL
Paste your dataset URL in the input field. Examples:

```
# CSV from GitHub
https://raw.githubusercontent.com/user/repo/main/data.csv

# Excel from a web server
https://example.com/reports/sales.xlsx

# JSON from an API
https://api.example.com/data/users

# Google Drive CSV export
https://docs.google.com/spreadsheets/export?id=SHEET_ID&format=csv

# Dropbox shared link
https://www.dropbox.com/s/file-key/data.csv?dl=1
```

### Step 4: Configure Auto-Refresh (Optional)
- Check **"Auto-refresh data"** to enable automatic updates
- Select the refresh interval from the dropdown
- Data will automatically sync at the selected interval

### Step 5: Import
Click **"Import from URL"** to fetch and import the data.

## Data Source Tracking

Once imported, URL-based tables are marked with a **🔗 URL Source** indicator in the tables list.

### Table Properties

Each imported table includes metadata:
```typescript
source: {
  type: "url",                    // Always "url" for URL-imported tables
  url: "https://...",            // Original source URL
  refreshInterval: 3600000,       // Milliseconds between refreshes
  isAutoRefresh: false,           // Auto-refresh enabled?
  lastRefreshed: "2024-01-01..."  // Last refresh timestamp
}
```

## API Reference

### POST `/api/data/import-url`

Fetch and parse data from a URL.

**Request:**
```json
{
  "url": "https://example.com/data.csv",
  "refreshInterval": 3600000,
  "isAutoRefresh": false
}
```

**Response:**
```json
{
  "tables": [
    {
      "id": "1234567-abcde",
      "name": "data",
      "columns": [
        {
          "name": "column_name",
          "type": "string",
          "originalType": "string"
        }
      ],
      "rows": [...],
      "rowCount": 100,
      "source": {
        "type": "url",
        "url": "https://example.com/data.csv",
        "refreshInterval": 3600000,
        "isAutoRefresh": false,
        "lastRefreshed": "2024-01-01T00:00:00Z"
      }
    }
  ]
}
```

## Advanced Usage

### Using the useUrlDataRefreshManager Hook

The `useUrlDataRefreshManager` hook provides programmatic control over URL data refresh:

```typescript
import { useUrlDataRefreshManager } from "@/hooks/use-url-refresh";

export function DataPanel() {
  const { refreshTable, enableAutoRefresh, disableAutoRefresh } = useUrlDataRefreshManager();

  return (
    <>
      <button onClick={() => refreshTable("table-id-123")}>
        Refresh Now
      </button>
      <button onClick={() => enableAutoRefresh("table-id-123", 300000)}>
        Enable Auto-Refresh (5min)
      </button>
      <button onClick={() => disableAutoRefresh("table-id-123")}>
        Disable Auto-Refresh
      </button>
    </>
  );
}
```

### Using the Project Store

Access URL-based tables from the project store:

```typescript
import { useProjectStore } from "@/store/use-project-store";

export function Component() {
  const { getUrlBasedTables, updateTableSource } = useProjectStore();
  
  const urlTables = getUrlBasedTables();
  
  // Update table source
  updateTableSource(
    "table-id",
    "https://example.com/data.csv",
    300000,  // 5 minutes
    true     // auto-refresh enabled
  );
}
```

## Limitations

- **File size limit:** 50MB per import
- **Timeout:** 30 seconds per URL fetch
- **Content types supported:** CSV, Excel, JSON
- **CORS:** The server must allow HTTP requests from your domain
- **Authentication:** Basic auth can be added to URL (e.g., `https://user:pass@example.com/data.csv`)

## Supported URL Patterns

The system validates and supports:

1. **Direct file URLs** - `.csv`, `.xlsx`, `.xls`, `.json`
2. **GitHub raw content** - `github.com/.../raw/...`
3. **Dropbox links** - `dropbox.com/...`
4. **Google Drive** - `drive.google.com/...` and `googleapis.com`
5. **API endpoints** - Any URL path containing `/api/`

## Troubleshooting

### "Invalid or unsupported dataset URL"
- Ensure the URL is valid and uses HTTP/HTTPS
- Check if it's from a supported source (GitHub, Dropbox, Google Drive, API endpoints, or direct file)
- Verify the URL is publicly accessible

### "File size exceeds 50MB limit"
- The imported file is too large
- Use a filtered or summarized version of the data
- Consider using pagination with an API endpoint

### "Failed to parse data"
- Ensure the URL returns valid CSV, Excel, or JSON data
- Check file format matches the URL extension
- Try downloading the URL manually to verify content

### "Failed to refresh data" (Auto-refresh)
- Check network connectivity
- Verify the source URL is still accessible
- Review browser console for detailed error messages
- Auto-refresh will retry at the next scheduled interval

## Best Practices

1. **Test URLs first** - Verify the URL works in a browser before importing
2. **Choose appropriate intervals** - Balance freshness with server load
3. **Monitor auto-refresh** - Watch for failed refresh attempts in the console
4. **Verify data structure** - Ensure CSV/JSON has consistent columns across refreshes
5. **Use public URLs** - Avoid authentication-required URLs for auto-refresh (won't work in background)
6. **Regular backups** - Keep local copies of important data sources

## Examples

### Example 1: Import Public CSV from GitHub
```
https://raw.githubusercontent.com/datasets/gdp/master/data/gdp.csv
```

### Example 2: Import Excel with Auto-Refresh
```
URL: https://reports.company.com/export/monthly-sales.xlsx
Interval: Every 24 hours
Auto-refresh: Enabled
```

### Example 3: Import from JSON API
```
https://api.example.com/v1/products?format=json
```

### Example 4: Import from Google Sheets
Export as CSV and use:
```
https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={SHEET_GID}
```

## File Structure

**New Files Created:**
- `src/lib/url-data-parser.ts` - URL validation and data parsing utilities
- `src/app/api/data/import-url/route.ts` - API endpoint for URL imports
- `src/hooks/use-url-refresh.ts` - Hook for managing auto-refresh

**Modified Files:**
- `src/types/index.ts` - Added `DataSource` interface
- `src/components/data/upload-modal.tsx` - Added URL import tab
- `src/store/use-project-store.ts` - Added URL table management methods

## Future Enhancements

Potential improvements:
- [ ] Scheduled refresh jobs for background updates
- [ ] Data transformation pipelines for URL sources
- [ ] Webhook support for push-based updates
- [ ] Caching layer for repeated URL requests
- [ ] Authentication support (OAuth, API keys)
- [ ] Incremental data loading for large datasets
- [ ] Data preview before import
- [ ] URL health monitoring and alerting
