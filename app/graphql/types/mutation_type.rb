# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :update_auto_transaction, mutation: Mutations::UpdateAutoTransaction
    field :delete_auto_transaction, mutation: Mutations::DeleteAutoTransaction
  end
end
