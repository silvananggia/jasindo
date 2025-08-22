const db = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { promisify } = require('util');
const axios = require("axios");
const { v4: uuidv4 } = require('uuid');

exports.savePetakKlaim = async (req, res) => {
  const percils = req.body; // Array of percils

  if (!Array.isArray(percils) || percils.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty list of percils' });
  }

  const insertValues = [];
  const insertQueryParts = [];

  // Loop through each percils and prepare the values for insertion
  percils.forEach((percils, index) => {
    const { nik, nopolis, idpetak, luas, geometry } = percils;

    if (!nik || !nopolis || !idpetak || !luas || !geometry) {
      return res.status(400).json({ error: `Missing required fields in percils ${index + 1}` });
    }

    const id = uuidv4(); // Generate a unique UUID for each percils

    // Prepare the query part and corresponding values for batch insert
    insertValues.push(id, nik, nopolis, idpetak, luas, JSON.stringify(geometry));
    insertQueryParts.push(`($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, ST_GeomFromGeoJSON($${index * 6 + 6}))`);
  });

  const insertQuery = `
      INSERT INTO petak_klaim (id, nik, nopolis, idpetak, luas, geometry)
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


exports.listPetakKlaim = async (req, res) => {
  try {
    const id = req.params.id;
    const nopolis = req.params.nopolis;

    const result = await db.query(
      `
  SELECT petak_klaim.id AS id, petak_klaim.luas, petak_user.id as idpuser, petak_user.idpetak AS idpetak 
    FROM petak_klaim
    JOIN petak_user ON petak_klaim.idpetak = petak_user.id
    WHERE petak_klaim.nik=$1 and petak_klaim.nopolis=$2
    `,
      [id, nopolis]
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

exports.deletePetakKlaim = async (req, res) => {
  try {
    const idpetak = req.params.id;

    // First check if the klaim exists
    const checkResult = await db.query(
      `SELECT id, nik, nopolis, idpetak, luas FROM petak_klaim WHERE idpetak = $1`,
      [idpetak]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        code: 404,
        status: "error",
        data: "Klaim not found",
      });
    }

    // Delete the klaim
    const deleteResult = await db.query(
      `DELETE FROM petak_klaim WHERE idpetak = $1 RETURNING id, nik, nopolis, idpetak, luas`,
      [idpetak]
    );

    res.json({
      code: 200,
      status: "success",
      data: {
        message: "Klaim deleted successfully",
        deletedKlaim: deleteResult.rows[0]
      },
    });

  } catch (error) {
    console.error("Error deleting klaim:", error);
    res.status(500).json({
      code: 500,
      status: "error",
      data: "Internal Server Error",
    });
  }
};

exports.klaimId = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await db.query(
      `
    SELECT petak_klaim.id, idpetak
    FROM petak_klaim
    WHERE petak_klaim.idpetak=$1
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