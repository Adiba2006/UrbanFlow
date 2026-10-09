from sqlalchemy import Column, Integer, String, Float
from backend.database import Base


class TrafficData(Base):
    __tablename__ = "traffic_data"

    id = Column(Integer, primary_key=True, index=True)
    location = Column(String, index=True)
    traffic_level = Column(String)
    vehicle_count = Column(Integer)
    average_speed = Column(Float)
    congestion = Column(Float)