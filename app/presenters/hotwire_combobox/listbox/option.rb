class HotwireCombobox::Listbox::Option
  def initialize(option)
    @option = option.is_a?(Hash) ? Data.new(**option) : option
  end

  def render_in(view)
    view.tag.li content, **options
  end

  def value
    option.try(:value) || option.id
  end

  def autocompletable_as
    option.try(:autocompletable_as) || option.try(:display)
  end

  private
    Data = Struct.new :id, :value, :display, :content, :filterable_as, :autocompletable_as, keyword_init: true

    attr_reader :option

    def options
      {
        id: id,
        role: :option,
        class: "hw-combobox__option",
        data: data
      }
    end

    def id
      option.try(:id)
    end

    def data
      {
        action: "click->hw-combobox#selectOption",
        filterable_as: filterable_as,
        autocompletable_as: autocompletable_as,
        value: value
      }
    end

    def content
      option.try(:content) || option.try(:display)
    end

    def filterable_as
      option.try(:filterable_as) || option.try(:display)
    end
end
