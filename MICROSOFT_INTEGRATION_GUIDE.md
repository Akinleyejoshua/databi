<!-- Microsoft OneDrive & Excel Support Guide -->

# Microsoft OneDrive & Excel Online Integration

## Overview

The URL import feature now supports Microsoft OneDrive, SharePoint, and Excel Online (Microsoft 365). This allows you to directly import and auto-refresh data from your Microsoft cloud storage.

## Supported Services

### 1. **OneDrive Personal**
- Direct file downloads from personal OneDrive
- Shared OneDrive links
- CSV, Excel, and JSON files

### 2. **OneDrive Business / SharePoint**
- SharePoint document libraries
- OneDrive for Business
- Excel files stored in SharePoint

### 3. **Excel Online (Microsoft 365)**
- Excel workbooks in Microsoft 365
- Shared notebooks
- Works with OneDrive storage

## How to Get Shareable URLs

### For OneDrive Personal Files

**Step 1:** Open your file in OneDrive
**Step 2:** Right-click the file → Select "Share"
**Step 3:** Click "Get a link"
**Step 4:** Select "Anyone with the link can view" or "Specific people"
**Step 5:** Copy the link

The link should look like:
```
https://onedrive.live.com/?cid=XXXXX&id=XXXXX%21XXX&parId=XXXXX%21XXX&o=OneUp
```

**Important:** The system will automatically add `?download=1` to enable direct download.

### For OneDrive Business / SharePoint

**Step 1:** Open the file in SharePoint/OneDrive Business
**Step 2:** Click the file → Click "Share" button
**Step 3:** Copy the share link or click "Get a link"
**Step 4:** Copy the full URL

URLs look like:
```
https://company-my.sharepoint.com/personal/username_company_com/Documents/data.xlsx
```

### For Excel Online Files

**Option A: Export from Excel Online**
1. Open your Excel file in Excel Online
2. Click "File" → "Download"
3. Choose "Download as CSV" or "Download as Excel"
4. Get the file URL from your OneDrive storage

**Option B: Direct Share Link**
1. While editing, click "Share" in the top-right
2. Get the link and ensure download permissions are enabled

## Usage Examples

### Example 1: OneDrive CSV Import with Auto-Refresh

```
URL: https://onedrive.live.com/?cid=XXXXX&id=XXXXX%21XXX
Format: Auto-detected (CSV)
Refresh: Every 1 hour
Auto-refresh: Enabled
```

The system will:
- Automatically append `?download=1`
- Fetch the CSV file
- Parse the data
- Refresh every hour

### Example 2: SharePoint Excel File

```
URL: https://company-my.sharepoint.com/personal/user/Documents/Sales.xlsx
Format: Excel
Refresh: Every 24 hours
Auto-refresh: Enabled
```

### Example 3: Excel Online Export

```
URL: https://onedrive.live.com/download?resid=XXXXX!XXX&export=xlsx
Format: Auto-detected (Excel)
Refresh: On-demand only
Auto-refresh: Disabled
```

## Important Notes

### ⚠️ Sharing Requirements

For auto-refresh to work, the file must be:
- ✅ Shared with "Anyone with the link can view" or specific users
- ✅ Not requiring authentication beyond the shared link
- ✅ Publicly accessible OR accessible to your app's service account
- ❌ Not protected with additional password/PIN

### ⚠️ File Format Consistency

When using auto-refresh, ensure:
- File structure remains consistent (same columns)
- No major format changes between refreshes
- Data types remain the same
- Headers don't change

### ⚠️ OneDrive Share Link Format

Direct share links must include the download parameter:
- **Before:** `https://onedrive.live.com/?cid=...`
- **After:** `https://onedrive.live.com/?cid=...&download=1` (added automatically)

### ⚠️ Excel Online vs Files

| Feature | Excel Online | Exported File |
|---------|--------------|---------------|
| Direct URL import | ❌ Not directly | ✅ Yes |
| Auto-refresh | ❌ No | ✅ Yes |
| Recommended | ❌ Use export links | ✅ Preferred |
| Data freshness | N/A | Depends on export frequency |

## Getting the Right URL

### Microsoft OneDrive Personal
![OneDrive Share Instructions]
1. File → Share
2. "Get a link"
3. Copy URL from address bar
4. Use format: `https://onedrive.live.com/?cid=...&id=...`

### Microsoft SharePoint
![SharePoint Share Instructions]
1. Click file → Share
2. Select "Copy Link"
3. Use format: `https://{tenant}-my.sharepoint.com/personal/{user}/{path}/{file}`

### Excel Online
![Excel Online Export Instructions]
1. File → Download → Download as CSV (or Excel)
2. Get the file URL from OneDrive
3. Use the OneDrive link with download parameter

## Troubleshooting

### "Failed to fetch URL" with OneDrive link

**Problem:** The share link isn't accessible
**Solutions:**
- Ensure the file is actually shared (not just a personal file)
- Check that sharing is set to "Anyone with the link" or includes your domain
- Try copying the share link again - some links expire
- Remove `&download=1` if the system adds a duplicate

### "Unable to parse data from URL"

**Problem:** File format not recognized
**Solutions:**
- Verify the file is CSV, Excel, or JSON
- Check file isn't corrupted
- Try exporting from Excel Online instead of using edit link
- Ensure proper file extension in the link

### Auto-refresh stops working

**Problem:** Refresh fails after initial import
**Solutions:**
- Check if file is still shared and accessible
- Verify sharing permissions haven't changed
- Check if the file was moved or deleted
- Review browser console for detailed error messages
- Disable and re-enable auto-refresh

### SharePoint file access denied

**Problem:** Can't access SharePoint file
**Solutions:**
- Verify you have at least "View" permissions
- Check if your organization requires authentication
- Try opening file in SharePoint first to verify access
- Use public/anonymous share link if available
- Contact SharePoint admin if it's a permissions issue

## Best Practices

### For OneDrive Files
1. **Use stable share links** - Don't rely on temporary access links
2. **Keep consistent naming** - File name in URL helps identify source
3. **Export for backup** - Maintain local copies of important data
4. **Monitor refresh** - Check console for refresh errors
5. **Version control** - Note which version of the file you imported

### For SharePoint Files
1. **Use library links** - More stable than personal shares
2. **Document permissions** - Know who can access the file
3. **Check retention policies** - Ensure files won't be deleted unexpectedly
4. **Use API endpoints** - For large datasets, consider SharePoint API
5. **Test before scheduling** - Verify refresh works before enabling

### For Excel Online
1. **Export regularly** - Maintain exported CSV/Excel links
2. **Test in browser** - Verify URL works before importing
3. **Use admin account** - If setting up for team, use service account
4. **Document source** - Keep track of which Excel Online file is exported
5. **Monitor changes** - Excel formulas might change data on auto-refresh

## Security Considerations

### ⚠️ Shared Links
- Public share links can be accessed by anyone with the link
- Consider using "Specific people" share for sensitive data
- Regenerate links if they've been exposed

### ⚠️ Authentication
- Basic auth can be added: `https://user:password@domain.com/file`
- Better: Use service account with proper permissions
- Avoid pasting personal passwords in URLs

### ⚠️ Data Privacy
- Shared links may expose file structure in URLs
- Be careful with sensitive data in shared files
- Consider data classification before sharing

## Limitations

| Limitation | Details |
|------------|---------|
| File size | Maximum 50MB per file |
| Fetch timeout | 30 seconds per request |
| Refresh frequency | Minimum 5 minutes |
| Authentication | Basic auth only (no OAuth) |
| Real-time | Not true real-time, delayed by refresh interval |
| Excel formulas | Exported values, not formulas |

## API Details

### URL Normalization

The system automatically normalizes URLs:

```typescript
// OneDrive share link
Before: https://onedrive.live.com/?cid=...&id=...
After:  https://onedrive.live.com/?cid=...&id=...&download=1

// SharePoint file
Before: https://...sharepoint.com/personal/user/Documents/file.xlsx
After:  https://...sharepoint.com/personal/user/Documents/file.xlsx?download=1
```

### Supported Domains

The feature recognizes:
- `onedrive.live.com` - Personal OneDrive
- `sharepoint.com` - SharePoint/OneDrive Business
- `office.com` - Excel Online links
- Direct file URLs ending in `.xlsx`, `.xls`, `.csv`, `.json`

## Next Steps

1. **Test with your OneDrive file**
   - Share a file
   - Copy the share link
   - Paste in URL import

2. **Set up auto-refresh**
   - Choose refresh interval
   - Enable auto-refresh
   - Monitor first refresh

3. **Use in visualizations**
   - Create charts from imported data
   - Data updates automatically
   - No manual refresh needed

## Support

If you encounter issues:
1. Check the troubleshooting section
2. Review browser console for error messages
3. Verify file sharing and permissions
4. Try with a simple test file first
5. Contact support with error message

---

**Last Updated:** April 2026
**Supported Services:** OneDrive Personal, OneDrive Business, SharePoint, Excel Online (Microsoft 365)
