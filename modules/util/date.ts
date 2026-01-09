import { localizer } from '../core/localizer';

function timeSince(date: Date): [value: number, unit: Intl.RelativeTimeFormatUnit] {
    const seconds = Math.floor((+new Date() - +date) / 1000);
    const s = (n: number) => Math.floor(seconds / n);

    if (s(60 * 60 * 24 * 365) > 1) return [s(60 * 60 * 24 * 365), 'years'];
    if (s(60 * 60 * 24 * 30) > 1) return [s(60 * 60 * 24 * 30), 'months'];
    if (s(60 * 60 * 24) > 1) return [s(60 * 60 * 24), 'days'];
    if (s(60 * 60) > 1) return [s(60 * 60), 'hours'];
    if (s(60) > 1) return [s(60), 'minutes'];
    return [s(1), 'seconds'];
}

/**
 * Show the relative time if {@link Intl.RelativeTimeFormat} is supported
 * Otherwise fallback to the current date
 */
export function getRelativeDate(date: Date) {
    const preferredLanguage = localizer.localeCode();

    if (typeof Intl === 'undefined' || typeof Intl.RelativeTimeFormat === 'undefined') {
        return `on ${date.toLocaleDateString(preferredLanguage)}`;
    }

    const [number, units] = timeSince(date);
    if (!Number.isFinite(number)) return '-';

    return new Intl.RelativeTimeFormat(preferredLanguage).format(-number, units);
}

export function localeDateString(date: Date | string) {
    if (!date) return null;
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    };
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(localizer.localeCode(), options);
}

export function localeTimestamp(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    };
    return date.toLocaleString(localizer.localeCode(), options);
}
