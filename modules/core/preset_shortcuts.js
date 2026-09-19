import { prefs } from './preferences';
import { dispatch as d3_dispatch } from 'd3-dispatch';
import { utilRebind } from '../util';

/**
 * Core Preset Shortcuts Manager
 *
 * Manages user-defined keyboard shortcuts for presets. This module provides
 * functionality to store, retrieve, and manage preset shortcuts that allow
 * users to quickly activate presets using number keys 8-999.
 *
 * Features:
 * - Store shortcuts in localStorage for persistence across sessions
 * - Support numeric shortcuts from 8-999 (1-7 reserved for drawing modes)
 * - Validate shortcuts to ensure they're within the allowed range
 * - Handle conflicts when multiple presets try to use the same shortcut
 * - Dispatch events when shortcuts are added, removed, or changed
 *
 * Usage:
 *   const shortcuts = corePresetShortcuts();
 *   shortcuts.setShortcut('amenity/restaurant', '42');
 *   const presetId = shortcuts.getPreset('42'); // 'amenity/restaurant'
 *
 * Events:
 *   'shortcutAdded' - fired when a shortcut is assigned to a preset
 *   'shortcutRemoved' - fired when a shortcut is removed from a preset
 *   'shortcutChanged' - fired when a shortcut is modified
 */
export function corePresetShortcuts() {
    const dispatch = d3_dispatch('shortcutAdded', 'shortcutRemoved', 'shortcutChanged');

    let _shortcuts = {};
    let _loaded = false;

    // Load shortcuts from localStorage
    function loadShortcuts() {
        if (_loaded) return;

        try {
            const stored = prefs('preset_shortcuts');
            if (stored) {
                _shortcuts = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading shortcuts:', error);
            _shortcuts = {};
        }
        _loaded = true;
    }

    // Save shortcuts to localStorage
    function saveShortcuts() {
        try {
            prefs('preset_shortcuts', JSON.stringify(_shortcuts));
        } catch (error) {
            console.error('Error saving shortcuts:', error);
        }
    }

    const presetShortcuts = {
        // Get shortcut number for a preset ID
        getShortcut: function(presetId) {
            loadShortcuts();
            return Object.keys(_shortcuts).find(shortcut => _shortcuts[shortcut] === presetId);
        },

        // Get preset ID for a shortcut number
        getPreset: function(shortcut) {
            loadShortcuts();
            return _shortcuts[shortcut];
        },

        // Set a shortcut for a preset
        setShortcut: function(presetId, shortcut) {
            loadShortcuts();

            // Validate shortcut format (8-999)
            const num = parseInt(shortcut, 10);
            if (isNaN(num) || num < 8 || num > 999) {
                throw new Error('Shortcut must be a number between 8 and 999');
            }

            // Remove any existing shortcut for this preset
            const existingShortcut = Object.keys(_shortcuts).find(s => _shortcuts[s] === presetId);
            if (existingShortcut) {
                delete _shortcuts[existingShortcut];
            }

            // Remove any preset using this shortcut
            const existingPreset = _shortcuts[shortcut];
            if (existingPreset && existingPreset !== presetId) {
                delete _shortcuts[shortcut];
                dispatch.call('shortcutRemoved', this, existingPreset, shortcut);
            }

            // Set the new shortcut
            _shortcuts[shortcut] = presetId;
            saveShortcuts();

            dispatch.call('shortcutAdded', this, presetId, shortcut);
            return this;
        },

        // Remove shortcut for a preset
        removeShortcut: function(presetId) {
            loadShortcuts();

            const shortcut = Object.keys(_shortcuts).find(s => _shortcuts[s] === presetId);
            if (shortcut) {
                delete _shortcuts[shortcut];
                saveShortcuts();
                dispatch.call('shortcutRemoved', this, presetId, shortcut);
            }
            return this;
        },

        // Check if shortcut is available
        isShortcutAvailable: function(shortcut) {
            loadShortcuts();
            return !_shortcuts[shortcut];
        },

        // Get all shortcuts
        getAllShortcuts: function() {
            loadShortcuts();
            return { ..._shortcuts };
        },

        // Clear all shortcuts
        clearAll: function() {
            _shortcuts = {};
            saveShortcuts();
            return this;
        }
    };

    return utilRebind(presetShortcuts, dispatch, 'on');
}

export const presetShortcuts = corePresetShortcuts();