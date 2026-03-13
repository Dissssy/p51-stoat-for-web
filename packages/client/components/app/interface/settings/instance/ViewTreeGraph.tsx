import { Graph } from "@antv/g6";
import { useClient } from "@revolt/client";
import { createEffect, createSignal, onMount } from "solid-js";
import { Divider } from "styled-system/jsx";

export default function TreeGraph() {
  // const graph = new Graph({
  //   container: "container",
  //   data: {
  //     nodes: [
  //       {
  //         id: "root",
  //         label: "Root",
  //       },
  //       {
  //         id: "child1",
  //         label: "Child 1",
  //       },
  //     ],
  //     edges: [
  //       {
  //         source: "root",
  //         target: "child1",
  //       },
  //     ],
  //   },
  //   node: {
  //     style: {
  //       labelText: (d) => d.label,
  //       labelPlacement: "middle",
  //       labelFill: "#fff",
  //     },
  //   },
  //   layout: {
  //     type: "d3-force",
  //     link: {
  //       distance: 100,
  //       strength: 2,
  //     },
  //     collide: {
  //       radius: 40,
  //     },
  //   },
  //   behaviors: [
  //     {
  //       type: "drag-element-force",
  //       fixed: true,
  //     },
  //   ],
  // });

  // graph.render();
  // return <div id="tree-graph" style={{ width: "100%", height: "400px" }}></div>;

  const [data, setData] = createSignal<Record<string, any>>({
    nodes: [
      // {
      //   id: "root",
      //   label: "Loading...",
      // },
    ],
    edges: [],
  });
  const [render, setRender] = createSignal<boolean>(false);

  const graph = new Graph({
    container: "tree-graph",
    data: data(),
    node: {
      style: {
        labelText: (d) => d.label,
        labelPlacement: "middle",
        labelFill: "#fff",
      },
    },
    layout: {
      type: "d3-force",
      link: {
        distance: 200,
        strength: 2,
      },
      collide: {
        radius: 40,
      },
    },
    behaviors: [
      "zoom-canvas",
      "drag-canvas",
      {
        type: "drag-element-force",
        fixed: true,
      },
    ],
  });

  const client = useClient();

  async function fetchData() {
    // Fetch response from https://planetfifty.one/extras/invites/list?request_all=true
    const [authHeader, authHeaderValue] = client()!.authenticationHeader;
    // this isnt a real endpoint, hacking this in to my instance, so we're gonna have to make a raw api call here
    const invites = await fetch(
      "https://planetfifty.one/extras/invites/list?request_all=true",
      {
        method: "GET",
        headers: {
          [authHeader]: authHeaderValue,
        },
      },
    )
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .catch((err) => {
        // console.error("Failed to fetch invites", err);
        return null;
      });
    if (!invites || !Array.isArray(invites)) {
      setRender(false);
      return;
    }
    var nodes = [];
    var edges = [];
    var used: string[] = [];
    for (const invite of invites) {
      if (!used.includes(invite.created_by)) {
        nodes.push({
          id: invite.created_by,
          label: invite.created_by,
          style: {
            fill: "#fff",
          },
        });
      }
      // invite.claimed_by is either null | string | or the username is invite.claimed_by.display_name
      const claimed_id = invite.claimed_by
        ? typeof invite.claimed_by === "string"
          ? invite.claimed_by
          : invite.claimed_by._id
        : null;
      const claimed_by = invite.claimed_by
        ? typeof invite.claimed_by === "string"
          ? invite.claimed_by
          : invite.claimed_by.display_name
        : null;
      if (claimed_id) {
        if (!used.includes(claimed_id)) {
          nodes.push({
            id: claimed_id,
            label: claimed_by,
            style: {
              fill: typeof invite.claimed_by === "string" ? "#6f6" : "#66f",
            },
          });
          used.push(claimed_id);
        }
        edges.push({
          source: invite.created_by,
          target: claimed_id,
        });
      } else {
        nodes.push({
          id: invite.code,
          label: invite.code,
          style: {
            fill: "#f66",
          },
        });
        // dont need to set used, codes are unique
        edges.push({
          source: invite.created_by,
          target: invite.code,
        });
      }
    }
    setData({
      nodes,
      edges,
    });
    setRender(true);
  }

  onMount(async () => {
    await fetchData();
  });

  createEffect(() => {
    graph.setData(data());
    if (render()) {
      graph.render();
    }
  });

  return (
    <>
      {render() && <Divider />}
      <div id="tree-graph" style={{ width: "100%", height: "400px" }}></div>
    </>
  );
}
