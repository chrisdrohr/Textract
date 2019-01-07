(function() {
  'use strict';
  var app = {
    firebase: null,
    fileButton: document.getElementById('fileButton'),
    addToHomeScreenButton: document.getElementById('addToHomeScreen'),
    fileInput: document.querySelector('#file'),
    image: document.querySelector('.image'),
    displayCard: document.querySelector('.display'),
    scanner: document.querySelector('.scanner'),
    textCard: document.querySelector('.text'),
    text: document.querySelector('#text'),
    textTitle: document.querySelector('#textTitle'),
    uploader: document.querySelector('.uploader'),
    snackBar: document.querySelector('.snackBar'),
    snackBarText: document.querySelector('.snackBar-text'),
    snackBarButton: document.querySelector('.snackBar-button'),
    isLoading: true,
    isProcessing: false,
    spinner: document.querySelector('.loader'),
    container: document.querySelector('.main')
  };

  /*****************************************************************************
   *
   * Firebase auth functions
   *
   ****************************************************************************/
  app.getUser = () => {
    return new Promise((resolve, reject) => {
      app.auth.signInAnonymously().catch(error => {
        console.log(error);
        reject();
      });
      app.auth.onAuthStateChanged(user => {
        if (user) {
          app.uid = user.uid;
          resolve();
        } else {
          console.log('user is signed out');
          reject();
        }
      });
    });
  };
  /*****************************************************************************
   *
   * IndexedDB functions
   *
   ****************************************************************************/
  app.checkIndexedDB = () => {
    if (!('indexedDB' in window) && !('idb' in window)) {
      console.log('This browser does not support IndexedDB');
      return null;
    } else {
      console.log('indexedDB is supported');
      app.dbPromise = window.idb.open('files', 1, upgradeDb => {
        if (!upgradeDb.objectStoreNames.contains('data')) {
          const store = upgradeDb.createObjectStore('data');
          store.createIndex('src', 'src');
          store.createIndex('text', 'text');
        }
      });
      app.loadIndexedData('src');
      app.loadIndexedData('text');
    }
  };
  // Load data from indexedDB
  app.loadIndexedData = key => {
    app.dbPromise
      .then(db => {
        const transaction = db.transaction('data', 'readonly');
        const store = transaction.objectStore('data');
        return store.get(key);
      })
      .then(val => {
        console.log(`fetched ${key} from indexedDB`);
        if (val && key === 'src') {
          app.image.setAttribute('src', val);
          app.image.classList.add('fadeIn');
        } else {
          app.displayCard.removeEventListener('click', () =>
            app.fileInput.click()
          );
        }
        if (val && key === 'text') {
          app.insertText(val);
        }
      });
  };
  app.addData = (data, child, key) => {
    app.dbPromise
      .then(db => {
        const transaction = db.transaction(child, 'readwrite');
        const store = transaction.objectStore(child);
        store.put(data, key);
        return transaction.complete;
      })
      .then(() => {
        console.log(`Added ${child} to db at key ${key}`);
        app.loadIndexedData(key);
      });
  };
  /*****************************************************************************
   *
   * Firebase rtdb listeners
   *
   ****************************************************************************/
  app.listenToDB = () => {
    const textCard = app.textCard;
    app.database
      .ref()
      .child(app.uid)
      .on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
          app.insertText(data.text);
          app.addData(data.text, 'data', 'text');
          textCard.classList.add('text-enter');

          if (app.isProcessing) {
            app.addData(data.text, 'data', 'text');
            app.isProcessing = false;
          }
          snapshot.ref.remove();
          app.addToHomeScreenButton.click();
        }
        if (app.endScannerAnimation) {
          app.endScannerAnimation();
        }
      });
  };
  /*****************************************************************************
   *
   * Methods to animate UI
   *
   ****************************************************************************/
  app.animateScanner = () => {
    app.scanner.style.opacity = 1;
    const scanner1 = document
      .getElementById('scanner1')
      .animate(
        [
          { transform: 'translateX(0%)', opacity: 1 },
          { transform: 'translateX(50%)' },
          { transform: 'translateX(100%)' },
          { transform: 'translateX(50%)' },
          { transform: 'translateX(0%)', opacity: 1 }
        ],
        {
          duration: 3000,
          iterations: Infinity
        }
      );
    const scanner2 = document
      .getElementById('scanner2')
      .animate(
        [
          { transform: 'translateY(0%)', opacity: 1 },
          { transform: 'translateY(40%)' },
          { transform: 'translateY(35%)' },
          { transform: 'translateY(100%)' },
          { transform: 'translateY(60%)' },
          { transform: 'translateY(75%)' },
          { transform: 'translateY(50%)' },
          { transform: 'translateY(0%)', opacity: 1 }
        ],
        {
          duration: 3000,
          iterations: Infinity
        }
      );
    app.endScannerAnimation = () => {
      app.scanner.style.opacity = 0;
      scanner1.pause();
      scanner2.pause();
      app.endScannerAnimation = null;
    };
  };

  app.animateUploader = () => {
    app.uploader.style.opacity = 1;
    const cloud = document
      .getElementById('uploaderCloud')
      .animate([{ opacity: 1 }, { opacity: 0.3 }, { opacity: 1 }], {
        duration: 2000,
        iterations: Infinity
      });
    const arrow = document
      .getElementById('uploaderArrow')
      .animate(
        [
          { transform: 'translateY(0%)', opacity: 1 },
          { transform: 'translateY(-5%)' },
          { transform: 'translateY(5%)' },
          { transform: 'translateY(0%)', opacity: 1 }
        ],
        {
          duration: 2000,
          iterations: Infinity
        }
      );
    app.endUploaderAnimation = () => {
      app.uploader.style.opacity = 0;
      cloud.pause();
      arrow.pause();
      app.endUploaderAnimation = null;
    };
  };
  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/
  // Show install prompt
  app.addToHomeScreen = () => {
    const prompt = app.deferredPrompt;
    console.log('add', prompt);
    prompt.prompt();
    prompt.userChoice
      .then(choice => {
        if (choice.outcome === 'accepted') {
          console.log('User accepted');
        } else {
          console.log('User dismissed');
        }
        app.deferredPrompt = null;
      })
      .catch(error => console.log(error));
  };
  // Take a photo
  app.takePhoto = () => {
    const img = app.image;
    const canvas = document.querySelector('canvas');

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(gotMedia)
      .catch(error => console.error('getUserMedia() error:', error));

    function gotMedia(mediaStream) {
      const mediaStreamTrack = mediaStream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(mediaStreamTrack);
      console.log(imageCapture);
      imageCapture
        .takePhoto()
        .then(blob => {
          img.src = URL.createObjectURL(blob);
          img.onload = () => URL.revokeObjectURL(this.src);
        })
        .catch(error => console.error(error));
      imageCapture
        .grabFrame()
        .then(imageBitmap => {
          canvas.width = imageBitmap.width;
          canvas.height = imageBitmap.height;
          canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
        })
        .catch(error => console.error('grabFrame() error:', error));
    }
  };
  // Copy text from text card
  window.copyText = element => {
    const text = element.innerText;

    if ('clipboard' in navigator) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          app.showSnackBar('Text Copied To Clipboard', 'Dismiss', () =>
            app.hideSnackbar()
          );
        })
        .catch(error => {
          console.error(error);
        });
    } else {
      const range = document.createRange();
      range.selectNode(text);
      window.getSelection().addRange(range);
      try {
        const successful = document.execCommand('copy');
        const msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copy email command was ' + msg);
      } catch (err) {
        console.log('Oops, unable to copy');
      }
    }
  };
  // Uploads the selected image
  window.uploadImage = input => {
    const file = input.files[0];
    const textCard = app.textCard;
    const reader = new FileReader();

    app.animateUploader();

    if (file) {
      if (textCard.classList.contains('text-enter')) {
        textCard.classList.remove('text-enter');
      }
      reader.onload = event => {
        const result = event.target.result;
        app.image.setAttribute('src', result);
        app.storageUpload(file.name, result);
        // Save to local db
        app.addData(result, 'data', 'src');
      };
      reader.readAsDataURL(file);
    }
  };
  // on image load
  app.image.onload = event => {
    const image = app.image;
    const display = app.displayCard;
    const imageHeight = image.clientHeight;
    let displayHeight = display.clientHeight;
    if (imageHeight < displayHeight) {
      while (imageHeight <= displayHeight) {
        requestAnimationFrame(
          () => (display.style.height = `${displayHeight}px`)
        );
        displayHeight--;
      }
    } else {
      while (imageHeight >= displayHeight) {
        requestAnimationFrame(
          () => (display.style.height = `${displayHeight}px`)
        );
        displayHeight++;
      }
    }
  };
  // Show SnackBar
  app.showSnackBar = (text, label, onClick, timeout) => {
    const snackBar = app.snackBar;
    const button = app.snackBarButton;
    app.snackBarText.innerText = text;
    if (label) {
      button.addEventListener('click', onClick, { once: true });
      button.innerText = label;
      button.style.display = 'visible';
    }
    snackBar.classList.add('snackBar-show');
    app.fileButton.style.transform = 'translateY(-32px)';
    if (timeout) {
      setTimeout(() => snackBar.classList.remove('snackBar-show'), timeout);
    }
  };
  app.hideSnackbar = () => {
    app.snackBar.classList.remove('snackBar-show');
    app.fileButton.style.transform = 'translateY(0px)';
  };
  // Uploads an image to Firebase storage
  app.storageUpload = (name, string) => {
    const storageRef = app.storage.ref().child(name);
    const metadata = {
      customMetadata: {
        uid: app.uid
      }
    };
    const uploadTask = storageRef.putString(string, 'data_url');
    uploadTask.on(
      'state_changed',
      snapshot => {
        let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED: // or 'paused'
            console.log('Upload is paused');
            break;
          case firebase.storage.TaskState.RUNNING: // or 'running'
            console.log('Upload is running');
            break;
        }
      },
      error => {
        console.log(error);
      },
      () => {
        storageRef
          .updateMetadata(metadata)
          .then(() => {
            app.endUploaderAnimation();
            app.animateScanner();
            app.isProcessing = true;
          })
          .catch(error => console.log(error));
      }
    );
  };
  app.insertText = text => {
    if (typeof text === 'object') {
      app.text.innerText = text.join(' ');
      app.textTitle.innerText = 'Click To Copy';
    }
    if (typeof text === 'string') {
      app.text.innerText = text;
      if (
        text.startsWith(
          "Oops! There doesn't appear to be any text in this image"
        )
      ) {
        app.textTitle.innerText = 'Hmmm...';
      } else {
        app.textTitle.innerText = 'Click To Copy';
      }
    }
    app.textCard.classList.add('text-enter');
  };
  /*****************************************************************************
   *
   * Event listeners for DOM
   *
   ****************************************************************************/
  window.addEventListener('load', async () => {
    await app.checkIndexedDB();
    try {
      var config = {
        apiKey: 'AIzaSyBLZVjzJzb0CYvMTQ-tAw2feCZIFGRfeFQ',
        authDomain: 'textract-fe8e3.firebaseapp.com',
        databaseURL: 'https://textract-fe8e3.firebaseio.com',
        projectId: 'textract-fe8e3',
        storageBucket: 'textract-fe8e3.appspot.com',
        messagingSenderId: '835413394534'
      };
      await firebase.initializeApp(config);
      app.database = firebase.database();
      app.storage = firebase.storage();
      app.auth = firebase.auth();
      let features = [
        'auth',
        'database',
        //  'messaging',
        'storage'
      ].filter(feature => typeof firebase[feature] === 'function');
      console.log(`Firebase SDK loaded with ${features.join(', ')}`);

      await app.getUser().then(() => {
        app.listenToDB();
      });
    } catch (e) {
      console.error(e);
      console.log('Error loading the Firebase SDK, check the console.');
    }
  });
  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/
  // document.getElementById('buttonCamera').addEventListener('click', () => {
  //   // app.takePhoto();
  //   app.animateUploader();
  // });
  app.fileButton.addEventListener('click', () => {
    // Select an image from file picker
    app.fileInput.click();
  });
  app.addToHomeScreenButton.addEventListener('click', () => {
    app.addToHomeScreen();
  });
  app.displayCard.addEventListener('click', () => {
    app.fileInput.click();
  });
  app.displayCard.addEventListener('transitionend', () => {
    app.image.classList.add('fadeIn');
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    app.deferredPrompt = event;
    app.addToHomeScreenButton.style.opacity = 1;
  });
  if (app.isLoading) {
    app.spinner.setAttribute('hidden', true);
    app.container.removeAttribute('hidden');
    app.isLoading = false;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../service-worker.js').then(reg => {
      console.log('Service Worker Registered');
      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              app.showSnackBar('New Version Available!!', 'Refresh', () => {
                reg.waiting.postMessage('skipWaiting');
              });
            }
          }
        };
      };
    });
    let refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', event => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  }
})();

// // Check how much local data is available
// navigator.storageQuota.queryInfo('temporary').then(info => {
//   console.log(info.quota);
//   console.log(info.usage);
// });
// // To keep local data from being deleted
// navigator.storage.requestPersistent().then(granted => {
//   if (granted) {
//     console.log('Data is here to stay!')
//   }
// })
