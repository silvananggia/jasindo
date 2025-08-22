import geopandas as gpd
from shapely.errors import GEOSException
from sqlalchemy import create_engine

# Path to your Shapefile
shapefile_path = "./petak_sawah/petak_sawah.shp"

# PostGIS connection parameters
db_user = "postgres"
db_password = "password"
db_host = "localhost"
db_port = "5432"
db_name = "jasindogis"
table_name = "petak_sawah"

# Read the shapefile
try:
    gdf = gpd.read_file(shapefile_path)
except GEOSException as e:
    print("Error saat membaca shapefile:", e)
    exit()

# Optional: ensure CRS is in EPSG:4326 (WGS 84)
gdf = gdf.to_crs(epsg=4326)

# Fix invalid geometries
gdf["geometry"] = gdf["geometry"].buffer(0)

# Optional: Drop remaining invalid geometries
gdf = gdf[gdf.is_valid]

# Create SQLAlchemy engine
engine = create_engine(f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}")

# Export to PostGIS
gdf.to_postgis(table_name, engine, if_exists="replace", index=False)

print(f"Shapefile imported to table '{table_name}' in PostGIS.")
