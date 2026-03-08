import { createEffect, createSignal, Match, Switch } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";

import { useClient, useClientLifecycle } from "@revolt/client";
import { State, TransitionType } from "@revolt/client/Controller";
import { useModals } from "@revolt/modal";
import { Navigate } from "@revolt/routing";
import {
  Button,
  CircularProgress,
  Column,
  iconSize,
  Row,
  Text,
} from "@revolt/ui";

import MdArrowBack from "@material-design-icons/svg/filled/arrow_back.svg?component-solid";

import { t } from "@lingui/core/macro";
import { useState } from "@revolt/state";
import { FlowTitle } from "./Flow";
import { Fields, Form } from "./Form";

/**
 * Flow for logging into an account
 */
export default function FlowLogin() {
  const state = useState();
  const modals = useModals();
  const { lifecycle, isLoggedIn, login, selectUsername } = useClientLifecycle();

  /**
   * Log into account
   * @param data Form Data
   */
  async function performLogin(data: FormData) {
    const email = data.get("email") as string;
    const password = data.get("password") as string;

    await login(
      {
        email,
        password,
      },
      modals,
    );
  }

  /**
   * Select a new username
   * @param data Form Data
   */
  async function select(data: FormData) {
    const username = data.get("username") as string;
    await selectUsername(username);
  }

  return (
    <>
      <Switch
        fallback={
          <>
            <FlowTitle subtitle={<Trans>Sign into Stoat</Trans>} emoji="wave">
              <Trans>Welcome!</Trans>
            </FlowTitle>
            <Form onSubmit={performLogin}>
              <Fields fields={["email", "password"]} />
              <Column gap="xl" align>
                <a href="/login/reset">
                  <Button variant="text">
                    <Trans>Reset password</Trans>
                  </Button>
                </a>
                <a href="/login/resend">
                  <Button variant="text">
                    <Trans>Resend verification</Trans>
                  </Button>
                </a>
              </Column>
              <Row align justify>
                <a href="..">
                  <Button variant="text">
                    <MdArrowBack {...iconSize("1.2em")} /> <Trans>Back</Trans>
                  </Button>
                </a>
                <Button type="submit">
                  <Trans>Login</Trans>
                </Button>
              </Row>
            </Form>
          </>
        }
      >
        <Match when={isLoggedIn()}>
          <Navigate href={state.layout.popNextPath() ?? "/app"} />
        </Match>
        <Match when={lifecycle.state() === State.LoggingIn}>
          <CircularProgress />
        </Match>
        <Match when={lifecycle.state() === State.Onboarding}>
          <FlowTitle>
            <Trans>Choose a username</Trans>
          </FlowTitle>

          <Text>
            <Trans>
              Pick a username that you want people to be able to find you by.
              This can be changed later in your user settings.
            </Trans>
          </Text>

          <MaybeShowLeafWarning />

          <Form onSubmit={select}>
            <Fields fields={["username"]} />
            <Row align justify>
              <Button
                variant="text"
                onPress={() =>
                  lifecycle.transition({
                    type: TransitionType.Cancel,
                  })
                }
              >
                <MdArrowBack {...iconSize("1.2em")} /> <Trans>Cancel</Trans>
              </Button>
              <Button type="submit">
                <Trans>Confirm</Trans>
              </Button>
            </Row>
          </Form>
        </Match>
      </Switch>
    </>
  );
}

function MaybeShowLeafWarning() {
  // We need to make a request to https://planetfifty.one/extras/leaf_parent to determine if the user is a leaf account.
  const [parentAccount, setParentAccount] = createSignal<string | null>(null);
  const client = useClient();

  createEffect(async () => {
    try {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      // this isnt a real endpoint, hacking this in to my instance, so we're gonna have to make a raw api call here
      await fetch(`https://planetfifty.one/extras/leaf_parent`, {
        method: "GET",
        headers: {
          [authHeader]: authHeaderValue,
        },
      }).then(async (res) => {
        if (!res.ok)
          throw new Error(t`Failed to fetch leaf parent account information`);
        const body = await res.json();
        setParentAccount((body["leaf_parent"] ?? {}).display_name ?? null);
      });
    } catch (error) {
      setParentAccount(null);
    }
  });
  return (
    <>
      {parentAccount() !== null && (
        <>
          <Text>
            <LeafWarning username={parentAccount()!} />
          </Text>
        </>
      )}
    </>
  );
}

// #: components/auth/src/flows/FlowLogin.tsx
// msgid "Leaf Account Warning"
// msgstr "You're signing up with a leaf account, which will give {username} limited access to information about your account and activity. If you believe this is an error, please request a new invite from {username}."

function LeafWarning({ username }: { username: string }) {
  return (
    <Text>
      You're signing up with a leaf account, which will give {username} limited
      access to information about your account and activity. If you believe this
      is an error, please request a new invite from {username}.
    </Text>
  );
}
