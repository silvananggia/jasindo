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
      `SELECT id, nik, idpetak, luas FROM petak_user WHERE idpetak = $1`,
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
      `DELETE FROM petak_user WHERE idpetak = $1 RETURNING id, nik, idpetak, luas`,
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
};

