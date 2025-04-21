import Clock from './Clock';

export default function HeaderClock({ variant = "glass", showDate = false }) {
  return (
    <div className="mr-2">
      <Clock 
        className="text-xs py-0.5 px-2" 
        variant={variant}
        showDate={showDate}
      />
    </div>
  );
}
