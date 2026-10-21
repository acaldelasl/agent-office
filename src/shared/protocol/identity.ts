/** A display name is metadata, not an agent prompt or a change of session. */
export type WorkerIdentityClientMsg = { t: 'worker.rename'; workerId: string; name: string };
