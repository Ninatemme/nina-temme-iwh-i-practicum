require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const HUBSPOT_OBJECT = process.env.HUBSPOT_CUSTOM_OBJECT;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const hs = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

async function fetchCustomObjects(properties = ['name', 'animal', 'birth_country']) {
  const params = new URLSearchParams();
  properties.forEach((p) => params.append('properties', p));
  params.append('limit', '50');

  const url = `/crm/v3/objects/${HUBSPOT_OBJECT}?${params.toString()}`;
  const res = await hs.get(url);
  return res.data.results || [];
}

app.get('/', async (req, res) => {
  try {
    const rows = await fetchCustomObjects(['name', 'animal', 'birth_country']);
    res.render('homepage', {
      title: 'Homepage | Integrating With HubSpot I Practicum',
      rows,
    });
  } catch (err) {
    console.error('Fetch error:', err?.response?.data || err.message);
    res.status(500).send('Error fetching custom objects.');
  }
});

app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update HubSpot Pets | Integrating With HubSpot I Practicum',
  });
});

app.post('/update-cobj', async (req, res) => {
  try {
    const { name, animal, birth_country } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).send('Name is required');
    }

    const payload = {
      properties: {
        name: name.trim(),
        animal: animal || '',
        birth_country: birth_country || '',
      },
    };

    await hs.post(`/crm/v3/objects/${HUBSPOT_OBJECT}`, payload);
    res.redirect('/');
  } catch (err) {
    console.error('Create error:', err?.response?.data || err.message);
    res.status(500).send('Error creating record.');
  }
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
