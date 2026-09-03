import { useTranslation } from "react-i18next";

export default function useChatFooterText() {
  const { t } = useTranslation();

  return {
    removedFromGroup: (groupName?: string) =>
      groupName
        ? t("chatFooterText.removedFromGroupWithName", { groupName })
        : t("chatFooterText.removedFromGroupGeneric"),
    groupDeleted: (groupName?: string) =>
      groupName
        ? t("chatFooterText.groupDeletedWithName", { groupName })
        : t("chatFooterText.groupDeletedGeneric"),
    warningIconLabel: t("chatFooterText.warningIconLabel"),
    inputPlaceholder: t("chatFooterText.inputPlaceholder"),
    emojiButton: t("chatFooterText.emojiButton"),
    sendMessageButton: t("chatFooterText.sendMessageButton"),
    characterLimitModal: {
      title: t("chatFooterText.characterLimitModalTitle"),
      message: t("chatFooterText.characterLimitModalMessage"),
    },
  };
}
