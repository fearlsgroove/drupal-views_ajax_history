(function ($) {

  function bindPager ($view) {
    $view.find('.pager a').bind('click', function () {
      History.pushState({}, document.title, $(this).attr('href'));
    });
  }

  function bindForm ($view) {
    $view.find('.ctools-use-ajax').bind('click', function () {
      var queryString = $(this.form).formSerialize();
      var settings = Drupal.settings;
      var url = settings.basePath + settings.pathPrefix;
      // if ? in ajax_path, clean urls are off and we need to create the Path
      if (!/\?/.test(settings.views.ajax_path)) {
        url += Drupal.Views.getPath(window.location.href) + '?' + queryString;
      }
      else {
        url += queryString;
      }
      History.pushState({}, document.title, url);
    });
  }
/*
  function ajaxHandle (e, xhr, options) {
    console.log(arguments);
    var url =
    History.pushState(options.data, document.title, url);
  }

  History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
    var State = History.getState(); // Note: We are using History.getState() instead of event.state
    console.log(State.data, State.title, State.url);
  });
 */

  Drupal.behaviors.viewsAjaxHistory = {
    attach: function (context, settings) {
      var ajaxView = Drupal.views.ajaxView;

      // takes care of form and pagers
      $.each(Drupal.settings.views.ajaxViews, function(i, settings) {
        var $view = $('.view-dom-id-' + settings.view_dom_id);//.ajaxSend(ajaxHandle);
        bindPager($view);
        bindForm($view);
      });
    }
  };
}(jQuery));
