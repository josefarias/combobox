module HotwireCombobox
  module Helper
    class << self
      delegate :bypass_convenience_methods?, to: :HotwireCombobox

      def hw_alias(method_name)
        unless bypass_convenience_methods?
          alias_method method_name.to_s.sub(/^hw_/, ""), method_name
        end
      end
    end

    def hw_combobox_style_tag(*args, **kwargs)
      stylesheet_link_tag HotwireCombobox.stylesheet_path, *args, **kwargs
    end

    def hw_combobox_tag(name, options_or_src = [], render_in: {}, include_blank: nil, **kwargs, &block)
      options, src = hw_extract_options_and_src options_or_src, render_in, include_blank
      component = HotwireCombobox::Component.new self, name, options: options, async_src: src, **kwargs
      render component, &block
    end

    def hw_combobox_options(
          options,
          render_in: {},
          include_blank: nil,
          display: :to_combobox_display,
          **custom_methods)
      if options.first.is_a? HotwireCombobox::Listbox::Option
        options
      else
        HotwireCombobox::Listbox::Item.collection_for \
          self,
          options,
          render_in: render_in,
          include_blank: include_blank,
          **custom_methods.merge(display: display)
      end
    end

    def hw_paginated_combobox_options(
          options,
          for_id: params[:for_id],
          src: request.path,
          next_page: nil,
          render_in: {},
          include_blank: {},
          **custom_methods)
      include_blank = params[:page].to_i > 0 ? nil : include_blank
      options = hw_combobox_options options, render_in: render_in, include_blank: include_blank, **custom_methods
      this_page = render "hotwire_combobox/paginated_options", for_id: for_id, options: options
      next_page = render "hotwire_combobox/next_page", for_id: for_id, src: src, next_page: next_page

      safe_join [ this_page, next_page ]
    end
    alias_method :hw_async_combobox_options, :hw_paginated_combobox_options

    def hw_within_combobox_selection_chip(for_id: params[:for_id], &block)
      render layout: "hotwire_combobox/layouts/selection_chip", locals: { for_id: for_id }, &block
    end

    def hw_combobox_selection_chip(
          display:,
          value:,
          for_id: params[:for_id],
          remover_attrs: hw_combobox_chip_remover_attrs(display: display, value: value))
      render "hotwire_combobox/selection_chip",
        display: display,
        value: value,
        for_id: for_id,
        remover_attrs: remover_attrs
    end

    def hw_combobox_selection_chips_for(
          objects,
          display: :to_combobox_display,
          value: :id,
          for_id: params[:for_id])
      objects.map do |object|
        hw_combobox_selection_chip \
          display: hw_call_method(object, display),
          value: hw_call_method(object, value),
          for_id: for_id
      end.then { |chips| safe_join chips }
    end

    def hw_dismissing_combobox_selection_chip(display:, value:, for_id: params[:for_id])
      hw_combobox_selection_chip \
        display: display,
        value: value,
        for_id: for_id,
        remover_attrs: hw_combobox_dismissing_chip_remover_attrs(display, value)
    end

    def hw_dismissing_combobox_selection_chips_for(
          objects,
          display: :to_combobox_display,
          value: :id,
          for_id: params[:for_id])
      objects.map do |object|
        hw_dismissing_combobox_selection_chip \
          display: hw_call_method(object, display),
          value: hw_call_method(object, value),
          for_id: for_id
      end.then { |chips| safe_join chips }
    end

    def hw_combobox_chip_remover_attrs(display:, value:, **kwargs)
      {
        tabindex: "0",
        class: token_list("hw-combobox__chip__remover", kwargs[:class]),
        aria: { label: "Remove #{display}" },
        data: {
          action: "click->hw-combobox#removeChip:stop keydown->hw-combobox#navigateChip",
          hw_combobox_target: "chipDismisser",
          hw_combobox_value_param: value
        }
      }
    end

    def hw_combobox_dismissing_chip_remover_attrs(display, value)
      hw_combobox_chip_remover_attrs(display: display, value: value).tap do |attrs|
        attrs[:data][:hw_combobox_target] = token_list(attrs[:data][:hw_combobox_target], "closer")
      end
    end

    hw_alias :hw_combobox_style_tag
    hw_alias :hw_combobox_tag
    hw_alias :hw_combobox_options
    hw_alias :hw_paginated_combobox_options
    hw_alias :hw_async_combobox_options
    hw_alias :hw_within_combobox_selection_chip
    hw_alias :hw_combobox_selection_chip
    hw_alias :hw_combobox_selection_chips_for
    hw_alias :hw_dismissing_combobox_selection_chip
    hw_alias :hw_dismissing_combobox_selection_chips_for
    hw_alias :hw_combobox_chip_remover_attrs
    hw_alias :hw_combobox_dismissing_chip_remover_attrs

    # private library use only
      def hw_listbox_id(id)
        "#{id}-hw-listbox"
      end

      def hw_pagination_frame_wrapper_id(id)
        "#{id}__hw_combobox_pagination__wrapper"
      end

      def hw_pagination_frame_id(id)
        "#{id}__hw_combobox_pagination"
      end

      def hw_combobox_next_page_uri(uri, next_page, for_id)
        if next_page
          hw_uri_with_params uri,
            page: next_page,
            q: params[:q],
            for_id: for_id,
            format: :turbo_stream
        end
      end

      def hw_combobox_page_stream_action
        params[:page].to_i > 0 ? :append : :update
      end

      def hw_uri_with_params(url_or_path, **params)
        URI.parse(url_or_path).tap do |url_or_path|
          query = URI.decode_www_form(url_or_path.query || "").to_h.merge(params)
          url_or_path.query = URI.encode_www_form query
        end.to_s
      rescue URI::InvalidURIError
        url_or_path
      end

      def hw_call_method_or_proc(object, method_or_proc)
        if method_or_proc.is_a? Proc
          method_or_proc.call object
        else
          hw_call_method object, method_or_proc
        end
      end

    private
      def hw_extract_options_and_src(options_or_src, render_in, include_blank)
        if options_or_src.is_a? String
          [ [], options_or_src ]
        else
          [ hw_combobox_options(options_or_src, render_in: render_in, include_blank: include_blank), nil ]
        end
      end

      def hw_call_method(object, method)
        if object.respond_to? method
          object.public_send method
        else
          hw_raise_no_public_method_error object, method
        end
      end

      def hw_raise_no_public_method_error(object, method)
        if object.respond_to? method, true
          header = "`#{object.class}` responds to `##{method}` but the method is not public."
        else
          header = "`#{object.class}` does not respond to `##{method}`."
        end

        if method.to_s == "to_combobox_display"
          header << "\n\nThis method is used to determine how this option should appear in the combobox options list."
        end

        raise NoMethodError, <<~MSG
          [ACTION NEEDED] – Message from HotwireCombobox:

          #{header}

          Please add this as a public method and return a string.

          Example:
            class #{object.class} < ApplicationRecord
              def #{method}
                name # or `title`, `to_s`, etc.
              end
            end
        MSG
      end
  end
end
