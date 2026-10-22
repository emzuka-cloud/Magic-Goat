// Date-only values ("YYYY-MM-DD") must be read as local dates. `new Date('2026-10-12')` is UTC
// midnight, which shows as the previous day in timezones behind UTC.

export const todayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatDateOnly = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString();

export const isValidDateOnly = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(new Date(`${value}T00:00:00`).getTime());

/** "Starts: 10/20/2026" for a future date, "Started: 10/12/2026" from that day on. Same wording on every screen. */
export const startLabel = (value: string) =>
    `${value.slice(0, 10) > todayLocal() ? 'Starts' : 'Started'}: ${formatDateOnly(value)}`;
