const TextCard = (() => {
  let instance, body, card, title, input;
  const insert = text => {
    if (typeof text === 'object') {
      body.innerText = text.join(' ');
      title.innerText = 'Click To Copy';
    }
    if (typeof text === 'string') {
      body.innerText = text;
      if (
        text.startsWith(
          "Oops! There doesn't appear to be any text in this image"
        )
      ) {
        title.innerText = 'Hmmm...';
      } else {
        title.innerText = 'Click To Copy';
      }
    }
    card.classList.add('text-enter');
  };
  const show = () => {
    card.classList.add('text-enter');
  };
  const hide = () => {
    if (card.classList.contains('text-enter')) {
      card.classList.remove('text-enter');
    }
  };
  
  const init = () => {
    card = document.querySelector('.text');
    body = document.getElementById('text');
    title = document.getElementById('textTitle');
    input = document.getElementById('file');

    return {
      hide,
      insert,
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
export default TextCard.init();
