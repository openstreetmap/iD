// see https://github.com/openstreetmap/iD/pull/3707
// https://gist.github.com/mapmeld/556b09ddec07a2044c76e1ef45f01c60

import { WordShaper } from 'alif-toolkit';

export var rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u07BF\u08A0–\u08BF]/;

export function fixRTLTextForSvg(inputText) {
    var ret = '', rtlBuffer = [];
    var arabicRegex = /[\u0600-\u06FF]/g;
    var arabicDiacritics = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
    var arabicMath = /[\u0660-\u066C\u06F0-\u06F9]+/g;
    var thaanaVowel = /[\u07A6-\u07B0]/;
    var hebrewSign = /[\u0591-\u05bd\u05bf\u05c1-\u05c5\u05c7]/;

    // Arabic word shaping
    if (arabicRegex.test(inputText)) {
        inputText = WordShaper(inputText);
    }

    for (var n = 0; n < inputText.length; n++) {
        var c = inputText[n];
        if (arabicMath.test(c)) {
            // Arabic numbers go LTR
            ret += rtlBuffer.reverse().join('');
            rtlBuffer = [c];
        } else {
            if (rtlBuffer.length && arabicMath.test(rtlBuffer[rtlBuffer.length - 1])) {
                ret += rtlBuffer.reverse().join('');
                rtlBuffer = [];
            }
            if ((thaanaVowel.test(c) || hebrewSign.test(c) || arabicDiacritics.test(c)) && rtlBuffer.length) {
                rtlBuffer[rtlBuffer.length - 1] += c;
            } else if (rtlRegex.test(c)
                // include Arabic presentation forms
                || (c.charCodeAt(0) >= 64336 && c.charCodeAt(0) <= 65023)
                || (c.charCodeAt(0) >= 65136 && c.charCodeAt(0) <= 65279)) {
                rtlBuffer.push(c);
            } else if (c === ' ' && rtlBuffer.length) {
                // whitespace within RTL text
                rtlBuffer = [rtlBuffer.reverse().join('') + ' '];
            } else {
                // non-RTL character
                ret += rtlBuffer.reverse().join('') + c;
                rtlBuffer = [];
            }
        }
    }
    ret += rtlBuffer.reverse().join('');
    return ret;
}
