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
   * Strip views values and duplicates from URL
   *
   * @param url
   * @param viewArgs
   *
   * @return url string
   */
  var cleanURL = function (url, viewArgs) {
    var url = url.split('?');
    var args = Drupal.Views.parseQueryString(url[1]);
    var query = [];

    for (var i in args) {
      if (args.hasOwnProperty(i)) {
        query.push(i + '=' + args[i]);
      }
    }

    return url[0] + (query.length ? '?' + query.join('&') : '');
  };

  /**
   * unbind statechange when adding, easier
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

    var $dummy = $('<div class="ajaxHistoryDummy"/>').appendTo($('body'));
    var settings = $.extend({
      submit: options.data,
      setClick: true,
      event: 'click',
      selector: '.view-dom-id-' + options.data.view_dom_id,
      progress: { type: 'throbber' },
      success: function () { $dummy.remove(); }
    }, options);

    new Drupal.ajax(false, $dummy[0], settings);
    // trigger ajax call
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
    console.log($element);
    if ($($element).hasClass('ajaxHistoryDummy')) {return;}

    var url = original.path;
    options.url = Drupal.settings.views.ajax_path;

    // it's a form, wait for beforeSubmit
    if ($element.is(':not(form)')) {
      if ($element.is('a')) {
        addState(options, $element.attr('href'));
      }
    }
    //beforeSerialize.apply(this, arguments);
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
      options.data[this.name] = this.value;
    });

    addState(options, url);
    beforeSubmit.apply(this, arguments);
  };

}(jQuery));
