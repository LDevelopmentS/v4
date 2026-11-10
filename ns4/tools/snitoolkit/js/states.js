// One state table for every feature (the old file had three, one with a typo).
const NAMES = 'alabama al,alaska ak,arizona az,arkansas ar,california ca,colorado co,connecticut ct,delaware de,florida fl,georgia ga,hawaii hi,idaho id,illinois il,indiana in,iowa ia,kansas ks,kentucky ky,louisiana la,maine me,maryland md,massachusetts ma,michigan mi,minnesota mn,mississippi ms,missouri mo,montana mt,nebraska ne,nevada nv,new-hampshire nh,new-jersey nj,new-mexico nm,new-york ny,north-carolina nc,north-dakota nd,ohio oh,oklahoma ok,oregon or,pennsylvania pa,rhode-island ri,south-carolina sc,south-dakota sd,tennessee tn,texas tx,utah ut,vermont vt,virginia va,washington wa,west-virginia wv,wisconsin wi,wyoming wy';
const STATE_ABBR = {};
NAMES.split(',').forEach(p => { const [n, a] = p.split(' '); STATE_ABBR[n.replace('-', ' ')] = a; });

export const LINKEDIN_GEO = {"al":"104514075","ak":"103991206","az":"104193321","ar":"105658826","ca":"102095887","co":"100913221","ct":"100742183","de":"101683931","fl":"101318387","ga":"105370425","hi":"104712771","id":"104342207","il":"106297371","in":"100078170","ia":"106880053","ks":"106190547","ky":"106170940","la":"103752601","me":"100589712","md":"106412613","ma":"101018698","mi":"104764831","mn":"104958045","ms":"105221971","mo":"100650570","mt":"100630737","ne":"103730999","nv":"100799797","nh":"101185038","nj":"101217735","nm":"101569426","ny":"105080838","nc":"104880996","nd":"100819957","oh":"104443421","ok":"105634629","or":"105151242","pa":"103289047","ri":"106424364","sc":"104323608","sd":"105476004","tn":"106579246","tx":"102748797","ut":"102073993","vt":"101662580","va":"101026601","wa":"103212711","wv":"106144670","wi":"101452733","wy":"103294326"};

// "Texas" or "TX" -> "tx". Anything else comes back lower-cased and trimmed.
export function abbr(input) {
  const k = String(input || '').trim().toLowerCase();
  return STATE_ABBR[k] || k;
}
