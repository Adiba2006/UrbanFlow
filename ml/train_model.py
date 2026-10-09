import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

DATASET_PATH = "urbanflow_dataset.csv"

df = pd.read_csv(DATASET_PATH)

# Remove records without timestamp
df = df.dropna(subset=["created_at"])

# Features
X = df[
    [
        "distance_km",
        "normal_time_min",
        "traffic_delay_min"
    ]
]

# Target
y = df["traffic_status"]

# Check if enough classes exist
print("Class distribution:")
print(y.value_counts())

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.4,
    random_state=42,
    stratify=y
)

# Create model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

# Train
model.fit(X_train, y_train)

# Predict
predictions = model.predict(X_test)

# Accuracy
accuracy = accuracy_score(y_test, predictions)

print("\nModel Accuracy:", round(accuracy * 100, 2), "%")

# Save model
joblib.dump(model, "traffic_model.pkl")

print("\nModel saved successfully!")