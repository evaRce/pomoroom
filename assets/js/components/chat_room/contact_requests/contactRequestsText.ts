import { useTranslation } from "react-i18next";

export default function useContactRequestsText() {
  const { t } = useTranslation();

  return {
    background: {
      alt: t("contactRequestsText.backgroundAlt"),
    },
    understood: t("contactRequestsText.understood"),
    rejectedReceived: {
      prefix: t("contactRequestsText.rejectedReceivedPrefix"),
    },
    rejectedSend: {
      prefix: t("contactRequestsText.rejectedSendPrefix"),
    },
    requestReceived: {
      suffix: t("contactRequestsText.requestReceivedSuffix"),
      loading: t("contactRequestsText.requestReceivedLoading"),
      accept: t("contactRequestsText.accept"),
      reject: t("contactRequestsText.reject"),
    },
    requestSend: {
      prefix: t("contactRequestsText.requestSendPrefix"),
      waitingResponse: t("contactRequestsText.waitingResponse"),
    },
  };
}
