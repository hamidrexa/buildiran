const fs = require('fs');
const path = require('path');

const geojsonPath = path.join(__dirname, '../assets/maps/Tehran Districts.geojson');
const outSqlPath = path.join(__dirname, '../update_neighborhood_areas.sql');

if (!fs.existsSync(geojsonPath)) {
  console.error('GeoJSON file not found at:', geojsonPath);
  process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

let sql = `-- ============================================================
-- BuildIran — Neighborhood Area SQL Calculation
-- Auto-generated from Tehran Districts.geojson
-- Note: Requires PostGIS extension enabled in Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

`;

let count = 0;

for (const feature of geojson.features) {
  if (!feature.geometry || !feature.properties) continue;
  
  // The ID in DB is typically formed like tehran_dist_{area_number}_{nameFa}
  // Let's look at existing data in Supabase Schema.sql or tehran_districts_migration.sql
  // properties usually have REGION or Name
  const nameFa = feature.properties.name;
  const region = feature.properties.area_number;
  
  if (nameFa && region) {
    const dbId = `tehran_dist_${region}_${nameFa.trim().replace(/\s+/g, ' ')}`;
    const geometryStr = JSON.stringify(feature.geometry).replace(/'/g, "''");
    
    // ST_Area on geography returns square meters. Divide by 1,000,000 for sqkm.
    sql += `UPDATE public.neighborhoods 
SET area_sqkm = ST_Area(ST_GeomFromGeoJSON('${geometryStr}')::geography) / 1000000 
WHERE id = '${dbId}';\n\n`;
    count++;
  }
}

fs.writeFileSync(outSqlPath, sql, 'utf8');
console.log(`Successfully generated SQL script for ${count} neighborhoods at ${outSqlPath}`);
