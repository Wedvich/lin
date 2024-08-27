import * as Headless from "@headlessui/react";
import { type LinkProps, Link as RemixLink } from "@remix-run/react";
import React, { forwardRef } from "react";

export const Link = forwardRef(function Link(
  props: { href: string | LinkProps["to"] } & Omit<LinkProps, "to">,
  ref: React.ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <Headless.DataInteractive>
      <RemixLink {...props} to={props.href} ref={ref} />
    </Headless.DataInteractive>
  );
});
