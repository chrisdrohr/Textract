import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as vision from '@google-cloud/vision';

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://textract-fe8e3.firebaseio.com/'
});

const visionClient = new vision.ImageAnnotatorClient();


exports.extractText = functions.storage.object().onMetadataUpdate(async object => {
  const text = [];
  const url = `gs://${object.bucket}/${object.name}`;
  const uid = object.metadata.uid;
  const [result] = await visionClient.textDetection(url);
  const detections = result.textAnnotations;
  await detections.forEach(val => {
    text.push(val.description);
  });
  return admin
    .database()
    .ref(uid)
    .set({
      filename: object.name,
      text:
        detections.length !== 0
          ? text
          : "Oops! There doesn't appear to be any text in this image"
    })
    .then(() => {
      return admin
        .storage()
        .bucket(object.bucket)
        .file(object.name)
        .delete();
    });
});
