# CSV Import/Export Feature Documentation

## Overview
The CSV Import/Export functionality allows bulk data entry and migration of test modules and test cases. This feature is designed for efficient data management and supports both creating new modules and updating existing ones.

## Feature Location
**Page**: `/app/modules/page.tsx`
**UI Location**: Module Library page header (next to "New Module" button)

## CSV Format Specification

### Headers
```csv
Module Name,Module Description,Module Icon,Module Tags,Test Case Title,Test Case Description,Test Case Priority
```

### Column Definitions

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| Module Name | **Yes** | Name of the test module | "Sign In" |
| Module Description | No | Description of the module | "Authentication and sign-in flows" |
| Module Icon | No | Emoji or icon for the module | "🔐" |
| Module Tags | No | Comma-separated tags (in quotes) | "auth,security" |
| Test Case Title | **Yes*** | Title of the test case | "Google Sign In" |
| Test Case Description | No | Detailed description of test case | "Sign in using Google works with no error" |
| Test Case Priority | **Yes*** | Priority level (High/Medium/Low) | "High" |

*Required for test case rows. Modules without test cases can omit these fields.

### CSV Format Rules

1. **Module Grouping**: Module fields (name, description, icon, tags) repeat for each test case in that module
2. **Tags Format**: Multiple tags must be comma-separated within quotes (e.g., `"auth,security"`)
3. **Empty Modules**: Modules without test cases should have a single row with empty test case fields
4. **Priority Values**: Must be exactly "High", "Medium", or "Low" (case-sensitive)
5. **Special Characters**: Cells with commas, quotes, or newlines are automatically escaped with double quotes
6. **Character Encoding**: UTF-8 encoding is used for emoji support

### Sample CSV

```csv
Module Name,Module Description,Module Icon,Module Tags,Test Case Title,Test Case Description,Test Case Priority
Sign In,Authentication and sign-in flows,🔐,"auth,security",Google Sign In,Sign in using Google works with no error,High
Sign In,Authentication and sign-in flows,🔐,"auth,security",Apple Sign In,Sign in using Apple works with no error,High
Sign In,Authentication and sign-in flows,🔐,"auth,security",Email Sign In,Sign in using email and password,Medium
Payment Flow,Payment processing and checkout,💳,"payment,critical",Credit Card Payment,Process payment with credit card successfully,High
Payment Flow,Payment processing and checkout,💳,"payment,critical",PayPal Integration,PayPal payment flow works end-to-end,High
```

## Export Functionality

### How to Export

1. Navigate to Module Library page (`/modules`)
2. Click the "📥 Export CSV" button in the page header
3. A CSV file will be downloaded automatically with filename format: `modules_export_YYYY-MM-DD.csv`

### Export Behavior

- **Data Source**: Exports from **draft state** (current working copy), not saved server state
- **All Modules**: Exports all modules currently visible in the library
- **Module Order**: Maintains the current order of modules and test cases
- **Empty Modules**: Modules without test cases are exported as single rows with empty test case fields
- **File Format**: Standard RFC 4180 CSV format with proper escaping

### Export Features

- Automatic CSV escaping for special characters (commas, quotes, newlines)
- Timestamp-based filename for easy version tracking
- Success toast notification showing number of modules exported
- UTF-8 encoding for emoji support

## Import Functionality

### How to Import

1. Navigate to Module Library page (`/modules`)
2. Click the "📤 Import CSV" button in the page header
3. Select a CSV file from your computer
4. Review the **Import Preview Modal** showing all changes
5. Click "Confirm Import" to apply changes or "Cancel" to abort

### Import Preview Modal

The preview modal displays:

#### Statistics Summary
- **New Modules**: Number of modules to be created
- **Updated Modules**: Number of existing modules to be modified
- **Test Cases Added**: Total number of test cases to be imported
- **Test Cases Replaced**: Number of existing test cases that will be replaced

#### Detailed Changes
- **New Modules Section**: List of modules that will be created with test case counts
- **Updated Modules Section**: List of existing modules with before/after test case counts
- **Warning Banner**: Displayed if existing test cases will be replaced

### Import Behavior

#### Module Matching
- **Case-Insensitive**: Module names are matched case-insensitively
- **New Modules**: Modules not found in current library are created
- **Existing Modules**: Modules with matching names are updated

#### Test Case Replacement
- **Complete Replacement**: Existing test cases in a module are **completely replaced** by CSV data
- **Warning Display**: User is warned if test cases will be replaced
- **Confirmation Required**: User must confirm before import is applied

#### Field Updates for Existing Modules
- **Description**: Updated if provided in CSV
- **Icon**: Updated if provided in CSV
- **Tags**: Updated if provided in CSV
- **Name**: Preserved (module matching is by name)

### Import Validation

The parser validates:
- **File Format**: Must be valid CSV structure
- **Empty File**: Rejects files with no data rows
- **Priority Values**: Validates "High", "Medium", or "Low" (defaults to "Medium" if invalid)
- **Required Fields**: Module Name is required; Test Case Title/Priority required for test case rows

### Import Features

- **Custom CSV Parser**: Handles quoted fields, escaped quotes, and different line endings (CRLF, LF)
- **Smart Grouping**: Groups rows by module name automatically
- **Draft Mode**: Changes are applied to draft state, requiring "Save Changes" to persist
- **Toast Notifications**: Success/error feedback for user actions
- **File Re-upload**: Same file can be re-uploaded (input is reset)

## User Experience

### Accessibility Features
- **ARIA Labels**: All buttons have descriptive aria-labels for screen readers
- **Keyboard Navigation**: Full keyboard support for file selection and modal interactions
- **Focus Management**: Proper focus handling in modal dialogs
- **Semantic HTML**: Uses semantic button elements and proper input types

### Visual Feedback
- **Color-Coded Stats**: Green for additions, blue for updates, orange for replacements
- **Module Icons**: Displayed in preview for easy identification
- **Before/After Counts**: Clear indication of test case count changes
- **Warning Indicators**: Visual warning when data will be replaced

### Mobile Responsiveness
- **Responsive Layout**: Modal adapts to smaller screens with padding
- **Scrollable Content**: Long lists scroll within modal
- **Touch-Friendly**: Adequate button sizes and spacing

## Technical Implementation

### State Management
```typescript
// Import state
const [isImportModalOpen, setIsImportModalOpen] = useState(false);
const [importPreview, setImportPreview] = useState<{
  newModules: Module[];
  updatedModules: { old: Module; new: Module }[];
  stats: { modulesAdded: number; modulesUpdated: number; testCasesAdded: number; testCasesReplaced: number };
} | null>(null);
```

### Key Functions

#### Export
- `handleExportCSV()`: Generates CSV from draft modules and triggers download

#### Import
- `parseCSV(csvText)`: Custom CSV parser with proper escaping support
- `handleFileUpload(event)`: Processes file selection and generates preview
- `handleConfirmImport()`: Applies import changes to draft state

### CSV Parsing Algorithm
- Character-by-character parsing for accurate quote handling
- Tracks quote context for proper field separation
- Handles CRLF and LF line endings
- Supports escaped quotes within quoted fields (RFC 4180 compliant)

## Integration with Draft Mode

The CSV import/export feature integrates seamlessly with the existing draft mode:

1. **Export**: Always uses current draft state (shows unsaved changes)
2. **Import**: Adds changes to draft state
3. **Unsaved Changes**: Import sets `hasUnsavedChanges` flag
4. **Persistence**: User must click "Save Changes" to persist to database
5. **Discard**: Import changes can be discarded with "Discard Changes" button

## Error Handling

### Export Errors
- None (export always succeeds if modules exist)

### Import Errors
- **Empty File**: "CSV file is empty or invalid"
- **Invalid Format**: "Failed to parse CSV file. Please check the format."
- **Invalid Priority**: Warning toast with fallback to "Medium"

### User Feedback
- Success toast: "Exported X modules to CSV"
- Success toast: "Imported X modules with Y test cases"
- Error toast: Specific error messages for debugging

## Best Practices

### For Exporting
1. **Save First**: Save any pending changes before exporting to ensure data integrity
2. **Verify Data**: Review the downloaded CSV to confirm all data exported correctly
3. **Version Control**: Keep exported CSV files dated for backup purposes

### For Importing
1. **Backup First**: Export current data before importing to have a rollback option
2. **Review Preview**: Always review the import preview before confirming
3. **Test with Small Files**: Test import with a small CSV file first
4. **Check Encoding**: Ensure CSV file is UTF-8 encoded for emoji support
5. **Validate Priorities**: Double-check priority values (High/Medium/Low)

### For CSV Editing
1. **Use Proper Editor**: Use Excel, Google Sheets, or a text editor that preserves CSV format
2. **Preserve Headers**: Keep the exact header row format
3. **Quote Tags**: Always quote comma-separated tags (e.g., `"tag1,tag2"`)
4. **Escape Quotes**: Use double quotes to escape quotes in cell values (e.g., `"He said ""hello"""`)
5. **Consistent Module Data**: Keep module fields consistent across rows for the same module

## Troubleshooting

### Issue: Import preview shows wrong data
**Solution**: Check CSV format matches specification exactly, especially column order

### Issue: Tags not importing correctly
**Solution**: Ensure tags are comma-separated within quotes (e.g., `"auth,security"`)

### Issue: Emoji icons not displaying
**Solution**: Ensure CSV file is saved with UTF-8 encoding

### Issue: Priorities showing as "Medium" when they should be different
**Solution**: Priority values must be exactly "High", "Medium", or "Low" (case-sensitive)

### Issue: File won't upload
**Solution**: Ensure file has `.csv` extension and is a valid CSV format

## Future Enhancements

Potential improvements for future versions:
- **Append Mode**: Option to append test cases instead of replacing
- **Column Mapping**: Allow custom column order with mapping interface
- **Bulk Edit**: Edit multiple modules in Excel and re-import
- **Import History**: Track import operations with undo capability
- **Excel Support**: Direct support for .xlsx files
- **Template Download**: Provide template CSV for new users
- **Validation Preview**: Show validation errors before import
- **Partial Import**: Allow importing only selected modules from CSV

## Example Use Cases

### Use Case 1: Bulk Module Creation
Create 50 test modules with test cases in Excel, export to CSV, and import to quickly populate the library.

### Use Case 2: Data Migration
Export modules from a test environment, modify in Excel, and import to production.

### Use Case 3: Backup and Restore
Regularly export module data as CSV backups. Restore by importing the CSV file.

### Use Case 4: Collaborative Editing
Export CSV, share with team members for editing in Excel/Google Sheets, then import updated file.

### Use Case 5: Template Sharing
Export module templates and share with other QA teams for consistent test coverage.

## Related Files

- `/app/modules/page.tsx` - Main implementation
- `/shared/types/module.ts` - Type definitions
- `/sample_modules_import.csv` - Sample CSV file
- `/docs/CSV_IMPORT_EXPORT.md` - This documentation file
