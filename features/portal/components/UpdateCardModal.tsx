"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Field, Input, Modal } from "@/components/ui";

export function UpdateCardModal({
  open,
  onClose,
  customerId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  customerId: string;
  onDone: () => void;
}) {
  const s = useStore();
  const [number, setNumber] = useState("");
  const last4 = number.replace(/\D/g, "").slice(-4) || "0000";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update payment card"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              s.updateCard(customerId, last4);
              setNumber("");
              onClose();
              onDone();
            }}
          >
            Save card
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Card number" hint="Mock checkout — card is tokenised, never stored raw">
          <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="4242 4242 4242 4242" inputMode="numeric" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry"><Input placeholder="12 / 29" /></Field>
          <Field label="CVV"><Input placeholder="123" /></Field>
        </div>
      </div>
    </Modal>
  );
}
