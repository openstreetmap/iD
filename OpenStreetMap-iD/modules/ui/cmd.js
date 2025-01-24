import { t } from '../core/localizer';
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
        '⌘': mac ? '⌘ ' + t('shortcuts.key.cmd')    : t('shortcuts.key.ctrl'),
        '⇧': mac ? '⇧ ' + t('shortcuts.key.shift')  : t('shortcuts.key.shift'),
        '⌥': mac ? '⌥ ' + t('shortcuts.key.option') : t('shortcuts.key.alt'),
        '⌃': mac ? '⌃ ' + t('shortcuts.key.ctrl')   : t('shortcuts.key.ctrl'),
        '⌫': mac ? '⌫ ' + t('shortcuts.key.delete') : t('shortcuts.key.backspace'),
        '⌦': mac ? '⌦ ' + t('shortcuts.key.del')    : t('shortcuts.key.del'),
        '↖': mac ? '↖ ' + t('shortcuts.key.pgup')   : t('shortcuts.key.pgup'),
        '↘': mac ? '↘ ' + t('shortcuts.key.pgdn')   : t('shortcuts.key.pgdn'),
        '⇞': mac ? '⇞ ' + t('shortcuts.key.home')   : t('shortcuts.key.home'),
        '⇟': mac ? '⇟ ' + t('shortcuts.key.end')    : t('shortcuts.key.end'),
        '↵': mac ? '⏎ ' + t('shortcuts.key.return') : t('shortcuts.key.enter'),
        '⎋': mac ? '⎋ ' + t('shortcuts.key.esc')    : t('shortcuts.key.esc'),
        '☰': mac ? '☰ ' + t('shortcuts.key.menu')  : t('shortcuts.key.menu'),
    };

    return replacements[code] || code;
};
