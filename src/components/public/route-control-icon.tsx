const shapes = {
  stops: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  me: 'm21 3-7 18-3.5-7.5L3 10l18-7Z',
  van: 'M5 16V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z M5 11h14 M8 15h1 M15 15h1 M7 18v2 M17 18v2',
  route: 'M20 7a8 8 0 0 0-13-2L4 8m0-5v5h5m-5 9a8 8 0 0 0 13 2l3-3m0 5v-5h-5',
};

export function RouteControlIcon({ name }: { name: keyof typeof shapes }) {
  return <svg aria-hidden="true" focusable="false" width="23" height="23" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={shapes[name]} />
  </svg>;
}
