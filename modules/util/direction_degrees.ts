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

export interface DirectionRange {
    start: number;
    end: number;
}

/**
 * Parse a direction range from user-entered text (single semicolon segment).
 * Supports formats like `120-300` with optional whitespace.
 */
export function utilParseDirectionRangeString(
    value: string,
    parseLocaleFloat: (s: string) => number,
    rawNumberRe: RegExp = numberFieldRawRegex
): DirectionRange | null {
    const directionText = (value || '').trim();
    if (!directionText) return null;

    const match = directionText.match(/^(.+?)\s*-\s*(.+)$/);
    if (!match) return null;

    const parsePart = (s: string): number | null => {
        const part = s.trim().toLowerCase();
        if (!part) return null;
        if (cardinal[part as keyof typeof cardinal] !== undefined) {
            return cardinal[part as keyof typeof cardinal];
        }
        const isRawNumber = rawNumberRe.test(part);
        const parsed = isRawNumber ? parseFloat(part) : parseLocaleFloat(part);
        if (!isFinite(parsed)) return null;
        return utilNormalizeAzimuthDegrees(parsed);
    };

    const start = parsePart(match[1]);
    const end = parsePart(match[2]);
    if (start === null || end === null) return null;
    return { start, end };
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
