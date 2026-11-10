// Content for the Search Guide and Checklist popups. Edit text and links here only.
export const GUIDE_KEY = 'ns_guide_checks';
export const CHECKLIST_KEY = 'ns_checklist_checks';

const T = "Name Search (Utilize all name combination and aliases)";
const IDC = "Double check IDcrawl name search for expand search results";
const WORK = "Look for POI's place of work, school, or other organization they might follow";

// Item: a string = checkbox row. {t, nocheck:true} = plain row. {note:'Lead', text:'...'} = note box.
// Group: breakAfter:true starts a new row after it.
export const GUIDE = [
  { id: 'fb', title: 'Facebook', cols: [
    [{ id: 'common', head: 'Common Search Combination', items: [
      "If name is unique: Do First & Last Name + Ctr F first. Scroll through all results and use Ctr F look for exact matches",
      "First & Last Name + Filter 'City, State'",
      "First & Last Name, State",
      "First & Last Name, City",
      "Alias + Filter 'City, State'",
      "Alias, State",
      "Alias, City",
      "First & Last Name in Post Tab (For unique name)",
      "First & Last Name in Post Tab + Filter 'City, State'",
      "Alias + Filter 'City, State' (Post Tab)",
      "First & Last Name, 'Birthday / Cumpleanos'",
      "Alias, 'Birthday or Cumpleanos'"
    ] }],
    [
      { id: 'rel', head: "Searching POI's Relative", items: [
        { note: 'Note:', text: "Prioritize searching for relatives with possible unique name or the first 5 results (The 1st 5 result usually includes spouse, parents, or immediate relatives)" },
        "First & Last Name + Filter 'City, State' from PSE",
        "Possible Aliases + Filter 'City, State' from PSE"
      ] },
      { id: 'relid', head: 'Relatives Identified / Possible Relative Found', items: [
        "Check Friends List / Family Relationship",
        "Utilize Advance Search",
        { note: 'Advance Search Tips:', text: "Keywords you can use can be but not limited to birthday, first and last name, relationship (Son, Father, Mother, Daughter, etc), family" }
      ] }
    ],
    [
      { id: 'found', head: "POI's Possible FB Found", items: [
        "Utilize Advance Search (Birthday/Phone Number/Work if given)",
        "Look for confirmed relative's and closest friends",
        "Check photos to cross match with POI's Address",
        "Check About Section for possible DOB or family info"
      ] },
      { id: 'poi', head: 'POI Identified', items: [
        "Review POI's photo and videos (Possible connections or usernames)",
        "Double check FB search results for possible visual match (Be mindful photos used from identified account)",
        "Check closest friends and relatives more accounts",
        "Use advance search; Look up POI's name and Socmed platforms (e.g. TikTok, Twitter)"
      ] }
    ]
  ] },
  { id: 'ig', title: 'Instagram', cols: [[{ id: 'tech', head: 'Common Search Technique', items: [
    T, "Utilizing Message Feature (To expand name search)", "Searching for IG of identified relative's or close friends",
    { note: 'Tip:', text: "Once relatives' IG are found, check their followers/followings list, tagged section, posts, and their Threads accounts (if they have one)" },
    WORK, IDC
  ] }]] },
  { id: 'x', title: 'X (Twitter)', cols: [[{ id: 'tech', head: 'Common Search Technique', items: [
    T, "Check public Tweet results", "Searching for Twitter of identified relative's or close friends", WORK, IDC
  ] }]] },
  { id: 'mug', title: 'Mugshots', breakAfter: true, cols: [[{ id: 'tech', head: 'Common Search Technique', items: [
    "Name Search + Filtering State & County (Utilize all name combination and aliases)",
    "If we have a visual of the subject, utilize Facesearch",
    "Check other sites where arrest records are accessible (Mugshotzone, Localcrimenews, etc)",
    "Double check Idcrawl & Google may also yield results for arrest records"
  ] }]] },

  { id: 'lk', title: 'LinkedIn', cols: [[{ id: 'tech', head: 'Common Search Technique', items: [
    T, "Utilize filters (Location, School, and Employment)"
  ] }]] },
  { id: 'cl', title: 'Classmates', cols: [[{ id: 'tech', head: 'Common Search Technique', items: [
    "Name search (Name + State)", "Name + School (If information is available)"
  ] }]] },
  { id: 'st', title: 'Strava', cols: [[{ id: 'tech', head: 'Common Search Technique', items: [
    T, "Review posts from the accounts (Some may include satellite view that might show their current residence)"
  ] }]] },
  { id: 'yt', title: 'YouTube', cols: [[{ id: 'tech', head: 'Common Search Technique', items: [
    { t: T, nocheck: true },
    { t: "Check public YT video results (Especially if POI's claim involves major press coverage)", nocheck: true },
    { t: "Look for POI's place of work, school, or other organization they might be associated", nocheck: true }
  ] }]] },
  { id: 'zi', title: 'Zoominfo', cols: [[{ id: 'tech', head: 'Common Search Technique', items: [
    "Name Search (Ideally, use name POI uses in his/her LinkedIn profile)",
    "Utilize Google (Name + \"Zoominfo\"; or, Name + Nature of work from LinkedIn)"
  ] }]] },
  { id: 'gg', title: 'Google', cols: [[{ id: 'tech', head: 'Common Search Technique', items: [
    T, "Look for Trellis/Unicourt", "Utilize all information gathered from the identified account",
    "If client gave specifics of incident (location of incident, people involved, etc), make sure to include in search",
    "Search for POI's address, email, phone", "Utilize Bing and DuckDuckGo (Use the same techniques above)"
  ] }]] }
];

// Checklist: [name, url]. A name with no url becomes a Google search for that name (marked with a dotted underline).
// Replace those with the exact hyperlink from the sheet's Check List tab.
export const CHECKLIST = [
  { col: 1, title: '1. PSE', sites: [
    ['411', 'https://www.411.com'], ['Inforver'], ['Radaris', 'https://radaris.com'], ['Whitepages', 'https://www.whitepages.com'],
    ['Spokeo', 'https://www.spokeo.com'], ['Floridaresidents'], ['Californiabirthindex', 'https://www.californiabirthindex.org'],
    ['Ohioresidentdatabase', 'https://ohioresidentdatabase.com'], ['Clustrmaps', 'https://clustrmaps.com'], ['Dataveria', 'https://dataveria.com'],
    ['Mylife', 'https://www.mylife.com'], ['Truepeoplesearch', 'https://www.truepeoplesearch.com'], ['Searchpeoplefree', 'https://www.searchpeoplefree.com'],
    ['Fastpeoplesearch', 'https://www.fastpeoplesearch.com'], ['Usphonebook', 'https://www.usphonebook.com'] ] },
  { col: 1, title: '2. Top Socmed', sites: [
    ['Facebook', 'https://www.facebook.com'], ['Linkedin', 'https://www.linkedin.com'], ['Google', 'https://www.google.com'], ['Bing', 'https://www.bing.com'],
    ['Signalhire', 'https://www.signalhire.com'], ['Rocketreach', 'https://rocketreach.co'], ['Classmates', 'https://www.classmates.com'] ] },
  { col: 1, title: '3. Main Socmed', sites: [
    ['Instagram', 'https://www.instagram.com'], ['Threads', 'https://www.threads.com'], ['Twitter', 'https://x.com'], ['Youtube', 'https://www.youtube.com'],
    ['Tiktok', 'https://www.tiktok.com'], ['Pinterest', 'https://www.pinterest.com'], ['Strava', 'https://www.strava.com'], ['Foursquare', 'https://foursquare.com'],
    ['Tumblr', 'https://www.tumblr.com'] ] },
  { col: 2, title: '4. Sub Socmed', sites: [
    ['GoFundme', 'https://www.gofundme.com'], ['Poshmark', 'https://poshmark.com'], ['Soundcloud', 'https://soundcloud.com'], ['Myspace', 'https://myspace.com'],
    ['Reddit', 'https://www.reddit.com'], ['Quora', 'https://www.quora.com'], ['Ebay', 'https://www.ebay.com'], ['Etsy', 'https://www.etsy.com'],
    ['Tripadvisor', 'https://www.tripadvisor.com'], ['Flicker', 'https://www.flickr.com'], ['Zoominfo', 'https://www.zoominfo.com'], ['Vsco', 'https://vsco.co'],
    ['Medium', 'https://medium.com'], ['Vimeo', 'https://vimeo.com'], ['Yelp', 'https://www.yelp.com'], ['Amazon', 'https://www.amazon.com'],
    ['SnapChat', 'https://www.snapchat.com'], ['Bluesky', 'https://bsky.app'], ['Truthsocial', 'https://truthsocial.com'], ['Trellis', 'https://trellis.law'],
    ['Google', 'https://www.google.com'], ['Facecheck', 'https://facecheck.id'], ['Idcrawl', 'https://www.idcrawl.com'], ['Whatsmyname', 'https://whatsmyname.app'] ] },
  { col: 3, title: '5. Criminal Records', sites: [
    ['Mugshot', 'https://mugshots.com'], ['LocalCrimeNews', 'https://www.localcrimenews.com'], ['Recently Booked', 'https://recentlybooked.com'], ['Facesearch'],
    ['Arrest', 'https://arrests.org'], ['Mugshotsearch'], ['MugshotZone', 'https://mugshots.zone'], ['Rain Street', 'https://rain-street.org'],
    ['Allinmates', 'https://allinmates.com'], ['Tbcrimes'] ] },
  { col: 3, title: '6. Adult Streaming', sites: [
    ['Only Fans', 'https://onlyfans.com'], ['Fansly', 'https://fansly.com'], ['OnlySearch'], ['Subseeker'] ] }
];
