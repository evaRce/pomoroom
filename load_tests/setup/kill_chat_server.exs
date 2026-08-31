target = System.get_env("TARGET_NODE") |> String.to_atom()
cookie = System.get_env("TARGET_COOKIE") |> String.to_atom()
chat_id = System.get_env("CHAT_ID")

Node.set_cookie(cookie)
true = Node.connect(target)
Process.sleep(300)

case :rpc.call(target, Registry, :lookup, [Registry.Chat, chat_id]) do
  [{pid, _value}] ->
    :rpc.call(target, Process, :exit, [pid, :kill])
    IO.puts("KILLED chat_id=#{chat_id} pid=#{inspect(pid)}")

  [] ->
    IO.puts("NOT_RUNNING chat_id=#{chat_id}")
end
