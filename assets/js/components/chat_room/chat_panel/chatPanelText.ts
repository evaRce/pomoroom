import { useTranslation } from "react-i18next";

export default function useChatPanelText() {
  const { t } = useTranslation();

  return {
    background: {
      alt: t("chatPanelText.backgroundAlt"),
    },
    pomodoroFinishedElsewhere: {
      single: t("chatPanelText.finishedElsewhere", { count: 1 }),
      multiple: (count: number) => t("chatPanelText.finishedElsewhere", { count }),
    },
  };
}
