import 'babel-polyfill';
import Storage from './scripts/Storage';
import SnackBar from './views/SnackBar';
import Image from './views/Image';
import TextCard from './views/TextCard';
import FileButton from './views/FileButton';
import InstallButton from './views/InstallButton';
import Firebase from './scripts/Firebase';
const dev = true;
(function() {
  'use strict';

  var app = {
    actions: document.querySelector('.actions'),
    // addToHomeScreenButton: document.getElementById('addToHomeScreen'),
    shareButton: document.getElementById('share'),
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
  // Show install prompt
  // app.addToHomeScreen = () => {
  //   const prompt = app.deferredPrompt;
  //   if (prompt) {
  //     prompt.prompt();
  //     prompt.userChoice
  //       .then(choice => {
  //         if (choice.outcome === 'accepted') {
  //           console.log('User accepted');
  //         } else {
  //           console.log('User dismissed');
  //         }
  //         app.deferredPrompt = null;
  //       })
  //       .catch(error => console.log(error));
  //   }
  // };

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

    // app.addToHomeScreenButton.addEventListener('click', () => {
    //   app.addToHomeScreen();
    // });

    // window.addEventListener('beforeinstallprompt', event => {
    //   event.preventDefault();
    //   app.deferredPrompt = event;
    //   app.addToHomeScreenButton.style.display = 'unset';
    //   app.addToHomeScreenButton.style.opacity = 1;
    // });

    if (window.navigator.share) {
      app.shareButton.style.display = 'visible';
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
