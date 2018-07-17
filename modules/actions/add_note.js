import osm from '../services/osm';

export function actionAddNote(note) {
    osm.replaceNote(note);
    console.log('actionAddNote: ', note);
}