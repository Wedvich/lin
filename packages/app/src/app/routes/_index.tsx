import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [{ title: "Lin" }];
};

export default function Index() {
  return <div>Lin</div>;
}
