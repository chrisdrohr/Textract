const InstallButton = (() => {
    let instance, button, prompt;
    const install = () => {
        if (prompt) {
          prompt.prompt();
          prompt.userChoice
            .then(choice => {
              if (choice.outcome === 'accepted') {
                console.log('User accepted');
              } else {
                console.log('User dismissed');
              }
              prompt = null;
            })
            .catch(error => console.log(error));
        }
      };
    const init = () => {
        button = document.getElementById('addToHomeScreen');
        window.addEventListener('beforeinstallprompt', event => {
            event.preventDefault();
            prompt = event;
            button.style.display = 'unset';
            button.style.opacity = 1;
          });
        button.addEventListener('click', () => install());
    }

    return {
        init: () => {
            if(!instance) {
                instance = init();
            }
            return instance;
        }
    }
})();
export default InstallButton.init();