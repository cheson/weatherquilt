from sqlalchemy import Column, Integer, Numeric, Date, String
from db.database import Base

class WeatherByDay(Base):
    __tablename__ = "weatherByDay"
    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, index=True)
    station_id = Column(String)
    date = Column(Date, index=True)
    minTemp = Column(Numeric)
    maxTemp = Column(Numeric)
    precipitation = Column(Numeric(5, 2))
