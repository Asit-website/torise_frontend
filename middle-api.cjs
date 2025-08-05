// Middle-layer API for external use with Swagger
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Frontend Middle Layer API',
    version: '1.0.0',
    description: 'API documentation for external use',
  },
  servers: [
    { url: 'http://localhost:5001', description: 'Local server' },
  ],
};
const options = {
  swaggerDefinition,
  apis: ['./middle-api.cjs'],
};
const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/bots/lookup/{dnis}:
 *   get:
 *     summary: Lookup bot details by DNIS
 *     parameters:
 *       - in: path
 *         name: dnis
 *         required: true
 *         schema:
 *           type: string
 *         description: DNIS to lookup
 *     responses:
 *       200:
 *         description: Bot details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Bot not found
 */
app.get('/api/admin/bots/lookup/:dnis', async (req, res) => {
  try {
    const { dnis } = req.params;
    const response = await axios.get(`http://localhost:5000/api/admin/bots/lookup/${dnis}`);
    res.json(response.data);
  } catch (err) {
    res.status(404).json({ error: 'Bot not found', details: err.message });
  }
});

/**
 * @swagger
 * /api/reports/entry:
 *   post:
 *     summary: Make an entry in the conversation/report table
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Report entry created
 *       400:
 *         description: Invalid input
 */
app.post('/api/reports/entry', async (req, res) => {
  try {
    const response = await axios.post('http://localhost:5000/api/reports/entry', req.body);
    res.json(response.data);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create report entry', details: err.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Middle-layer API running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
