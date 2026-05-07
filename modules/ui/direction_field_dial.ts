import {
    utilDirectionSegmentFractionDigits,
    utilGetSetValue,
    utilNormalizeAzimuthDegrees,
    utilParseDirectionDegreesString
} from '../util';
import { uiDirectionDial } from './direction_dial';

/** Preset field container passed to `uiFieldText`’s render function (the `.form-field` node). */
type FormFieldRootSelection = d3.Selection<HTMLElement>;

type InputSelection = d3.Selection<HTMLInputElement>;

type DialWrapSelection = d3.Selection<HTMLDivElement>;

interface DirectionFieldDialMountOptions {
    /** Preset `increment` when sensible; dial falls back to 1 if invalid. */
    step: number;
    getInput: () => InputSelection;
    notifyChange: (onInput: boolean) => void;
    clampNumber: (n: number) => number;
    formatFloat: (n: number, fractionDigits: number) => string;
    countDecimalPlaces: (s: string) => number;
    parseLocaleFloat: (s: string) => number;
}

type SyncDirectionDial = (isMixed: boolean, isLocked: boolean) => void;

/**
 * Returns a function called on each `i(selection)` pass: updates the dial shell for `fieldRoot`
 * and returns `sync` to run after `i.tags(…)`.
 */
export function createDirectionFieldDialMount(
    enabled: boolean,
    options: DirectionFieldDialMountOptions
): (fieldRoot: FormFieldRootSelection) => SyncDirectionDial {
    if (!enabled) {
        return function mountDisabled(fieldRoot: FormFieldRootSelection) {
            fieldRoot.classed('form-field-has-direction-dial', false);
            fieldRoot.selectAll('.direction-dial-wrap').remove();
            return function syncNoOp() {
                /* no dial */
            };
        };
    }

    let dialWrap: DialWrapSelection | null = null;

    const dial = uiDirectionDial()
        .step(options.step)
        .onInput(function(degrees: number) {
            applyDegreesToInput(degrees, true);
        })
        .onCommit(function(degrees: number) {
            applyDegreesToInput(degrees, false);
        });

    function applyDegreesToInput(degrees: number, onInput: boolean) {
        const inputSel = options.getInput();
        if (inputSel.empty()) return;

        const normalized = utilNormalizeAzimuthDegrees(degrees);
        const currentValue = utilGetSetValue(inputSel);
        const vals = currentValue ? currentValue.split(';') : [''];
        const firstValue = (vals[0] || '').trim();
        const fractionDigits = utilDirectionSegmentFractionDigits(
            firstValue,
            options.countDecimalPlaces
        );

        vals[0] = options.formatFloat(options.clampNumber(normalized), fractionDigits);
        utilGetSetValue(inputSel, vals.join(';'));
        options.notifyChange(onInput);
    }

    function syncDialFromInput(isMixed: boolean, isLocked: boolean) {
        if (!dialWrap) return;

        const inputSel = options.getInput();
        const rawValue = utilGetSetValue(inputSel);
        const firstValue = (rawValue || '').split(';')[0];
        const degrees = isMixed
            ? null
            : utilParseDirectionDegreesString(firstValue, options.parseLocaleFloat);

        dial
            .value(degrees)
            .disabled(isMixed || isLocked);

        dialWrap.call(dial);
    }

    return function mountFieldDirectionDial(fieldRoot: FormFieldRootSelection) {
        fieldRoot.classed('form-field-has-direction-dial', true);
        const inputWrap = fieldRoot.select<HTMLElement>('.form-field-input-wrap');
        if (inputWrap.empty()) {
            fieldRoot.selectAll('.direction-dial-wrap').remove();
            dialWrap = null;
            return syncDialFromInput;
        }

        const wrapSel = inputWrap.selectAll<HTMLDivElement, number>('.direction-dial-wrap').data([0]);
        dialWrap = wrapSel
            .enter()
            .insert('div', '.form-field-button')
            .attr('class', 'direction-dial-wrap')
            .merge(wrapSel);

        return syncDialFromInput;
    };
}
