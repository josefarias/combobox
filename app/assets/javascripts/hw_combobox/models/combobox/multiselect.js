import Combobox from "hw_combobox/models/combobox/base"
import { cancel, nextRepaint } from "hw_combobox/helpers"
import { post } from "hw_combobox/vendor/requestjs"

Combobox.Multiselect = Base => class extends Base {
  navigateChip(event) {
    this._chipKeyHandlers[event.key]?.call(this, event)
  }

  removeChip({ currentTarget, params }) {
    let display
    const option = this._optionElementWithValue(params.value)

    if (option) {
      display = option.getAttribute(this.autocompletableAttributeValue)
      this._markNotSelected(option)
      this._markNotMultiselected(option)
    } else {
      display = params.value // for new options
    }

    this._removeFromFieldValue(params.value)
    this._filter("hw:multiselectSync")

    currentTarget.closest("[data-hw-combobox-chip]").remove()

    if (!this._isSmallViewport) {
      this.open()
    }

    this._announceToScreenReader(display, "removed")
    this._dispatchRemovalEvent({ removedDisplay: display, removedValue: params.value })
  }

  hideChipsForCache() {
    this.element.querySelectorAll("[data-hw-combobox-chip]").forEach(chip => chip.hidden = true)
  }

  _chipKeyHandlers = {
    Backspace: (event) => {
      this.removeChip(event)
      cancel(event)
    },
    Enter: (event) => {
      this.removeChip(event)
      cancel(event)
    },
    Space: (event) => {
      this.removeChip(event)
      cancel(event)
    },
    Escape: (event) => {
      this.open()
      cancel(event)
    }
  }

  _connectMultiselect() {
    if (!this._isMultiPreselected) {
      this._preselectMultiple()
      this._markMultiPreselected()
    }
  }

  async _createChip(shouldReopen) {
    if (!this._isMultiselect) return

    this._beforeClearingMultiselectQuery(async (display, value) => {
      this._fullQuery = ""

      this._filter("hw:multiselectSync")
      this._requestChips(value)
      this._addToFieldValue(value)

      if (shouldReopen) {
        await nextRepaint()
        this.open()
      }

      this._announceToScreenReader(display, "multi-selected. Press Shift + Tab, then Enter to remove.")
    })
  }

  async _requestChips(values) {
    await post(this.selectionChipSrcValue, {
      responseKind: "turbo-stream",
      query: {
        for_id: this.element.dataset.asyncId,
        combobox_values: values
      }
    })
  }

  _beforeClearingMultiselectQuery(callback) {
    const display = this.hiddenFieldTarget.dataset.displayForMultiselect
    const value = this.hiddenFieldTarget.dataset.valueForMultiselect

    if (value && !this._fieldValue.has(value)) {
      callback(display, value)
    }

    this.hiddenFieldTarget.dataset.displayForMultiselect = ""
    this.hiddenFieldTarget.dataset.valueForMultiselect = ""
  }

  _resetMultiselectionMarks() {
    if (!this._isMultiselect) return

    this._fieldValueArray.forEach(value => {
      const option = this._optionElementWithValue(value)

      if (option) {
        option.setAttribute("data-multiselected", "")
        option.hidden = true
      }
    })
  }

  _markNotMultiselected(option) {
    if (!this._isMultiselect) return

    option.removeAttribute("data-multiselected")
    option.hidden = false
  }

  _addToFieldValue(value) {
    const newValue = this._fieldValue

    newValue.add(String(value))
    this.hiddenFieldTarget.value = Array.from(newValue).join(",")

    if (this._isSync) this._resetMultiselectionMarks()
  }

  _removeFromFieldValue(value) {
    const newValue = this._fieldValue

    newValue.delete(String(value))
    this.hiddenFieldTarget.value = Array.from(newValue).join(",")

    if (this._isSync) this._resetMultiselectionMarks()
  }

  _focusLastChipDismisser() {
    this.chipDismisserTargets[this.chipDismisserTargets.length - 1]?.focus()
  }

  _markMultiPreselected() {
    this.element.dataset.multiPreselected = ""
  }

  get _isMultiselect() {
    return this.hasSelectionChipSrcValue
  }

  get _isSingleSelect() {
    return !this._isMultiselect
  }

  get _isMultiPreselected() {
    return this.element.hasAttribute("data-multi-preselected")
  }
}
