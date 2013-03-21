// Translate a MacOS key command into the appropriate Windows/Linux equivalent.
// For example, ⌘Z -> Ctrl+Z
iD.ui.cmd = function(code) {
    if (iD.detect().os === 'mac')
        return code;

    var replacements = {
        '⌘': 'Ctrl',
        '⇧': 'Shift',
        '⌥': 'Alt',
        '⌫': 'Backspace',
        '⌦': 'Delete'
    }, keys = [];

    for (var i = 0; i < code.length; i++) {
        if (code[i] in replacements) {
            keys.push(replacements[code[i]]);
        } else {
            keys.push(code[i]);
        }
    }

    return keys.join('+');
};
