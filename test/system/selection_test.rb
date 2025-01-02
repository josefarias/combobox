require "system_test_helper"

class SelectionTest < ApplicationSystemTestCase
  test "clicking away locks in the current selection" do
    visit html_options_path

    open_combobox "#state-field"
    type_in_combobox "#state-field", "is"
    assert_selected_option_with text: "Illinois"
    click_away
    assert_closed_combobox
    assert_combobox_display_and_value "#state-field", "Illinois", "IL"

    open_combobox "#state-field"
    "Illinois".chars.each { type_in_combobox "#state-field", :arrow_right }
    type_in_combobox "#state-field", :backspace
    assert_combobox_display_and_value "#state-field", "Illinoi", nil
    assert_no_visible_selected_option
    click_away
    assert_closed_combobox
    assert_combobox_display_and_value "#state-field", "Illinois", "IL"

    on_small_screen do
      visit html_options_path

      open_combobox "#state-field"

      within "dialog" do
        type_in_combobox "#state-field-hw-dialog-combobox", "il"
        assert_selected_option_with text: "Illinois"
        assert_combobox_display "#state-field-hw-dialog-combobox", "Illinois"
      end

      click_away
      assert_closed_combobox
      assert_combobox_display_and_value "#state-field", "Illinois", "IL"

      open_combobox "#state-field"

      within "dialog" do
        "Illinois".chars.each { type_in_combobox "#state-field-hw-dialog-combobox", :arrow_right }
        type_in_combobox "#state-field-hw-dialog-combobox", :backspace
        assert_combobox_display "#state-field-hw-dialog-combobox", "Illinoi"
        assert_no_visible_selected_option
      end

      click_away
      assert_closed_combobox
      assert_combobox_display_and_value "#state-field", "Illinois", "IL"
    end

    open_combobox "#state-field"
    assert_options_with count: 1
  end

  test "clicking away locks in the current selection for async comboboxes" do
    visit async_path

    open_combobox "#movie-field"
    type_in_combobox "#movie-field", "wh"
    assert_selected_option_with text: "Whiplash"
    click_away
    assert_closed_combobox
    assert_combobox_display_and_value "#movie-field", "Whiplash", movies(:whiplash).id

    open_combobox "#movie-field"
    "Whiplash".chars.each { type_in_combobox "#movie-field", :arrow_right }
    type_in_combobox "#movie-field", :backspace
    assert_combobox_display_and_value "#movie-field", "Whiplas", nil
    assert_no_visible_selected_option
    click_away
    assert_closed_combobox
    assert_combobox_display_and_value "#movie-field", "Whiplash", movies(:whiplash).id

    on_small_screen do
      visit async_path

      open_combobox "#movie-field"

      within "dialog" do
        type_in_combobox "#movie-field-hw-dialog-combobox", "wh"
        assert_selected_option_with text: "Whiplash"
        assert_combobox_display "#movie-field-hw-dialog-combobox", "Whiplash"
      end

      click_away
      assert_closed_combobox
      assert_combobox_display_and_value "#movie-field", "Whiplash", movies(:whiplash).id

      open_combobox "#movie-field"

      within "dialog" do
        "Whiplash".chars.each { type_in_combobox "#movie-field-hw-dialog-combobox", :arrow_right }
        type_in_combobox "#movie-field-hw-dialog-combobox", :backspace
        assert_combobox_display "#movie-field-hw-dialog-combobox", "Whiplas"
        assert_no_visible_selected_option
      end

      click_away
      assert_closed_combobox
      assert_combobox_display_and_value "#movie-field", "Whiplash", movies(:whiplash).id
    end

    open_combobox "#movie-field"
    assert_options_with count: 1
  end

  test "focusing away locks in the current selection" do
    visit plain_path

    open_combobox "#state-field"
    type_in_combobox "#state-field", "is"
    tab_away
    assert_closed_combobox
    assert_combobox_display_and_value "#state-field", "Illinois", "IL"

    open_combobox "#state-field"
    assert_options_with count: 1
  end

  test "select option by clicking on it" do
    visit html_options_path

    open_combobox "#state-field"
    assert_combobox_display_and_value "#state-field", nil, nil

    click_on_option "Alaska"
    assert_closed_combobox
    assert_combobox_display_and_value "#state-field", "Alaska", "AK"

    open_combobox "#state-field"
    assert_options_with count: 1

    delete_from_combobox "#state-field", "Alaska", original: "Alaska"
    assert_options_with count: State.count

    type_in_combobox "#state-field", :down, :down, :down
    assert_selected_option_with text: "Arizona"
    click_on_option "Alabama"
    assert_closed_combobox
    assert_combobox_display_and_value "#state-field", "Alabama", "AL"
  end

  test "selecting an option marks combobox as queried" do
    visit async_path

    assert_no_selector ".hw-combobox__input[data-queried]"
    open_combobox "#movie-field"
    click_on_option "Aladdin"
    assert_closed_combobox
    assert_combobox_display_and_value "#movie-field", "Aladdin", movies(:aladdin).id
    assert_selector ".hw-combobox__input[data-queried]"

    on_small_screen do
      visit async_path

      assert_no_selector ".hw-combobox__input[data-queried]"
      open_combobox "#movie-field"
      click_on_option "Aladdin"
      assert_closed_combobox
      assert_combobox_display_and_value "#movie-field", "Aladdin", movies(:aladdin).id
      assert_selector ".hw-combobox__input[data-queried]"
    end
  end
end
