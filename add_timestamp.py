import sqlite3

connection = sqlite3.connect("urbanflow.db")

connection.execute(
    "ALTER TABLE route_history ADD COLUMN created_at DATETIME"
)

connection.commit()
connection.close()

print("created_at column added successfully!")