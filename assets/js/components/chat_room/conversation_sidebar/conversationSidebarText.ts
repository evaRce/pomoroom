import { useTranslation } from "react-i18next";

export default function useConversationSidebarText() {
  const { t } = useTranslation();

  return {
    searchPlaceholder: t("conversationSidebarText.searchPlaceholder"),
    listLabel: t("conversationSidebarText.listLabel"),
    clearSearch: t("conversationSidebarText.clearSearch"),
    search: t("conversationSidebarText.search"),
    moreOptions: t("conversationSidebarText.moreOptions"),
    leaveGroup: t("conversationSidebarText.leaveGroup"),
    deleteConversation: t("conversationSidebarText.deleteConversation"),
    statusPending: t("conversationSidebarText.statusPending"),
    statusRejected: t("conversationSidebarText.statusRejected"),
    confirmLeaveGroupTitle: t("conversationSidebarText.confirmLeaveGroupTitle"),
    confirmLeaveGroupMessage: (groupName: string) =>
      t("conversationSidebarText.confirmLeaveGroupMessage", { groupName }),
    confirmDeleteConversationTitle: t("conversationSidebarText.confirmDeleteConversationTitle"),
    confirmDeleteConversationMessage: (contactName: string) =>
      t("conversationSidebarText.confirmDeleteConversationMessage", { contactName }),
    confirmCancelButton: t("conversationSidebarText.confirmCancelButton"),
  };
}
