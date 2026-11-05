// Name of an account (clone) as people see it: "Facebook 2", or for Others "Others 2 (Yelp)".
// Used by the sidebar list and by the delete warning (features/delete-clone.js), so both always agree.
//   net     the network from config/networks.js     inst    the account's data     number  its position, counting from 1
// General and E-commerce show what is typed in Network name (nothing in brackets while it is empty);
// the other kinds of Others show their fixed name, like "Others 3 (Classmates)".
import { getOtherType } from '../config/other-types.js';

export function cloneLabel(net, inst, number) {
  const base = `${net.name} ${number}`;
  if (net.id !== 'other') return base;
  const kind = getOtherType(inst.subType);
  const detail = kind?.named ? (inst.networkName ?? '').trim() : kind?.name;
  return detail ? `${base} (${detail})` : base;
}
