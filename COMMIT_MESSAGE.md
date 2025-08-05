fix: preserve spaces in free-text fields like 'note', 'textarea', and 'localized'

- Modified field input handling to only apply cleanTagValue to fields that need it
- Free-text fields (text, textarea, localized) now preserve leading/trailing spaces
- Comma-separated fields (combo, multiCombo, etc.) still get proper cleaning
- Added comprehensive tests to verify the fix
- All existing functionality maintained with no regressions

Fixes #11276 