import { t, localizer } from '../../core/localizer';
import { geoSphericalDistance, geoVecNormalizedDot } from '../../geo';
import { uiCmd } from '../cmd';

export function pointBox(loc, context) {
    var rect = context.surfaceRect();
    var point = context.curtainProjection(loc);
    return {
        left: point[0] + rect.left - 40,
        top: point[1] + rect.top - 60,
        width: 80,
        height: 90
    };
}


export function pad(locOrBox, padding, context) {
    var box;
    if (locOrBox instanceof Array) {
        var rect = context.surfaceRect();
        var point = context.curtainProjection(locOrBox);
        box = {
            left: point[0] + rect.left,
            top: point[1] + rect.top
        };
    } else {
        box = locOrBox;
    }

    return {
        left: box.left - padding,
        top: box.top - padding,
        width: (box.width || 0) + 2 * padding,
        height: (box.width || 0) + 2 * padding
    };
}


export function icon(name, svgklass, useklass) {
    return '<svg class="icon ' + (svgklass || '') + '">' +
         '<use xlink:href="' + name + '"' +
         (useklass ? ' class="' + useklass + '"' : '') + '></use></svg>';
}

var helpStringReplacements;

// Returns the localized string for `id` with a standardized set of icon, key, and
// label replacements suitable for tutorials and documentation. Optionally supplemented
// with custom `replacements`
export function helpString(id, replacements) {
    // only load these the first time
    if (!helpStringReplacements) helpStringReplacements = {
        // insert icons corresponding to various UI elements
        point_icon: icon('#iD-icon-point', 'pre-text'),
        line_icon: icon('#iD-icon-line', 'pre-text'),
        area_icon: icon('#iD-icon-area', 'pre-text'),
        note_icon: icon('#iD-icon-note', 'pre-text add-note'),
        plus: icon('#iD-icon-plus', 'pre-text'),
        minus: icon('#iD-icon-minus', 'pre-text'),
        move_icon: icon('#iD-operation-move', 'pre-text operation'),
        merge_icon: icon('#iD-operation-merge', 'pre-text operation'),
        delete_icon: icon('#iD-operation-delete', 'pre-text operation'),
        circularize_icon: icon('#iD-operation-circularize', 'pre-text operation'),
        split_icon: icon('#iD-operation-split', 'pre-text operation'),
        orthogonalize_icon: icon('#iD-operation-orthogonalize', 'pre-text operation'),
        disconnect_icon: icon('#iD-operation-disconnect', 'pre-text operation'),
        layers_icon: icon('#iD-icon-layers', 'pre-text'),
        data_icon: icon('#iD-icon-data', 'pre-text'),
        inspect: icon('#iD-icon-inspect', 'pre-text'),
        help_icon: icon('#iD-icon-help', 'pre-text'),
        undo_icon: icon(localizer.textDirection() === 'rtl' ? '#iD-icon-redo' : '#iD-icon-undo', 'pre-text'),
        redo_icon: icon(localizer.textDirection() === 'rtl' ? '#iD-icon-undo' : '#iD-icon-redo', 'pre-text'),
        save_icon: icon('#iD-icon-save', 'pre-text'),
        leftclick: icon('#iD-walkthrough-mouse-left', 'pre-text operation'),
        rightclick: icon('#iD-walkthrough-mouse-right', 'pre-text operation'),
        mousewheel_icon: icon('#iD-walkthrough-mousewheel', 'pre-text operation'),
        tap_icon: icon('#iD-walkthrough-tap', 'pre-text operation'),
        doubletap_icon: icon('#iD-walkthrough-doubletap', 'pre-text operation'),
        longpress_icon: icon('#iD-walkthrough-longpress', 'pre-text operation'),
        touchdrag_icon: icon('#iD-walkthrough-touchdrag', 'pre-text operation'),
        pinch_icon: icon('#iD-walkthrough-pinch-apart', 'pre-text operation'),

        // insert keys; may be localized and platform-dependent
        shift: uiCmd.display('⇧'),
        alt: uiCmd.display('⌥'),
        return: uiCmd.display('↵'),
        esc: t('shortcuts.key.esc'),
        space: t('shortcuts.key.space'),
        add_note_key: t('modes.add_note.key'),
        help_key: t('help.key'),
        shortcuts_key: t('shortcuts.toggle.key'),

        // reference localized UI labels directly so that they'll always match
        save: t('save.title'),
        undo: t('undo.title'),
        redo: t('redo.title'),
        upload: t('commit.save'),
        point: t('modes.add_point.title'),
        line: t('modes.add_line.title'),
        area: t('modes.add_area.title'),
        note: t('modes.add_note.label'),
        delete: t('operations.delete.title'),
        move: t('operations.move.title'),
        orthogonalize: t('operations.orthogonalize.title'),
        circularize: t('operations.circularize.title'),
        merge: t('operations.merge.title'),
        disconnect: t('operations.disconnect.title'),
        split: t('operations.split.title'),
        map_data: t('map_data.title'),
        osm_notes: t('map_data.layers.notes.title'),
        fields: t('inspector.fields'),
        tags: t('inspector.tags'),
        relations: t('inspector.relations'),
        new_relation: t('inspector.new_relation'),
        turn_restrictions: t('presets.fields.restrictions.label'),
        background_settings: t('background.description'),
        imagery_offset: t('background.fix_misalignment'),
        start_the_walkthrough: t('splash.walkthrough'),
        help: t('help.title'),
        ok: t('intro.ok')
    };

    var reps;
    if (replacements) {
        reps = Object.assign(replacements, helpStringReplacements);
    } else {
        reps = helpStringReplacements;
    }

    return t(id, reps)
         // use keyboard key styling for shortcuts
        .replace(/\`(.*?)\`/g, '<kbd>$1</kbd>');
}


function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}


// console warning for missing walkthrough names
export var missingStrings = {};
function checkKey(key, text) {
    if (t(key, { default: undefined}) === undefined) {
        if (missingStrings.hasOwnProperty(key)) return;  // warn once
        missingStrings[key] = text;
        var missing = key + ': ' + text;
        if (typeof console !== 'undefined') console.log(missing); // eslint-disable-line
    }
}


export function localize(obj) {
    var key;

    // Assign name if entity has one..
    var name = obj.tags && obj.tags.name;
    if (name) {
        key = 'intro.graph.name.' + slugify(name);
        obj.tags.name = t(key, { default: name });
        checkKey(key, name);
    }

    // Assign street name if entity has one..
    var street = obj.tags && obj.tags['addr:street'];
    if (street) {
        key = 'intro.graph.name.' + slugify(street);
        obj.tags['addr:street'] = t(key, { default: street });
        checkKey(key, street);

        // Add address details common across walkthrough..
        var addrTags = [
            'block_number', 'city', 'county', 'district', 'hamlet', 'neighbourhood',
            'postcode', 'province', 'quarter', 'state', 'subdistrict', 'suburb'
        ];
        addrTags.forEach(function(k) {
            var key = 'intro.graph.' + k;
            var tag = 'addr:' + k;
            var val = obj.tags && obj.tags[tag];
            var str = t(key, { default: val });

            if (str) {
                if (str.match(/^<.*>$/) !== null) {
                    delete obj.tags[tag];
                } else {
                    obj.tags[tag] = str;
                }
            }
        });
    }

    return obj;
}


// Used to detect squareness.. some duplicataion of code from actionOrthogonalize.
export function isMostlySquare(points) {
    // note: uses 15 here instead of the 12 from actionOrthogonalize because
    // actionOrthogonalize can actually straighten some larger angles as it iterates
    var threshold = 15; // degrees within right or straight
    var lowerBound = Math.cos((90 - threshold) * Math.PI / 180);  // near right
    var upperBound = Math.cos(threshold * Math.PI / 180);         // near straight

    for (var i = 0; i < points.length; i++) {
        var a = points[(i - 1 + points.length) % points.length];
        var origin = points[i];
        var b = points[(i + 1) % points.length];

        var dotp = geoVecNormalizedDot(a, b, origin);
        var mag = Math.abs(dotp);
        if (mag > lowerBound && mag < upperBound) {
            return false;
        }
    }

    return true;
}


export function selectMenuItem(context, operation) {
    return context.container().select('.edit-menu .edit-menu-item-' + operation);
}


export function transitionTime(point1, point2) {
    var distance = geoSphericalDistance(point1, point2);
    if (distance === 0)
        return 0;
    else if (distance < 80)
        return 500;
    else
        return 1000;
}
