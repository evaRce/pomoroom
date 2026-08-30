const ORIGINAL_BUDDIES = [
  { email: 'buddy@example.com', password: 'Buddy12345', nickname: 'buddy123' },
  { email: 'buddy2@example.com', password: 'Buddy12345', nickname: 'buddy124' },
  { email: 'buddy3@example.com', password: 'Buddy12345', nickname: 'buddy125' },
  { email: 'buddy4@example.com', password: 'Buddy12345', nickname: 'buddy126' },
];

const GENERATED_BUDDIES = Array.from({ length: 20 }, (_, i) => {
  const n = i + 5;
  return { email: `buddy${n}@example.com`, password: 'Buddy12345', nickname: `buddy${122 + n}` };
});

export const ALL_BUDDIES = ORIGINAL_BUDDIES.concat(GENERATED_BUDDIES);
