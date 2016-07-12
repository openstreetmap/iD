import { Detect } from '../util/detect';

// Translate a MacOS key command into the appropriate Windows/Linux equivalent.
// For example, ⌘Z -> Ctrl+Z
export function cmd(code) {
    var detected = Detect();

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
            result += replacements[code[i]] + '+';
        } else {
            result += code[i];
        }
    }

    return result;
}
