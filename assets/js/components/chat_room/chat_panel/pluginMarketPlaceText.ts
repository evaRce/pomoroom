import { useTranslation } from "react-i18next";

export default function usePluginMarketPlaceText() {
  const { t } = useTranslation();

  return {
    title: t("pluginMarketPlaceText.title"),
    description: t("pluginMarketPlaceText.description"),
    loading: {
      listPlugins: t("pluginMarketPlaceText.loadingListPlugins"),
      installation: t("pluginMarketPlaceText.loadingInstallation"),
      uninstallation: t("pluginMarketPlaceText.loadingUninstallation"),
    },
    loadError: t("pluginMarketPlaceText.loadError"),
    fetchError: t("pluginMarketPlaceText.fetchError"),
    empty: t("pluginMarketPlaceText.empty"),
    uninstall: t("pluginMarketPlaceText.uninstall"),
    install: t("pluginMarketPlaceText.install"),
    comingSoon: t("pluginMarketPlaceText.comingSoon"),
  };
}
