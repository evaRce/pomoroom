import { useTranslation } from "react-i18next";

export default function useLoginText() {
  const { t } = useTranslation();

  return {
    homeButtonTitle: t("loginText.homeButtonTitle"),
    brand: {
      pomo: t("loginText.brandPomo"),
      room: t("loginText.brandRoom"),
    },
    welcome: t("loginText.welcome"),
    subtitle: t("loginText.subtitle"),
    form: {
      emailLabel: t("loginText.formEmailLabel"),
      emailRequired: t("loginText.formEmailRequired"),
      passwordLabel: t("loginText.formPasswordLabel"),
      passwordRequired: t("loginText.formPasswordRequired"),
      forgotPassword: t("loginText.formForgotPassword"),
      submit: t("loginText.formSubmit"),
      noAccount: t("loginText.formNoAccount"),
      signupLink: t("loginText.formSignupLink"),
    },
  };
}
