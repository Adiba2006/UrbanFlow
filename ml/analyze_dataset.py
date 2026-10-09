import pandas as pd

DATASET_PATH = "urbanflow_dataset.csv"

df = pd.read_csv(DATASET_PATH)

print("\nUrbanFlow Dataset")
print("-----------------")

print("Total records:", len(df))

print("\nColumns:")
print(df.columns.tolist())

print("\nDataset:")
print(df)

print("\nMissing values:")
print(df.isnull().sum())

print("\nTraffic status distribution:")
print(df["traffic_status"].value_counts())

print("\nAverage traffic delay:",
      round(df["traffic_delay_min"].mean(), 2),
      "minutes")