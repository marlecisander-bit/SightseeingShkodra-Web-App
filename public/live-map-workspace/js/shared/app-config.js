// Tracking presentation defaults. Project identity is supplied by the website.
window.appConfig = {
  "leanTrackingEnabled": true,
  "minimalTrackingAdmin": true,
  "mapCenter": {
    "lat": 42.0683,
    "lng": 19.5126,
    "zoom": 13
  },
  "vehicleId": "sightseeing-shkodra-van-1",
  "defaultProjectSlug": "sightseeing-shkodra",
  "projectId": null,
  "projectSlug": null,
  "scorpionTrackingToken": "",
  "defaultGpsSource": "scorpion",
  "projectGpsSource": null,
  "providerSelectionEnabled": true,
  "selectedTrackingRealtimeEnabled": true,
  "vanFollowZoom": 17,
  "gpsUpdateInterval": 5000,
  "trackingFallbackIntervalMs": 5000,
  "vehicleStateUpdateInterval": 5000,
  "vehicleEtaUpdateInterval": 5000,
  "publishedMapCheckInterval": 30000,
  "gpsStaleAfterMs": 90000,
  "vehicleEtaStaleAfterMs": 90000,
  "defaultServiceSpeedKmh": 18,
  "stopArrivalRadiusKm": 0.08,
  "offRouteWarningKm": 0.4,
  "offRouteConfirmReadings": 3,
  "maximumSpeedSamples": 24,
  "trackingV2": {
    "delayedSeconds": 90,
    "degradedSeconds": 180,
    "offlineSeconds": 600,
    "approachMetres": 200,
    "approachExitMetres": 240,
    "arrivalMetres": 200,
    "arrivalExitMetres": 220,
    "arrivalDwellSeconds": 10,
    "predictionSeconds": 10,
    "maxPredictionMetres": 50,
    "segmentBaselinesMinutes": {},
    "defaultDwellMinutes": 0,
    "historicalContextSeconds": 600,
    "parkedSeconds": 25
  },
  "allowedParentOrigins": [
    "https://sightseeingshkodra.app",
    "https://www.sightseeingshkodra.app",
    "https://sightseeingshkodra.com",
    "https://www.sightseeingshkodra.com"
  ]
};
Object.assign(window.appConfig, window.liveMapWorkspace);
