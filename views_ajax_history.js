(function ($) {

  function bindPager ($view) {
    $view.find('ul.pager > li > a, th.views-field a, .attachment .views-summary a')
      .unbind('click')
      .bind('click', function (e) {
        e.preventDefault();

        History.pushState(null, document.title, $(this).attr('href'));
        console.log(window.location.href);
        $(window).triggerHandler('statechange');
        $(this).triggerHandler('statechange');
      });
  }

  function bindForm ($view) {
    $view.find('.form-submit')
      .unbind('click')
      .bind('click', function (e) {
        e.preventDefault();
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
        History.pushState(null, document.title, url);
      });
  }


  Drupal.views.ajaxView.prototype.attachExposedFormAjax = function() {
    var button = $('input[type=submit], input[type=image]', this.$exposed_form);
    button = button[0];
    // @TODO virer l'utilisation de queryString dans url AJAX
    console.log(this.element_settings);
    this.element_settings.event = 'statechange';
    this.exposedFormAjax = new Drupal.ajax($(button).attr('id'), button, this.element_settings);
  };

  /**
   * Attach the ajax behavior to each link.
   */
  Drupal.views.ajaxView.prototype.attachPagerAjax = function() {
    this.element_settings.event = 'statechange';
    this.$view.find('ul.pager > li > a, th.views-field a, .attachment .views-summary a')
      .each(jQuery.proxy(this.attachPagerLinkAjax, this));
  };

  // @TODO restore state when hitting back/forward
  History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
    var State = History.getState(); // Note: We are using History.getState() instead of event.state
    console.log(State.data, State.title, State.url);
  });

  Drupal.behaviors.viewsAjaxHistory = {
    attach: function (context, settings) {
      var ajaxView = Drupal.views.ajaxView;

      // takes care of form and pagers
      $.each(Drupal.settings.views.ajaxViews, function(i, settings) {
        var $view = $('.view-dom-id-' + settings.view_dom_id);
          //.ajaxSend(function () {console.log(arguments);});//.ajaxSend(ajaxHandle);
        bindPager($view);
        bindForm($view);
      });
    }
  };
}(jQuery));
