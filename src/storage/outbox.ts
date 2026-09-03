import type { MutationRecord } from '../domain/engine';

const databaseName = 'rollforward-client';
const storeName = 'mutation-outbox';

interface StoredMutation {
  id: string;
  mutation: MutationRecord;
}

function openDatabase(): Promise<IDBDatabase | undefined> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(undefined);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open the mutation outbox.'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Outbox transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Outbox transaction was aborted.'));
  });
}

export async function readOutbox(): Promise<MutationRecord[]> {
  const database = await openDatabase();
  if (!database) return [];

  try {
    const transaction = database.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).getAll();
    const records = await new Promise<StoredMutation[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as StoredMutation[]);
      request.onerror = () => reject(request.error ?? new Error('Unable to read the mutation outbox.'));
    });
    await transactionComplete(transaction);
    return records
      .map(({ mutation }) => ({ ...mutation, status: 'queued' as const, error: undefined }))
      .sort((left, right) => left.command.scenarioSequence - right.command.scenarioSequence);
  } finally {
    database.close();
  }
}

export async function writeOutbox(mutations: MutationRecord[]): Promise<void> {
  const database = await openDatabase();
  if (!database) return;

  try {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    for (const mutation of mutations) {
      if (['queued', 'in_flight', 'retry_wait'].includes(mutation.status)) {
        store.put({ id: mutation.command.id, mutation } satisfies StoredMutation);
      } else {
        store.delete(mutation.command.id);
      }
    }
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function clearOutbox(): Promise<void> {
  const database = await openDatabase();
  if (!database) return;
  try {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).clear();
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}
