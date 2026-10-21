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
