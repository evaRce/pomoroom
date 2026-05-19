Mix.Task.run("app.start")

defmodule Pomoroom.Seeds do
  alias Pomoroom.FriendRequests
  alias Pomoroom.GroupChats
  alias Pomoroom.PrivateChats
  alias Pomoroom.Startup

  @collections ["messages", "private_chats", "group_chats", "friend_requests", "pomodoro_timers"]

  def run do
    Startup.create_indexes()

    Mix.shell().info("Resetting chat-related collections before reseeding...")

    Enum.each(@collections, fn collection ->
      Mongo.delete_many(:mongo, collection, %{})
    end)

    users =
      Mongo.find(:mongo, "users", %{})
      |> Enum.to_list()
      |> Enum.map(&normalize_user/1)
      |> Enum.reject(&is_nil/1)
      |> Enum.sort_by(& &1.nickname)

    Mix.shell().info("Found #{length(users)} registered users")

    seed_manual_groups(users)
    seed_friend_requests_by_status(users)
    seed_private_chats_from_accepted_requests(users)

    Mix.shell().info("Seed finished")
  end

  defp normalize_user(user) when is_map(user) do
    nickname = Map.get(user, "nickname") || Map.get(user, :nickname)

    if is_binary(nickname) do
      %{nickname: nickname}
    else
      nil
    end
  end

  defp normalize_user(_), do: nil

  defp seed_manual_groups(users) do
    if length(users) < 4 do
      Mix.shell().info("Skipping manual groups: at least 4 users are required")
    else
      u1 = Enum.at(users, 0).nickname
      u2 = Enum.at(users, 1).nickname
      u3 = Enum.at(users, 2).nickname
      u4 = Enum.at(users, 3).nickname

      create_group_with_members("seed-product-team", u1, [u2, u3])
      create_group_with_members("seed-research", u2, [u1])
      create_group_with_members("seed-design-review", u3, [u1, u2, u4])
    end
  end

  defp create_group_with_members(group_name, owner, members_to_add) do
    case GroupChats.create_group_chat(owner, group_name) do
      {:ok, _group_chat} ->
        Enum.each(members_to_add, fn member ->
          case GroupChats.add_member(group_name, owner, member) do
            {:ok, _message} ->
              :ok

            {:error, reason} ->
              Mix.shell().info(
                "Group member seed skipped for #{group_name} / #{member}: #{inspect(reason)}"
              )
          end
        end)

      {:error, reason} ->
        Mix.shell().info("Group chat seed skipped for #{group_name}: #{inspect(reason)}")
    end
  end

  defp seed_friend_requests_by_status(users) do
    if length(users) < 6 do
      Mix.shell().info("Skipping friend request scenarios: at least 6 users are required")
    else
      u1 = Enum.at(users, 0).nickname
      u2 = Enum.at(users, 1).nickname
      u3 = Enum.at(users, 2).nickname
      u4 = Enum.at(users, 3).nickname
      u5 = Enum.at(users, 4).nickname
      u6 = Enum.at(users, 5).nickname

      # accepted
      case FriendRequests.send_friend_request(u2, u1) do
        {:ok, _request} ->
          FriendRequests.accept_friend_request(u2, u1)

        {:error, reason} ->
          Mix.shell().info("Accepted request seed skipped for #{u1} -> #{u2}: #{inspect(reason)}")
      end

      # pending
      case FriendRequests.send_friend_request(u4, u3) do
        {:ok, _request} ->
          :ok

        {:error, reason} ->
          Mix.shell().info("Pending request seed skipped for #{u3} -> #{u4}: #{inspect(reason)}")
      end

      # rejected
      case FriendRequests.send_friend_request(u6, u5) do
        {:ok, _request} ->
          FriendRequests.reject_friend_request(u6, u5)

        {:error, reason} ->
          Mix.shell().info("Rejected request seed skipped for #{u5} -> #{u6}: #{inspect(reason)}")
      end
    end
  end

  defp seed_private_chats_from_accepted_requests(users) do
    if length(users) < 2 do
      Mix.shell().info("Skipping private chats from accepted requests: not enough users")
    else
      u1 = Enum.at(users, 0).nickname
      u2 = Enum.at(users, 1).nickname

      case PrivateChats.ensure_exists(u2, u1) do
        {:ok, _chat} ->
          :ok

        {:error, reason} ->
          Mix.shell().info(
            "Private chat seed skipped for accepted pair #{u1} / #{u2}: #{inspect(reason)}"
          )
      end
    end
  end
end

Pomoroom.Seeds.run()
