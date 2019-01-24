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

const Firebase = (() => {
  let instance;

  const init = () => {
    try {
      firebase.initializeApp(config);
      let features = [
        'auth',
        'database',
        //  'messaging',
        'storage'
      ].filter(feature => typeof firebase[feature] === 'function');
      console.log(`Firebase SDK loaded with ${features.join(', ')}`);
      return {
        auth: firebase.auth(),
        database: firebase.database(),
        storage: firebase.storage(),
        signIn: () => {
          return new Promise((resolve, reject) => {
            firebase.auth().signInAnonymously();
            firebase.auth().onAuthStateChanged(user => {
              if (user) {
                console.log('User is signed in', user.uid);
                resolve(user.uid);
              } else {
                console.log('User is signed out');
                reject();
              }
            });
          });
        },
        storageUpload: (name, string, uid) => {
          return new Promise((resolve, reject) => {
            const storageRef = firebase
              .storage()
              .ref()
              .child(name);
            const metadata = {
              customMetadata: {
                uid: uid
              }
            };
            const uploadTask = storageRef.putString(string, 'data_url');
            console.group('%cImage Upload', 'color: blue');
            uploadTask.on(
              'state_changed',
              snapshot => {
                let progress =
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
              },
              error => {
                console.log(error);
              },
              () => {
                storageRef
                  .updateMetadata(metadata)
                  .then(() => {
                    resolve();
                  })
                  .catch(error => reject(error));
              }
            );
            console.groupEnd();
          });
        }
      };
    } catch (e) {
      console.error(e);
      console.log('Error loading the Firebase SDK, check the console.');
    }
  };

  return {
    init: () => {
      if (!instance) {
        instance = init();
      }
      return instance;
    }
  };
})();
export default Firebase.init();

// export const auth = firebase.auth();
// export const database = firebase.database();
// export const storage = firebase.storage();

// export const signIn = async () => {
//   auth.signInAnonymously();
//   auth.onAuthStateChanged(user => {
//     if (user) {
//       console.log('User is signed in', user.uid);
//       return user.uid;
//     } else {
//       console.log('User is signed out');
//       return null;
//     }
//   });
// };
