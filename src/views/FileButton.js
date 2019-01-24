const FileButton = (() => {
  let instance, button, input;
  const init = () => {
    button = document.getElementById('fileButton');
    input = document.getElementById('file');
    button.addEventListener('click', () => {
      input.click();
    });
    
  };
  return {
    init: () => {
      if (!button) {
        instance = init();
      }
      return instance;
    }
  };
})();
export default FileButton.init();
