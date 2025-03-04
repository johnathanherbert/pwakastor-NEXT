export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-2 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="text-sm"
          style={{ color: entry.payload.color || entry.color }}
        >
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}