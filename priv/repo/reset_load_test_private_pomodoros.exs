alias Pomoroom.ChatPlugins.PomodoroTimer.PomodoroTimerService
alias Pomoroom.PrivateChats

eva_nickname = "eva123"

buddy_nicknames =
  ["buddy123", "buddy124", "buddy125", "buddy126"] ++
    for n <- 5..24, do: "buddy#{122 + n}"

Enum.each(buddy_nicknames, fn nickname ->
  case PrivateChats.get(eva_nickname, nickname) do
    {:ok, chat} ->
      PomodoroTimerService.pause(chat.chat_id, "private")
      PomodoroTimerService.reset(chat.chat_id, "private")

    {:error, _reason} ->
      :ok
  end
end)

IO.puts("Pomodoros privados reiniciados")
