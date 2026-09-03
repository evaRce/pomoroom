import { useTranslation } from "react-i18next";

export default function useInfoPanelText() {
  const { t } = useTranslation();

  return {
    closeDetails: t("infoPanelText.closeDetails"),
    defaultAvatarAlt: t("infoPanelText.defaultAvatarAlt"),
    members: (count: number) => t("infoPanelText.membersCount", { count }),
    moreOptions: t("infoPanelText.moreOptions"),
    leaveGroup: t("infoPanelText.leaveGroup"),
    removeAsAdmin: t("infoPanelText.removeAsAdmin"),
    setAsAdmin: t("infoPanelText.setAsAdmin"),
    removeMember: t("infoPanelText.removeMember"),
    adminBadge: t("infoPanelText.adminBadge"),
    invite: t("infoPanelText.invite"),
    confirmLeaveGroupTitle: t("infoPanelText.confirmLeaveGroupTitle"),
    confirmLeaveGroupMessage: (groupName: string) =>
      t("infoPanelText.confirmLeaveGroupMessage", { groupName }),
    confirmRemoveMemberTitle: t("infoPanelText.confirmRemoveMemberTitle"),
    confirmRemoveMemberMessage: (nickname: string) =>
      t("infoPanelText.confirmRemoveMemberMessage", { nickname }),
    confirmCancelButton: t("infoPanelText.confirmCancelButton"),
    deleteGroup: t("infoPanelText.deleteGroup"),
    confirmDeleteGroupTitle: t("infoPanelText.confirmDeleteGroupTitle"),
    confirmDeleteGroupMessage: (groupName: string) =>
      t("infoPanelText.confirmDeleteGroupMessage", { groupName }),
  };
}
