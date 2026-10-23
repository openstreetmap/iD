import { t } from '../core/localizer';
import { presetShortcuts } from '../core/preset_shortcuts';
import { presetManager } from '../presets';
import { svgIcon } from '../svg/icon';

/**
 * Reusable shortcut editor component
 * Creates an input field with validation, error handling, and action buttons
 * for editing preset shortcuts consistently across the application.
 */
export function uiShortcutEditor() {
    let _preset;
    let _currentShortcut;
    let _onSave;
    let _onCancel;
    let _onRemove;

    function shortcutEditor(selection) {

        // Get current shortcut for this preset
        _currentShortcut = presetShortcuts.getShortcut(_preset.id);

        // Create main container
        const editorContainer = selection
            .append('div')
            .attr('class', 'shortcut-editor-container');

        // Input section
        const inputSection = editorContainer
            .append('div')
            .attr('class', 'shortcut-input-section');

        inputSection
            .append('label')
            .attr('class', 'shortcut-label')
            .text(t('preset_shortcut.shortcut_label'));

        const shortcutInput = inputSection
            .append('input')
            .attr('type', 'text')
            .attr('class', 'shortcut-input')
            .attr('placeholder', t('preset_shortcut.shortcut_placeholder'))
            .attr('maxlength', '3')
            .attr('size', '3')
            .property('value', _currentShortcut || '');

        // Error message container
        const errorContainer = editorContainer
            .append('div')
            .attr('class', 'shortcut-error')
            .style('display', 'none');

        // Buttons section
        const buttonSection = editorContainer
            .append('div')
            .attr('class', 'shortcut-buttons');

        // Save button (green with checkmark)
        buttonSection
            .append('button')
            .attr('class', 'shortcut-save-btn')
            .attr('title', t('preset_shortcut.save'))
            .call(svgIcon('#iD-icon-apply'))
            .on('click', handleSave);

        // Cancel button (grey with text)
        buttonSection
            .append('button')
            .attr('class', 'shortcut-cancel-btn')
            .text(t('confirm.cancel'))
            .on('click', handleCancel);

        // Remove button (red with X - only if shortcut exists)
        if (_currentShortcut) {
            buttonSection
                .append('button')
                .attr('class', 'shortcut-remove-btn')
                .attr('title', t('preset_shortcut.remove'))
                .call(svgIcon('#iD-icon-close'))
                .on('click', handleRemove);
        }

        // Focus and select input
        shortcutInput.node().focus();
        if (_currentShortcut) {
            shortcutInput.node().select();
        }

        // Keyboard event handlers
        shortcutInput.on('keydown', function(d3_event) {
            if (d3_event.key === 'Enter') {
                d3_event.preventDefault();
                handleSave();
            } else if (d3_event.key === 'Escape') {
                d3_event.preventDefault();
                handleCancel();
            }
        });

        // Validation and save logic
        function handleSave() {
            const value = shortcutInput.property('value').trim();

            // Clear previous errors
            errorContainer.style('display', 'none');

            // Validate empty input
            if (!value) {
                showError(t('preset_shortcut.error_empty'));
                return;
            }

            // Validate range
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 8 || num > 999) {
                showError(t('preset_shortcut.error_invalid_range'));
                return;
            }

            // Check for conflicts
            const existingPreset = presetShortcuts.getPreset(value);
            if (existingPreset && existingPreset !== _preset.id) {
                const conflictPreset = presetManager.item(existingPreset);
                const conflictName = conflictPreset ? conflictPreset.name() : existingPreset;
                showError(t('preset_shortcut.error_conflict', { shortcut: value, preset: conflictName }));
                return;
            }

            // Save the shortcut
            presetShortcuts.setShortcut(_preset.id, value);

            // Call save callback
            if (_onSave) {
                _onSave(value);
            }
        }

        function handleCancel() {
            if (_onCancel) {
                _onCancel();
            }
        }

        function handleRemove() {
            presetShortcuts.removeShortcut(_preset.id);

            if (_onRemove) {
                _onRemove();
            }
        }

        function showError(message) {
            errorContainer
                .text(message)
                .style('display', 'block');
            shortcutInput.node().focus();
        }

        // Return editor API for external control
        return {
            focus: function() {
                shortcutInput.node().focus();
                return this;
            },
            value: function(val) {
                if (!arguments.length) return shortcutInput.property('value');
                shortcutInput.property('value', val);
                return this;
            },
            clearError: function() {
                errorContainer.style('display', 'none');
                return this;
            }
        };
    }

    // Setter methods
    shortcutEditor.preset = function(val) {
        if (!arguments.length) return _preset;
        _preset = val;
        return shortcutEditor;
    };

    shortcutEditor.onSave = function(callback) {
        _onSave = callback;
        return shortcutEditor;
    };

    shortcutEditor.onCancel = function(callback) {
        _onCancel = callback;
        return shortcutEditor;
    };

    shortcutEditor.onRemove = function(callback) {
        _onRemove = callback;
        return shortcutEditor;
    };

    return shortcutEditor;
}
