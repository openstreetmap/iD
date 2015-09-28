// Translate a MacOS key command into the appropriate Windows/Linux equivalent.
// For example, ⌘Z -> Ctrl+Z
iD.ui.cmd = function(code) {
    if (iD.detect().os === 'mac') {
        return code;
    }

    if (iD.detect().os === 'win') {
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
};
