module HotwireCombobox::Component::Markup::Wrapper
  def main_wrapper_attrs
    customize :main_wrapper, base: {
      class: "hw-combobox__main__wrapper",
      data: { action: ("click->hw-combobox#open:self" if multiselect?), hw_combobox_target: "mainWrapper" } }
  end
end
