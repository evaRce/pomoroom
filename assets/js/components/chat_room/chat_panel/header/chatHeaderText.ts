import { useTranslation } from "react-i18next";

export default function useChatHeaderText() {
  const { t } = useTranslation();

  const pluginErrors = {
    unauthorized: t("chatHeaderText.pluginErrorUnauthorized"),
    plugin_already_installed: t("chatHeaderText.pluginErrorAlreadyInstalled"),
    plugin_not_installed: t("chatHeaderText.pluginErrorNotInstalled"),
    unsupported_plugin: t("chatHeaderText.pluginErrorUnsupported"),
    chat_not_found: t("chatHeaderText.pluginErrorChatNotFound"),
    fallback: t("chatHeaderText.pluginErrorFallback"),
  };

  return {
    pluginErrors,
    back: t("chatHeaderText.back"),
    chatTab: t("chatHeaderText.chatTab"),
    addMembers: t("chatHeaderText.addMembers"),
    plugins: t("chatHeaderText.plugins"),
    groupDetails: t("chatHeaderText.groupDetails"),
    moreOptions: t("chatHeaderText.moreOptions"),
  };
}
