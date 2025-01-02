require "system_test_helper"

class MultiselectTest < ApplicationSystemTestCase
  test "multiselect" do
    visit multiselect_path

    open_combobox "#states-field"

    click_on_option "Alabama"
    assert_chip_with text: "Alabama" # wait for async chip creation
    click_on_option "California"
    assert_chip_with text: "California"
    click_on_option "Arizona"
    assert_chip_with text: "Arizona"
    assert_no_visible_options_with text: "Alabama"
    assert_no_visible_options_with text: "California"
    assert_no_visible_options_with text: "Arizona"
    assert_combobox_display_and_value \
      "#states-field",
      %w[ Alabama California Arizona ],
      states(:alabama, :california, :arizona).pluck(:id)

    remove_chip "California"
    assert_option_with text: "California"

    assert_combobox_display_and_value \
      "#states-field",
      %w[ Alabama Arizona ],
      states(:alabama, :arizona).pluck(:id)
  end

  test "multiselect idiosyncrasies" do
    visit multiselect_path

    open_combobox "#states-field"
    assert_focused_combobox "#states-field"

    click_on_option "Alabama"
    assert_focused_combobox "#states-field"
    assert_chip_with text: "Alabama" # wait for async chip creation
    assert_no_visible_options_with text: "Alabama"
    type_in_combobox "#states-field", "ala"
    type_in_combobox "#states-field", :backspace # clear autocompleted portion
    assert_no_visible_options_with text: "Alabama"
    remove_chip "Alabama"
    assert_option_with text: "Alabama"

    click_on_option "Alabama"
    assert_chip_with text: "Alabama" # wait for async chip creation
    type_in_combobox "#states-field", "michi"
    assert_selected_option_with text: "Michigan"
    type_in_combobox "#states-field", :backspace # clear autocompleted portion
    assert_option_with text: "Michigan"
    remove_chip "Alabama"
    assert_no_visible_options_with text: "Alabama"
  end

  test "prefilled multiselect" do
    visit multiselect_async_html_path

    assert_closed_combobox
    assert_combobox_display_and_value \
      "#states-field",
      %w[ Alabama Alaska ],
      states(:alabama, :alaska).pluck(:id)
  end

  test "async multiselect" do
    visit multiselect_async_html_path

    open_combobox "#states-field"

    assert_option_with text: "Arizona"
    type_in_combobox "#states-field", "mi"
    assert_selected_option_with text: "Michigan"
    assert_options_with count: 4
    click_away
    assert_combobox_display_and_value \
      "#states-field",
      %w[ Alabama Alaska Michigan ],
      states(:alabama, :alaska, :michigan).pluck(:id)

    # pagination
    assert_options_with count: 8 # AL, AK, and MI are served but hidden
    find("#states-field-hw-listbox").scroll_to :bottom
    assert_options_with count: 13
  end

  test "html multiselect options and chips" do
    visit multiselect_async_html_path

    open_combobox "#states-field"

    assert_option_with html_markup: "div > p", text: "Arizona"
    assert_chip_with html_markup: "div > p", text: "Alabama"

    remove_chip "Alabama"

    assert_combobox_display_and_value \
      "#states-field",
      %w[ Alaska ],
      [ states(:alaska).id ]
  end

  test "multiselect form" do
    visit multiselect_prefilled_form_path

    assert_closed_combobox
    assert_combobox_display_and_value \
      "#user_visited_state_ids",
      %w[ Florida Illinois ],
      states(:florida, :illinois).pluck(:id)

    open_combobox "#user_visited_state_ids"
    type_in_combobox "#user_visited_state_ids", "Lou"
    click_on_option "Louisiana"
    assert_open_combobox
    assert_text "Alabama" # combobox is reset and still open

    assert_combobox_display_and_value \
      "#user_visited_state_ids",
      %w[ Florida Illinois Louisiana ],
      states(:florida, :illinois, :louisiana).pluck(:id)

    click_away
    find("input[type=submit]").click
    assert_text "User updated"

    assert_combobox_display_and_value \
      "#user_visited_state_ids",
      %w[ Florida Illinois Louisiana ],
      states(:florida, :illinois, :louisiana).pluck(:id)

    remove_chip "Florida"

    assert_combobox_display_and_value \
      "#user_visited_state_ids",
      %w[ Illinois Louisiana ],
      states(:illinois, :louisiana).pluck(:id)

    click_away
    find("input[type=submit]").click
    assert_text "User updated"

    assert_combobox_display_and_value \
      "#user_visited_state_ids",
      %w[ Illinois Louisiana ],
      states(:illinois, :louisiana).pluck(:id)
  end

  test "multiselect with dismissing streams" do
    visit multiselect_dismissing_path

    assert_closed_combobox

    open_combobox "#states-field"
    type_in_combobox "#states-field", "Lou"
    click_on_option "Louisiana"
    sleep 1
    assert_closed_combobox

    open_combobox "#async-states-field"
    type_in_combobox "#async-states-field", "Lou"
    click_on_option "Louisiana"
    sleep 1
    assert_closed_combobox
  end

  test "multiselect custom events" do
    visit multiselect_custom_events_path

    assert_text "Ready to listen for hw-combobox events!"
    assert_no_text "event: hw-combobox:preselection"
    assert_no_text "event: hw-combobox:selection"
    assert_no_text "preselections:"

    open_combobox "#states-field"
    type_in_combobox "#states-field", "mi"

    assert_text "event: hw-combobox:preselection"
    assert_text "value: #{states(:michigan).id}."
    assert_text "display: Michigan"
    assert_text "query: Mi"
    assert_text "fieldName: states"
    assert_text "isNewAndAllowed: false"
    assert_text "isValid: true"
    assert_text "previousValue: <empty>"
    assert_text "preselections: 2." # `m`, then `mi`
    assert_no_text "event: hw-combobox:selection"

    click_away
    assert_closed_combobox

    assert_text "event: hw-combobox:selection"
    assert_text "value: #{states(:michigan).id}."
    assert_text "display: Michigan"
    assert_text "query: Michigan"
    assert_text "fieldName: states"
    assert_text "isNewAndAllowed: <empty>"
    assert_text "isValid: true"
    assert_text "previousValue: <empty>"
    assert_text "selections: 1."

    assert_text "preselections: 3."

    remove_chip "Michigan"
    assert_open_combobox

    assert_text "removedDisplay: Michigan."
    assert_text "removedValue: #{states(:michigan).id}."
    assert_text "removals: 1."

    click_on_option "Arkansas"
    click_on_option "Colorado"

    assert_text "event: hw-combobox:preselection"
    assert_text "value: #{states(:arkansas, :colorado).pluck(:id).join(",")}."
    assert_text "display: Colorado."
    assert_text "query: Colorado."
    assert_text "fieldName: states."
    assert_text "isNewAndAllowed: false."
    assert_text "isValid: true."
    assert_text "previousValue: 1011954550."
    assert_text "removedDisplay: <empty>."
    assert_text "removedValue: <empty>."

    assert_text "event: hw-combobox:selection"
    assert_text "value: #{states(:arkansas, :colorado).pluck(:id).join(",")}."
    assert_text "display: Colorado."
    assert_text "query: Colorado."
    assert_text "fieldName: states."
    assert_text "isNewAndAllowed: <empty>."
    assert_text "isValid: true."
    assert_text "previousValue: <empty>."
    assert_text "removedDisplay: <empty>."
    assert_text "removedValue: <empty>."

    click_away

    assert_text "preselections: 7." # TODO: lockInSelection causes duplicate selection events; shouldn't lock-in unnecessarily
    assert_text "selections: 4."
  end

  test "navigating chips with keyboard" do
    visit multiselect_prefilled_form_path

    open_combobox "#user_visited_state_ids"
    assert_combobox_display "#user_visited_state_ids", %w[ Florida Illinois ]
    type_in_combobox "#user_visited_state_ids", :backspace, :enter
    assert_combobox_display "#user_visited_state_ids", %w[ Florida ]

    visit multiselect_prefilled_form_path

    open_combobox "#user_visited_state_ids"
    assert_combobox_display "#user_visited_state_ids", %w[ Florida Illinois ]
    type_in_combobox "#user_visited_state_ids", %i[shift tab], %i[shift tab], :enter
    assert_combobox_display "#user_visited_state_ids", %w[ Illinois ]
  end

  test "multiselect with new options" do
    visit multiselect_new_values_path

    open_combobox "#states-field"

    click_on_option "Alabama"
    assert_chip_with text: "Alabama"
    type_in_combobox "#states-field", "Newplace", :enter
    assert_chip_with text: "Newplace"

    assert_combobox_display_and_value \
      "#states-field",
      %w[ Alabama Newplace ],
      [ states(:alabama).id, "Newplace" ]

    remove_chip "Newplace"
    assert_combobox_display_and_value \
      "#states-field",
      %w[ Alabama ],
      [ states(:alabama).id ]

    type_in_combobox "#states-field", "New,place", :enter # comma is stripped away
    assert_chip_with text: "Newplace"
    click_away

    assert_combobox_display_and_value \
      "#states-field",
      %w[ Alabama Newplace ],
      [ states(:alabama).id, "Newplace" ]

    assert_difference -> { State.count }, +1 do
      find("input[type=submit]").click
      assert_text "Visits created"
    end

    assert_equal "Newplace", State.unscoped.last.name
    assert_equal %w[ Alabama Newplace ], User.first.visited_states.map(&:name)
  end
end
