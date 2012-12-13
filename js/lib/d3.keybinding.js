d3.keybinding = function() {
    // via https://github.com/keithamus/jwerty/
    // and https://github.com/madrobby/keymaster
    var _keys = {
        // MOD aka toggleable keys
        mods: {
            // Shift key, ⇧
            '⇧': 16,
            // CTRL key, on Mac: ⌃
            '⌃': 17,
            // ALT key, on Mac: ⌥ (Alt)
            '⌥': 18,
            // META, on Mac: ⌘ (CMD), on Windows (Win), on Linux (Super)
            '⌘': 91
        },
        // Normal keys
        keys: {
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
            // Num-Multiply, or *
            '*': 106, star: 106, asterisk: 106, multiply: 106,
            // Num-Plus or +
            '+': 107, 'plus': 107,
            // Num-Subtract, or -
            '-': 109, subtract: 109,
            // Semicolon
            ';': 186, semicolon:186,
            // = or equals
            '=': 187, 'equals': 187,
            // Comma, or ,
            ',': 188, comma: 188,
            //'-': 189, //???
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
            // Apostraphe, or Quote, or '
            '\'': 222, quote: 222, apostraphe: 222
        }
    };
    // To minimise code bloat, add all of the NUMPAD 0-9 keys in a loop
    var i = 95, n = 0;
    while (++i < 106) _keys.keys['num-' + n] = i; ++n;
    // To minimise code bloat, add all of the top row 0-9 keys in a loop
    i = 47, n = 0;
    while (++i < 58) _keys.keys[n] = i; ++n;
    // To minimise code bloat, add all of the F1-F25 keys in a loop
    i = 111, n = 1;
    while (++i < 136) _keys.keys['f' + n] = i; ++n;
    // To minimise code bloat, add all of the letters of the alphabet in a loop
    i = 64;
    while(++i < 91) _keys.keys[String.fromCharCode(i).toLowerCase()] = i;

    var pairs = d3.entries(_keys.keys),
        event = d3.dispatch.apply(d3, d3.keys(_keys.keys));

    function keys(selection) {
        selection.on('keydown', function () {
            var tagName = d3.select(d3.event.target).node().tagName;
            if (tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA') {
                return;
            }

            var modifiers = '';
            if (d3.event.shiftKey) modifiers += '⇧';
            if (d3.event.ctrlKey) modifiers += '⌃';
            if (d3.event.altKey) modifiers += '⌥';
            if (d3.event.metaKey) modifiers += '⌘';

            pairs.filter(function(d) {
                return d.value === d3.event.keyCode;
            }).forEach(function(d) {
                event[d.key](d3.event, modifiers);
            });
        });
    }

    return d3.rebind(keys, event, 'on');
};
