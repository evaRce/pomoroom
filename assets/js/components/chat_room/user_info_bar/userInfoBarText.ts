import { useTranslation } from "react-i18next";

export default function useUserInfoBarText() {
  const { t } = useTranslation();

  return {
    menu: {
      addContact: t("userInfoBarText.menuAddContact"),
      createGroup: t("userInfoBarText.menuCreateGroup"),
      logout: t("userInfoBarText.menuLogout"),
    },
    others: t("userInfoBarText.others"),
    defaultAvatarAlt: t("userInfoBarText.defaultAvatarAlt"),
    groupCreatedSuccess: t("userInfoBarText.groupCreatedSuccess"),
    contactMessages: {
      alreadyAccepted: t("userInfoBarText.contactMessageAlreadyAccepted"),
      rejectedByThem: t("userInfoBarText.contactMessageRejectedByThem"),
      rejectedByMe: t("userInfoBarText.contactMessageRejectedByMe"),
      received: t("userInfoBarText.contactMessageReceived"),
      sent: t("userInfoBarText.contactMessageSent"),
    },
    modal: {
      addContactTitle: t("userInfoBarText.modalAddContactTitle"),
      createGroupTitle: t("userInfoBarText.modalCreateGroupTitle"),
      cancel: t("userInfoBarText.modalCancel"),
      addAction: t("userInfoBarText.modalAddAction"),
      createAction: t("userInfoBarText.modalCreateAction"),
      nameRequired: t("userInfoBarText.modalNameRequired"),
      addContactPlaceholder: t("userInfoBarText.modalAddContactPlaceholder"),
      createGroupPlaceholder: t("userInfoBarText.modalCreateGroupPlaceholder"),
    },
  };
}
