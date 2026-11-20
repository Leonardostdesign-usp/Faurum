import { useState, useEffect } from "react";

export function useCountdown(targetIsoDate, onExpire = null) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetIsoDate) {
      setTimeLeft("");
      return;
    }

    const target = new Date(targetIsoDate).getTime();

    function update() {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("00h00m restantes");
        if (onExpire) onExpire();
        return;
      }

      const totalMinutes = Math.floor(diff / (1000 * 60));
      const totalHours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24);
        const remHours = totalHours % 24;
        setTimeLeft(`${days}d ${remHours}h restantes`);
      } else {
        const formattedMinutes = String(minutes).padStart(2, "0");
        setTimeLeft(`${totalHours}h${formattedMinutes}m restantes`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetIsoDate, onExpire]);

  return timeLeft;
}
