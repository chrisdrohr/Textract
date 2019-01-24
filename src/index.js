import 'babel-polyfill';
import Storage from './scripts/Storage';
import SnackBar from './views/SnackBar';
import Image from './views/Image';
import TextCard from './views/TextCard';
import './views/FileButton';
import './views/InstallButton';
import './views/ShareButton';
import Firebase from './scripts/Firebase';

(function() {
  'use strict';
  let app = {
    actions: document.querySelector('.actions'),
    isLoading: true,
    isProcessing: false,
    spinner: document.querySelector('.loader'),
    container: document.querySelector('.main')
  };
  // Load data from indexedDB
  app.loadIndexedData = key => {
    Storage.getData(key).then(val => {
      if (val && key === 'src') {
        Image.addSrc(val);
        Image.listener.remove();
        app.actions.classList.add('fadeIn');
      }
      if (val && key === 'text') {
        TextCard.insert(val);
      }
    });
  };

  app.listenToDB = uid => {
    Firebase.database
      .ref()
      .child(uid)
      .on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
          TextCard.insert(data.text);
          Storage.addData(data.text, 'data', 'text').then(() => {
            app.loadIndexedData('text');
          });
          TextCard.show();
          if (app.isProcessing) {
            app.isProcessing = false;
          }
          snapshot.ref.remove();
        }
        if (Image.animate.scanner.end) {
          Image.animate.scanner.end();
        }
      });
  };
  // Copy text from text card
  window.copyText = element => {
    const text = element.innerText;
    if ('clipboard' in navigator) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          SnackBar.show('Text Copied To Clipboard', 'Dismiss');
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
    const reader = new FileReader();
    if (file) {
      Image.animate.upload.start();
      TextCard.hide();
      reader.onload = event => {
        const result = event.target.result;
        Image.addSrc(result);
        Firebase.storageUpload(file.name, result, app.uid).then(() => {
          Image.animate.upload.end();
          Image.animate.scanner.start();
        });
        // Save to local db
        Storage.addData(result, 'data', 'src');
      };
      reader.readAsDataURL(file);
    }
  };

  window.addEventListener('load', async () => {
    await app.loadIndexedData('src');
    await app.loadIndexedData('text');
    await Firebase.signIn().then(uid => (app.uid = uid));
    if (app.uid) {
      await app.listenToDB(app.uid);
    }

    // if ('serviceWorker' in navigator) {
    //   navigator.serviceWorker.register('./service-worker.js').then(reg => {
    //     console.log('Service Worker Registered');
    //     reg.onupdatefound = () => {
    //       const installingWorker = reg.installing;
    //       installingWorker.onstatechange = () => {
    //         if (installingWorker.state === 'installed') {
    //           if (navigator.serviceWorker.controller) {
    //             app.showSnackBar('New Version Available!!', 'Refresh', () => {
    //               reg.waiting.postMessage('skipWaiting');
    //             });
    //           }
    //         }
    //       };
    //     };
    //   });
    //   let refreshing;
    //   navigator.serviceWorker.addEventListener('controllerchange', event => {
    //     if (refreshing) return;
    //     window.location.reload();
    //     refreshing = true;
    //   });
    // }

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
