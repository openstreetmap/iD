import { t } from '../util/locale';
import { actionChangeTags } from '../actions/index';
import { behaviorOperation } from '../behavior/index';


export function operationCycleHighwayTag(selectedIDs, context) {
    var _entityID = selectedIDs[0];
    var _entity = context.entity(_entityID);
    var _prevSelectedIDs; 
    var ROAD_TYPES = ['residential', 'service', 'track', 'unclassified', 'tertiary'];


    var updateHighwayTag = function (tags) {
        var idx = tags.highway ? ROAD_TYPES.indexOf(tags.highway) : -1;
        tags.highway = ROAD_TYPES[(idx + 1) % ROAD_TYPES.length];
    }; 


    var operation = function() {
        _entity = context.entity(_entityID); 
        // Calculate whether the changes since the last time this action ran 
        // are only to highway tags. 
        if (_prevSelectedIDs) {
            var sameSelection = _prevSelectedIDs ? _prevSelectedIDs[0] === selectedIDs[0] : false;             
        }

        var tags = Object.assign({}, _entity.tags);
        updateHighwayTag(tags); 
        
        _prevSelectedIDs = selectedIDs; 

        // context peeking tells us the last operation performed. Was it cycle road tags?  
        if (sameSelection && context.history().peekAnnotation() === operation.annotation()) {
            // Coalesce the update of Highway type tags into the previous tag change
            context.replace(actionChangeTags(_entityID, tags), operation.annotation());
        } else {
            context.perform(actionChangeTags(_entityID, tags), operation.annotation());
        }
    };


    operation.available = function() {
        return selectedIDs.length === 1 &&
            _entity.type === 'way' &&
            new Set(_entity.nodes).size > 1;
    };


    operation.disabled = function() {
       if ( Object.keys(_entity.tags).length > 0 && !_entity.tags.highway) {
            return 'restriction'; 
       }
    };


    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.cycle_highway_tag.' + disable) :
            t('operations.cycle_highway_tag.description');
    };


    operation.annotation = function() {
        return t('operations.cycle_highway_tag.annotation');
    };


    operation.id = 'cycle_highway_tag';
    operation.keys = ['⇧' + t('operations.cycle_highway_tag.key')];
    operation.title = t('operations.cycle_highway_tag.title');
    operation.behavior = behaviorOperation(context).which(operation);

    return operation;
}
