const db = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { promisify } = require('util');
const axios = require("axios");
const { v4: uuidv4 } = require('uuid');

exports.savePetakUser = async (req, res) => {
  const percils = req.body; // Array of percils

  if (!Array.isArray(percils) || percils.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty list of percils' });
  }

  // Extract all idpetak from the incoming batch
  const idpetakList = percils.map(p => p.idpetak);

  // Check for duplicate idpetak globally in petak_user
  try {
    const checkQuery = `SELECT idpetak FROM petak_user WHERE idpetak = ANY($1)`;
    const checkResult = await db.query(checkQuery, [idpetakList]);
    if (checkResult.rows.length > 0) {
      const existing = checkResult.rows.map(r => r.idpetak);
      return res.status(409).json({ error: 'Duplicate idpetak found', duplicates: existing });
    }
  } catch (error) {
    console.error('Error checking duplicate idpetak:', error);
    return res.status(500).json({ error: 'Database error during duplicate check' });
  }

  const insertValues = [];
  const insertQueryParts = [];

  // Loop through each percils and prepare the values for insertion
  percils.forEach((percils, index) => {
    const { nik, idpetak, luas, geometry } = percils;

    if (!nik || !idpetak || !luas || !geometry) {
      return res.status(400).json({ error: `Missing required fields in percils ${index + 1}` });
    }

    const id = uuidv4(); // Generate a unique UUID for each percils

    // Prepare the query part and corresponding values for batch insert
    insertValues.push(id, nik, idpetak, luas, JSON.stringify(geometry));
    insertQueryParts.push(`($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, ST_GeomFromGeoJSON($${index * 5 + 5}))`);
  });

  const insertQuery = `
      INSERT INTO petak_user (id, nik, idpetak, luas, geometry)
      VALUES ${insertQueryParts.join(', ')}
  `;

  try {
    // Execute the batch insert query
    await db.query(insertQuery, insertValues);

    res.status(201).json({ message: `${percils.length} percils saved successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.listPetakUser = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await db.query(
      `
    SELECT petak_user.id AS id, luas, idpetak
    FROM petak_user
    WHERE petak_user.nik=$1
    `,
      [id]
    );

    res.json({
      code: 200,
      status: "success",
      data: result.rows,
    });

  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({
      code: 500,
      status: "error",
      data: "Internal Server Error",
    });
  }
};

exports.pointPetakUser = async (req, res) => {
  try {
    const id = req.params.id;
  
    const result = await db.query(
      `
      SELECT 
        petak_user.id AS id, 
        luas, 
        ST_Transform(ST_SetSRID(ST_Centroid(geometry), 3857), 4326)::json AS geometry
      FROM petak_user
      WHERE petak_user.id = $1
      `,
      [id]
    );
  
    res.json({
      code: 200,
      status: "success",
      data: result.rows,
    });
  
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({
      code: 500,
      status: "error",
      data: "Internal Server Error",
    });
  }
  
};

exports.listPointPetakUser = async (req, res) => {
  try {
    const id = req.params.id;
  
    const result = await db.query(
      `
      SELECT 
        petak_user.id AS id, 
        luas, 
        ST_Transform(ST_SetSRID(ST_Centroid(geometry), 3857), 4326)::json AS geometry
      FROM petak_user
      WHERE petak_user.nik = $1
      `,
      [id]
    );
  
    res.json({
      code: 200,
      status: "success",
      data: result.rows,
    });
  
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({
      code: 500,
      status: "error",
      data: "Internal Server Error",
    });
  }
  
};

exports.petakId = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await db.query(
      `
    SELECT petak_user.id, idpetak
    FROM petak_user
    WHERE petak_user.idpetak=$1
    `,
      [id]
    );

    res.json({
      code: 200,
      status: "success",
      data: result.rows,
    });

  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({
      code: 500,
      status: "error",
      data: "Internal Server Error",
    });
  }
};

exports.deletePetakUser = async (req, res) => {
  try {
    const idpetak = req.params.id;

    // First check if the petak exists
    const checkResult = await db.query(
      `SELECT id, nik, idpetak, luas FROM petak_user WHERE id = $1`,
      [idpetak]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        status: "error",
        data: "Petak not found",
      });
    }

    // Delete the petak
    const deleteResult = await db.query(
      `DELETE FROM petak_user WHERE id = $1 RETURNING id, nik, idpetak, luas`,
      [idpetak]
    );

    res.json({
      code: 200,
      status: "success",
      data: {
        message: "Petak deleted successfully",
        deletedPetak: deleteResult.rows[0]
      },
    });

  } catch (error) {
    console.error("Error deleting petak:", error);
    res.status(500).json({
      code: 500,
      status: "error",
      data: "Internal Server Error",
    });
  }
}

exports.centerPetakUser = async (req, res) => {
  try {
    const nik = req.params.id;

    // Get the center point and extent of all petak for the user
    const result = await db.query(
      `
      SELECT 
        ST_AsGeoJSON(ST_Centroid(ST_Collect(geometry)))::json AS center,
        ST_AsGeoJSON(ST_Envelope(ST_Collect(geometry)))::json AS extent,
        COUNT(*) AS petak_count,
        SUM(luas) AS total_area
      FROM petak_user
      WHERE nik = $1
      `,
      [nik]
    );

    if (result.rows.length === 0 || result.rows[0].petak_count === '0') {
      return res.status(404).json({
        code: 404,
        status: "error",
        data: "No petak data found for this user",
      });
    }

    const data = result.rows[0];
    
    res.json({
      code: 200,
      status: "success",
      data: {
        center: data.center,
        extent: data.extent,
        petak_count: parseInt(data.petak_count),
        total_area: parseFloat(data.total_area),
        bounds: {
          minX: data.extent.coordinates[0][0][0],
          minY: data.extent.coordinates[0][0][1],
          maxX: data.extent.coordinates[0][2][0],
          maxY: data.extent.coordinates[0][2][1]
        }
      },
    });

  } catch (error) {
    console.error("Error getting petak center:", error);
    res.status(500).json({
      code: 500,
      status: "error",
      data: "Internal Server Error",
    });
  }
};

exports.getPetakById = async (req, res) => {
  try {
    const petakId = req.params.id;

    // Get the exact petak by ID with geometry for precise zooming
    const result = await db.query(
      `
      SELECT 
        id,
        idpetak,
        nik,
        luas,
        ST_AsGeoJSON(ST_Transform(geometry, 4326))::json AS geometry,
        ST_AsGeoJSON(ST_Centroid(ST_Transform(geometry, 4326)))::json AS center,
        ST_AsGeoJSON(ST_Envelope(ST_Transform(geometry, 4326)))::json AS extent
      FROM petak_user
      WHERE id = $1
      `,
      [petakId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        status: "error",
        data: "Petak not found",
      });
    }

    const data = result.rows[0];
    
    res.json({
      code: 200,
      status: "success",
      data: {
        id: data.id,
        idpetak: data.idpetak,
        nik: data.nik,
        luas: parseFloat(data.luas),
        geometry: data.geometry,
        center: data.center,
        extent: data.extent,
        bounds: {
          minX: data.extent.coordinates[0][0][0],
          minY: data.extent.coordinates[0][0][1],
          maxX: data.extent.coordinates[0][2][0],
          maxY: data.extent.coordinates[0][2][1]
        }
      },
    });

  } catch (error) {
    console.error("Error getting petak by ID:", error);
    res.status(500).json({
      code: 500,
      status: "error",
      data: "Internal Server Error",
    });
  }
};

