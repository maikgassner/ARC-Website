// Copied from the app (ARC/app/privacy.tsx and ARC/app/terms.tsx) — the
// app and the website must say the same thing. Change both together.
export type LegalSection = { heading: string; paragraphs?: string[]; bullets?: string[]; after?: string[] };

export const UPDATED = 'Draft · 9 October 2026';

export const PRIVACY: LegalSection[] = [
  {
    heading: 'Who we are',
    paragraphs: [
      'Arc is a logbook and social app for skydivers, operated by [operator name and address]. For anything about your data, write to [privacy email].',
    ],
  },
  {
    heading: 'What we store and why',
    bullets: [
      'Account: your email address and password (stored hashed), or your Apple / Google sign-in.',
      'Profile: name, legal name, photo, weight, home dropzone, jump and tunnel totals, skill self-assessment, social links and app settings.',
      'Logbook: your jumps and tunnel sessions, including signatures (the signer\'s name, role and licence number) and pages you import by scan or file.',
      'Documents: licence, ratings, AAD, reserve repacks and insurance details, including the photos and PDFs you add.',
      'Emergency & medical: your emergency contact, and — only with your explicit consent — blood type, allergies, medication and conditions.',
      'Social: friends, posts, comments, likes, chat messages, events, reviews, and dropzone / tunnel suggestions and photos.',
      'Reports and feedback: reports you send about people or content, bug reports (with screenshots) and feedback.',
      'Technical: your device\'s push token and platform, and a daily counter of document scans.',
    ],
    after: [
      'We use this to run Arc for you: your logbook and documents, your profile, friends and chats. We don\'t sell your data and don\'t use it for advertising.',
      'Location: Arc uses your phone\'s location on the device to centre the map and find nearby dropzones. It isn\'t sent to or stored on our servers.',
    ],
  },
  {
    heading: 'Health data',
    paragraphs: [
      'Blood type, allergies, medication and conditions are health data. Arc only stores them after you agree, and you choose whether your friends can see them — so a friend at the DZ can help in an emergency. You can change that choice or withdraw your consent anytime in Emergency & medical; your medical info is then deleted.',
    ],
  },
  {
    heading: 'Who can see what',
    bullets: [
      'Anyone signed in to Arc: your name, photo, home dropzone and jump totals (e.g. in search, friend suggestions and on your profile), reviews you write and events you make public.',
      'Your friends: your full profile including your email address, your logbook and tunnel log, posts, skill ratings and emergency contact — and your medical info if you chose to share it.',
      'Only you: your documents and insurance, personal details, scans, and medical info you didn\'t share.',
      'Chats: the people in the chat. Messages are encrypted in transit but not end-to-end — we and our hosting provider could technically access them. We only look at them to handle a report or when the law requires it. Message previews can appear on your lock screen.',
      'Us (moderation): reports, and dropzone / tunnel suggestions and photos before they\'re published. These are also sent to our private moderation workspace on Slack.',
      'Photos in posts and events are stored at long, unguessable web addresses; anyone who has such a link can open the photo.',
    ],
  },
  {
    heading: 'Service providers',
    paragraphs: ['We use these providers to run Arc. They process data only for us:'],
    bullets: [
      'Supabase — database, sign-in, file storage and server functions. Servers in Zurich, Switzerland.',
      'Anthropic (Claude) — reads the logbook pages and documents you scan to fill in the fields. The images are sent only when you scan. USA.',
      'Expo — delivers push notifications: your push token and the notification\'s title and text (including message previews). USA.',
      'Apple and Google — push delivery to your phone, and sign-in if you choose it.',
      'Open-Meteo — weather forecasts for dropzones. Your phone requests them directly, so Open-Meteo sees your IP address and the dropzone\'s location.',
      'Slack — our moderation notifications (reports, suggestions, bug reports).',
    ],
    after: [
      'Links to websites, maps, meteoblue and webcams open or load content from those third parties under their own privacy terms. Where data goes outside Switzerland / the EU, we rely on standard contractual clauses or an adequacy decision.',
    ],
  },
  {
    heading: 'Legal basis',
    paragraphs: [
      'We process your data to provide the service you signed up for (contract), with your consent for health data and push notifications, and based on our legitimate interest in keeping Arc safe (moderation, preventing abuse and spam). You can withdraw a consent anytime; this doesn\'t affect what happened before.',
    ],
  },
  {
    heading: 'How long we keep it',
    paragraphs: [
      'As long as you have an account. Settings → Delete account removes your account and everything in it — profile, logbook, documents, files, posts, chats — right away. Backups are overwritten within [30] days. Before deleting, you can export your logbook as an Excel file and your skydiver profile as a PDF.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'You can access, correct, export and delete your data, withdraw consent, object to processing, and complain to a data protection authority — in Switzerland the FDPIC, in the EU the authority of your country (e.g. the Austrian DSB). Most of this you can do in the app; for anything else write to [privacy email].',
    ],
  },
  {
    heading: 'Age',
    paragraphs: ['Arc is for people who are old enough to skydive and at least [16] years old.'],
  },
  {
    heading: 'Changes',
    paragraphs: ['If we change this policy in a way that matters, we\'ll tell you in the app before it applies.'],
  },
];

export const TERMS: LegalSection[] = [
  {
    heading: 'Scope of the service',
    paragraphs: [
      'Arc is a digital logbook, skills profile and social network for skydivers. Arc is not a dropzone, aircraft operator, instructor, rigger, or AAD/equipment manufacturer, and plays no role in planning, supervising or conducting any skydive. Nothing in the app — including jump counts, licence class, self-assessed skill ratings, gear records, weather or dropzone information — is a certification, training sign-off or safety assessment. You remain solely responsible for your own currency, training, equipment and fitness to jump, as determined by your dropzone and licensing body, not by Arc.',
    ],
  },
  {
    heading: 'Assumption of risk',
    paragraphs: [
      'Skydiving is inherently dangerous and can result in serious injury or death, regardless of experience, equipment, or how accurately your Arc profile is kept. This risk exists independently of Arc. Arc provides record-keeping and social features only; it does not supervise, approve or guarantee the safety of any jump you log or plan through the app.',
    ],
  },
  {
    heading: 'Accuracy of data',
    paragraphs: [
      'Much of Arc is based on what users enter — jump totals, licences, skill self-assessments, documents, and dropzone and tunnel details suggested by the community. Arc does not verify these against the issuing body, and weather data comes from third-party forecasts. Keep your own information accurate and current; when you rely on someone else\'s information or on a forecast, you do so at your own judgment.',
    ],
  },
  {
    heading: 'Signatures',
    paragraphs: [
      'A signature in Arc records that the signer confirmed your jump. Only sign jumps you actually witnessed or supervised, and only ask people who did. Changing a signed jump\'s details removes the signature.',
    ],
  },
  {
    heading: 'Community rules',
    paragraphs: ['Arc has no tolerance for objectionable content or abusive users. Don\'t post or send:'],
    bullets: [
      'harassment, threats, hate speech or discrimination',
      'sexual or violent content, or anything illegal',
      'spam, scams or impersonation of another jumper',
      'other people\'s private information without their consent',
      'false safety-relevant claims, such as a fabricated licence, jump count or signature',
    ],
    after: [
      'You can report a person, post or comment and block anyone from their profile. We review reports within 24 hours, remove content that breaks these rules and can suspend or close the accounts involved.',
    ],
  },
  {
    heading: 'Accounts',
    paragraphs: [
      'You need to be old enough to hold the skydiving licence or training status your profile claims, and at least [16] years old. One account per person; don\'t share your login. You can delete your account at any time in Settings — this deletes your data (see the Privacy Policy).',
    ],
  },
  {
    heading: 'Your content',
    paragraphs: [
      'You keep the rights to what you post. You allow Arc to store and show it to the people it\'s meant for (for example your friends) for as long as it\'s on Arc. Dropzone and tunnel suggestions and photos you submit may be published on the dropzone or tunnel page for everyone.',
    ],
  },
  {
    heading: 'Limitation of liability',
    paragraphs: [
      'To the maximum extent permitted by law, Arc is provided "as is", without warranty that any record, suggestion, forecast or status shown in the app is accurate, current or complete. Arc and its operators are not liable for injury, death or property loss arising from skydiving itself, from reliance on user-entered data or forecasts, or from downtime or data loss — except where liability cannot be excluded by law. You are responsible for claims arising from your own false or misleading entries, such as a fabricated licence or jump count presented as genuine to another user.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: ['If we change these terms in a way that matters, we\'ll tell you in the app before it applies.'],
  },
  {
    heading: 'Governing law',
    paragraphs: ['[To be set once Arc\'s operating entity and country are confirmed with counsel.]'],
  },
];
