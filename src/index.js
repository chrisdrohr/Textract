import 'babel-polyfill';
import idb from './scripts/idb.js';
// import * as Animations from './scripts/Animations';
import { auth, database, storage } from './scripts/Firebase';
const dev = true;
(function() {
  'use strict';

  var app = {
    actions: document.querySelector('.actions'),
    background: document.querySelector('.background'),
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
    shareButton: document.getElementById('share'),
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
  app.getUser = async () => {
    await auth.signInAnonymously();
    await auth.onAuthStateChanged(user => {
      if (user) {
        app.uid = user.uid;
        console.log('User is signed in', user.uid);
      } else {
        console.log('User is signed out');
      }
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
      app.dbPromise = idb.open('files', 1, upgradeDb => {
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
        if (val && key === 'src') {
          app.image.setAttribute('src', val);
          app.image.classList.add('fadeIn');
          app.actions.classList.add('fadeIn');
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
        app.loadIndexedData(key);
      });
  };
  /*****************************************************************************
   *
   * Firebase rtdb listeners
   *
   ****************************************************************************/
  app.listenToDB = () => {
    database
      .ref()
      .child(app.uid)
      .on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
          app.insertText(data.text);
          app.addData(data.text, 'data', 'text');
          app.textCard.classList.add('text-enter');
          if (app.isProcessing) {
            app.addData(data.text, 'data', 'text');
            app.isProcessing = false;
          }
          snapshot.ref.remove();
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
    const background = app.background;
    if (background.animate) {
      const animation = background.animate(
        [
          { backgroundColor: 'hsl(216, 20%, 34%, 0)' },
          { backgroundColor: 'hsl(216, 90%, 34%, 1)' },
          { backgroundColor: 'hsl(216, 20%, 34%, 0.5)' },
          { backgroundColor: 'hsl(216, 90%, 34%, 1)' },
          { backgroundColor: 'hsl(216, 20%, 34%, 0)' }
        ],
        {
          duration: 3000,
          iterations: 16
        }
      );
      app.endUploaderAnimation = () => {
        animation.finish();
        app.endUploaderAnimation = null;
      };
    } else {
        console.log('Animate is not supported')
    }
   
  };

  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/
  // Show install prompt
  app.addToHomeScreen = () => {
    const prompt = app.deferredPrompt;
    if (prompt) {
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
    if (file) {
      app.animateUploader();
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
    let displayHeight = display.clientHeight - 5;
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
    app.image.classList.add('fadeIn');
    app.displayCard.classList.add('transparent');
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
    const storageRef = storage.ref().child(name);
    const metadata = {
      customMetadata: {
        uid: app.uid
      }
    };
    const uploadTask = storageRef.putString(string, 'data_url');
    console.group('%cImage Upload', "color: blue");
    uploadTask.on(
      'state_changed',
      snapshot => {
        let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Upload is ' + progress + '% done');
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
          })
          .catch(error => console.log(error));
      }
    );
    console.groupEnd();
  };
  app.insertText = text => {
    let height;
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
    height = app.textCard.clientHeight;
    // app.textCard.style.transform = `translateY(calc(100vh - ${height}px)`;
    app.textCard.classList.add('text-enter');
  };
  /*****************************************************************************
   *
   * Event listeners for DOM
   *
   ****************************************************************************/
  window.addEventListener('load', async () => {
    await app.checkIndexedDB();
    await app.getUser();
    await app.listenToDB();

    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

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

    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      console.log(event);
      app.deferredPrompt = event;
      app.addToHomeScreenButton.style.display = "visible";
      app.addToHomeScreenButton.style.opacity = 1;
    });

    if (window.navigator.share) {
      app.shareButton.style.display = "visible";
      app.shareButton.style.opacity = 1;
      app.shareButton.addEventListener('click', () => {
        window.navigator
          .share({
            title: 'Textract',
            text: 'A Progressive Web App that extracts text from images',
            url: 'https://textract.chrisrohr.app/'
          })
          .then(() => console.log('Successful share'))
          .catch(error => console.log('Error sharing', error));
      });
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').then(reg => {
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

    // Detects if device is on iOS
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    // Detects if device is in standalone mode
    const isInStandaloneMode = () =>
      'standalone' in window.navigator && window.navigator.standalone;

    // Checks if should display install popup notification:
    if (isIos() && !isInStandaloneMode()) {
      console.log('is Ios');
    }
    // if (window.Worker) {
    //   const worker = new Worker('worker.js');
    //   worker.postMessage('do some work');

    //   worker.addEventListener('message', event => {
    //     console.log(event.data)
    //   })
    // }

    if (app.isLoading) {
      app.spinner.classList.add('fadeOut');
      app.container.classList.add('fadeIn');
      app.spinner.setAttribute('hidden', true);
      app.isLoading = false;
    }
    // app.animateUploader();
    // app.animateScanner();
  });
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
