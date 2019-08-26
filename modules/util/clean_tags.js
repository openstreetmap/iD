export function utilCleanTags(tags) {
    var out = {};
    for (var k in tags) {
        if (!k) continue;
        var v = tags[k];
        if (v !== undefined) {
            out[k] = cleanValue(k, v);
        }
    }

    return out;


    function cleanValue(k, v) {
        function keepSpaces(k) {
            return /_hours|_times|:conditional$/.test(k);
        }

        function skip(k) {
            return /^(description|note|fixme)$/.test(k);
        }

        if (skip(k)) return v;

        var cleaned = v
            .split(';')
            .map(function(s) { return s.trim(); })
            .join(keepSpaces(k) ? '; ' : ';');

        // The code below is not intended to validate websites and emails.
        // It is only intended to prevent obvious copy-paste errors. (#2323)
        // clean website- and email-like tags
        if (k.indexOf('website') !== -1 ||
            k.indexOf('email') !== -1 ||
            cleaned.indexOf('http') === 0) {
            cleaned = cleaned
                .replace(/[\u200B-\u200F\uFEFF]/g, '');  // strip LRM and other zero width chars

        }

        return cleaned;
    }
}
