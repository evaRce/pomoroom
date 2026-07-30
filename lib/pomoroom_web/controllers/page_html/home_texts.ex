defmodule PomoroomWeb.PageHTML.HomeTexts do
  @moduledoc """
  Centralizes the copy shown on the home page, wired through Gettext
  so it can be translated per locale.
  """
  import PomoroomWeb.Gettext

  @locales ~w(es en)

  def texts do
    current_locale = Gettext.get_locale(PomoroomWeb.Gettext)
    next_locale = Enum.find(@locales, &(&1 != current_locale)) || current_locale

    %{
      nav: %{
        language: String.upcase(current_locale),
        language_next_locale: next_locale,
        language_aria: gettext("Cambiar idioma"),
        login: gettext("Iniciar sesión"),
        signup: gettext("Registrarse")
      },
      hero: %{
        title_pomoroom: "Pomoroom",
        tagline: gettext("Conecta. Colabora. Crea."),
        description: gettext("Una plataforma de mensajería moderna con herramientas de productividad"),
        subtext_prefix: gettext("POMOROOM es tu espacio para estudiar y/o trabajar con enfoque, ya sea"),
        subtext_suffix: gettext("o en grupo."),
        solo_variants: solo_variants(current_locale)
      },
      features: %{
        chats_private: %{
          title: gettext("Chats Privados"),
          description: gettext("Conversaciones seguras 1 a 1")
        },
        chats_group: %{
          title: gettext("Chats Grupales"),
          description: gettext("Colabora con tu equipo")
        },
        calls: %{title: gettext("Voz y Video"), description: gettext("Llamadas WebRTC")},
        plugins: %{
          title: gettext("Plugins"),
          description: gettext("Temporizador Pomodoro y tablero Kanban")
        }
      },
      showcase: %{
        title: gettext("Así se ve Pomoroom"),
        prev_label: gettext("Previous"),
        next_label: gettext("Next"),
        image_alt: gettext("Captura de Pomoroom"),
        image_alt_zoomed: gettext("Captura de Pomoroom ampliada"),
        zoom_label: gettext("Ampliar imagen"),
        close_label: gettext("Cerrar")
      }
    }
  end

  defp solo_variants("en"), do: ["alone"]
  defp solo_variants(_locale), do: ["solo", "sola", "sole"]
end
