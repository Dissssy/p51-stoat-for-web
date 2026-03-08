import { createSignal, onMount } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { t } from "@lingui/core/macro";
import MdTrash from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdEgg from "@material-design-icons/svg/outlined/egg.svg?component-solid";
import MdPersonAdd from "@material-design-icons/svg/outlined/person_add.svg?component-solid";
import MdRefresh from "@material-design-icons/svg/outlined/refresh.svg?component-solid";
import { useClient } from "@revolt/client";
import { Button, Column, Row, SplitMultiButton } from "@revolt/ui";
import { Divider } from "styled-system/jsx";

/**
 * Component for creating an instance invite. This is a one use invite that is tied to the user's account. Inviting many low quality users may result in the user's account receiving a strike or being banned.
 */
export default function CreateInvite() {
  // const [inviteCode, setInviteCode] = createSignal<string | null>(null);
  const [statusMessage, setStatusMessage] = createSignal<Record | null>(null);
  const [invites, setInvites] = createSignal<any[]>([]); // for now we dont have a type for invites, so we'll just use any
  const [isLeaf, setIsLeaf] = createSignal(false);
  const client = useClient();

  async function toggleLeaf() {
    setStatusMessage(null);
    setIsLeaf((prev) => !prev);
  }

  async function getInvites() {
    setStatusMessage(null);
    try {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      // this isnt a real endpoint, hacking this in to my instance, so we're gonna have to make a raw api call here
      const invites = await fetch(
        "https://planetfifty.one/extras/invites/list",
        {
          method: "GET",
          headers: {
            [authHeader]: authHeaderValue,
          },
        },
      ).then((res) => {
        if (!res.ok) throw new Error(t`Failed to fetch invites`);
        return res.json();
      });
      invites.sort((a: any, b: any) => {
        // sort by claimed status, then idc
        if (a.claimed_by == null && b.claimed_by != null) return -1;
        if (a.claimed_by != null && b.claimed_by == null) return 1;
        return 0;
      });
      setInvites(invites);
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function createInvite() {
    setStatusMessage(null);
    try {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      // this isnt a real endpoint, hacking this in to my instance, so we're gonna have to make a raw api call here
      const invite = await fetch(
        "https://planetfifty.one/extras/invites/create?leaf=" + isLeaf(),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [authHeader]: authHeaderValue,
          },
        },
      ).then((res) => {
        if (!res.ok) throw new Error(t`Failed to create invite`);
        return res.json();
      });
      // format the invite code to be a link
      // const inviteLink = `${window.location.origin}/login/create?code=${invite.code}`;
      // setInviteCode(inviteLink);
      // getInvites();
      setInvites([invite, ...invites()]);
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function deleteInvite(code: string) {
    setStatusMessage(null);
    try {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      // this isnt a real endpoint, hacking this in to my instance, so we're gonna have to make a raw api call here
      await fetch(
        `https://planetfifty.one/extras/invites/revoke?code=${code}`,
        {
          method: "DELETE",
          headers: {
            [authHeader]: authHeaderValue,
          },
        },
      ).then((res) => {
        if (!res.ok) throw new Error(t`Failed to revoke invite`);
      });
      // remove the invite from the list of invites
      setInvites(invites().filter((invite) => invite.code !== code));
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function copyInviteLink(code: string) {
    setStatusMessage(null);
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/login/create?code=${code}`,
      );
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
    setStatusMessage({
      type: "success",
      message: t`Invite link copied to clipboard`,
    });
  }

  async function addFriend(userName: string) {
    setStatusMessage(null);
    try {
      await client()!.api.post("/users/friend", {
        username: userName,
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
    getInvites();
  }

  onMount(() => {
    // when the component is mounted, trip the function to fetch the users invites
    getInvites();
  });

  return (
    <Column>
      <Trans>This invite is one use, and will be tied to your account.</Trans>
      <br />
      <Trans>
        Inviting many low quality users may result in your account receiving a
        strike or being banned.
      </Trans>
      {statusMessage() && statusMessage() !== null && (
        <>
          <br />
          <p
            style={{
              color: statusMessage().type === "error" ? "red" : "green",
            }}
          >
            {statusMessage().message}
          </p>
        </>
      )}
      {/* <Button onPress={createInvite}>
        <Trans>Create Invite</Trans>
      </Button> */}
      {invites() !== null && invites().length > 0 && (
        <Column style={{ "margin-top": "1em" }}>
          <Row style={{ "justify-content": "space-between" }}>
            {/* <Button isDisabled={true} group="connected-start">
              <Trans>Existing Invites</Trans>
            </Button>
            <SplitMultiButton
              labelLeft={<Trans>Create Invite</Trans>}
              disabledLeft={false}
              onPressLeft={createInvite}
              labelRight={<MdRefresh />}
              disabledRight={false}
              onPressRight={getInvites}
            /> */}
            <SplitMultiButton
              labelLeft={<Trans>Existing Invites</Trans>}
              disabledLeft={true}
              onPressLeft={undefined}
              labelRight={<MdRefresh />}
              disabledRight={false}
              onPressRight={getInvites}
            />
            <SplitMultiButton
              labelLeft={<Trans>Create Invite</Trans>}
              disabledLeft={false}
              onPressLeft={createInvite}
              labelRight={
                <>
                  {isLeaf() ? (
                    <>
                      <Trans>Child Account</Trans>
                      <MdEgg style={{ "margin-left": "0.5em" }} />
                    </>
                  ) : (
                    <>
                      <Trans>Regular User</Trans>
                      <MdPersonAdd style={{ "margin-left": "0.5em" }} />
                    </>
                  )}
                </>
              }
              disabledRight={false}
              onPressRight={toggleLeaf}
            />
          </Row>

          <Divider />
          <div
            style={{
              display: "flex",
              "flex-direction": "row",
              gap: "0.5em",
              "flex-wrap": "wrap",
            }}
          >
            {invites().map((invite) => (
              <>
                {invite.claimed_by != null ? (
                  <>
                    {typeof invite.claimed_by === "object" ? (
                      <Button
                        isDisabled={
                          invite.claimed_by.relationship_status != null
                        }
                        onPress={async () => {
                          await addFriend(invite.claimed_by.display_name);
                        }}
                        style={{ width: "fit-content" }}
                      >
                        {invite.is_leaf && (
                          <MdEgg style={{ "margin-right": "0.5em" }} />
                        )}
                        {invite.claimed_by.display_name}
                        {invite.claimed_by.relationship_status == null && (
                          <MdPersonAdd style={{ "margin-left": "0.5em" }} />
                        )}
                      </Button>
                    ) : (
                      <Button
                        isDisabled={true}
                        style={{ width: "fit-content" }}
                      >
                        {invite.is_leaf && (
                          <MdEgg style={{ "margin-right": "0.5em" }} />
                        )}
                        {invite.claimed_by}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <SplitMultiButton
                      labelLeft={
                        <>
                          {invite.is_leaf && (
                            <MdEgg style={{ "margin-right": "0.5em" }} />
                          )}
                          {invite.code}
                        </>
                      }
                      disabledLeft={false}
                      onPressLeft={async () => {
                        await copyInviteLink(invite.code);
                      }}
                      labelRight={<MdTrash />}
                      disabledRight={false}
                      onPressRight={async () => {
                        await deleteInvite(invite.code);
                      }}
                    />
                  </>
                )}
              </>
            ))}
          </div>
        </Column>
      )}
    </Column>
  );
}

// <>
//   <Row style={{ "justify-content": "space-between" }}>
//     <Button
//       isDisabled={invite.claimed_by != null}
//       onPress={async () => {
//         await copyInviteLink(invite.code);
//       }}
//     >
//       {invite.code}
//     </Button>
//     {invite.claimed_by != null ? (
//       <Button
//         isDisabled={invite.claimed_by.relationship_status != null}
//         onPress={async () => {
//           await addFriend(invite.claimed_by.display_name);
//         }}
//       >
//         {invite.claimed_by.display_name}
//         {invite.claimed_by.relationship_status == null && (
//           <MdPersonAdd style={{ "margin-left": "0.5em" }} />
//         )}
//       </Button>
//     ) : (
//       <>
//         <Button
//           onPress={async () => {
//             await deleteInvite(invite.code);
//           }}
//         >
//           <MdTrash />
//         </Button>
//       </>
//     )}
//   </Row>
// </>
