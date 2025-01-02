require "system_test_helper"

class KeyboardNavigationTest < ApplicationSystemTestCase
  test "selecting with the keyboard" do
    visit html_options_path

    open_combobox "#state-field"
    type_in_combobox "#state-field", "mi"
    type_in_combobox "#state-field", :down, :down
    assert_selected_option_with text: "Mississippi"

    type_in_combobox "#state-field", :enter
    assert_closed_combobox
    assert_combobox_display_and_value "#state-field", "Mississippi", "MS"

    visit new_options_path

    open_combobox "#movie-field"
    type_in_combobox "#movie-field", "al"
    assert_text "Aliens" # wait for async filter
    type_in_combobox "#movie-field", :down, :down
    assert_selected_option_with text: "Aliens"
    type_in_combobox "#movie-field", :enter
    assert_combobox_display_and_value "#movie-field", "Aliens", movies(:aliens).id

    open_combobox "#movie-field"
    assert_options_with count: 1 # Aliens
  end

  test "pressing enter locks in the current selection, but editing the text field resets it" do
    visit html_options_path

    open_combobox "#state-field"
    type_in_combobox "#state-field", "is", :enter
    assert_closed_combobox
    assert_combobox_display_and_value "#state-field", "Illinois", "IL"
    assert_no_visible_selected_option # because the list is closed

    type_in_combobox "#state-field", :backspace
    assert_closed_combobox
    assert_combobox_display_and_value "#state-field", "Illinoi", nil

    open_combobox "#state-field"
    assert_open_combobox
    assert_no_visible_selected_option
    assert_combobox_display_and_value "#state-field", "Illinoi", nil
  end

  test "navigating with the arrow keys" do
    visit html_options_path

    open_combobox "#state-field"

    type_in_combobox "#state-field", :down
    assert_selected_option_with text: "Alabama"

    type_in_combobox "#state-field", :down
    assert_selected_option_with text: "Alaska"

    type_in_combobox "#state-field", :down
    assert_selected_option_with text: "Arizona"

    type_in_combobox "#state-field", :up
    assert_selected_option_with text: "Alaska"

    type_in_combobox "#state-field", :up
    assert_selected_option_with text: "Alabama"

    # wrap around
    type_in_combobox "#state-field", :up
    assert_selected_option_with text: "Wyoming"

    type_in_combobox "#state-field", :down
    assert_selected_option_with text: "Alabama"

    # home and end keys
    type_in_combobox "#state-field", :end
    assert_selected_option_with text: "Wyoming"

    type_in_combobox "#state-field", :home
    assert_selected_option_with text: "Alabama"
  end
end
