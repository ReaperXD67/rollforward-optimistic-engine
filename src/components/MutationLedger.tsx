import { Check, CircleAlert, Clock3, RotateCw } from 'lucide-react';
import type { LedgerEvent, MutationRecord } from '../domain/engine';

function statusIcon(status: MutationRecord['status']) {
  if (status === 'acknowledged') return <Check size={13} aria-hidden="true" />;
  if (status === 'conflict' || status === 'rejected') return <CircleAlert size={13} aria-hidden="true" />;
  if (status === 'retry_wait') return <RotateCw size={13} aria-hidden="true" />;
  return <Clock3 size={13} aria-hidden="true" />;
}

export function MutationLedger({
  events,
  mutations,
  onClear,
}: {
  events: LedgerEvent[];
  mutations: MutationRecord[];
  onClear: () => void;
}) {
  const activeCount = mutations.filter((mutation) =>
    ['queued', 'in_flight', 'retry_wait'].includes(mutation.status),
  ).length;

  function exportTranscript() {
    const transcript = {
      exportedAt: new Date().toISOString(),
      mutations,
      events: [...events].reverse(),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rollforward-mutation-transcript.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <aside className="ledger-panel" id="ledger" aria-labelledby="ledger-title">
      <div className="panel-heading">
        <div>
          <p className="overline">Mutation ledger</p>
          <h3 id="ledger-title">Intent to acknowledgement</h3>
        </div>
        <div className="ledger-actions">
          <button className="text-button" type="button" onClick={exportTranscript}>
            Export transcript
          </button>
          <button className="text-button" type="button" onClick={onClear}>
            Clear settled
          </button>
        </div>
      </div>

      <div className="queue-strip" aria-label={`${activeCount} active mutations`}>
        <span className={activeCount ? 'queue-light queue-light-active' : 'queue-light'} />
        <span>{activeCount ? `${activeCount} mutation${activeCount === 1 ? '' : 's'} active` : 'outbox aligned'}</span>
      </div>

      <ol className="event-list">
        {events.slice(0, 9).map((item) => {
          const mutation = mutations.find((entry) => entry.command.id === item.mutationId);
          return (
            <li key={item.id} className={`event event-${item.kind}`}>
              <div className="event-marker">
                {mutation ? statusIcon(mutation.status) : <span />}
              </div>
              <div>
                <div className="event-line">
                  <strong>{item.title}</strong>
                  <time dateTime={item.at}>
                    {new Intl.DateTimeFormat('en', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }).format(new Date(item.at))}
                  </time>
                </div>
                <p>{item.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
