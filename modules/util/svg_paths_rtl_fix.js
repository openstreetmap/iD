// see https://github.com/openstreetmap/iD/pull/3707
// https://gist.github.com/mapmeld/556b09ddec07a2044c76e1ef45f01c60

import { WordShaper } from 'alif-toolkit';

export var rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0780-\u07BF]/;

export function fixRTLTextForSvg(inputText) {
    var ret = '', rtlBuffer = [];
    var arabicRegex = /[\u0600-\u06FF]/g;
    var arabicMath = /[\u0660-\u066C]+/g;
    var thaanaVowel = /[\u07A6-\u07B0]/;
    var hebrewSign = /[\u0591-\u05bd\u05bf\u05c1-\u05c5\u05c7]/;

    if (!arabicRegex.test(inputText)) {
        // Hebrew or Thaana RTL script
        for (var n = 0; n < inputText.length; n++) {
            var c = inputText[n];
            if ((thaanaVowel.test(c) || hebrewSign.test(c)) && rtlBuffer.length) {
                rtlBuffer[rtlBuffer.length - 1] += c;
            } else if (rtlRegex.test(c)) {
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
        ret += rtlBuffer.reverse().join('');
        return ret;
    } else {
        var label = WordShaper(inputText).split('').reverse().join('');
        // prevent Arabic numbers from being reversed
        var numericSwaps = label.match(arabicMath) || [];
        for (var i = 0; i < numericSwaps.length; i++) {
            if (numericSwaps[i].length > 1) {
                label = label.replace(numericSwaps[i], numericSwaps[i].split('').reverse().join(''));
            }
        }
        return label;
    }
}
