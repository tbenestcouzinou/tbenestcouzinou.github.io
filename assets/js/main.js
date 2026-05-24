/*
	Strata by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var $window = $(window),
		$body = $('body'),
		$header = $('#header'),
		$footer = $('#footer'),
		$main = $('#main'),
		$themeToggleButtons = $('[data-theme-toggle]'),
		settings = {

			// Parallax background effect?
				parallax: true,

			// Parallax factor (lower = more intense, higher = less intense).
				parallaxFactor: 20

		};

	// Breakpoints.
		breakpoints({
			xlarge:  [ '1281px',  '1800px' ],
			large:   [ '981px',   '1280px' ],
			medium:  [ '737px',   '980px'  ],
			small:   [ '481px',   '736px'  ],
			xsmall:  [ null,      '480px'  ],
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Touch?
		if (browser.mobile) {

			// Turn on touch mode.
				$body.addClass('is-touch');

			// Height fix (mostly for iOS).
				window.setTimeout(function() {
					$window.scrollTop($window.scrollTop() + 1);
				}, 0);

		}

	// Theme toggle (desktop + mobile).
		(function() {
			var storageKey = 'theme';
			var darkClass = 'dark-mode';

			function getStoredTheme() {
				try {
					return window.localStorage.getItem(storageKey);
				} catch (error) {
					return null;
				}
			}

			function setStoredTheme(theme) {
				try {
					window.localStorage.setItem(storageKey, theme);
				} catch (error) {
					// Ignore storage failures.
				}
			}

			function isDarkModeEnabled() {
				return $body.hasClass(darkClass);
			}

			function refreshToggleButtons() {
				var enabled = isDarkModeEnabled();
				var ariaLabel = enabled ? 'Disable dark mode' : 'Enable dark mode';

				$themeToggleButtons.each(function() {
					var $button = $(this);
					$button.attr('aria-pressed', enabled ? 'true' : 'false');
					$button.attr('aria-label', ariaLabel);
				});
			}

			function applyTheme(theme) {
				var isDark = theme === 'dark';

				$body.toggleClass(darkClass, isDark);
				setStoredTheme(theme);
				refreshToggleButtons();
			}

			function getPreferredTheme() {
				var storedTheme = getStoredTheme();
				if (storedTheme === 'dark' || storedTheme === 'light') {
					return storedTheme;
				}

				if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
					return 'dark';
				}

				return 'light';
			}

			applyTheme(getPreferredTheme());

			$themeToggleButtons.on('click', function() {
				applyTheme(isDarkModeEnabled() ? 'light' : 'dark');
			});
		})();

	// Mobile menu: close when clicking outside or pressing Escape.
		(function() {
			var $mobileNav = $('#menu-header .mobile-nav');

			if (!$mobileNav.length) {
				return;
			}

			$(document).on('click', function(event) {
				if (!$mobileNav.is('[open]')) {
					return;
				}

				if ($(event.target).closest('#menu-header .mobile-nav').length) {
					return;
				}

				$mobileNav.removeAttr('open');
			});

			$mobileNav.find('a').on('click', function() {
				$mobileNav.removeAttr('open');
			});

			$(document).on('keydown', function(event) {
				if (event.key === 'Escape') {
					$mobileNav.removeAttr('open');
				}
			});
		})();

	// Footer.
		breakpoints.on('<=medium', function() {
			$footer.insertAfter($main);
		});

		breakpoints.on('>medium', function() {
			$footer.appendTo($header);
		});

	// Header.

		// Parallax background.

			// Disable parallax on IE (smooth scrolling is jerky), and on mobile platforms (= better performance).
				if (browser.name == 'ie'
				||	browser.mobile)
					settings.parallax = false;

			if (settings.parallax) {

				breakpoints.on('<=medium', function() {

					$window.off('scroll.strata_parallax');
					$header.css('background-position', '');

				});

				breakpoints.on('>medium', function() {

					$header.css('background-position', 'left 0px');

					$window.on('scroll.strata_parallax', function() {
						$header.css('background-position', 'left ' + (-1 * (parseInt($window.scrollTop()) / settings.parallaxFactor)) + 'px');
					});

				});

				$window.on('load', function() {
					$window.triggerHandler('scroll');
				});

			}

	// Main Sections: Two.

		// Lightbox gallery.
			$window.on('load', function() {

				$('#two').poptrox({
					caption: function($a) { return $a.next('h3').text(); },
					overlayColor: '#2c2c2c',
					overlayOpacity: 0.85,
					popupCloserText: '',
					popupLoaderText: '',
					selector: '.work-item a.image',
					usePopupCaption: true,
					usePopupDefaultStyling: false,
					usePopupEasyClose: false,
					usePopupNav: true,
					windowMargin: (breakpoints.active('<=small') ? 0 : 50)
				});

			});

})(jQuery);