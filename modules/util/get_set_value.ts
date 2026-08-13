import type { ValueFn } from 'd3';

export type ShouldUpdate = (oldValue: string, newValue: string) => boolean;

// Like selection.property('value', ...), but avoids no-op value sets,
// which can result in layout/repaint thrashing in some situations.
/** @returns {string} */
export function utilGetSetValue<T extends d3.Selection<HTMLInputElement> | d3.Selection<HTMLTextAreaElement>>(selection: T): string;
export function utilGetSetValue<T extends d3.Selection<HTMLInputElement> | d3.Selection<HTMLTextAreaElement>>(selection: T, value?: string | null | ValueFn<HTMLInputElement | HTMLTextAreaElement, unknown, string>, shouldUpdate?: ShouldUpdate): T;
export function utilGetSetValue<T extends d3.Selection<HTMLInputElement> | d3.Selection<HTMLTextAreaElement>>(selection: T, value?: string | null | ValueFn<HTMLInputElement | HTMLTextAreaElement, unknown, string>, shouldUpdate?: ShouldUpdate): T | string {
    function setValue(value: any, shouldUpdate: ShouldUpdate) {
        function valueNull(this: HTMLInputElement | HTMLTextAreaElement) {
            // @ts-expect-error -- hack
            delete this.value;
        }

        function valueConstant(this: HTMLInputElement | HTMLTextAreaElement) {
            if (shouldUpdate(this.value, value)) {
                this.value = value;
            }
        }

        function valueFunction(this: HTMLInputElement | HTMLTextAreaElement) {
            var x = value.apply(this, arguments);
            if (x === null) {
                return;
            } else if (x === undefined) {
                this.value = '';
            } else if (shouldUpdate(this.value, x)) {
                this.value = x;
            }
        }

        return (value === null || value === undefined)
            ? valueNull : (typeof value === 'function'
            ? valueFunction : valueConstant);
    }

    if (arguments.length === 1) {
        return selection.property('value');
    }

    if (shouldUpdate === undefined) {
        shouldUpdate = (a, b) => a !== b;
    }

    return selection.each(setValue(value, shouldUpdate)) as T;
}
