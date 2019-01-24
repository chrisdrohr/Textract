const SnackBar = (() => {
  let instance, snackBar, text, button, fileButton;
  const hide = () => {
    snackBar.classList.remove('snackBar-show');
    fileButton.style.transform = 'translateY(0px)';
  };
  const show = (message, label, timeout) => {
    text.innerText = message;
    if (label) {
      button.addEventListener('click', hide, { once: true });
      button.innerText = label;
      button.style.display = 'visible';
    }
    snackBar.classList.add('snackBar-show');
    fileButton.style.transform = 'translateY(-32px)';
    if (timeout) {
      setTimeout(() => snackBar.classList.remove('snackBar-show'), timeout);
    }
  };
  const init = () => {
    snackBar = document.querySelector('.snackBar');
    text = document.querySelector('.snackBar-text');
    button = document.querySelector('.snackBar-button');
    fileButton = document.getElementById('fileButton');
    return {
      hide,
      show
    };
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
export default SnackBar.init();
