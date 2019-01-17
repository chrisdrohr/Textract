import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/storage';

var config = {
  apiKey: 'AIzaSyBLZVjzJzb0CYvMTQ-tAw2feCZIFGRfeFQ',
  authDomain: 'textract-fe8e3.firebaseapp.com',
  databaseURL: 'https://textract-fe8e3.firebaseio.com',
  projectId: 'textract-fe8e3',
  storageBucket: 'textract-fe8e3.appspot.com',
  messagingSenderId: '835413394534'
};
try {
  firebase.initializeApp(config);
  let features = [
    'auth',
    'database',
    //  'messaging',
    'storage'
  ].filter(feature => typeof firebase[feature] === 'function');
  console.log(`Firebase SDK loaded with ${features.join(', ')}`);
} catch (e) {
  console.error(e);
  console.log('Error loading the Firebase SDK, check the console.');
}

export const auth = firebase.auth();
export const database = firebase.database();
export const storage = firebase.storage();
