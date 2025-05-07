// index.js
require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

/**
 * Poll an Azure long-running job until it succeeds or fails.
 * @param {string} operationLocation URL from the Operation-Location header
 * @returns {Promise<Array>} array of summary document objects
 */
async function pollForResult(operationLocation) {
  while (true) {
    const resp = await axios.get(operationLocation, {
      headers: { 'Ocp-Apim-Subscription-Key': process.env.AZURE_KEY }
    });
    const job = resp.data;
    console.log('Full job response:', JSON.stringify(job, null, 2));

    if (job.status === 'succeeded') {
      const docs = job.tasks?.items?.[0]?.results?.documents;
      if (!docs) {
        throw new Error('Could not find summary documents in job response');
      }
      return docs;
    }

    if (job.status === 'failed') {
      throw new Error('Summarization job failed');
    }

    await new Promise(r => setTimeout(r, 1000));
  }
}

app.post('/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res
      .status(400)
      .json({ error: 'Request must include a string "text" field.' });
  }

  try {
    const submitUrl = `${process.env.AZURE_ENDPOINT}/language/analyze-text/jobs?api-version=2023-04-15-preview`;
    const payload = {
      analysisInput: {
        documents: [{ id: '1', language: 'en', text }]
      },
      tasks: [
        {
          kind: 'ExtractiveSummarization',
          parameters: { sentenceCount: 3 }
        }
      ]
    };

    const submitResp = await axios.post(submitUrl, payload, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_KEY,
        'Content-Type': 'application/json'
      }
    });

    const operationLocation = submitResp.headers['operation-location'];
    if (!operationLocation) {
      throw new Error('Missing Operation-Location header in Azure response.');
    }
    console.log('Polling URL:', operationLocation);

    const docs = await pollForResult(operationLocation);

    const summaryText = docs[0].sentences.map(s => s.text).join(' ');
    return res.json({ summary: summaryText });

  } catch (err) {
    console.error('Azure API error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Summarization failed.',
      details: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
