import type { WorkerIdentityClientMsg } from '../../../shared/protocol/identity.js';
import { workerOf } from './common.js';
import type { HandlerMap } from './types.js';

export const identityHandlers = {
  'worker.rename'(ctx, c, msg) {
    if (!ctx.meOf(c.accountId).admin) return ctx.warn(c, 'Only admins can rename workers');
    const w = workerOf(ctx, msg.workerId);
    if (!w) return ctx.warn(c, 'No such worker');
    if (ctx.floorOf(c) !== w.floor) return ctx.warn(c, 'Go to the worker’s floor first');
    ctx.warn(c, w.floor.workers.rename(w.wid, msg.name));
  },
} satisfies HandlerMap<WorkerIdentityClientMsg>;
