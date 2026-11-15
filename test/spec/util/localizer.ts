describe('iD.utilExpandLocaleCode', () => {
    // these tests depend on the JS runtime's bundled ICU data,
    // so they should only cover common cases that don't differ
    // between runtimes.
    it.each`
        input               | output
        ${'en'}             | ${['en-Latn-US', 'en-US', 'en-Latn', 'en']}
        ${'zh-CN'}          | ${['zh-Hans-CN', 'zh-CN', 'zh-Hans', 'zh']}
        ${'zh-HK'}          | ${['zh-Hant-HK', 'zh-HK', 'zh-Hant', 'zh']}
        ${'zh-Hans'}        | ${['zh-Hans-CN', 'zh-CN', 'zh-Hans', 'zh']}
        ${'zh-Hans-SG'}     | ${['zh-Hans-SG', 'zh-SG', 'zh-Hans', 'zh']}
        ${'cnr'}            | ${['cnr', 'sr-Latn-ME', 'sr-ME', 'sr-Latn', 'sr']}
        ${'cmn-SG'}         | ${['cmn-SG', 'cmn', 'zh-Hans-SG', 'zh-SG', 'zh-Hans', 'zh']}
        ${'en-GB-oxendict'} | ${['en-GB-oxendict', 'en-Latn-GB', 'en-GB', 'en-Latn', 'en']}
        ${'mi-u-sd-nzwko'}  | ${['mi-u-sd-nzwko', 'mi', 'mi-Latn-NZ', 'mi-NZ', 'mi-Latn']}
        ${'tl'}             | ${['tl', 'fil-Latn-PH', 'fil-PH', 'fil-Latn', 'fil']}
        ${''}               | ${['']}
        ${'123invalid'}     | ${['123invalid']}
    `('converts $input to $output', ({ input, output }) => {
        expect(iD.utilExpandLocaleCode(input)).toStrictEqual(output);
    });
});
