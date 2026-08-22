import { useTranslation } from "react-i18next";

export default function useAddMembersModalText() {
  const { t } = useTranslation();

  return {
    title: (groupName?: string) => t("addMembersModalText.titleWithGroup", { groupName }),
    searchPlaceholder: t("addMembersModalText.searchPlaceholder"),
    clearSearch: t("addMembersModalText.clearSearch"),
    search: t("addMembersModalText.search"),
    shareLink: t("addMembersModalText.shareLink"),
    copyLink: t("addMembersModalText.copyLink"),
  };
}
