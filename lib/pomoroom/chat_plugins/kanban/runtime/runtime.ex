defmodule Pomoroom.ChatPlugins.Kanban.Runtime.Runtime do
  alias Pomoroom.ChatPlugins.Kanban.Runtime.KanbanServer

  def ensure_kanban_process_started(chat_id, chat_type, kanban_id) do
    process_id = KanbanServer.via_tuple(chat_id, chat_type, kanban_id)

    case Registry.lookup(Registry.KanbanPluginBoard, process_id) do
      [] ->
        case DynamicSupervisor.start_child(
               Pomoroom.ChatPlugins.KanbanSupervisor,
               {KanbanServer,
                %{
                  chat_id: chat_id,
                  chat_type: chat_type,
                  kanban_id: kanban_id
                }}
             ) do
          {:ok, _pid} -> {:ok, process_id}
          {:error, {:already_started, _pid}} -> {:ok, process_id}
          {:error, reason} -> {:error, reason}
        end

      _ ->
        {:ok, process_id}
    end
  end

  def terminate_kanban_process(process_id) do
    case Registry.lookup(Registry.KanbanPluginBoard, process_id) do
      [{pid, _value}] ->
        DynamicSupervisor.terminate_child(Pomoroom.ChatPlugins.KanbanSupervisor, pid)

      [] ->
        :ok
    end

    :ok
  end
end
