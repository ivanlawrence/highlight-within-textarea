(function($) {
	var ID = 'hwt';

	var HighlightWithinTextarea = function($el, options) {
		this.$el = $el;
		this.options = $.extend({}, this.defaultOptions, options);
		this.generate();
	};

	HighlightWithinTextarea.prototype = {
		defaultOptions: {
			// default callback is basically a no-op
			onInput: function(text) { return text; }
		},

		generate: function() {
			this.$wrapper = $('<div>', { class: ID + '-wrapper' });
			this.$backdrop = $('<div>', { class: ID + '-backdrop' });
			this.$content = $('<div>', { class: ID + '-text ' + ID + '-content' });

			this.$el
				.addClass(ID + '-text ' + ID + '-input')
				.wrap(this.$wrapper)
				.before(this.$backdrop.append(this.$content))
				.on('input.' + ID, this.handleInput.bind(this))
				.on('scroll.' + ID, this.handleScroll.bind(this));

			// some browsers have specific quirks to work around that are not a
			// matter of feature detection
			this.fixFirefox();
			this.fixIOS();

			// pre-fire this event to highlight any existing input
			this.handleInput(this.$el[0]);
		},

		fixFirefox: function() {
			var isFirefox = window.navigator.userAgent.toLowerCase().indexOf('firefox') !== -1;

			// Firefox doesn't show text that scrolls into the padding of a
			// textarea, so rearrange a couple box models to make highlights
			// behave the same way
			if (isFirefox) {
				// take padding and border pixels from content div
				var padding = this.$content.css([
					'padding-top', 'padding-right', 'padding-bottom', 'padding-left'
				]);
				var border = this.$content.css([
					'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'
				]);
				this.$content.css({
					'padding': '0',
					'border-width': '0'
				});

				this.$backdrop
					.css({
						// give padding pixels to backdrop div
						'margin-top': '+=' + padding['padding-top'],
						'margin-right': '+=' + padding['padding-right'],
						'margin-bottom': '+=' + padding['padding-bottom'],
						'margin-left': '+=' + padding['padding-left'],
					})
					.css({
						// give border pixels to backdrop div
						'margin-top': '+=' + border['border-top-width'],
						'margin-right': '+=' + border['border-right-width'],
						'margin-bottom': '+=' + border['border-bottom-width'],
						'margin-left': '+=' + border['border-left-width'],
					});
			}
		},

		fixIOS: function() {
			// Windows Phone flags itself as "like iPhone", thus the extra check
			var ua = window.navigator.userAgent.toLowerCase();
			var isIOS = !!ua.match(/ipad|iphone|ipod/);
			var isWinPhone = ua.indexOf('windows phone') !== -1;

			// iOS adds 3px of (unremovable) padding to the left and right of a
			// textarea, so adjust content div to match
			if (isIOS && !isWinPhone) {
				this.$content.css({
					'padding-left': '+=3px',
					'padding-right': '+=3px'
				});
			}
		},

		getType: function(instance) {
			return Object.prototype.toString.call(instance)
				.replace('[object ', '')
				.replace(']', '')
				.toLowerCase();
		},

		handleInput: function() {
			var content = this.$el.val()
			var payload = this.options.onInput(content);
			switch (this.getType(payload)) {
				case 'string':
					content = this.markString(content, payload);
					break;
				case 'regexp':
					content = this.markRegExp(content, payload);
					break;
				case 'array':
					content = this.markArray(content, payload);
					break;
				default:
					throw 'Unrecognized payload type returned from onInput callback.';
			}

			// this keeps scrolling aligned when input ends with a newline
			content = content.replace(/\n$/, '\n\n');
			this.$content.html(content);
		},

		handleScroll: function() {
			var scrollTop = this.$el.scrollTop();
			this.$backdrop.scrollTop(scrollTop);
		},

		markString: function(content, payload) {
			// just a sanity check to make sure content isn't out of whack
			var stripped = payload.replace(/<\/?mark>/gi, '');
			if (stripped !== content) {
				throw 'Unallowed changes in string returned from onInput callback.';
			}
			return payload;
		},

		markRegExp: function(content, payload) {
			return content.replace(payload, '<mark>$&</mark>');
		},

		markArray: function(content, payload) {
			var offset = 0;
			payload.forEach(function(element) {
				// insert open tag
				var open = element[0] + offset;
				content = content.slice(0, open) + '<mark>' + content.slice(open);
				offset += 6;

				// insert close tag
				var close = element[1] + offset;
				content = content.slice(0, close) + '</mark>' + content.slice(close);
				offset += 7;
			}, this);
			return content;
		},

		destroy: function() {
			this.$backdrop.remove();
			this.$el
				.unwrap()
				.removeClass(ID + '-text ' + ID + '-input')
				.off(ID)
				.removeData(ID);
		},
	};

	// register the jQuery plugin
	$.fn.highlightWithinTextarea = function(options) {
		return this.each(function() {
			var $this = $(this);

			var highlightWithinTextarea = $this.data(ID);
			if (highlightWithinTextarea) {
				highlightWithinTextarea.destroy();
			}

			highlightWithinTextarea = new HighlightWithinTextarea($this, options);
			$this.data(ID, highlightWithinTextarea);
		});
	};
})(jQuery);