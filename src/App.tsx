import { useState, useEffect } from "react";
import WifiStatus from "./components/WifiStatus";
import VoucherInput from "./components/VoucherInput";
import TimerDisplay from "./components/TimerDisplay";

export default function App() {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (seconds <= 0) return;

    const timer = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(timer);
  }, [active, seconds]);

  const activateVoucher = (min: number) => {
    setSeconds(min * 60);
    setActive(true);
  };

  return (
    <div className="container">

      <WifiStatus active={active} />

      {active && seconds > 0 && <TimerDisplay time={seconds} />}

      {!active && <VoucherInput onActivate={activateVoucher} />}

      {active && seconds <= 0 && (
        <h2 style={{ color: "red" }}>Time Expired</h2>
      )}

    </div>
  );
}
