import {
    select as d3_select
} from 'd3-selection';

import { utilArrayUniq } from './array';


export function utilKeybinding(namespace) {
    var _keybindings = {};


    function testBindings(d3_event, isCapturing) {
        var didMatch = false;
        var bindings = Object.keys(_keybindings).map(function(id) { return _keybindings[id]; });

        // Most key shortcuts will accept either lower or uppercase ('h' or 'H'),
        // so we don't strictly match on the shift key, but we prioritize
        // shifted keybindings first, and fallback to unshifted only if no match.
        // (This lets us differentiate between '←'/'⇧←' or '⌘Z'/'⌘⇧Z')

        // priority match shifted keybindings first
        for (const binding of bindings) {
            if (!binding.event.modifiers.shiftKey) continue;  // no shift
            if (!!binding.capture !== isCapturing) continue;
            if (matches(d3_event, binding, true)) {
                binding.callback(d3_event);
                didMatch = true;

                // match a max of one binding per event
                break;
            }
        }

        if (didMatch) return;

        // then unshifted keybindings
        for (const binding of bindings) {
            if (binding.event.modifiers.shiftKey) continue;   // shift
            if (!!binding.capture !== isCapturing) continue;
            if (matches(d3_event, binding, false)) {
                binding.callback(d3_event);
                break;
            }
        }


        function matches(d3_event, binding, testShift) {
            var event = d3_event;
            var isMatch = false;
            var tryKeyCode = true;

            // Prefer a match on `KeyboardEvent.key`
            if (event.key !== undefined) {
                tryKeyCode = (event.key.charCodeAt(0) > 127);  // outside ISO-Latin-1
                isMatch = true;

                if (binding.event.key === undefined) {
                    isMatch = false;
                } else if (Array.isArray(binding.event.key)) {
                    if (binding.event.key.map(function(s) {
                        return s.toLowerCase();
                    }).indexOf(event.key.toLowerCase()) === -1) {
                        isMatch = false;
                    }
                } else {
                    if (event.key.toLowerCase() !== binding.event.key.toLowerCase()) {
                        isMatch = false;
                    }
                }
            }

            // Fallback match on `KeyboardEvent.keyCode`, can happen if:
            // - `KeyboardEvent.key` is outside ASCII range (e.g. cyrillic - #  )
            // - alt/option/⌥ key is also requested (e.g. Spanish keyboard on MacOS - #8905)
            if (!isMatch && (tryKeyCode || binding.event.modifiers.altKey)) {
                isMatch = (event.keyCode === binding.event.keyCode);
            }

            if (!isMatch) return false;

            // test modifier keys
            if (!(event.ctrlKey && event.altKey)) {  // if both are set, assume AltGr and skip it - #4096
                if (event.ctrlKey !== binding.event.modifiers.ctrlKey) return false;
                if (event.altKey !== binding.event.modifiers.altKey) return false;
            }
            if (event.metaKey !== binding.event.modifiers.metaKey) return false;
            if (testShift && event.shiftKey !== binding.event.modifiers.shiftKey) return false;

            return true;
        }
    }


    function capture(d3_event) {
        testBindings(d3_event, true);
    }


    function bubble(d3_event) {
        var tagName = d3_select(d3_event.target).node().tagName;
        if (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA') {
            return;
        }
        testBindings(d3_event, false);
    }


    function keybinding(selection) {
        selection = selection || d3_select(document);
        selection.on('keydown.capture.' + namespace, capture, true);
        selection.on('keydown.bubble.' + namespace, bubble, false);
        return keybinding;
    }

    // was: keybinding.off()
    keybinding.unbind = function(selection) {
        _keybindings = [];
        selection = selection || d3_select(document);
        selection.on('keydown.capture.' + namespace, null);
        selection.on('keydown.bubble.' + namespace, null);
        return keybinding;
    };


    keybinding.clear = function() {
        _keybindings = {};
        return keybinding;
    };


    // Remove one or more keycode bindings.
    keybinding.off = function(codes, capture) {
        var arr = utilArrayUniq([].concat(codes));

        for (var i = 0; i < arr.length; i++) {
            var id = arr[i] + (capture ? '-capture' : '-bubble');
            delete _keybindings[id];
        }
        return keybinding;
    };


    // Add one or more keycode bindings.
    keybinding.on = function(codes, callback, capture) {
        if (typeof callback !== 'function') {
            return keybinding.off(codes, capture);
        }

        var arr = utilArrayUniq([].concat(codes));

        for (var i = 0; i < arr.length; i++) {
            var id = arr[i] + (capture ? '-capture' : '-bubble');
            var binding = {
                id: id,
                capture: capture,
                callback: callback,
                event: {
                    key: undefined,  // preferred
                    keyCode: 0,      // fallback
                    modifiers: {
                        shiftKey: false,
                        ctrlKey: false,
                        altKey: false,
                        metaKey: false
                    }
                }
            };

            if (_keybindings[id]) {
                console.warn('warning: duplicate keybinding for "' + id + '"'); // eslint-disable-line no-console
            }

            _keybindings[id] = binding;

            var matches = arr[i].toLowerCase().match(/(?:(?:[^+⇧⌃⌥⌘])+|[⇧⌃⌥⌘]|\+\+|^\+$)/g);
            for (var j = 0; j < matches.length; j++) {
                // Normalise matching errors
                if (matches[j] === '++') matches[j] = '+';

                if (matches[j] in utilKeybinding.modifierCodes) {
                    var prop = utilKeybinding.modifierProperties[utilKeybinding.modifierCodes[matches[j]]];
                    binding.event.modifiers[prop] = true;
                } else {
                    binding.event.key = utilKeybinding.keys[matches[j]] || matches[j];
                    if (matches[j] in utilKeybinding.keyCodes) {
                        binding.event.keyCode = utilKeybinding.keyCodes[matches[j]];
                    }
                }
            }
        }

        return keybinding;
    };


    return keybinding;
}


/*
 * See https://github.com/keithamus/jwerty
 */

utilKeybinding.modifierCodes = {
    // Shift key, ⇧
    '⇧': 16, shift: 16,
    // CTRL key, on Mac: ⌃
    '⌃': 17, ctrl: 17,
    // ALT key, on Mac: ⌥ (Alt)
    '⌥': 18, alt: 18, option: 18,
    // META, on Mac: ⌘ (CMD), on Windows (Win), on Linux (Super)
    '⌘': 91, meta: 91, cmd: 91, 'super': 91, win: 91
};

utilKeybinding.modifierProperties = {
    16: 'shiftKey',
    17: 'ctrlKey',
    18: 'altKey',
    91: 'metaKey'
};

utilKeybinding.plusKeys = ['plus', 'ffplus', '=', 'ffequals', '≠', '±'];
utilKeybinding.minusKeys = ['_', '-', 'ffminus', 'dash', '–', '—'];

utilKeybinding.keys = (() => {
    const k = {};
    // Backspace key, on Mac: ⌫ (Backspace)
    k['⌫'] = k.backspace = 'Backspace';
    // Tab Key, on Mac: ⇥ (Tab), on Windows ⇥⇥
    k['⇥'] = k['⇆'] = k.tab = 'Tab';
    // Return key, ↩
    k['↩'] = k['↵'] = k['⏎'] = k.return = k.enter = k['⌅'] = 'Enter';
    // Pause/Break key
    k.pause = k['pause-break'] = 'Pause';
    // Caps Lock key, ⇪
    k['⇪'] = k.caps = k['caps-lock'] = 'CapsLock';
    // Escape key, on Mac: ⎋, on Windows: Esc
    k['⎋'] = k.escape = k.esc = ['Escape', 'Esc'];
    // Space key
    k.space = [' ', 'Spacebar'];
    // Page-Up key, or pgup, on Mac: ↖
    k['↖'] = k.pgup = k['page-up'] = 'PageUp';
    // Page-Down key, or pgdown, on Mac: ↘
    k['↘'] = k.pgdown = k['page-down'] = 'PageDown';
    // END key, on Mac: ⇟
    k['⇟'] = k.end = 'End';
    // HOME key, on Mac: ⇞
    k['⇞'] = k.home = 'Home';
    // Insert key, or ins
    k.ins = k.insert = 'Insert';
    // Delete key, on Mac: ⌦ (Delete)
    k['⌦'] = k.del = k.delete = ['Delete', 'Del'];
    // Left Arrow Key, or ←
    k['←'] = k.left = k['arrow-left'] = ['ArrowLeft', 'Left'];
    // Up Arrow Key, or ↑
    k['↑'] = k.up = k['arrow-up'] = ['ArrowUp', 'Up'];
    // Right Arrow Key, or →
    k['→'] = k.right = k['arrow-right'] = ['ArrowRight', 'Right'];
    // Down Arrow Key, or ↓
    k['↓'] = k.down = k['arrow-down'] = ['ArrowDown', 'Down'];
    // oddities, stuff for backward compatibility (browsers and code):
    // Num-Multiply, or *
    k['*'] = k.star = k.asterisk = k.multiply = ['*', 'Multiply'];
    // Num-Plus or +
    k['+'] = k.plus = ['+', 'Add'];
    // Num-Subtract, or -
    k['-'] = k.subtract = k.dash = ['-', 'Subtract'];
    // Semicolon
    k.semicolon = ';';
    // = or equals
    k.equals = '=';
    // Comma, or ,
    k.comma = ',';
    // Period, or ., or full-stop
    k.period = k['full-stop'] = '.';
    // Slash, or /, or forward-slash
    k.slash = k['forward-slash'] = '/';
    // Tick, or `, or back-quote
    k.tick = k['back-quote'] = '`';
    // Open bracket, or [
    k['open-bracket'] = '[';
    // Back slash, or \
    k['back-slash'] = '\\';
    // Close bracket, or ]
    k['close-bracket'] = ']';
    // Apostrophe, or Quote, or '
    k.quote = k.apostrophe = '\'';
    // NUMPAD 0-9
    for (let i = 0; i <= 9; i++) k[`num-${i}`] = `${i}`;
    // F1-F25
    for (let i = 1; i <= 25; i++) k[`f${i}`] = `F${i}`;

    return k;
})();

utilKeybinding.keyCodes = (() => {
    const c = {};
    // Backspace key, on Mac: ⌫ (Backspace)
    c['⌫'] = c.backspace = 8;
    // Tab Key, on Mac: ⇥ (Tab), on Windows ⇥⇥
    c['⇥'] = c['⇆'] = c.tab = 9;
    // Return key, ↩
    c['↩'] = c['↵'] = c['⏎'] = c.return = c.enter = c['⌅'] = 13;
    // Pause/Break key
    c.pause = c['pause-break'] = 19;
    // Caps Lock key, ⇪
    c['⇪'] = c.caps = c['caps-lock'] = 20;
    // Escape key, on Mac: ⎋, on Windows: Esc
    c['⎋'] = c.escape = c.esc = 27;
    // Space key
    c.space = 32;
    // Page-Up key, or pgup, on Mac: ↖
    c['↖'] = c.pgup = c['page-up'] = 33;
    // Page-Down key, or pgdown, on Mac: ↘
    c['↘'] = c.pgdown = c['page-down'] = 34;
    // END key, on Mac: ⇟
    c['⇟'] = c.end = 35;
    // HOME key, on Mac: ⇞
    c['⇞'] = c.home = 36;
    // Insert key, or ins
    c.ins = c.insert = 45;
    // Delete key, on Mac: ⌦ (Delete)
    c['⌦'] = c.del = c.delete = 46;
    // Left Arrow Key, or ←
    c['←'] = c.left = c['arrow-left'] = 37;
    // Up Arrow Key, or ↑
    c['↑'] = c.up = c['arrow-up'] = 38;
    // Right Arrow Key, or →
    c['→'] = c.right = c['arrow-right'] = 39;
    // Down Arrow Key, or ↓
    c['↓'] = c.down = c['arrow-down'] = 40;
    // oddities, printing characters that come out wrong:
    // Firefox Equals
    c.ffequals = 61;
    // Num-Multiply, or *
    c['*'] = c.star = c.asterisk = c.multiply = 106;
    // Num-Plus or +
    c['+'] = c.plus = 107;
    // Num-Subtract, or -
    c['-'] = c.subtract = 109;
    // Vertical Bar / Pipe
    c['|'] = 124;
    // Firefox Plus
    c.ffplus = 171;
    // Firefox Minus
    c.ffminus = 173;
    // Semicolon
    c[';'] = c.semicolon = 186;
    // = or equals
    c['='] = c.equals = 187;
    // Comma, or ,
    c[','] = c.comma = 188;
    // Dash / Underscore key
    c.dash = 189;
    // Period, or ., or full-stop
    c['.'] = c.period = c['full-stop'] = 190;
    // Slash, or /, or forward-slash
    c['/'] = c.slash = c['forward-slash'] = 191;
    // Tick, or `, or back-quote
    c['`'] = c.tick = c['back-quote'] = 192;
    // Open bracket, or [
    c['['] = c['open-bracket'] = 219;
    // Back slash, or \
    c['\\'] = c['back-slash'] = 220;
    // Close bracket, or ]
    c[']'] = c['close-bracket'] = 221;
    // Apostrophe, or Quote, or '
    c['\''] = c.quote = c.apostrophe = 222;
    // NUMPAD 0-9
    for (let n = 0; n <= 9; n++) c[`num-${n}`] = 96 + n;
    // 0-9
    for (let n = 0; n <= 9; n++) c[n] = 48 + n;
    // F1-F25
    for (let n = 1; n <= 25; n++) c[`f${n}`] = 111 + n;
    // a-z
    for (let n = 1; n <= 26; n++) c[String.fromCharCode(64 + n).toLowerCase()] = 64 + n;

    return c;
})();
