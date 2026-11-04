import React from 'react';
import StorytellerApp from '@/components/StorytellerApp';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const autostart = params?.autostart === '1' || params?.autostart === 'true';

  return <StorytellerApp autoStartFromQuery={autostart} />;
}
