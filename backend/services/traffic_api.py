
import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"


def get_live_route(
    origin: str,
    destination: str,
    origin_lat: float = None,
    origin_lng: float = None,
    language_code: str = "en-US",
):
    if not API_KEY:
        raise ValueError("Google Maps API key not found")

    if (origin_lat is None) != (origin_lng is None):
        raise ValueError("Both origin latitude and longitude are required")

    supported_languages = {"en-US", "hi-IN", "mr-IN"}
    if language_code not in supported_languages:
        language_code = "en-US"

    if origin_lat is not None:
        origin_data = {
            "location": {
                "latLng": {
                    "latitude": origin_lat,
                    "longitude": origin_lng,
                }
            }
        }
    else:
        origin_data = {"address": origin}

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": (
            "routes.duration,"
            "routes.staticDuration,"
            "routes.distanceMeters,"
            "routes.routeLabels,"
            "routes.polyline.encodedPolyline,"
            "routes.legs.steps.distanceMeters,"
            "routes.legs.steps.navigationInstruction.instructions,"
            "routes.legs.steps.navigationInstruction.maneuver,"
            "routes.legs.steps.startLocation.latLng,"
            "routes.legs.steps.endLocation.latLng"
        ),
    }

    request_data = {
        "origin": origin_data,
        "destination": {"address": destination},
        "travelMode": "DRIVE",
        "routingPreference": "TRAFFIC_AWARE",
        "computeAlternativeRoutes": True,
        "languageCode": language_code,
        "units": "METRIC",
    }

    response = requests.post(
        ROUTES_URL,
        headers=headers,
        json=request_data,
        timeout=30,
    )

    if not response.ok:
        try:
            detail = response.json().get("error", {}).get("message")
        except ValueError:
            detail = response.text

        raise ValueError(
            f"Google Routes API error ({response.status_code}): "
            f"{detail or 'Request failed'}"
        )

    result = response.json()

    if not result.get("routes"):
        return {"error": "No route found"}

    def extract_location(location_data):
        lat_lng = (location_data or {}).get("latLng", {})

        latitude = lat_lng.get("latitude")
        longitude = lat_lng.get("longitude")

        if latitude is None or longitude is None:
            return None

        return {
            "lat": latitude,
            "lng": longitude,
        }

    routes = []

    for index, route in enumerate(result["routes"]):
        distance_km = route.get("distanceMeters", 0) / 1000

        traffic_seconds = int(
            route.get("duration", "0s").replace("s", "")
        )
        normal_seconds = int(
            route.get("staticDuration", "0s").replace("s", "")
        )

        traffic_time_min = round(traffic_seconds / 60)
        normal_time_min = round(normal_seconds / 60)
        delay_min = max(0, traffic_time_min - normal_time_min)

        if delay_min >= 15:
            traffic_status = "HIGH"
        elif delay_min >= 5:
            traffic_status = "MODERATE"
        else:
            traffic_status = "LOW"

        labels = route.get("routeLabels") or ["ALTERNATIVE_ROUTE"]

        encoded_polyline = (
            route.get("polyline", {}).get("encodedPolyline")
        )

        steps = []

        for leg in route.get("legs", []):
            for step in leg.get("steps", []):
                instruction_data = step.get(
                    "navigationInstruction", {}
                )

                instruction = instruction_data.get("instructions")

                if instruction:
                    steps.append({
                        "instruction": instruction,
                        "maneuver": instruction_data.get("maneuver", ""),
                        "distance_meters": step.get("distanceMeters", 0),
                        "start_location": extract_location(
                            step.get("startLocation")
                        ),
                        "end_location": extract_location(
                            step.get("endLocation")
                        ),
                    })

        routes.append({
            "route_number": index + 1,
            "route_type": labels[0],
            "distance_km": round(distance_km, 2),
            "traffic_time_min": traffic_time_min,
            "normal_time_min": normal_time_min,
            "traffic_delay_min": delay_min,
            "traffic_status": traffic_status,
            "encoded_polyline": encoded_polyline,
            "steps": steps,
        })

    best_route = min(
        routes,
        key=lambda item: (
            item["traffic_delay_min"],
            item["traffic_time_min"],
        ),
    )

    return {
        "origin": origin,
        "destination": destination,
        "language_code": language_code,
        "total_routes_found": len(routes),
        "routes": routes,
        "recommended_route": best_route,
    }
