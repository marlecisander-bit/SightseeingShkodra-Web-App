const shapes = {
  stops: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  me: 'm21 3-7 18-3.5-7.5L3 10l18-7Z',
  van: 'M3 14v4h2m14 0h2v-4l-3-4-1.5-4h-9L6 10l-3 4Zm3-4h12M9 18h6 M9 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  route: 'M20 7a8 8 0 0 0-13-2L4 8m0-5v5h5m-5 9a8 8 0 0 0 13 2l3-3m0 5v-5h-5',
};

export function RouteControlIcon({ name }: { name: keyof typeof shapes }) {
  return <svg aria-hidden="true" focusable="false" width="23" height="23" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={shapes[name]} />
  </svg>;
}
