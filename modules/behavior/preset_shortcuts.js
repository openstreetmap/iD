import { dispatch as d3_dispatch } from 'd3-dispatch';

import { presetManager } from '../presets';
import { presetShortcuts } from '../core/preset_shortcuts';
import { modeAddPoint, modeAddLine, modeAddArea, modeBrowse } from '../modes';
import { actionChangePreset } from '../actions';
import { utilRebind } from '../util';
import { t } from '../core/localizer';
import { uiPresetIcon } from '../ui/preset_icon';

/**
 * Preset Shortcuts Behavior
 *
 * Handles keyboard input for preset shortcuts, providing multi-digit number detection
 * with timeout handling. This behavior allows users to press number keys to activate
 * preset shortcuts quickly.
 *
 * Features:
 * - Multi-digit shortcut detection (e.g., pressing "2", "2" for shortcut 22)
 * - Fast timeout for single digits (150ms) with multi-digit override capability
 * - Smart timeout mechanism (500ms) to distinguish between single and multi-digit shortcuts
 * - Automatic buffer cleanup (800ms) to prevent infinite buffer growth
 * - Integration with existing drawing mode shortcuts (1-3 for point/line/area)
 * - Smart conflict resolution between built-in shortcuts and user shortcuts
 * - Supports both drawing new features and applying presets to selected entities
 *
 * Behavior:
 * - Numbers 1-3: Execute immediately (normal drawing modes) but can be cancelled by multi-digit shortcuts
 * - Numbers 8-999: User-defined preset shortcuts
 * - Single-digit shortcuts: Execute after 150ms (can be cancelled by additional digits)
 * - Multi-digit shortcuts: Execute after 500ms, can override single-digit actions
 * - Cancellation: Multi-digit shortcuts cancel previous single-digit actions seamlessly
 * - Buffer cleanup: Automatically cleared after 800ms to prevent infinite growth
 * - Ignores input when user is typing in form fields
 * - Respects modifier keys (Ctrl, Alt, etc.) for other shortcuts
 *
 * Usage:
 *   const behavior = behaviorPresetShortcuts(context)
 *     .on('shortcutUsed', function(preset, shortcut, action) { ... });
 *   behavior.on();
 *
 * Events:
 *   'shortcutUsed' - fired when a preset shortcut is successfully activated
 */

export function behaviorPresetShortcuts(context) {
    const dispatch = d3_dispatch('shortcutUsed');

    let _numberBuffer = '';
    let _numberTimeout = null;
    let _immediateTimeout = null;
    let _cleanupTimeout = null;
    let _executed = false; // Track if we've already executed for this buffer
    let _singleDigitExecuted = false; // Track if we executed a single digit action that can be cancelled
    let _waitDuration = 500; // ms to wait for additional digits (reasonable for human typing)
    let _immediateDelay = 150; // ms to wait before executing single-digit shortcuts
    let _cleanupDelay = 800; // ms to always clear buffer (prevents infinite growth)

    function behavior(selection) {
        selection
            .on('keydown.preset-shortcuts', keydown, true); // capture phase
    }

    function clearNumberBuffer() {
        _numberBuffer = '';
        _executed = false;
        _singleDigitExecuted = false;
        if (_numberTimeout) {
            clearTimeout(_numberTimeout);
            _numberTimeout = null;
        }
        if (_immediateTimeout) {
            clearTimeout(_immediateTimeout);
            _immediateTimeout = null;
        }
        if (_cleanupTimeout) {
            clearTimeout(_cleanupTimeout);
            _cleanupTimeout = null;
        }
    }

    function showPresetInSidebar(preset, shortcut, context_type) {
        const sidebar = context.ui().sidebar;

        // Create a preset information panel
        const presetInfoPanel = function (selection) {
            const presetName = preset.nameLabel();

            const wrap = selection.selectAll('.preset-shortcut-info')
                .data([0]);

            const enter = wrap.enter()
                .append('div')
                .attr('class', 'preset-shortcut-info');

            enter.append('h3')
                .text(context_type === 'drawing' ? 'Drawing with Preset' : 'Preset Applied');

            enter.append('div')
                .attr('class', 'preset-info-content');

            const merged = enter.merge(wrap);

            const content = merged.select('.preset-info-content');
            content.selectAll('*').remove();

            // Show preset icon if available
            content.append('div')
                .attr('class', 'preset-icon-display')
                .call(uiPresetIcon()
                    .geometry(preset.geometry[0])
                    .preset(preset)
                );

            content.append('div')
                .attr('class', 'preset-name-display')
                .call(function (selection) {
                    selection.text('Preset: ');
                    presetName(selection.append('span').attr('class', 'preset-name'));
                });

            if (context_type === 'drawing') {
                content.append('div')
                    .text('Start drawing to create a new feature');
            } else {
                content.append('div')
                    .text('Applied to selected features');
            }

            content.append('div')
                .text('Shortcut: ' + shortcut);

            // The panel will naturally be replaced when the user does other actions
            // No need for artificial timeouts
        };

        // Show the preset info panel
        sidebar.show(presetInfoPanel);
    }

    function executeShortcut(shortcut) {
        const presetId = presetShortcuts.getPreset(shortcut);
        if (!presetId) {
            return false;
        }

        const preset = presetManager.item(presetId);
        if (!preset || !preset.addable()) {
            return false;
        }

        // If we're in browse mode and no entities are selected, enter drawing mode
        const mode = context.mode();
        const selectedIDs = context.selectedIDs();

        // Handle both browse mode and drawing modes with no selection
        if ((mode.id === 'browse' || /^add-/.test(mode.id)) && !selectedIDs.length) {
            // Determine default geometry for this preset
            const geometries = preset.geometry;
            let drawingMode;

            if (geometries.includes('point')) {
                drawingMode = modeAddPoint(context, {
                    title: t.append('modes.add_point.title'),
                    button: 'point',
                    description: t.append('modes.add_point.description'),
                    preset: preset,
                    key: shortcut
                });
            } else if (geometries.includes('line')) {
                drawingMode = modeAddLine(context, {
                    title: t.append('modes.add_line.title'),
                    button: 'line',
                    description: t.append('modes.add_line.description'),
                    preset: preset,
                    key: shortcut
                });
            } else if (geometries.includes('area')) {
                drawingMode = modeAddArea(context, {
                    title: t.append('modes.add_area.title'),
                    button: 'area',
                    description: t.append('modes.add_area.description'),
                    preset: preset,
                    key: shortcut
                });
            } else {
                return false; // No supported geometry
            }

            context.enter(drawingMode);

            // Show preset information in the sidebar when starting to draw
            showPresetInSidebar(preset, shortcut, 'drawing');

            // Show notification with preset name and shortcut
            setTimeout(() => {
                try {
                    const presetName = preset.nameLabel();
                    context.ui().flash
                        .duration(3000)
                        .iconName('#iD-icon-apply')
                        .iconClass('success')
                        .label(function (selection) {
                            selection.text('');
                            selection.append('span').text('Drawing mode: ');
                            presetName(selection.append('span').attr('class', 'preset-name'));
                            selection.append('span').text(' (shortcut: ' + shortcut + ')');
                        })();
                } catch (error) {
                    console.error('Flash notification failed:', error);
                }
            }, 50);

            dispatch.call('shortcutUsed', this, preset, shortcut, 'draw');
            return true;
        }

        // If entities are selected, apply the preset to them
        const entityIDs = context.selectedIDs();

        if (entityIDs.length > 0) {
            // Check if any entities are compatible with this preset
            const graph = context.graph();
            let compatibleEntities = 0;

            for (let i = 0; i < entityIDs.length; i++) {
                const entityID = entityIDs[i];
                const entity = graph.entity(entityID);
                const entityGeometry = entity.geometry(graph);
                if (preset.geometry.includes(entityGeometry)) {
                    compatibleEntities++;
                }
            }

            // Only proceed if there are compatible entities
            if (compatibleEntities === 0) {
                // No compatible entities - don't change anything, don't show notifications
                return false;
            }

            context.perform(
                function (graph) {
                    for (let i = 0; i < entityIDs.length; i++) {
                        const entityID = entityIDs[i];
                        const entity = graph.entity(entityID);
                        const oldPreset = presetManager.match(entity, graph);

                        // Check if preset is applicable to this geometry
                        const entityGeometry = entity.geometry(graph);
                        if (preset.geometry.includes(entityGeometry)) {
                            graph = actionChangePreset(entityID, oldPreset, preset)(graph);
                        }
                    }
                    return graph;
                },
                t('operations.change_tags.annotation')
            );

            context.validator().validate();

            // Refresh the sidebar to show the updated entity with new preset
            const sidebar = context.ui().sidebar;

            // Check if entities still exist after preset application
            const finalGraph = context.graph();
            const validEntityIDs = entityIDs.filter(id => finalGraph.hasEntity(id));

            if (validEntityIDs.length > 0) {
                sidebar.select(validEntityIDs, false);

                // Ensure sidebar is expanded and visible
                if (sidebar.expand) {
                    sidebar.expand();
                }

                // Since we have valid entities, the normal inspector will show the preset form
                // No need for custom panel - the standard UI handles this case perfectly
            } else {
                // Only show custom panel if no valid entities (fallback case)
                showPresetInSidebar(preset, shortcut, 'applied');
            }

            // Show notification with preset name and shortcut for applied preset
            setTimeout(() => {
                try {
                    const presetName = preset.nameLabel();
                    const entityCount = entityIDs.length;
                    context.ui().flash
                        .duration(3000)
                        .iconName('#iD-icon-apply')
                        .iconClass('success')
                        .label(function (selection) {
                            selection.text('');
                            selection.append('span').text('Applied ');
                            presetName(selection.append('span').attr('class', 'preset-name'));
                            selection.append('span').text(' to ' + entityCount + ' feature' + (entityCount === 1 ? '' : 's'));
                            selection.append('span').text(' (shortcut: ' + shortcut + ')');
                        })();
                } catch (error) {
                    console.error('Flash notification failed:', error);
                }
            }, 50);

            dispatch.call('shortcutUsed', this, preset, shortcut, 'apply');
            return true;
        }

        return false;
    }

    function processNumberBuffer() {
        if (!_numberBuffer) {
            return false;
        }

        if (_executed) {
            clearNumberBuffer();
            return true;
        }

        const shortcut = _numberBuffer;
        clearNumberBuffer();

        // Check if this is a preset shortcut (8-999)
        const num = parseInt(shortcut, 10);
        if (num >= 8 && num <= 999) {
            if (executeShortcut(shortcut)) {
                return true;
            }
        }

        // If it's a single digit 1-3, handle as normal drawing mode
        if (shortcut.length === 1) {
            const digit = parseInt(shortcut, 10);
            if (digit >= 1 && digit <= 3) {
                // Manually trigger the drawing mode since we prevented default earlier
                const mode = context.mode();
                let targetMode;
                if (digit === 1) {
                    targetMode = modeAddPoint(context, {
                        title: t.append('modes.add_point.title'),
                        button: 'point',
                        description: t.append('modes.add_point.description'),
                        preset: presetManager.item('point'),
                        key: '1'
                    });
                } else if (digit === 2) {
                    targetMode = modeAddLine(context, {
                        title: t.append('modes.add_line.title'),
                        button: 'line',
                        description: t.append('modes.add_line.description'),
                        preset: presetManager.item('line'),
                        key: '2'
                    });
                } else if (digit === 3) {
                    targetMode = modeAddArea(context, {
                        title: t.append('modes.add_area.title'),
                        button: 'area',
                        description: t.append('modes.add_area.description'),
                        preset: presetManager.item('area'),
                        key: '3'
                    });
                }

                if (targetMode) {
                    if (mode.id === targetMode.id) {
                        context.enter(modeBrowse(context));
                    } else {
                        context.enter(targetMode);
                    }
                    return true;
                }
            }
        }

        return false;
    }

    function keydown(d3_event) {
        // Only handle number keys
        const key = d3_event.key;
        if (!/^[0-9]$/.test(key)) {
            return;
        }

        // Don't interfere if user is typing in an input field
        const target = d3_event.target || d3_event.srcElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            return;
        }

        // Don't interfere if modifier keys are pressed
        if (d3_event.ctrlKey || d3_event.metaKey || d3_event.altKey) {
            return;
        }

        const digit = key;

        // If this is not the first digit, we're building a multi-digit shortcut
        const wasEmpty = _numberBuffer === '';

        // Add digit to buffer
        _numberBuffer += digit;

        // Clear any existing timeouts and reset execution flag for new sequence
        if (_numberTimeout) {
            clearTimeout(_numberTimeout);
        }
        if (_immediateTimeout) {
            clearTimeout(_immediateTimeout);
        }
        if (_cleanupTimeout) {
            clearTimeout(_cleanupTimeout);
        }

        // Always set cleanup timeout to clear buffer after 800ms (prevents infinite growth)
        _cleanupTimeout = setTimeout(() => {
            clearNumberBuffer();
        }, _cleanupDelay);

        // If we're adding to an existing buffer, cancel any previous execution
        if (!wasEmpty) {
            _executed = false;
        }

        const allShortcuts = presetShortcuts.getAllShortcuts();
        const allShortcutKeys = Object.keys(allShortcuts);

        // Check if there's an exact match for current buffer
        const hasExactMatch = allShortcutKeys.includes(_numberBuffer);

        // Check if there are longer shortcuts starting with current buffer
        const hasLongerShortcuts = allShortcutKeys.some(shortcut =>
            shortcut.startsWith(_numberBuffer) && shortcut.length > _numberBuffer.length
        );



        // For single digits 1-3, handle special logic for drawing modes
        if (_numberBuffer.length === 1 && digit >= '1' && digit <= '3') {
            if (!hasExactMatch && !hasLongerShortcuts) {
                // No shortcuts use this digit, let normal handlers deal with it
                clearNumberBuffer();
                return;
            } else if (hasLongerShortcuts && !hasExactMatch) {
                // There are longer shortcuts starting with this digit, but no exact match
                // Wait to see if user is typing a multi-digit shortcut before executing drawing mode
                // Don't let the normal action happen immediately - prevent it and wait
                d3_event.preventDefault();
                d3_event.stopImmediatePropagation();
            }
        }

        // If we have an exact match, set up immediate execution
        if (hasExactMatch) {
            // For digits 1-3 with exact matches, we need to prevent the default drawing mode
            if (_numberBuffer.length === 1 && digit >= '1' && digit <= '3') {
                d3_event.preventDefault();
                d3_event.stopImmediatePropagation();
            }

            _immediateTimeout = setTimeout(() => {
                if (!_executed) {
                    const handled = executeShortcut(_numberBuffer);
                    if (handled) {
                        _executed = true;
                    }
                }
            }, _immediateDelay);
        }

        // Always set the longer timeout for multi-digit shortcuts
        if (hasLongerShortcuts || hasExactMatch) {
            _numberTimeout = setTimeout(() => {
                const handled = processNumberBuffer();
                if (handled) {
                    d3_event.preventDefault();
                    d3_event.stopImmediatePropagation();
                }
            }, _waitDuration);
        }

        // Handle multi-digit sequence detection and cancellation
        if (_numberBuffer.length > 1 && _singleDigitExecuted) {
            // We're building a multi-digit shortcut after a single digit was executed

            // Cancel the previous single-digit action by going back to browse mode
            context.enter(modeBrowse(context));
            _singleDigitExecuted = false;

            // Show brief notification that we're switching
            try {
                context.ui().flash
                    .duration(1500)
                    .iconName('#iD-icon-backward')
                    .iconClass('blue')
                    .label('Switching to shortcut: ' + _numberBuffer)();
            } catch (error) {
                console.error('Flash notification failed:', error);
            }
        }

        // For potential multi-digit shortcuts (8+ or actual multi-digit sequences), prevent default
        const bufferNum = parseInt(_numberBuffer, 10);
        if (bufferNum >= 8 || (_numberBuffer.length > 1)) {
            d3_event.preventDefault();
            d3_event.stopImmediatePropagation();
        }
    }



    // Allow configuring wait duration
    behavior.waitDuration = function (val) {
        if (!arguments.length) return _waitDuration;
        _waitDuration = val;
        return behavior;
    };

    return utilRebind(behavior, dispatch, 'on');
}