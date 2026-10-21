// Auswahloptionen für den Tageseintrag.

export const FLOW = [
  { id: 'spotting', label: 'Schmier', drops: 0 },
  { id: 'light', label: 'Leicht', drops: 1 },
  { id: 'medium', label: 'Mittel', drops: 2 },
  { id: 'heavy', label: 'Stark', drops: 3 },
];

export const SYMPTOMS = [
  { id: 'kraempfe', label: 'Krämpfe', emoji: '🌀' },
  { id: 'kopfschmerzen', label: 'Kopfschmerzen', emoji: '🤕' },
  { id: 'rueckenschmerzen', label: 'Rücken', emoji: '🦴' },
  { id: 'blaehbauch', label: 'Blähbauch', emoji: '🎈' },
  { id: 'brustspannen', label: 'Brustspannen', emoji: '🍒' },
  { id: 'uebelkeit', label: 'Übelkeit', emoji: '🥴' },
  { id: 'verdauung', label: 'Verdauung', emoji: '🌪️' },
  { id: 'muedigkeit', label: 'Müdigkeit', emoji: '😴' },
  { id: 'schlafprobleme', label: 'Schlecht geschlafen', emoji: '🌘' },
  { id: 'heisshunger', label: 'Heißhunger', emoji: '🍫' },
  { id: 'unreine_haut', label: 'Unreine Haut', emoji: '🫧' },
  { id: 'schwindel', label: 'Schwindel', emoji: '💫' },
];

export const MOODS = [
  { id: 'gluecklich', label: 'Glücklich', emoji: '😊' },
  { id: 'ruhig', label: 'Ruhig', emoji: '😌' },
  { id: 'energisch', label: 'Voller Energie', emoji: '⚡' },
  { id: 'verliebt', label: 'Verliebt', emoji: '🥰' },
  { id: 'sensibel', label: 'Sensibel', emoji: '🥺' },
  { id: 'gereizt', label: 'Gereizt', emoji: '😤' },
  { id: 'traurig', label: 'Traurig', emoji: '😢' },
  { id: 'aengstlich', label: 'Ängstlich', emoji: '😟' },
  { id: 'gestresst', label: 'Gestresst', emoji: '🤯' },
];

export const LEVELS = {
  energy: ['sehr wenig', 'wenig', 'okay', 'gut', 'super'],
  sleep: ['sehr schlecht', 'schlecht', 'okay', 'gut', 'super'],
  body: ['unwohl', 'eher unwohl', 'okay', 'wohl', 'richtig gut'],
};

export const ACTIVITIES = [
  { id: 'ruhetag', label: 'Ruhetag', emoji: '🛋️' },
  { id: 'spaziergang', label: 'Spaziergang', emoji: '🚶' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘' },
  { id: 'dehnen', label: 'Dehnen', emoji: '🤸' },
  { id: 'pilates', label: 'Pilates', emoji: '🪢' },
  { id: 'krafttraining', label: 'Krafttraining', emoji: '🏋️' },
  { id: 'laufen', label: 'Laufen', emoji: '🏃' },
  { id: 'radfahren', label: 'Radfahren', emoji: '🚴' },
  { id: 'schwimmen', label: 'Schwimmen', emoji: '🏊' },
  { id: 'tanzen', label: 'Tanzen', emoji: '💃' },
  { id: 'teamsport', label: 'Teamsport', emoji: '🏐' },
  { id: 'sonstiges', label: 'Sonstiges', emoji: '✨' },
];

export const DURATIONS = [
  { id: 15, label: '~15 Min' },
  { id: 30, label: '~30 Min' },
  { id: 60, label: '~1 Std' },
  { id: 90, label: '1,5 Std+' },
];

export const INTENSITIES = ['leicht', 'mittel', 'intensiv'];

export const PHASE_INFO = {
  menstruation: {
    text: 'Die Gebärmutterschleimhaut wird abgestoßen. Östrogen und Progesteron sind niedrig. Viele fühlen sich jetzt müder, und Krämpfe sind häufig.',
  },
  follikel: {
    text: 'Östrogen steigt langsam an, ein neues Eibläschen reift heran. Viele erleben jetzt mehr Energie, aber das ist sehr individuell.',
  },
  ovulation: {
    text: 'Rund um den Eisprung ist Östrogen am höchsten. Das fruchtbare Fenster ist nur geschätzt. Bitte nicht als Verhütung nutzen.',
  },
  luteal: {
    text: 'Progesteron steigt. In den Tagen vor der Periode können PMS-Beschwerden wie Blähbauch, Brustspannen oder Stimmungsschwankungen auftreten.',
  },
};

export const label = (list, id) => list.find((x) => x.id === id);
