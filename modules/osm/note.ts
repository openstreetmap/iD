import { geoExtent } from '../geo';
import type { Vec2 } from '../geo/vector';
import type { NoteId } from './id_manager';

export interface OsmNoteComment {
  action: 'opened' | 'closed' | 'commented' | 'reopened' | 'hidden';
  /** undefined for anonymous note comments */
  uid?: number;
  user?: string;
  user_url?: string;
  date?: string;
  text?: string;
  html?: string;
}

export class osmNote {
    static #nextId = -1;
    static id = () => osmNote.#nextId--;

    readonly type = 'note';
    declare readonly id: NoteId;
    declare readonly loc: Vec2;
    declare readonly status: 'open' | 'closed' | 'hidden';
    declare readonly comments: OsmNoteComment[];

    declare readonly date_created?: string;
    declare readonly url?: string;
    declare readonly comment_url?: string;
    declare readonly close_url?: string;
    /** only used internally by iD, this prop does not come from the API */
    declare readonly newComment?: string;

    constructor(...sources: Partial<osmNote>[]) {
        for (var i = 0; i < sources.length; ++i) {
            var source = sources[i];
            for (var prop in source) {
                if (Object.prototype.hasOwnProperty.call(source, prop)) {
                    if (source[prop as keyof osmNote] === undefined) {
                        delete this[prop as keyof osmNote];
                    } else {
                        // @ts-expect-error -- this is a hack
                        this[prop] = source[prop];
                    }
                }
            }
        }

        this.id ||= osmNote.id();
    }

    extent() {
        return new geoExtent(this.loc);
    }

    update(attrs: Partial<osmNote>) {
        return new osmNote(this, attrs);
    }

    isNew() {
        return this.id < 0;
    }

    move(loc: Vec2) {
        return this.update({ loc: loc });
    }
}
