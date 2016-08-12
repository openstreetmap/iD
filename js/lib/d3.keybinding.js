import * as d3 from 'd3';


/*
 * This code is licensed under the MIT license.
 *
 * Copyright © 2013, iD authors.
 *
 * Portions copyright © 2011, Keith Cirkel
 * See https://github.com/keithamus/jwerty
 *
 */
export function d3keybinding(namespace) {
    var bindings = [];

    function matches(binding, event) {
        for (var p in binding.event) {
            if (event[p] != binding.event[p])
                return false;
        }
        return true;
    }

    function testBindings(isCapturing) {
        for (var i = 0; i < bindings.length; i++) {
            var binding = bindings[i];

            if (!!binding.capture === isCapturing && matches(binding, d3.event)) {
                binding.callback();
            }
        }
    }

    function capture() {
        testBindings(true);
    }

    function bubble() {
        var tagName = d3.select(d3.event.target).node().tagName;
        if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') {
            return;
        }
        testBindings(false);
    }

    function keybinding(selection) {
        selection = selection || d3.select(document);
        selection.on('keydown.capture' + namespace, capture, true);
        selection.on('keydown.bubble' + namespace, bubble, false);
        return keybinding;
    }

    keybinding.off = function(selection) {
        bindings = [];
        selection = selection || d3.select(document);
        selection.on('keydown.capture' + namespace, null);
        selection.on('keydown.bubble' + namespace, null);
        return keybinding;
    };

    keybinding.on = function(code, callback, capture) {
        var binding = {
            event: {
                keyCode: 0,
                shiftKey: false,
                ctrlKey: false,
                altKey: false,
                metaKey: false
            },
            capture: capture,
            callback: callback
        };

        code = code.toLowerCase().match(/(?:(?:[^+⇧⌃⌥⌘])+|[⇧⌃⌥⌘]|\+\+|^\+$)/g);

        for (var i = 0; i < code.length; i++) {
            // Normalise matching errors
            if (code[i] === '++') code[i] = '+';

            if (code[i] in d3keybinding.modifierCodes) {
                binding.event[d3keybinding.modifierProperties[d3keybinding.modifierCodes[code[i]]]] = true;
            } else if (code[i] in d3keybinding.keyCodes) {
                binding.event.keyCode = d3keybinding.keyCodes[code[i]];
            }
        }

        bindings.push(binding);

        return keybinding;
    };

    return keybinding;
};

d3keybinding.modifierCodes = {
    // Shift key, ⇧
    '⇧': 16, shift: 16,
    // CTRL key, on Mac: ⌃
    '⌃': 17, ctrl: 17,
    // ALT key, on Mac: ⌥ (Alt)
    '⌥': 18, alt: 18, option: 18,
    // META, on Mac: ⌘ (CMD), on Windows (Win), on Linux (Super)
    '⌘': 91, meta: 91, cmd: 91, 'super': 91, win: 91
};

d3keybinding.modifierProperties = {
    16: 'shiftKey',
    17: 'ctrlKey',
    18: 'altKey',
    91: 'metaKey'
};

d3keybinding.keyCodes = {
    // Backspace key, on Mac: ⌫ (Backspace)
    '⌫': 8, backspace: 8,
    // Tab Key, on Mac: ⇥ (Tab), on Windows ⇥⇥
    '⇥': 9, '⇆': 9, tab: 9,
    // Return key, ↩
    '↩': 13, 'return': 13, enter: 13, '⌅': 13,
    // Pause/Break key
    'pause': 19, 'pause-break': 19,
    // Caps Lock key, ⇪
    '⇪': 20, caps: 20, 'caps-lock': 20,
    // Escape key, on Mac: ⎋, on Windows: Esc
    '⎋': 27, escape: 27, esc: 27,
    // Space key
    space: 32,
    // Page-Up key, or pgup, on Mac: ↖
    '↖': 33, pgup: 33, 'page-up': 33,
    // Page-Down key, or pgdown, on Mac: ↘
    '↘': 34, pgdown: 34, 'page-down': 34,
    // END key, on Mac: ⇟
    '⇟': 35, end: 35,
    // HOME key, on Mac: ⇞
    '⇞': 36, home: 36,
    // Insert key, or ins
    ins: 45, insert: 45,
    // Delete key, on Mac: ⌦ (Delete)
    '⌦': 46, del: 46, 'delete': 46,
    // Left Arrow Key, or ←
    '←': 37, left: 37, 'arrow-left': 37,
    // Up Arrow Key, or ↑
    '↑': 38, up: 38, 'arrow-up': 38,
    // Right Arrow Key, or →
    '→': 39, right: 39, 'arrow-right': 39,
    // Up Arrow Key, or ↓
    '↓': 40, down: 40, 'arrow-down': 40,
    // odities, printing characters that come out wrong:
    // Firefox Equals
    'ffequals': 61,
    // Num-Multiply, or *
    '*': 106, star: 106, asterisk: 106, multiply: 106,
    // Num-Plus or +
    '+': 107, 'plus': 107,
    // Num-Subtract, or -
    '-': 109, subtract: 109,
    // Firefox Plus
    'ffplus': 171,
    // Firefox Minus
    'ffminus': 173,
    // Semicolon
    ';': 186, semicolon: 186,
    // = or equals
    '=': 187, 'equals': 187,
    // Comma, or ,
    ',': 188, comma: 188,
    'dash': 189, //???
    // Period, or ., or full-stop
    '.': 190, period: 190, 'full-stop': 190,
    // Slash, or /, or forward-slash
    '/': 191, slash: 191, 'forward-slash': 191,
    // Tick, or `, or back-quote
    '`': 192, tick: 192, 'back-quote': 192,
    // Open bracket, or [
    '[': 219, 'open-bracket': 219,
    // Back slash, or \
    '\\': 220, 'back-slash': 220,
    // Close backet, or ]
    ']': 221, 'close-bracket': 221,
    // Apostrophe, or Quote, or '
    '\'': 222, quote: 222, apostrophe: 222
};

// NUMPAD 0-9
var i = 95, n = 0;
while (++i < 106) {
    d3keybinding.keyCodes['num-' + n] = i;
    ++n;
}

// 0-9
i = 47; n = 0;
while (++i < 58) {
    d3keybinding.keyCodes[n] = i;
    ++n;
}

// F1-F25
i = 111; n = 1;
while (++i < 136) {
    d3keybinding.keyCodes['f' + n] = i;
    ++n;
}

// a-z
i = 64;
while (++i < 91) {
    d3keybinding.keyCodes[String.fromCharCode(i).toLowerCase()] = i;
}
