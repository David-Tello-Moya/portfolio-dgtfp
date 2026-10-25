/* Contact page */
(function () {
  var form = document.getElementById('form');
  var statusEl = document.getElementById('status');
  var sent = null; /* { name } once the form was submitted, so the message can follow the language */

  function renderStatus() {
    if (!sent) { statusEl.textContent = ''; return; }
    statusEl.textContent = sent.name ? i18n.t('contact.thanks', { name: sent.name }) : i18n.t('contact.thanksAnon');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = document.getElementById('f-name').value.trim().split(' ')[0];
    /* TODO: send the form data to your email service or backend here. */
    sent = { name: first };
    renderStatus();
    form.reset();
  });

  document.addEventListener('i18n:change', renderStatus);
})();
