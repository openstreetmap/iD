import { t } from '../../util/locale';

var _errors = {
    'unsavedEdits': {
        severity: 'error',
        message: function() {
            return t('tasking.errors.unsavedEdits');
        },
        active: false,
        task: {}
    },
    'invalidStateMapping': {
        severity: 'error',
        message: function(task) {
            return t('tasking.errors.invalidStateMapping', { taskId: task.id, status: t('tasking.task.statuses.' + task.status) }); // TODO: TAH - change text to include user and status
        },
        active: false,
        task: {}
    },
    'taskAlreadyLocked': {
        severity: 'error',
        message: function(task) {
            return t('tasking.errors.taskAlreadyLocked', { taskId: task.id });
        },
        active: false,
        task: {}
    },
    'taskNotFound': {
        severity: 'error',
        message: function(task) {
            return t('tasking.errors.taskNotFound', { taskId: task.id });
        },
        active: false,
        task: {}
    },
    'validationNotAllowed': {
        severity: 'error',
        message: function() {
            return t('tasking.errors.validationNotAllowed'); // TODO: TAH - change text to include user and status
        },
        active: false,
        task: {}
    }
};

var errorMapping_HOT = {
    'Task in invalid state for mapping': 'invalidStateMapping',
    'Mapping not allowed because: USER_ALREADY_HAS_TASK_LOCKED': 'taskAlreadyLocked',
    'task': 'taskNotFound',
};


function handle403(task, error) {
    var baseString = t('tasking.errors._403') + ' ';

    baseString += error.message(task);

    return baseString;
}


function handleError(task, requestError, errors) {
    var _errorMessage = '';

    var _tm = 'HOT'; // TODO: TAH - remove hard code once added other TMs

    var _errorName;

    // get generic error name from map tm-specific error code
    switch (_tm) {
        case 'HOT':
            _errorName = errorMapping_HOT[requestError.Error];
            break;

        default:
            break;
    }

    if (_errorName) {
        // set error as active
        errors[_errorName].active = true;
        errors[_errorName].task = task;
    }

    // get error message
    switch (requestError.status) {
        case 403:
            _errorMessage = handle403(task, errors[_errorName]);
            break;
        default:
            break;
    }

    return {
        errors: errors,
        message: _errorMessage
    };
}

export { _errors, handleError };
