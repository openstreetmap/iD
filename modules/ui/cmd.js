import { utilDetect } from '../util/detect';

// Translate a MacOS key command into the appropriate Windows/Linux equivalent.
// For example, ⌘Z -> Ctrl+Z
export var uiCmd = function (code) {
    var detected = utilDetect();

    if (detected.os === 'mac') {
        return code;
    }

    if (detected.os === 'win') {
        if (code === '⌘⇧Z') return 'Ctrl+Y';
    }

    var result = '',
        replacements = {
            '⌘': 'Ctrl',
            '⇧': 'Shift',
            '⌥': 'Alt',
            '⌫': 'Backspace',
            '⌦': 'Delete'
        };

    for (var i = 0; i < code.length; i++) {
        if (code[i] in replacements) {
            result += replacements[code[i]] + (i < code.length - 1 ? '+' : '');
        } else {
            result += code[i];
        }
    }

    return result;
};


// return a display-focused string for a given keyboard code
uiCmd.display = function(code) {
    if (code.length !== 1) return code;

    var detected = utilDetect();
    var mac = (detected.os === 'mac');
    var replacements = {
        '⌘': mac ? '⌘ Cmd'       : 'Ctrl',
        '⇧': mac ? '⇧ Shift'     : 'Shift',
        '⌥': mac ? '⌥ Option'    : 'Alt',
        '⌫': mac ? '⌫ Delete'    : 'Backspace',
        '⌦': mac ? '⌦ Del'       : 'Del',
        '↖': mac ? '↖ PgUp'      : 'PgUp',
        '↘': mac ? '↘ PgDn'      : 'PgDn',
        '⇞': mac ? '⇞ Home'      : 'Home',
        '⇟': mac ? '⇟ End'       : 'End',
        '↵': mac ? '↵ Return'    : 'Enter',
        '⎋': mac ? '⎋ Esc'       : 'Esc',
    };

    return replacements[code] || code;
};
