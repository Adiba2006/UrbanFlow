from fastapi import FastAPI
from backend.database import Base, engine, SessionLocal
from backend.models.traffic import TrafficData
from backend.models.route_history import RouteHistory
from backend.services.traffic_api import get_live_route
from fastapi.responses import FileResponse
from backend.services.ml_prediction import predict_traffic
from fastapi.middleware.cors import CORSMiddleware
import csv
import os
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://urban-flow-new.vercel.app"
],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "UrbanFlow API is running 🚦"
    }


@app.get("/traffic")
def get_traffic():
    return {
        "location": "Nagpur",
        "traffic_level": "High",
        "vehicle_count": 1240,
        "average_speed": 24,
        "congestion": 78
    }


@app.post("/traffic")
def create_traffic():
    db = SessionLocal()

    traffic = TrafficData(
        location="Nagpur",
        traffic_level="High",
        vehicle_count=1240,
        average_speed=24,
        congestion=78
    )

    db.add(traffic)
    db.commit()
    db.refresh(traffic)
    db.close()

    return {
        "message": "Traffic data saved successfully",
        "id": traffic.id
    }

@app.get("/route")
def get_route(
    origin: str,
    destination: str,
    origin_lat: float = None,
    origin_lng: float = None,
    language_code: str = "en-US",
):
    result = get_live_route(
        origin=origin,
        destination=destination,
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        language_code=language_code,
    )

    if "error" in result:
        return result

    db = SessionLocal()

    try:
        for route in result["routes"]:
            prediction = predict_traffic(
                route["distance_km"],
                route["normal_time_min"],
                route["traffic_delay_min"],
            )

            route["predicted_traffic_status"] = prediction

            history = RouteHistory(
                origin=result["origin"],
                destination=result["destination"],
                distance_km=route["distance_km"],
                traffic_time_min=route["traffic_time_min"],
                normal_time_min=route["normal_time_min"],
                traffic_delay_min=route["traffic_delay_min"],
                traffic_status=prediction,
            )

            db.add(history)

        best_route = min(
            result["routes"],
            key=lambda route: (
                route["traffic_delay_min"],
                route["traffic_time_min"],
            ),
        )

        result["recommended_route"] = best_route

        db.commit()
        return result

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
@app.get("/route-history")
def get_route_history(
    origin: str = None,
    destination: str = None
):
    db = SessionLocal()

    query = db.query(RouteHistory)

    if origin:
        query = query.filter(RouteHistory.origin == origin)

    if destination:
        query = query.filter(RouteHistory.destination == destination)

    history = query.all()

    db.close()

    return history
@app.get("/route-analytics")
def get_route_analytics(
    origin: str = None,
    destination: str = None
):
    db = SessionLocal()

    query = db.query(RouteHistory)

    if origin:
        query = query.filter(RouteHistory.origin == origin)

    if destination:
        query = query.filter(RouteHistory.destination == destination)

    history = query.all()

    db.close()

    if not history:
        return {
            "message": "No route history found"
        }

    total_routes = len(history)

    total_delay = sum(
        route.traffic_delay_min or 0
        for route in history
    )

    average_delay = total_delay / total_routes

    high_traffic = sum(
        1 for route in history
        if route.traffic_status == "HIGH"
    )

    moderate_traffic = sum(
        1 for route in history
        if route.traffic_status == "MODERATE"
    )

    low_traffic = sum(
        1 for route in history
        if route.traffic_status == "LOW"
    )

    return {
        "origin": origin,
        "destination": destination,
        "total_records": total_routes,
        "average_delay_min": round(average_delay, 2),
        "high_traffic_records": high_traffic,
        "moderate_traffic_records": moderate_traffic,
        "low_traffic_records": low_traffic
    }
@app.get("/ml-data")
def get_ml_data():
    db = SessionLocal()

    history = db.query(RouteHistory).all()

    db.close()

    if not history:
        return {
            "message": "No historical data available"
        }

    dataset = []

    for route in history:
        dataset.append({
            "distance_km": route.distance_km,
            "normal_time_min": route.normal_time_min,
            "traffic_delay_min": route.traffic_delay_min,
            "traffic_status": route.traffic_status
        })

    return {
        "total_records": len(dataset),
        "data": dataset
    }

@app.get("/export-dataset")
def export_dataset():

    db = SessionLocal()

    history = db.query(RouteHistory).all()

    db.close()

    if not history:
        return {
            "message": "No historical data available"
        }

    file_path = "urbanflow_dataset.csv"

    with open(file_path, "w", newline="") as file:

        writer = csv.writer(file)

        writer.writerow([
            "distance_km",
            "normal_time_min",
            "traffic_delay_min",
            "traffic_status",
            "created_at"
        ])

        for route in history:

            writer.writerow([
                route.distance_km,
                route.normal_time_min,
                route.traffic_delay_min,
                route.traffic_status,
                route.created_at
            ])

    return FileResponse(
        file_path,
        media_type="text/csv",
        filename="urbanflow_dataset.csv"
    )
@app.get("/predict-traffic")
def predict_traffic_level(
    distance_km: float,
    normal_time_min: int,
    traffic_delay_min: int
):

    prediction = predict_traffic(
        distance_km,
        normal_time_min,
        traffic_delay_min
    )

    return {
        "distance_km": distance_km,
        "normal_time_min": normal_time_min,
        "traffic_delay_min": traffic_delay_min,
        "predicted_traffic_status": prediction
    }