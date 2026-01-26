import { useEffect } from 'react';

export function KeepAlive() {
    useEffect(() => {
        // Ping the health endpoint every 14 minutes (Render sleeps after 15m)
        const interval = setInterval(() => {
            fetch('/health')
                .then(res => {
                    if (res.ok) console.log('Keep-alive ping successful');
                })
                .catch(err => console.error('Keep-alive ping failed', err));
        }, 14 * 60 * 1000); // 14 minutes

        return () => clearInterval(interval);
    }, []);

    return null; // This component renders nothing
}
