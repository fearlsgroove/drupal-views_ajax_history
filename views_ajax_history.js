(function ($) {

  // need to keep this to check if there are extra parameters to views
  // have to filter views var at the same time
  var original = {
    path: window.location.href,
    query: window.location.search || ''
  };

  /**
   * Keep the original beforeSubmit to use it later
   */
  var beforeSubmit = Drupal.ajax.prototype.beforeSubmit;

  /**
   * Keep the original beforeSerialize to use it later
   */
  var beforeSerialize = Drupal.ajax.prototype.beforeSerialize;

  /**
   * Allow multiple value fields from Drupal.Views.parseQueryString()
   *
   * @param query
   */
  var parseQueryString = function (query) {
    var args = {};
    var pos = query.indexOf('?');
    if (pos != -1) {
      query = query.substring(pos + 1);
    }
    var pairs = query.split('&');
    var pair, key, value;
    for(var i in pairs) {
      if (typeof(pairs[i]) == 'string') {
        pair = pairs[i].split('=');
        // Ignore the 'q' path argument, if present.
        if (pair[0] != 'q' && pair[1]) {
          key = decodeURIComponent(pair[0].replace(/\+/g, ' '));
          value = decodeURIComponent(pair[1].replace(/\+/g, ' '));
          // same value exists and end with []
          if (/\[\]$/.test(key)) {
            // make it an array if it's not already
            if (!(key in args)) {
              args[key] = [value];
            }
            // don't duplicate values
            else if (!$.inArray(value, args[key]) !== -1) {
              args[key].push(value);
            }
          }
          else {
            args[key] = value;
          }
        }
      }
    }
    return args;
  };

  /**
   * Strip views values and duplicates from URL
   *
   * @param url
   * @param viewArgs
   *
   * @return url string
   */
  var cleanURL = function (url, viewArgs) {
    var args = parseQueryString(url);
    var url = url.split('?');
    var query = [];

    $.each(args, function (name, value) {
      // use values from viewArgs if they exists
      if (name in viewArgs) {
        value = viewArgs[name];
      }
      if ($.isArray(value)) {
        $.merge(query, $.map(value, function (sub) {
          return name + '=' + sub;
        }));
      }
      else {
        query.push(name + '=' + value);
      }
    });

    return url[0] + (query.length ? '?' + query.join('&') : '');
  };

  /**
   * unbind statechange when adding a new state, don't need to refresh.
   */
  var addState = function (options, url) {
    $(window).unbind('statechange', loadView);
    History.pushState(options, document.title, cleanURL(url, options.data));
    $(window).bind('statechange', loadView);
  };

  /**
   * Make an AJAX request to update the view when nagitating back and forth.
   * @param e
   */
  var loadView = function () {
    var state = History.getState();
    var options = state.data;

    var $dummy = $('<div class="ajaxHistoryDummy"/>');
    var settings = $.extend({
      submit: options.data,
      setClick: true,
      event: 'click',
      selector: '.view-dom-id-' + options.data.view_dom_id,
      progress: { type: 'throbber' }
    }, options);

    new Drupal.ajax(false, $dummy[0], settings);
    // trigger ajax call the element will be remove by the ajax insert command
    $dummy.trigger('click');
  };

  /**
   * Handle pager links
   *
   * @param $element
   * @param options
   */
  Drupal.ajax.prototype.beforeSerialize = function ($element, options) {
    // don't do anything for this one
    if ($($element).hasClass('ajaxHistoryDummy')) {return;}

    var url = original.path;
    options.url = Drupal.settings.views.ajax_path;

    // it's a form, wait for beforeSubmit
    if ($element.is(':not(form)')) {
      if ($element.is('a')) {
        addState(options, $element.attr('href'));
      }
    }
    beforeSerialize.apply(this, arguments);
  };

  /**
   * Handle exposed form submissions
   *
   * @param form_values
   * @param element
   * @param options
   */
  Drupal.ajax.prototype.beforeSubmit = function (form_values, element, options) {
    var url = original.path + (/\?/.test(original.path) ? '&' : '?') + element.formSerialize();

    // copy selected values in history state
    $.each(form_values, function () {
      // field name ending with [] is a multi value field
      if (/\[\]$/.test(this.name)) {
        if (!options.data[this.name]) {
          options.data[this.name] = [];
        }
        options.data[this.name].push(this.value);
      }
      // regular field
      else {
        options.data[this.name] = this.value;
      }
    });

    addState(options, url);
    beforeSubmit.apply(this, arguments);
  };

}(jQuery));
