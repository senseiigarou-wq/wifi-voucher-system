import { formatTime } from "../utils/time";

export default function TimerDisplay({ time }: { time: number }) {
  return (
    <div className="box">
      <h3>Remaining Time</h3>
      <h1>{formatTime(time)}</h1>
    </div>
  );
}
