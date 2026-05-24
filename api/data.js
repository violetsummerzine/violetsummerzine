const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

const TABLES = {
  feedback: process.env.AIRTABLE_FEEDBACK_TABLE || 'Feedback',
  decisions: process.env.AIRTABLE_DECISION_TABLE || 'Decisions',
  brief: process.env.AIRTABLE_BRIEF_TABLE || 'Briefs',
};

function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function airtableRequest(path, options = {}) {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key || !process.env.AIRTABLE_BASE_ID) {
    throw new Error('Missing Airtable config. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.');
  }

  const response = await fetch(`${AIRTABLE_API_URL}/${process.env.AIRTABLE_BASE_ID}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Airtable request failed');
  }

  return data;
}

export default async function handler(req, res) {
  try {
    const { type } = req.query;
    if (!TABLES[type]) return json(res, 400, { error: 'Invalid type' });

    if (req.method === 'GET') {
      const data = await airtableRequest(`${encodeURIComponent(TABLES[type])}?maxRecords=100`);
      return json(res, 200, data.records || []);
    }

    if (req.method === 'POST') {
      const data = await airtableRequest(encodeURIComponent(TABLES[type]), {
        method: 'POST',
        body: JSON.stringify({ fields: req.body || {} }),
      });
      return json(res, 201, data);
    }

    if (req.method === 'PATCH') {
      const { id, fields } = req.body || {};
      if (!id || !fields) return json(res, 400, { error: 'id and fields are required' });
      const data = await airtableRequest(`${encodeURIComponent(TABLES[type])}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      });
      return json(res, 200, data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return json(res, 400, { error: 'id is required' });
      const data = await airtableRequest(`${encodeURIComponent(TABLES[type])}/${id}`, { method: 'DELETE' });
      return json(res, 200, data);
    }

    return json(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
}
