import { createSignal, onMount } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { t } from "@lingui/core/macro";
// import MdTrash from "@material-design-icons/svg/outlined/delete.svg?component-solid";
// import MdEgg from "@material-design-icons/svg/outlined/egg.svg?component-solid";
// import MdPersonAdd from "@material-design-icons/svg/outlined/person_add.svg?component-solid";
// import MdRefresh from "@material-design-icons/svg/outlined/refresh.svg?component-solid";
import { useClient } from "@revolt/client";
import { Avatar } from "@revolt/ui/components/design/Avatar";
// import { Button, Column, Deferred, Row, SplitMultiButton } from "@revolt/ui";
import { Button, MenuButton, OverflowingText, Username } from "@revolt/ui";
import { Divider } from "styled-system/jsx";
// import TreeGraph from "./ViewTreeGraph";

/**
 * Component for managing child accounts on a parent account. (users that have been invited with a leaf invite)
 */
export default function ManageChildren() {
  const client = useClient();

  const [statusMessage, setStatusMessage] = createSignal<Record<
    string,
    any
  > | null>(null);

  const [leafUsers, setLeafUsers] = createSignal<Record<string, any>[] | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = createSignal<string | null>(null);
  // Memoized map of userId -> detailed info
  const [detailedUsers, setDetailedUsers] = createSignal<Record<string, any>>(
    {},
  );

  async function fetchLeafUsers() {
    // fetch from /extras/leaf_children and store in leafUsers signal
    try {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      const response = await fetch(
        "https://planetfifty.one/extras/leaf_children",
        {
          method: "GET",
          headers: {
            [authHeader]: authHeaderValue,
          },
        },
      ).then((res) => {
        if (!res.ok) throw new Error(t`Failed to fetch leaf users`);
        return res.json();
      });
      setLeafUsers(response);
    } catch (error) {
      console.error(
        "Failed to fetch leaf users:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // Fetch and cache detailed user info
  async function fetchDetailedUser(userId: string) {
    // If already cached, skip
    if (detailedUsers()[userId]) return detailedUsers()[userId];
    try {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      const response = await fetch(
        `https://planetfifty.one/extras/leaf_children?child_id=${userId}`,
        {
          headers: {
            [authHeader]: authHeaderValue,
          },
        },
      ).then((res) => res.json());
      setDetailedUsers((prev) => ({ ...prev, [userId]: response }));
      return response;
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  }

  // Remove a user from the list and cache
  function removeChildFromState(childId: string) {
    setLeafUsers((prev) =>
      prev ? prev.filter((u) => u._id !== childId) : prev,
    );
    setDetailedUsers((prev) => {
      const { [childId]: _, ...rest } = prev;
      return rest;
    });
  }

  onMount(async () => {
    await fetchLeafUsers();
  });

  return (
    <>
      <Trans>
        This is a list of accounts you have invited with leaf invites.
      </Trans>
      <br />
      <Trans>
        These accounts are tied to your account, and you can view them here. You
        can also remove them if you no longer want them to be associated with
        your account.
      </Trans>
      <br />
      {statusMessage() && statusMessage() !== null && (
        <>
          <br />
          <p
            style={{
              color: statusMessage()!.type === "error" ? "red" : "green",
            }}
          >
            {statusMessage()!.message}
          </p>
          <br />
        </>
      )}
      {selectedUser() !== null ? (
        <>
          <DetailedLeafUser
            userId={selectedUser()!}
            onBack={() => setSelectedUser(null)}
            userData={detailedUsers()[selectedUser()!]}
            fetchUser={fetchDetailedUser}
            onUnlink={(id) => {
              removeChildFromState(id);
              setSelectedUser(null);
              setStatusMessage({
                type: "success",
                message: t`Successfully unlinked child account.`,
              });
            }}
          />
        </>
      ) : (
        <>
          {leafUsers() !== null ? (
            <>
              {leafUsers()!.length === 0 ? (
                <Trans>
                  You have not invited any accounts with leaf invites.
                </Trans>
              ) : (
                <div
                  style={{
                    display: "flex",
                    "flex-direction": "row",
                    gap: "0.5em",
                    "flex-wrap": "wrap",
                  }}
                >
                  {leafUsers()!.map((user) => (
                    <LeafUser
                      display_name={user.display_name}
                      id={user._id}
                      picture_url={user.profile_picture_url}
                      attention={selectedUser() === user._id}
                      onClick={(id) => {
                        // Fetch and cache before showing
                        fetchDetailedUser(id).then(() => setSelectedUser(id));
                      }}
                      onMouseOver={() => fetchDetailedUser(user._id)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <></>
          )}
        </>
      )}
    </>
  );
}

function LeafUser(props: {
  onClick: (id: string) => void;
  display_name: string;
  id: string;
  picture_url: string;
  attention: boolean;
  onMouseOver?: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "row",
        "align-items": "center",
        gap: "0.5em",
      }}
    >
      <MenuButton
        size="normal"
        attention={props.attention ? "active" : "normal"}
        icon={
          <Avatar
            src={props.picture_url}
            fallback={props.display_name}
            size={32}
            holepunch="none"
          />
        }
        onClick={() => {
          props.onClick(props.id);
        }}
        onMouseOver={props.onMouseOver}
      >
        <OverflowingText>
          <Username
            username={props.display_name}
            colour={"var(--md-sys-color-on-surface)"}
          />
        </OverflowingText>
      </MenuButton>
    </div>
  );
}

function DetailedLeafUser(props: {
  userId: string;
  onBack: () => void;
  userData: any;
  fetchUser: (id: string) => Promise<any>;
  onUnlink: (id: string) => void;
}) {
  // If userData is not present, fetch it (should be rare due to preloading)
  const [leaf, setLeaf] = createSignal<Record<string, any> | null>(
    props.userData ?? null,
  );
  const client = useClient();
  const [deleting, setDeleting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  async function handleDelete() {
    if (
      !window.confirm(
        "Are you sure you want to unlink this child account? This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    setError(null);
    try {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      const response = await fetch(
        `https://planetfifty.one/extras/leaf_unlink?child_id=${props.userId}`,
        {
          method: "DELETE",
          headers: {
            [authHeader]: authHeaderValue,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to unlink child account");
      }
      props.onUnlink(props.userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
    }
  }

  onMount(async () => {
    if (!leaf()) {
      const data = await props.fetchUser(props.userId);
      setLeaf(data);
    }
  });

  return (
    <>
      {leaf() !== null ? (
        <>
          <div
            style={{
              display: "flex",
              "justify-content": "space-between",
              margin: "0 var(--gap-md)",
              padding: "0 var(--gap-md)",
            }}
          >
            <LeafUser
              display_name={leaf()!.user.display_name}
              id={leaf()!.user._id}
              picture_url={leaf()!.user.profile_picture_url}
              attention={true}
              onClick={() => props.onBack()}
            />
            <Button size="small" isDisabled={deleting()} onPress={handleDelete}>
              <Trans>Unlink</Trans>
            </Button>
          </div>
          {error() && <p style={{ color: "red" }}>{error()}</p>}
          <Divider />
          <Trans>Servers:</Trans>
          <div
            style={{
              display: "flex",
              "flex-direction": "row",
              gap: "0.5em",
              "flex-wrap": "wrap",
            }}
          >
            {leaf()!.servers.map((server: Record<string, any>) => (
              <LeafUser
                display_name={server.name}
                id={server._id}
                picture_url={server.icon}
                attention={false}
                onClick={() => {}}
              />
            ))}
          </div>
          <Divider />
          <Trans>Friends:</Trans>
          <div
            style={{
              display: "flex",
              "flex-direction": "row",
              gap: "0.5em",
              "flex-wrap": "wrap",
            }}
          >
            {leaf()!.friends.map((friend: Record<string, any>) => (
              <LeafUser
                display_name={friend.display_name}
                id={friend._id}
                picture_url={friend.profile_picture_url}
                attention={false}
                onClick={() => {}}
              />
            ))}
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
}
