import { cardinal } from '../osm/node';
import { numberFieldRawRegex } from './number_field';

/**
 * Normalize an angle in degrees to the range [0, 360).
 * @param degrees
 */
export function utilNormalizeAzimuthDegrees(degrees: number): number {
    return ((degrees % 360) + 360) % 360;
}

/**
 * Parse a direction value from user-entered text (single semicolon segment).
 * Supports cardinal shortcuts and numeric values (raw or locale-parsed).
 * @param value raw segment (e.g. from an input field)
 * @param parseLocaleFloat localized number parser
 * @param rawNumberRe defaults to {@link numberFieldRawRegex} (inspector `uiFieldText` rule)
 */
export function utilParseDirectionDegreesString(
    value: string,
    parseLocaleFloat: (s: string) => number,
    rawNumberRe: RegExp = numberFieldRawRegex
): number | null {
    const directionText = (value || '').trim().toLowerCase();
    if (!directionText) return null;

    if (cardinal[directionText as keyof typeof cardinal] !== undefined) {
        return cardinal[directionText as keyof typeof cardinal];
    }

    const isRawNumber = rawNumberRe.test(directionText);
    const parsed = isRawNumber ? parseFloat(directionText) : parseLocaleFloat(directionText);
    if (!isFinite(parsed)) return null;

    return utilNormalizeAzimuthDegrees(parsed);
}

/**
 * Fraction digits to use when re-formatting a direction segment, matching number-field behavior.
 * @param segment trimmed or untrimmed single value (e.g. first semicolon part)
 * @param countDecimalPlaces localized decimal-place counter for display strings
 * @param rawNumberRe defaults to {@link numberFieldRawRegex}
 */
export function utilDirectionSegmentFractionDigits(
    segment: string,
    countDecimalPlaces: (s: string) => number,
    rawNumberRe: RegExp = numberFieldRawRegex
): number {
    const s = (segment || '').trim();
    const isRawNumber = rawNumberRe.test(s);
    let fractionDigits = countDecimalPlaces(s);
    if (isRawNumber) {
        fractionDigits = s.includes('.') ? s.split('.')[1].length : 0;
    }
    if (!isFinite(fractionDigits)) {
        fractionDigits = 0;
    }
    return fractionDigits;
}
