"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Field, Input, Modal } from "@/components/ui";

export function AddCustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submit() {
    if (!name.trim() || !email.trim()) return;
    s.addCustomer({ name: name.trim(), email: email.trim() });
    setName("");
    setEmail("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add customer"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Add customer</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </Field>
        <Field label="Email" hint="Checkout will collect & tokenise their card on first subscription">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
        </Field>
      </div>
    </Modal>
  );
}
