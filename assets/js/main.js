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

	// Works section: load ADS articles from JSON and render them once.
		(function() {
			var $worksList = $('#works-list');
			var abstractIdCounter = 0;

			if (!$worksList.length) {
				return;
			}

			function escapeText(value) {
				return String(value)
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/"/g, '&quot;')
					.replace(/'/g, '&#39;');
			}

			function firstText(value) {
				if (Array.isArray(value)) {
					return firstText(value[0]);
				}

				if (value === null || value === undefined) {
					return '';
				}

				return String(value).trim();
			}

			function previewText(text, maxLength) {
				var limit = maxLength || 280;
				var normalized = firstText(text).replace(/\s+/g, ' ');

				if (!normalized) {
					return 'Abstract unavailable in ADS.';
				}

				if (normalized.length <= limit) {
					return normalized;
				}

				var slice = normalized.slice(0, limit);
				var lastSpace = slice.lastIndexOf(' ');
				return slice.slice(0, lastSpace > 0 ? lastSpace : limit).trim() + '...';
			}

			function formatDate(value) {
				var parsedDate = new Date(value);

				if (Number.isNaN(parsedDate.getTime())) {
					return firstText(value) || 'Date unavailable';
				}

				return new Intl.DateTimeFormat('en-GB', {
					day: '2-digit',
					month: 'long',
					year: 'numeric'
				}).format(parsedDate);
			}

			function pickUrl(article) {
				if (article.doi) {
					return 'https://doi.org/' + article.doi;
				}

				if (article.bibcode) {
					return 'https://ui.adsabs.harvard.edu/abs/' + encodeURIComponent(article.bibcode) + '/abstract';
				}

				return 'https://ui.adsabs.harvard.edu/';
			}

			function nextAbstractId(prefix) {
				abstractIdCounter += 1;
				return prefix + abstractIdCounter;
			}

			function renderArticle(article) {
				var title = firstText(article.title) || 'Untitled article';
				var authors = Array.isArray(article.author) ? article.author.map(function(author) {
					return firstText(author);
				}).filter(Boolean).join(', ') : firstText(article.author);
				var journal = firstText(article.pub) || 'ADS record';
				var abstract = firstText(article.abstract) || 'Abstract unavailable in ADS.';
				var previewId = nextAbstractId('AbstractPreview-');
				var fullId = nextAbstractId('AbstractFull-');

				var $article = $('<article>', {class: 'col-6 col-12-xsmall work-item'});
				var $link = $('<a>', {
					href: pickUrl(article),
					target: '_blank',
					rel: 'noopener noreferrer'
				}).text(title);
				var $meta = $('<h4>', {class: 'work-meta'}).text(journal + ' · ' + formatDate(article.date));
				var $toggle = $('<div>', {
					class: 'readmore-btn js-toggle-abstract',
					role: 'button',
					tabindex: 0,
					'aria-controls': fullId,
					'aria-expanded': 'false'
				});

				$toggle.attr('data-full', '#' + fullId);
				$toggle.attr('data-preview', '#' + previewId);
				$toggle.attr('data-read-text', 'Read Abstract');
				$toggle.attr('data-hide-text', 'Hide Abstract');
				$toggle.text('Read Abstract');
				var $wrapper = $('<div>', {class: 'text-wrapper'});
				var $preview = $('<p>', {
					class: 'abstract-preview',
					id: previewId
				}).text(previewText(abstract));
				var $full = $('<p>', {
					class: 'abstract-full',
					id: fullId,
					hidden: true
				}).text(abstract);

				$article.append($link);
				$article.append($('<h3>').text(authors || 'Author unavailable'));
				$article.append($meta);
				$wrapper.append($preview, $full);
				$article.append($toggle);
				$article.append($wrapper);

				return $article;
			}

			function setLoadingMessage(message) {
				$worksList.empty().append($('<p>', {class: 'works-loading'}).text(message));
			}

			$(document).on('click', '.js-toggle-abstract', function(event) {
				event.preventDefault();

				var $button = $(this);
				var previewSelector = $button.attr('data-preview');
				var fullSelector = $button.attr('data-full');
				var readText = $button.attr('data-read-text') || 'Read abstract';
				var hideText = $button.attr('data-hide-text') || 'Hide abstract';
				var $preview = previewSelector ? $(previewSelector) : $button.closest('.work-item').find('.abstract-preview');
				var $full = fullSelector ? $(fullSelector) : $button.closest('.work-item').find('.abstract-full');
				var isHidden = $full.prop('hidden');

				$full.prop('hidden', !isHidden);
				$preview.prop('hidden', isHidden);
				$button.text(isHidden ? hideText : readText);
				$button.attr('aria-expanded', isHidden ? 'true' : 'false');
			});

			$(document).on('keydown', '.js-toggle-abstract', function(event) {
				if (event.key !== 'Enter' && event.key !== ' ') {
					return;
				}

				event.preventDefault();
				$(this).trigger('click');
			});

			setLoadingMessage('Loading the latest ADS articles...');

			$.getJSON($worksList.data('worksSource') || 'data/ads-works.json')
				.done(function(payload) {
					var articles = Array.isArray(payload && payload.articles) ? payload.articles : [];
					var $fragment = $(document.createDocumentFragment());

					if (!articles.length) {
						setLoadingMessage('No ADS articles found yet.');
						return;
					}

					articles.forEach(function(article) {
						$fragment.append(renderArticle(article));
					});

					$worksList.empty().append($fragment);
				})
				.fail(function() {
					setLoadingMessage('Unable to load ADS articles right now.');
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