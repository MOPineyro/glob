<link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons.css">
<!-- The CSS package above applies Google styling to buttons and other elements. -->

<style>
.branding-below {
  bottom: 56px;
  top: 0;
}

.branding-text {
  left: 7px;
  position: relative;
  top: 3px;
}

.col-contain {
  overflow: hidden;
}

.col-one {
  float: left;
  width: 50%;
}

.logo {
  vertical-align: middle;
}

.radio-spacer {
  height: 20px;
}

.width-100 {
  width: 100%;
}
</style>

<div class="sidebar branding-below">
  <form>
    <div class="block col-contain">
      <div class="col-one">
        <b>Selected text</b>
        <div>
          <input type="radio" name="origin" id="radio-origin-auto" value="" checked="checked">
          <label for="radio-origin-auto">Auto-detect</label>
        </div>
        <div>
          <input type="radio" name="origin" id="radio-origin-en" value="en">
          <label for="radio-origin-en">English</label>
        </div>
        <div>
          <input type="radio" name="origin" id="radio-origin-fr" value="fr">
          <label for="radio-origin-fr">French</label>
        </div>
        <div>
          <input type="radio" name="origin" id="radio-origin-de" value="de">
          <label for="radio-origin-de">German</label>
        </div>
        <div>
          <input type="radio" name="origin" id="radio-origin-ja" value="ja">
          <label for="radio-origin-ja">Japanese</label>
        </div>
        <div>
          <input type="radio" name="origin" id="radio-origin-es" value="es">
          <label for="radio-origin-es">Spanish</label>
        </div>
      </div>
      <div>
        <b>Translate into</b>
        <div class="radio-spacer">
        </div>
        <div>
          <input type="radio" name="dest" id="radio-dest-en" value="en">
          <label for="radio-dest-en">English</label>
        </div>
        <div>
          <input type="radio" name="dest" id="radio-dest-fr" value="fr">
          <label for="radio-dest-fr">French</label>
        </div>
        <div>
          <input type="radio" name="dest" id="radio-dest-de" value="de">
          <label for="radio-dest-de">German</label>
        </div>
        <div>
          <input type="radio" name="dest" id="radio-dest-ja" value="ja" checked="checked">
          <label for="radio-dest-ja">Japanese</label>
        </div>
        <div>
          <input type="radio" name="dest" id="radio-dest-es" value="es">
          <label for="radio-dest-es">Spanish</label>
        </div>
      </div>
    </div>

    <div class="block form-group">
      <label for="translated-text"><b>Translation</b></label>
      <textarea class="width-100" id="translated-text" rows="10"></textarea>
    </div>

    <div class="block">
      <input type="checkbox" id="save-prefs">
      <label for="save-prefs">Use these languages by default</label>
    </div>

   <div class="block" id="button-bar">
      <button class="blue" id="run-translation">Translate</button>
      <button id="insert-text">Insert</button>
    </div>
  </form>
</div>

<div class="sidebar bottom">
  <img alt="Add-on logo" class="logo" width="27" height="27"
      src="https://googledrive.com/host/0B0G1UdyJGrY6XzdjQWF4a1JYY1k/translate-logo-small.png">
  <span class="gray branding-text">Translate sample by Google</span>
</div>

<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js">
</script>
<script>
  /**
   * On document load, assign click handlers to each button and try to load the
   * user's origin and destination language preferences if previously set.
   */
  $(function() {
    $('#run-translation').click(runTranslation);
    $('#insert-text').click(insertText);
    google.script.run.withSuccessHandler(loadPreferences)
        .withFailureHandler(showError).getPreferences();
  });

  /**
   * Callback function that populates the origin and destination selection
   * boxes with user preferences from the server.
   *
   * @param {Object} languagePrefs The saved origin and destination languages.
   */
  function loadPreferences(languagePrefs) {
    $('input:radio[name="origin"]')
        .filter('[value=' + languagePrefs.originLang + ']')
        .attr('checked', true);
    $('input:radio[name="dest"]')
        .filter('[value=' + languagePrefs.destLang + ']')
        .attr('checked', true);
  }

  /**
   * Runs a server-side function to translate the user-selected text and update
   * the sidebar UI with the resulting translation.
   */
  function runTranslation() {
    this.disabled = true;
    $('#error').remove();
    var origin = $('input[name=origin]:checked').val();
    var dest = $('input[name=dest]:checked').val();
    var savePrefs = $('#save-prefs').is(':checked');
    google.script.run
        .withSuccessHandler(
          function(translatedText, element) {
            $('#translated-text').val(translatedText);
            element.disabled = false;
          })
        .withFailureHandler(
          function(msg, element) {
            showError(msg, $('#button-bar'));
            element.disabled = false;
          })
        .withUserObject(this)
        .runTranslation(origin, dest, savePrefs);
  }

  /**
   * Runs a server-side function to insert the translated text into the document
   * at the user's cursor or selection.
   */
  function insertText() {
    this.disabled = true;
    $('#error').remove();
    google.script.run
        .withSuccessHandler(
          function(returnSuccess, element) {
            element.disabled = false;
          })
        .withFailureHandler(
          function(msg, element) {
            showError(msg, $('#button-bar'));
            element.disabled = false;
          })
        .withUserObject(this)
        .insertText($('#translated-text').val());
  }

  /**
   * Inserts a div that contains an error message after a given element.
   *
   * @param msg The error message to display.
   * @param element The element after which to display the error.
   */
  function showError(msg, element) {
    var div = $('<div id="error" class="error">' + msg + '</div>');
    $(element).after(div);
  }
</script>

