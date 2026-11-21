// English copy. Source of truth: docs/07_CONTENT_AND_COPY.md. Facts: docs/02_PROJECT_BRIEF.md §6.
// Numbers that need locale formatting are stored as numbers and formatted by src/i18n/format.js.
export default {
  meta: {
    title: 'HOMYVEST: Turn idle land into income',
    description:
      'Have empty land or an unfinished building? See what it can hold and earn, then let HomyEight build it and Behomy run it.',
    ogAlt: 'HOMYVEST wordmark over a lit-up property at dusk',
  },
  // The portfolio page's own title and description (U01_06 §8).
  pfMeta: {
    title: 'Portfolio: HOMYVEST',
    description:
      'See how HomyEight builds and Behomy runs: a building assembling, a walk through Maxone, a padel hall rising, and more.',
    ogAlt: 'HOMYVEST wordmark over a lit-up property at dusk',
  },
  nav: {
    label: 'Main',
    how: 'How it works',
    behomy: 'Behomy',
    projects: 'Projects',
    calculator: 'Land check',
    faq: 'FAQ',
    portfolio: 'Portfolio',
    home: 'Home',
    menu: 'Menu',
    close: 'Close',
    lang: 'Language',
    skipToContent: 'Skip to content',
    sections: 'Page sections',
  },
  theme: { label: 'Theme', light: 'Light', dark: 'Dark', auto: 'Auto' },
  wa: {
    header: 'WhatsApp',
    hero: 'Chat on WhatsApp',
    calc: 'Send my results on WhatsApp',
    next: 'Chat with us on WhatsApp',
    floating: 'Chat on WhatsApp',
    newTab: 'opens WhatsApp in a new tab',
  },
  wordmark: { aria: 'HOMYVEST — Homy Investasi, home' },

  // hero.partner … hero.chip: the main page's hero (U01_06 §1). hero.b1 … hero.b5: the 3D story on /portofolio/.
  hero: {
    partner: 'In partnership with',
    title1: 'Turn idle land into steady income.',
    title2: 'Built by HomyEight, operated by Behomy.',
    body: "Have an empty plot or an unfinished building? Leave your number and we'll show you what it could become.",
    chip: '82% average occupancy across Behomy properties',
    scrollCue: 'Scroll',
    skip: 'Skip intro',
    b1: {
      title: 'Your land is waiting.',
      body: 'An empty plot or an unfinished building costs you every month it sits still. It could be earning instead.',
    },
    b2: {
      title: 'First, we build it right.',
      body: 'Designed and built by HomyEight, our construction and interior partner.',
    },
    b3: {
      title: "It doesn't have to be a guesthouse.",
      body: 'A stay, an office, a café, a sports court. We study your land and find what suits it best.',
      labels: ['Hybrid stay', 'Office', 'Café', 'Sports court'],
    },
    b4: {
      title: 'Then we bring it to life.',
      body: 'The Behomy Group runs it every day: guests, marketing, maintenance and your monthly report.',
    },
    b5: {
      title: 'From idle to earning.',
      stat1: { n: 82, suffix: '%', label: 'average occupancy across Behomy properties', note: 1 },
      stat2: { n: 3000, suffix: '+', label: 'rooms under management' },
      cta1: 'See what your land can do',
      cta2: 'Chat on WhatsApp',
    },
    sceneAlt:
      'Animated model: an empty plot beside a road becomes a hybrid stay, then neighbouring plots become an office, a café and a sports court, and the street comes to life.',
    posterAlt: [
      'White clay model of an empty plot with tall grass beside a road.',
      'White clay model of a four-storey hybrid stay with its top floor open, showing the rooms.',
      'White clay models of an office, a café and a padel court on neighbouring plots.',
      'Four white clay buildings on a street with warm windows, people and cars.',
    ],
  },

  consult: {
    label: 'Free consultation with the HomyEight team',
    number: '+62 821-1010-6088',
  },

  // The lead funnel (U01_02, U01_06 §2). Chip and radio labels come from OPTION_LABELS in src/lib/leads/leads.ts.
  funnel: {
    phone: {
      label: 'Enter your phone number so we can contact you',
      placeholder: '812 3456 7890',
      continue: 'Continue',
      privacy: "We'll only use it to talk to you about your property.",
      error: 'Please enter a valid Indonesian mobile number, for example 0812 3456 7890.',
      done: "Thanks, we'll be in touch at {phone}.",
    },
    panel: {
      poweredBy: 'Powered by',
      step: 'Step {n} of 3',
      close: 'Close',
      recap: "We'll contact you at {phone}",
      change: 'Change',
      back: 'Back',
      continue: 'Continue',
      send: 'Send',
      sending: 'Sending…',
      chat: 'Prefer to chat? WhatsApp us',
    },
    funding: {
      title: 'What is your funding source for building or renovating your property?',
      help: 'Choose the option that fits best.',
    },
    build: { title: 'Tell us about your property' },
    f: {
      name: { label: "What's your name?", help: "So we know who we're talking to." },
      owned: { label: 'What property or land do you own now?', help: 'Choose all that apply.' },
      build: { label: 'What would you like to build?', help: 'Choose all that apply. "Not sure yet" is a fine answer.' },
      city: { label: 'Where is the property?', help: 'Choose all that apply.' },
      need: { label: 'Which of these fits you best?' },
      otherPlaceholder: 'Tell us briefly',
    },
    needs: {
      title: "No construction budget yet? That's okay.",
      body: 'Plenty of owners start here. Behomy and HomyEight also help with properties that are already standing, from renting them out and running them day to day to filling more rooms. We can also check what a well-located property could become before you spend anything.',
    },
    consent:
      'By sending this, you agree that the HOMYVEST, HomyEight and Behomy team may contact you about your property.',
    err: {
      required: 'Please fill this in.',
      chooseOne: 'Please choose at least one.',
      chooseSingle: 'Please choose one.',
      tooLong: "That's a little long. Please shorten it.",
      summary: 'Please check the highlighted fields.',
    },
    thanks: {
      title: "Thank you, {firstName}. We've got your details.",
      body: 'The HomyEight team will reach out on WhatsApp at {phone} during working hours. Want to talk sooner? Message us now.',
      whatsapp: 'Chat on WhatsApp now',
      calc: 'Try the land check',
      portfolio: 'See our full portfolio',
    },
    handoff: {
      title: 'Almost there: send your details on WhatsApp',
      body: 'Your answers are already written into the message. Just press send.',
      button: 'Send on WhatsApp',
    },
    error: {
      title: "We couldn't send your details just now",
      body: 'Send them on WhatsApp instead; your answers are already filled in. Or try again in a moment.',
      retry: 'Try again',
    },
    rate: {
      body: "You've already sent this a few times. We'll be in touch soon, or message us on WhatsApp.",
    },
  },

  about: {
    title: 'What is HOMYVEST?',
    body: 'HOMYVEST helps owners of idle land and unfinished buildings turn them into properties that earn. We look at what your land is allowed to hold and what would work best there, from a hybrid stay to an office or a sports court. Then HomyEight builds it and Behomy runs it, so you deal with one team from start to finish.',
    note: "We're not a developer and we don't sell property. We work on yours.",
  },

  // End-to-end (U01_06 §4): the old "three names, one team" idea, told as four steps.
  how: {
    eyebrow: 'How it works',
    title: 'From the first sketch to full rooms, we take care of it.',
    sub: 'You keep one contact. Behind it, three teams do the work.',
    steps: [
      {
        name: 'Plan.',
        body: 'We study your land, the local rules and the demand nearby, and work out what will earn best.',
        by: "HOMYVEST, with Behomy's feasibility data",
      },
      {
        name: 'Design.',
        body: 'HomyEight turns the plan into drawings and a clear cost estimate, free of charge.',
        by: 'HomyEight',
      },
      {
        name: 'Build.',
        body: 'HomyEight builds it, from the structure to the interiors and furniture from its own workshop.',
        by: 'HomyEight',
      },
      {
        name: 'Operate.',
        body: 'Behomy opens it, fills it and runs it every day. You follow it all on a live owner dashboard.',
        by: 'Behomy',
      },
    ],
    closing:
      'HOMYVEST finds the potential, HomyEight builds it, and Behomy keeps it running. You only need to save one number.',
  },

  // homyeight.walk: the Maxone walkthrough on /portofolio/.
  homyeight: {
    walk: {
      title: 'Step inside one of our projects.',
      hint: 'Scroll to walk through',
      skip: 'Skip walkthrough',
      stops: [
        'Arrival',
        'The welcome',
        'The dining hall',
        'The buffet and bar',
        'Look up',
        'By the windows',
        'The whole floor',
      ],
      mapLabel: 'Floor plan, your position',
      goTo: 'Go to stop {n}: {name}',
      sceneAlt:
        'Walkthrough of a hotel lobby and dining room: from the street entrance past the reception, through the dining hall to the buffet and bar, up into the double-height void, to the windows, then up to a view of the whole floor.',
    },
  },

  behomy: {
    // The full-bleed opener of the Behomy section (U01_06 §5)
    hero: {
      eyebrow: 'Operated by Behomy',
      title: 'Building it is half the story. Behomy keeps it full.',
      body: "Indonesia's hybrid stay pioneer runs 3,000+ rooms across 100+ locations, mixing nightly guests with monthly tenants so rooms keep earning.",
      more: 'See how it works',
    },
    title: 'Daily guests and monthly tenants. One building, full all year.',
    body: 'Behomy is a hybrid stay operator. It mixes hotel-style daily stays with monthly kost living under one roof, so rooms keep earning in busy months and quiet ones.',
    hybrid: {
      daily: 'Daily stays',
      monthly: 'Monthly stays',
      caption: 'Daily guests in busy months, monthly tenants in quiet ones. The rooms keep earning.',
      illustration: 'Illustration',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      alt: 'Diagram of one building through a year. In busy months more rooms take daily guests; in quiet months more rooms take monthly tenants. The building stays occupied throughout.',
    },
    stats: [
      { n: 82, suffix: '%', label: 'average occupancy', note: 1 },
      { n: 65.4, digits: 1, suffix: '%', label: 'average gross operating profit margin', note: 2 },
      { text: '< 3.5', suffix: ' yrs', label: 'estimated break-even on Behomy equity partnership projects', note: 4 },
      { n: 3000, suffix: '+', label: 'rooms under management' },
      { n: 100, suffix: '+', label: 'locations in 18 areas' },
    ],
    handles: {
      title: 'What Behomy takes off your hands',
      items: [
        { title: 'Set-up and staff.', body: 'Permits, furnishing, hiring and training hospitality staff.' },
        {
          title: 'Getting guests.',
          body: 'Page-one local search, an official hotel-chain tag on Agoda, Traveloka, tiket.com and Trip.com, and a network of 500+ creators.',
        },
        {
          title: 'Care and repairs.',
          body: "Beefix, Behomy's own maintenance team, handles repairs, air conditioning, plumbing and deep cleaning.",
        },
        {
          title: 'Clear reporting.',
          body: 'A real-time owner dashboard for occupancy and finances, and 24-hour guest support.',
        },
      ],
    },
    brands: ['Behomy Residence', 'Corvel', 'Purnava Village', 'Hoteru'],
    brandsLabel: 'Brands run by Behomy',
    uplift: "Behomy's hybrid model can earn up to 2.5× a conventional kost. Results vary by property.",
    upliftNote: 3,
    // Places Behomy runs today (U01_01 §2.4)
    portfolio: {
      title: 'Places Behomy runs today',
      team: 'The Behomy team',
      training: 'Front office and housekeeping training',
    },
    // Before and after pairs
    ba: {
      title: 'From idle to running',
      sub: 'Real buildings, before and after Behomy and HomyEight took them on.',
      before: 'Before',
      after: 'After',
      label: 'Before and after pairs',
      pair: 'Pair {n} of {total}',
    },
    bridge: "Here are some of the places we've built and run.",
  },

  projects: {
    eyebrow: 'Projects',
    title: "Places we've built and run.",
    body: 'Kost, guesthouses, homestays and villas.',
    viewer: { label: 'Project image viewer', close: 'Close', prev: 'Previous', next: 'Next', open: 'Open image' },
    caption: { name: 'Project Name', place: 'City, Province', type: 'Type · Year' },
    bridge: 'Not every plot should be a place to stay.',
  },

  beyond: {
    eyebrow: 'Beyond stays',
    title: 'Some land earns more as something else.',
    body: "A sports hall, a café, an office. If that suits your land and your area better, that's what we'll suggest.",
    padel: {
      stages: [
        'Ground floor: the courts, a café and changing rooms.',
        'Upper floor: a lounge above the café, and the structure rises.',
        'Finished: one hall, ready to book.',
      ],
      tag: 'Padel hall · Design by HomyEight',
      skip: 'Skip the padel hall',
      sceneAlt:
        'Animated model of a padel hall assembling in three stages: the ground floor with its courts, the upper floor and structure, then the finished hall with its vaulted roof.',
    },
    ways: {
      label: 'Three more ways to earn',
      soccer: {
        title: 'Mini soccer',
        body: 'An open plot can become a busy weekend venue, with a café and stands beside the pitch.',
      },
      cafe: {
        title: 'Café',
        body: 'A corner on a busy street can earn more serving coffee than housing tenants.',
      },
      office: { title: 'Office', body: 'Close to business districts, flexible offices fill quickly.' },
      open: 'Open {name} images',
    },
  },

  // The full portfolio page, /portofolio/ (U01_06 §8)
  pf: {
    eyebrow: 'Portfolio',
    title: 'Our full portfolio',
    intro: 'Three projects, told in motion. Take your time: scroll slowly and each one builds itself in front of you.',
    begin: 'Scroll to begin',
    index: ['The story', 'Step inside Maxone', 'The padel hall', 'Beyond stays'],
    indexLabel: 'On this page',
    skipStory: 'Skip the story',
    skipPadel: 'Skip padel hall',
    close: {
      title: "Like what you see? Let's look at your land.",
      back: '← Back to home',
    },
  },

  calc: {
    eyebrow: 'Land check',
    title: 'What can your land become?',
    body: "Enter your land's size and local building rules. You'll see how much you're allowed to build, what different uses could cost and earn, and what to plan for.",
    note: 'Takes about a minute. Nothing is sent anywhere unless you choose to share it.',
    stepsLabel: 'Land check steps',
    tabs: ['Your land', 'Ideas for your land', 'Already built? Add a floor'],
    tabsShort: ['Your land', 'Ideas', 'Add a floor'],
    example: 'Example',
    reset: 'Reset to example values',
    how: 'How this is calculated',
    resultsLabel: 'Results',
    f: {
      P: { label: 'Front width', unit: 'm', help: 'The side facing the road.' },
      L: { label: 'Depth', unit: 'm', help: 'From the road to the back of the land.' },
      kdb: { label: 'KDB', unit: '%', help: 'Building coverage: how much of the land a building may cover.' },
      klb: {
        label: 'KLB',
        unit: '×',
        help: 'Floor area ratio: total floor area of all floors, as a multiple of the land area.',
      },
      kdh: { label: 'KDH', unit: '%', help: 'Green area: how much of the land must stay green or open soil.' },
      maxFloors: {
        label: 'Max floors (optional)',
        unit: '',
        help: "Some areas also limit building height. Leave empty if there's no limit.",
      },
      fp: { label: 'Building footprint', unit: 'm²', help: 'The ground area the building covers.' },
      tfa: {
        label: 'Total floor area, all floors',
        unit: 'm²',
        help: 'Add up every floor, including unfinished ones.',
      },
      green: { label: 'Green area', unit: 'm²', help: 'Garden or open soil.' },
      occ: {
        label: 'Expected occupancy',
        unit: '%',
        help: 'On average, how full you expect it to be. Applies to every idea.',
      },
    },
    presets: {
      title: "Don't know your rules yet? Try an example:",
      template: 'Typical example',
      resid: 'Quiet housing area',
      comm: 'Busy commercial road',
      note: 'Examples only. Your real limits are in your KRK or PKKPR from the local government.',
    },
    r: {
      headline: 'Your land can hold up to {floorArea} of building.',
      floors: {
        label: 'Floors',
        none: 'None allowed',
        single: '1 floor of {partial}',
        fullOne: '1 floor',
        fullMany: '{full} floors',
        plusPartial: '+ a smaller top floor of {partial}',
        capped: 'Limited by the max-floors rule.',
      },
      cover: { label: 'Building may cover', value: '{fp} ({pct} of the land)' },
      area: { label: 'Land area' },
      green: { label: 'Must stay green' },
      parking: {
        label: 'Room for parking',
        value: 'About {cars} cars',
        detail: '{open} open, rough estimate',
        tight: 'Very tight',
      },
    },
    legend: { building: 'Building', green: 'Green', open: 'Open (driveway, parking, service)', title: 'Land split' },
    w: {
      conflict:
        'Your KDB and KDH add up to more than 100%, so the building area was reduced to {fp} to leave room for green. Please double-check these numbers.',
      klbLow:
        "Your KLB is lower than your KDB, so even a single floor can't use the full footprint. The total floor area ({floorArea}) is the limit that counts.",
      empty: 'Enter the front width and depth of your land to begin.',
    },
    next: {
      ideas: 'Next: see what this space could earn',
      addFloor: 'Already built? See if a floor fits',
    },
    view: { reset: 'Reset view', hint: 'Drag to rotate, scroll or pinch to zoom' },
    s2: {
      title: 'Four ways this land could earn',
      body: 'Each idea uses the space allowed in step 1. Rents and costs are examples, so replace them with prices from your area.',
      landChip: 'Your land',
      edit: 'Edit',
      ideasLabel: 'Ideas for your land',
      names: { kos: 'Kos-kosan', ruko: 'Ruko', rumah: 'Rental houses', gudang: 'Warehouse' },
      adjust: 'Adjust prices',
      p: {
        kosSize: {
          label: 'Room size',
          unit: 'm²',
          help: 'Per room, including the bathroom and a share of corridors and stairs.',
        },
        kosRent: { label: 'Rent per room / month' },
        rukoWidth: { label: 'Width of one unit', unit: 'm' },
        rukoRent: { label: 'Rent per unit / year' },
        rumahLand: { label: 'Land per house', unit: 'm²', help: 'Including its yard.' },
        rumahFloor: { label: 'Floor area per house', unit: 'm²' },
        rumahRent: { label: 'Rent per house / month' },
        gudangRent: { label: 'Rent per m² / month' },
        cost: { label: 'Build cost per m²' },
      },
      rows: {
        fits: 'What fits',
        built: 'Floor area to build',
        cost: 'Build cost (approx.)',
        income: 'Rent per year (approx.)',
        yield: 'Yearly return on build cost',
        payback: 'Pays back the build cost in',
        tip: 'Good to know',
      },
      fits: {
        kos: '{n} rooms',
        ruko: '{n} units, {m} each',
        rumah: '{n} houses',
        gudang: '{m}, one floor',
        none: "Doesn't fit",
      },
      tip: {
        kos: 'Many tenants means many motorbikes, so plan the parking.',
        ruko: 'Works best on a busy road.',
        rumah: 'Lower income, but steady and easy to manage.',
        gudang: 'Needs truck access and a wide road. One floor.',
      },
      badge: 'Fastest',
      select: 'Show in 3D',
      showing: 'Showing in 3D',
      sum: {
        noLand: 'Fill in your land in step 1 to compare ideas.',
        noPrices: 'Add rents and build costs to compare ideas.',
        best: '{best} pays back fastest: about {payback} for {cost} of building, earning around {income} a year.',
        second: 'Next is {second}, at about {payback}.',
        cheapest:
          'If you have less to invest, {cheapest} costs the least to build ({cost}) and pays back in about {payback}.',
      },
      caveat:
        "These are gross figures. They leave out running costs, tax, permits (PBG), financing, empty months beyond your occupancy figure, and the value of the land itself. Running costs and day-to-day operations are where most projects succeed or fail, and that's the part HomyEight and Behomy handle with you.",
      hybridNote:
        "Thinking of a stay? These examples use plain monthly kost rent. Behomy's hybrid model mixes daily and monthly guests, so ask us what that could mean for your land.",
    },
    s3: {
      title: 'Already have a building? See if you can add more.',
      body: "Finished or not, enter what's there today. We'll check it against your land's rules and see whether another floor fits.",
      a: {
        broken: 'Not yet. The building already breaks a rule, so that needs fixing first.',
        needFp: "Enter the building's footprint to check.",
        many: 'Yes. You could add up to {extra} more floors of {fp}.',
        one: 'Yes. One more floor of {fp} fits.',
        smaller: 'Only a smaller one: {faRoom} left, less than a full {fp} floor.',
        none: "No. You've used all the floor area the rules allow.",
      },
      g: {
        ok: 'Within the limit',
        over: 'Over the limit',
        limit: 'Limit {v}',
        kdb: {
          name: 'KDB · building coverage',
          ok: 'You can still spread {fpRoom} on the ground.',
          over: '{over} over the limit.',
        },
        klb: { name: 'KLB · floor area ratio', ok: '{faRoom} of floor area left.', over: '{over} over the limit.' },
        kdh: { name: 'KDH · green area', ok: 'Enough green.', short: '{greenShort} more green needed.' },
      },
      leftover: '{leftover} ({pct}) left for driveway, parking and service.',
      leftoverNeg: 'The building plus the green area is larger than the land. Please check your numbers.',
      needLand: 'Fill in your land in step 1 first.',
      floorsCap: 'Showing 40 of {n} floors',
      toIdeas: 'Compare ideas for this land',
    },
    cta: {
      title: 'Want to turn this into a real plan?',
      button: 'Send my results on WhatsApp',
      note: "We'll reply with what we'd check first.",
    },
    howText: [
      'Land area = front width × depth. The building may cover land area × KDB, but never more than what\'s left after the required green area. The total floor area allowed = land area × KLB (or footprint × max floors, if that\'s smaller). Floors = total floor area ÷ footprint, and any remainder becomes a smaller top floor. Open area = land − footprint − green; about half of it is counted as parking at 12.5 m² per car.',
      'Kos-kosan: rooms = total floor area ÷ room size, rounded down. Ruko: units = front width ÷ unit width, rounded down; the units share all the allowed floor area. Rental houses: the smaller of (land ÷ land per house) and (floor area ÷ floor area per house). Warehouse: one floor, as large as the footprint allows. Yearly income = rent × 12 months (ruko rent is already yearly) × occupancy. Build cost = floor area built × cost per m². Payback = build cost ÷ yearly income. Yearly return = yearly income ÷ build cost.',
      'Coverage = footprint ÷ land area (compared with KDB). Floor area ratio = total floor area ÷ land area (compared with KLB). Green = green area ÷ land area (compared with KDH). Extra floors = remaining allowed floor area ÷ footprint, rounded down. A new floor is assumed to be the same size as the current footprint.',
    ],
    disclaimer:
      'The rules, rents and costs shown are examples for illustration. Your real KDB, KLB, KDH and height limits come from your local government (KRK/PKKPR). Income figures are rough gross estimates, not a promise or an official approval. Confirm with the local government, a licensed planner and local agents before you decide.',
    scene: {
      label: '3D model of your land',
      width: 'Front {v}',
      depth: 'Depth {v}',
      road: 'Road',
      ghost: 'Could be added',
      existing: 'Existing',
      fallbackTitle: 'Plan and floor stack',
      alt: {
        land: '3D view: {P} by {L} metre land.',
        max: 'Building footprint {fp}, {floors}, total {floorArea}.',
        green: 'Green area {green}. Room for about {cars} cars.',
        idea: 'Showing {name}: {fits}, {built} of floor area.',
        existing: 'Existing building: footprint {fp}, total floor area {tfa}. {answer}',
        empty: '3D view: enter your land to see it here.',
      },
    },
    short: { million: 'million', billion: 'billion', trillion: 'trillion' },
  },

  next: {
    eyebrow: 'What happens next',
    title: 'From a chat to a running property.',
    steps: [
      {
        title: 'Chat with us.',
        body: 'Tell us about your land or building on WhatsApp. Your calculator results come along, so we start from your numbers.',
        who: 'HOMYVEST',
      },
      {
        title: 'Site survey and feasibility.',
        body: "We visit, check the rules and the area, and use Behomy's feasibility data to see what really works there.",
        who: 'HOMYVEST · Behomy',
      },
      {
        title: 'Design and cost estimate.',
        body: 'HomyEight prepares the design and a cost estimate, free of charge.',
        who: 'HomyEight',
      },
      { title: 'Build.', body: 'HomyEight builds it, from structure to interior and furniture.', who: 'HomyEight' },
      { title: 'Operate.', body: 'Behomy launches it, fills it and runs it day to day.', who: 'Behomy' },
      {
        title: 'Report.',
        body: 'You follow occupancy and income on a real-time owner dashboard.',
        who: 'Behomy',
      },
    ],
    close: {
      title: 'Ready when you are.',
      body: "Tell us about your land or building. We'll reply with what we'd check first.",
      withResults: 'Your land check results will be included.',
    },
    leaveNumber: 'Leave your number',
    // The big card that leads to /portofolio/ (U01_01 §2.7)
    pf: {
      title: 'See our full portfolio',
      body: 'Watch a building come together, walk through Maxone and see a padel hall rise, piece by piece.',
      list: 'Story · Step inside Maxone · Padel hall · Beyond stays',
    },
  },

  faq: {
    title: 'Questions owners ask us',
    items: [
      {
        q: 'Is HOMYVEST a developer? Do you sell buildings?',
        a: "No. We don't sell buildings or land. HOMYVEST helps owners understand what their land or building could become and what it could earn. When you decide to go ahead, HomyEight builds it and Behomy runs it.",
      },
      {
        q: "I don't have construction funds yet. Should I still get in touch?",
        a: 'Yes. Leave your number and choose "Currently do not have funds for construction". Many owners start by renting out, running or improving a property they already have, and we can check what your land could become before you spend anything.',
      },
      {
        q: 'How accurate is the calculator?',
        a: "It's a first look, not a quote. It uses your inputs and example prices, and shows gross figures before running costs, tax, permits and financing. A site survey and feasibility study give you the real numbers.",
      },
      {
        q: 'Where do I find my KDB, KLB and KDH?',
        a: "They're set by your local government and stated in documents such as the KRK (Keterangan Rencana Kota) or your PKKPR. If you don't have them yet, try an example in the calculator, and we can help you check.",
      },
      {
        q: 'My building is unfinished. Can you continue it?',
        a: 'Often, yes. HomyEight first checks the existing structure on site, then proposes how to continue it and what business it could become.',
      },
      {
        q: 'Does it have to be a guesthouse or kost?',
        a: 'No. Our team has also designed and built offices, cafés and sports venues. We suggest whatever fits your land, location and goals best.',
      },
      {
        q: 'What does the design and cost estimate cost?',
        a: 'Nothing. Design concepts and cost estimates are free.',
      },
      {
        q: "Who runs the property after it's built?",
        a: 'Behomy, our hospitality operating partner: staff, guests, marketing, maintenance and reporting. You follow everything on a real-time owner dashboard.',
      },
      {
        q: 'Which areas do you cover?',
        a: 'Behomy currently runs 100+ locations in 18 areas, including Greater Jakarta, Bandung, Surabaya, Malang, Solo, Yogyakarta, Bandar Lampung and Bali. Somewhere else? Ask us.',
      },
      {
        q: 'How long does it take?',
        a: "It depends on the size of the project and the permits needed. After the site survey, we'll give you a clear timeline.",
      },
      {
        q: "I don't own land, but I'd like to invest. Is that possible?",
        a: "Behomy also offers equity partnerships in hybrid stay projects. Chat with us and we'll connect you.",
      },
      {
        q: 'What happens to the details I send?',
        a: "They're stored securely and used only by the HOMYVEST, HomyEight and Behomy team to contact you about your property. We don't sell or share them.",
      },
    ],
  },

  footer: {
    powered: 'Powered by HomyEight · Operated by Behomy',
    rights: '© {year} HOMYVEST.',
    disclaimer:
      'Calculator figures are examples and rough gross estimates, not a promise or an official approval. Confirm your real limits with your local government (KRK/PKKPR) before you decide.',
    contact: 'WhatsApp',
    settings: 'Display',
  },

  notes: {
    label: 'Notes',
    1: 'Average occupancy across all Behomy-managed properties, Aug 2025–Mar 2026.',
    2: 'Average gross operating profit margin across Behomy-managed properties over 8 months, Aug 2025–Mar 2026.',
    3: "Based on Behomy's 2026 company profile. Results vary by property and location.",
    4: "Behomy's own estimates for its equity partnership projects (10-year terms), from its 2026 company profile. Estimates, not guarantees; results vary by property.",
  },

  glossary: {
    KDB: 'Building coverage ratio: the share of land a building may cover.',
    KLB: 'Floor area ratio: total floor area allowed, as a multiple of land area.',
    KDH: 'Green area ratio: the share of land that must stay green.',
    KRK: 'Local government documents that state the rules for your plot.',
    PBG: 'Building permit (Persetujuan Bangunan Gedung).',
    GOP: 'Gross operating profit: income minus operating costs, before owner-level costs.',
    hybrid: 'One building rented both by the night and by the month.',
  },

  // Alt text: what is in the image. Never a project name.
  alt: {
    'facades/best': 'Corner building at dusk with timber and dark stone cladding, every window lit.',
    'facades/facade-1': 'Five-storey building on a street corner with an orange vertical fin.',
    'facades/facade-2': 'Low-rise residence with orange panels and a white gate, cyclists passing.',
    'facades/benhil-1': 'Seven-storey tower with an orange brick-screen column, seen from the street.',
    'facades/benhil-2': 'The same seven-storey tower seen from the front, between neighbouring houses.',
    'interiors/interior-1': 'Long dining space with concrete walls, a timber table and arched niches.',
    'interiors/interior-2': 'Bedroom with a sage headboard and a desk by a large window.',
    'interiors/interior-3': 'Lobby with a reception counter, a glass-block wall and a timber stair.',
    'interiors/interior-4': 'Bedroom with a sage slatted headboard, a television and a wardrobe.',
    'interiors/interior-5': 'Double-height living room with a chandelier and a glass wall.',
    'interiors/interior-6': 'Lounge and dining table under a timber ceiling.',
    'interiors/interior-7': 'Bedroom with a walk-in wardrobe and a garden view.',
    'interiors/interior-8': 'Kitchen and dining area with concrete walls and a timber table.',
    'maxone/1': 'Hotel reception with a passport-stamp mural, yellow bar stools and red armchairs.',
    'maxone/2': 'Dining hall with navy chairs at round tables, looking toward the buffet.',
    'maxone/3': 'Arched bar shelving above a yellow drawer counter and sage cabinets.',
    'maxone/4': 'Dining floor seen toward the street glazing, with the mezzanine above.',
    'maxone/5': 'Buffet and bar seen from the dining tables.',
    'maxone/6': 'Sage pergola frame over tables beside tall windows.',
    'maxone/7': 'Looking up into a double-height void with hanging plants.',
    'maxone/layout': 'Floor plan of the hotel lobby and dining room.',
    'office/office-1': 'Office with red beams, skylights and long desks.',
    'office/office-2': 'Office with a herringbone floor, wall shelves and plants.',
    'office/office-3': 'Office lounge corner with a round table.',
    'cafe/cafe': 'Café with red tiles, timber tables and hanging plants.',
    'others/athero-1': 'Aerial view of a mini soccer pitch with stands and parking.',
    'others/athero-2': 'Container café and stands beside a mini soccer pitch.',
    'others/athero-3': 'Arena entrance with parked cars and a tall fence around the pitch.',
    'others/athero-4': 'View across a mini soccer pitch with floodlights and nets.',
    'padel-clean/padel-1': 'Cut-away model view of a padel hall ground floor with four courts and a café.',
    'padel-clean/padel-2': 'Cut-away model view of the padel hall with its upper floor, trees and structure.',
    'padel-clean/padel-3': 'Model view of the finished padel hall with its vaulted roof.',
    // Photos from the HomyEight and Behomy 2026 company profiles (U01_07)
    'photos/behomy-hero': "Compact bedroom with a single bed, a navy cushion printed with the beHomy logo, a timber desk and a sage-green wall.",
    'photos/step-design': "3D design of a white two-storey building with dormer windows in an orange tiled roof, a long balcony and timber gates.",
    'photos/step-build': "Black-and-white photo of a concrete building under construction, wrapped in scaffolding, with workers in hard hats.",
    'photos/step-operate': "Guest with a backpack checking in at a reception counter, served by a smiling staff member, with a beHomy banner behind.",
    'photos/behomy-room-1': "Twin room with two single beds, knitted throws, teal and mustard cushions, a small desk and a mint-and-blue painted wall.",
    'photos/behomy-life': "A young man playing an acoustic guitar on a sofa beside a laughing young woman holding a blue cushion printed with the beHomy logo.",
    'photos/behomy-room-2': "Bedroom with a bed dressed in a navy runner and cushion printed with the beHomy logo, a small desk and a glass-walled shower room.",
    'photos/corvel-room': "Hotel room with a bed in the foreground, a timber desk with a television, and a window looking out over city towers.",
    'photos/corvel-lobby': "Lobby with tan leather sofas, a mirror in an arched niche and a copper wall lettered \"Corvel, Jakarta Pusat, by Behomy\".",
    'photos/purnava-pool': "Private pool with a pink flamingo float beside a villa with a terracotta tiled roof, sun loungers and large tropical leaves.",
    'photos/hoteru-room': "Compact room with a double bed on a curved timber platform lit from beneath, a round mirror and a long shelf with a kettle.",
    'photos/hoteru-stair': "Warmly lit corridor with a timber floor and a stair going down beside a black handrail.",
    'photos/behomy-facade-1': "Building front with an orange timber-fin screen, mint-green walls, tall gridded windows and a beHomy sign near the roof.",
    'photos/behomy-facade-2': "Aerial view of a white multi-storey building with a large orange checkerboard screen and a beHomy sign.",
    'photos/behomy-corridor': "Grey concrete corridor with black mesh railings, numbered room doors and a stair beneath a skylight.",
    'photos/behomy-team': "A large group in matching white T-shirts posing on steps in front of a white villa, holding a banner reading \"Homy Group Goes to Lembang\".",
    'photos/staff-training': "Staff, most in black shirts, standing behind a banner reading \"Staff Training: Front Office & Housekeeping\".",
    'photos/before-after-1-before': "Black-and-white photo of an unfinished narrow concrete-block building with open floors, tangled overhead cables and a car parked at ground level.",
    'photos/before-after-1-after': "Aerial view of a finished narrow building with orange and white panels, standing between older houses on a street.",
    'photos/before-after-2-before': "Black-and-white street view of a row of worn three-storey shophouses, with a man standing in an open doorway and a car parked in front.",
    'photos/before-after-2-after': "Aerial view of a shophouse row where one unit has a blue and yellow facade screen patterned with circles and figure eights, cars parked in front.",
    'photos/before-after-3-before': "Black-and-white street view of a narrow shophouse with a \"for sale\" banner, overhead cables and cars parked in front.",
    'photos/before-after-3-after': "Aerial view of a blue and white corner building on a palm-lined street, beside a row of other shophouses.",
    'photos/before-after-4-before': "Black-and-white street view of a worn shophouse row with shuttered shopfronts and a motorcyclist passing in front.",
    'photos/before-after-4-after': "Renovated shophouse front with a vertical timber-slat screen, a white sign panel with the beHomy logo and a glass entrance.",
  },
};
