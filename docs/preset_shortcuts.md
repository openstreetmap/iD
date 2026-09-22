# Preset Shortcuts Feature

This document describes the preset shortcuts feature that allows users to create custom keyboard shortcuts for frequently used presets.

## Overview

The preset shortcuts feature enables users to assign number keys (8-999) to their favorite presets, allowing for rapid feature creation. When a preset has an assigned shortcut, users can simply press the number key(s) to either:

1. Enter drawing mode with that preset (if no features are selected)
2. Apply the preset to currently selected features

## User Interface

### Setting Shortcuts

1. **Select a preset**: When a preset is selected in the feature type section, an inline shortcut editor appears below the preset name
2. **View current shortcut**: The editor shows "Shortcut: none" or "Shortcut: [number]" if one is already set
3. **Edit shortcut**: Click the edit button (pencil icon) to open the inline editor
4. **Enter a number**: Type a number between 8 and 999 in the small input field
5. **Save or Cancel**: Click the checkmark to save, X to cancel, or trash icon to remove existing shortcut

### Using Shortcuts

Once a shortcut is set, users can:

- **Press the shortcut number**: Type the assigned number to activate the preset
- **Multi-digit shortcuts**: For shortcuts like "22" or "555", type the digits in sequence within 800ms
- **Single-digit shortcuts**: For shortcuts like "8" or "9", press once

### Removing Shortcuts

To remove an existing shortcut:
- Click the edit button to open the inline editor
- Click the trash icon to immediately remove the shortcut
- Alternatively, clear the input field and save to remove the shortcut

## Technical Implementation

### Architecture

The feature consists of three main components:

1. **Core Shortcuts Manager** (`modules/core/preset_shortcuts.js`)
   - Manages shortcut storage in localStorage
   - Handles validation and conflict resolution
   - Provides APIs for getting/setting shortcuts

2. **Keyboard Behavior** (`modules/behavior/preset_shortcuts.js`)
   - Captures number key presses
   - Implements multi-digit detection with timeout
   - Activates presets when shortcuts are pressed

3. **UI Integration** (`modules/ui/sections/feature_type.js`)
   - Adds inline shortcut editor to preset display
   - Handles inline editing with save/cancel/remove actions
   - Updates display based on shortcut status

### Data Storage

Shortcuts are stored in localStorage under the key `preset_shortcuts` as a JSON object:

```json
{
  "8": "amenity/restaurant",
  "22": "highway/footway", 
  "555": "amenity/parking"
}
```

### Keyboard Handling

The keyboard behavior uses a buffering system with timeout:

1. **Number pressed**: Added to buffer, timeout started (800ms)
2. **Additional numbers**: Reset timeout, continue buffering
3. **Timeout reached**: Process buffer as complete shortcut
4. **Non-number key**: Clear buffer

This allows for both single-digit (8, 9) and multi-digit (22, 555) shortcuts.

### Conflict Resolution

- **Range conflicts**: Only numbers 8-999 are allowed (1-7 reserved for drawing modes)
- **Duplicate shortcuts**: When assigning a shortcut already in use, the previous assignment is removed
- **Validation**: Real-time feedback prevents invalid inputs

## Integration Points

### Existing Systems

The feature integrates with several existing iD systems:

- **Preset Manager**: Uses existing preset lookup and validation
- **Drawing Modes**: Leverages existing point/line/area drawing modes
- **Action System**: Uses existing `actionChangePreset` for applying presets
- **Localization**: All user-facing text supports translation
- **Storage**: Uses existing preferences system for persistence

### UI Components

- **Modal System**: Uses existing modal framework
- **Tooltips**: Uses existing tooltip system
- **Icons**: Uses existing SVG icon system
- **CSS**: Follows existing styling patterns

## Configuration

### Wait Duration

The timeout for multi-digit shortcuts can be configured:

```javascript
ui.presetShortcuts.waitDuration(1000); // Set to 1 second
```

### Shortcut Range

The valid shortcut range is hardcoded to 8-999 to avoid conflicts with:
- Numbers 1-3: Reserved for drawing modes (point, line, area)
- Numbers 4-7: Reserved for potential future drawing modes

## Error Handling

### Validation Errors

- **Out of range**: Numbers below 8 or above 999 are rejected
- **Invalid format**: Non-numeric input is rejected
- **Conflicts**: Users are warned when shortcuts conflict

### Runtime Errors

- **Storage failures**: Gracefully handled if localStorage is unavailable
- **Preset not found**: Silently ignored if preset ID is invalid
- **Invalid geometry**: Preset application skipped if geometry doesn't match

## Accessibility

- **Keyboard navigation**: Full dialog navigation with Tab/Enter/Escape
- **Screen readers**: Proper labeling and ARIA attributes
- **Visual feedback**: Clear validation messages and states
- **Focus management**: Automatic focus to input field

## Performance Considerations

- **Lazy loading**: Shortcuts loaded only when first accessed
- **Event efficiency**: Keyboard handler uses capture phase for performance
- **Memory usage**: Minimal overhead with efficient data structures
- **Storage optimization**: Compact JSON storage format

## Browser Compatibility

- **localStorage**: Required for shortcut persistence
- **Keyboard events**: Standard event handling, works in all modern browsers
- **CSS**: Uses standard properties with vendor prefixes where needed

## Future Enhancements

Potential improvements for future versions:

1. **Import/Export**: Allow users to backup and share shortcut configurations
2. **Visual indicators**: Show shortcut numbers on preset icons
3. **Search integration**: Include shortcuts in preset search results
4. **Conflict warnings**: Proactive warnings when setting conflicting shortcuts
5. **Custom ranges**: Allow administrators to configure valid shortcut ranges