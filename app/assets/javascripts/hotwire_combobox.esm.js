/*!
HotwireCombobox 0.3.2
*/
import { Controller } from '@hotwired/stimulus';

const Combobox = {};

Combobox.Actors = Base => class extends Base {
  _initializeActors() {
    this._actingListbox = this.listboxTarget;
    this._actingCombobox = this.comboboxTarget;
  }

  _forAllComboboxes(callback) {
    this._allComboboxes.forEach(callback);
  }

  get _actingListbox() {
    return this.actingListbox
  }

  set _actingListbox(listbox) {
    this.actingListbox = listbox;
  }

  get _actingCombobox() {
    return this.actingCombobox
  }

  set _actingCombobox(combobox) {
    this.actingCombobox = combobox;
  }

  get _allComboboxes() {
    return [ this.comboboxTarget, this.dialogComboboxTarget ]
  }
};

Combobox.Announcements = Base => class extends Base {
  _announceToScreenReader(display, action) {
    this.announcerTarget.innerText = `${display} ${action}`;
  }
};

Combobox.AsyncLoading = Base => class extends Base {
  get _isAsync() {
    return this.hasAsyncSrcValue
  }

  get _isSync() {
    return !this._isAsync
  }
};

function Concerns(Base, ...mixins) {
  return mixins.reduce((accumulator, current) => current(accumulator), Base)
}

function visible(target) {
  return !(target.hidden || target.closest("[hidden]"))
}

function wrapAroundAccess(array, index) {
  const first = 0;
  const last = array.length - 1;

  if (index < first) return array[last]
  if (index > last) return array[first]
  return array[index]
}

function applyFilter(query, { matching }) {
  return (target) => {
    if (query) {
      const value = target.getAttribute(matching) || "";
      const match = value.toLowerCase().includes(query.toLowerCase());

      target.hidden = !match;
    } else {
      target.hidden = false;
    }
  }
}

function cancel(event) {
  event.stopPropagation();
  event.preventDefault();
}

function startsWith(string, substring) {
  return string.toLowerCase().startsWith(substring.toLowerCase())
}

function debounce(fn, delay = 150) {
  let timeoutId = null;

  return (...args) => {
    const callback = () => fn.apply(this, args);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  }
}

function isDeleteEvent(event) {
  return event.inputType === "deleteContentBackward" || event.inputType === "deleteWordBackward"
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function unselectedPortion(element) {
  if (element.selectionStart === element.selectionEnd) {
    return element.value
  } else {
    return element.value.substring(0, element.selectionStart)
  }
}

function dispatch(eventName, { target, cancelable, detail } = {}) {
  const event = new CustomEvent(eventName, {
    cancelable,
    bubbles: true,
    composed: true,
    detail
  });

  if (target && target.isConnected) {
    target.dispatchEvent(event);
  } else {
    document.documentElement.dispatchEvent(event);
  }

  return event
}

function nextRepaint() {
  if (document.visibilityState === "hidden") {
    return nextEventLoopTick()
  } else {
    return nextAnimationFrame()
  }
}

function nextAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

function nextEventLoopTick() {
  return new Promise((resolve) => setTimeout(() => resolve(), 0))
}

function randomUUID() {
  const uuidPattern = "10000000-1000-4000-8000-100000000000";

  return uuidPattern.replace(/[018]/g, (match) => {
    const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
    return (match ^ (randomByte & 15) >> (match / 4)).toString(16)
  })
}

Combobox.Autocomplete = Base => class extends Base {
  _connectListAutocomplete() {
    if (!this._autocompletesList) {
      this._visuallyHideListbox();
    }
  }

  _replaceFullQueryWithAutocompletedValue(option) {
    const autocompletedValue = option.getAttribute(this.autocompletableAttributeValue);

    this._fullQuery = autocompletedValue;
    this._actingCombobox.setSelectionRange(autocompletedValue.length, autocompletedValue.length);
  }

  _autocompleteMissingPortion(option) {
    const typedValue = this._typedQuery;
    const autocompletedValue = option.getAttribute(this.autocompletableAttributeValue);

    if (this._autocompletesInline && startsWith(autocompletedValue, typedValue)) {
      this._fullQuery = autocompletedValue;
      this._actingCombobox.setSelectionRange(typedValue.length, autocompletedValue.length);
    }
  }

  // +visuallyHideListbox+ hides the listbox from the user,
  // but makes it still searchable by JS.
  _visuallyHideListbox() {
    this.listboxTarget.style.display = "none";
  }

  get _isExactAutocompleteMatch() {
    return this._immediatelyAutocompletableValue === this._fullQuery
  }

  // All `_isExactAutocompleteMatch` matches are `_isPartialAutocompleteMatch` matches
  // but not all `_isPartialAutocompleteMatch` matches are `_isExactAutocompleteMatch` matches.
  get _isPartialAutocompleteMatch() {
    return !!this._immediatelyAutocompletableValue &&
      startsWith(this._immediatelyAutocompletableValue, this._fullQuery)
  }

  get _autocompletesList() {
    return this.autocompleteValue === "both" || this.autocompleteValue === "list"
  }

  get _autocompletesInline() {
    return this.autocompleteValue === "both" || this.autocompleteValue === "inline"
  }

  get _immediatelyAutocompletableValue() {
    return this._ensurableOption?.getAttribute(this.autocompletableAttributeValue)
  }
};

const MAX_CALLBACK_ATTEMPTS = 3;

Combobox.Callbacks = Base => class extends Base {
  _initializeCallbacks() {
    this.callbackQueue = [];
    this.callbackExecutionAttempts = {};
  }

  _enqueueCallback() {
    const callbackId = randomUUID();
    this.callbackQueue.push(callbackId);
    return callbackId
  }

  _isNextCallback(callbackId) {
    return this._nextCallback === callbackId
  }

  _callbackAttemptsExceeded(callbackId) {
    return this._callbackAttempts(callbackId) > MAX_CALLBACK_ATTEMPTS
  }

  _callbackAttempts(callbackId) {
    return this.callbackExecutionAttempts[callbackId] || 0
  }

  _recordCallbackAttempt(callbackId) {
    this.callbackExecutionAttempts[callbackId] = this._callbackAttempts(callbackId) + 1;
  }

  _dequeueCallback(callbackId) {
    this.callbackQueue = this.callbackQueue.filter(id => id !== callbackId);
    this._forgetCallbackExecutionAttempts(callbackId);
  }

  _forgetCallbackExecutionAttempts(callbackId) {
    delete this.callbackExecutionAttempts[callbackId];
  }

  get _nextCallback() {
    return this.callbackQueue[0]
  }
};

Combobox.Dialog = Base => class extends Base {
  rerouteListboxStreamToDialog({ detail: { newStream } }) {
    if (newStream.target == this.listboxTarget.id && this._dialogIsOpen) {
      newStream.setAttribute("target", this.dialogListboxTarget.id);
    }
  }

  _connectDialog() {
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", this._resizeDialog);
    }
  }

  _disconnectDialog() {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", this._resizeDialog);
    }
  }

  _moveArtifactsToDialog() {
    this.dialogComboboxTarget.value = this._fullQuery;

    this._actingCombobox = this.dialogComboboxTarget;
    this._actingListbox = this.dialogListboxTarget;

    this.dialogListboxTarget.append(...this.listboxTarget.children);
  }

  _moveArtifactsInline() {
    this.comboboxTarget.value = this._fullQuery;

    this._actingCombobox = this.comboboxTarget;
    this._actingListbox = this.listboxTarget;

    this.listboxTarget.append(...this.dialogListboxTarget.children);
  }

  _resizeDialog = () => {
    if (window.visualViewport) {
      this.dialogTarget.style.setProperty("--hw-visual-viewport-height", `${window.visualViewport.height}px`);
    }
  }

  // After closing a dialog, focus returns to the last focused element.
  // +preventFocusingComboboxAfterClosingDialog+ focuses a placeholder element before opening
  // the dialog, so that the combobox is not focused again after closing, which would reopen.
  _preventFocusingComboboxAfterClosingDialog() {
    this.dialogFocusTrapTarget.focus();
  }

  get _isSmallViewport() {
    return window.matchMedia(`(max-width: ${this.smallViewportMaxWidthValue})`).matches
  }

  get _dialogIsOpen() {
    return this.dialogTarget.open
  }
};

Combobox.Events = Base => class extends Base {
  _dispatchPreselectionEvent({ isNewAndAllowed, previousValue }) {
    if (previousValue === this._incomingFieldValueString) return

    dispatch("hw-combobox:preselection", {
      target: this.element,
      detail: { ...this._eventableDetails, isNewAndAllowed, previousValue }
    });
  }

  _dispatchSelectionEvent() {
    dispatch("hw-combobox:selection", {
      target: this.element,
      detail: this._eventableDetails
    });
  }

  _dispatchRemovalEvent({ removedDisplay, removedValue }) {
    dispatch("hw-combobox:removal", {
      target: this.element,
      detail: { ...this._eventableDetails, removedDisplay, removedValue }
    });
  }

  get _eventableDetails() {
    return {
      value: this._incomingFieldValueString,
      display: this._fullQuery,
      query: this._typedQuery,
      fieldName: this._fieldName,
      isValid: this._valueIsValid
    }
  }
};

class FetchResponse {
  constructor(response) {
    this.response = response;
  }
  get statusCode() {
    return this.response.status;
  }
  get redirected() {
    return this.response.redirected;
  }
  get ok() {
    return this.response.ok;
  }
  get unauthenticated() {
    return this.statusCode === 401;
  }
  get unprocessableEntity() {
    return this.statusCode === 422;
  }
  get authenticationURL() {
    return this.response.headers.get("WWW-Authenticate");
  }
  get contentType() {
    const contentType = this.response.headers.get("Content-Type") || "";
    return contentType.replace(/;.*$/, "");
  }
  get headers() {
    return this.response.headers;
  }
  get html() {
    if (this.contentType.match(/^(application|text)\/(html|xhtml\+xml)$/)) {
      return this.text;
    }
    return Promise.reject(new Error(`Expected an HTML response but got "${this.contentType}" instead`));
  }
  get json() {
    if (this.contentType.match(/^application\/.*json$/)) {
      return this.responseJson || (this.responseJson = this.response.json());
    }
    return Promise.reject(new Error(`Expected a JSON response but got "${this.contentType}" instead`));
  }
  get text() {
    return this.responseText || (this.responseText = this.response.text());
  }
  get isTurboStream() {
    return this.contentType.match(/^text\/vnd\.turbo-stream\.html/);
  }
  async renderTurboStream() {
    if (this.isTurboStream) {
      if (window.Turbo) {
        await window.Turbo.renderStreamMessage(await this.text);
      } else {
        console.warn("You must set `window.Turbo = Turbo` to automatically process Turbo Stream events with request.js");
      }
    } else {
      return Promise.reject(new Error(`Expected a Turbo Stream response but got "${this.contentType}" instead`));
    }
  }
}

class RequestInterceptor {
  static register(interceptor) {
    this.interceptor = interceptor;
  }
  static get() {
    return this.interceptor;
  }
  static reset() {
    this.interceptor = undefined;
  }
}

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = cookies.find((cookie => cookie.startsWith(prefix)));
  if (cookie) {
    const value = cookie.split("=").slice(1).join("=");
    if (value) {
      return decodeURIComponent(value);
    }
  }
}

function compact(object) {
  const result = {};
  for (const key in object) {
    const value = object[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

function metaContent(name) {
  const element = document.head.querySelector(`meta[name="${name}"]`);
  return element && element.content;
}

function stringEntriesFromFormData(formData) {
  return [ ...formData ].reduce(((entries, [name, value]) => entries.concat(typeof value === "string" ? [ [ name, value ] ] : [])), []);
}

function mergeEntries(searchParams, entries) {
  for (const [name, value] of entries) {
    if (value instanceof window.File) continue;
    if (searchParams.has(name) && !name.includes("[]")) {
      searchParams.delete(name);
      searchParams.set(name, value);
    } else {
      searchParams.append(name, value);
    }
  }
}

class FetchRequest {
  constructor(method, url, options = {}) {
    this.method = method;
    this.options = options;
    this.originalUrl = url.toString();
  }
  async perform() {
    try {
      const requestInterceptor = RequestInterceptor.get();
      if (requestInterceptor) {
        await requestInterceptor(this);
      }
    } catch (error) {
      console.error(error);
    }
    const response = new FetchResponse(await window.fetch(this.url, this.fetchOptions));
    if (response.unauthenticated && response.authenticationURL) {
      return Promise.reject(window.location.href = response.authenticationURL);
    }
    const responseStatusIsTurboStreamable = response.ok || response.unprocessableEntity;
    if (responseStatusIsTurboStreamable && response.isTurboStream) {
      await response.renderTurboStream();
    }
    return response;
  }
  addHeader(key, value) {
    const headers = this.additionalHeaders;
    headers[key] = value;
    this.options.headers = headers;
  }
  sameHostname() {
    if (!this.originalUrl.startsWith("http:")) {
      return true;
    }
    try {
      return new URL(this.originalUrl).hostname === window.location.hostname;
    } catch (_) {
      return true;
    }
  }
  get fetchOptions() {
    return {
      method: this.method.toUpperCase(),
      headers: this.headers,
      body: this.formattedBody,
      signal: this.signal,
      credentials: this.credentials,
      redirect: this.redirect
    };
  }
  get headers() {
    const baseHeaders = {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": this.contentType,
      Accept: this.accept
    };
    if (this.sameHostname()) {
      baseHeaders["X-CSRF-Token"] = this.csrfToken;
    }
    return compact(Object.assign(baseHeaders, this.additionalHeaders));
  }
  get csrfToken() {
    return getCookie(metaContent("csrf-param")) || metaContent("csrf-token");
  }
  get contentType() {
    if (this.options.contentType) {
      return this.options.contentType;
    } else if (this.body == null || this.body instanceof window.FormData) {
      return undefined;
    } else if (this.body instanceof window.File) {
      return this.body.type;
    }
    return "application/json";
  }
  get accept() {
    switch (this.responseKind) {
     case "html":
      return "text/html, application/xhtml+xml";

     case "turbo-stream":
      return "text/vnd.turbo-stream.html, text/html, application/xhtml+xml";

     case "json":
      return "application/json, application/vnd.api+json";

     default:
      return "*/*";
    }
  }
  get body() {
    return this.options.body;
  }
  get query() {
    const originalQuery = (this.originalUrl.split("?")[1] || "").split("#")[0];
    const params = new URLSearchParams(originalQuery);
    let requestQuery = this.options.query;
    if (requestQuery instanceof window.FormData) {
      requestQuery = stringEntriesFromFormData(requestQuery);
    } else if (requestQuery instanceof window.URLSearchParams) {
      requestQuery = requestQuery.entries();
    } else {
      requestQuery = Object.entries(requestQuery || {});
    }
    mergeEntries(params, requestQuery);
    const query = params.toString();
    return query.length > 0 ? `?${query}` : "";
  }
  get url() {
    return this.originalUrl.split("?")[0].split("#")[0] + this.query;
  }
  get responseKind() {
    return this.options.responseKind || "html";
  }
  get signal() {
    return this.options.signal;
  }
  get redirect() {
    return this.options.redirect || "follow";
  }
  get credentials() {
    return this.options.credentials || "same-origin";
  }
  get additionalHeaders() {
    return this.options.headers || {};
  }
  get formattedBody() {
    const bodyIsAString = Object.prototype.toString.call(this.body) === "[object String]";
    const contentTypeIsJson = this.headers["Content-Type"] === "application/json";
    if (contentTypeIsJson && !bodyIsAString) {
      return JSON.stringify(this.body);
    }
    return this.body;
  }
}

async function get(url, options) {
  const request = new FetchRequest("get", url, options);
  return request.perform();
}

async function post(url, options) {
  const request = new FetchRequest("post", url, options);
  return request.perform();
}

// Copyright (c) 2021 Marcelo Lauxen

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Combobox.Filtering = Base => class extends Base {
  filterAndSelect({ inputType }) {
    this._filter(inputType);

    if (this._isSync) {
      this._selectOnQuery(inputType);
    }
  }

  clear(event) {
    this._clearQuery();
    this.chipDismisserTargets.forEach(el => el.click());
    if (event && !event.defaultPrevented) event.target.focus();
  }

  _initializeFiltering() {
    this._debouncedFilterAsync = debounce(this._debouncedFilterAsync.bind(this));
  }

  _filter(inputType) {
    if (this._isAsync) {
      this._debouncedFilterAsync(inputType);
    } else {
      this._filterSync();
    }

    this._markQueried();
  }

  _debouncedFilterAsync(inputType) {
    this._filterAsync(inputType);
  }

  async _filterAsync(inputType) {
    const query = {
      q: this._fullQuery,
      input_type: inputType,
      for_id: this.element.dataset.asyncId,
      callback_id: this._enqueueCallback()
    };

    await get(this.asyncSrcValue, { responseKind: "turbo-stream", query });
  }

  _filterSync() {
    this._allFilterableOptionElements.forEach(applyFilter(this._fullQuery, { matching: this.filterableAttributeValue }));
  }

  _clearQuery() {
    this._fullQuery = "";
    this.filterAndSelect({ inputType: "deleteContentBackward" });
  }

  _markQueried() {
    this._forAllComboboxes(el => el.toggleAttribute("data-queried", this._isQueried));
  }

  get _isQueried() {
    return this._fullQuery.length > 0
  }

  get _fullQuery() {
    return this._actingCombobox.value
  }

  set _fullQuery(value) {
    this._actingCombobox.value = value;
  }

  get _typedQuery() {
    return unselectedPortion(this._actingCombobox)
  }
};

Combobox.FormField = Base => class extends Base {
  get _fieldValue() {
    if (this._isMultiselect) {
      const currentValue = this.hiddenFieldTarget.value;
      const arrayFromValue = currentValue ? currentValue.split(",") : [];

      return new Set(arrayFromValue)
    } else {
      return this.hiddenFieldTarget.value
    }
  }

  get _fieldValueString() {
    if (this._isMultiselect) {
      return this._fieldValueArray.join(",")
    } else {
      return this.hiddenFieldTarget.value
    }
  }

  get _incomingFieldValueString() {
    if (this._isMultiselect) {
      const array = this._fieldValueArray;

      if (this.hiddenFieldTarget.dataset.valueForMultiselect) {
        array.push(this.hiddenFieldTarget.dataset.valueForMultiselect);
      }

      return array.join(",")
    } else {
      return this.hiddenFieldTarget.value
    }
  }

  get _fieldValueArray() {
    if (this._isMultiselect) {
      return Array.from(this._fieldValue)
    } else {
      return [ this.hiddenFieldTarget.value ]
    }
  }

  set _fieldValue(value) {
    if (this._isMultiselect) {
      this.hiddenFieldTarget.dataset.valueForMultiselect = value?.replace(/,/g, "");
      this.hiddenFieldTarget.dataset.displayForMultiselect = this._fullQuery;
    } else {
      this.hiddenFieldTarget.value = value;
    }
  }

  get _hasEmptyFieldValue() {
    if (this._isMultiselect) {
      return this.hiddenFieldTarget.dataset.valueForMultiselect == "" || this.hiddenFieldTarget.dataset.valueForMultiselect == "undefined"
    } else {
      return this.hiddenFieldTarget.value === ""
    }
  }

  get _hasFieldValue() {
    return !this._hasEmptyFieldValue
  }

  get _fieldName() {
    return this.hiddenFieldTarget.name
  }

  set _fieldName(value) {
    this.hiddenFieldTarget.name = value;
  }
};

Combobox.Multiselect = Base => class extends Base {
  navigateChip(event) {
    this._chipKeyHandlers[event.key]?.call(this, event);
  }

  removeChip({ currentTarget, params }) {
    let display;
    const option = this._optionElementWithValue(params.value);

    if (option) {
      display = option.getAttribute(this.autocompletableAttributeValue);
      this._markNotSelected(option);
      this._markNotMultiselected(option);
    } else {
      display = params.value; // for new options
    }

    this._removeFromFieldValue(params.value);
    this._filter("hw:multiselectSync");

    currentTarget.closest("[data-hw-combobox-chip]").remove();

    if (!this._isSmallViewport) {
      this.open();
    }

    this._announceToScreenReader(display, "removed");
    this._dispatchRemovalEvent({ removedDisplay: display, removedValue: params.value });
  }

  hideChipsForCache() {
    this.element.querySelectorAll("[data-hw-combobox-chip]").forEach(chip => chip.hidden = true);
  }

  _chipKeyHandlers = {
    Backspace: (event) => {
      this.removeChip(event);
      cancel(event);
    },
    Enter: (event) => {
      this.removeChip(event);
      cancel(event);
    },
    Space: (event) => {
      this.removeChip(event);
      cancel(event);
    },
    Escape: (event) => {
      this.open();
      cancel(event);
    }
  }

  _connectMultiselect() {
    if (!this._isMultiPreselected) {
      this._preselectMultiple();
      this._markMultiPreselected();
    }
  }

  async _createChip(shouldReopen) {
    if (!this._isMultiselect) return

    this._beforeClearingMultiselectQuery(async (display, value) => {
      this._fullQuery = "";

      this._filter("hw:multiselectSync");
      this._requestChips(value);
      this._addToFieldValue(value);

      if (shouldReopen) {
        await nextRepaint();
        this.open();
      }

      this._announceToScreenReader(display, "multi-selected. Press Shift + Tab, then Enter to remove.");
    });
  }

  async _requestChips(values) {
    await post(this.selectionChipSrcValue, {
      responseKind: "turbo-stream",
      query: {
        for_id: this.element.dataset.asyncId,
        combobox_values: values
      }
    });
  }

  _beforeClearingMultiselectQuery(callback) {
    const display = this.hiddenFieldTarget.dataset.displayForMultiselect;
    const value = this.hiddenFieldTarget.dataset.valueForMultiselect;

    if (value && !this._fieldValue.has(value)) {
      callback(display, value);
    }

    this.hiddenFieldTarget.dataset.displayForMultiselect = "";
    this.hiddenFieldTarget.dataset.valueForMultiselect = "";
  }

  _resetMultiselectionMarks() {
    if (!this._isMultiselect) return

    this._fieldValueArray.forEach(value => {
      const option = this._optionElementWithValue(value);

      if (option) {
        option.setAttribute("data-multiselected", "");
        option.hidden = true;
      }
    });
  }

  _markNotMultiselected(option) {
    if (!this._isMultiselect) return

    option.removeAttribute("data-multiselected");
    option.hidden = false;
  }

  _addToFieldValue(value) {
    const newValue = this._fieldValue;

    newValue.add(String(value));
    this.hiddenFieldTarget.value = Array.from(newValue).join(",");

    if (this._isSync) this._resetMultiselectionMarks();
  }

  _removeFromFieldValue(value) {
    const newValue = this._fieldValue;

    newValue.delete(String(value));
    this.hiddenFieldTarget.value = Array.from(newValue).join(",");

    if (this._isSync) this._resetMultiselectionMarks();
  }

  _focusLastChipDismisser() {
    this.chipDismisserTargets[this.chipDismisserTargets.length - 1]?.focus();
  }

  _markMultiPreselected() {
    this.element.dataset.multiPreselected = "";
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
};

Combobox.Navigation = Base => class extends Base {
  navigate(event) {
    if (this._autocompletesList) {
      this._navigationKeyHandlers[event.key]?.call(this, event);
    }
  }

  _navigationKeyHandlers = {
    ArrowUp: (event) => {
      this._selectIndex(this._selectedOptionIndex - 1);
      cancel(event);
    },
    ArrowDown: (event) => {
      this._selectIndex(this._selectedOptionIndex + 1);

      if (this._selectedOptionIndex === 0) {
        this._actingListbox.scrollTop = 0;
      }

      cancel(event);
    },
    Home: (event) => {
      this._selectIndex(0);
      cancel(event);
    },
    End: (event) => {
      this._selectIndex(this._visibleOptionElements.length - 1);
      cancel(event);
    },
    Enter: (event) => {
      this.close("hw:keyHandler:enter");
      cancel(event);
    },
    Escape: (event) => {
      this.close("hw:keyHandler:escape");
      cancel(event);
    },
    Backspace: (event) => {
      if (this._isMultiselect && !this._fullQuery) {
        this._focusLastChipDismisser();
        cancel(event);
      }
    }
  }
};

Combobox.NewOptions = Base => class extends Base {
  _shouldTreatAsNewOptionForFiltering(queryIsBeingRefined) {
    if (queryIsBeingRefined) {
      return this._isNewOptionWithNoPotentialMatches
    } else {
      return this._isNewOptionWithPotentialMatches
    }
  }

  // If the user is going to keep refining the query, we can't be sure whether
  // the option will end up being new or not unless there are no potential matches.
  // +_isNewOptionWithNoPotentialMatches+ allows us to make our best guess
  // while the state of the combobox is still in flux.
  //
  // It's okay for the combobox to say it's not new even if it will be eventually,
  // as only the final state matters for submission purposes. This method exists
  // as a best effort to keep the state accurate as often as we can.
  //
  // Note that the first visible option is automatically selected as you type.
  // So if there's a partial match, it's not a new option at this point.
  //
  // The final state is locked-in upon closing the combobox via `_isNewOptionWithPotentialMatches`.
  get _isNewOptionWithNoPotentialMatches() {
    return this._isNewOptionWithPotentialMatches && !this._isPartialAutocompleteMatch
  }

  // If the query is finalized, we don't care that there are potential matches
  // because new options can be substrings of existing options.
  //
  // We can't use `_isNewOptionWithNoPotentialMatches` because that would
  // rule out new options that are partial matches.
  get _isNewOptionWithPotentialMatches() {
    return this._isQueried && this._allowNew && !this._isExactAutocompleteMatch
  }
};

Combobox.Options = Base => class extends Base {
  _resetOptionsSilently() {
    this._resetOptions(this._deselect.bind(this));
  }

  _resetOptionsAndNotify() {
    this._resetOptions(this._deselectAndNotify.bind(this));
  }

  _resetOptions(deselectionStrategy) {
    this._fieldName = this.originalNameValue;
    deselectionStrategy();
  }

  _optionElementWithValue(value) {
    return this._actingListbox.querySelector(`[${this.filterableAttributeValue}][data-value='${value}']`)
  }

  _displayForOptionElement(element) {
    return element.getAttribute(this.autocompletableAttributeValue)
  }

  get _allowNew() {
    return !!this.nameWhenNewValue
  }

  get _allOptions() {
    return Array.from(this._allFilterableOptionElements)
  }

  get _allFilterableOptionElements() {
    return this._actingListbox.querySelectorAll(`[${this.filterableAttributeValue}]:not([data-multiselected])`)
  }

  get _visibleOptionElements() {
    return [ ...this._allFilterableOptionElements ].filter(visible)
  }

  get _selectedOptionElement() {
    return this._actingListbox.querySelector("[role=option][aria-selected=true]:not([data-multiselected])")
  }

  get _multiselectedOptionElements() {
    return this._actingListbox.querySelectorAll("[role=option][data-multiselected]")
  }

  get _selectedOptionIndex() {
    return [ ...this._visibleOptionElements ].indexOf(this._selectedOptionElement)
  }

  get _isUnjustifiablyBlank() {
    const valueIsMissing = this._hasEmptyFieldValue;
    const noBlankOptionSelected = !this._selectedOptionElement;

    return valueIsMissing && noBlankOptionSelected
  }
};

Combobox.Selection = Base => class extends Base {
  selectOnClick({ currentTarget, inputType }) {
    this._forceSelectionAndFilter(currentTarget, inputType);
    this.close("hw:optionRoleClick");
  }

  _connectSelection() {
    if (this.hasPrefilledDisplayValue) {
      this._fullQuery = this.prefilledDisplayValue;
      this._markQueried();
    }
  }

  _selectOnQuery(inputType) {
    if (this._shouldTreatAsNewOptionForFiltering(!isDeleteEvent({ inputType: inputType }))) {
      this._selectNew();
    } else if (isDeleteEvent({ inputType: inputType })) {
      this._deselect();
    } else if (inputType === "hw:lockInSelection" && this._ensurableOption) {
      this._selectAndAutocompleteMissingPortion(this._ensurableOption);
    } else if (this._isOpen && this._visibleOptionElements[0]) {
      this._selectAndAutocompleteMissingPortion(this._visibleOptionElements[0]);
    } else if (this._isOpen) {
      this._resetOptionsAndNotify();
      this._markInvalid();
    } else ;
  }

  _select(option, autocompleteStrategy) {
    const previousValue = this._fieldValueString;

    this._resetOptionsSilently();

    autocompleteStrategy(option);

    this._fieldValue = option.dataset.value;
    this._markSelected(option);
    this._markValid();
    this._dispatchPreselectionEvent({ isNewAndAllowed: false, previousValue: previousValue });

    option.scrollIntoView({ block: "nearest" });
  }

  _selectNew() {
    const previousValue = this._fieldValueString;

    this._resetOptionsSilently();
    this._fieldValue = this._fullQuery;
    this._fieldName = this.nameWhenNewValue;
    this._markValid();
    this._dispatchPreselectionEvent({ isNewAndAllowed: true, previousValue: previousValue });
  }

  _deselect() {
    const previousValue = this._fieldValueString;

    if (this._selectedOptionElement) {
      this._markNotSelected(this._selectedOptionElement);
    }

    this._fieldValue = "";
    this._setActiveDescendant("");

    return previousValue
  }

  _deselectAndNotify() {
    const previousValue = this._deselect();
    this._dispatchPreselectionEvent({ isNewAndAllowed: false, previousValue: previousValue });
  }

  _selectIndex(index) {
    const option = wrapAroundAccess(this._visibleOptionElements, index);
    this._forceSelectionWithoutFiltering(option);
  }

  _preselectSingle() {
    if (this._isSingleSelect && this._hasValueButNoSelection && this._allOptions.length < 100) {
      const option = this._optionElementWithValue(this._fieldValue);
      if (option) this._markSelected(option);
    }
  }

  _preselectMultiple() {
    if (this._isMultiselect && this._hasValueButNoSelection) {
      this._requestChips(this._fieldValueString);
      this._resetMultiselectionMarks();
    }
  }

  _selectAndAutocompleteMissingPortion(option) {
    this._select(option, this._autocompleteMissingPortion.bind(this));
  }

  _selectAndAutocompleteFullQuery(option) {
    this._select(option, this._replaceFullQueryWithAutocompletedValue.bind(this));
  }

  _forceSelectionAndFilter(option, inputType) {
    this._forceSelectionWithoutFiltering(option);
    this._filter(inputType);
  }

  _forceSelectionWithoutFiltering(option) {
    this._selectAndAutocompleteFullQuery(option);
  }

  _lockInSelection() {
    if (this._shouldLockInSelection) {
      this._forceSelectionAndFilter(this._ensurableOption, "hw:lockInSelection");
    }
  }

  _markSelected(option) {
    if (this.hasSelectedClass) option.classList.add(this.selectedClass);
    option.setAttribute("aria-selected", true);
    this._setActiveDescendant(option.id);
  }

  _markNotSelected(option) {
    if (this.hasSelectedClass) option.classList.remove(this.selectedClass);
    option.removeAttribute("aria-selected");
    this._removeActiveDescendant();
  }

  _setActiveDescendant(id) {
    this._forAllComboboxes(el => el.setAttribute("aria-activedescendant", id));
  }

  _removeActiveDescendant() {
    this._setActiveDescendant("");
  }

  get _hasValueButNoSelection() {
    return this._hasFieldValue && !this._hasSelection
  }

  get _hasSelection() {
    if (this._isSingleSelect) {
      this._selectedOptionElement;
    } else {
      this._multiselectedOptionElements.length > 0;
    }
  }

  get _shouldLockInSelection() {
    return this._isQueried && !!this._ensurableOption && !this._isNewOptionWithPotentialMatches
  }

  get _ensurableOption() {
    return this._selectedOptionElement || this._visibleOptionElements[0]
  }
};

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Older browsers don't support event options, feature detect it.

// Adopted and modified solution from Bohdan Didukh (2017)
// https://stackoverflow.com/questions/41594997/ios-10-safari-prevent-scrolling-behind-a-fixed-overlay-and-maintain-scroll-posi

var hasPassiveEvents = false;
if (typeof window !== 'undefined') {
  var passiveTestOptions = {
    get passive() {
      hasPassiveEvents = true;
      return undefined;
    }
  };
  window.addEventListener('testPassive', null, passiveTestOptions);
  window.removeEventListener('testPassive', null, passiveTestOptions);
}

var isIosDevice = typeof window !== 'undefined' && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);


var locks = [];
var documentListenerAdded = false;
var initialClientY = -1;
var previousBodyOverflowSetting = void 0;
var previousBodyPosition = void 0;
var previousBodyPaddingRight = void 0;

// returns true if `el` should be allowed to receive touchmove events.
var allowTouchMove = function allowTouchMove(el) {
  return locks.some(function (lock) {
    if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
      return true;
    }

    return false;
  });
};

var preventDefault = function preventDefault(rawEvent) {
  var e = rawEvent || window.event;

  // For the case whereby consumers adds a touchmove event listener to document.
  // Recall that we do document.addEventListener('touchmove', preventDefault, { passive: false })
  // in disableBodyScroll - so if we provide this opportunity to allowTouchMove, then
  // the touchmove event on document will break.
  if (allowTouchMove(e.target)) {
    return true;
  }

  // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
  if (e.touches.length > 1) return true;

  if (e.preventDefault) e.preventDefault();

  return false;
};

var setOverflowHidden = function setOverflowHidden(options) {
  // If previousBodyPaddingRight is already set, don't set it again.
  if (previousBodyPaddingRight === undefined) {
    var _reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
    var scrollBarGap = window.innerWidth - document.documentElement.clientWidth;

    if (_reserveScrollBarGap && scrollBarGap > 0) {
      var computedBodyPaddingRight = parseInt(window.getComputedStyle(document.body).getPropertyValue('padding-right'), 10);
      previousBodyPaddingRight = document.body.style.paddingRight;
      document.body.style.paddingRight = computedBodyPaddingRight + scrollBarGap + 'px';
    }
  }

  // If previousBodyOverflowSetting is already set, don't set it again.
  if (previousBodyOverflowSetting === undefined) {
    previousBodyOverflowSetting = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
};

var restoreOverflowSetting = function restoreOverflowSetting() {
  if (previousBodyPaddingRight !== undefined) {
    document.body.style.paddingRight = previousBodyPaddingRight;

    // Restore previousBodyPaddingRight to undefined so setOverflowHidden knows it
    // can be set again.
    previousBodyPaddingRight = undefined;
  }

  if (previousBodyOverflowSetting !== undefined) {
    document.body.style.overflow = previousBodyOverflowSetting;

    // Restore previousBodyOverflowSetting to undefined
    // so setOverflowHidden knows it can be set again.
    previousBodyOverflowSetting = undefined;
  }
};

var setPositionFixed = function setPositionFixed() {
  return window.requestAnimationFrame(function () {
    // If previousBodyPosition is already set, don't set it again.
    if (previousBodyPosition === undefined) {
      previousBodyPosition = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left
      };

      // Update the dom inside an animation frame
      var _window = window,
          scrollY = _window.scrollY,
          scrollX = _window.scrollX,
          innerHeight = _window.innerHeight;

      document.body.style.position = 'fixed';
      document.body.style.top = -scrollY + 'px';
      document.body.style.left = -scrollX + 'px';

      setTimeout(function () {
        return window.requestAnimationFrame(function () {
          // Attempt to check if the bottom bar appeared due to the position change
          var bottomBarHeight = innerHeight - window.innerHeight;
          if (bottomBarHeight && scrollY >= innerHeight) {
            // Move the content further up so that the bottom bar doesn't hide it
            document.body.style.top = -(scrollY + bottomBarHeight);
          }
        });
      }, 300);
    }
  });
};

var restorePositionSetting = function restorePositionSetting() {
  if (previousBodyPosition !== undefined) {
    // Convert the position from "px" to Int
    var y = -parseInt(document.body.style.top, 10);
    var x = -parseInt(document.body.style.left, 10);

    // Restore styles
    document.body.style.position = previousBodyPosition.position;
    document.body.style.top = previousBodyPosition.top;
    document.body.style.left = previousBodyPosition.left;

    // Restore scroll
    window.scrollTo(x, y);

    previousBodyPosition = undefined;
  }
};

// https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions
var isTargetElementTotallyScrolled = function isTargetElementTotallyScrolled(targetElement) {
  return targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;
};

var handleScroll = function handleScroll(event, targetElement) {
  var clientY = event.targetTouches[0].clientY - initialClientY;

  if (allowTouchMove(event.target)) {
    return false;
  }

  if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
    // element is at the top of its scroll.
    return preventDefault(event);
  }

  if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
    // element is at the bottom of its scroll.
    return preventDefault(event);
  }

  event.stopPropagation();
  return true;
};

var disableBodyScroll = function disableBodyScroll(targetElement, options) {
  // targetElement must be provided
  if (!targetElement) {
    // eslint-disable-next-line no-console
    console.error('disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.');
    return;
  }

  // disableBodyScroll must not have been called on this targetElement before
  if (locks.some(function (lock) {
    return lock.targetElement === targetElement;
  })) {
    return;
  }

  var lock = {
    targetElement: targetElement,
    options: options || {}
  };

  locks = [].concat(_toConsumableArray(locks), [lock]);

  if (isIosDevice) {
    setPositionFixed();
  } else {
    setOverflowHidden(options);
  }

  if (isIosDevice) {
    targetElement.ontouchstart = function (event) {
      if (event.targetTouches.length === 1) {
        // detect single touch.
        initialClientY = event.targetTouches[0].clientY;
      }
    };
    targetElement.ontouchmove = function (event) {
      if (event.targetTouches.length === 1) {
        // detect single touch.
        handleScroll(event, targetElement);
      }
    };

    if (!documentListenerAdded) {
      document.addEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
      documentListenerAdded = true;
    }
  }
};

var enableBodyScroll = function enableBodyScroll(targetElement) {
  if (!targetElement) {
    // eslint-disable-next-line no-console
    console.error('enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.');
    return;
  }

  locks = locks.filter(function (lock) {
    return lock.targetElement !== targetElement;
  });

  if (isIosDevice) {
    targetElement.ontouchstart = null;
    targetElement.ontouchmove = null;

    if (documentListenerAdded && locks.length === 0) {
      document.removeEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
      documentListenerAdded = false;
    }
  }

  if (isIosDevice) {
    restorePositionSetting();
  } else {
    restoreOverflowSetting();
  }
};

// MIT License

// Copyright (c) 2018 Will Po

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

Combobox.Toggle = Base => class extends Base {
  open() {
    this.expandedValue = true;
  }

  close(inputType) {
    if (this._isOpen) {
      const shouldReopen = this._isMultiselect &&
        this._isSync &&
        !this._isSmallViewport &&
        inputType != "hw:clickOutside" &&
        inputType != "hw:focusOutside" &&
        inputType != "hw:asyncCloser";

      this._lockInSelection();
      this._clearInvalidQuery();

      this.expandedValue = false;

      if (inputType != "hw:keyHandler:escape") {
        this._dispatchSelectionEvent();
        this._createChip(shouldReopen);
      }

      if (this._isSingleSelect && this._selectedOptionElement) {
        this._announceToScreenReader(this._displayForOptionElement(this._selectedOptionElement), "selected");
      }
    }
  }

  toggle() {
    if (this.expandedValue) {
      this.close("hw:toggle");
    } else {
      this.open();
    }
  }

  closeOnClickOutside(event) {
    const target = event.target;

    if (!this._isOpen) return
    if (this.mainWrapperTarget.contains(target) && !this._isDialogDismisser(target)) return
    if (this._withinElementBounds(event)) return

    this.close("hw:clickOutside");
  }

  closeOnFocusOutside({ target }) {
    if (!this._isOpen) return
    if (this.element.contains(target)) return

    this.close("hw:focusOutside");
  }

  clearOrToggleOnHandleClick() {
    if (this._isQueried) {
      this._clearQuery();
      this.open();
    } else {
      this.toggle();
    }
  }

  // Some browser extensions like 1Password overlay elements on top of the combobox.
  // Hovering over these elements emits a click event for some reason.
  // These events don't contain any telling information, so we use `_withinElementBounds`
  // as an alternative to check whether the click is legitimate.
  _withinElementBounds(event) {
    const { left, right, top, bottom } = this.mainWrapperTarget.getBoundingClientRect();
    const { clientX, clientY } = event;

    return clientX >= left && clientX <= right && clientY >= top && clientY <= bottom
  }

  _isDialogDismisser(target) {
    return target.closest("dialog") && target.role != "combobox"
  }

  _expand() {
    if (this._isSync) {
      this._preselectSingle();
    }

    if (this._autocompletesList && this._isSmallViewport) {
      this._openInDialog();
    } else {
      this._openInline();
    }

    this._actingCombobox.setAttribute("aria-expanded", true); // needs to happen after setting acting combobox
  }

  // +._collapse()+ differs from `.close()` in that it might be called by stimulus on connect because
  // it interprets a change in `expandedValue` — whereas `.close()` is only called internally by us.
  _collapse() {
    this._actingCombobox.setAttribute("aria-expanded", false); // needs to happen before resetting acting combobox

    if (this._dialogIsOpen) {
      this._closeInDialog();
    } else {
      this._closeInline();
    }
  }

  _openInDialog() {
    this._moveArtifactsToDialog();
    this._preventFocusingComboboxAfterClosingDialog();
    this._preventBodyScroll();
    this.dialogTarget.showModal();
    this._resizeDialog();
  }

  _openInline() {
    this.listboxTarget.hidden = false;
  }

  _closeInDialog() {
    this._moveArtifactsInline();
    this.dialogTarget.close();
    this._restoreBodyScroll();
    this._actingCombobox.scrollIntoView({ block: "center" });
  }

  _closeInline() {
    this.listboxTarget.hidden = true;
  }

  _preventBodyScroll() {
    disableBodyScroll(this.dialogListboxTarget);
  }

  _restoreBodyScroll() {
    enableBodyScroll(this.dialogListboxTarget);
  }

  _clearInvalidQuery() {
    if (this._isUnjustifiablyBlank) {
      this._deselect();
      this._clearQuery();
    }
  }

  get _isOpen() {
    return this.expandedValue
  }
};

Combobox.Validity = Base => class extends Base {
  _markValid() {
    if (this._valueIsInvalid) return

    this._forAllComboboxes(combobox => {
      if (this.hasInvalidClass) {
        combobox.classList.remove(this.invalidClass);
      }

      combobox.removeAttribute("aria-invalid");
      combobox.removeAttribute("aria-errormessage");
    });
  }

  _markInvalid() {
    if (this._valueIsValid) return

    this._forAllComboboxes(combobox => {
      if (this.hasInvalidClass) {
        combobox.classList.add(this.invalidClass);
      }

      combobox.setAttribute("aria-invalid", true);
      combobox.setAttribute("aria-errormessage", `Please select a valid option for ${combobox.name}`);
    });
  }

  get _valueIsValid() {
    return !this._valueIsInvalid
  }

  // +_valueIsInvalid+ only checks if `comboboxTarget` (and not `_actingCombobox`) is required
  // because the `required` attribute is only forwarded to the `comboboxTarget` element
  get _valueIsInvalid() {
    const isRequiredAndEmpty = this.comboboxTarget.required && this._hasEmptyFieldValue;
    return isRequiredAndEmpty
  }
};

window.HOTWIRE_COMBOBOX_STREAM_DELAY = 0; // ms, for testing purposes

const concerns = [
  Controller,
  Combobox.Actors,
  Combobox.Announcements,
  Combobox.AsyncLoading,
  Combobox.Autocomplete,
  Combobox.Callbacks,
  Combobox.Dialog,
  Combobox.Events,
  Combobox.Filtering,
  Combobox.FormField,
  Combobox.Multiselect,
  Combobox.Navigation,
  Combobox.NewOptions,
  Combobox.Options,
  Combobox.Selection,
  Combobox.Toggle,
  Combobox.Validity
];

class HwComboboxController extends Concerns(...concerns) {
  static classes = [ "invalid", "selected" ]
  static targets = [
    "announcer",
    "combobox",
    "chipDismisser",
    "closer",
    "dialog", "dialogCombobox", "dialogFocusTrap", "dialogListbox",
    "endOfOptionsStream",
    "handle",
    "hiddenField",
    "listbox",
    "mainWrapper"
  ]

  static values = {
    asyncSrc: String,
    autocompletableAttribute: String,
    autocomplete: String,
    expanded: Boolean,
    filterableAttribute: String,
    nameWhenNew: String,
    originalName: String,
    prefilledDisplay: String,
    selectionChipSrc: String,
    smallViewportMaxWidth: String
  }

  initialize() {
    this._initializeActors();
    this._initializeFiltering();
    this._initializeCallbacks();
  }

  connect() {
    this.idempotentConnect();
  }

  idempotentConnect() {
    this._connectSelection();
    this._connectMultiselect();
    this._connectListAutocomplete();
    this._connectDialog();
  }

  disconnect() {
    this._disconnectDialog();
  }

  expandedValueChanged() {
    if (this.expandedValue) {
      this._expand();
    } else {
      this._collapse();
    }
  }

  async endOfOptionsStreamTargetConnected(element) {
    if (element.dataset.callbackId) {
      this._runCallback(element);
    } else {
      this._preselectSingle();
    }
  }

  async _runCallback(element) {
    const callbackId = element.dataset.callbackId;

    if (this._callbackAttemptsExceeded(callbackId)) {
      return this._dequeueCallback(callbackId)
    } else {
      this._recordCallbackAttempt(callbackId);
    }

    if (this._isNextCallback(callbackId)) {
      const inputType = element.dataset.inputType;
      const delay = window.HOTWIRE_COMBOBOX_STREAM_DELAY;

      if (delay) await sleep(delay);
      this._dequeueCallback(callbackId);
      this._resetMultiselectionMarks();

      if (inputType === "hw:multiselectSync") {
        this.open();
      } else if (inputType !== "hw:lockInSelection") {
        this._selectOnQuery(inputType);
      }
    } else {
      await nextRepaint();
      this._runCallback(element);
    }
  }

  closerTargetConnected() {
    this.close("hw:asyncCloser");
  }

  // Use +_printStack+ for debugging purposes
  _printStack() {
    const err = new Error();
    console.log(err.stack || err.stacktrace);
  }
}

export { HwComboboxController as default };
