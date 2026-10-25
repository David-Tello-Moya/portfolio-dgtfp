/* Home page */
(function () {
  document.getElementById('cv').addEventListener('click', function () {
    /* Replace this with a real download, e.g. an <a href="cv.pdf" download> */
    site.toast(i18n.t('home.cvToast'));
  });
})();
