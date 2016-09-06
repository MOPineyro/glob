/*
 * @OnlyCurrentDoc
 *
 * The above comment directs Apps Script to limit the scope of file
 * access for this add-on. It specifies that this add-on will only
 * attempt to read or modify the files in which the add-on is used,
 * and not all of the user's files. The authorization request message
 * presented to users will reflect this limited scope.
 */
var ADDON_TITLE = 'Lob';
var NOTICE = "Test Lob add-on for Google Docs";

/**
 * Adds a custom menu to the active form to show the add-on sidebar.
 *
 * @param {object} e The event parameter for a simple onOpen trigger. To
 * determine which authorization mode (ScriptApp.AuthMode) the trigger is
 * running in, inspect e.authMode.
 */


/**
 * onOpen()
 * ---------
 * Runs when the add-on is installed.
 *
 * @param {object} e The event parameter for a simple onInstall trigger. To
 * determine which authorization mode (ScriptApp.AuthMode) the trigger is
 * running in, inspect e.authMode. (In practice, onInstall triggers always
 * run in AuthMode.FULL, but onOpen triggers may be AuthMode.LIMITED or
 * AuthMode.NONE).
 */

function onOpen(e) {
        var ui = DocumentApp.getUi();
        ui.createMenu('Lob').addItem('Send Doc as Letter', 'showSidebar').addToUi();
}

/**
*
* Base64.encode(e)
*
* --------
*
* Helper function to encode Lob API key in Base64.
*
*/

var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(e) {
        var t = "";
        var n, r, i, s, o, u, a;
        var f = 0;
        e = Base64._utf8_encode(e);
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) {
                u = a = 64
            } else if (isNaN(i)) {
                a = 64
            }
            t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
        }
        return t
    },
      _utf8_encode: function(e) {
        e = e.replace(/\r\n/g, "\n");
        var t = "";
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r)
            } else if (r > 127 && r < 2048) {
                t += String.fromCharCode(r >> 6 | 192);
                t += String.fromCharCode(r & 63 | 128)
            } else {
                t += String.fromCharCode(r >> 12 | 224);
                t += String.fromCharCode(r >> 6 & 63 | 128);
                t += String.fromCharCode(r & 63 | 128)
            }
        }
        return t
    }
}

function onInstall(e) {
    onOpen(e);
}

function saveSettingsAndSendLetter(settings) {
    PropertiesService.getDocumentProperties().setProperties(settings);
    sendLetterRequest();
}

/**
*
* sendLetterRequest()
* -------------------
*
* 1. It creates the addressee object, created from the fields in the form,
*    and saves the ID of the address object saved on the Lob server.
*
* 2. It creates the sender object in the same manner as above.
*
* 3. It creates a PDF out of the current doc
*
* 4. Using the sender, addressee, and PDF, it makes a final request
*    for Lob to create the Letter object. (and send the letter)
*
*/

function sendLetterRequest() {
    var settings = PropertiesService.getDocumentProperties();
    var lob_api_key = settings.getProperty('apiKey') + ":";
    var auth = Base64.encode(lob_api_key);
    var headers = {
            'Authorization': 'Basic ' + auth
    }

    // 1. Creating the addressee object

    var to_address_obj = {
        name: settings.getProperty('toName'),
        company: settings.getProperty('toCompany'),
        address_line1: settings.getProperty('toAddress1'),
        address_line2: settings.getProperty('toAddress2'),
        address_city: settings.getProperty('toCity'),
        address_state: settings.getProperty('toState'),
        address_zip: settings.getProperty('toZip'),
        address_country: 'US'
    }
    var options = {
        "method": "post",
        "payload": to_address_obj,
        "headers": headers
    };
    var url = "https://api.lob.com/v1/addresses";
    var to_id = JSON.parse(UrlFetchApp.fetch(url, options).getContentText()).id;

    // 2. Creating the sender object

    var from_address_obj = {
        name: settings.getProperty('fromName'),
        address_line1: settings.getProperty('fromAddress'),
        address_city: settings.getProperty('fromCity'),
        address_state: settings.getProperty('fromState'),
        address_zip: settings.getProperty('fromZip'),
        address_country: 'US'
    }
    options = {
        "method": "post",
        "payload": from_address_obj,
        "headers": headers
    };
    var from_id = JSON.parse(UrlFetchApp.fetch(url, options).getContentText()).id;

    // 3. PDF the Doc

    var this_id = DocumentApp.getActiveDocument().getId();
    var pdf = DocumentApp.getActiveDocument().getAs('application/pdf');

    // 4. Finally, create the Letter object:

    var url = "https://api.lob.com/v1/letters";
    var letter = {
        to: to_id,
        from: from_id,
        file: pdf,
        color: false,
        address_placement: settings.getProperty('addressPlacement'),
        extra_service: settings.getProperty('extraService'),
        return_envelope: settings.getProperty('returnEnv'),
        perforated_page: settings.getProperty('returnEnv') ? getNumberOfPages() : undefined
    }
    options = {
        "method": "post",
        "payload": letter,
        "headers": headers
    };
    UrlFetchApp.fetch(url, options);
}



function getAddresses(api_key) {
    var auth = Base64.encode(api_key + ":");
    var headers = {
        'Authorization': 'Basic ' + auth
    }
    var url = "https://api.lob.com/v1/addresses/";
    options = {
        "method": "get",
        "headers": headers
    };
    return JSON.parse(UrlFetchApp.fetch(url, options));
}

/**
*
* getNumberOfPages()
* ------------------
*
* Adapted from http://code.google.com/p/google-apps-script-issues/issues/detail?id=1656
*
* Calculates the amount of pages to estimate the price of the job.
*
*/

function getNumberOfPages() {
    var this_id = DocumentApp.getActiveDocument().getId();
    var pdf = DocumentApp.getActiveDocument().getAs('application/pdf');
    var data = pdf.getDataAsString();
    var re = /Pages\/Count (\d+)/g;
    var match;
    var pages = 0;
    while (match = re.exec(data)) {
        var value = parseInt(match[1]);
        if (value > pages) {
            pages = value;
        }
    }
    return pages + 1;
}

function showSidebar() {
    var ui = HtmlService.createHtmlOutputFromFile('sidebar').setTitle('Lob');
    DocumentApp.getUi().showSidebar(ui);
}
