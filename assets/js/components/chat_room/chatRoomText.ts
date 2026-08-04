import { useTranslation } from "react-i18next";

export default function useChatRoomText() {
  const { t } = useTranslation();

  return {
    back: t("chatRoomText.back"),
  };
}
