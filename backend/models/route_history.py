from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

from backend.database import Base


class RouteHistory(Base):
    __tablename__ = "route_history"

    id = Column(Integer, primary_key=True, index=True)

    origin = Column(String)
    destination = Column(String)

    distance_km = Column(Float)
    traffic_time_min = Column(Integer)
    normal_time_min = Column(Integer)

    traffic_delay_min = Column(Integer)
    traffic_status = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)