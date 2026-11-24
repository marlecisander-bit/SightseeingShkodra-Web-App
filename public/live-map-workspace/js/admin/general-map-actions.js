window.app.actions.getAllStops = function() {
    const map = window.app && window.app.getMap ? window.app.getMap() : window.map;
    if (!map || !map.eachLayer) {
        return [];
    }

    const stops = [];
    map.eachLayer(function(layer) {
        if (layer && layer.feature && layer.feature.properties && layer.feature.properties.objectType === 'point') {
            stops.push(layer);
        }
    });
    return stops;
};

window.app.actions.loadVanPosition = function() {
    if (typeof window.showToast === 'function') {
        window.showToast('Van position refreshed');
    }
    return true;
};

window.app.actions.closeEditor = function() {
    const editor = document.getElementById('point-editor');
    if (editor) {
        editor.style.display = 'none';
    }
    return true;
};

window.app.actions.prepareMapData = function() {
    return {
        type: 'FeatureCollection',
        features: []
    };
};

window.app.actions.closeMobileContextPanel = function() {
    document.body.classList.remove('mobile-context-open');
};

window.app.actions.openExportMapModal = function() {
    const modal = document.getElementById('export-map-modal');
    if (modal) {
        modal.classList.add('open');
    }
};

if (window.app.registerActionGroup) {
    window.app.registerActionGroup('defaultActions', window.app.actions);
} else {
    Object.keys(window.app.actions).forEach(function(name) {
        window[name] = window.app.actions[name];
    });
}

window.adminLogin = window.adminLogin || window.app.actions.adminLogin;
window.saveDraft = window.saveDraft || window.app.actions.saveDraft;
window.publishMap = window.publishMap || window.app.actions.publishMap;
window.getAllStops = window.getAllStops || window.app.actions.getAllStops;
window.loadVanPosition = window.loadVanPosition || window.app.actions.loadVanPosition;
window.closeEditor = window.closeEditor || window.app.actions.closeEditor;
window.prepareMapData = window.prepareMapData || window.app.actions.prepareMapData;
