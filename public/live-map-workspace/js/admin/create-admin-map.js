window.app = window.app || {};

window.app.mapService = {
    create: function(containerId, center, zoom) {
        const config = center || window.appConfig.mapCenter;
        const map = L.map(containerId, { scrollWheelZoom: false }).setView([
            config.lat,
            config.lng
        ], config.zoom || zoom || 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            crossOrigin: true,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        }).addTo(map);

        this.setupControls(map);

        if (window.app && window.app.state) {
            window.app.state.map = map;
            window.app.state.mapReady = true;
            window.app.syncLegacyState?.();
        }

        return map;
    },
    setupControls: function(map) {
        if (!map || !map.pm) {
            return map;
        }

        map.pm.addControls({
            position: 'topleft',
            drawMarker: false,
            drawPolyline: false,
            drawPolygon: false,
            drawRectangle: false,
            drawCircle: false,
            drawCircleMarker: false,
            drawText: false,
            editMode: true,
            dragMode: true,
            cutPolygon: false,
            removalMode: false
        });

        map.pm.setGlobalOptions({
            snappable: true,
            snapDistance: 12,
            snapMiddle: false
        });

        return map;
    }
};

window.app.createMap = window.app.mapService.create;
window.app.setupMapControls = window.app.mapService.setupControls;
