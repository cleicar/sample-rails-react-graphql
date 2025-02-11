import React, { useState } from "react";
import { Button, Frame, IndexTable, Toast, useIndexResourceState } from "@shopify/polaris";
import { NonEmptyArray } from "@shopify/polaris/build/ts/src/types";
import { IndexTableHeading } from "@shopify/polaris/build/ts/src/components/IndexTable";
import { ArrowUpIcon, ArrowDownIcon, DeleteIcon, EditIcon } from '@shopify/polaris-icons';
import { FormatCAD } from "../../helpers/Formatter";
import { StateOption, useFilterState } from "../../helpers/useFilterState";
import { GMDeleteAutoTransaction } from "../../graphql/GMDeleteAutoTransaction";
import { AutoTransactionEditDialog } from "./AutoTransactionEdit/AutoTransactionEditDialog";
import { GMUpdateAutoTransaction } from "../../graphql/GMUpdateAutoTransaction";
import { AutoTransactionType } from "../../graphql/Types";

interface Props {
    loading?: boolean;
    sorting: StateOption<string>;
    autoTransactionArray: any[];
    paginationInfo: any;
}

export const AutoTransactionsList: React.FC<Props> = ({ loading, sorting, autoTransactionArray, paginationInfo }) => {
    const desc = sorting.current.includes(" desc");
    const array = autoTransactionArray;

    const [deleteAutoTransaction, { data: deleteData, error: deleteError }] = GMDeleteAutoTransaction();
    const [updateAutoTransaction, { data: updateData, error: updateError }] = GMUpdateAutoTransaction();

    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const editingAutoTransaction = useFilterState<AutoTransactionType | null>(null);

    const handleSortClick = (sortVal) => {
        const sameCol = sorting.current.startsWith(sortVal);

        const newDesc = sameCol == desc ? "asc" : "desc";
        const newSortVal = `${sortVal} ${newDesc}, id ${newDesc}`;
        sorting.setter(newSortVal);
    }

    const dirIcon = desc ? ArrowDownIcon : ArrowUpIcon;
    function titleButton(label: string, sortVal: string) {
        const icon = (sorting.current.startsWith(sortVal)) ? dirIcon : undefined;
        return <Button variant="tertiary"
            fullWidth
            textAlign="left"
            icon={icon}
            onClick={() => handleSortClick(sortVal)}>{label}
        </Button>;
    }

    const headings: NonEmptyArray<IndexTableHeading> = [
        { id: "buttons", title: "" },
        { id: 'description', title: titleButton("Matching Description", "description") },
        { id: 'type', title: titleButton("Matching Type", "transaction_type") },
        { id: 'category', title: titleButton("Matching category", "category_id") },
        { id: 'amount', title: titleButton("Matching amount", "amount") },
        { id: 'account', title: titleButton("Account", "account.account_name") },
    ];

    const onDelete = (id) => {
        deleteAutoTransaction({ variables: { id: id } })
            .then(() => { setToastMessage("Rule deleted") })
            .catch((e) => { setToastMessage(e.message); });
    };
    const onEdit = (autoTransaction) => {
        editingAutoTransaction.setter(autoTransaction);
    };

    const handleSave = () => {
        const changed: AutoTransactionType = editingAutoTransaction.current!;

        console.log("New account", changed.account);

        const amount = changed.amount === 0 ? null : changed.amount;
        const input = {
            id: changed.id,
            description: changed.description,
            categoryId: changed.categoryId,
            amount: amount,
            transactionType: changed.transactionType,
            accountId: changed.account?.id || null
        };
        updateAutoTransaction({ variables: { autoTransaction: input } })
            .then(() => {
                editingAutoTransaction.setter(null);
                setToastMessage("Saved");
            })
            .catch((e) => { setToastMessage(e.message) });
    };

    const rowMarkup = array.map(
        (autoTransaction, index) => {
            const amount = autoTransaction.amount && FormatCAD(autoTransaction.amount);
            const accountName = autoTransaction.account?.accountName;
            return (
                <IndexTable.Row
                    id={autoTransaction.id}
                    key={autoTransaction.id}
                    position={index}>
                    <IndexTable.Cell>
                        <Button icon={DeleteIcon} onClick={() => onDelete(autoTransaction.id)} />
                        <Button icon={EditIcon} onClick={() => onEdit(autoTransaction)} />
                    </IndexTable.Cell>
                    <IndexTable.Cell>{autoTransaction.description}</IndexTable.Cell>
                    <IndexTable.Cell>{autoTransaction.transactionType}</IndexTable.Cell>
                    <IndexTable.Cell>{autoTransaction.categoryId}</IndexTable.Cell>
                    <IndexTable.Cell>{amount}</IndexTable.Cell>
                    <IndexTable.Cell>{accountName}</IndexTable.Cell>
                </IndexTable.Row>
            )
        }
    );

    const toastMarkup = toastMessage ? (
        <Toast content={toastMessage} onDismiss={() => { setToastMessage(null) }} duration={2000} />
    ) : null;

    const editorMarkup = editingAutoTransaction.current &&
        <AutoTransactionEditDialog
            autoTransaction={editingAutoTransaction}
            onClose={() => editingAutoTransaction.setter(null)}
            onSave={handleSave} />;

    return (
        <Frame>
            <IndexTable
                headings={headings}
                itemCount={array.length}
                selectable={false}
                hasZebraStriping
                loading={loading}
                pagination={paginationInfo}
            >
                {rowMarkup}
            </IndexTable>
            {toastMarkup}
            {editorMarkup}
        </Frame>
    );

};

