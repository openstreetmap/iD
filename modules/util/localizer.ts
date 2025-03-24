import { utilArrayPowerset, utilArrayUniq } from './array';

function collectLocale(locale: Intl.Locale) {
    const quals = [
        locale.script,
        locale.region,
        // @ts-expect-error -- this attribute is too new, so there are no definitions in @types/web
        locale.variants,
    ].filter((value) => !!value);

    return utilArrayPowerset(quals)
        .reverse()
        .map((quals) => [locale.language, ...quals].join('-'));
}

/**
 * expands a locale code like `ja` to `ja-Jpan-JP`,
 * using {@link https://www.unicode.org/cldr/charts/45/supplemental/likely_subtags.html Likely Subtags}
 * via {@link Intl.Locale}'s `maximize()`.
 * Then determines every possible combination.
 *
 * @returns an array sorted by priority (best first)
 */
export function utilExpandLocaleCode(localeCode: string): string[] {
    try {
        const original = new Intl.Locale(localeCode);
        const maximised = original.maximize();

        const collection = [
            ...collectLocale(maximised),
            ...collectLocale(original),
        ];

        if (original.baseName !== localeCode) {
            // this means Intl.Locale transformed the input.
            // So, prioritise the original input.
            collection.unshift(localeCode.split('-')[0]);
            collection.unshift(localeCode);
        }

        if (!collection.includes(localeCode)) {
            // this means Intl.Locale stripped out part of the input.
            // So, prioritise the original input.
            collection.unshift(localeCode);
        }

        return utilArrayUniq(collection);
    } catch {
        // presumably Intl.Locale#maximize is unsupported.
        // If so, we can still handle the most basic case.
        const [language] = localeCode.split('-');
        return utilArrayUniq([localeCode, language]);
    }
}
