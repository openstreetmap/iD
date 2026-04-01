import { dispatch, type Dispatch } from 'd3';

/**
 * This is a replacement for `utilRebind(this, dispatch, 'on')`,
 * modern classes just need to extend this class, and define a property
 * called `this.dispatch`
 */
export abstract class EventDispatcher<EventMap extends Dispatch.GenericEventMap> {
  dispatch: Dispatch<this, EventMap>;

  constructor(...args: (keyof EventMap)[]) {
    this.dispatch = dispatch(...args);
  }

  on = ((event, cb) => this.dispatch.on(event, cb)) as typeof this.dispatch.on;
}
