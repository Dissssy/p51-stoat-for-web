import { createSignal } from "solid-js";

import { t } from "@lingui/core/macro";
import { useClient } from "@revolt/client";
import { Column, TextField } from "@revolt/ui";

/**
 * Component for creating an instance invite. This is a one use invite that is tied to the user's account. Inviting many low quality users may result in the user's account receiving a strike or being banned.
 */
export default function CreateInvite() {
  const [inviteCode, setInviteCode] = createSignal<string | null>(null);
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
  const client = useClient();

  async function onSubmit() {
    try {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      // this isnt a real endpoint, hacking this in to my instance, so we're gonna have to make a raw api call here
      const invite = await fetch("/instance-invites/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [authHeader]: authHeaderValue,
        },
      }).then((res) => {
        if (!res.ok) throw new Error(t`Failed to create invite`);
        return res.json();
      });
      // format the invite code to be a link
      const inviteLink = `${window.location.origin}/login/create?code=${invite.code}`;
      setInviteCode(inviteLink);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <Column>
      <p>
        This invite is one use, and will be tied to your account.
        <br />
        Inviting many low quality users may result in your account receiving a
        strike or being banned.
      </p>
      {(errorMessage() && <p style={{ color: "red" }}>{errorMessage()}</p>) ||
        (inviteCode() && (
          <>
            <p>Invite created! Here is your invite link:</p>
            <TextField value={inviteCode() || ""} />
          </>
        )) || (
          <button onClick={onSubmit}>
            <p>Create Invite</p>
          </button>
        )}
    </Column>
  );
}
