import { dispatch, type Dispatch } from 'd3-dispatch';
import { utilRebind } from './rebind';

/**
 * This is a replacement for `utilRebind(this, dispatch, 'on')`,
 * modern classes just need to extend this class, and call `super(…)`
 */
export abstract class EventDispatcher<EventMap extends Dispatch.GenericEventMap> {
  protected dispatch: Dispatch<this, EventMap>;
  declare on: typeof this.dispatch.on;

  constructor(...args: (keyof EventMap)[]) {
    this.dispatch = dispatch(...args);
    utilRebind(this, this.dispatch, 'on');
  }
}


/**
 * for use in 'legacy classes' which want a single method that acts
 * as both a getter and a setter (see {@link GetSet}).
 */
export function getSet<This, T>(
    that: This,
    get: () => T,
    set: (newValue: T) => void
): GetSet<This, T> {
    function overloaded(): T;
    function overloaded(newValue: T): This;
    function overloaded(...args: [] | [T]) {
        if (!args.length) return get();
        set(args[0]);
        return that;
    };
    return overloaded;
}
