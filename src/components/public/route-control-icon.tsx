const shapes = {
  stops: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  me: 'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  van: 'M5 16V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z M5 11h14 M8 15h1 M15 15h1 M7 18v2 M17 18v2',
  route: 'M5 18a2 2 0 1 0 0 .01 M19 6a2 2 0 1 0 0 .01 M7 18h8a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h8',
};

export function RouteControlIcon({ name }: { name: keyof typeof shapes }) {
  return <svg aria-hidden="true" focusable="false" width="23" height="23" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={shapes[name]} />
  </svg>;
}
