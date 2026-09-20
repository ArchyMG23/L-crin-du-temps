import config from '../firebase-applet-config.json' with { type: 'json' };

async function checkRest() {
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/products?key=${config.apiKey}`;
  console.log('Fetching:', url);
  const res = await fetch(url);
  console.log('Status:', res.status, res.statusText);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

checkRest().catch(console.error);
