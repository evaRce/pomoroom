import { useTranslation } from "react-i18next";

export default function useConversationSidebarText() {
  const { t } = useTranslation();

  return {
    searchPlaceholder: t("conversationSidebarText.searchPlaceholder"),
    clearSearch: t("conversationSidebarText.clearSearch"),
    search: t("conversationSidebarText.search"),
    moreOptions: t("conversationSidebarText.moreOptions"),
    deleteGroup: t("conversationSidebarText.deleteGroup"),
    leaveGroup: t("conversationSidebarText.leaveGroup"),
    deleteConversation: t("conversationSidebarText.deleteConversation"),
    statusPending: t("conversationSidebarText.statusPending"),
    statusRejected: t("conversationSidebarText.statusRejected"),
  };
}
