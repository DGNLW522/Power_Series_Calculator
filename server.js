const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json()); 

const pool = mysql.createPool({
  host: 'localhost',  
  user: 'root',  
  password: 'root', 
  database: 'ad-hoc',
});

app.post('/store-number', async (req, res) => {
  try {
    const { number } = req.body;

    if (number < 1 || number > 11) {
      return res.status(400).json({ error: 'Number must be between 1 and 10' });
    }

    const connection = await pool.getConnection();
    const query = 'INSERT INTO user_input (number) VALUES (?)';
    await connection.execute(query, [number]);

    // Call the stored procedure to calculate and store the power series
    const calculatePowerSeriesQuery = 'CALL calculate_power_series(?)';
    await connection.execute(calculatePowerSeriesQuery, [number]);

    connection.release();

    res.status(200).json({ message: 'Number and power series stored successfully' });
  } catch (error) {
    console.error('Error storing number and power series:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/power-series/:base', async (req, res) => {
  try {
    const base = parseInt(req.params.base);

    if (base < 1 || base > 11) {
      return res.status(400).json({ error: 'Base must be between 1 and 10' });
    }

    const connection = await pool.getConnection();
    const query = 'SELECT exponent, result FROM power_series WHERE base = ?';
    const [rows] = await connection.execute(query, [base]);
    connection.release();

    const series = rows.map((row) => row.result);

    res.status(200).json({ series });
  } catch (error) {
    console.error('Error retrieving power series:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

 