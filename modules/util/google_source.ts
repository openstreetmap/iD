/** Matches source text that refers to Google or a goo.gl shortlink. */
export const utilGoogleSourceRegex = /(?:google|(?:^|[./])goo\.gl(?=$|[/:?#]))/i;

/** Matches blocked Google tile endpoints and goo.gl shortlink hosts. */
export const utilGoogleImageryRegex = /(?:.*\.google(?:apis)?\..*\/(?:vt|kh)[?/].*(?:[xyz]=.*){3}.*|^(?:(?:https?:)?\/\/)?(?:[^/?#]+\.)?goo\.gl(?:[/?#]|$))/i;
