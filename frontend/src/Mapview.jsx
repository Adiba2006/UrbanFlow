
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import polyline from "@mapbox/polyline";
import "leaflet/dist/leaflet.css";

function MapBounds({ paths, nearbyPlaces }) {
  const map = useMap();

  // Fit the map when a route or nearby-place result changes.
  // Do not refit the whole route on every GPS update.
  useEffect(() => {
    const points = [
      ...paths.flat(),
      ...nearbyPlaces.map((place) => [place.lat, place.lng]),
    ];

function FollowCurrentLocation({ currentLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!currentLocation) return;

    map.panTo(
      [currentLocation.lat, currentLocation.lng],
      { animate: true, duration: 0.5 }
    );
  }, [map, currentLocation?.lat, currentLocation?.lng]);

  return null;
}


    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), {
        padding: [35, 35],
        maxZoom: 16,
      });
    }
  }, [map, paths, nearbyPlaces]);

  return null;
}

function FollowCurrentLocation({ currentLocation }) {
  const map = useMap();

  // Keep the map centered on the latest GPS position.
  useEffect(() => {
    if (!currentLocation) return;

    map.panTo(
      [currentLocation.lat, currentLocation.lng],
      {
        animate: true,
        duration: 0.5,
      }
    );
  }, [map, currentLocation?.lat, currentLocation?.lng]);

  return null;
}

export default function MapView({
  routes = [],
  recommendedRoute = null,
  originLabel = "Your location",
  currentLocation = null,
  nearbyPlaces = [],
}) {
  const decodedRoutes = routes
    .map((route) => {
      try {
        return {
          ...route,
          coordinates: route.encoded_polyline
            ? polyline.decode(route.encoded_polyline)
            : [],
        };
      } catch {
        return { ...route, coordinates: [] };
      }
    })
    .filter((route) => route.coordinates.length > 0);

  const paths = decodedRoutes.map((route) => route.coordinates);

  const recommended =
    decodedRoutes.find(
      (route) =>
        route.route_number === recommendedRoute?.route_number
    ) || decodedRoutes[0];

  const center = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : recommended?.coordinates[0] || [21.1458, 79.0882];

  if (
    decodedRoutes.length === 0 &&
    !currentLocation &&
    nearbyPlaces.length === 0
  ) {
    return <p>Search for a route or nearby places to display the map.</p>;
  }

  return (
    <div className="live-map">
      <h2>🗺️ UrbanFlow Live Navigation</h2>

      <div className="map-legend">
        {recommended && <span>🟢 Recommended route</span>}
        {decodedRoutes.length > 1 && <span>🔵 Alternative routes</span>}
        {currentLocation && <span>📍 Live GPS location</span>}
        {nearbyPlaces.length > 0 && <span>📌 Nearby places</span>}
      </div>

      {currentLocation && (
        <p className="nearby-message">
          GPS: {currentLocation.lat.toFixed(5)},{" "}
          {currentLocation.lng.toFixed(5)}
        </p>
      )}

      
      <MapContainer
        center={[21.1458, 79.0882]}
        zoom={12}
        style={{ height: "500px", width: "100%" }}
      >
        <FollowCurrentLocation
          currentLocation={currentLocation}
        />

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds
          paths={paths}
          nearbyPlaces={nearbyPlaces}
        />

        <MapBounds
          paths={paths}
          nearbyPlaces={nearbyPlaces}
        />

        <FollowCurrentLocation
          currentLocation={currentLocation}
        />

        {decodedRoutes.map((route) => {
          const isRecommended =
            route.route_number === recommended?.route_number;

          return (
            <Polyline
              key={route.route_number}
              positions={route.coordinates}
              pathOptions={{
                color: isRecommended ? "#16a34a" : "#2563eb",
                weight: isRecommended ? 6 : 4,
                opacity: isRecommended ? 0.95 : 0.65,
              }}
            >
              <Popup>
                <strong>
                  {isRecommended
                    ? "Recommended Route"
                    : `Route ${route.route_number}`}
                </strong>
                <br />
                Distance: {route.distance_km} km
                <br />
                Travel time: {route.traffic_time_min} min
                <br />
                Traffic:{" "}
                {route.predicted_traffic_status || route.traffic_status}
              </Popup>
            </Polyline>
          );
        })}

        {currentLocation && (
          <CircleMarker
            center={[currentLocation.lat, currentLocation.lng]}
            radius={9}
            pathOptions={{
              color: "#1d4ed8",
              fillColor: "#3b82f6",
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>Your live location</strong>
              <br />
              {originLabel}
            </Popup>
          </CircleMarker>
        )}

        {recommended && (
          <CircleMarker
            center={
              recommended.coordinates[
                recommended.coordinates.length - 1
              ]
            }
            radius={7}
            pathOptions={{
              color: "#b91c1c",
              fillColor: "#ef4444",
              fillOpacity: 1,
            }}
          >
            <Popup>Destination</Popup>
          </CircleMarker>
        )}

        {nearbyPlaces.map((place) => (
          <CircleMarker
            key={place.id}
            center={[place.lat, place.lng]}
            radius={6}
            pathOptions={{
              color: "#92400e",
              fillColor: "#f59e0b",
              fillOpacity: 0.95,
            }}
          >
            <Popup>
              <strong>{place.name}</strong>
              <br />
              {place.category}
              <br />
              {place.distance < 1
                ? `${Math.round(place.distance * 1000)} metres away`
                : `${place.distance.toFixed(2)} km away`}
              <br />
              <a
                href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Open map
              </a>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
