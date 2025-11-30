export default function WifiStatus({ active }: { active: boolean }) {
  return (
    <div className="box">
      <h2>{active ? "CONNECTED" : "NOT CONNECTED"}</h2>
    </div>
  );
}
