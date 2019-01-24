const ShareButton = (() => {
  let instance, button;

  const init = () => {
    if (window.navigator.share) {
      button = document.getElementById('share');
      button.style.display = 'visible';
      button.style.opacity = 1;
      button.addEventListener('click', () => {
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
export default ShareButton.init();
