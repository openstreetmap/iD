// @ts-nocheck -- will be migrated in the next PR
import type { Dispatch } from 'd3-dispatch';

// Copies a variable number of methods from source to target.
export function utilRebind<T, S, Args extends keyof S>(target: T, source: S, ...args: Args[]): T & Pick<S, Args> {
    for (const method of args) {
        target[method] = d3_rebind(target, source, source[method]);
    }
    return target;
}

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
    return function() {
        var value = method.apply(source, arguments);
        return value === source ? target : value;
    };
}

// copied from @types/d3-dispatch
type MapUnion<K extends keyof T, T> = K extends any ? T[K] : never;

// copied from @types/d3-dispatch, with `this` removed
type Callback<EventMap extends Dispatch.GenericEventMap, S extends string> =
    Dispatch.ExtractEventNames<S> extends keyof EventMap
        ? (...args: MapUnion<Dispatch.ExtractEventNames<S>, EventMap>) => void
        : never;

// copied from @types/d3-dispatch, with `this` removed
export interface On<Target, EventMap extends Dispatch.GenericEventMap> {
    <S extends string>(typenames: S): Callback<EventMap, S> | undefined;
    <S extends string>(typenames: S, callback: Callback<EventMap, S> | null): Target;
}

export function utilBindDispatch<Target, EventMap extends Dispatch.GenericEventMap>(
    target: Target,
    dispatch: Dispatch<any, EventMap>
): On<Target, EventMap> {
    return function(...args: [string, any?]): any {
        const value = dispatch.on(...args);
        return value === dispatch ? target : value;
    };
}
