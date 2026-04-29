defmodule Pomoroom.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    db_config = Application.get_env(:pomoroom, :db)

    children = [
      PomoroomWeb.Telemetry,
      {Mongo,
       database: db_config[:database],
       name: :mongo,
       username: db_config[:username],
       password: db_config[:password]},
      {DNSCluster, query: Application.get_env(:pomoroom, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Pomoroom.PubSub},
      PomoroomWeb.Presence,
      # Start the Finch HTTP client for sending emails
      {Finch, name: Pomoroom.Finch},
      # Start a worker by calling: Pomoroom.Worker.start_link(arg)
      # {Pomoroom.Worker, arg},
      # Start to serve requests, typically the last entry
      PomoroomWeb.Endpoint,
      {DynamicSupervisor, strategy: :one_for_one, name: Pomoroom.ChatRoom.ChatSupervisor},
      {Registry, keys: :unique, name: Registry.Chat},
      {DynamicSupervisor,
       strategy: :one_for_one, name: Pomoroom.ChatPlugins.PomodoroTimerSupervisor},
      {Registry, keys: :unique, name: Registry.PomodoroPluginTimer}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Pomoroom.Supervisor]
    result = Supervisor.start_link(children, opts)
    Pomoroom.Startup.create_indexes()
    result
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    PomoroomWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
