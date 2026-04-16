"use client";

import { useState } from "react";
import ChatButton from "./ChatButton";
import ChatDrawer from "./ChatDrawer";

export default function ChatWrapper() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && <ChatButton onClick={() => setOpen(true)} />}
      <ChatDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
