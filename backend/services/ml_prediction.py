import joblib
import os

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "traffic_model.pkl"
)

model = joblib.load(MODEL_PATH)


def predict_traffic(
    distance_km: float,
    normal_time_min: int,
    traffic_delay_min: int
):

    prediction = model.predict([
        [
            distance_km,
            normal_time_min,
            traffic_delay_min
        ]
    ])

    return prediction[0]