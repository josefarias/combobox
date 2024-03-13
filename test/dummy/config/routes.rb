Rails.application.routes.draw do
  get "plain", to: "comboboxes#plain"
  get "open", to: "comboboxes#open"
  get "html_options", to: "comboboxes#html_options"
  get "prefilled", to: "comboboxes#prefilled"
  get "prefilled_html", to: "comboboxes#prefilled_html"
  get "required", to: "comboboxes#required"
  get "formbuilder", to: "comboboxes#formbuilder"
  get "new_options", to: "comboboxes#new_options"
  get "inline_autocomplete", to: "comboboxes#inline_autocomplete"
  get "list_autocomplete", to: "comboboxes#list_autocomplete"
  get "async", to: "comboboxes#async"
  get "freetext_async", to: "comboboxes#freetext_async"
  get "prefilled_async", to: "comboboxes#prefilled_async"
  get "prefilled_form", to: "comboboxes#prefilled_form"
  get "async_html", to: "comboboxes#async_html"
  get "render_in", to: "comboboxes#render_in"
  get "enum", to: "comboboxes#enum"
  get "include_blank", to: "comboboxes#include_blank"
  get "custom_events", to: "comboboxes#custom_events"
  get "custom_attrs", to: "comboboxes#custom_attrs"
  get "conflicting_order", to: "comboboxes#conflicting_order"
  get "render_in_locals", to: "comboboxes#render_in_locals"

  resources :movies, only: %i[ index update ]
  get "movies_html", to: "movies#index_html"
  get "movies_with_blank", to: "movies#index_with_blank"
  get "movies_with_blank_html", to: "movies#index_with_blank_html"

  get "greeting", to: "greetings#new"

  post "new_options_form", to: "new_options_forms#create"

  resources :states, only: :index
  resources :users, only: :update

  root to: "comboboxes#plain"
end
