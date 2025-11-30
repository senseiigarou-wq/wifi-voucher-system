import { useState } from "react";
import { vouchers } from "../data/vouchers";

export default function VoucherInput({
  onActivate
}: {
  onActivate: (min: number) => void;
}) {
  const [code, setCode] = useState("");

  const submit = () => {
    const found = vouchers.find(v => v.code === code.toUpperCase());

    if (!found) {
      alert("Invalid voucher!");
      return;
    }

    alert("Voucher accepted!");
    onActivate(found.minutes);
  };

  return (
    <div className="box">
      <input
        placeholder="Enter voucher code"
        value={code}
        onChange={e => setCode(e.target.value)}
      />
      <br /><br />
      <button onClick={submit}>Activate</button>
    </div>
  );
}
