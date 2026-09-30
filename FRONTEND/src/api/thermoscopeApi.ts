const API_BASE_URL = 'https://thermoscope-backend-production.up.railway.app';

export async function getThermalEvents() {
  const eventsResponse = await fetch(
    `${API_BASE_URL}/api/events`
  );

  if (!eventsResponse.ok) {
    throw new Error(
      `Failed to fetch thermal events: ${eventsResponse.status}`
    );
  }

  const eventsData = await eventsResponse.json();

  const priorityResponse = await fetch(
    `${API_BASE_URL}/api/events/priority`
  );

  if (!priorityResponse.ok) {
    throw new Error(
      `Failed to fetch priority events: ${priorityResponse.status}`
    );
  }

  const priorityData = await priorityResponse.json();

  const priorityEvents = priorityData.events || [];

  const mergedEvents = eventsData.events.map(
    (event: any) => {
      const priorityEvent = priorityEvents.find(
        (p: any) =>
          p.event_id === event.event_id
      );

      return {
        ...event,
        ...(priorityEvent
          ? {
              final_priority:
                priorityEvent.final_priority,
              final_rank:
                priorityEvent.final_rank,
            }
          : {}),
      };
    }
  );

  console.log(
    'THERMOSCOPE MERGED:',
    mergedEvents.length,
    mergedEvents[0]
  );

  return {
    ...eventsData,
    events: mergedEvents,
  };
}
