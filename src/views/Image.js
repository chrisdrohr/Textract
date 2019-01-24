const Image = (() => {
  let instance, image, input, background, scanner, display;
  const animate = {
    upload: {
      start: () => {
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
          animate.upload.end = () => {
            animation.finish();
            animate.upload.end = null;
          };
        } else {
          console.log('Animate is not supported');
        }
      },
      end: null
    },
    scanner: {
      start: () => {
        scanner.style.opacity = 1;
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
        animate.scanner.end = () => {
          scanner.style.opacity = 0;
          scanner1.pause();
          scanner2.pause();
          animate.scanner.end = null;
        };
      },
      end: null
    }
  };

  const addSrc = src => {
    image.setAttribute('src', src);
    image.classList.add('fadeIn');
  };
  const listener = {
    add: () => {
      display.addEventListener('click', input.click());
    },
    remove: () => {
      display.removeEventListener('click', input.click());
    }
  };
  const init = () => {
    image = document.querySelector('.image');
    background = document.querySelector('.background');
    scanner = document.querySelector('.scanner');
    display = document.querySelector('.display');
    input = document.getElementById('file');
    listener.add();
    image.onload = () => {
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
      image.classList.add('fadeIn');
      display.classList.add('transparent');
    };
    return {
      addSrc,
      animate,
      listener
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
export default Image.init();
