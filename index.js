const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

const firebaseCredentials = {
  "type": process.env.FIREBASE_TYPE,
  "project_id": process.env.FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY,
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": process.env.FIREBASE_AUTH_URI,
  "token_uri": process.env.FIREBASE_TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL,
  "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(firebaseCredentials)
});

const db = admin.firestore();
const URL_NAMESPACE = 'urls';
const app = express();
const server = http.createServer(app);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/ping', (req, res) => {
  res.status(200).json({
    message: 'Pong',
    ip: req.ip
  });
});

app.post('/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body;
    const shortUrl = shortid.generate();
    const entry = db.collection(URL_NAMESPACE).doc();
    const data = {
      'short_url': shortUrl,
      'long_url': longUrl,
      'clicks': 0,
    };
    await entry.set(data);
    res.status(201).json({ shortUrl });
  } catch (error) {
    console.log(`Failed to generate url::: ${error}`);
    return res.status(500).json({
      message: `Failed to generate url`,
      error: error,
    });
  }
});

app.get('/:shortUrl', async (req, res) => {
  try {
    const { shortUrl } = req.params;
    const querySnapshot = await db.collection(URL_NAMESPACE)
      .where('short_url', '==', shortUrl)
      .get();
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data()['long_url'];
    //   res.redirect(data);
    return res.status(200).json({
        longUrl: data,
    })
    } else {
      return res.status(404).json({
        message: `url not found`
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
});

const PORT = parseInt(process.env.PORT, 10) || 3000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
