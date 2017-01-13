// see https://github.com/openstreetmap/iD/pull/3707
// https://gist.github.com/mapmeld/556b09ddec07a2044c76e1ef45f01c60

var chars = {
    // madda above alef
    1570: { initial: 'آ‎', isolated: 'ﺁ', medial: 'ﺁ', final: 'ﺂ' },

    // hamza above and below alef
    1571: { initial: 'أ', isolated: 'ﺃ', medial: '', final: 'ﺄ' },
    // 1572 is ؤ
    1573: { initial: 'إ', isolated: 'ﺇ', medial: '', final: 'ﺈ' },
    // 1574 is ئ
    1575: { initial: 'ا', isolated: 'ا', medial: '', final: 'ﺎ' },
    1576: { initial: 'ﺑ', isolated: 'ﺏ', medial: 'ﺒ', final: 'ﺐ' },

    // 1577 ة
    1577: { initial: '', isolated: 'ة', medial: '', final: 'ﺔ' },

    1578: { initial: 'ﺗ', isolated: 'ﺕ', medial: 'ﺘ', final: 'ﺖ' },
    1579: { initial: 'ﺛ', isolated: 'ﺙ', medial: 'ﺜ', final: 'ﺚ' },
    1580: { initial: 'ﺟ', isolated: 'ﺝ', medial: 'ﺠ', final: 'ﺞ' },
    1581: { initial: 'ﺣ', isolated: 'ﺡ', medial: 'ﺤ', final: 'ﺢ' },
    1582: { initial: 'ﺧ', isolated: 'ﺥ', medial: 'ﺨ', final: 'ﺦ' },
    1583: { initial: 'ﺩ', isolated: 'ﺩ', medial: '', final: 'ﺪ' },
    1584: { initial: 'ﺫ', isolated: 'ﺫ', medial: '', final: 'ﺬ' },
    1585: { initial: 'ﺭ', isolated: 'ﺭ', medial: '', final: 'ﺮ' },
    1586: { initial: 'ﺯ', isolated: 'ﺯ', medial: '', final: 'ﺰ' },
    1688: { initial: 'ﮊ', isolated: 'ﮊ', medial: '', final: 'ﮋ' },
    1587: { initial: 'ﺳ', isolated: 'ﺱ', medial: 'ﺴ', final: 'ﺲ' },
    1588: { initial: 'ﺷ', isolated: 'ﺵ', medial: 'ﺸ', final: 'ﺶ' },
    1589: { initial: 'ﺻ', isolated: 'ﺹ', medial: 'ﺼ', final: 'ﺺ' },
    1590: { initial: 'ﺿ', isolated: 'ﺽ', medial: 'ﻀ', final: 'ﺾ' },
    1591: { initial: 'ﻃ', isolated: 'ﻁ', medial: 'ﻄ', final: 'ﻂ' },
    1592: { initial: 'ﻇ', isolated: 'ﻅ', medial: 'ﻈ', final: 'ﻆ' },
    1593: { initial: 'ﻋ', isolated: 'ﻉ', medial: 'ﻌ', final: 'ﻊ' },
    1594: { initial: 'ﻏ', isolated: 'ﻍ', medial: 'ﻐ', final: 'ﻎ' },

    // 1595 ػ - may be very rare

    1601: { initial: 'ﻓ', isolated: 'ﻑ', medial: 'ﻔ', final: 'ﻒ' },
    1602: { initial: 'ﻗ', isolated: 'ﻕ', medial: 'ﻘ', final: 'ﻖ' },
    1604: { initial: 'ﻟ', isolated: 'ﻝ', medial: 'ﻠ', final: 'ﻞ' },
    1605: { initial: 'ﻣ', isolated: 'ﻡ', medial: 'ﻤ', final: 'ﻢ' },
    1606: { initial: 'ﻧ', isolated: 'ﻥ', medial: 'ﻨ', final: 'ﻦ' },
    1607: { initial: 'ﻫ', isolated: 'ﻩ', medial: 'ﻬ', final: 'ﻪ' },
    1608: { initial: 'ﻭ', isolated: 'ﻭ', medial: '', final: 'ﻮ' },

    // 1609 ى
    1609: { initial: 'ﯨ', isolated: 'ﻯ', medial: 'ﯩ', final: 'ﻰ' },
    // 1610 ي
    1610: { initial: 'ﻳ', isolated: 'ﻱ', medial: 'ﻴ', final: 'ﻲ' },

    // short vowel sounds / tashkil markings

    1662: { initial: 'ﭘ', isolated: 'ﭖ', medial: 'ﭙ', final: 'ﭗ' },

    1670: { initial: 'ﭼ', isolated: 'ﭺ', medial: 'ﭽ', final: 'ﭻ' },
    1603: { initial: 'ﻛ', isolated: 'ﻙ', medial: 'ﻜ', final: 'ﻚ' },
    1705: { initial: 'ﻛ', isolated: 'ﮎ', medial: 'ﻜ', final: 'ﮏ' },
    1711: { initial: 'ﮔ', isolated: 'ﮒ', medial: 'ﮕ', final: 'ﮓ' },
    1740: { initial: 'ﻳ', isolated: 'ﻯ', medial: 'ﻴ', final: 'ﻰ' },
    5000: { initial: 'ﻻ', isolated: 'ﻻ', medial: '', final: 'ﻼ' }
};


export function fixArabicScriptTextForSvg(inputText) {
    var context = true;
    var ret = '';
    var rtlBuffer = [];

    for (var i = 0, l = inputText.length; i < l; i++) {
        var code = inputText[i].charCodeAt(0);
        var nextCode = inputText[i + 1] ? inputText[i + 1].charCodeAt(0) : 0;

        if (!chars[code]) {
            if (code === 32 && rtlBuffer.length) {
              // whitespace
              rtlBuffer = [rtlBuffer.reverse().join('') + ' '];
            } else {
              // non-RTL character
              ret += rtlBuffer.reverse().join('') + inputText[i];
              rtlBuffer = [];
            }
            continue;
        }
        if (context) {
            if (i === l - 1 || nextCode === 32) {
                rtlBuffer.push(chars[code].isolated);
            } else {
                // special case for لا
                if (code === 1604 && nextCode === 1575) {
                    rtlBuffer.push(chars[5000].initial);
                    i++;
                    context = true;
                    continue;
                }
                rtlBuffer.push(chars[code].initial);
            }
        } else {
            if (i === l - 1 || nextCode === 32){
                rtlBuffer.push(chars[code].final);
            } else {
                // special case for ﻼ
                if (code === 1604 && nextCode === 1575){
                    rtlBuffer.push(chars[5000].final);
                    i++;
                    context = true;
                    continue;
                }
                if (chars[code].medial === ''){
                    rtlBuffer.push(chars[code].final);
                } else {
                    rtlBuffer.push(chars[code].medial);
                }
            }
        }
        context = (chars[code].medial === '') || nextCode === 32;
    }

    ret += rtlBuffer.reverse().join('');
    return ret;
}
