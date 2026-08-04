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
  };
}
